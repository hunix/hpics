import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FusionSource {
  type: 'rf' | 'thermal' | 'aerial' | 'sensor' | 'tscm' | 'sdr';
  device_id?: string;
  data: Record<string, unknown>;
}

interface FusionRequest {
  sources: FusionSource[];
  analysis_type?: 'threat' | 'pattern' | 'correlation' | 'comprehensive';
  location_context?: { latitude: number; longitude: number };
  timeframe_hours?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'hardware-intelligence-fusion', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Route handling
    if (path === 'analyze-patterns') {
      return await handlePatternAnalysis(req, supabase, user.id);
    } else if (path === 'threat-assessment') {
      return await handleThreatAssessment(req, supabase, user.id);
    } else {
      return await handleFusion(req, supabase, user.id);
    }
  } catch (error) {
    console.error('Hardware Intelligence Fusion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleFusion(req: Request, supabase: any, userId: string) {
  const body: FusionRequest = await req.json();
  const { sources, analysis_type = 'comprehensive', location_context, timeframe_hours = 24 } = body;

  // Fetch recent data from each source type
  const sourceData: Record<string, unknown[]> = {};
  const timeframeCutoff = new Date(Date.now() - timeframe_hours * 60 * 60 * 1000).toISOString();

  // Fetch RF captures
  if (sources.some(s => s.type === 'rf')) {
    const { data: rfData } = await supabase
      .from('rf_signal_captures')
      .select('*')
      .eq('user_id', userId)
      .gte('captured_at', timeframeCutoff)
      .limit(50);
    sourceData.rf = rfData || [];
  }

  // Fetch TSCM sweeps
  if (sources.some(s => s.type === 'tscm')) {
    const { data: tscmData } = await supabase
      .from('tscm_sweeps')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', timeframeCutoff)
      .limit(20);
    sourceData.tscm = tscmData || [];
  }

  // Fetch aerial captures
  if (sources.some(s => s.type === 'aerial')) {
    const { data: aerialData } = await supabase
      .from('aerial_captures')
      .select('*')
      .eq('user_id', userId)
      .gte('captured_at', timeframeCutoff)
      .limit(30);
    sourceData.aerial = aerialData || [];
  }

  // Fetch sensor readings
  if (sources.some(s => s.type === 'sensor')) {
    const { data: sensorData } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('user_id', userId)
      .gte('reading_at', timeframeCutoff)
      .limit(100);
    sourceData.sensor = sensorData || [];
  }

  // Fetch SDR signals
  if (sources.some(s => s.type === 'sdr')) {
    const { data: sdrData } = await supabase
      .from('sdr_signals')
      .select('*')
      .eq('user_id', userId)
      .gte('captured_at', timeframeCutoff)
      .limit(50);
    sourceData.sdr = sdrData || [];
  }

  // Prepare AI fusion prompt
  const fusionPrompt = `You are an advanced intelligence fusion analyst. Analyze the following multi-modal sensor data and identify:
1. Cross-source correlations
2. Temporal patterns
3. Spatial anomalies
4. Threat indicators
5. Actionable recommendations

Analysis Type: ${analysis_type}
${location_context ? `Location Context: ${JSON.stringify(location_context)}` : ''}

SOURCE DATA:
${JSON.stringify(sourceData, null, 2)}

Provide a structured JSON response with:
{
  "event_type": "multi_source_correlation" | "temporal_pattern" | "spatial_anomaly" | "behavioral_fusion" | "threat_synthesis" | "signal_convergence",
  "confidence_score": 0.0-1.0,
  "threat_level": "none" | "low" | "medium" | "high" | "critical",
  "priority": "low" | "medium" | "high" | "urgent",
  "fusion_result": {
    "summary": "string",
    "correlations": [],
    "anomalies": [],
    "patterns": []
  },
  "recommendations": [
    { "action": "string", "priority": "string", "rationale": "string" }
  ],
  "temporal_data": {
    "pattern_type": "string",
    "duration_seconds": number
  }
}`;

  // Call AI for fusion analysis
  const model = selectModel('balanced', 'google');
  const aiResponse = await callAI({
    model,
    messages: [
      { role: 'system', content: 'You are an intelligence fusion analyst. Always respond with valid JSON.' },
      { role: 'user', content: fusionPrompt }
    ],
    userId,
    functionName: 'hardware-intelligence-fusion',
    temperature: 0.3,
    maxTokens: 2000,
  });

  const fusionResult = parseAIJson(aiResponse.content);

  // Store fusion event
  const correlationId = `fusion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const fusionEvent = {
    user_id: userId,
    event_type: fusionResult.event_type || 'multi_source_correlation',
    correlation_id: correlationId,
    sources: sources.map(s => ({
      type: s.type,
      device_id: s.device_id,
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      data_summary: { count: sourceData[s.type]?.length || 0 }
    })),
    fusion_result: fusionResult.fusion_result || {},
    confidence_score: fusionResult.confidence_score || 0.7,
    threat_level: fusionResult.threat_level || 'none',
    priority: fusionResult.priority || 'medium',
    location_data: location_context || null,
    temporal_data: fusionResult.temporal_data || null,
    recommendations: fusionResult.recommendations || [],
    is_processed: false,
  };

  const { data: savedEvent, error: saveError } = await supabase
    .from('intelligence_fusion_events')
    .insert(fusionEvent)
    .select()
    .single();

  if (saveError) {
    console.error('Failed to save fusion event:', saveError);
  }

  // Create alert if threat level is high or critical
  if (fusionResult.threat_level === 'high' || fusionResult.threat_level === 'critical') {
    await supabase.from('hardware_alerts').insert({
      user_id: userId,
      alert_type: 'threat_identified',
      severity: fusionResult.threat_level,
      title: `Fusion Alert: ${fusionResult.event_type?.replace(/_/g, ' ')}`,
      description: fusionResult.fusion_result?.summary || 'Multi-source threat detected',
      source_data: { fusion_event_id: savedEvent?.id, correlation_id: correlationId },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      fusion_event: savedEvent,
      threat_level: fusionResult.threat_level,
      recommendations: fusionResult.recommendations,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePatternAnalysis(req: Request, supabase: any, userId: string) {
  const body = await req.json();
  const { timeframe_hours = 24 } = body;

  const timeframeCutoff = new Date(Date.now() - timeframe_hours * 60 * 60 * 1000).toISOString();

  // Fetch recent fusion events
  const { data: events } = await supabase
    .from('intelligence_fusion_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', timeframeCutoff)
    .order('created_at', { ascending: false });

  // Analyze patterns
  const patterns = [];
  
  // Group by event type
  const byType = (events || []).reduce((acc: Record<string, number>, e: any) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  for (const [type, count] of Object.entries(byType)) {
    if ((count as number) > 2) {
      patterns.push({
        type: 'recurring',
        description: `${type} detected ${count} times`,
        frequency: count,
        significance: (count as number) > 5 ? 'high' : 'medium',
      });
    }
  }

  // Threat escalation pattern
  const threatLevels = (events || []).map((e: any) => e.threat_level);
  const criticalCount = threatLevels.filter((t: string) => t === 'critical').length;
  const highCount = threatLevels.filter((t: string) => t === 'high').length;

  if (criticalCount > 0 || highCount > 2) {
    patterns.push({
      type: 'escalation',
      description: 'Elevated threat activity detected',
      critical_events: criticalCount,
      high_events: highCount,
      significance: 'critical',
    });
  }

  return new Response(
    JSON.stringify({ patterns }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleThreatAssessment(req: Request, supabase: any, userId: string) {
  // Fetch latest data points
  const [alertsRes, fusionRes, devicesRes] = await Promise.all([
    supabase
      .from('hardware_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('intelligence_fusion_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('hardware_devices')
      .select('*')
      .eq('user_id', userId),
  ]);

  const alerts = alertsRes.data || [];
  const fusions = fusionRes.data || [];
  const devices = devicesRes.data || [];

  // Calculate threat score
  const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length;
  const highAlerts = alerts.filter((a: any) => a.severity === 'high').length;
  const criticalFusions = fusions.filter((f: any) => f.threat_level === 'critical').length;
  const offlineDevices = devices.filter((d: any) => !d.is_online).length;

  const threatScore = Math.min(100,
    criticalAlerts * 30 +
    highAlerts * 15 +
    criticalFusions * 25 +
    offlineDevices * 5
  );

  let overallThreat: string;
  if (threatScore >= 80) overallThreat = 'critical';
  else if (threatScore >= 60) overallThreat = 'high';
  else if (threatScore >= 40) overallThreat = 'medium';
  else if (threatScore >= 20) overallThreat = 'low';
  else overallThreat = 'none';

  return new Response(
    JSON.stringify({
      threat_score: threatScore,
      overall_threat: overallThreat,
      breakdown: {
        critical_alerts: criticalAlerts,
        high_alerts: highAlerts,
        critical_fusions: criticalFusions,
        offline_devices: offlineDevices,
        total_devices: devices.length,
      },
      recommendations: threatScore >= 60 ? [
        'Review all unacknowledged alerts immediately',
        'Verify offline device status',
        'Consider initiating TSCM sweep',
      ] : [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
