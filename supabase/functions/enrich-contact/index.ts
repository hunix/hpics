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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const user = { id: claimsData.claims.sub as string };

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
    let linkedinScrapeFailed = false;

    // If LinkedIn URL is provided, try to scrape it
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

        const scrapeResult = await scrapeResponse.json();
        
        if (scrapeResponse.ok && scrapeResult.success !== false) {
          enrichmentData.linkedinContent = scrapeResult.data?.markdown || scrapeResult.markdown;
          enrichmentData.source = 'linkedin';
          console.log('LinkedIn scrape successful, content length:', enrichmentData.linkedinContent?.length || 0);
        } else {
          linkedinScrapeFailed = true;
          const errorMsg = scrapeResult.error || 'Unknown error';
          console.error('LinkedIn scrape failed:', errorMsg);
          
          // Check if it's a "not supported" error
          if (errorMsg.includes('not currently supported') || errorMsg.includes('enterprise')) {
            enrichmentData.linkedinError = 'LinkedIn scraping requires a Firecrawl Enterprise plan. Falling back to web search.';
          } else {
            enrichmentData.linkedinError = `LinkedIn scrape failed: ${errorMsg}`;
          }
        }
      } catch (e) {
        linkedinScrapeFailed = true;
        console.error('LinkedIn scrape error:', e);
        enrichmentData.linkedinError = 'LinkedIn scrape network error';
      }
    }

    // Always do a web search as primary or fallback
    const personName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const query = searchQuery || 
      `"${personName}" ${profile.organization || ''} ${profile.job_title || ''} professional profile`.trim();
    
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
          limit: 10,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      const searchResult = await searchResponse.json();
      console.log('Search response status:', searchResponse.status);
      
      if (searchResponse.ok && searchResult.success !== false) {
        enrichmentData.searchResults = searchResult.data || [];
        console.log('Search returned', enrichmentData.searchResults.length, 'results');
        
        if (!enrichmentData.source) {
          enrichmentData.source = 'web_search';
        }
      } else {
        console.error('Search failed:', searchResult.error || 'Unknown error');
        enrichmentData.searchError = searchResult.error || 'Search failed';
      }
    } catch (e) {
      console.error('Search error:', e);
      enrichmentData.searchError = 'Search network error';
    }

    // Use AI to extract structured information
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const hasContent = enrichmentData.linkedinContent || (enrichmentData.searchResults?.length > 0);
    
    if (!hasContent) {
      return new Response(JSON.stringify({
        success: false,
        error: linkedinScrapeFailed 
          ? 'LinkedIn scraping is not available on standard Firecrawl plans, and web search found no results. Try using a more specific search query.'
          : 'No content found for this contact. Try providing more details or a different search query.',
        enrichmentData,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'AI API is not configured',
        enrichmentData,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Combine all content for analysis
    let contentToAnalyze = '';
    if (enrichmentData.linkedinContent) {
      contentToAnalyze += `=== LinkedIn Profile ===\n${enrichmentData.linkedinContent}\n\n`;
    }
    if (enrichmentData.searchResults?.length > 0) {
      contentToAnalyze += '=== Web Search Results ===\n';
      for (const result of enrichmentData.searchResults) {
        if (result.markdown || result.description) {
          contentToAnalyze += `Source: ${result.url || 'unknown'}\n`;
          contentToAnalyze += (result.markdown || result.description) + '\n\n';
        }
      }
    }

    console.log('Analyzing content, total length:', contentToAnalyze.length);

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
            content: `You are a data extraction expert. Extract professional information about a person named "${personName}" from web content. Only extract information that clearly relates to this specific person. Be careful not to confuse them with other people who might appear in search results.`,
          },
          {
            role: 'user',
            content: `Extract education, work experience, skills, and certifications from this content. Only include information you're confident belongs to ${personName}:\n\n${contentToAnalyze.substring(0, 15000)}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'AI analysis failed',
        enrichmentData,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response');
      return new Response(JSON.stringify({
        success: false,
        error: 'AI could not extract any information from the content',
        enrichmentData,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    enrichmentData.extracted = extractedData;
    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

    let savedCount = {
      education: 0,
      skills: 0,
      certifications: 0,
      profileFields: 0,
    };

    // Save education data
    if (extractedData.education?.length > 0) {
      for (const edu of extractedData.education) {
        if (!edu.institution_name) continue;
        
        const { error } = await supabaseClient.from('education').insert({
          profile_id: profileId,
          user_id: user.id,
          institution_name: edu.institution_name,
          degree_type: edu.degree_type || null,
          field_of_study: edu.field_of_study || null,
          start_date: edu.start_year ? `${edu.start_year}-01-01` : null,
          end_date: edu.end_year ? `${edu.end_year}-01-01` : null,
        });
        
        if (!error) {
          savedCount.education++;
        } else {
          console.log('Education insert error (might be duplicate):', error.message);
        }
      }
    }

    // Save skills
    if (extractedData.skills?.length > 0) {
      for (const skill of extractedData.skills) {
        if (!skill || typeof skill !== 'string') continue;
        
        const { error } = await supabaseClient.from('contact_skills').insert({
          profile_id: profileId,
          user_id: user.id,
          skill_name: skill.trim(),
        });
        
        if (!error) {
          savedCount.skills++;
        } else {
          console.log('Skill insert error (might be duplicate):', error.message);
        }
      }
    }

    // Save certifications
    if (extractedData.certifications?.length > 0) {
      for (const cert of extractedData.certifications) {
        if (!cert.name) continue;
        
        const { error } = await supabaseClient.from('certifications').insert({
          profile_id: profileId,
          user_id: user.id,
          name: cert.name,
          issuing_organization: cert.issuing_organization || null,
          issue_date: cert.issue_year ? `${cert.issue_year}-01-01` : null,
        });
        
        if (!error) {
          savedCount.certifications++;
        } else {
          console.log('Certification insert error (might be duplicate):', error.message);
        }
      }
    }

    // Update profile with extracted info
    const profileUpdates: any = {};
    if (extractedData.bio && !profile.bio) {
      profileUpdates.bio = extractedData.bio;
      savedCount.profileFields++;
    }
    if (extractedData.job_title && !profile.job_title) {
      profileUpdates.job_title = extractedData.job_title;
      savedCount.profileFields++;
    }
    if (extractedData.organization && !profile.organization) {
      profileUpdates.organization = extractedData.organization;
      savedCount.profileFields++;
    }
    if (linkedinUrl && !profile.linkedin_url) {
      profileUpdates.linkedin_url = linkedinUrl;
      savedCount.profileFields++;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabaseClient.from('profiles').update(profileUpdates).eq('id', profileId);
      if (error) {
        console.error('Profile update error:', error);
      }
    }

    const totalSaved = savedCount.education + savedCount.skills + savedCount.certifications + savedCount.profileFields;
    console.log('Saved counts:', savedCount);

    if (totalSaved === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Found content but could not extract any new information. The contact may already have this data, or the web content did not contain extractable professional information.',
        enrichmentData,
        extractedData,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      enrichmentData,
      savedCount,
      message: `Successfully enriched contact: ${savedCount.education} education entries, ${savedCount.skills} skills, ${savedCount.certifications} certifications, ${savedCount.profileFields} profile fields updated.`,
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
