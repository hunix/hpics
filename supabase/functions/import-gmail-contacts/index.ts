import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleContact {
  resourceName: string;
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value: string; type?: string }>;
  phoneNumbers?: Array<{ value: string; type?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  photos?: Array<{ url: string }>;
  addresses?: Array<{ formattedValue?: string; city?: string; country?: string }>;
  birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }>;
  biographies?: Array<{ value: string }>;
  urls?: Array<{ value: string; type?: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get Gmail config
    const { data: config, error: configError } = await supabase
      .from('gmail_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token is expired and refresh if needed
    let accessToken = config.access_token;
    const tokenExpiry = new Date(config.token_expires_at);
    
    if (tokenExpiry < new Date()) {
      // Token expired - would need to refresh
      return new Response(JSON.stringify({ error: "Token expired, please reconnect" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create import session
    const { data: session, error: sessionError } = await supabase
      .from('import_sessions')
      .insert({
        user_id: userId,
        source: 'gmail',
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating import session:', sessionError);
    }

    // Fetch contacts from Google People API
    const personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses,birthdays,biographies,urls';
    const pageSize = 1000;
    let allContacts: GoogleContact[] = [];
    let pageToken = '';

    do {
      const url = `https://people.googleapis.com/v1/people/me/connections?personFields=${personFields}&pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch contacts');
      }

      const data = await response.json();
      allContacts = allContacts.concat(data.connections || []);
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    // Process and import contacts
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contact of allContacts) {
      try {
        const name = contact.names?.[0];
        const email = contact.emailAddresses?.[0]?.value;
        const phone = contact.phoneNumbers?.[0]?.value;
        const org = contact.organizations?.[0];
        const photo = contact.photos?.[0]?.url;
        const address = contact.addresses?.[0];
        const birthday = contact.birthdays?.[0]?.date;
        const bio = contact.biographies?.[0]?.value;

        // Skip if no identifying info
        if (!name?.displayName && !name?.givenName && !email) {
          skipped++;
          continue;
        }

        // Check for existing contact with same email
        if (email) {
          const { data: existing } = await supabase
            .from('contact_methods')
            .select('profile_id, profiles!inner(user_id)')
            .eq('profiles.user_id', userId)
            .eq('contact_type', 'email')
            .eq('value', email)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }
        }

        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            first_name: name?.givenName || name?.displayName?.split(' ')[0] || '',
            last_name: name?.familyName || (name?.displayName?.split(' ').slice(1).join(' ')) || '',
            organization: org?.name || null,
            job_title: org?.title || null,
            avatar_url: photo || null,
            notes: bio || null,
            city: address?.city || null,
            country: address?.country || null,
            birthday: birthday ? `${birthday.year}-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}` : null,
            source: 'gmail_import',
          })
          .select()
          .single();

        if (profileError) {
          errors.push(`Failed to create profile for ${name?.displayName}: ${profileError.message}`);
          continue;
        }

        // Add contact methods
        const contactMethods = [];
        
        for (const emailAddr of contact.emailAddresses || []) {
          contactMethods.push({
            profile_id: profile.id,
            contact_type: 'email',
            value: emailAddr.value,
            label: emailAddr.type || 'personal',
          });
        }

        for (const phoneNum of contact.phoneNumbers || []) {
          contactMethods.push({
            profile_id: profile.id,
            contact_type: 'phone',
            value: phoneNum.value,
            label: phoneNum.type || 'mobile',
          });
        }

        for (const url of contact.urls || []) {
          contactMethods.push({
            profile_id: profile.id,
            contact_type: 'website',
            value: url.value,
            label: url.type || 'website',
          });
        }

        if (contactMethods.length > 0) {
          await supabase.from('contact_methods').insert(contactMethods);
        }

        imported++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing contact: ${message}`);
      }
    }

    // Update import session
    if (session) {
      await supabase
        .from('import_sessions')
        .update({
          status: 'completed',
          total_items: allContacts.length,
          processed_items: allContacts.length,
          imported_items: imported,
          skipped_items: skipped,
          error_count: errors.length,
          errors: errors.slice(0, 50), // Keep first 50 errors
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

    // Update gmail config
    await supabase
      .from('gmail_config')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'completed',
        contacts_synced: imported,
      })
      .eq('user_id', userId);

    return new Response(JSON.stringify({
      success: true,
      total: allContacts.length,
      imported,
      skipped,
      errors: errors.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Import Gmail contacts error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
