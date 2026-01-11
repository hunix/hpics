// Auto-Enrich Contact - Triggered automatically for new/updated contacts
// Orchestrates comprehensive enrichment based on contact priority

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentConfig {
  sources: string[];
  maxCostCents: number;
  priority: number;
}

function getEnrichmentConfig(profile: any): EnrichmentConfig {
  // VIP contacts get full enrichment
  if (profile.is_favorite || profile.relationship_type === 'client') {
    return {
      sources: ['social_scrape', 'company_research', 'web_search', 'osint'],
      maxCostCents: 100,
      priority: 90,
    };
  }
  
  // Important relationships get standard enrichment
  if (['family', 'mentor', 'friend'].includes(profile.relationship_type)) {
    return {
      sources: ['social_scrape', 'web_search'],
      maxCostCents: 50,
      priority: 70,
    };
  }
  
  // Standard contacts get basic enrichment
  return {
    sources: ['web_search'],
    maxCostCents: 20,
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

    // Check if enrichment is needed
    if (!forceRefresh && profile.last_enriched_at) {
      const hoursSince = (Date.now() - new Date(profile.last_enriched_at).getTime()) / (1000 * 60 * 60);
      
      // Skip if recently enriched (VIP: 24h, others: 72h)
      const threshold = profile.is_favorite ? 24 : 72;
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

    // Get enrichment configuration based on profile importance
    const config = getEnrichmentConfig(profile);

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
