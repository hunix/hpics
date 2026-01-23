// Enrichment Orchestrator - Coordinates multiple enrichment sources
// Handles deduplication, merge, conflict resolution, and provenance tracking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentSource {
  type: string;
  priority: number;
  trustLevel: number;
  costCents: number;
  requiresSecret?: string;
}

const ENRICHMENT_SOURCES: EnrichmentSource[] = [
  // Tier 1: Highest trust, most complete data
  { type: 'peopledatalabs', priority: 1, trustLevel: 0.95, costCents: 30, requiresSecret: 'PDL_API_KEY' },
  { type: 'proxycurl', priority: 1, trustLevel: 0.92, costCents: 10, requiresSecret: 'PROXYCURL_API_KEY' },
  { type: 'social_scrape', priority: 1, trustLevel: 0.9, costCents: 5 },
  
  // Tier 2: Good data, moderate cost
  { type: 'perplexity', priority: 2, trustLevel: 0.90, costCents: 5, requiresSecret: 'PERPLEXITY_API_KEY' },
  { type: 'company_research', priority: 2, trustLevel: 0.85, costCents: 10 },
  { type: 'diffbot', priority: 2, trustLevel: 0.88, costCents: 10, requiresSecret: 'DIFFBOT_API_KEY' },
  
  // Tier 3: Supplementary data
  { type: 'hunter', priority: 3, trustLevel: 0.85, costCents: 5, requiresSecret: 'HUNTER_API_KEY' },
  { type: 'tavily', priority: 3, trustLevel: 0.80, costCents: 1, requiresSecret: 'TAVILY_API_KEY' },
  { type: 'web_search', priority: 3, trustLevel: 0.7, costCents: 8 },
  
  // Tier 4: Social and news
  { type: 'rapidapi_social', priority: 4, trustLevel: 0.75, costCents: 3, requiresSecret: 'RAPIDAPI_KEY' },
  { type: 'osint', priority: 4, trustLevel: 0.75, costCents: 15 },
  
  // Tier 5: General web data
  { type: 'firecrawl', priority: 5, trustLevel: 0.8, costCents: 5, requiresSecret: 'FIRECRAWL_API_KEY' },
  { type: 'news_api', priority: 6, trustLevel: 0.70, costCents: 0, requiresSecret: 'NEWS_API_KEY' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'enrichment-orchestrator', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      profileId, 
      sources = ['social_scrape', 'web_search'],
      forceRefresh = false,
      maxCostCents = 50,
      depth = 'standard', // 'quick', 'standard', 'deep'
    } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID required' }), {
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

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
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

    // Check data freshness if not forcing refresh
    if (!forceRefresh) {
      const lastEnriched = profile.last_enriched_at;
      if (lastEnriched) {
        const hoursSince = (Date.now() - new Date(lastEnriched).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) {
          return new Response(JSON.stringify({
            success: true,
            message: 'Data is still fresh',
            lastEnriched,
            skipped: true,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Determine which sources to use based on depth and available data
    const availableSources = await selectOptimalSources(profile, sources, depth, maxCostCents);

    // Create orchestration job
    const { data: job } = await supabase
      .from('enrichment_jobs')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        job_type: 'orchestrated',
        priority: profile.is_favorite ? 90 : 50,
        source_config: { sources: availableSources, maxCostCents, forceRefresh, depth },
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const jobId = job?.id;
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};
    let totalCost = 0;

    // Run enrichment sources in priority order
    const sortedSources = availableSources
      .map((s: string) => ENRICHMENT_SOURCES.find(es => es.type === s))
      .filter(Boolean)
      .sort((a: any, b: any) => a.priority - b.priority);

    for (const source of sortedSources) {
      if (!source) continue;
      if (totalCost >= maxCostCents) break;

      // Check if required secret is available
      if (source.requiresSecret) {
        const secretValue = Deno.env.get(source.requiresSecret);
        if (!secretValue) {
          console.log(`Skipping ${source.type}: missing ${source.requiresSecret}`);
          continue;
        }
      }

      try {
        let enrichmentResult: any = null;

        switch (source.type) {
          case 'peopledatalabs':
            if (profile.email || profile.linkedin_url) {
              const response = await supabase.functions.invoke('enrich-pdl', {
                body: { profileId, email: profile.email, linkedinUrl: profile.linkedin_url },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'proxycurl':
            if (profile.linkedin_url) {
              const response = await supabase.functions.invoke('scrape-linkedin-proxycurl', {
                body: { profileId, linkedinUrl: profile.linkedin_url },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'perplexity':
            const searchName = `${profile.first_name} ${profile.last_name} ${profile.organization || ''}`.trim();
            const perplexityResponse = await supabase.functions.invoke('perplexity-search', {
              body: { 
                profileId,
                query: `Professional background and recent news about ${searchName}`,
                searchType: 'person_research',
              },
            });
            if (!perplexityResponse.error) {
              enrichmentResult = perplexityResponse.data;
              totalCost += source.costCents;
            }
            break;

          case 'hunter':
            if (profile.email || (profile.first_name && profile.organization)) {
              const response = await supabase.functions.invoke('enrich-hunter', {
                body: { 
                  profileId, 
                  email: profile.email,
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  domain: profile.organization,
                },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'rapidapi_social':
            const handles = [profile.twitter_url, profile.instagram_url, profile.tiktok_url].filter(Boolean);
            if (handles.length > 0) {
              const response = await supabase.functions.invoke('scrape-social-rapidapi', {
                body: { profileId, handles },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'diffbot':
            if (profile.organization) {
              const response = await supabase.functions.invoke('extract-diffbot', {
                body: { profileId, query: `${profile.first_name} ${profile.last_name} ${profile.organization}` },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'tavily':
            const tavilyQuery = `${profile.first_name} ${profile.last_name} ${profile.organization || ''}`.trim();
            const tavilyResponse = await supabase.functions.invoke('search-tavily', {
              body: { profileId, query: tavilyQuery, searchDepth: 'advanced' },
            });
            if (!tavilyResponse.error) {
              enrichmentResult = tavilyResponse.data;
              totalCost += source.costCents;
            }
            break;

          case 'news_api':
            const newsQuery = `"${profile.first_name} ${profile.last_name}"`;
            const newsResponse = await supabase.functions.invoke('search-news', {
              body: { profileId, query: newsQuery, searchType: 'everything' },
            });
            if (!newsResponse.error) {
              enrichmentResult = newsResponse.data;
              totalCost += source.costCents;
            }
            break;

          case 'social_scrape':
            if (profile.linkedin_url || profile.email) {
              const response = await supabase.functions.invoke('scrape-social-profile', {
                body: {
                  profileId,
                  platform: profile.linkedin_url ? 'linkedin' : 'auto',
                  url: profile.linkedin_url,
                  email: profile.email,
                },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'company_research':
            if (profile.organization) {
              const response = await supabase.functions.invoke('enrich-contact', {
                body: {
                  profileId,
                  enrichmentType: 'company',
                  companyName: profile.organization,
                },
              });
              if (!response.error) {
                enrichmentResult = response.data;
                totalCost += source.costCents;
              }
            }
            break;

          case 'web_search':
            const searchQuery = `${profile.first_name} ${profile.last_name} ${profile.organization || ''}`.trim();
            const response = await supabase.functions.invoke('enrich-contact', {
              body: {
                profileId,
                enrichmentType: 'web_search',
                searchQuery,
              },
            });
            if (!response.error) {
              enrichmentResult = response.data;
              totalCost += source.costCents;
            }
            break;

          case 'osint':
            const osintResponse = await supabase.functions.invoke('osint-scan', {
              body: { profileId, depth: 'standard' },
            });
            if (!osintResponse.error) {
              enrichmentResult = osintResponse.data;
              totalCost += source.costCents;
            }
            break;

          case 'firecrawl':
            if (profile.organization) {
              const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
              if (firecrawlKey) {
                try {
                  const fcResponse = await fetch('https://api.firecrawl.dev/v1/search', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${firecrawlKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      query: `${profile.first_name} ${profile.last_name} ${profile.organization}`,
                      limit: 5,
                    }),
                  });
                  if (fcResponse.ok) {
                    enrichmentResult = await fcResponse.json();
                    totalCost += source.costCents;
                  }
                } catch (e) {
                  console.warn('Firecrawl failed:', e);
                }
              }
            }
            break;
        }

        if (enrichmentResult) {
          results[source.type] = {
            data: enrichmentResult,
            trustLevel: source.trustLevel,
            fetchedAt: new Date().toISOString(),
            costCents: source.costCents,
          };
        }
      } catch (err) {
        errors[source.type] = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Merge results with conflict resolution
    const mergedData = await mergeEnrichmentResults(supabase, user.id, profileId, results);

    // Update profile with merged data (excluding enrichment_sources which doesn't exist)
    if (Object.keys(mergedData).length > 0) {
      const { enrichment_provenance, ...profileUpdates } = mergedData;
      await supabase
        .from('profiles')
        .update({
          ...profileUpdates,
          last_enriched_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      // Store provenance separately if needed
      if (enrichment_provenance) {
        await supabase
          .from('app_settings')
          .upsert({
            user_id: user.id,
            setting_key: `enrichment_provenance_${profileId}`,
            setting_value: JSON.stringify(enrichment_provenance),
            metadata: { sources: Object.keys(results), totalCost },
          }, { onConflict: 'user_id,setting_key' });
      }
    }

    // Update job status
    await supabase
      .from('enrichment_jobs')
      .update({
        status: Object.keys(errors).length > 0 ? 'completed_with_errors' : 'completed',
        result: { merged: mergedData, sources: results, errors },
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - new Date(job?.started_at || Date.now()).getTime(),
        cost_cents: totalCost,
      })
      .eq('id', jobId);

    return new Response(JSON.stringify({
      success: true,
      jobId,
      merged: mergedData,
      sourcesProcessed: Object.keys(results).length,
      sourcesAttempted: sortedSources.length,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      totalCostCents: totalCost,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enrichment orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function selectOptimalSources(
  profile: any,
  requestedSources: string[],
  depth: string,
  maxCostCents: number
): Promise<string[]> {
  const selected: string[] = [];
  let estimatedCost = 0;

  // Determine source priority based on available data
  const hasEmail = !!profile.email;
  const hasLinkedIn = !!profile.linkedin_url;
  const hasCompany = !!profile.organization;
  const hasSocialHandles = !!(profile.twitter_url || profile.instagram_url || profile.tiktok_url);

  // Source recommendations based on available data
  const recommendations: Record<string, string[]> = {
    quick: ['social_scrape', 'perplexity'],
    standard: ['peopledatalabs', 'proxycurl', 'perplexity', 'hunter', 'social_scrape'],
    deep: ['peopledatalabs', 'proxycurl', 'perplexity', 'hunter', 'diffbot', 'tavily', 'rapidapi_social', 'news_api', 'osint'],
  };

  const sourcesToConsider = requestedSources.length > 0 
    ? requestedSources 
    : recommendations[depth] || recommendations.standard;

  for (const sourceType of sourcesToConsider) {
    const sourceConfig = ENRICHMENT_SOURCES.find(s => s.type === sourceType);
    if (!sourceConfig) continue;
    if (estimatedCost + sourceConfig.costCents > maxCostCents) continue;

    // Check if source is relevant for this profile
    let isRelevant = true;
    switch (sourceType) {
      case 'peopledatalabs':
      case 'hunter':
        isRelevant = hasEmail || hasLinkedIn;
        break;
      case 'proxycurl':
        isRelevant = hasLinkedIn;
        break;
      case 'rapidapi_social':
        isRelevant = hasSocialHandles;
        break;
      case 'company_research':
      case 'diffbot':
      case 'firecrawl':
        isRelevant = hasCompany;
        break;
    }

    if (isRelevant) {
      selected.push(sourceType);
      estimatedCost += sourceConfig.costCents;
    }
  }

  return selected;
}

async function mergeEnrichmentResults(
  supabase: any,
  userId: string,
  profileId: string,
  results: Record<string, any>
): Promise<Record<string, any>> {
  const merged: Record<string, any> = {};
  const provenance: Record<string, { source: string; confidence: number; fetchedAt: string }> = {};

  // Fields to potentially merge with their source priority
  const fieldPriority: Record<string, string[]> = {
    job_title: ['peopledatalabs', 'proxycurl', 'social_scrape', 'company_research', 'perplexity', 'web_search'],
    organization: ['peopledatalabs', 'proxycurl', 'social_scrape', 'company_research', 'hunter', 'web_search'],
    bio: ['proxycurl', 'social_scrape', 'perplexity', 'web_search'],
    linkedin_url: ['proxycurl', 'peopledatalabs', 'social_scrape', 'osint'],
    email: ['hunter', 'peopledatalabs', 'social_scrape'],
    phone: ['peopledatalabs', 'hunter'],
    interests: ['social_scrape', 'perplexity', 'diffbot', 'web_search'],
    skills: ['proxycurl', 'peopledatalabs', 'social_scrape', 'web_search'],
    location: ['peopledatalabs', 'proxycurl', 'social_scrape'],
    website: ['hunter', 'diffbot', 'firecrawl'],
  };

  for (const [field, sourcePriority] of Object.entries(fieldPriority)) {
    for (const source of sourcePriority) {
      const sourceResult = results[source];
      if (sourceResult?.data?.[field]) {
        const value = sourceResult.data[field];
        
        // Only update if we have a value and higher trust
        if (value && (!merged[field] || sourceResult.trustLevel > (provenance[field]?.confidence || 0))) {
          merged[field] = value;
          provenance[field] = {
            source,
            confidence: sourceResult.trustLevel,
            fetchedAt: sourceResult.fetchedAt,
          };
        }
      }
    }
  }

  // Special handling for arrays (interests, skills) - merge instead of replace
  const arrayFields = ['interests', 'skills'];
  for (const field of arrayFields) {
    const allValues = new Set<string>();
    
    for (const [source, sourceResult] of Object.entries(results)) {
      const values = (sourceResult as any)?.data?.[field];
      if (Array.isArray(values)) {
        values.forEach((v: string) => allValues.add(v.toLowerCase()));
      }
    }
    
    if (allValues.size > 0) {
      merged[field] = Array.from(allValues);
    }
  }

  // Store provenance for transparency
  merged.enrichment_provenance = provenance;

  return merged;
}
