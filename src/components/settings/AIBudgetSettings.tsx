import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, AlertTriangle, TrendingUp, Save } from 'lucide-react';
import { formatCentsToUSD } from '@/lib/aiPricing';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export function AIBudgetSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dailyBudget, setDailyBudget] = useState<string>('');
  const [weeklyBudget, setWeeklyBudget] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences
  const { data: preferences, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch current spending
  const { data: spending, isLoading: isLoadingSpending } = useQuery({
    queryKey: ['ai-spending', user?.id],
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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Initialize form with saved values
  useEffect(() => {
    if (preferences) {
      setDailyBudget((preferences as any).ai_budget_daily_cents ? String((preferences as any).ai_budget_daily_cents / 100) : '');
      setWeeklyBudget((preferences as any).ai_budget_weekly_cents ? String((preferences as any).ai_budget_weekly_cents / 100) : '');
      setMonthlyBudget((preferences as any).ai_budget_monthly_cents ? String((preferences as any).ai_budget_monthly_cents / 100) : '');
      setAlertsEnabled((preferences as any).ai_budget_alerts_enabled ?? true);
      setHasChanges(false);
    }
  }, [preferences]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const budgetData = {
        ai_budget_daily_cents: dailyBudget ? Math.round(parseFloat(dailyBudget) * 100) : null,
        ai_budget_weekly_cents: weeklyBudget ? Math.round(parseFloat(weeklyBudget) * 100) : null,
        ai_budget_monthly_cents: monthlyBudget ? Math.round(parseFloat(monthlyBudget) * 100) : null,
        ai_budget_alerts_enabled: alertsEnabled,
      };

      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update(budgetData)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert({ user_id: user!.id, ...budgetData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      setHasChanges(false);
      toast({ title: 'Budget settings saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleInputChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const getUsagePercent = (spent: number, budgetStr: string) => {
    if (!budgetStr) return 0;
    const budget = parseFloat(budgetStr) * 100;
    if (budget <= 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isOverBudget = (spent: number, budgetStr: string) => {
    if (!budgetStr) return false;
    const budget = parseFloat(budgetStr) * 100;
    return spent >= budget;
  };

  if (isLoadingPrefs || isLoadingSpending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AI Spending Budget</h3>
          <p className="text-sm text-muted-foreground">
            Set spending limits and get alerts when approaching thresholds
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Budget
        </Button>
      </div>

      {/* Current Spending Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            Current Spending
          </CardTitle>
          <CardDescription>Your AI usage costs for current periods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Today</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCentsToUSD(spending?.daily || 0)}</span>
                {dailyBudget && (
                  <>
                    <span className="text-muted-foreground">/ ${dailyBudget}</span>
                    {isOverBudget(spending?.daily || 0, dailyBudget) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            {dailyBudget && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getProgressColor(getUsagePercent(spending?.daily || 0, dailyBudget))}`}
                  style={{ width: `${getUsagePercent(spending?.daily || 0, dailyBudget)}%` }}
                />
              </div>
            )}
          </div>

          {/* Weekly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>This Week</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCentsToUSD(spending?.weekly || 0)}</span>
                {weeklyBudget && (
                  <>
                    <span className="text-muted-foreground">/ ${weeklyBudget}</span>
                    {isOverBudget(spending?.weekly || 0, weeklyBudget) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            {weeklyBudget && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getProgressColor(getUsagePercent(spending?.weekly || 0, weeklyBudget))}`}
                  style={{ width: `${getUsagePercent(spending?.weekly || 0, weeklyBudget)}%` }}
                />
              </div>
            )}
          </div>

          {/* Monthly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>This Month</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCentsToUSD(spending?.monthly || 0)}</span>
                {monthlyBudget && (
                  <>
                    <span className="text-muted-foreground">/ ${monthlyBudget}</span>
                    {isOverBudget(spending?.monthly || 0, monthlyBudget) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Over
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            {monthlyBudget && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getProgressColor(getUsagePercent(spending?.monthly || 0, monthlyBudget))}`}
                  style={{ width: `${getUsagePercent(spending?.monthly || 0, monthlyBudget)}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5" />
            Budget Limits
          </CardTitle>
          <CardDescription>Set spending caps (leave empty for no limit)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-budget">Daily Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="daily-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={dailyBudget}
                  onChange={handleInputChange(setDailyBudget)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-budget">Weekly Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="weekly-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={weeklyBudget}
                  onChange={handleInputChange(setWeeklyBudget)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-budget">Monthly Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="monthly-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={monthlyBudget}
                  onChange={handleInputChange(setMonthlyBudget)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show warnings when approaching budget limits
              </p>
            </div>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={(checked) => {
                setAlertsEnabled(checked);
                setHasChanges(true);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
