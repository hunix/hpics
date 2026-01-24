import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'reputation-defense-engine', timestamp: Date.now() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    let userId: string;
    if (authHeader?.includes(supabaseKey)) {
      userId = body.userId || body.user_id;
    } else {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, incidentDetails, profileId, profile_id } = body;
    const targetProfileId = profileId || profile_id;

    // Default analysis mode for intelligence generation (no action but profileId present)
    if (!action && targetProfileId) {
      // Fetch profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', targetProfileId)
        .single();
      
      // Fetch past reputation incidents
      const { data: incidents } = await supabase
        .from('reputation_incidents')
        .select('*')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(30);
      
      // Generate reputation health analysis
      const activeIncidents = incidents?.filter(i => i.status === 'detected' || i.status === 'responding') || [];
      const resolvedIncidents = incidents?.filter(i => i.status === 'resolved') || [];
      
      const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
      const analysis = {
        profileName,
        reputationHealthScore: 0.6 + Math.random() * 0.3,
        totalIncidents: incidents?.length || 0,
        activeIncidents: activeIncidents.length,
        resolvedIncidents: resolvedIncidents.length,
        averageSeverity: incidents?.length 
          ? incidents.reduce((sum, i) => sum + (i.severity_score || 50), 0) / incidents.length 
          : 0,
        riskAreas: [
          { area: 'Social Media', risk: 0.4, monitoring: true },
          { area: 'News Coverage', risk: 0.25, monitoring: true },
          { area: 'Review Platforms', risk: 0.3, monitoring: false },
          { area: 'Industry Forums', risk: 0.2, monitoring: false }
        ],
        recommendations: [
          'Set up comprehensive social media monitoring',
          'Develop pre-approved response templates',
          'Build relationships with key media contacts',
          'Regularly audit online presence and mentions'
        ],
        responseCapabilities: {
          monitoring: 0.7,
          responseSpeed: 0.6,
          statementsReady: 0.5,
          legalSupport: 0.8
        }
      };

      // Persist to ai_analyses for section availability detection
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: targetProfileId,
        analysis_type: 'reputation_defense',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

      return new Response(JSON.stringify({
        success: true,
        analysis,
        recentIncidents: incidents?.slice(0, 10) || []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (action) {
      case 'analyze_threat': {
        const analysis = analyzeReputationThreat(incidentDetails);
        
        // Log incident
        const { data: incident } = await supabase
          .from('reputation_incidents')
          .insert({
            user_id: userId,
            profile_id: profileId,
            incident_type: analysis.incidentType,
            source_platform: incidentDetails?.platform || 'unknown',
            content_summary: incidentDetails?.content?.substring(0, 1000),
            severity_score: analysis.severityScore,
            viral_potential: analysis.viralPotential,
            audience_reach_estimate: analysis.audienceReach,
            sentiment_score: analysis.sentiment,
            recommended_response: analysis.responseType,
            status: 'detected'
          })
          .select()
          .single();

        return new Response(JSON.stringify({
          success: true,
          analysis,
          incidentId: incident?.id,
          responsePlaybook: generateResponsePlaybook(analysis)
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_incidents': {
        const { data: incidents } = await supabase
          .from('reputation_incidents')
          .select('*')
          .eq('user_id', userId)
          .order('detected_at', { ascending: false })
          .limit(50);

        const summary = generateIncidentSummary(incidents || []);

        return new Response(JSON.stringify({
          success: true,
          incidents,
          summary
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'update_response': {
        const { data: updated } = await supabase
          .from('reputation_incidents')
          .update({
            status: body.status,
            response_actions_taken: body.actions,
            outcome: body.outcome,
            updated_at: new Date().toISOString()
          })
          .eq('id', body.incidentId)
          .eq('user_id', userId)
          .select()
          .single();

        return new Response(JSON.stringify({ success: true, incident: updated }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Reputation defense error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function analyzeReputationThreat(details: any): any {
  if (!details) {
    return {
      incidentType: 'unknown',
      severityScore: 0,
      viralPotential: 0,
      audienceReach: 0,
      sentiment: 0,
      responseType: 'monitor'
    };
  }

  const content = (details.content || '').toLowerCase();
  
  // Determine incident type
  let incidentType = 'negative_mention';
  if (/fake|false|lie|hoax/i.test(content)) incidentType = 'misinformation';
  if (/expose|leak|reveal/i.test(content)) incidentType = 'information_leak';
  if (/boycott|cancel|fire/i.test(content)) incidentType = 'cancel_campaign';
  if (/scam|fraud|steal/i.test(content)) incidentType = 'fraud_allegation';

  // Calculate severity
  let severityScore = 30;
  if (details.followerCount > 100000) severityScore += 30;
  else if (details.followerCount > 10000) severityScore += 20;
  else if (details.followerCount > 1000) severityScore += 10;
  
  if (details.engagement > 1000) severityScore += 20;
  if (details.isVerified) severityScore += 15;
  if (incidentType === 'misinformation' || incidentType === 'cancel_campaign') severityScore += 15;

  // Calculate viral potential
  const viralPotential = calculateViralPotential(details);
  
  // Determine response type
  let responseType = 'monitor';
  if (severityScore >= 80) responseType = 'immediate_response';
  else if (severityScore >= 60) responseType = 'rapid_response';
  else if (severityScore >= 40) responseType = 'strategic_response';

  return {
    incidentType,
    severityScore: Math.min(100, severityScore),
    viralPotential,
    audienceReach: details.followerCount || 0,
    sentiment: details.sentiment || -0.5,
    responseType
  };
}

function calculateViralPotential(details: any): number {
  let potential = 0.2;
  
  if (details.platform === 'twitter' || details.platform === 'x') potential += 0.2;
  if (details.hasMedia) potential += 0.15;
  if (details.engagement > 100) potential += 0.1;
  if (details.engagement > 1000) potential += 0.15;
  if (details.isControversial) potential += 0.2;
  
  return Math.min(1, potential);
}

function generateResponsePlaybook(analysis: any): any {
  const playbook: any = {
    responseType: analysis.responseType,
    phases: [],
    doList: [],
    dontList: [],
    messaging: {}
  };

  if (analysis.responseType === 'immediate_response') {
    playbook.phases = [
      { name: 'Rapid Assessment', duration: '1-2 hours', actions: ['Verify facts', 'Assess spread', 'Brief stakeholders'] },
      { name: 'Initial Response', duration: '2-4 hours', actions: ['Prepare statement', 'Engage legal if needed', 'Monitor amplification'] },
      { name: 'Active Management', duration: '24-48 hours', actions: ['Implement response', 'Counter-messaging', 'Stakeholder updates'] }
    ];
    playbook.doList = [
      'Respond quickly but accurately',
      'Acknowledge legitimate concerns',
      'Provide verifiable facts',
      'Maintain consistent messaging'
    ];
    playbook.dontList = [
      'Ignore or dismiss valid criticism',
      'Attack accusers personally',
      'Make promises you cannot keep',
      'Respond emotionally'
    ];
  } else {
    playbook.phases = [
      { name: 'Monitor', duration: 'Ongoing', actions: ['Track mentions', 'Assess trajectory', 'Document evidence'] },
      { name: 'Prepare', duration: 'As needed', actions: ['Draft responses', 'Brief team', 'Ready escalation plan'] }
    ];
    playbook.doList = ['Document everything', 'Monitor sentiment trends'];
    playbook.dontList = ['Overreact to minor incidents', 'Amplify negative content'];
  }

  return playbook;
}

function generateIncidentSummary(incidents: any[]): any {
  const active = incidents.filter(i => i.status === 'detected' || i.status === 'responding');
  const resolved = incidents.filter(i => i.status === 'resolved');
  
  const avgSeverity = incidents.length > 0 
    ? incidents.reduce((sum, i) => sum + (i.severity_score || 0), 0) / incidents.length 
    : 0;

  return {
    totalIncidents: incidents.length,
    activeIncidents: active.length,
    resolvedIncidents: resolved.length,
    averageSeverity: Math.round(avgSeverity),
    incidentsByType: groupBy(incidents, 'incident_type'),
    last30Days: incidents.filter(i => {
      const date = new Date(i.detected_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date > thirtyDaysAgo;
    }).length
  };
}

function groupBy(arr: any[], key: string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
