import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface BudgetStatus {
  spent: number;
  budget: number | null;
  isOver: boolean;
  percentage: number;
  remaining: number;
}

interface BudgetWarning {
  exceeds: boolean;
  period: 'daily' | 'weekly' | 'monthly' | null;
}

export interface AIBudgetData {
  daily: BudgetStatus;
  weekly: BudgetStatus;
  monthly: BudgetStatus;
  isLoading: boolean;
  refetch: () => void;
  wouldExceedBudget: (additionalCostCents: number) => BudgetWarning;
}

export function useAIBudget(): AIBudgetData {
  const { user } = useAuth();

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['ai-budget-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('ai_budget_daily_cents, ai_budget_weekly_cents, ai_budget_monthly_cents')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: usage, isLoading: usageLoading, refetch } = useQuery({
    queryKey: ['ai-budget-usage', user?.id],
    queryFn: async () => {
      const now = new Date();
      const dayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', monthStart);

      if (error) throw error;

      const logs = data || [];
      
      let dailySpent = 0;
      let weeklySpent = 0;
      let monthlySpent = 0;

      logs.forEach(log => {
        const cost = log.actual_cost_cents || 0;
        const createdAt = new Date(log.created_at);
        
        monthlySpent += cost;
        
        if (createdAt >= new Date(weekStart)) {
          weeklySpent += cost;
        }
        
        if (createdAt >= new Date(dayStart)) {
          dailySpent += cost;
        }
      });

      return { dailySpent, weeklySpent, monthlySpent };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const createStatus = (spent: number, budget: number | null | undefined): BudgetStatus => {
    const budgetValue = budget || null;
    const remaining = budgetValue !== null ? Math.max(0, budgetValue - spent) : 0;
    return {
      spent,
      budget: budgetValue,
      isOver: budgetValue !== null && spent > budgetValue,
      percentage: budgetValue ? Math.min((spent / budgetValue) * 100, 100) : 0,
      remaining,
    };
  };

  const daily = createStatus(usage?.dailySpent || 0, preferences?.ai_budget_daily_cents);
  const weekly = createStatus(usage?.weeklySpent || 0, preferences?.ai_budget_weekly_cents);
  const monthly = createStatus(usage?.monthlySpent || 0, preferences?.ai_budget_monthly_cents);

  const wouldExceedBudget = (additionalCostCents: number): BudgetWarning => {
    if (daily.budget !== null && daily.spent + additionalCostCents > daily.budget) {
      return { exceeds: true, period: 'daily' };
    }
    if (weekly.budget !== null && weekly.spent + additionalCostCents > weekly.budget) {
      return { exceeds: true, period: 'weekly' };
    }
    if (monthly.budget !== null && monthly.spent + additionalCostCents > monthly.budget) {
      return { exceeds: true, period: 'monthly' };
    }
    return { exceeds: false, period: null };
  };

  return {
    daily,
    weekly,
    monthly,
    isLoading: prefsLoading || usageLoading,
    refetch,
    wouldExceedBudget,
  };
}
