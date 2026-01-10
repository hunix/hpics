import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunicationAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_contacts: string[];
  detected_pattern: string;
  recommended_action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { timeframeDays = 30 } = await req.json().catch(() => ({}));

    // Fetch recent communications with profile info
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    const { data: communications, error: commError } = await supabase
      .from('communications')
      .select(`
        id, channel, direction, occurred_at, sentiment_score, duration_minutes,
        profiles:profile_id (id, first_name, last_name)
      `)
      .eq('user_id', user.id)
      .gte('occurred_at', cutoffDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (commError) throw commError;

    // Fetch behavioral baselines for comparison
    const { data: baselines } = await supabase
      .from('behavioral_baselines')
      .select('profile_id, baseline_type, baseline_data')
      .eq('user_id', user.id)
      .eq('baseline_type', 'communication');

    // Calculate communication patterns per contact
    const contactPatterns: Record<string, {
      name: string;
      totalComms: number;
      avgSentiment: number;
      channels: Record<string, number>;
      recentGap: number;
      baseline?: any;
    }> = {};

    for (const comm of communications || []) {
      const profile = comm.profiles as any;
      if (!profile) continue;

      const profileId = profile.id;
      if (!contactPatterns[profileId]) {
        const baseline = baselines?.find(b => b.profile_id === profileId);
        contactPatterns[profileId] = {
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          totalComms: 0,
          avgSentiment: 0,
          channels: {},
          recentGap: 0,
          baseline: baseline?.baseline_data,
        };
      }

      contactPatterns[profileId].totalComms++;
      contactPatterns[profileId].avgSentiment += comm.sentiment_score || 0;
      contactPatterns[profileId].channels[comm.channel] = 
        (contactPatterns[profileId].channels[comm.channel] || 0) + 1;
    }

    // Normalize sentiment scores
    for (const id of Object.keys(contactPatterns)) {
      if (contactPatterns[id].totalComms > 0) {
        contactPatterns[id].avgSentiment /= contactPatterns[id].totalComms;
      }
    }

    // Use AI to detect anomalies
    const aiResponse = await callAI({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a communication pattern analyst. Analyze the provided communication data and detect anomalies such as:
- Sudden drops in communication frequency
- Unusual sentiment shifts
- Channel switching patterns
- Gaps in regular communication rhythms
- Unusual timing patterns

Return a JSON object with:
{
  "anomalies": [
    {
      "type": "frequency_drop|sentiment_shift|channel_change|communication_gap|timing_anomaly",
      "severity": "low|medium|high",
      "description": "Brief description",
      "affected_contacts": ["contact names"],
      "detected_pattern": "What pattern was detected",
      "recommended_action": "What action to take"
    }
  ],
  "network_health_score": 0-100,
  "summary": "Overall summary of communication health"
}`
        },
        {
          role: 'user',
          content: `Analyze these communication patterns for anomalies:\n${JSON.stringify(contactPatterns, null, 2)}`
        }
      ],
      temperature: 0.3,
      userId: user.id,
      functionName: 'detect-communication-anomalies',
    });

    const analysis = parseAIJson<{
      anomalies: CommunicationAnomaly[];
      network_health_score: number;
      summary: string;
    }>(aiResponse.content, { anomalies: [], network_health_score: 75, summary: 'Analysis complete' });

    // Ensure anomalies is an array before iterating
    const anomalies = Array.isArray(analysis.anomalies) ? analysis.anomalies : [];
    
    // Store detected anomalies
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'high' || anomaly.severity === 'medium') {
        // Find profile IDs for affected contacts
        const affectedProfiles = Object.entries(contactPatterns)
          .filter(([_, data]) => anomaly.affected_contacts.includes(data.name))
          .map(([id]) => id);

        for (const profileId of affectedProfiles) {
          await supabase.from('behavioral_anomalies').insert({
            user_id: user.id,
            profile_id: profileId,
            anomaly_type: anomaly.type,
            severity: anomaly.severity,
            description: anomaly.description,
            expected_value: { pattern: 'normal' },
            actual_value: { pattern: anomaly.detected_pattern },
            deviation_score: anomaly.severity === 'high' ? 0.9 : 0.6,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      anomalies: anomalies,
      networkHealthScore: analysis.network_health_score ?? 75,
      summary: analysis.summary ?? 'Analysis complete',
      analyzedContacts: Object.keys(contactPatterns).length,
      timeframeDays,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error detecting anomalies:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
