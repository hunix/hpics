import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, AlertTriangle, AlertCircle, Info, Check, X, 
  Clock, TrendingDown, MessageSquare, MapPin, Search,
  Plus, Settings, Play
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Alert {
  id: string;
  rule_id: string | null;
  profile_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  evidence: Record<string, any>;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  is_dismissed: boolean;
  created_at: string;
  profile?: { first_name: string; last_name: string | null };
}

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  conditions: Record<string, any>;
  severity: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
  high: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
  medium: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  low: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-500/10' },
};

const ruleTypeIcons: Record<string, any> = {
  silence: Clock,
  sentiment_shift: TrendingDown,
  keyword: Search,
  pattern_break: AlertTriangle,
  geo_alert: MapPin,
  behavioral: MessageSquare,
};

export function IntelligenceAlertManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    rule_type: string;
    severity: string;
    conditions: Record<string, any>;
  }>({
    name: '',
    rule_type: 'silence',
    severity: 'medium',
    conditions: { days_silent: 14 },
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['intelligence-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intelligence_alerts')
        .select(`
          *,
          profile:profiles(first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['intelligence-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intelligence_alert_rules')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AlertRule[];
    },
    enabled: !!user,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success('Alert acknowledged');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success('Alert dismissed');
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('intelligence_alert_rules').insert({
        user_id: user!.id,
        name: newRule.name,
        rule_type: newRule.rule_type,
        severity: newRule.severity,
        conditions: newRule.conditions,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-rules'] });
      setIsCreatingRule(false);
      setNewRule({ name: '', rule_type: 'silence', severity: 'medium', conditions: { days_silent: 14 } });
      toast.success('Alert rule created');
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('intelligence_alert_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-rules'] });
    },
  });

  const processRulesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-alert-rules');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success(`Processed ${data.rules_processed} rules, triggered ${data.alerts_triggered} alerts`);
    },
    onError: (error) => {
      toast.error('Failed to process rules: ' + error.message);
    },
  });

  const unacknowledgedAlerts = alerts?.filter(a => !a.is_acknowledged) || [];
  const acknowledgedAlerts = alerts?.filter(a => a.is_acknowledged) || [];

  const getSeverityInfo = (severity: string) => severityConfig[severity] || severityConfig.medium;

  const updateConditions = (key: string, value: any) => {
    setNewRule(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value },
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Intelligence Alerts
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive">{unacknowledgedAlerts.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Custom alert rules and triggered notifications
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => processRulesMutation.mutate()}
              disabled={processRulesMutation.isPending}
            >
              <Play className="h-4 w-4 mr-1" />
              Run Rules
            </Button>
            <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Alert Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated alerts for specific conditions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      value={newRule.name}
                      onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., VIP Contact Silence Alert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select
                      value={newRule.rule_type}
                      onValueChange={value => setNewRule(prev => ({ 
                        ...prev, 
                        rule_type: value,
                        conditions: value === 'silence' ? { days_silent: 14 } :
                                   value === 'sentiment_shift' ? { sentiment_drop: 30 } :
                                   value === 'keyword' ? { keywords: [] } : {}
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="silence">Contact Silence</SelectItem>
                        <SelectItem value="sentiment_shift">Sentiment Shift</SelectItem>
                        <SelectItem value="keyword">Keyword Detection</SelectItem>
                        <SelectItem value="pattern_break">Pattern Break</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={newRule.severity}
                      onValueChange={value => setNewRule(prev => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newRule.rule_type === 'silence' && (
                    <div className="space-y-2">
                      <Label>Days Silent Threshold</Label>
                      <Input
                        type="number"
                        value={newRule.conditions.days_silent || 14}
                        onChange={e => updateConditions('days_silent', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                  {newRule.rule_type === 'sentiment_shift' && (
                    <div className="space-y-2">
                      <Label>Sentiment Drop Threshold (%)</Label>
                      <Input
                        type="number"
                        value={newRule.conditions.sentiment_drop || 30}
                        onChange={e => updateConditions('sentiment_drop', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                  {newRule.rule_type === 'keyword' && (
                    <div className="space-y-2">
                      <Label>Keywords (comma-separated)</Label>
                      <Input
                        value={(newRule.conditions.keywords || []).join(', ')}
                        onChange={e => updateConditions('keywords', e.target.value.split(',').map(k => k.trim()))}
                        placeholder="urgent, lawsuit, problem"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createRuleMutation.mutate()}
                    disabled={!newRule.name || createRuleMutation.isPending}
                  >
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alerts">
          <TabsList className="mb-4">
            <TabsTrigger value="alerts">
              Active Alerts
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-2">{unacknowledgedAlerts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules">
              Rules ({rules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <ScrollArea className="h-[350px]">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : unacknowledgedAlerts.length > 0 ? (
                <div className="space-y-3">
                  {unacknowledgedAlerts.map(alert => {
                    const severity = getSeverityInfo(alert.severity);
                    const Icon = severity.icon;
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${severity.bg}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${severity.color}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{alert.title}</span>
                                <Badge variant="outline" className={severity.color}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              {alert.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {alert.profile && (
                                  <button
                                    onClick={() => navigate(`/contacts/${alert.profile_id}`)}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {alert.profile.first_name} {alert.profile.last_name}
                                  </button>
                                )}
                                <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => acknowledgeMutation.mutate(alert.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => dismissMutation.mutate(alert.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active alerts</p>
                  <p className="text-sm">All clear! Create rules to monitor your contacts.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rules">
            <ScrollArea className="h-[350px]">
              {rulesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="space-y-3">
                  {rules.map(rule => {
                    const RuleIcon = ruleTypeIcons[rule.rule_type] || Bell;
                    return (
                      <div
                        key={rule.id}
                        className={`p-4 rounded-lg border ${rule.is_active ? '' : 'opacity-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RuleIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{rule.name}</span>
                                <Badge variant="outline">{rule.rule_type}</Badge>
                                <Badge variant={
                                  rule.severity === 'critical' ? 'destructive' :
                                  rule.severity === 'high' ? 'default' : 'secondary'
                                }>
                                  {rule.severity}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Triggered {rule.trigger_count} times
                                {rule.last_triggered_at && (
                                  <> • Last: {formatDistanceToNow(new Date(rule.last_triggered_at), { addSuffix: true })}</>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={rule.is_active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleRuleMutation.mutate({ ruleId: rule.id, isActive: !rule.is_active })}
                          >
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No alert rules configured</p>
                  <p className="text-sm">Create rules to automate alert triggers</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[350px]">
              {acknowledgedAlerts.length > 0 ? (
                <div className="space-y-2">
                  {acknowledgedAlerts.map(alert => (
                    <div key={alert.id} className="p-3 rounded-lg border opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{alert.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.acknowledged_at || alert.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No alert history</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
