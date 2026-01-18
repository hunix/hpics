import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  userId: string;
  action: 'analyze_new_media' | 'aggregate_intelligence' | 'refresh_dossiers' | 'detect_anomalies' | 'cascade_analysis' | 'full_sweep';
  profileId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  options?: {
    forceReanalysis?: boolean;
    maxItems?: number;
    costLimit?: number;
  };
}

interface IntelligenceTask {
  type: string;
  profileId?: string;
  priority: number;
  estimatedCost: number;
  dependencies?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { 
      userId, 
      action, 
      profileId,
      priority = 'normal',
      options = {}
    } = await req.json() as OrchestrationRequest;

    console.log(`Autonomous orchestrator: ${action} for user ${userId}, priority: ${priority}`);

    const results: any = {
      action,
      tasksExecuted: [],
      tasksSkipped: [],
      totalCost: 0,
      startedAt: new Date().toISOString(),
    };

    // Priority multipliers for task ordering
    const priorityWeights: Record<string, number> = {
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    switch (action) {
      case 'analyze_new_media': {
        // Find unanalyzed or partially analyzed media
        let query = supabase
          .from('media')
          .select('id, profile_id, media_type, completed_analysis_modes, created_at')
          .eq('user_id', userId)
          .or('ai_metadata.is.null,completed_analysis_modes.is.null')
          .order('created_at', { ascending: false })
          .limit(options.maxItems || 50);

        if (profileId) {
          query = query.eq('profile_id', profileId);
        }

        const { data: unanalyzedMedia } = await query;

        if (unanalyzedMedia && unanalyzedMedia.length > 0) {
          console.log(`Found ${unanalyzedMedia.length} media items needing analysis`);
          
          // Group by profile for efficient processing
          const byProfile: Record<string, typeof unanalyzedMedia> = {};
          unanalyzedMedia.forEach(m => {
            if (!byProfile[m.profile_id]) byProfile[m.profile_id] = [];
            byProfile[m.profile_id].push(m);
          });

          // Queue analysis tasks
          for (const [profId, mediaItems] of Object.entries(byProfile)) {
            results.tasksExecuted.push({
              type: 'media_analysis_queue',
              profileId: profId,
              count: mediaItems.length,
              mediaIds: mediaItems.map(m => m.id),
            });
          }

          // Record orchestration execution
          await supabase.from('agent_executions').insert({
            user_id: userId,
            agent_type: 'autonomous_orchestrator',
            action_taken: 'analyze_new_media',
            action_params: { mediaCount: unanalyzedMedia.length, profiles: Object.keys(byProfile) },
            trigger_reason: 'Unanalyzed media detected',
            outcome: 'queued',
            executed_at: new Date().toISOString(),
          });
        } else {
          results.tasksSkipped.push({ type: 'analyze_new_media', reason: 'No unanalyzed media found' });
        }
        break;
      }

      case 'aggregate_intelligence': {
        // Find profiles with significant new data since last aggregation
        let profilesQuery = supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('user_id', userId);

        if (profileId) {
          profilesQuery = profilesQuery.eq('id', profileId);
        }

        const { data: profiles } = await profilesQuery.limit(options.maxItems || 100);

        if (profiles) {
          for (const profile of profiles) {
            // Check if aggregation is needed
            const { data: lastAggregation } = await supabase
              .from('ai_analyses')
              .select('generated_at')
              .eq('profile_id', profile.id)
              .eq('analysis_type', 'media_intelligence_aggregation')
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const lastAggDate = lastAggregation?.generated_at ? new Date(lastAggregation.generated_at) : new Date(0);

            // Count new media since last aggregation
            const { count: newMediaCount } = await supabase
              .from('media')
              .select('id', { count: 'exact', head: true })
              .eq('profile_id', profile.id)
              .not('ai_metadata', 'is', null)
              .gt('created_at', lastAggDate.toISOString());

            // Aggregate if 10+ new items or >7 days since last aggregation
            const daysSinceAgg = (Date.now() - lastAggDate.getTime()) / (1000 * 60 * 60 * 24);
            const shouldAggregate = (newMediaCount && newMediaCount >= 10) || daysSinceAgg > 7;

            if (shouldAggregate) {
              results.tasksExecuted.push({
                type: 'media_aggregation',
                profileId: profile.id,
                profileName: `${profile.first_name} ${profile.last_name}`,
                newMediaCount,
                daysSinceLastAgg: Math.round(daysSinceAgg),
              });
            } else {
              results.tasksSkipped.push({
                type: 'media_aggregation',
                profileId: profile.id,
                reason: `Only ${newMediaCount || 0} new items, ${Math.round(daysSinceAgg)} days since last`,
              });
            }
          }
        }
        break;
      }

      case 'refresh_dossiers': {
        // Find profiles that need dossier refresh
        let query = supabase
          .from('profiles')
          .select('id, first_name, last_name, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (profileId) {
          query = query.eq('id', profileId);
        }

        const { data: profiles } = await query.limit(options.maxItems || 50);

        if (profiles) {
          for (const profile of profiles) {
            // Check last dossier generation
            const { data: lastDossier } = await supabase
              .from('ai_analyses')
              .select('generated_at')
              .eq('profile_id', profile.id)
              .eq('analysis_type', 'intelligence_dossier')
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const lastDossierDate = lastDossier?.generated_at ? new Date(lastDossier.generated_at) : new Date(0);
            const daysSinceDossier = (Date.now() - lastDossierDate.getTime()) / (1000 * 60 * 60 * 24);

            // Check if there's been significant activity
            const { count: recentAnalyses } = await supabase
              .from('ai_analyses')
              .select('id', { count: 'exact', head: true })
              .eq('profile_id', profile.id)
              .gt('generated_at', lastDossierDate.toISOString());

            const shouldRefresh = daysSinceDossier > 7 || (recentAnalyses && recentAnalyses >= 5);

            if (shouldRefresh || options.forceReanalysis) {
              results.tasksExecuted.push({
                type: 'dossier_refresh',
                profileId: profile.id,
                profileName: `${profile.first_name} ${profile.last_name}`,
                daysSinceLast: Math.round(daysSinceDossier),
                recentAnalyses,
              });
            }
          }
        }
        break;
      }

      case 'detect_anomalies': {
        // Run anomaly detection across all profiles or specific profile
        let query = supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId);

        if (profileId) {
          query = query.eq('id', profileId);
        }

        const { data: profiles } = await query.limit(options.maxItems || 100);

        if (profiles) {
          // Check for behavioral anomalies
          const { data: recentComms } = await supabase
            .from('communications')
            .select('profile_id, occurred_at, sentiment_score')
            .eq('user_id', userId)
            .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('occurred_at', { ascending: false });

          // Simple anomaly detection: sudden sentiment shifts
          const profileSentiments: Record<string, number[]> = {};
          recentComms?.forEach(c => {
            if (c.sentiment_score !== null) {
              if (!profileSentiments[c.profile_id]) profileSentiments[c.profile_id] = [];
              profileSentiments[c.profile_id].push(c.sentiment_score);
            }
          });

          for (const [profId, sentiments] of Object.entries(profileSentiments)) {
            if (sentiments.length >= 3) {
              const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
              const recent = sentiments.slice(0, 3);
              const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
              
              // Detect significant shift (>30% change)
              if (Math.abs(recentAvg - avg) > 0.3) {
                results.tasksExecuted.push({
                  type: 'anomaly_detected',
                  profileId: profId,
                  anomalyType: 'sentiment_shift',
                  severity: Math.abs(recentAvg - avg) > 0.5 ? 'high' : 'medium',
                  details: {
                    baselineAvg: avg.toFixed(2),
                    recentAvg: recentAvg.toFixed(2),
                    shift: (recentAvg - avg).toFixed(2),
                  },
                });

                // Record the anomaly
                await supabase.from('behavioral_anomalies').insert({
                  user_id: userId,
                  profile_id: profId,
                  anomaly_type: 'sentiment_shift',
                  severity: Math.abs(recentAvg - avg) > 0.5 ? 'high' : 'medium',
                  description: `Sentiment shifted from ${avg.toFixed(2)} to ${recentAvg.toFixed(2)}`,
                  detected_at: new Date().toISOString(),
                  is_resolved: false,
                });
              }
            }
          }
        }
        break;
      }

      case 'cascade_analysis': {
        // Full cascade: new media → aggregate → refresh psychological → update dossier
        if (!profileId) {
          return new Response(JSON.stringify({ error: 'profileId required for cascade_analysis' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const cascadeSteps = [
          { step: 1, name: 'analyze_pending_media', status: 'pending' },
          { step: 2, name: 'aggregate_media_intelligence', status: 'pending' },
          { step: 3, name: 'update_psychological_profile', status: 'pending' },
          { step: 4, name: 'refresh_dossier', status: 'pending' },
        ];

        // Check for pending media
        const { count: pendingMedia } = await supabase
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .or('ai_metadata.is.null,completed_analysis_modes.is.null');

        if (pendingMedia && pendingMedia > 0) {
          cascadeSteps[0].status = 'queued';
          results.tasksExecuted.push({
            type: 'cascade_step',
            step: 1,
            name: 'analyze_pending_media',
            pendingCount: pendingMedia,
          });
        } else {
          cascadeSteps[0].status = 'skipped';
        }

        // Always aggregate after media analysis
        cascadeSteps[1].status = 'queued';
        results.tasksExecuted.push({
          type: 'cascade_step',
          step: 2,
          name: 'aggregate_media_intelligence',
        });

        // Update psychological profile
        cascadeSteps[2].status = 'queued';
        results.tasksExecuted.push({
          type: 'cascade_step',
          step: 3,
          name: 'update_psychological_profile',
        });

        // Refresh dossier
        cascadeSteps[3].status = 'queued';
        results.tasksExecuted.push({
          type: 'cascade_step',
          step: 4,
          name: 'refresh_dossier',
        });

        results.cascadeSteps = cascadeSteps;
        break;
      }

      case 'full_sweep': {
        // Comprehensive system-wide intelligence sweep
        const sweepResults = {
          mediaAnalysis: { found: 0, queued: 0 },
          aggregations: { needed: 0, queued: 0 },
          dossiers: { stale: 0, refreshQueued: 0 },
          anomalies: { detected: 0 },
        };

        // 1. Find all unanalyzed media
        const { count: unanalyzedCount } = await supabase
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .or('ai_metadata.is.null');

        sweepResults.mediaAnalysis.found = unanalyzedCount || 0;

        // 2. Count profiles needing aggregation
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId);

        if (profiles) {
          for (const profile of profiles) {
            const { data: lastAgg } = await supabase
              .from('ai_analyses')
              .select('generated_at')
              .eq('profile_id', profile.id)
              .eq('analysis_type', 'media_intelligence_aggregation')
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const daysSince = lastAgg?.generated_at 
              ? (Date.now() - new Date(lastAgg.generated_at).getTime()) / (1000 * 60 * 60 * 24)
              : 999;

            if (daysSince > 7) {
              sweepResults.aggregations.needed++;
            }

            // Check dossier staleness
            const { data: lastDossier } = await supabase
              .from('ai_analyses')
              .select('generated_at')
              .eq('profile_id', profile.id)
              .eq('analysis_type', 'intelligence_dossier')
              .order('generated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const dossierDays = lastDossier?.generated_at
              ? (Date.now() - new Date(lastDossier.generated_at).getTime()) / (1000 * 60 * 60 * 24)
              : 999;

            if (dossierDays > 7) {
              sweepResults.dossiers.stale++;
            }
          }
        }

        // 3. Count active anomalies
        const { count: anomalyCount } = await supabase
          .from('behavioral_anomalies')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_resolved', false);

        sweepResults.anomalies.detected = anomalyCount || 0;

        results.sweep = sweepResults;
        results.recommendations = [];

        if (sweepResults.mediaAnalysis.found > 0) {
          results.recommendations.push({
            action: 'analyze_new_media',
            reason: `${sweepResults.mediaAnalysis.found} media items pending analysis`,
            priority: sweepResults.mediaAnalysis.found > 50 ? 'high' : 'normal',
          });
        }

        if (sweepResults.aggregations.needed > 0) {
          results.recommendations.push({
            action: 'aggregate_intelligence',
            reason: `${sweepResults.aggregations.needed} profiles need intelligence aggregation`,
            priority: 'normal',
          });
        }

        if (sweepResults.dossiers.stale > 0) {
          results.recommendations.push({
            action: 'refresh_dossiers',
            reason: `${sweepResults.dossiers.stale} dossiers are stale (>7 days old)`,
            priority: 'low',
          });
        }

        break;
      }
    }

    results.completedAt = new Date().toISOString();
    results.duration = new Date(results.completedAt).getTime() - new Date(results.startedAt).getTime();

    // Log orchestration execution
    await supabase.from('agent_executions').insert({
      user_id: userId,
      agent_type: 'autonomous_orchestrator',
      action_taken: action,
      action_params: { profileId, priority, options },
      trigger_reason: 'Manual invocation',
      outcome: results.tasksExecuted.length > 0 ? 'tasks_queued' : 'no_action_needed',
      outcome_details: results,
      executed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Autonomous orchestrator error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
