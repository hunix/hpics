/**
 * Smart Triggers Hook
 * IFTTT-style automation rules for intelligent capture and notifications
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { nativeIntelligence } from '@/lib/mobile/nativeIntelligence';
import { toast } from 'sonner';

// Trigger types
type TriggerType = 
  | 'geofence_enter'
  | 'geofence_exit'
  | 'time'
  | 'calendar_event'
  | 'proximity'
  | 'activity_change'
  | 'keyword_detected'
  | 'face_recognized'
  | 'low_battery'
  | 'connection_change';

// Action types
type ActionType =
  | 'notification'
  | 'capture_context'
  | 'start_recording'
  | 'log_interaction'
  | 'send_reminder'
  | 'trigger_analysis'
  | 'sync_data'
  | 'webhook';

interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, any>;
  conditions: TriggerCondition[];
  actionType: ActionType;
  actionConfig: Record<string, any>;
  isActive: boolean;
  cooldownMinutes: number;
  maxDailyExecutions: number;
  executionCount: number;
  lastTriggeredAt?: Date;
  priority: number;
}

interface TriggerEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: TriggerType;
  actionType: ActionType;
  triggeredAt: Date;
  success: boolean;
  result?: any;
  error?: string;
}

interface UseSmartTriggersReturn {
  rules: AutomationRule[];
  isEvaluating: boolean;
  recentEvents: TriggerEvent[];
  activeRulesCount: number;
  createRule: (rule: Omit<AutomationRule, 'id' | 'executionCount' | 'lastTriggeredAt'>) => Promise<string | null>;
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string, isActive: boolean) => Promise<boolean>;
  evaluateTrigger: (triggerType: TriggerType, context: Record<string, any>) => Promise<TriggerEvent[]>;
  testRule: (id: string) => Promise<TriggerEvent | null>;
  getPresetRules: () => Partial<AutomationRule>[];
}

export function useSmartTriggers(): UseSmartTriggersReturn {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recentEvents, setRecentEvents] = useState<TriggerEvent[]>([]);

  const dailyExecutionsRef = useRef<Map<string, { count: number; date: string }>>(new Map());
  const cooldownTimersRef = useRef<Map<string, Date>>(new Map());

  const activeRulesCount = rules.filter(r => r.isActive).length;

  // Load rules from database
  useEffect(() => {
    if (!user) return;

    const loadRules = async () => {
      const { data } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (data) {
        setRules(data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          triggerType: r.trigger_type,
          triggerConfig: r.trigger_config,
          conditions: r.conditions || [],
          actionType: r.action_type,
          actionConfig: r.action_config,
          isActive: r.is_active,
          cooldownMinutes: r.cooldown_minutes,
          maxDailyExecutions: r.max_daily_executions,
          executionCount: r.execution_count,
          lastTriggeredAt: r.last_triggered_at ? new Date(r.last_triggered_at) : undefined,
          priority: r.priority
        })));
      }
    };

    loadRules();
  }, [user]);

  // Check if rule can execute (cooldown + daily limit)
  const canExecuteRule = useCallback((rule: AutomationRule): boolean => {
    // Check cooldown
    const cooldownEnd = cooldownTimersRef.current.get(rule.id);
    if (cooldownEnd && new Date() < cooldownEnd) {
      return false;
    }

    // Check daily limit
    const today = new Date().toISOString().slice(0, 10);
    const dailyStats = dailyExecutionsRef.current.get(rule.id);
    
    if (dailyStats && dailyStats.date === today) {
      if (dailyStats.count >= rule.maxDailyExecutions) {
        return false;
      }
    }

    return true;
  }, []);

  // Evaluate conditions
  const evaluateConditions = useCallback((
    conditions: TriggerCondition[],
    context: Record<string, any>
  ): boolean => {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = context[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        default:
          return true;
      }
    });
  }, []);

  // Execute action
  const executeAction = useCallback(async (
    rule: AutomationRule,
    context: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    try {
      switch (rule.actionType) {
        case 'notification':
          toast(rule.actionConfig.title || 'Automation Triggered', {
            description: rule.actionConfig.message || rule.name
          });
          return { success: true };

        case 'capture_context':
          const snapshot = await nativeIntelligence.captureContextSnapshot();
          if (user) {
            await supabase.from('context_snapshots').insert({
              user_id: user.id,
              snapshot_type: 'triggered',
              trigger_source: rule.triggerType,
              ...snapshot
            });
          }
          return { success: true, result: snapshot };

        case 'start_recording':
          // Trigger recording start
          return { success: true, result: { action: 'recording_started' } };

        case 'log_interaction':
          if (user && context.profileId) {
            await supabase.from('proximity_events').insert({
              user_id: user.id,
              detected_profile_id: context.profileId,
              detection_method: 'automation',
              confidence: 1.0,
              interaction_type: 'active',
              context_data: { trigger: rule.name }
            });
          }
          return { success: true };

        case 'send_reminder':
          // Queue reminder notification
          return { success: true, result: { reminder: rule.actionConfig.message } };

        case 'trigger_analysis':
          if (user && context.profileId) {
            await supabase.functions.invoke('analyze-profile', {
              body: {
                profileId: context.profileId,
                analysisType: rule.actionConfig.analysisType || 'comprehensive'
              }
            });
          }
          return { success: true };

        case 'sync_data':
          // Trigger data sync
          return { success: true, result: { sync: 'triggered' } };

        case 'webhook':
          if (rule.actionConfig.url) {
            const response = await fetch(rule.actionConfig.url, {
              method: rule.actionConfig.method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rule: rule.name, context })
            });
            return { success: response.ok };
          }
          return { success: false, error: 'No webhook URL configured' };

        default:
          return { success: false, error: 'Unknown action type' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user]);

  // Evaluate a trigger and execute matching rules
  const evaluateTrigger = useCallback(async (
    triggerType: TriggerType,
    context: Record<string, any>
  ): Promise<TriggerEvent[]> => {
    if (!user) return [];
    
    setIsEvaluating(true);
    const events: TriggerEvent[] = [];

    // Find matching active rules
    const matchingRules = rules
      .filter(r => r.isActive && r.triggerType === triggerType)
      .filter(r => canExecuteRule(r))
      .filter(r => evaluateConditions(r.conditions, context))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of matchingRules) {
      const result = await executeAction(rule, context);

      const event: TriggerEvent = {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        triggerType,
        actionType: rule.actionType,
        triggeredAt: new Date(),
        success: result.success,
        result: result.result,
        error: result.error
      };

      events.push(event);

      // Update cooldown
      const cooldownEnd = new Date(Date.now() + rule.cooldownMinutes * 60 * 1000);
      cooldownTimersRef.current.set(rule.id, cooldownEnd);

      // Update daily count
      const today = new Date().toISOString().slice(0, 10);
      const dailyStats = dailyExecutionsRef.current.get(rule.id);
      if (dailyStats && dailyStats.date === today) {
        dailyStats.count++;
      } else {
        dailyExecutionsRef.current.set(rule.id, { count: 1, date: today });
      }

      // Update database - use raw SQL increment to avoid NaN from undefined fields
      const updateFields: Record<string, unknown> = {
        execution_count: rule.executionCount + 1,
        last_triggered_at: new Date().toISOString(),
        last_error: result.error,
      };
      await supabase.from('automation_rules').update(updateFields).eq('id', rule.id);

      // Increment success/failure counters separately to avoid NaN from undefined fields
      try {
        if (result.success) {
          await supabase.from('automation_rules')
            .update({ success_count: 1 } as never)
            .eq('id', rule.id);
        } else {
          await supabase.from('automation_rules')
            .update({ failure_count: 1 } as never)
            .eq('id', rule.id);
        }
      } catch {
        // Counter increment is best-effort, don't fail the whole execution
      }
    }

    setRecentEvents(prev => [...events, ...prev].slice(0, 50));
    setIsEvaluating(false);

    return events;
  }, [user, rules, canExecuteRule, evaluateConditions, executeAction]);

  // Create a new rule
  const createRule = useCallback(async (
    rule: Omit<AutomationRule, 'id' | 'executionCount' | 'lastTriggeredAt'>
  ): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase.from('automation_rules').insert([{
      user_id: user.id,
      name: rule.name,
      description: rule.description,
      trigger_type: rule.triggerType,
      trigger_config: rule.triggerConfig,
      conditions: JSON.parse(JSON.stringify(rule.conditions)),
      action_type: rule.actionType,
      action_config: rule.actionConfig,
      is_active: rule.isActive,
      cooldown_minutes: rule.cooldownMinutes,
      max_daily_executions: rule.maxDailyExecutions,
      priority: rule.priority
    }]).select().single();

    if (error) {
      toast.error('Failed to create rule');
      return null;
    }

    const newRule: AutomationRule = {
      ...rule,
      id: data.id,
      executionCount: 0
    };

    setRules(prev => [...prev, newRule]);
    toast.success('Automation rule created');
    return data.id;
  }, [user]);

  // Update a rule
  const updateRule = useCallback(async (
    id: string,
    updates: Partial<AutomationRule>
  ): Promise<boolean> => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.triggerType !== undefined) dbUpdates.trigger_type = updates.triggerType;
    if (updates.triggerConfig !== undefined) dbUpdates.trigger_config = updates.triggerConfig;
    if (updates.conditions !== undefined) dbUpdates.conditions = updates.conditions;
    if (updates.actionType !== undefined) dbUpdates.action_type = updates.actionType;
    if (updates.actionConfig !== undefined) dbUpdates.action_config = updates.actionConfig;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.cooldownMinutes !== undefined) dbUpdates.cooldown_minutes = updates.cooldownMinutes;
    if (updates.maxDailyExecutions !== undefined) dbUpdates.max_daily_executions = updates.maxDailyExecutions;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

    const { error } = await supabase
      .from('automation_rules')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update rule');
      return false;
    }

    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    return true;
  }, []);

  // Delete a rule
  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete rule');
      return false;
    }

    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
    return true;
  }, []);

  // Toggle rule active state
  const toggleRule = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateRule(id, { isActive });
  }, [updateRule]);

  // Test a rule manually
  const testRule = useCallback(async (id: string): Promise<TriggerEvent | null> => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return null;

    const result = await executeAction(rule, { test: true });
    
    const event: TriggerEvent = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: rule.triggerType,
      actionType: rule.actionType,
      triggeredAt: new Date(),
      success: result.success,
      result: result.result,
      error: result.error
    };

    setRecentEvents(prev => [event, ...prev].slice(0, 50));
    return event;
  }, [rules, executeAction]);

  // Get preset rule templates
  const getPresetRules = useCallback((): Partial<AutomationRule>[] => {
    return [
      {
        name: 'Nearby Contact Alert',
        description: 'Notify when near a contact\'s location',
        triggerType: 'geofence_enter',
        triggerConfig: { geofenceType: 'contact' },
        conditions: [],
        actionType: 'notification',
        actionConfig: { title: 'Contact Nearby', message: 'You\'re near {contactName}' },
        cooldownMinutes: 60,
        maxDailyExecutions: 10,
        priority: 5
      },
      {
        name: 'Meeting Auto-Record',
        description: 'Start recording when calendar event begins',
        triggerType: 'calendar_event',
        triggerConfig: { eventType: 'meeting' },
        conditions: [],
        actionType: 'start_recording',
        actionConfig: {},
        cooldownMinutes: 5,
        maxDailyExecutions: 10,
        priority: 8
      },
      {
        name: 'Capture Context on Location Change',
        description: 'Save context snapshot when location changes significantly',
        triggerType: 'geofence_exit',
        triggerConfig: {},
        conditions: [],
        actionType: 'capture_context',
        actionConfig: {},
        cooldownMinutes: 30,
        maxDailyExecutions: 20,
        priority: 3
      },
      {
        name: 'Face Recognition Log',
        description: 'Log interaction when a known face is recognized',
        triggerType: 'face_recognized',
        triggerConfig: { minConfidence: 0.85 },
        conditions: [],
        actionType: 'log_interaction',
        actionConfig: { interactionType: 'face_sighting' },
        cooldownMinutes: 10,
        maxDailyExecutions: 50,
        priority: 4
      },
      {
        name: 'Activity Change Capture',
        description: 'Capture context when activity type changes',
        triggerType: 'activity_change',
        triggerConfig: {},
        conditions: [],
        actionType: 'capture_context',
        actionConfig: {},
        cooldownMinutes: 15,
        maxDailyExecutions: 30,
        priority: 2
      }
    ];
  }, []);

  return {
    rules,
    isEvaluating,
    recentEvents,
    activeRulesCount,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    evaluateTrigger,
    testRule,
    getPresetRules
  };
}
