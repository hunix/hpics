// Hunter.io - Email Intelligence API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HunterRequest {
  profileId: string;
  mode: 'verify' | 'find' | 'domain_search';
  email?: string;
  firstName?: string;
  lastName?: string;
  domain?: string;
  company?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const HUNTER_API_KEY = Deno.env.get('HUNTER_API_KEY');
    if (!HUNTER_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Hunter.io API key not configured',
        instructions: 'Add HUNTER_API_KEY in Settings → Integrations'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      profileId,
      mode,
      email,
      firstName,
      lastName,
      domain,
      company,
    }: HunterRequest = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    console.log(`Hunter.io ${mode} for profile ${profileId}`);

    const startTime = Date.now();
    let data: any = null;
    let endpoint = '';

    switch (mode) {
      case 'verify': {
        // Email verification - email must be passed in request, not from profile
        const targetEmail = email;
        if (!targetEmail) {
          return new Response(JSON.stringify({ error: 'Email is required for verification - pass email in request body' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        endpoint = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(targetEmail)}&api_key=${HUNTER_API_KEY}`;
        break;
      }

      case 'find': {
        // Find email by name + domain
        const fn = firstName || profile?.first_name;
        const ln = lastName || profile?.last_name;
        const dom = domain || (profile?.organization ? extractDomain(profile.organization) : null);
        
        if (!fn || !ln || !dom) {
          return new Response(JSON.stringify({ 
            error: 'First name, last name, and domain are required for email finder' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        endpoint = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(dom)}&first_name=${encodeURIComponent(fn)}&last_name=${encodeURIComponent(ln)}&api_key=${HUNTER_API_KEY}`;
        break;
      }

      case 'domain_search': {
        // Find all emails at a domain
        const targetDomain = domain || (profile?.organization ? extractDomain(profile.organization) : null);
        if (!targetDomain) {
          return new Response(JSON.stringify({ error: 'Domain is required for domain search' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        endpoint = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(targetDomain)}&api_key=${HUNTER_API_KEY}&limit=10`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch(endpoint);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hunter API error:', response.status, errorText);

      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId,
        function_name: 'enrich-hunter',
        provider: 'hunter',
        model_name: mode,
        estimated_cost_cents: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: errorText,
      });

      return new Response(JSON.stringify({ 
        error: 'Hunter API error',
        status: response.status,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    data = await response.json();

    // Estimated cost (Hunter has limited free tier, then ~$0.05 per request)
    const estimatedCostCents = 5;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'enrich-hunter',
      provider: 'hunter',
      model_name: mode,
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
    });

    // Process results based on mode
    const result: Record<string, any> = {
      success: true,
      mode,
      responseTimeMs: responseTime,
      estimatedCostCents,
    };

    if (mode === 'verify' && data.data) {
      result.email = data.data.email;
      result.status = data.data.status;
      result.score = data.data.score;
      result.isDeliverable = data.data.result === 'deliverable';
      result.isDisposable = data.data.disposable;
      result.isWebmail = data.data.webmail;

      // Update last_enriched_at (email_verified column doesn't exist in profiles)
      await supabase
        .from('profiles')
        .update({
          last_enriched_at: new Date().toISOString(),
        })
        .eq('id', profileId);

    } else if (mode === 'find' && data.data) {
      result.email = data.data.email;
      result.confidence = data.data.score;
      result.firstName = data.data.first_name;
      result.lastName = data.data.last_name;
      result.position = data.data.position;
      result.company = data.data.company;
      result.domain = data.data.domain;

      // Store found email in contact_methods (not profiles.email which doesn't exist)
      if (data.data.email && data.data.score >= 80) {
        // Upsert into contact_methods
        await supabase
          .from('contact_methods')
          .upsert({
            profile_id: profileId,
            user_id: user.id,
            contact_type: 'email',
            value: data.data.email,
            label: 'work',
            is_primary: true,
            metadata: { hunter_confidence: data.data.score, source: 'hunter' },
          }, { onConflict: 'profile_id,contact_type,value' });
        
        await supabase
          .from('profiles')
          .update({ last_enriched_at: new Date().toISOString() })
          .eq('id', profileId);
      }

    } else if (mode === 'domain_search' && data.data) {
      result.domain = data.data.domain;
      result.organization = data.data.organization;
      result.emailCount = data.meta?.results || 0;
      result.emails = data.data.emails?.map((e: any) => ({
        email: e.value,
        type: e.type,
        confidence: e.confidence,
        firstName: e.first_name,
        lastName: e.last_name,
        position: e.position,
        department: e.department,
        linkedIn: e.linkedin,
        twitter: e.twitter,
      })) || [];

      // Store company emails as OSINT finding
      await supabase.from('osint_findings').insert({
        user_id: user.id,
        profile_id: profileId,
        finding_type: 'company_emails',
        source: 'hunter',
        title: `Company Emails: ${data.data.organization || data.data.domain}`,
        content_snippet: `Found ${result.emailCount} emails at ${data.data.domain}`,
        full_content: JSON.stringify(result.emails),
        metadata: {
          domain: data.data.domain,
          organization: data.data.organization,
          emailCount: result.emailCount,
        },
        verification_status: 'verified',
        relevance_score: 0.85,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Hunter.io error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper to extract domain from company name
function extractDomain(company: string): string | null {
  // Simple heuristic - could be enhanced with company->domain mapping API
  const cleaned = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(inc|llc|ltd|corp|company|co)$/g, '');
  return cleaned ? `${cleaned}.com` : null;
}
