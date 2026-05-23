import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Bell, DollarSign, TrendingUp, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfDay, subDays } from 'date-fns';

interface BudgetSettings {
  daily_limit_cents: number;
  weekly_limit_cents: number;
  monthly_limit_cents: number;
  alert_threshold_percent: number;
  enforce_limits: boolean;
}

export function BudgetAlertPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<BudgetSettings | null>(null);

  // Fetch budget settings
  const { data: settings } = useQuery({
    queryKey: ['ai-budget-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('ai_budget_daily_limit_cents, ai_budget_weekly_limit_cents, ai_budget_monthly_limit_cents, ai_budget_alert_threshold, ai_budget_enforce_limits')
        .eq('user_id', user?.id ?? '')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        daily_limit_cents: data?.ai_budget_daily_limit_cents || 500,
        weekly_limit_cents: data?.ai_budget_weekly_limit_cents || 2000,
        monthly_limit_cents: data?.ai_budget_monthly_limit_cents || 5000,
        alert_threshold_percent: data?.ai_budget_alert_threshold || 75,
        enforce_limits: data?.ai_budget_enforce_limits ?? true,
      } as BudgetSettings;
    },
    enabled: !!user,
  });

  // Fetch current spending
  const { data: spending } = useQuery({
    queryKey: ['ai-current-spending', user?.id],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      // Daily spending
      const { data: dailyLogs } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .gte('created_at', today);

      // Weekly spending
      const { data: weeklyLogs } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .gte('created_at', weekStart);

      // Monthly spending
      const { data: monthlyLogs } = await supabase
        .from('ai_usage_logs')
        .select('actual_cost_cents')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      return {
        daily: (dailyLogs || []).reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0),
        weekly: (weeklyLogs || []).reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0),
        monthly: (monthlyLogs || []).reduce((sum, log) => sum + (log.actual_cost_cents || 0), 0),
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: BudgetSettings) => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ai_budget_daily_limit_cents: newSettings.daily_limit_cents,
          ai_budget_weekly_limit_cents: newSettings.weekly_limit_cents,
          ai_budget_monthly_limit_cents: newSettings.monthly_limit_cents,
          ai_budget_alert_threshold: newSettings.alert_threshold_percent,
          ai_budget_enforce_limits: newSettings.enforce_limits,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-budget-settings'] });
      toast.success('Budget settings updated');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-destructive';
    if (percent >= 90) return 'bg-orange-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getAlertLevel = (percent: number) => {
    if (percent >= 100) return { level: 'critical', label: 'EXCEEDED' };
    if (percent >= 90) return { level: 'warning', label: 'Near Limit' };
    if (percent >= 75) return { level: 'caution', label: 'Caution' };
    return { level: 'ok', label: 'OK' };
  };

  const dailyPercent = settings && spending ? (spending.daily / settings.daily_limit_cents) * 100 : 0;
  const weeklyPercent = settings && spending ? (spending.weekly / settings.weekly_limit_cents) * 100 : 0;
  const monthlyPercent = settings && spending ? (spending.monthly / settings.monthly_limit_cents) * 100 : 0;

  const startEdit = () => {
    setEditValues(settings || null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditValues(null);
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (editValues) {
      updateSettings.mutate(editValues);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Budget & Alerts
            </CardTitle>
            <CardDescription>Monitor AI spending and set limits</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={startEdit}>
              Configure
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={updateSettings.isPending}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Spending */}
        <div className="space-y-4">
          {/* Daily */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCost(spending?.daily || 0)} / {formatCost(settings?.daily_limit_cents || 0)}
                </span>
                <Badge 
                  variant={dailyPercent >= 75 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {getAlertLevel(dailyPercent).label}
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.min(dailyPercent, 100)} 
              className={`h-2 ${getProgressColor(dailyPercent)}`}
            />
          </div>

          {/* Weekly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weekly</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCost(spending?.weekly || 0)} / {formatCost(settings?.weekly_limit_cents || 0)}
                </span>
                <Badge 
                  variant={weeklyPercent >= 75 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {getAlertLevel(weeklyPercent).label}
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.min(weeklyPercent, 100)} 
              className={`h-2 ${getProgressColor(weeklyPercent)}`}
            />
          </div>

          {/* Monthly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCost(spending?.monthly || 0)} / {formatCost(settings?.monthly_limit_cents || 0)}
                </span>
                <Badge 
                  variant={monthlyPercent >= 75 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {getAlertLevel(monthlyPercent).label}
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.min(monthlyPercent, 100)} 
              className={`h-2 ${getProgressColor(monthlyPercent)}`}
            />
          </div>
        </div>

        {/* Edit Mode */}
        {isEditing && editValues && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily">Daily Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="daily"
                    type="number"
                    step="0.01"
                    className="pl-8"
                    value={(editValues.daily_limit_cents / 100).toFixed(2)}
                    onChange={(e) => setEditValues({
                      ...editValues,
                      daily_limit_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly">Weekly Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weekly"
                    type="number"
                    step="0.01"
                    className="pl-8"
                    value={(editValues.weekly_limit_cents / 100).toFixed(2)}
                    onChange={(e) => setEditValues({
                      ...editValues,
                      weekly_limit_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthly"
                    type="number"
                    step="0.01"
                    className="pl-8"
                    value={(editValues.monthly_limit_cents / 100).toFixed(2)}
                    onChange={(e) => setEditValues({
                      ...editValues,
                      monthly_limit_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enforce Limits</Label>
                <p className="text-xs text-muted-foreground">Block AI calls when budget exceeded</p>
              </div>
              <Switch
                checked={editValues.enforce_limits}
                onCheckedChange={(checked) => setEditValues({
                  ...editValues,
                  enforce_limits: checked
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Alert Threshold: {editValues.alert_threshold_percent}%</Label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                className="w-full"
                value={editValues.alert_threshold_percent}
                onChange={(e) => setEditValues({
                  ...editValues,
                  alert_threshold_percent: parseInt(e.target.value)
                })}
              />
              <p className="text-xs text-muted-foreground">
                Get alerts when spending reaches this threshold
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {(dailyPercent >= 75 || weeklyPercent >= 75 || monthlyPercent >= 75) && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Budget Alert</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyPercent >= 100 
                ? 'Monthly budget exceeded. AI operations may be limited.'
                : `Approaching budget limits. Consider reducing AI usage or increasing limits.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
