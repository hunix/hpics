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
    return new Response(JSON.stringify({ ok: true, function: 'economic-warfare-detector', timestamp: Date.now() }), 
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

    const { action, threatDetails, profileId } = body;

    switch (action) {
      case 'analyze_threat': {
        const analysis = analyzeEconomicThreat(threatDetails);

        // Store assessment
        const { data, error } = await supabase
          .from('economic_threat_assessments')
          .insert({
            user_id: userId,
            profile_id: profileId,
            threat_type: analysis.threatType,
            threat_vector: analysis.threatVector,
            severity_score: analysis.severityScore,
            financial_exposure: analysis.financialExposure,
            timeline_urgency: analysis.timelineUrgency,
            attack_indicators: analysis.indicators,
            countermeasures: analysis.countermeasures,
            status: 'active'
          })
          .select()
          .single();

        if (error) console.error('Insert error:', error);

        return new Response(JSON.stringify({ success: true, analysis, assessmentId: data?.id }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_assessments': {
        const { data } = await supabase
          .from('economic_threat_assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        const summary = generateThreatSummary(data || []);

        return new Response(JSON.stringify({ success: true, assessments: data, summary }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'monitor_indicators': {
        const indicators = detectEconomicWarfareIndicators(body.signals);

        return new Response(JSON.stringify({ success: true, indicators }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Economic warfare detector error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function analyzeEconomicThreat(details: any): any {
  if (!details) {
    return {
      threatType: 'unknown',
      threatVector: 'unidentified',
      severityScore: 0,
      financialExposure: { low: 0, high: 0 },
      timelineUrgency: 'low',
      indicators: [],
      countermeasures: ['Establish baseline monitoring']
    };
  }

  const description = (details.description || '').toLowerCase();
  
  // Determine threat type
  let threatType = 'general_economic';
  if (/market manipulation|stock|share price/i.test(description)) threatType = 'market_manipulation';
  else if (/supplier|supply chain|vendor/i.test(description)) threatType = 'supply_chain_attack';
  else if (/bank|credit|loan|financing/i.test(description)) threatType = 'financial_exclusion';
  else if (/employee|talent|recruit|poach/i.test(description)) threatType = 'talent_warfare';
  else if (/contract|client|customer/i.test(description)) threatType = 'client_interference';
  else if (/price|undercutting|dumping/i.test(description)) threatType = 'predatory_pricing';

  // Determine vector
  const threatVector = details.vector || determineVector(threatType);

  // Calculate severity
  let severityScore = 30;
  if (details.confirmed) severityScore += 30;
  if (details.financialImpact === 'high') severityScore += 25;
  if (details.adversaryResources === 'high') severityScore += 15;

  // Financial exposure
  const financialExposure = estimateFinancialExposure(threatType, details);

  // Timeline urgency
  const timelineUrgency = details.immediateImpact ? 'critical' : 
    severityScore >= 70 ? 'high' : severityScore >= 40 ? 'medium' : 'low';

  // Generate countermeasures
  const countermeasures = generateCountermeasures(threatType, severityScore);

  return {
    threatType,
    threatVector,
    severityScore: Math.min(100, severityScore),
    financialExposure,
    timelineUrgency,
    indicators: extractIndicators(details),
    countermeasures
  };
}

function determineVector(threatType: string): string {
  const vectors: Record<string, string> = {
    'market_manipulation': 'financial_markets',
    'supply_chain_attack': 'vendor_network',
    'financial_exclusion': 'banking_system',
    'talent_warfare': 'human_resources',
    'client_interference': 'customer_base',
    'predatory_pricing': 'market_competition'
  };
  return vectors[threatType] || 'general';
}

function estimateFinancialExposure(threatType: string, details: any): any {
  const baseExposures: Record<string, [number, number]> = {
    'market_manipulation': [100000, 10000000],
    'supply_chain_attack': [50000, 5000000],
    'financial_exclusion': [25000, 2500000],
    'talent_warfare': [75000, 3000000],
    'client_interference': [50000, 5000000],
    'predatory_pricing': [100000, 10000000]
  };

  const [low, high] = baseExposures[threatType] || [10000, 1000000];
  
  return {
    low,
    high,
    currency: 'USD',
    confidence: details.confirmed ? 0.8 : 0.4
  };
}

function extractIndicators(details: any): string[] {
  const indicators: string[] = [];
  
  if (details.unusualActivity) indicators.push('Unusual competitive activity detected');
  if (details.coordinatedBehavior) indicators.push('Coordinated adversarial behavior');
  if (details.insiderActivity) indicators.push('Potential insider involvement');
  if (details.publicSignals) indicators.push('Public signals of economic action');
  
  return indicators;
}

function generateCountermeasures(threatType: string, severity: number): string[] {
  const measures: string[] = [];

  // Universal measures
  measures.push('Document all threat indicators and evidence');
  measures.push('Brief key stakeholders on threat landscape');

  // Type-specific measures
  switch (threatType) {
    case 'market_manipulation':
      measures.push('Engage securities counsel');
      measures.push('Prepare investor communications');
      measures.push('Monitor trading patterns');
      break;
    case 'supply_chain_attack':
      measures.push('Identify alternative suppliers');
      measures.push('Increase inventory buffers');
      measures.push('Audit vendor security');
      break;
    case 'financial_exclusion':
      measures.push('Diversify banking relationships');
      measures.push('Establish alternative financing');
      measures.push('Document discriminatory actions');
      break;
    case 'talent_warfare':
      measures.push('Review retention packages');
      measures.push('Strengthen non-compete enforcement');
      measures.push('Accelerate succession planning');
      break;
    case 'client_interference':
      measures.push('Strengthen client relationships');
      measures.push('Diversify revenue base');
      measures.push('Document tortious interference');
      break;
  }

  if (severity >= 70) {
    measures.push('Consider legal action');
    measures.push('Engage crisis management team');
  }

  return measures;
}

function generateThreatSummary(assessments: any[]): any {
  const active = assessments.filter(a => a.status === 'active');
  const byType: Record<string, number> = {};
  let totalExposure = 0;

  assessments.forEach(a => {
    byType[a.threat_type] = (byType[a.threat_type] || 0) + 1;
    if (a.financial_exposure?.high) {
      totalExposure += a.financial_exposure.high;
    }
  });

  return {
    totalThreats: assessments.length,
    activeThreats: active.length,
    byType,
    totalFinancialExposure: totalExposure,
    criticalThreats: assessments.filter(a => a.severity_score >= 70).length
  };
}

function detectEconomicWarfareIndicators(signals: any): any {
  if (!signals) return { detected: false, indicators: [] };

  const indicators: any[] = [];

  if (signals.competitorActivity) {
    indicators.push({
      type: 'competitive_intelligence',
      description: 'Unusual competitor activity detected',
      severity: 'medium'
    });
  }

  if (signals.vendorIssues) {
    indicators.push({
      type: 'supply_chain',
      description: 'Supply chain disruption indicators',
      severity: 'high'
    });
  }

  if (signals.financingChanges) {
    indicators.push({
      type: 'financial_access',
      description: 'Changes in financing availability',
      severity: 'high'
    });
  }

  return {
    detected: indicators.length > 0,
    indicators,
    overallRisk: indicators.some(i => i.severity === 'high') ? 'elevated' : 'normal'
  };
}
