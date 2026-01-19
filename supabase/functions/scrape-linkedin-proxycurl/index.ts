// Proxycurl - LinkedIn Intelligence API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxycurlRequest {
  profileId: string;
  linkedinUrl?: string;
  email?: string;
  includeSkills?: boolean;
  includeExperience?: boolean;
  includeEducation?: boolean;
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

    const PROXYCURL_API_KEY = Deno.env.get('PROXYCURL_API_KEY');
    if (!PROXYCURL_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Proxycurl API key not configured',
        instructions: 'Add PROXYCURL_API_KEY in Settings → Integrations'
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
      linkedinUrl,
      email,
      includeSkills = true,
      includeExperience = true,
      includeEducation = true,
    }: ProxycurlRequest = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile if we need the LinkedIn URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    const targetUrl = linkedinUrl || profile?.linkedin_url;

    if (!targetUrl && !email) {
      return new Response(JSON.stringify({ 
        error: 'LinkedIn URL or email is required for Proxycurl lookup' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Proxycurl lookup for profile ${profileId}`);

    const startTime = Date.now();
    let data: any = null;

    // Try LinkedIn URL first, then email lookup
    if (targetUrl) {
      const params = new URLSearchParams({
        url: targetUrl,
        fallback_to_cache: 'on-error',
        use_cache: 'if-present',
        skills: includeSkills ? 'include' : 'exclude',
        inferred_salary: 'exclude',
        personal_email: 'include',
        personal_contact_number: 'include',
      });

      const response = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROXYCURL_API_KEY}`,
        },
      });

      if (response.ok) {
        data = await response.json();
      } else {
        console.warn('Proxycurl LinkedIn lookup failed:', response.status);
      }
    }

    // Try reverse email lookup if no LinkedIn URL or it failed
    if (!data && (email || profile?.email)) {
      const emailToLookup = email || profile.email;
      const params = new URLSearchParams({
        email: emailToLookup,
        lookup_depth: 'superficial',
        enrich_profile: 'enrich',
      });

      const response = await fetch(`https://nubela.co/proxycurl/api/linkedin/profile/resolve/email?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROXYCURL_API_KEY}`,
        },
      });

      if (response.ok) {
        data = await response.json();
      }
    }

    const responseTime = Date.now() - startTime;

    if (!data) {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        profile_id: profileId,
        function_name: 'scrape-linkedin-proxycurl',
        provider: 'proxycurl',
        model_name: 'linkedin-profile',
        estimated_cost_cents: 1,
        response_time_ms: responseTime,
        status: 'error',
        error_message: 'No data found',
      });

      return new Response(JSON.stringify({ 
        error: 'No LinkedIn data found for this profile' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract enriched data
    const enrichedData: Record<string, any> = {};

    if (data.full_name) {
      const nameParts = data.full_name.split(' ');
      enrichedData.first_name = nameParts[0];
      enrichedData.last_name = nameParts.slice(1).join(' ');
    }
    if (data.headline) enrichedData.job_title = data.headline;
    if (data.summary) enrichedData.bio = data.summary;
    if (data.occupation) enrichedData.job_title = enrichedData.job_title || data.occupation;
    if (data.public_identifier) {
      enrichedData.linkedin_url = `https://linkedin.com/in/${data.public_identifier}`;
    }
    if (data.city && data.country) {
      enrichedData.location = `${data.city}, ${data.country}`;
    }
    if (data.profile_pic_url) enrichedData.avatar_url = data.profile_pic_url;

    // Skills
    if (data.skills && Array.isArray(data.skills)) {
      enrichedData.skills = data.skills;
    }

    // Interests from activities/recommendations
    if (data.interests) {
      enrichedData.interests = data.interests;
    }

    // Experience
    if (includeExperience && data.experiences && Array.isArray(data.experiences)) {
      enrichedData.work_history = data.experiences.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        companyLinkedIn: exp.company_linkedin_profile_url,
        location: exp.location,
        startDate: exp.starts_at ? `${exp.starts_at.year}-${exp.starts_at.month || 1}` : null,
        endDate: exp.ends_at ? `${exp.ends_at.year}-${exp.ends_at.month || 1}` : null,
        description: exp.description,
        isCurrent: !exp.ends_at,
      }));

      // Set current organization from most recent experience
      const currentJob = data.experiences.find((e: any) => !e.ends_at);
      if (currentJob) {
        enrichedData.organization = currentJob.company;
        enrichedData.job_title = currentJob.title;
      }
    }

    // Education
    if (includeEducation && data.education && Array.isArray(data.education)) {
      enrichedData.education_history = data.education.map((edu: any) => ({
        school: edu.school,
        schoolLinkedIn: edu.school_linkedin_profile_url,
        degree: edu.degree_name,
        field: edu.field_of_study,
        startDate: edu.starts_at ? `${edu.starts_at.year}` : null,
        endDate: edu.ends_at ? `${edu.ends_at.year}` : null,
        activities: edu.activities_and_societies,
      }));
    }

    // Estimated cost (Proxycurl charges ~1 credit = ~$0.10 per profile)
    const estimatedCostCents = 10;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'scrape-linkedin-proxycurl',
      provider: 'proxycurl',
      model_name: 'linkedin-profile',
      estimated_cost_cents: estimatedCostCents,
      response_time_ms: responseTime,
      status: 'success',
    });

    // Update profile with enriched data
    if (Object.keys(enrichedData).length > 0) {
      const { work_history, education_history, ...profileFields } = enrichedData;
      
      await supabase
        .from('profiles')
        .update({
          ...profileFields,
          last_enriched_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      // Store work history in experiences table if exists
      if (work_history && work_history.length > 0) {
        for (const job of work_history) {
          try {
            await supabase.from('experiences').upsert({
              profile_id: profileId,
              user_id: user.id,
              title: job.title,
              company: job.company,
              location: job.location,
              start_date: job.startDate,
              end_date: job.endDate,
              description: job.description,
              is_current: job.isCurrent,
            }, { onConflict: 'profile_id,title,company' });
          } catch {}
        }
      }

      // Store education in education table if exists
      if (education_history && education_history.length > 0) {
        for (const edu of education_history) {
          try {
            await supabase.from('education').upsert({
              profile_id: profileId,
              user_id: user.id,
              school: edu.school,
              degree: edu.degree,
              field_of_study: edu.field,
              start_date: edu.startDate,
              end_date: edu.endDate,
            }, { onConflict: 'profile_id,school,degree' });
          } catch {}
        }
      }
    }

    // Store as OSINT finding
    await supabase.from('osint_findings').insert({
      user_id: user.id,
      profile_id: profileId,
      finding_type: 'linkedin_profile',
      source: 'proxycurl',
      title: 'LinkedIn Profile Data',
      content_snippet: data.headline || data.summary?.substring(0, 200) || 'Profile data extracted',
      full_content: JSON.stringify(data),
      source_url: enrichedData.linkedin_url,
      metadata: {
        fieldsEnriched: Object.keys(enrichedData),
        experienceCount: data.experiences?.length || 0,
        educationCount: data.education?.length || 0,
        skillsCount: data.skills?.length || 0,
      },
      verification_status: 'verified',
      relevance_score: 0.95,
    });

    return new Response(JSON.stringify({
      success: true,
      enrichedData,
      fieldsEnriched: Object.keys(enrichedData).length,
      experienceCount: data.experiences?.length || 0,
      educationCount: data.education?.length || 0,
      skillsCount: data.skills?.length || 0,
      responseTimeMs: responseTime,
      estimatedCostCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proxycurl error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
