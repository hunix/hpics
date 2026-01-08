import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyResult {
  type: 'spike' | 'unusual_model' | 'high_volume' | 'cost_surge';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  value: number;
  threshold: number;
  function_name?: string;
  model_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anomalies: AnomalyResult[] = [];

    // Get last 7 days of usage data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentUsage } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!recentUsage || recentUsage.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        anomalies: [],
        message: 'No recent usage data to analyze',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get historical baseline (previous 30 days, excluding last 7)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historicalUsage } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    // Calculate daily averages
    const recentDailySpend: Record<string, number> = {};
    recentUsage.forEach(log => {
      const day = log.created_at.split('T')[0];
      recentDailySpend[day] = (recentDailySpend[day] || 0) + (log.actual_cost_cents || 0);
    });

    const historicalDailySpend: Record<string, number> = {};
    historicalUsage?.forEach(log => {
      const day = log.created_at.split('T')[0];
      historicalDailySpend[day] = (historicalDailySpend[day] || 0) + (log.actual_cost_cents || 0);
    });

    const historicalDays = Object.values(historicalDailySpend);
    const avgHistoricalDaily = historicalDays.length > 0 
      ? historicalDays.reduce((a, b) => a + b, 0) / historicalDays.length 
      : 0;
    const stdHistorical = historicalDays.length > 1
      ? Math.sqrt(historicalDays.reduce((sum, val) => sum + Math.pow(val - avgHistoricalDaily, 2), 0) / historicalDays.length)
      : avgHistoricalDaily * 0.3;

    // Detect daily cost spikes
    Object.entries(recentDailySpend).forEach(([day, spend]) => {
      const threshold = avgHistoricalDaily + (stdHistorical * 2);
      if (spend > threshold && spend > 100) { // At least $1
        const severity = spend > avgHistoricalDaily * 5 ? 'high' : spend > avgHistoricalDaily * 3 ? 'medium' : 'low';
        anomalies.push({
          type: 'spike',
          severity,
          title: `Cost spike on ${day}`,
          description: `Daily spend of $${(spend / 100).toFixed(2)} exceeds normal average of $${(avgHistoricalDaily / 100).toFixed(2)}`,
          value: spend,
          threshold,
        });
      }
    });

    // Detect unusual model usage
    const modelUsage: Record<string, number> = {};
    recentUsage.forEach(log => {
      modelUsage[log.model_name] = (modelUsage[log.model_name] || 0) + (log.actual_cost_cents || 0);
    });

    const premiumModels = ['google/gemini-2.5-pro', 'google/gemini-3-pro-preview', 'openai/gpt-5'];
    premiumModels.forEach(model => {
      const spend = modelUsage[model] || 0;
      if (spend > 500) { // More than $5 on premium model
        anomalies.push({
          type: 'unusual_model',
          severity: spend > 2000 ? 'high' : 'medium',
          title: `High premium model usage`,
          description: `$${(spend / 100).toFixed(2)} spent on ${model.split('/')[1]} this week`,
          value: spend,
          threshold: 500,
          model_name: model,
        });
      }
    });

    // Detect high-volume function usage
    const functionUsage: Record<string, { count: number; cost: number }> = {};
    recentUsage.forEach(log => {
      if (!functionUsage[log.function_name]) {
        functionUsage[log.function_name] = { count: 0, cost: 0 };
      }
      functionUsage[log.function_name].count++;
      functionUsage[log.function_name].cost += log.actual_cost_cents || 0;
    });

    Object.entries(functionUsage).forEach(([fn, data]) => {
      if (data.count > 100 && data.cost > 200) { // High volume + significant cost
        anomalies.push({
          type: 'high_volume',
          severity: data.count > 500 ? 'high' : 'medium',
          title: `High-volume function: ${fn}`,
          description: `${data.count} calls costing $${(data.cost / 100).toFixed(2)} this week`,
          value: data.count,
          threshold: 100,
          function_name: fn,
        });
      }
    });

    // Store anomalies in database
    if (anomalies.length > 0) {
      const alertsToInsert = anomalies.map(a => ({
        user_id: user.id,
        alert_type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        metric_value: a.value,
        threshold_value: a.threshold,
        function_name: a.function_name || null,
        model_name: a.model_name || null,
        detected_at: new Date().toISOString(),
        is_acknowledged: false,
      }));

      await supabase.from('cost_anomaly_alerts').insert(alertsToInsert);
    }

    return new Response(JSON.stringify({
      success: true,
      anomalies,
      summary: {
        total_anomalies: anomalies.length,
        high_severity: anomalies.filter(a => a.severity === 'high').length,
        recent_spend_cents: Object.values(recentDailySpend).reduce((a, b) => a + b, 0),
        avg_historical_daily_cents: Math.round(avgHistoricalDaily),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cost anomaly detection error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
