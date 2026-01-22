/**
 * SOP Distillation Engine (MUSE Framework)
 * Reflect Agent that evaluates completed tasks and distills successful patterns
 * into reusable Standard Operating Procedures (SOPs).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOPDistillationRequest {
  userId?: string;
  user_id?: string;
  profileId?: string;
  profile_id?: string;
  executionId?: string;
  execution_id?: string;
  analysisId?: string;
  analysis_id?: string;
  reflectionType?: string;
  reflection_type?: string;
  forceReflect?: boolean;
}

interface EvaluationScore {
  dimension: string;
  score: number;
  rationale: string;
}

interface ReflectionResult {
  overall_success: boolean;
  evaluation_scores: EvaluationScore[];
  distilled_sop: {
    sop_key: string;
    sop_name: string;
    description: string;
    trigger_conditions: string[];
    action_sequence: Array<{ step: number; action: string; expected_outcome: string }>;
    success_criteria: string[];
  } | null;
  failure_analysis: {
    failure_type: string;
    root_cause: string;
    contributing_factors: string[];
    recommended_fixes: string[];
  } | null;
  improvement_suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'sop-distillation-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request with normalization
    const body = await req.json() as SOPDistillationRequest;
    const userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;
    const executionId = body.executionId || body.execution_id;
    const analysisId = body.analysisId || body.analysis_id;
    const reflectionType = body.reflectionType || body.reflection_type || 'task_completion';
    const forceReflect = body.forceReflect ?? false;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!executionId && !analysisId) {
      return new Response(JSON.stringify({ error: 'executionId or analysisId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load reflection configuration
    const { data: reflectConfig, error: configError } = await supabase
      .from('reflect_agent_config')
      .select('*')
      .eq('reflection_type', reflectionType)
      .eq('is_active', true)
      .single();

    if (configError || !reflectConfig) {
      return new Response(JSON.stringify({ 
        error: `Reflection config not found for type: ${reflectionType}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evaluationDimensions = reflectConfig.evaluation_dimensions as Array<{
      name: string;
      weight: number;
      criteria: string;
    }>;
    const minConfidenceForSOP = reflectConfig.min_confidence_for_sop || 0.8;
    const sopGenerationEnabled = reflectConfig.sop_generation_enabled !== false;
    const failureAnalysisEnabled = reflectConfig.failure_analysis_enabled !== false;

    // Load source data
    let sourceData: Record<string, unknown> = {};
    let sourceType: 'execution' | 'analysis' = 'analysis';

    if (executionId) {
      const { data: execution } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('id', executionId)
        .single();
      
      if (execution) {
        sourceData = execution;
        sourceType = 'execution';
      }
    } else if (analysisId) {
      const { data: analysis } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      if (analysis) {
        sourceData = analysis;
        sourceType = 'analysis';
      }
    }

    if (Object.keys(sourceData).length === 0) {
      return new Response(JSON.stringify({ error: 'Source data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load prompt for reflection
    const { data: promptData } = await supabase
      .from('prompt_versions')
      .select('prompt_text')
      .eq('prompt_key', reflectConfig.prompt_key)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const systemPrompt = promptData?.prompt_text || `You are a Reflect Agent implementing the MUSE framework. 
Your role is to evaluate completed tasks across multiple dimensions and identify patterns for improvement.`;

    const userPrompt = `Evaluate this completed ${sourceType} and extract learnings.

SOURCE DATA:
${JSON.stringify(sourceData, null, 2)}

EVALUATION DIMENSIONS:
${evaluationDimensions.map((d, i) => `${i + 1}. ${d.name} (weight: ${d.weight}): ${d.criteria}`).join('\n')}

Analyze the ${sourceType} and respond with a JSON object:
{
  "overall_success": true/false,
  "evaluation_scores": [
    {"dimension": "name", "score": 0.0-1.0, "rationale": "explanation"}
  ],
  "distilled_sop": {
    "sop_key": "snake_case_identifier",
    "sop_name": "Human Readable Name",
    "description": "What this SOP accomplishes",
    "trigger_conditions": ["When to apply this SOP"],
    "action_sequence": [{"step": 1, "action": "Do X", "expected_outcome": "Y happens"}],
    "success_criteria": ["How to verify success"]
  },
  "failure_analysis": {
    "failure_type": "data_corruption|incomplete_output|hallucination|timeout|other",
    "root_cause": "What went wrong",
    "contributing_factors": ["factor 1", "factor 2"],
    "recommended_fixes": ["fix 1", "fix 2"]
  },
  "improvement_suggestions": ["suggestion 1", "suggestion 2"]
}

If successful, include distilled_sop. If failed, include failure_analysis. Always include improvement_suggestions.`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId,
      functionName: 'sop-distillation-engine',
      profileId,
      temperature: 0.4,
      maxTokens: 3000,
      promptKey: reflectConfig.prompt_key,
    });

    const reflection = parseAIJson<ReflectionResult>(aiResponse.content, {
      overall_success: false,
      evaluation_scores: [],
      distilled_sop: null,
      failure_analysis: null,
      improvement_suggestions: []
    });

    // Calculate weighted overall score
    const totalWeight = evaluationDimensions.reduce((sum, d) => sum + d.weight, 0);
    const weightedScore = reflection.evaluation_scores.reduce((sum, score) => {
      const dimension = evaluationDimensions.find(d => d.name === score.dimension);
      return sum + (score.score * (dimension?.weight || 0));
    }, 0) / (totalWeight || 1);

    let distilledSopId: string | null = null;

    // Create or update SOP if successful and above confidence threshold
    if (reflection.overall_success && reflection.distilled_sop && 
        sopGenerationEnabled && weightedScore >= minConfidenceForSOP) {
      
      const sop = reflection.distilled_sop;
      const sopKey = sop.sop_key;
      
      // Check for existing SOP
      const { data: existingSop } = await supabase
        .from('procedural_memory')
        .select('id, usage_count, success_rate, source_task_ids')
        .eq('user_id', userId)
        .eq('sop_key', sopKey)
        .single();

      if (existingSop) {
        // Update existing SOP - manually append to array
        const existingTaskIds = (existingSop.source_task_ids || []) as string[];
        const newTaskId = executionId || analysisId;
        const updatedTaskIds = newTaskId && !existingTaskIds.includes(newTaskId) 
          ? [...existingTaskIds, newTaskId]
          : existingTaskIds;
        
        const newSuccessRate = ((existingSop.success_rate || 0) + weightedScore) / 2;
        await supabase
          .from('procedural_memory')
          .update({
            action_sequence: sop.action_sequence,
            success_criteria: sop.success_criteria,
            confidence_score: weightedScore,
            success_rate: newSuccessRate,
            source_task_ids: updatedTaskIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSop.id);
        
        distilledSopId = existingSop.id;
      } else {
        // Create new SOP
        const { data: newSop, error: sopError } = await supabase
          .from('procedural_memory')
          .insert({
            user_id: userId,
            sop_key: sopKey,
            sop_name: sop.sop_name,
            description: sop.description,
            trigger_conditions: sop.trigger_conditions,
            action_sequence: sop.action_sequence,
            success_criteria: sop.success_criteria,
            source_task_ids: [executionId || analysisId].filter(Boolean),
            confidence_score: weightedScore,
            success_rate: weightedScore,
          })
          .select('id')
          .single();

        if (!sopError && newSop) {
          distilledSopId = newSop.id;
        }
      }
    }

    // Create failure analysis report if failed
    let failureReportId: string | null = null;
    if (!reflection.overall_success && reflection.failure_analysis && failureAnalysisEnabled) {
      const { data: failureReport, error: failureError } = await supabase
        .from('failure_analysis_reports')
        .insert({
          user_id: userId,
          profile_id: profileId,
          source_execution_id: executionId || null,
          failure_type: reflection.failure_analysis.failure_type,
          root_cause_analysis: reflection.failure_analysis.root_cause,
          contributing_factors: reflection.failure_analysis.contributing_factors,
          recommended_fixes: reflection.failure_analysis.recommended_fixes,
          severity: weightedScore < 0.3 ? 'high' : weightedScore < 0.5 ? 'medium' : 'low',
        })
        .select('id')
        .single();

      if (!failureError && failureReport) {
        failureReportId = failureReport.id;
      }
    }

    // Store reflection result
    await supabase.from('task_reflections').insert({
      user_id: userId,
      profile_id: profileId,
      source_execution_id: executionId || null,
      source_analysis_id: analysisId || null,
      reflection_type: reflectionType,
      evaluation_scores: reflection.evaluation_scores,
      overall_success: reflection.overall_success,
      distilled_sop_id: distilledSopId,
      failure_analysis: reflection.failure_analysis,
      improvement_suggestions: reflection.improvement_suggestions,
      cost_cents: aiResponse.costCents,
    });

    return new Response(JSON.stringify({
      success: true,
      overallSuccess: reflection.overall_success,
      weightedScore,
      evaluationScores: reflection.evaluation_scores,
      distilledSopId,
      sopGenerated: !!distilledSopId,
      failureReportId,
      improvementSuggestions: reflection.improvement_suggestions,
      costCents: aiResponse.costCents,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SOP distillation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
