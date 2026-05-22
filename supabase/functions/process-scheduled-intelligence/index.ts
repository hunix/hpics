import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting scheduled intelligence processing...');
    
    const results = {
      baselines_updated: 0,
      anomalies_detected: 0,
      alerts_processed: 0,
      decay_warnings: 0,
    };

    // 1. Update behavioral baselines for active contacts
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id')
      .order('updated_at', { ascending: false })
      .limit(100);

    for (const profile of profiles || []) {
      // Get recent communications for baseline
      const { data: comms } = await supabase
        .from('communications')
        .select('occurred_at, channel, sentiment_score')
        .eq('profile_id', profile.id)
        .gte('occurred_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: false });

      if (comms && comms.length >= 5) {
        // Calculate baseline metrics
        const avgSentiment = comms.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / comms.length;
        const commFrequency = comms.length / 90;
        const channelDistribution: Record<string, number> = {};
        comms.forEach(c => {
          channelDistribution[c.channel] = (channelDistribution[c.channel] || 0) + 1;
        });

        // Upsert baseline
        await supabase
          .from('behavioral_baselines')
          .upsert({
            user_id: profile.user_id,
            profile_id: profile.id,
            baseline_type: 'communication',
            baseline_data: {
              avg_sentiment: avgSentiment,
              comm_frequency_per_day: commFrequency,
              channel_distribution: channelDistribution,
              sample_size: comms.length,
            },
            last_calculated_at: new Date().toISOString(),
            sample_size: comms.length,
            confidence_score: Math.min(100, comms.length * 2),
          }, {
            onConflict: 'profile_id,baseline_type',
          });

        results.baselines_updated++;
      }
    }

    // 2. Check for relationship decay
    const { data: recentComms } = await supabase
      .from('communications')
      .select('profile_id, user_id, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(1000);

    const profileLastContact = new Map<string, { date: Date; userId: string }>();
    recentComms?.forEach(c => {
      if (!profileLastContact.has(c.profile_id)) {
        profileLastContact.set(c.profile_id, { 
          date: new Date(c.occurred_at), 
          userId: c.user_id 
        });
      }
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const [profileId, info] of profileLastContact) {
      if (info.date.getTime() < thirtyDaysAgo) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('intelligence_alerts')
          .select('id')
          .eq('profile_id', profileId)
          .eq('alert_type', 'relationship_decay')
          .eq('status', 'active')
          .limit(1);

        if (!existingAlert || existingAlert.length === 0) {
          await supabase
            .from('intelligence_alerts')
            .insert({
              user_id: info.userId,
              profile_id: profileId,
              alert_type: 'relationship_decay',
              severity: 'medium',
              title: 'Relationship Decay Warning',
              description: `No contact in over 30 days. Last interaction: ${info.date.toLocaleDateString()}`,
              status: 'active',
            });
          results.decay_warnings++;
        }
      }
    }

    // 3. Process pending alert rules
    const { data: alertRules } = await supabase
      .from('intelligence_alert_rules')
      .select('*')
      .eq('is_active', true);

    for (const rule of alertRules || []) {
      // Process based on rule type
      if (rule.rule_type === 'sentiment_drop') {
        const { data: recentAnalyses } = await supabase
          .from('ai_analyses')
          .select('profile_id, result')
          .eq('user_id', rule.user_id)
          .eq('analysis_type', 'sentiment')
          .order('generated_at', { ascending: false })
          .limit(10);

        for (const analysis of recentAnalyses || []) {
          const result = analysis.result as any;
          if (result?.overall_sentiment < (rule.conditions?.threshold || -0.5)) {
            await supabase
              .from('intelligence_alerts')
              .insert({
                user_id: rule.user_id,
                profile_id: analysis.profile_id,
                rule_id: rule.id,
                alert_type: 'sentiment_drop',
                severity: 'high',
                title: 'Negative Sentiment Detected',
                description: `Sentiment score dropped to ${result.overall_sentiment}`,
                status: 'active',
              });
            results.alerts_processed++;
          }
        }
      }
    }

    // 4. Detect anomalies in recent activity
    const { data: activityFeed } = await supabase
      .from('contact_activity_feed')
      .select('*')
      .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq('is_anomaly', false);

    for (const activity of activityFeed || []) {
      // Check against baselines
      const { data: baseline } = await supabase
        .from('behavioral_baselines')
        .select('baseline_data')
        .eq('profile_id', activity.profile_id)
        .eq('baseline_type', 'communication')
        .single();

      if (baseline?.baseline_data) {
        const data = baseline.baseline_data as any;
        // Flag as anomaly if importance score is unusually high
        if (activity.importance_score && activity.importance_score > 7) {
          await supabase
            .from('contact_activity_feed')
            .update({ 
              is_anomaly: true,
              anomaly_reason: 'High importance event detected'
            })
            .eq('id', activity.id);
          results.anomalies_detected++;
        }
      }
    }

    console.log('Scheduled intelligence processing complete:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      processed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scheduled processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
