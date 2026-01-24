// People Data Labs - Person Enrichment API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDLEnrichRequest {
  profileId: string;
  email?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  minLikelihood?: number;
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

    const PDL_API_KEY = Deno.env.get('PDL_API_KEY');
    if (!PDL_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'People Data Labs API key not configured',
        instructions: 'Add PDL_API_KEY in Settings → Integrations'
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
      email,
      linkedinUrl,
      firstName,
      lastName,
      company,
      minLikelihood = 6,
    }: PDLEnrichRequest = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile if we need more data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    // Build the query params
    const params = new URLSearchParams();
    params.append('min_likelihood', minLikelihood.toString());
    params.append('pretty', 'true');

    // Try different identifiers in priority order
    // Note: profiles table doesn't have email column - only use provided email parameter
    if (email) {
      params.append('email', email);
    } else if (linkedinUrl || profile?.linkedin_url) {
      const url = linkedinUrl || profile.linkedin_url;
      params.append('profile', url);
    } else if ((firstName || profile?.first_name) && (lastName || profile?.last_name)) {
      params.append('first_name', firstName || profile.first_name);
      params.append('last_name', lastName || profile.last_name);
      if (company || profile?.organization) {
        params.append('company', company || profile.organization);
      }
    } else {
      return new Response(JSON.stringify({ 
        error: 'Insufficient data for enrichment. Provide email, LinkedIn URL, or name + company.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`PDL enrichment for profile ${profileId}`);

    const startTime = Date.now();

    const response = await fetch(`https://api.peopledatalabs.com/v5/person/enrich?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': PDL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDL API error:', response.status, errorText);
      
      // Log failed attempt
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId,
        function_name: 'enrich-pdl',
        provider: 'peopledatalabs',
        model_name: 'person-enrichment',
        estimated_cost_cents: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: errorText,
      });

      return new Response(JSON.stringify({ 
        error: 'PDL API error',
        status: response.status,
        details: errorText,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Extract enriched data
    const enrichedData: Record<string, any> = {};
    const pdlData = data.data || data;

    if (pdlData.job_title) enrichedData.job_title = pdlData.job_title;
    if (pdlData.job_company_name) enrichedData.organization = pdlData.job_company_name;
    // Note: industry and bio columns don't exist on profiles table
    // Store summary in notes field instead
    if (pdlData.summary) enrichedData.notes = pdlData.summary;
    if (pdlData.linkedin_url) enrichedData.linkedin_url = pdlData.linkedin_url;
    if (pdlData.twitter_url) enrichedData.twitter_handle = pdlData.twitter_url;
    // Note: location column doesn't exist - use city/country if available
    if (pdlData.location_locality) enrichedData.city = pdlData.location_locality;
    if (pdlData.location_country) enrichedData.country = pdlData.location_country;
    if (pdlData.skills) enrichedData.skills = pdlData.skills;
    if (pdlData.interests) enrichedData.interests = pdlData.interests;
    
    // Experience history
    if (pdlData.experience && Array.isArray(pdlData.experience)) {
      enrichedData.work_history = pdlData.experience.map((exp: any) => ({
        title: exp.title?.name,
        company: exp.company?.name,
        startDate: exp.start_date,
        endDate: exp.end_date,
        isCurrent: exp.is_primary,
      }));
    }

    // Education history
    if (pdlData.education && Array.isArray(pdlData.education)) {
      enrichedData.education_history = pdlData.education.map((edu: any) => ({
        school: edu.school?.name,
        degree: edu.degrees?.join(', '),
        field: edu.majors?.join(', '),
        startDate: edu.start_date,
        endDate: edu.end_date,
      }));
    }

    // Estimated cost (PDL charges ~$0.10-0.50 per enrichment)
    const estimatedCostCents = 30;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'enrich-pdl',
      provider: 'peopledatalabs',
      model_name: 'person-enrichment',
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
      response_metadata: { likelihood: data.likelihood },
    });

    // Update profile with enriched data
    if (Object.keys(enrichedData).length > 0) {
      await supabase
        .from('profiles')
        .update({
          ...enrichedData,
          last_enriched_at: new Date().toISOString(),
        })
        .eq('id', profileId);
    }

    // Store detailed result
    await supabase.from('osint_findings').insert({
      user_id: user.id,
      profile_id: profileId,
      finding_type: 'pdl_enrichment',
      source: 'peopledatalabs',
      title: 'People Data Labs Enrichment',
      content_snippet: `Enriched with ${Object.keys(enrichedData).length} fields`,
      full_content: JSON.stringify(pdlData),
      metadata: {
        likelihood: data.likelihood,
        fieldsEnriched: Object.keys(enrichedData),
      },
      verification_status: 'verified',
      relevance_score: (data.likelihood || 5) / 10,
    });

    return new Response(JSON.stringify({
      success: true,
      enrichedData,
      likelihood: data.likelihood,
      fieldsEnriched: Object.keys(enrichedData).length,
      responseTimeMs: responseTime,
      estimatedCostCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PDL enrichment error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
