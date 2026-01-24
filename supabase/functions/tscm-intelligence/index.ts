import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TSCMFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: { lat: number; lng: number };
  frequency?: number;
  confidence: number;
  recommendation: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
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

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'start-sweep': {
        const params = await req.json();

        const { data: sweep, error } = await supabase
          .from('tscm_sweeps')
          .insert({
            user_id: user.id,
            mission_id: params.mission_id || null,
            sweep_name: params.sweep_name || `TSCM Sweep ${new Date().toISOString().split('T')[0]}`,
            location_name: params.location_name,
            location: params.location || null,
            location_bounds: params.location_bounds || null,
            sweep_type: params.sweep_type || 'comprehensive',
            devices_used: params.devices || [],
            rf_findings: [],
            thermal_findings: [],
            acoustic_findings: [],
            visual_findings: [],
            threat_level: null,
            overall_findings: {},
            recommendations: [],
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, sweep }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add-finding': {
        const { sweep_id, finding_type, finding } = await req.json() as {
          sweep_id: string;
          finding_type: 'rf' | 'thermal' | 'acoustic' | 'visual';
          finding: TSCMFinding;
        };

        const { data: sweep, error: fetchError } = await supabase
          .from('tscm_sweeps')
          .select('rf_findings, thermal_findings, acoustic_findings, visual_findings')
          .eq('id', sweep_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const findingKey = `${finding_type}_findings` as keyof typeof sweep;
        const currentFindings = (sweep[findingKey] || []) as TSCMFinding[];
        currentFindings.push({
          ...finding,
          detected_at: new Date().toISOString(),
        });

        const { error: updateError } = await supabase
          .from('tscm_sweeps')
          .update({ [findingKey]: currentFindings })
          .eq('id', sweep_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'complete-sweep': {
        const { sweep_id } = await req.json();

        // Get sweep with all findings
        const { data: sweep, error: fetchError } = await supabase
          .from('tscm_sweeps')
          .select('*')
          .eq('id', sweep_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        // Analyze all findings
        const analysis = analyzeSweepFindings(sweep);

        const startedAt = sweep.started_at ? new Date(sweep.started_at).getTime() : Date.now();
        const durationMinutes = Math.round((Date.now() - startedAt) / 60000);

        const { error: updateError } = await supabase
          .from('tscm_sweeps')
          .update({
            threat_level: analysis.threatLevel,
            overall_findings: analysis.summary,
            recommendations: analysis.recommendations,
            sweep_duration_minutes: durationMinutes,
            completed_at: new Date().toISOString(),
          })
          .eq('id', sweep_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ 
          success: true, 
          analysis,
          duration_minutes: durationMinutes,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze-rf-environment': {
        const { captures } = await req.json() as { captures: Array<Record<string, unknown>> };

        const analysis = analyzeRFEnvironment(captures);

        return new Response(JSON.stringify({ success: true, analysis }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'detect-anomalies': {
        const { baseline_id, current_readings } = await req.json();

        // Get baseline if provided
        let baseline: Record<string, unknown> | null = null;
        if (baseline_id) {
          const { data } = await supabase
            .from('tscm_sweeps')
            .select('overall_findings')
            .eq('id', baseline_id)
            .eq('user_id', user.id)
            .single();
          baseline = data?.overall_findings || null;
        }

        const anomalies = detectAnomalies(baseline, current_readings);

        return new Response(JSON.stringify({ success: true, anomalies }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sweeps': {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        
        const { data: sweeps, error } = await supabase
          .from('tscm_sweeps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, sweeps }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'threat-protocols': {
        const protocols = getThreatProtocols();
        return new Response(JSON.stringify({ success: true, protocols }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate-report': {
        const { sweep_id } = await req.json();

        const { data: sweep, error } = await supabase
          .from('tscm_sweeps')
          .select('*')
          .eq('id', sweep_id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const report = generateTSCMReport(sweep);

        return new Response(JSON.stringify({ success: true, report }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('TSCM Intelligence error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSweepFindings(sweep: Record<string, unknown>) {
  const rfFindings = (sweep.rf_findings || []) as TSCMFinding[];
  const thermalFindings = (sweep.thermal_findings || []) as TSCMFinding[];
  const acousticFindings = (sweep.acoustic_findings || []) as TSCMFinding[];
  const visualFindings = (sweep.visual_findings || []) as TSCMFinding[];

  const allFindings = [...rfFindings, ...thermalFindings, ...acousticFindings, ...visualFindings];
  
  // Determine threat level
  const criticalCount = allFindings.filter(f => f.severity === 'critical').length;
  const highCount = allFindings.filter(f => f.severity === 'high').length;
  const mediumCount = allFindings.filter(f => f.severity === 'medium').length;

  let threatLevel: 'clear' | 'low' | 'medium' | 'high' | 'critical' = 'clear';
  if (criticalCount > 0) threatLevel = 'critical';
  else if (highCount > 0) threatLevel = 'high';
  else if (mediumCount > 0) threatLevel = 'medium';
  else if (allFindings.length > 0) threatLevel = 'low';

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (criticalCount > 0) {
    recommendations.push('IMMEDIATE: Cease sensitive communications in this area');
    recommendations.push('Engage professional TSCM team for physical inspection');
  }
  
  if (highCount > 0) {
    recommendations.push('Conduct physical inspection of flagged areas');
    recommendations.push('Consider RF shielding for sensitive discussions');
  }
  
  if (rfFindings.length > 0) {
    recommendations.push('Regular RF sweeps recommended for this location');
  }
  
  if (thermalFindings.length > 0) {
    recommendations.push('Investigate heat anomalies - possible concealed electronics');
  }

  if (allFindings.length === 0) {
    recommendations.push('No threats detected - maintain regular sweep schedule');
  }

  return {
    threatLevel,
    summary: {
      total_findings: allFindings.length,
      rf_findings: rfFindings.length,
      thermal_findings: thermalFindings.length,
      acoustic_findings: acousticFindings.length,
      visual_findings: visualFindings.length,
      critical_count: criticalCount,
      high_count: highCount,
      medium_count: mediumCount,
    },
    recommendations,
    analyzed_at: new Date().toISOString(),
  };
}

function analyzeRFEnvironment(captures: Array<Record<string, unknown>>) {
  const findings: TSCMFinding[] = [];
  
  // Look for suspicious patterns
  const frequencyMap = new Map<number, number>();
  
  for (const capture of captures) {
    const freq = capture.frequency_hz as number;
    const power = capture.signal_strength_dbm as number;
    
    frequencyMap.set(freq, (frequencyMap.get(freq) || 0) + 1);
    
    // Strong signal on unusual frequency
    if (power > -30 && !isKnownSafeFrequency(freq)) {
      findings.push({
        type: 'rf_anomaly',
        severity: power > -20 ? 'high' : 'medium',
        description: `Strong signal detected at ${(freq / 1000000).toFixed(3)} MHz (${power} dBm)`,
        frequency: freq,
        confidence: 0.8,
        recommendation: 'Physical inspection recommended to locate transmitter',
      });
    }
  }
  
  // Persistent signals
  for (const [freq, count] of frequencyMap.entries()) {
    if (count > captures.length * 0.8 && !isKnownSafeFrequency(freq)) {
      findings.push({
        type: 'persistent_signal',
        severity: 'medium',
        description: `Persistent signal at ${(freq / 1000000).toFixed(3)} MHz detected in ${count}/${captures.length} captures`,
        frequency: freq,
        confidence: 0.7,
        recommendation: 'Investigate source - possible surveillance device',
      });
    }
  }

  return {
    total_captures: captures.length,
    unique_frequencies: frequencyMap.size,
    findings,
    environment_risk: findings.length > 0 ? 
      (findings.some(f => f.severity === 'high') ? 'elevated' : 'moderate') : 'low',
  };
}

function isKnownSafeFrequency(freq: number): boolean {
  const safeRanges = [
    [87500000, 108000000],   // FM radio
    [2400000000, 2500000000], // WiFi 2.4GHz
    [5150000000, 5850000000], // WiFi 5GHz
  ];
  
  return safeRanges.some(([low, high]) => freq >= low && freq <= high);
}

function detectAnomalies(
  baseline: Record<string, unknown> | null, 
  currentReadings: Array<Record<string, unknown>>
) {
  const anomalies: Array<{
    type: string;
    description: string;
    severity: string;
    data: Record<string, unknown>;
  }> = [];

  // Without baseline, just check for obvious anomalies
  for (const reading of currentReadings) {
    const power = reading.power_dbm as number;
    const freq = reading.frequency_hz as number;

    // Unusually strong signal
    if (power > -25) {
      anomalies.push({
        type: 'strong_signal',
        description: `Unusually strong signal at ${(freq / 1000000).toFixed(2)} MHz`,
        severity: 'high',
        data: reading,
      });
    }
  }

  // With baseline, compare
  if (baseline) {
    const baselineFreqs = new Set(
      ((baseline.frequency_list || []) as number[])
    );
    
    for (const reading of currentReadings) {
      const freq = reading.frequency_hz as number;
      if (!baselineFreqs.has(freq)) {
        anomalies.push({
          type: 'new_frequency',
          description: `New frequency detected: ${(freq / 1000000).toFixed(2)} MHz (not in baseline)`,
          severity: 'medium',
          data: reading,
        });
      }
    }
  }

  return anomalies;
}

function getThreatProtocols() {
  return {
    critical: {
      name: 'CRITICAL - Active Surveillance Detected',
      steps: [
        'Immediately cease all sensitive communications',
        'Do not discuss the discovery openly',
        'Leave the area if possible',
        'Contact security team via secure channel',
        'Document device location without disturbing',
        'Engage professional TSCM team',
      ],
    },
    high: {
      name: 'HIGH - Suspicious Device or Signal',
      steps: [
        'Avoid sensitive discussions in affected area',
        'Conduct thorough physical inspection',
        'Document findings with photos/video',
        'Consider RF shielding measures',
        'Schedule professional sweep',
      ],
    },
    medium: {
      name: 'MEDIUM - Anomaly Detected',
      steps: [
        'Investigate source of anomaly',
        'Compare with baseline readings',
        'Check for new equipment or devices',
        'Monitor for pattern changes',
      ],
    },
    low: {
      name: 'LOW - Minor Irregularity',
      steps: [
        'Note in sweep log',
        'Monitor during next sweep',
        'No immediate action required',
      ],
    },
  };
}

function generateTSCMReport(sweep: Record<string, unknown>) {
  const rfFindings = sweep.rf_findings as TSCMFinding[] || [];
  const thermalFindings = sweep.thermal_findings as TSCMFinding[] || [];
  const overallFindings = sweep.overall_findings as Record<string, unknown> || {};
  const recommendations = sweep.recommendations as string[] || [];

  return {
    title: `TSCM Sweep Report - ${sweep.sweep_name || 'Unnamed Sweep'}`,
    generated_at: new Date().toISOString(),
    location: sweep.location_name || 'Unknown',
    sweep_type: sweep.sweep_type,
    duration_minutes: sweep.sweep_duration_minutes,
    threat_level: sweep.threat_level,
    executive_summary: generateExecutiveSummary(sweep),
    findings: {
      rf: rfFindings.map(f => ({
        ...f,
        frequency_mhz: f.frequency ? (f.frequency / 1000000).toFixed(3) : null,
      })),
      thermal: thermalFindings,
      acoustic: sweep.acoustic_findings || [],
      visual: sweep.visual_findings || [],
    },
    statistics: overallFindings,
    recommendations,
    methodology: 'Multi-spectrum analysis including RF (0-6GHz), thermal imaging, acoustic monitoring, and visual inspection.',
    disclaimer: 'This report represents findings at the time of sweep. Environment may change. Regular sweeps recommended.',
  };
}

function generateExecutiveSummary(sweep: Record<string, unknown>): string {
  const threatLevel = sweep.threat_level as string;
  const location = sweep.location_name as string || 'the target location';
  const overallFindings = sweep.overall_findings as Record<string, number> || {};
  
  if (threatLevel === 'clear') {
    return `A comprehensive TSCM sweep of ${location} revealed no evidence of surveillance devices or suspicious signals. The area is assessed as secure for sensitive communications.`;
  }
  
  if (threatLevel === 'critical' || threatLevel === 'high') {
    return `A TSCM sweep of ${location} detected ${overallFindings.total_findings || 'multiple'} findings requiring immediate attention. ${overallFindings.critical_count || overallFindings.high_count || 'Several'} high-priority threats were identified. Immediate action recommended per attached protocols.`;
  }
  
  return `A TSCM sweep of ${location} identified ${overallFindings.total_findings || 'some'} items for review. While no critical threats were detected, the findings warrant investigation before conducting sensitive activities.`;
}
