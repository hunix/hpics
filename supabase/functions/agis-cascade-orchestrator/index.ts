// AGIS Cascade Orchestrator - Automated Cross-Phase Rule Execution
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CascadeRequest {
  userId: string;
  triggerPhase: number;
  eventType: string;
  eventData?: Record<string, unknown>;
  sourceId?: string;
}

interface CascadeRule {
  id: string;
  rule_name: string;
  source_phase: number;
  target_phase: number;
  trigger_condition: Record<string, unknown>;
  target_action: string;
  action_params: Record<string, unknown> | null;
  priority: number;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  is_active: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, triggerPhase, eventType, eventData, sourceId }: CascadeRequest = await req.json();

    if (!userId || !triggerPhase || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, triggerPhase, eventType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch applicable cascade rules
    const { data: rules, error: rulesError } = await supabase
      .from('agis_cascade_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('source_phase', triggerPhase)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;

    const executedActions: Array<{ ruleId: string; ruleName: string; targetPhase: number; action: string; success: boolean }> = [];
    const affectedPhases: number[] = [];
    const cascadePath: Array<{ phase: number; action: string; timestamp: string }> = [
      { phase: triggerPhase, action: eventType, timestamp: new Date().toISOString() }
    ];

    // Process each matching rule
    for (const rule of (rules as CascadeRule[]) || []) {
      // Check cooldown
      if (rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownMs = (rule.cooldown_minutes || 5) * 60 * 1000;
        if (Date.now() - lastTriggered.getTime() < cooldownMs) {
          continue; // Skip - still in cooldown
        }
      }

      // Evaluate trigger condition
      const conditionMet = evaluateCondition(rule.trigger_condition, eventType, eventData);
      if (!conditionMet) continue;

      // Execute target action
      let actionSuccess = false;
      try {
        actionSuccess = await executeAction(supabase, userId, rule.target_phase, rule.target_action, rule.action_params);
        
        if (actionSuccess) {
          affectedPhases.push(rule.target_phase);
          cascadePath.push({
            phase: rule.target_phase,
            action: rule.target_action,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(`Action execution failed for rule ${rule.id}:`, err);
      }

      // Update rule trigger count
      await supabase
        .from('agis_cascade_rules')
        .update({
          trigger_count: (rule as any).trigger_count + 1,
          last_triggered_at: new Date().toISOString(),
        })
        .eq('id', rule.id);

      executedActions.push({
        ruleId: rule.id,
        ruleName: rule.rule_name,
        targetPhase: rule.target_phase,
        action: rule.target_action,
        success: actionSuccess,
      });

      // Update phase synergies
      if (actionSuccess) {
        await updatePhaseSynergy(supabase, userId, triggerPhase, rule.target_phase, true);
      }
    }

    // Create cascade event record
    const { data: cascadeEvent, error: eventError } = await supabase
      .from('agis_cascade_events')
      .insert({
        user_id: userId,
        trigger_phase: triggerPhase,
        trigger_event_type: eventType,
        trigger_source_id: sourceId || null,
        affected_phases: [...new Set(affectedPhases)],
        cascade_path: cascadePath,
        execution_log: executedActions,
        started_at: cascadePath[0].timestamp,
        completed_at: new Date().toISOString(),
        outcome_status: executedActions.every(a => a.success) ? 'success' : 
                        executedActions.some(a => a.success) ? 'partial' : 'failed',
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Update global state if phases were affected
    if (affectedPhases.length > 0) {
      await updateGlobalStateAfterCascade(supabase, userId, affectedPhases);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cascadeEventId: cascadeEvent.id,
        rulesEvaluated: rules?.length || 0,
        actionsExecuted: executedActions.length,
        affectedPhases: [...new Set(affectedPhases)],
        executedActions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cascade orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function evaluateCondition(
  condition: Record<string, unknown>,
  eventType: string,
  eventData?: Record<string, unknown>
): boolean {
  // Simple condition evaluation
  if (condition.eventType && condition.eventType !== eventType) return false;
  
  if (condition.minValue && eventData?.value) {
    if ((eventData.value as number) < (condition.minValue as number)) return false;
  }
  
  if (condition.maxValue && eventData?.value) {
    if ((eventData.value as number) > (condition.maxValue as number)) return false;
  }

  if (condition.requiredFields && Array.isArray(condition.requiredFields)) {
    for (const field of condition.requiredFields) {
      if (!eventData || !(field in eventData)) return false;
    }
  }

  return true;
}

async function executeAction(
  supabase: any,
  userId: string,
  targetPhase: number,
  action: string,
  params: Record<string, unknown> | null
): Promise<boolean> {
  // Map actions to phase-specific operations
  switch (action) {
    case 'update_health':
      return await updatePhaseHealth(supabase, userId, targetPhase, params?.delta as number || 5);
    
    case 'trigger_analysis':
      // Record that analysis was triggered
      await supabase.from('agis_analytics').insert({
        user_id: userId,
        phase: targetPhase,
        metric_type: 'cascade_triggered_analysis',
        metric_value: 1,
        metric_metadata: params,
      });
      return true;
    
    case 'create_objective':
      await supabase.from('agis_objective_tracking').insert({
        user_id: userId,
        objective_name: params?.name || `Auto-generated from Phase ${targetPhase}`,
        objective_type: params?.type || 'cascade_generated',
        starting_phase: targetPhase,
        current_phase: targetPhase,
        is_active: true,
      });
      return true;
    
    case 'notify':
      // In production, this would trigger push notification
      console.log(`Notification for user ${userId}: Phase ${targetPhase} action triggered`);
      return true;
    
    default:
      console.log(`Unknown action: ${action}`);
      return false;
  }
}

async function updatePhaseHealth(
  supabase: any,
  userId: string,
  phase: number,
  delta: number
): Promise<boolean> {
  const { data: state } = await supabase
    .from('agis_global_state')
    .select('phase_health_scores')
    .eq('user_id', userId)
    .maybeSingle();

  if (!state) return false;

  const scores = state.phase_health_scores || {};
  const phaseKey = phase.toString();
  const currentHealth = scores[phaseKey]?.health || 100;
  const newHealth = Math.max(0, Math.min(100, currentHealth + delta));

  scores[phaseKey] = {
    ...scores[phaseKey],
    health: newHealth,
    lastActivity: new Date().toISOString(),
  };

  await supabase
    .from('agis_global_state')
    .update({ phase_health_scores: scores, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return true;
}

async function updatePhaseSynergy(
  supabase: any,
  userId: string,
  phaseA: number,
  phaseB: number,
  success: boolean
): Promise<void> {
  const minPhase = Math.min(phaseA, phaseB);
  const maxPhase = Math.max(phaseA, phaseB);

  const { data: existing } = await supabase
    .from('agis_phase_synergies')
    .select('*')
    .eq('user_id', userId)
    .eq('phase_a', minPhase)
    .eq('phase_b', maxPhase)
    .maybeSingle();

  if (existing) {
    const newCount = (existing.interaction_count || 0) + 1;
    const newSuccess = success ? (existing.successful_cascades || 0) + 1 : existing.successful_cascades || 0;
    
    await supabase
      .from('agis_phase_synergies')
      .update({
        interaction_count: newCount,
        successful_cascades: newSuccess,
        synergy_score: (newSuccess / newCount) * 100,
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('agis_phase_synergies')
      .insert({
        user_id: userId,
        phase_a: minPhase,
        phase_b: maxPhase,
        synergy_score: success ? 100 : 0,
        interaction_count: 1,
        successful_cascades: success ? 1 : 0,
        synergy_type: 'cascade',
      });
  }
}

async function updateGlobalStateAfterCascade(
  supabase: any,
  userId: string,
  affectedPhases: number[]
): Promise<void> {
  const { data: state } = await supabase
    .from('agis_global_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!state) return;

  // Increment total operations count
  await supabase
    .from('agis_global_state')
    .update({
      total_operations_count: (state.total_operations_count || 0) + 1,
      last_synthesis_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}
