import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpportunityContext {
  signals: any[];
  events: any[];
  sentiment: any;
  correlations: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'investment-opportunity-predictor', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, assetClass, sector, riskTolerance = 'medium', timeHorizon = 'medium' } = await req.json();

    switch (action) {
      case 'generate_opportunities':
        return await generateOpportunities(supabase, user.id, lovableApiKey, { assetClass, sector, riskTolerance, timeHorizon });
      
      case 'get_active_opportunities':
        return await getActiveOpportunities(supabase, user.id, { assetClass, sector, riskTolerance });
      
      case 'get_dashboard_data':
        return await getDashboardData(supabase, user.id);
      
      case 'record_outcome':
        const { opportunityId, outcome } = await req.json();
        return await recordOutcome(supabase, user.id, opportunityId, outcome);
      
      case 'get_historical_accuracy':
        return await getHistoricalAccuracy(supabase, user.id);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Investment predictor error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherContext(supabase: any, userId: string): Promise<OpportunityContext> {
  // Get active signals
  const { data: signals } = await supabase
    .from('news_signals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('signal_strength', { ascending: false })
    .limit(30);

  // Get ongoing geopolitical events
  const { data: events } = await supabase
    .from('geopolitical_events')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['ongoing', 'escalating', 'developing'])
    .order('opportunity_score', { ascending: false })
    .limit(20);

  // Get latest sentiment snapshot
  const { data: sentiment } = await supabase
    .from('market_sentiment_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  // Get recent high-confidence correlations
  const { data: correlations } = await supabase
    .from('news_correlations')
    .select('*')
    .eq('user_id', userId)
    .gte('correlation_confidence', 0.7)
    .order('combined_impact_score', { ascending: false })
    .limit(20);

  return {
    signals: signals || [],
    events: events || [],
    sentiment,
    correlations: correlations || [],
  };
}

async function generateOpportunities(
  supabase: any,
  userId: string,
  apiKey: string | undefined,
  options: { assetClass?: string; sector?: string; riskTolerance: string; timeHorizon: string }
) {
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'AI API key required for opportunity generation' 
    }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  const context = await gatherContext(supabase, userId);
  
  if (context.signals.length === 0 && context.events.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No signals or events to generate opportunities from. Run the news intelligence pipeline first.',
      count: 0 
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  const riskMapping: Record<string, string> = {
    low: 'Conservative approach, prioritize capital preservation, avoid high-volatility assets',
    medium: 'Balanced approach, moderate risk for moderate returns',
    high: 'Aggressive approach, accept higher volatility for potentially higher returns',
  };

  const timeMapping: Record<string, string> = {
    immediate: 'Day trading opportunities, 0-48 hours',
    short: 'Swing trades, 1-7 days',
    medium: 'Position trades, 1-4 weeks',
    long: 'Investment positions, 1-6 months',
  };

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an elite quantitative investment strategist with expertise in:
- Macro-economic analysis and geopolitical risk assessment
- Multi-asset portfolio construction
- Technical and fundamental analysis
- Alternative data interpretation
- Risk management and position sizing

Generate investment opportunities based on the provided market intelligence. Consider:
1. Signal strength and multi-source confirmation
2. Geopolitical implications and sector correlations
3. Market sentiment and fear/greed indicators
4. Risk/reward optimization for the given risk tolerance
5. Time horizon alignment

Risk profile: ${riskMapping[options.riskTolerance]}
Time horizon: ${timeMapping[options.timeHorizon]}
${options.assetClass ? `Focus on: ${options.assetClass}` : 'Consider all asset classes'}
${options.sector ? `Sector focus: ${options.sector}` : ''}`
          },
          {
            role: 'user',
            content: `Generate investment opportunities from this market intelligence:

ACTIVE SIGNALS:
${JSON.stringify(context.signals.slice(0, 15), null, 2)}

GEOPOLITICAL EVENTS:
${JSON.stringify(context.events.slice(0, 10), null, 2)}

MARKET SENTIMENT:
${JSON.stringify(context.sentiment, null, 2)}

NEWS CORRELATIONS:
${JSON.stringify(context.correlations.slice(0, 10), null, 2)}

Generate actionable investment opportunities with specific entry points, targets, and risk management.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_opportunities',
            description: 'Generate investment opportunities',
            parameters: {
              type: 'object',
              properties: {
                opportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      opportunity_type: { type: 'string', enum: ['trade', 'investment', 'hedge', 'arbitrage'] },
                      asset_class: { type: 'string', enum: ['stocks', 'crypto', 'commodities', 'forex', 'bonds', 'etf'] },
                      asset_identifier: { type: 'string' },
                      sector: { type: 'string' },
                      action: { type: 'string', enum: ['buy', 'sell', 'short', 'hedge', 'accumulate'] },
                      urgency: { type: 'string', enum: ['immediate', 'this_week', 'this_month', 'monitor'] },
                      conviction_level: { type: 'string', enum: ['high', 'medium', 'low'] },
                      entry_price_suggestion: { type: 'number' },
                      target_price: { type: 'number' },
                      stop_loss: { type: 'number' },
                      expected_roi_pct: { type: 'number' },
                      time_horizon_days: { type: 'number' },
                      risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'extreme'] },
                      max_drawdown_pct: { type: 'number' },
                      risk_factors: { type: 'array', items: { type: 'string' } },
                      thesis: { type: 'string' },
                      supporting_signal_ids: { type: 'array', items: { type: 'string' } },
                      supporting_event_ids: { type: 'array', items: { type: 'string' } },
                      confidence_score: { type: 'number' },
                      source_agreement_score: { type: 'number' },
                      catalysts: { type: 'array', items: { type: 'string' } },
                      counter_thesis: { type: 'string' }
                    },
                    required: ['title', 'description', 'opportunity_type', 'asset_class', 'action', 'urgency', 'risk_level', 'thesis', 'confidence_score']
                  }
                }
              },
              required: ['opportunities']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_opportunities' } }
      }),
    });

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall) {
      const opportunities = JSON.parse(toolCall.function.arguments).opportunities;

      const toInsert = opportunities.map((o: any) => ({
        user_id: userId,
        title: o.title,
        description: o.description,
        opportunity_type: o.opportunity_type,
        asset_class: o.asset_class,
        asset_identifier: o.asset_identifier,
        sector: o.sector,
        action: o.action,
        urgency: o.urgency,
        conviction_level: o.conviction_level,
        entry_price_suggestion: o.entry_price_suggestion,
        target_price: o.target_price,
        stop_loss: o.stop_loss,
        expected_roi_pct: o.expected_roi_pct,
        time_horizon_days: o.time_horizon_days,
        risk_level: o.risk_level,
        max_drawdown_pct: o.max_drawdown_pct,
        risk_factors: o.risk_factors || [],
        thesis: o.thesis,
        supporting_signals: o.supporting_signal_ids,
        supporting_events: o.supporting_event_ids,
        ai_reasoning: {
          catalysts: o.catalysts,
          counter_thesis: o.counter_thesis,
          source_agreement: o.source_agreement_score,
        },
        confidence_score: o.confidence_score,
        source_agreement_score: o.source_agreement_score,
        status: 'pending',
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + (o.time_horizon_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data, error } = await supabase
        .from('investment_opportunities')
        .insert(toInsert)
        .select();

      if (error) {
        console.error('Insert opportunities error:', error);
      }

      return new Response(JSON.stringify({
        success: true,
        count: data?.length || 0,
        opportunities: data,
      }), {
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Opportunity generation error:', e);
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'Opportunity generation failed',
  }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function getActiveOpportunities(
  supabase: any,
  userId: string,
  filters: { assetClass?: string; sector?: string; riskTolerance?: string }
) {
  let query = supabase
    .from('investment_opportunities')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'active'])
    .gte('valid_until', new Date().toISOString())
    .order('confidence_score', { ascending: false });

  if (filters.assetClass) {
    query = query.eq('asset_class', filters.assetClass);
  }
  if (filters.sector) {
    query = query.eq('sector', filters.sector);
  }
  if (filters.riskTolerance) {
    const riskMap: Record<string, string[]> = {
      low: ['low'],
      medium: ['low', 'medium'],
      high: ['low', 'medium', 'high'],
    };
    query = query.in('risk_level', riskMap[filters.riskTolerance] || ['low', 'medium']);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('Fetch opportunities error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch opportunities' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    opportunities: data,
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function getDashboardData(supabase: any, userId: string) {
  // Get opportunities summary
  const { data: opportunities } = await supabase
    .from('investment_opportunities')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'active'])
    .gte('valid_until', new Date().toISOString())
    .order('confidence_score', { ascending: false })
    .limit(20);

  // Get active signals summary
  const { data: signals } = await supabase
    .from('news_signals')
    .select('asset_class, signal_type, signal_strength, confidence_score')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('signal_strength', { ascending: false })
    .limit(30);

  // Get geopolitical events
  const { data: events } = await supabase
    .from('geopolitical_events')
    .select('event_name, event_type, status, severity_level, opportunity_score, risk_score')
    .eq('user_id', userId)
    .in('status', ['ongoing', 'escalating', 'developing'])
    .order('opportunity_score', { ascending: false })
    .limit(10);

  // Get latest sentiment
  const { data: sentiment } = await supabase
    .from('market_sentiment_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  // Aggregate statistics
  const stats = {
    totalOpportunities: opportunities?.length || 0,
    highConviction: opportunities?.filter((o: any) => o.conviction_level === 'high').length || 0,
    urgentOpportunities: opportunities?.filter((o: any) => o.urgency === 'immediate').length || 0,
    activeSignals: signals?.length || 0,
    buySignals: signals?.filter((s: any) => s.signal_type === 'buy').length || 0,
    sellSignals: signals?.filter((s: any) => s.signal_type === 'sell').length || 0,
    ongoingEvents: events?.length || 0,
    criticalEvents: events?.filter((e: any) => e.severity_level === 'critical').length || 0,
    overallSentiment: sentiment?.overall_sentiment || 0,
    fearGreedIndex: sentiment?.overall_fear_greed || 0.5,
  };

  // Asset class breakdown
  const assetBreakdown: Record<string, number> = {};
  for (const opp of opportunities || []) {
    assetBreakdown[opp.asset_class] = (assetBreakdown[opp.asset_class] || 0) + 1;
  }

  // Sector heat map
  const sectorHeat: Record<string, { opportunities: number; avgConfidence: number }> = {};
  for (const opp of opportunities || []) {
    if (opp.sector) {
      if (!sectorHeat[opp.sector]) {
        sectorHeat[opp.sector] = { opportunities: 0, avgConfidence: 0 };
      }
      sectorHeat[opp.sector].opportunities++;
      sectorHeat[opp.sector].avgConfidence += opp.confidence_score || 0;
    }
  }
  for (const sector of Object.keys(sectorHeat)) {
    sectorHeat[sector].avgConfidence /= sectorHeat[sector].opportunities;
  }

  return new Response(JSON.stringify({
    success: true,
    stats,
    opportunities: opportunities?.slice(0, 10),
    signals: signals?.slice(0, 10),
    events,
    sentiment,
    assetBreakdown,
    sectorHeat,
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function recordOutcome(supabase: any, userId: string, opportunityId: string, outcome: any) {
  const { error } = await supabase
    .from('investment_opportunities')
    .update({
      status: 'executed',
      actioned_at: new Date().toISOString(),
      outcome,
    })
    .eq('id', opportunityId)
    .eq('user_id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to record outcome' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

async function getHistoricalAccuracy(supabase: any, userId: string) {
  const { data: executed } = await supabase
    .from('investment_opportunities')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'executed')
    .not('outcome', 'is', null)
    .order('actioned_at', { ascending: false })
    .limit(100);

  if (!executed?.length) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No executed opportunities with outcomes recorded',
      accuracy: null,
    }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  let wins = 0;
  let totalROI = 0;
  const byAssetClass: Record<string, { wins: number; total: number }> = {};

  for (const opp of executed) {
    const roi = opp.outcome?.actual_roi_pct || 0;
    const isWin = roi > 0;
    
    if (isWin) wins++;
    totalROI += roi;

    if (!byAssetClass[opp.asset_class]) {
      byAssetClass[opp.asset_class] = { wins: 0, total: 0 };
    }
    byAssetClass[opp.asset_class].total++;
    if (isWin) byAssetClass[opp.asset_class].wins++;
  }

  return new Response(JSON.stringify({
    success: true,
    totalExecuted: executed.length,
    winRate: wins / executed.length,
    averageROI: totalROI / executed.length,
    byAssetClass: Object.fromEntries(
      Object.entries(byAssetClass).map(([k, v]) => [k, { ...v, winRate: v.wins / v.total }])
    ),
    recentOutcomes: executed.slice(0, 10).map((o: any) => ({
      title: o.title,
      asset: o.asset_identifier,
      expectedROI: o.expected_roi_pct,
      actualROI: o.outcome?.actual_roi_pct,
      confidence: o.confidence_score,
    })),
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
