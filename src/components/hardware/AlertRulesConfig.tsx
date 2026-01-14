import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAlertRules } from '@/hooks/useAlertRules';
import { 
  Bell, 
  Plus, 
  Trash2, 
  RefreshCw,
  Zap,
  AlertTriangle,
  Activity,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const ruleTypeConfig = {
  threshold: { icon: Activity, label: 'Threshold', color: 'bg-blue-500' },
  pattern: { icon: Zap, label: 'Pattern', color: 'bg-purple-500' },
  anomaly: { icon: AlertTriangle, label: 'Anomaly', color: 'bg-orange-500' },
  schedule: { icon: Clock, label: 'Schedule', color: 'bg-green-500' },
};

export function AlertRulesConfig() {
  const {
    rules,
    isLoading,
    createRule,
    toggleRule,
    deleteRule,
    isProcessing
  } = useAlertRules();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'threshold' as 'threshold' | 'pattern' | 'anomaly' | 'schedule',
    conditions: {
      device_type: 'all',
      metric: 'battery_level',
      operator: 'lt' as 'lt' | 'lte' | 'gt' | 'gte' | 'eq',
      threshold: 20
    },
    actions: {
      severity: 'high' as 'low' | 'medium' | 'high' | 'critical',
      notification_channels: ['in_app'] as ('in_app' | 'push' | 'email')[]
    },
    cooldown_minutes: 30
  });

  const handleCreate = () => {
    createRule({
      rule_name: newRule.rule_name,
      rule_type: newRule.rule_type,
      conditions: newRule.conditions,
      actions: newRule.actions,
      cooldown_minutes: newRule.cooldown_minutes
    });
    setShowCreateDialog(false);
    setNewRule({
      rule_name: '',
      rule_type: 'threshold',
      conditions: {
        device_type: 'all',
        metric: 'battery_level',
        operator: 'lt',
        threshold: 20
      },
      actions: {
        severity: 'high',
        notification_channels: ['in_app']
      },
      cooldown_minutes: 30
    });
  };

  const handleToggle = (ruleId: string, isActive: boolean) => {
    toggleRule({ id: ruleId, is_active: isActive });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rules.reduce((sum, r) => sum + (r.trigger_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full h-full">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Alert Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated alerts based on device conditions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      value={newRule.rule_name}
                      onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                      placeholder="Low Battery Alert"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select
                      value={newRule.rule_type}
                      onValueChange={(v) => setNewRule({ ...newRule, rule_type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="threshold">Threshold</SelectItem>
                        <SelectItem value="pattern">Pattern</SelectItem>
                        <SelectItem value="anomaly">Anomaly</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Metric</Label>
                    <Select
                      value={newRule.conditions.metric}
                      onValueChange={(v) => setNewRule({
                        ...newRule,
                        conditions: { ...newRule.conditions, metric: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="battery_level">Battery Level</SelectItem>
                        <SelectItem value="signal_strength">Signal Strength</SelectItem>
                        <SelectItem value="temperature">Temperature</SelectItem>
                        <SelectItem value="offline_duration">Offline Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={newRule.conditions.operator}
                        onValueChange={(v) => setNewRule({
                          ...newRule,
                          conditions: { ...newRule.conditions, operator: v as 'lt' | 'lte' | 'gt' | 'gte' | 'eq' }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lt">Less Than</SelectItem>
                          <SelectItem value="gt">Greater Than</SelectItem>
                          <SelectItem value="eq">Equals</SelectItem>
                          <SelectItem value="lte">Less Than or Equal</SelectItem>
                          <SelectItem value="gte">Greater Than or Equal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Threshold</Label>
                      <Input
                        type="number"
                        value={newRule.conditions.threshold}
                        onChange={(e) => setNewRule({
                          ...newRule,
                          conditions: { ...newRule.conditions, threshold: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={newRule.actions.severity}
                      onValueChange={(v) => setNewRule({
                        ...newRule,
                        actions: { ...newRule.actions, severity: v as 'low' | 'medium' | 'high' | 'critical' }
                      })}
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

                  <div className="space-y-2">
                    <Label>Cooldown (minutes)</Label>
                    <Input
                      type="number"
                      value={newRule.cooldown_minutes}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        cooldown_minutes: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isProcessing || !newRule.rule_name}>
                    {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>Configure automated alert triggers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No alert rules configured</p>
              <p className="text-sm mt-1">Create your first rule to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {rules.map(rule => {
                  const typeConfig = ruleTypeConfig[rule.rule_type as keyof typeof ruleTypeConfig] || ruleTypeConfig.threshold;
                  const TypeIcon = typeConfig.icon;
                  const conditions = rule.conditions as any;
                  const actions = rule.actions as any;

                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${typeConfig.color}/10 flex items-center justify-center`}>
                            <TypeIcon className={`h-5 w-5 ${typeConfig.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div>
                            <p className="font-medium">{rule.rule_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {conditions?.metric} {conditions?.operator?.replace('_', ' ')} {conditions?.threshold}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">Triggered</p>
                            <p>{rule.trigger_count || 0}x</p>
                          </div>
                          <Badge variant={actions?.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {actions?.severity || 'medium'}
                          </Badge>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteRule(rule.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {rule.last_triggered_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last triggered: {format(new Date(rule.last_triggered_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
