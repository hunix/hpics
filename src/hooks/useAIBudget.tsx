import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

interface BudgetStatus {
  daily: { spent: number; budget: number | null; remaining: number | null; isOver: boolean };
  weekly: { spent: number; budget: number | null; remaining: number | null; isOver: boolean };
  monthly: { spent: number; budget: number | null; remaining: number | null; isOver: boolean };
  alertsEnabled: boolean;
  wouldExceedBudget: (estimatedCostCents: number) => { exceeds: boolean; period: string | null };
}

export function useAIBudget(): BudgetStatus & { isLoading: boolean } {
  const { user } = useAuth();

  const { data: preferences } = useQuery({
    queryKey: ['user-preferences-budget', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('ai_budget_daily_limit_cents, ai_budget_weekly_limit_cents, ai_budget_monthly_limit_cents, ai_budget_alerts_enabled')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: spending, isLoading } = useQuery({
    queryKey: ['ai-spending-current', user?.id],
    queryFn: async () => {
      const now = new Date();
      const dayStart = startOfDay(now).toISOString();
      const dayEnd = endOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        supabase
          .from('ai_usage_logs')
          .select('actual_cost_cents')
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd),
        supabase
          .from('ai_usage_logs')
          .select('actual_cost_cents')
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd),
        supabase
          .from('ai_usage_logs')
          .select('actual_cost_cents')
          .eq('user_id', user!.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
      ]);

      const sumCosts = (data: any[]) => data?.reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0) || 0;

      return {
        daily: sumCosts(dailyRes.data || []),
        weekly: sumCosts(weeklyRes.data || []),
        monthly: sumCosts(monthlyRes.data || []),
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const dailyBudget = (preferences as any)?.ai_budget_daily_limit_cents ?? null;
  const weeklyBudget = (preferences as any)?.ai_budget_weekly_limit_cents ?? null;
  const monthlyBudget = (preferences as any)?.ai_budget_monthly_limit_cents ?? null;
  const alertsEnabled = (preferences as any)?.ai_budget_alerts_enabled ?? true;

  const dailySpent = spending?.daily || 0;
  const weeklySpent = spending?.weekly || 0;
  const monthlySpent = spending?.monthly || 0;

  const wouldExceedBudget = (estimatedCostCents: number): { exceeds: boolean; period: string | null } => {
    if (!alertsEnabled) return { exceeds: false, period: null };
    
    if (dailyBudget !== null && (dailySpent + estimatedCostCents) > dailyBudget) {
      return { exceeds: true, period: 'daily' };
    }
    if (weeklyBudget !== null && (weeklySpent + estimatedCostCents) > weeklyBudget) {
      return { exceeds: true, period: 'weekly' };
    }
    if (monthlyBudget !== null && (monthlySpent + estimatedCostCents) > monthlyBudget) {
      return { exceeds: true, period: 'monthly' };
    }
    return { exceeds: false, period: null };
  };

  return {
    daily: {
      spent: dailySpent,
      budget: dailyBudget,
      remaining: dailyBudget !== null ? Math.max(0, dailyBudget - dailySpent) : null,
      isOver: dailyBudget !== null && dailySpent >= dailyBudget,
    },
    weekly: {
      spent: weeklySpent,
      budget: weeklyBudget,
      remaining: weeklyBudget !== null ? Math.max(0, weeklyBudget - weeklySpent) : null,
      isOver: weeklyBudget !== null && weeklySpent >= weeklyBudget,
    },
    monthly: {
      spent: monthlySpent,
      budget: monthlyBudget,
      remaining: monthlyBudget !== null ? Math.max(0, monthlyBudget - monthlySpent) : null,
      isOver: monthlyBudget !== null && monthlySpent >= monthlyBudget,
    },
    alertsEnabled,
    wouldExceedBudget,
    isLoading,
  };
}
