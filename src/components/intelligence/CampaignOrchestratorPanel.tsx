/**
 * Campaign Orchestrator Panel
 * Visual interface for creating and managing cross-domain campaign chains
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useCampaignOrchestrator, 
  type TriggerCampaignType, 
  type ActionCampaignType 
} from '@/hooks/intelligence/useCampaignOrchestrator';
import { 
  Link2, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  ArrowRight,
  Zap,
  Shield,
  Brain,
  Target,
  MessageSquare
} from 'lucide-react';

const TRIGGER_TYPES: { value: TriggerCampaignType; label: string; icon: React.ReactNode }[] = [
  { value: 'mice_assessment', label: 'MICE Assessment', icon: <Target className="h-4 w-4" /> },
  { value: 'betrayal_prediction', label: 'Betrayal Prediction', icon: <Shield className="h-4 w-4" /> },
  { value: 'sacred_value', label: 'Sacred Value Alert', icon: <Brain className="h-4 w-4" /> },
  { value: 'semantic_warfare', label: 'Semantic Operation', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'memetic_campaign', label: 'Memetic Campaign', icon: <Zap className="h-4 w-4" /> },
];

const ACTION_TYPES: { value: ActionCampaignType; label: string }[] = [
  { value: 'nudge_campaign', label: 'Launch Nudge Campaign' },
  { value: 'negotiation_session', label: 'Start Negotiation' },
  { value: 'semantic_warfare', label: 'Deploy Semantic Op' },
  { value: 'memetic_campaign', label: 'Launch Memetic Campaign' },
  { value: 'memory_intervention', label: 'Memory Intervention' },
];

const OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'change', label: 'Changes by' },
];

export function CampaignOrchestratorPanel() {
  const { 
    chains, 
    isLoading, 
    stats, 
    createChain, 
    toggleChain, 
    deleteChain, 
    executeChain,
    isCreating 
  } = useCampaignOrchestrator();

  const [newChain, setNewChain] = useState({
    chainName: '',
    description: '',
    triggerType: 'mice_assessment' as TriggerCampaignType,
    triggerField: 'composite_score',
    triggerOperator: 'gt' as 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change',
    triggerValue: '0.7',
    actionType: 'nudge_campaign' as ActionCampaignType,
    requiresApproval: true,
  });

  const handleCreateChain = () => {
    if (!newChain.chainName.trim()) return;
    
    createChain({
      chainName: newChain.chainName,
      description: newChain.description,
      triggerCampaignType: newChain.triggerType,
      triggerCondition: {
        field: newChain.triggerField,
        operator: newChain.triggerOperator,
        value: parseFloat(newChain.triggerValue) || newChain.triggerValue,
      },
      actionCampaignType: newChain.actionType,
      actionConfig: {},
      isActive: true,
      requiresApproval: newChain.requiresApproval,
    });

    setNewChain({
      chainName: '',
      description: '',
      triggerType: 'mice_assessment',
      triggerField: 'composite_score',
      triggerOperator: 'gt',
      triggerValue: '0.7',
      actionType: 'nudge_campaign',
      requiresApproval: true,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Campaign Orchestrator</CardTitle>
        </div>
        <CardDescription>
          Automate cross-domain campaign triggers and actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Chains</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-500">{stats.totalExecutions}</p>
            <p className="text-xs text-muted-foreground">Executions</p>
          </div>
        </div>

        <Tabs defaultValue="chains">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chains">Active Chains</TabsTrigger>
            <TabsTrigger value="create">Create Chain</TabsTrigger>
          </TabsList>

          <TabsContent value="chains" className="mt-4">
            <ScrollArea className="h-64">
              {chains?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No campaign chains configured. Create one to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {chains?.map((chain) => (
                    <div
                      key={chain.id}
                      className={`p-3 rounded-lg border ${
                        chain.is_active ? 'border-green-500/30 bg-green-500/5' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{chain.chain_name}</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={chain.is_active}
                            onCheckedChange={(checked) => 
                              toggleChain({ id: chain.id, isActive: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => executeChain(chain.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteChain(chain.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {chain.trigger_campaign_type}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {chain.action_campaign_type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          Trigger: {(chain.trigger_condition as any)?.field}{' '}
                          {(chain.trigger_condition as any)?.operator}{' '}
                          {(chain.trigger_condition as any)?.value}
                        </span>
                        <span>Executed: {chain.execution_count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Chain Name</label>
                <Input
                  placeholder="e.g., High MICE -> Nudge Campaign"
                  value={newChain.chainName}
                  onChange={(e) => setNewChain({ ...newChain, chainName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Trigger Type</label>
                <Select
                  value={newChain.triggerType}
                  onValueChange={(v) => setNewChain({ ...newChain, triggerType: v as TriggerCampaignType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          {t.icon}
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">Field</label>
                  <Input
                    placeholder="composite_score"
                    value={newChain.triggerField}
                    onChange={(e) => setNewChain({ ...newChain, triggerField: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Operator</label>
                  <Select
                    value={newChain.triggerOperator}
                    onValueChange={(v) => setNewChain({ ...newChain, triggerOperator: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Value</label>
                  <Input
                    placeholder="0.7"
                    value={newChain.triggerValue}
                    onChange={(e) => setNewChain({ ...newChain, triggerValue: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Action to Take</label>
                <Select
                  value={newChain.actionType}
                  onValueChange={(v) => setNewChain({ ...newChain, actionType: v as ActionCampaignType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Require Approval Before Execution</label>
                <Switch
                  checked={newChain.requiresApproval}
                  onCheckedChange={(checked) => setNewChain({ ...newChain, requiresApproval: checked })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateChain}
                disabled={!newChain.chainName.trim() || isCreating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Chain
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
