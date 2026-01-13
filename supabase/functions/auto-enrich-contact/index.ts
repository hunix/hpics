// Auto-Enrich Contact - Triggered automatically for new/updated contacts
// Orchestrates comprehensive enrichment based on contact priority

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnrichmentConfig as getEnrichmentConfigFromDB, getPlatformConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentConfig {
  sources: string[];
  maxCostCents: number;
  priority: number;
}

async function getEnrichmentConfig(supabase: any, profile: any, userId: string): Promise<EnrichmentConfig> {
  // Fetch platform config for enrichment settings
  const config = await getEnrichmentConfigFromDB(supabase, userId, profile.id);
  
  // VIP contacts get full enrichment
  if (profile.is_favorite || profile.relationship_type === 'client') {
    const vipMaxCost = await getPlatformConfig(supabase, 'enrichment.vip_max_cost_cents', { userId }) || 100;
    return {
      sources: config.linkedinEnabled && config.webSearchEnabled 
        ? ['social_scrape', 'company_research', 'web_search', 'osint']
        : ['web_search'],
      maxCostCents: vipMaxCost,
      priority: 90,
    };
  }
  
  // Important relationships get standard enrichment
  if (['family', 'mentor', 'friend'].includes(profile.relationship_type)) {
    const standardMaxCost = await getPlatformConfig(supabase, 'enrichment.standard_max_cost_cents', { userId }) || 50;
    return {
      sources: config.linkedinEnabled ? ['social_scrape', 'web_search'] : ['web_search'],
      maxCostCents: standardMaxCost,
      priority: 70,
    };
  }
  
  // Standard contacts get basic enrichment
  const basicMaxCost = await getPlatformConfig(supabase, 'enrichment.basic_max_cost_cents', { userId }) || 20;
  return {
    sources: ['web_search'],
    maxCostCents: basicMaxCost,
    priority: 50,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    const { 
      profileId,
      trigger = 'manual', // 'new_profile', 'profile_update', 'scheduled', 'manual'
      forceRefresh = false,
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

    // For service-to-service calls, use service role
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    userId = userId || profile.user_id;
    
    // Ensure userId is valid
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID could not be determined' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if enrichment is needed - using database-driven thresholds
    if (!forceRefresh && profile.last_enriched_at) {
      const hoursSince = (Date.now() - new Date(profile.last_enriched_at).getTime()) / (1000 * 60 * 60);
      
      // Get configurable thresholds from platform config
      const vipThreshold = await getPlatformConfig(supabase, 'intelligence.vip_enrichment_interval_hours', { userId: userId }) || 24;
      const standardThreshold = await getPlatformConfig(supabase, 'intelligence.enrichment_interval_hours', { userId: userId }) || 72;
      
      const threshold = profile.is_favorite ? vipThreshold : standardThreshold;
      if (hoursSince < threshold) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Profile recently enriched, skipping',
          lastEnriched: profile.last_enriched_at,
          nextEnrichmentIn: `${Math.round(threshold - hoursSince)} hours`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get enrichment configuration based on profile importance (now database-driven)
    const config = await getEnrichmentConfig(supabase, profile, userId);

    // Check for existing pending job
    const { data: existingJob } = await supabase
      .from('enrichment_jobs')
      .select('id, status, created_at')
      .eq('profile_id', profileId)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existingJob) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Enrichment already in progress',
        jobId: existingJob.id,
        status: existingJob.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create enrichment job
    const { data: job, error: jobError } = await supabase
      .from('enrichment_jobs')
      .insert({
        user_id: userId,
        profile_id: profileId,
        job_type: 'auto',
        priority: config.priority,
        source_config: {
          trigger,
          sources: config.sources,
          maxCostCents: config.maxCostCents,
        },
        status: 'pending',
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // For immediate triggers, process now; otherwise queue for batch processing
    if (trigger === 'manual' || config.priority >= 80) {
      // Process immediately via orchestrator
      try {
        await supabase.functions.invoke('enrichment-orchestrator', {
          body: {
            profileId,
            sources: config.sources,
            maxCostCents: config.maxCostCents,
            forceRefresh,
          },
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Enrichment completed',
          jobId: job.id,
          processedImmediately: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.warn('Immediate enrichment failed, job queued:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Enrichment job queued',
      jobId: job.id,
      priority: config.priority,
      estimatedWait: config.priority >= 70 ? '< 1 hour' : '< 4 hours',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-enrich error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
