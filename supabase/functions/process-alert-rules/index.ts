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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch active rules
    const { data: rules } = await supabase
      .from('intelligence_alert_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ success: true, alerts_triggered: 0, message: 'No active rules' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, last_contact_date, is_favorite')
      .eq('user_id', user.id);

    // Fetch recent communications
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: communications } = await supabase
      .from('communications')
      .select('profile_id, occurred_at, sentiment_score, content')
      .eq('user_id', user.id)
      .gte('occurred_at', thirtyDaysAgo);

    // Fetch recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, sent_at, content, conversations!inner(profile_id)')
      .eq('user_id', user.id)
      .gte('sent_at', thirtyDaysAgo);

    // Fetch behavioral baselines
    const { data: baselines } = await supabase
      .from('behavioral_baselines')
      .select('*')
      .eq('user_id', user.id);

    const alertsToCreate: any[] = [];
    const now = new Date();

    for (const rule of rules) {
      const conditions = rule.conditions as any;
      const targetProfiles = rule.target_profiles || profiles?.map(p => p.id) || [];

      for (const profileId of targetProfiles) {
        const profile = profiles?.find(p => p.id === profileId);
        if (!profile) continue;

        let triggered = false;
        let evidence: any = {};
        let alertTitle = '';
        let alertDescription = '';

        switch (rule.rule_type) {
          case 'silence': {
            const daysSilent = conditions.days_silent || 14;
            const lastContact = profile.last_contact_date 
              ? new Date(profile.last_contact_date)
              : null;
            
            if (lastContact) {
              const actualDays = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
              if (actualDays >= daysSilent) {
                triggered = true;
                alertTitle = `Contact went silent: ${profile.first_name} ${profile.last_name}`;
                alertDescription = `No contact for ${actualDays} days (threshold: ${daysSilent} days)`;
                evidence = { days_silent: actualDays, threshold: daysSilent, last_contact: lastContact };
              }
            } else {
              // Never contacted - check if profile is old enough
              triggered = true;
              alertTitle = `No contact history: ${profile.first_name} ${profile.last_name}`;
              alertDescription = `This contact has never been communicated with`;
              evidence = { no_contact_history: true };
            }
            break;
          }

          case 'sentiment_shift': {
            const sentimentDrop = conditions.sentiment_drop || 30;
            const profileComms = communications?.filter(c => c.profile_id === profileId && c.sentiment_score !== null) || [];
            
            if (profileComms.length >= 5) {
              const sorted = [...profileComms].sort((a, b) => 
                new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
              );
              const recentAvg = sorted.slice(-3).reduce((a, c) => a + (c.sentiment_score || 0), 0) / 3;
              const historicalAvg = sorted.slice(0, -3).reduce((a, c) => a + (c.sentiment_score || 0), 0) / (sorted.length - 3);
              
              const drop = historicalAvg - recentAvg;
              if (drop >= sentimentDrop) {
                triggered = true;
                alertTitle = `Sentiment drop: ${profile.first_name} ${profile.last_name}`;
                alertDescription = `Sentiment dropped by ${Math.round(drop)} points (threshold: ${sentimentDrop})`;
                evidence = { sentiment_drop: drop, recent_avg: recentAvg, historical_avg: historicalAvg };
              }
            }
            break;
          }

          case 'keyword': {
            const keywords = conditions.keywords || [];
            const profileComms = communications?.filter(c => c.profile_id === profileId) || [];
            const profileMsgs = messages?.filter(m => (m.conversations as any)?.profile_id === profileId) || [];
            
            const allContent = [
              ...profileComms.map(c => c.content || ''),
              ...profileMsgs.map(m => m.content || ''),
            ].join(' ').toLowerCase();
            
            const matchedKeywords = keywords.filter((kw: string) => allContent.includes(kw.toLowerCase()));
            if (matchedKeywords.length > 0) {
              triggered = true;
              alertTitle = `Keyword detected: ${profile.first_name} ${profile.last_name}`;
              alertDescription = `Found keywords: ${matchedKeywords.join(', ')}`;
              evidence = { matched_keywords: matchedKeywords, keywords_searched: keywords };
            }
            break;
          }

          case 'pattern_break': {
            const baseline = baselines?.find(b => b.profile_id === profileId && b.baseline_type === 'communication_frequency');
            if (baseline) {
              const baselineData = baseline.baseline_data as any;
              const mean = baselineData.mean || 0;
              const stdDev = baselineData.std_dev || 1;
              
              // Check recent activity
              const recentComms = communications?.filter(c => 
                c.profile_id === profileId && 
                new Date(c.occurred_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ) || [];
              
              const recentDaily = recentComms.length / 7;
              const deviation = Math.abs(recentDaily - mean) / stdDev;
              
              if (deviation > 2) {
                triggered = true;
                alertTitle = `Pattern break: ${profile.first_name} ${profile.last_name}`;
                alertDescription = recentDaily < mean 
                  ? `Communication frequency ${Math.round((1 - recentDaily/mean) * 100)}% below normal`
                  : `Communication frequency ${Math.round((recentDaily/mean - 1) * 100)}% above normal`;
                evidence = { deviation, expected: mean, actual: recentDaily };
              }
            }
            break;
          }
        }

        if (triggered) {
          // Check if similar alert already exists recently
          const { data: existingAlerts } = await supabase
            .from('intelligence_alerts')
            .select('id')
            .eq('user_id', user.id)
            .eq('profile_id', profileId)
            .eq('alert_type', rule.rule_type)
            .eq('is_acknowledged', false)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          if (!existingAlerts || existingAlerts.length === 0) {
            alertsToCreate.push({
              user_id: user.id,
              rule_id: rule.id,
              profile_id: profileId,
              alert_type: rule.rule_type,
              severity: rule.severity,
              title: alertTitle,
              description: alertDescription,
              evidence,
            });

            // Update rule trigger count
            await supabase
              .from('intelligence_alert_rules')
              .update({ 
                last_triggered_at: now.toISOString(),
                trigger_count: (rule.trigger_count || 0) + 1,
              })
              .eq('id', rule.id);
          }
        }
      }
    }

    // Create alerts
    if (alertsToCreate.length > 0) {
      await supabase.from('intelligence_alerts').insert(alertsToCreate);
    }

    return new Response(JSON.stringify({
      success: true,
      rules_processed: rules.length,
      alerts_triggered: alertsToCreate.length,
      alerts: alertsToCreate.map(a => ({ title: a.title, severity: a.severity })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Alert processing error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
