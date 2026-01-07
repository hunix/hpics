import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutlookContact {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{ address: string; name?: string }>;
  mobilePhone?: string;
  businessPhones?: string[];
  homePhones?: string[];
  companyName?: string;
  jobTitle?: string;
  businessAddress?: { city?: string; countryOrRegion?: string; street?: string };
  homeAddress?: { city?: string; countryOrRegion?: string; street?: string };
  birthday?: string;
  personalNotes?: string;
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

    // Get Outlook config from oauth_tokens
    const { data: config, error: configError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'outlook')
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Outlook not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = config.access_token;

    // Create import session
    const { data: session } = await supabase
      .from('import_sessions')
      .insert({
        user_id: userId,
        source: 'outlook',
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Fetch contacts from Microsoft Graph API
    let allContacts: OutlookContact[] = [];
    let nextLink = 'https://graph.microsoft.com/v1.0/me/contacts?$top=100';

    while (nextLink) {
      const response = await fetch(nextLink, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Microsoft Graph API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch contacts');
      }

      const data = await response.json();
      allContacts = allContacts.concat(data.value || []);
      nextLink = data['@odata.nextLink'] || '';
    }

    // Process and import contacts
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contact of allContacts) {
      try {
        const email = contact.emailAddresses?.[0]?.address;

        // Skip if no identifying info
        if (!contact.displayName && !contact.givenName && !email) {
          skipped++;
          continue;
        }

        // Check for existing contact with same email
        if (email) {
          const { data: existing } = await supabase
            .from('contact_methods')
            .select('profile_id')
            .eq('user_id', userId)
            .eq('type', 'email')
            .eq('value', email)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }
        }

        const address = contact.businessAddress || contact.homeAddress;

        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            first_name: contact.givenName || contact.displayName?.split(' ')[0] || '',
            last_name: contact.surname || (contact.displayName?.split(' ').slice(1).join(' ')) || '',
            organization: contact.companyName || null,
            title: contact.jobTitle || null,
            bio: contact.personalNotes || null,
            city: address?.city || null,
            country: address?.countryOrRegion || null,
            birthday: contact.birthday ? contact.birthday.split('T')[0] : null,
            source: 'outlook_import',
          })
          .select()
          .single();

        if (profileError) {
          errors.push(`Failed to create profile for ${contact.displayName}: ${profileError.message}`);
          continue;
        }

        // Add contact methods
        const contactMethods = [];
        
        for (const emailAddr of contact.emailAddresses || []) {
          contactMethods.push({
            user_id: userId,
            profile_id: profile.id,
            type: 'email',
            value: emailAddr.address,
            label: 'work',
          });
        }

        if (contact.mobilePhone) {
          contactMethods.push({
            user_id: userId,
            profile_id: profile.id,
            type: 'phone',
            value: contact.mobilePhone,
            label: 'mobile',
          });
        }

        for (const phone of contact.businessPhones || []) {
          contactMethods.push({
            user_id: userId,
            profile_id: profile.id,
            type: 'phone',
            value: phone,
            label: 'work',
          });
        }

        for (const phone of contact.homePhones || []) {
          contactMethods.push({
            user_id: userId,
            profile_id: profile.id,
            type: 'phone',
            value: phone,
            label: 'home',
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
          errors: errors.slice(0, 50),
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    }

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
    console.error('Import Outlook contacts error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
