import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BudgetSettings {
  daily_limit_cents: number | null;
  weekly_limit_cents: number | null;
  monthly_limit_cents: number | null;
  alert_threshold_percent: number | null;
}

interface BudgetStatus {
  currentSpend: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  dailyUsagePercent: number;
  weeklyUsagePercent: number;
  monthlyUsagePercent: number;
  warningLevel: 'none' | 'approaching' | 'critical' | 'exceeded';
}

export function AIBudgetWarning() {
  const [dismissed, setDismissed] = useState(false);

  const { data: budgetStatus } = useQuery<BudgetStatus | null>({
    queryKey: ['ai-budget-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get budget settings using raw query since table is new
      const { data: settingsData, error } = await supabase
        .rpc('get_user_budget_settings' as any, { p_user_id: user.id })
        .maybeSingle();

      // Fallback to direct query with type bypass
      let settings: BudgetSettings | null = null;
      if (!settingsData && !error) {
        const result = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/ai_budget_settings?user_id=eq.${user.id}&select=daily_limit_cents,weekly_limit_cents,monthly_limit_cents,alert_threshold_percent`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        );
        const data = await result.json();
        settings = data?.[0] || null;
      } else {
        settings = settingsData as BudgetSettings | null;
      }

      if (!settings) return null;

      // Get current usage
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const startOfWeek = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: usage } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth);

      if (!usage) return null;

      const dailySpend = usage
        .filter(u => u.created_at >= startOfDay)
        .reduce((sum, u) => sum + (u.actual_cost_cents || 0), 0);

      const weeklySpend = usage
        .filter(u => u.created_at >= startOfWeek)
        .reduce((sum, u) => sum + (u.actual_cost_cents || 0), 0);

      const monthlySpend = usage
        .reduce((sum, u) => sum + (u.actual_cost_cents || 0), 0);

      const dailyUsagePercent = settings.daily_limit_cents 
        ? (dailySpend / settings.daily_limit_cents) * 100 
        : 0;
      const weeklyUsagePercent = settings.weekly_limit_cents 
        ? (weeklySpend / settings.weekly_limit_cents) * 100 
        : 0;
      const monthlyUsagePercent = settings.monthly_limit_cents 
        ? (monthlySpend / settings.monthly_limit_cents) * 100 
        : 0;

      const maxPercent = Math.max(dailyUsagePercent, weeklyUsagePercent, monthlyUsagePercent);
      const threshold = settings.alert_threshold_percent || 75;

      let warningLevel: BudgetStatus['warningLevel'] = 'none';
      if (maxPercent >= 100) warningLevel = 'exceeded';
      else if (maxPercent >= 90) warningLevel = 'critical';
      else if (maxPercent >= threshold) warningLevel = 'approaching';

      return {
        currentSpend: monthlySpend,
        dailyLimit: settings.daily_limit_cents,
        weeklyLimit: settings.weekly_limit_cents,
        monthlyLimit: settings.monthly_limit_cents,
        dailyUsagePercent,
        weeklyUsagePercent,
        monthlyUsagePercent,
        warningLevel,
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  useEffect(() => {
    if (budgetStatus?.warningLevel === 'exceeded') {
      toast.error("AI budget limit exceeded", {
        description: "Some AI features may be unavailable until the limit resets.",
        duration: 10000,
      });
    } else if (budgetStatus?.warningLevel === 'critical') {
      toast.warning("AI budget at 90%+", {
        description: "You're approaching your AI usage limit.",
        duration: 5000,
      });
    }
  }, [budgetStatus?.warningLevel]);

  if (!budgetStatus || budgetStatus.warningLevel === 'none' || dismissed) {
    return null;
  }

  const getAlertVariant = () => {
    if (budgetStatus.warningLevel === 'exceeded') return 'destructive';
    return 'default';
  };

  const getIcon = () => {
    if (budgetStatus.warningLevel === 'exceeded') return <XCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getMessage = () => {
    const maxPercent = Math.max(
      budgetStatus.dailyUsagePercent,
      budgetStatus.weeklyUsagePercent,
      budgetStatus.monthlyUsagePercent
    );
    
    if (budgetStatus.warningLevel === 'exceeded') {
      return "You've exceeded your AI usage limit. Some features may be unavailable.";
    }
    if (budgetStatus.warningLevel === 'critical') {
      return `You've used over 90% of your AI budget (${maxPercent.toFixed(0)}%).`;
    }
    return `You've used ${maxPercent.toFixed(0)}% of your AI budget.`;
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      {getIcon()}
      <AlertTitle className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        AI Budget Warning
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
