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
  type: 'web_search' | 'social_scrape' | 'company_research' | 'osint' | 'firecrawl';
  priority: number;
  trustLevel: number;
}

const ENRICHMENT_SOURCES: EnrichmentSource[] = [
  { type: 'social_scrape', priority: 1, trustLevel: 0.9 },
  { type: 'company_research', priority: 2, trustLevel: 0.85 },
  { type: 'web_search', priority: 3, trustLevel: 0.7 },
  { type: 'osint', priority: 4, trustLevel: 0.75 },
  { type: 'firecrawl', priority: 5, trustLevel: 0.8 },
];

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

    const { 
      profileId, 
      sources = ['social_scrape', 'web_search'],
      forceRefresh = false,
      maxCostCents = 50,
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

    // Create orchestration job
    const { data: job } = await supabase
      .from('enrichment_jobs')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        job_type: 'orchestrated',
        priority: profile.is_favorite ? 90 : 50,
        source_config: { sources, maxCostCents, forceRefresh },
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
    const sortedSources = sources
      .map((s: string) => ENRICHMENT_SOURCES.find(es => es.type === s))
      .filter(Boolean)
      .sort((a: any, b: any) => a.priority - b.priority);

    for (const source of sortedSources) {
      if (!source) continue;
      if (totalCost >= maxCostCents) break;

      try {
        let enrichmentResult: any = null;

        switch (source.type) {
          case 'social_scrape':
            // Use existing social profile scraper
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
                totalCost += 5;
              }
            }
            break;

          case 'company_research':
            // Research company if org is known
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
                totalCost += 10;
              }
            }
            break;

          case 'web_search':
            // General web search for the person
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
              totalCost += 8;
            }
            break;

          case 'osint':
            // OSINT scan
            const osintResponse = await supabase.functions.invoke('osint-scan', {
              body: { profileId, depth: 'standard' },
            });
            if (!osintResponse.error) {
              enrichmentResult = osintResponse.data;
              totalCost += 15;
            }
            break;

          case 'firecrawl':
            // Use Firecrawl for company website
            if (profile.organization) {
              // Check if Firecrawl is available
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
                    totalCost += 5;
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
          };
        }
      } catch (err) {
        errors[source.type] = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Merge results with conflict resolution
    const mergedData = await mergeEnrichmentResults(supabase, user.id, profileId, results);

    // Update profile with merged data
    if (Object.keys(mergedData).length > 0) {
      await supabase
        .from('profiles')
        .update({
          ...mergedData,
          last_enriched_at: new Date().toISOString(),
          enrichment_sources: Object.keys(results),
        })
        .eq('id', profileId);
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

async function mergeEnrichmentResults(
  supabase: any,
  userId: string,
  profileId: string,
  results: Record<string, any>
): Promise<Record<string, any>> {
  const merged: Record<string, any> = {};
  const provenance: Record<string, { source: string; confidence: number; fetchedAt: string }> = {};

  // Fields to potentially merge
  const fieldPriority: Record<string, string[]> = {
    job_title: ['social_scrape', 'company_research', 'web_search'],
    organization: ['social_scrape', 'company_research', 'web_search'],
    bio: ['social_scrape', 'web_search'],
    linkedin_url: ['social_scrape', 'osint'],
    interests: ['social_scrape', 'web_search'],
    skills: ['social_scrape', 'web_search'],
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
