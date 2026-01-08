import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CostAlert {
  id: string;
  alert_type: 'daily' | 'weekly' | 'monthly' | 'anomaly';
  threshold_percent: number;
  is_enabled: boolean;
  notification_channels: string[];
  last_triggered_at: string | null;
  trigger_count: number;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Budget',
  weekly: 'Weekly Budget',
  monthly: 'Monthly Budget',
  anomaly: 'Anomaly Detection',
};

export function AIBudgetAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newAlertType, setNewAlertType] = useState<string | null>(null);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ai-cost-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_cost_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('alert_type');

      if (error) throw error;
      return data as CostAlert[];
    },
    enabled: !!user,
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CostAlert> }) => {
      const { error } = await supabase
        .from('ai_cost_alerts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-cost-alerts'] });
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertType: string) => {
      const { error } = await supabase
        .from('ai_cost_alerts')
        .insert({
          user_id: user!.id,
          alert_type: alertType,
          threshold_percent: 75,
          is_enabled: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-cost-alerts'] });
      setNewAlertType(null);
      toast.success('Alert created');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_cost_alerts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-cost-alerts'] });
      toast.success('Alert deleted');
    },
  });

  const existingTypes = new Set(alerts?.map(a => a.alert_type) || []);
  const availableTypes = (['daily', 'weekly', 'monthly', 'anomaly'] as const).filter(t => !existingTypes.has(t));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Budget Alerts
        </CardTitle>
        <CardDescription>
          Get notified when you approach or exceed your AI spending limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts?.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts configured</p>
            <p className="text-sm">Add alerts to monitor your AI spending</p>
          </div>
        )}

        {alerts?.map(alert => (
          <div key={alert.id} className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={alert.is_enabled}
                  onCheckedChange={(checked) => 
                    updateAlertMutation.mutate({ id: alert.id, updates: { is_enabled: checked } })
                  }
                />
                <div>
                  <span className="font-medium">{ALERT_TYPE_LABELS[alert.alert_type]}</span>
                  <div className="text-xs text-muted-foreground">
                    Alert at {alert.threshold_percent}% of budget
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.trigger_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Triggered {alert.trigger_count}x
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAlertMutation.mutate(alert.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Threshold: {alert.threshold_percent}%</Label>
              <Slider
                value={[alert.threshold_percent]}
                onValueChange={([value]) => 
                  updateAlertMutation.mutate({ id: alert.id, updates: { threshold_percent: value } })
                }
                min={25}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        ))}

        {availableTypes.length > 0 && (
          <div className="pt-2">
            {newAlertType ? (
              <div className="flex items-center gap-2">
                <select
                  value={newAlertType}
                  onChange={(e) => setNewAlertType(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                >
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{ALERT_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              <Button size="sm" onClick={() => createAlertMutation.mutate(newAlertType as 'daily' | 'weekly' | 'monthly' | 'anomaly')}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setNewAlertType(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setNewAlertType(availableTypes[0])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Alert
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
