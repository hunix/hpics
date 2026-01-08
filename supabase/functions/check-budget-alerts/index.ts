import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetStatus {
  period: 'daily' | 'weekly' | 'monthly';
  spent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
  isNearLimit: boolean; // > 90%
}

interface BudgetCheckResult {
  userId: string;
  budgets: BudgetStatus[];
  alertsSent: string[];
  wouldExceed: boolean;
  exceedingPeriod: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    
    // Parse request body
    let userId: string | null = null;
    let estimatedCostCents = 0;
    let checkOnly = false;

    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        userId = parsed.userId;
        estimatedCostCents = parsed.estimatedCostCents || 0;
        checkOnly = parsed.checkOnly || false;
      }
    } catch {
      // No body or invalid JSON
    }

    // If no userId provided, try to get from auth header
    if (!userId && authHeader) {
      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData } = await (authClient.auth as any).getClaims(token);
      userId = claimsData?.claims?.sub;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's budget settings from user_preferences (single source of truth)
    const { data: settings } = await supabase
      .from('user_preferences')
      .select('ai_budget_daily_cents, ai_budget_weekly_cents, ai_budget_monthly_cents, ai_budget_alerts_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const dailyBudget = settings?.ai_budget_daily_cents || 500; // Default 500 cents = $5
    const weeklyBudget = settings?.ai_budget_weekly_cents || 2000; // Default $20
    const monthlyBudget = settings?.ai_budget_monthly_cents || 5000; // Default $50
    const alertsEnabled = settings?.ai_budget_alerts_enabled ?? true;

    // Calculate current spending for each period
    const now = new Date();
    
    // Daily
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    // Weekly (Sunday start)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    // Monthly
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyResult, weeklyResult, monthlyResult] = await Promise.all([
      supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .eq('user_id', userId)
        .gte('created_at', dayStart.toISOString())
        .eq('status', 'completed'),
      supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .eq('status', 'completed'),
      supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
        .eq('status', 'completed'),
    ]);

    const dailySpent = (dailyResult.data || []).reduce((sum, r) => sum + (r.actual_cost_cents || 0), 0);
    const weeklySpent = (weeklyResult.data || []).reduce((sum, r) => sum + (r.actual_cost_cents || 0), 0);
    const monthlySpent = (monthlyResult.data || []).reduce((sum, r) => sum + (r.actual_cost_cents || 0), 0);

    const budgets: BudgetStatus[] = [
      {
        period: 'daily',
        spent: dailySpent,
        budget: dailyBudget,
        remaining: Math.max(0, dailyBudget - dailySpent),
        percentUsed: dailyBudget > 0 ? (dailySpent / dailyBudget) * 100 : 0,
        isOver: dailySpent >= dailyBudget,
        isNearLimit: dailySpent >= dailyBudget * 0.9,
      },
      {
        period: 'weekly',
        spent: weeklySpent,
        budget: weeklyBudget,
        remaining: Math.max(0, weeklyBudget - weeklySpent),
        percentUsed: weeklyBudget > 0 ? (weeklySpent / weeklyBudget) * 100 : 0,
        isOver: weeklySpent >= weeklyBudget,
        isNearLimit: weeklySpent >= weeklyBudget * 0.9,
      },
      {
        period: 'monthly',
        spent: monthlySpent,
        budget: monthlyBudget,
        remaining: Math.max(0, monthlyBudget - monthlySpent),
        percentUsed: monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0,
        isOver: monthlySpent >= monthlyBudget,
        isNearLimit: monthlySpent >= monthlyBudget * 0.9,
      },
    ];

    // Check if estimated cost would exceed any budget
    let wouldExceed = false;
    let exceedingPeriod: string | null = null;

    if (estimatedCostCents > 0) {
      for (const budget of budgets) {
        if (budget.spent + estimatedCostCents > budget.budget) {
          wouldExceed = true;
          exceedingPeriod = budget.period;
          break;
        }
      }
    }

    // Send alerts if needed (and not just checking)
    const alertsSent: string[] = [];
    
    if (alertsEnabled && !checkOnly) {
      for (const budget of budgets) {
        if (budget.isOver) {
          // Budget exceeded - could trigger notification here
          alertsSent.push(`${budget.period}_exceeded`);
          console.log(`Budget alert: ${userId} exceeded ${budget.period} budget (${budget.percentUsed.toFixed(1)}%)`);
        } else if (budget.isNearLimit) {
          alertsSent.push(`${budget.period}_near_limit`);
          console.log(`Budget warning: ${userId} near ${budget.period} limit (${budget.percentUsed.toFixed(1)}%)`);
        }
      }

      // Store alert records if any were triggered
      if (alertsSent.length > 0) {
        await supabase.from('contact_activity_feed').insert({
          user_id: userId,
          activity_type: 'budget_alert',
          title: 'AI Budget Alert',
          description: `Budget alerts triggered: ${alertsSent.join(', ')}`,
          metadata: { budgets, alertsSent },
        });
      }
    }

    const result: BudgetCheckResult = {
      userId,
      budgets,
      alertsSent,
      wouldExceed,
      exceedingPeriod,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-budget-alerts:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
