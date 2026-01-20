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
    return new Response(JSON.stringify({ ok: true, function: 'tscm-sweep-analyzer', timestamp: Date.now() }), 
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

    const { action, sweepData, locationId } = body;

    // Default analysis mode for intelligence session calls
    if (!action && body.profileId) {
      // Run baseline environment security analysis
      const analysis = analyzeSweepResults({ type: 'comprehensive' });
      const environmentAnalysis = analyzeSecurityEnvironment({});

      return new Response(JSON.stringify({ 
        success: true, 
        sweep: analysis,
        environment: environmentAnalysis,
        profileId: body.profileId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (action) {
      case 'record_sweep': {
        const analysis = analyzeSweepResults(sweepData);

        const { data, error } = await supabase
          .from('tscm_sweep_results')
          .insert({
            user_id: userId,
            location_identifier: locationId,
            sweep_type: sweepData.type || 'comprehensive',
            rf_anomalies_detected: analysis.rfAnomalies,
            audio_anomalies_detected: analysis.audioAnomalies,
            visual_anomalies_detected: analysis.visualAnomalies,
            network_anomalies_detected: analysis.networkAnomalies,
            devices_found: analysis.devicesFound,
            threat_level: analysis.threatLevel,
            recommendations: analysis.recommendations,
            sweep_conducted_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, sweep: data, analysis }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_sweep_history': {
        const { data } = await supabase
          .from('tscm_sweep_results')
          .select('*')
          .eq('user_id', userId)
          .order('sweep_conducted_at', { ascending: false })
          .limit(50);

        const summary = generateSweepSummary(data || []);

        return new Response(JSON.stringify({ success: true, sweeps: data, summary }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'analyze_environment': {
        const environmentAnalysis = analyzeSecurityEnvironment(body.environmentData);

        return new Response(JSON.stringify({ success: true, analysis: environmentAnalysis }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'generate_countermeasures': {
        const countermeasures = generateTSCMCountermeasures(body.threatProfile);

        return new Response(JSON.stringify({ success: true, countermeasures }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('TSCM analyzer error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function analyzeSweepResults(data: any): any {
  if (!data) {
    return {
      rfAnomalies: [],
      audioAnomalies: [],
      visualAnomalies: [],
      networkAnomalies: [],
      devicesFound: [],
      threatLevel: 'low',
      recommendations: ['Conduct comprehensive baseline sweep']
    };
  }

  const rfAnomalies = data.rfFindings || [];
  const audioAnomalies = data.audioFindings || [];
  const visualAnomalies = data.visualFindings || [];
  const networkAnomalies = data.networkFindings || [];
  const devicesFound = data.devices || [];

  // Calculate threat level
  const totalAnomalies = rfAnomalies.length + audioAnomalies.length + 
    visualAnomalies.length + networkAnomalies.length;
  
  let threatLevel = 'low';
  if (devicesFound.length > 0) threatLevel = 'critical';
  else if (totalAnomalies >= 5) threatLevel = 'high';
  else if (totalAnomalies >= 2) threatLevel = 'medium';

  const recommendations = generateSweepRecommendations(
    rfAnomalies, audioAnomalies, visualAnomalies, networkAnomalies, devicesFound
  );

  return {
    rfAnomalies,
    audioAnomalies,
    visualAnomalies,
    networkAnomalies,
    devicesFound,
    threatLevel,
    recommendations
  };
}

function generateSweepRecommendations(
  rf: any[], audio: any[], visual: any[], network: any[], devices: any[]
): string[] {
  const recommendations: string[] = [];

  if (devices.length > 0) {
    recommendations.push('CRITICAL: Remove discovered surveillance devices immediately');
    recommendations.push('Engage professional TSCM team for detailed analysis');
    recommendations.push('Conduct forensic examination of discovered devices');
  }

  if (rf.length > 0) {
    recommendations.push('Investigate RF anomalies with spectrum analyzer');
    recommendations.push('Consider RF shielding for sensitive areas');
  }

  if (audio.length > 0) {
    recommendations.push('Check for audio transmission devices');
    recommendations.push('Implement audio masking in sensitive meeting rooms');
  }

  if (visual.length > 0) {
    recommendations.push('Inspect for hidden cameras');
    recommendations.push('Consider privacy screens and window treatments');
  }

  if (network.length > 0) {
    recommendations.push('Audit network for unauthorized devices');
    recommendations.push('Implement network segmentation');
  }

  if (recommendations.length === 0) {
    recommendations.push('No immediate threats detected');
    recommendations.push('Maintain regular sweep schedule');
    recommendations.push('Continue baseline monitoring');
  }

  return recommendations;
}

function generateSweepSummary(sweeps: any[]): any {
  const threatLevels: Record<string, number> = {};
  let totalDevicesFound = 0;
  let totalAnomalies = 0;

  sweeps.forEach(s => {
    threatLevels[s.threat_level] = (threatLevels[s.threat_level] || 0) + 1;
    totalDevicesFound += (s.devices_found?.length || 0);
    totalAnomalies += (s.rf_anomalies_detected?.length || 0) + 
      (s.audio_anomalies_detected?.length || 0) +
      (s.visual_anomalies_detected?.length || 0) +
      (s.network_anomalies_detected?.length || 0);
  });

  return {
    totalSweeps: sweeps.length,
    threatLevelDistribution: threatLevels,
    totalDevicesFound,
    totalAnomalies,
    lastSweep: sweeps[0]?.sweep_conducted_at || null,
    currentThreatLevel: sweeps[0]?.threat_level || 'unknown'
  };
}

function analyzeSecurityEnvironment(data: any): any {
  if (!data) {
    return {
      overallRisk: 'unknown',
      vulnerabilities: [],
      recommendations: ['Conduct environment security assessment']
    };
  }

  const vulnerabilities: any[] = [];

  // Physical security
  if (!data.accessControl) {
    vulnerabilities.push({
      type: 'physical',
      description: 'Inadequate access control',
      severity: 'high'
    });
  }

  // Technical security
  if (!data.rfShielding) {
    vulnerabilities.push({
      type: 'technical',
      description: 'No RF shielding in sensitive areas',
      severity: 'medium'
    });
  }

  if (!data.sweepSchedule) {
    vulnerabilities.push({
      type: 'procedural',
      description: 'No regular TSCM sweep schedule',
      severity: 'medium'
    });
  }

  const overallRisk = vulnerabilities.filter(v => v.severity === 'high').length >= 2 ? 'high' :
    vulnerabilities.length >= 3 ? 'medium' : 'low';

  return {
    overallRisk,
    vulnerabilities,
    recommendations: vulnerabilities.map(v => `Address: ${v.description}`)
  };
}

function generateTSCMCountermeasures(threatProfile: any): any {
  const countermeasures = {
    immediate: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[],
    equipment: [] as string[]
  };

  if (!threatProfile) {
    countermeasures.immediate = ['Conduct baseline security assessment'];
    return countermeasures;
  }

  if (threatProfile.rfThreat) {
    countermeasures.immediate.push('Deploy RF detection equipment');
    countermeasures.shortTerm.push('Install RF shielding');
    countermeasures.equipment.push('Spectrum analyzer', 'Non-linear junction detector');
  }

  if (threatProfile.audioThreat) {
    countermeasures.immediate.push('Implement audio masking');
    countermeasures.shortTerm.push('Install acoustic dampening');
    countermeasures.equipment.push('Audio jammer', 'Acoustic noise generator');
  }

  if (threatProfile.visualThreat) {
    countermeasures.immediate.push('Conduct camera detection sweep');
    countermeasures.shortTerm.push('Install privacy screens');
    countermeasures.equipment.push('Camera lens detector', 'Infrared scanner');
  }

  countermeasures.longTerm.push('Establish regular TSCM program');
  countermeasures.longTerm.push('Train personnel on security awareness');

  return countermeasures;
}
