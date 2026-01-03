import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, linkedinUrl, searchQuery } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Firecrawl is not configured. Please connect Firecrawl in Settings.',
        requiresSetup: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let enrichmentData: any = {};

    // If LinkedIn URL is provided, scrape it
    if (linkedinUrl || profile.linkedin_url) {
      const urlToScrape = linkedinUrl || profile.linkedin_url;
      console.log('Scraping LinkedIn profile:', urlToScrape);

      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: urlToScrape,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          enrichmentData.linkedinContent = scrapeData.data?.markdown || scrapeData.markdown;
          enrichmentData.source = 'linkedin';
        } else {
          console.error('LinkedIn scrape failed:', await scrapeResponse.text());
        }
      } catch (e) {
        console.error('LinkedIn scrape error:', e);
      }
    }

    // If no LinkedIn, search for the person
    if (!enrichmentData.linkedinContent && (searchQuery || profile.first_name)) {
      const query = searchQuery || `${profile.first_name} ${profile.last_name || ''} ${profile.organization || ''}`.trim();
      console.log('Searching for:', query);

      try {
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            limit: 5,
            scrapeOptions: {
              formats: ['markdown'],
            },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          enrichmentData.searchResults = searchData.data || [];
          enrichmentData.source = 'web_search';
        } else {
          console.error('Search failed:', await searchResponse.text());
        }
      } catch (e) {
        console.error('Search error:', e);
      }
    }

    // Use AI to extract structured information
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY && (enrichmentData.linkedinContent || enrichmentData.searchResults?.length > 0)) {
      const contentToAnalyze = enrichmentData.linkedinContent || 
        enrichmentData.searchResults?.map((r: any) => r.markdown || r.description).join('\n\n');

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a data extraction expert. Extract professional information from web content about a person named ${profile.first_name} ${profile.last_name || ''}.`,
            },
            {
              role: 'user',
              content: `Extract education, work experience, skills, and certifications from this content:\n\n${contentToAnalyze?.substring(0, 10000)}`,
            },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'extract_profile_data',
              description: 'Extract structured profile data from web content',
              parameters: {
                type: 'object',
                properties: {
                  education: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        institution_name: { type: 'string' },
                        degree_type: { type: 'string' },
                        field_of_study: { type: 'string' },
                        start_year: { type: 'string' },
                        end_year: { type: 'string' },
                      },
                    },
                  },
                  skills: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  certifications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        issuing_organization: { type: 'string' },
                        issue_year: { type: 'string' },
                      },
                    },
                  },
                  bio: { type: 'string' },
                  job_title: { type: 'string' },
                  organization: { type: 'string' },
                },
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'extract_profile_data' } },
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall?.function?.arguments) {
          const extractedData = JSON.parse(toolCall.function.arguments);
          enrichmentData.extracted = extractedData;

          // Save education data
          if (extractedData.education?.length > 0) {
            for (const edu of extractedData.education) {
              await supabaseClient.from('education').upsert({
                profile_id: profileId,
                user_id: user.id,
                institution_name: edu.institution_name,
                degree_type: edu.degree_type,
                field_of_study: edu.field_of_study,
                start_date: edu.start_year ? `${edu.start_year}-01-01` : null,
                end_date: edu.end_year ? `${edu.end_year}-01-01` : null,
              }, {
                onConflict: 'profile_id,institution_name',
                ignoreDuplicates: true,
              });
            }
          }

          // Save skills
          if (extractedData.skills?.length > 0) {
            for (const skill of extractedData.skills) {
              await supabaseClient.from('contact_skills').upsert({
                profile_id: profileId,
                user_id: user.id,
                skill_name: skill,
              }, {
                onConflict: 'profile_id,skill_name',
                ignoreDuplicates: true,
              });
            }
          }

          // Save certifications
          if (extractedData.certifications?.length > 0) {
            for (const cert of extractedData.certifications) {
              await supabaseClient.from('certifications').upsert({
                profile_id: profileId,
                user_id: user.id,
                name: cert.name,
                issuing_organization: cert.issuing_organization,
                issue_date: cert.issue_year ? `${cert.issue_year}-01-01` : null,
              }, {
                onConflict: 'profile_id,name',
                ignoreDuplicates: true,
              });
            }
          }

          // Update profile with extracted info
          const profileUpdates: any = {};
          if (extractedData.bio && !profile.bio) profileUpdates.bio = extractedData.bio;
          if (extractedData.job_title && !profile.job_title) profileUpdates.job_title = extractedData.job_title;
          if (extractedData.organization && !profile.organization) profileUpdates.organization = extractedData.organization;
          if (linkedinUrl && !profile.linkedin_url) profileUpdates.linkedin_url = linkedinUrl;

          if (Object.keys(profileUpdates).length > 0) {
            await supabaseClient.from('profiles').update(profileUpdates).eq('id', profileId);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      enrichmentData,
      message: 'Contact enriched successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-contact:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
