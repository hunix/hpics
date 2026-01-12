/**
 * AutomationBuilder - Visual IFTTT-style rule builder
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, Play, Pause, MapPin, Clock, 
  Users, Calendar, Bell, Camera, Mic, MessageSquare,
  ChevronRight, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'location' | 'time' | 'proximity' | 'calendar';
    config: Record<string, any>;
  };
  action: {
    type: 'notify' | 'capture' | 'record' | 'log';
    config: Record<string, any>;
  };
  isActive: boolean;
  executionCount: number;
}

const TRIGGER_OPTIONS = [
  { value: 'location', label: 'Location Change', icon: MapPin },
  { value: 'time', label: 'Time of Day', icon: Clock },
  { value: 'proximity', label: 'Contact Nearby', icon: Users },
  { value: 'calendar', label: 'Calendar Event', icon: Calendar },
];

const ACTION_OPTIONS = [
  { value: 'notify', label: 'Send Notification', icon: Bell },
  { value: 'capture', label: 'Take Photo', icon: Camera },
  { value: 'record', label: 'Start Recording', icon: Mic },
  { value: 'log', label: 'Log Interaction', icon: MessageSquare },
];

interface AutomationBuilderProps {
  className?: string;
}

export function AutomationBuilder({ className }: AutomationBuilderProps) {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Office Arrival',
      trigger: { type: 'location', config: { place: 'Office' } },
      action: { type: 'record', config: {} },
      isActive: true,
      executionCount: 12
    },
    {
      id: '2',
      name: 'Important Contact Nearby',
      trigger: { type: 'proximity', config: { priority: 'high' } },
      action: { type: 'notify', config: {} },
      isActive: false,
      executionCount: 5
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    trigger: { type: 'location', config: {} },
    action: { type: 'notify', config: {} }
  });

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const createRule = () => {
    if (!newRule.name) return;
    
    const rule: AutomationRule = {
      id: crypto.randomUUID(),
      name: newRule.name,
      trigger: newRule.trigger as AutomationRule['trigger'],
      action: newRule.action as AutomationRule['action'],
      isActive: true,
      executionCount: 0
    };
    
    setRules(prev => [...prev, rule]);
    setIsCreating(false);
    setNewRule({
      name: '',
      trigger: { type: 'location', config: {} },
      action: { type: 'notify', config: {} }
    });
  };

  const getTriggerIcon = (type: string) => {
    const option = TRIGGER_OPTIONS.find(o => o.value === type);
    return option?.icon || Zap;
  };

  const getActionIcon = (type: string) => {
    const option = ACTION_OPTIONS.find(o => o.value === type);
    return option?.icon || Bell;
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Automation Rules
          </CardTitle>
          <Badge variant="secondary">
            {rules.filter(r => r.isActive).length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rules List */}
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {rules.map((rule) => {
              const TriggerIcon = getTriggerIcon(rule.trigger.type);
              const ActionIcon = getActionIcon(rule.action.type);
              
              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    rule.isActive 
                      ? "border-primary/30 bg-primary/5" 
                      : "border-border/50 bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{rule.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rule.executionCount}x
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                      <TriggerIcon className="h-3 w-3" />
                      <span className="capitalize">{rule.trigger.type}</span>
                    </div>
                    <ChevronRight className="h-3 w-3" />
                    <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                      <ActionIcon className="h-3 w-3" />
                      <span className="capitalize">{rule.action.type}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Create Rule Form */}
        <AnimatePresence>
          {isCreating ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 bg-muted/50 rounded-lg"
            >
              <Input
                placeholder="Rule name..."
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">When</label>
                  <Select
                    value={newRule.trigger?.type}
                    onValueChange={(value) => setNewRule(prev => ({
                      ...prev,
                      trigger: { type: value as any, config: {} }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-3 w-3" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Then</label>
                  <Select
                    value={newRule.action?.type}
                    onValueChange={(value) => setNewRule(prev => ({
                      ...prev,
                      action: { type: value as any, config: {} }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-3 w-3" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={createRule}>
                  Create Rule
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
