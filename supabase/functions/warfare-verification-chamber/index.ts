/**
 * Warfare Verification Chamber
 * Multi-stage verification pipeline for high-stakes warfare campaigns
 * 
 * Implements Planner → Red Team → Legal → Verifier pipeline
 * with unanimous approval requirement for critical operations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';
import { startTraceSession, endTraceSession } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  userId?: string;
  user_id?: string;
  profileId?: string;
  profile_id?: string;
  campaignId?: string;
  campaign_id?: string;
  chamberType?: string;
  chamber_type?: string;
  campaignData: Record<string, unknown>;
  campaign_data?: Record<string, unknown>;
}

interface StageReview {
  stage_key: string;
  verdict: 'approved' | 'rejected' | 'needs_modification';
  confidence_score: number;
  review_rationale: string;
  identified_risks: Array<{ risk: string; severity: string; mitigation?: string }>;
  suggested_modifications: string[];
  veto_exercised: boolean;
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
      function: 'warfare-verification-chamber', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request with normalization
    const body = await req.json() as VerificationRequest;
    const userId = body.userId || body.user_id;
    const profileId = body.profileId || body.profile_id;
    const campaignId = body.campaignId || body.campaign_id;
    const chamberType = body.chamberType || body.chamber_type || 'warfare_campaign';
    const campaignData = body.campaignData || body.campaign_data || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start trace session
    const traceSession = await startTraceSession(supabase, userId, 'verification');

    // Load chamber configuration
    const { data: chamberConfig, error: configError } = await supabase
      .from('verification_chamber_config')
      .select('*')
      .eq('chamber_type', chamberType)
      .eq('is_active', true)
      .single();

    if (configError || !chamberConfig) {
      return new Response(JSON.stringify({ 
        error: `Chamber configuration not found for type: ${chamberType}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verificationStages = chamberConfig.verification_stages as Array<{ stage_key: string; order: number }>;
    const requireUnanimous = chamberConfig.require_unanimous !== false;
    const timeoutPerStage = chamberConfig.timeout_per_stage_ms || 30000;

    // Load stage definitions
    const stageKeys = verificationStages.map(s => s.stage_key);
    const { data: stageDefs, error: stageError } = await supabase
      .from('verification_stages')
      .select('*')
      .in('stage_key', stageKeys)
      .eq('is_active', true);

    if (stageError || !stageDefs || stageDefs.length === 0) {
      return new Response(JSON.stringify({ error: 'No active verification stages found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create stage map for quick lookup
    const stageMap = new Map(stageDefs.map(s => [s.stage_key, s]));
    
    // Sort stages by order
    const orderedStages = verificationStages
      .sort((a, b) => a.order - b.order)
      .map(s => stageMap.get(s.stage_key))
      .filter(Boolean);

    // Generate review session ID
    const reviewSessionId = crypto.randomUUID();
    const startTime = Date.now();

    const stageReviews: StageReview[] = [];
    let totalCostCents = 0;
    let blockingStage: string | null = null;
    let allModifications: string[] = [];

    // Execute stages sequentially
    for (let i = 0; i < orderedStages.length; i++) {
      const stage = orderedStages[i]!;
      const stageStartTime = Date.now();

      // Load prompt for this stage
      const { data: promptData } = await supabase
        .from('prompt_versions')
        .select('prompt_text')
        .eq('prompt_key', stage.prompt_key)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const focusCriteria = stage.focus_criteria as { evaluate: string[] };
      const evaluationAreas = focusCriteria?.evaluate || ['overall_assessment'];

      const systemPrompt = promptData?.prompt_text || 
        `You are the ${stage.display_name} reviewer. Your role is to evaluate campaigns focusing on: ${evaluationAreas.join(', ')}.`;

      // Build context from previous reviews
      const previousReviews = stageReviews.map(r => 
        `[${r.stage_key}] Verdict: ${r.verdict}, Confidence: ${r.confidence_score}\n` +
        `Rationale: ${r.review_rationale}\n` +
        `Risks: ${r.identified_risks.map(risk => risk.risk).join(', ')}`
      ).join('\n\n');

      const userPrompt = `Review this campaign for ${stage.display_name} concerns.

CAMPAIGN DATA:
${JSON.stringify(campaignData, null, 2)}

EVALUATION FOCUS:
${evaluationAreas.map((area, idx) => `${idx + 1}. ${area}`).join('\n')}

${previousReviews ? `PREVIOUS STAGE REVIEWS:\n${previousReviews}` : ''}

${allModifications.length > 0 ? `PENDING MODIFICATIONS:\n${allModifications.join('\n')}` : ''}

Respond with a JSON object:
{
  "verdict": "approved" | "rejected" | "needs_modification",
  "confidence_score": 0.0-1.0,
  "review_rationale": "Detailed explanation",
  "identified_risks": [{"risk": "description", "severity": "low|medium|high|critical", "mitigation": "optional suggestion"}],
  "suggested_modifications": ["modification 1", "modification 2"],
  "veto_exercised": false
}`;

      const aiResponse = await callAI({
        model: selectModel(stage.model_tier || 'quality'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        userId,
        functionName: 'warfare-verification-chamber',
        profileId,
        temperature: 0.5,
        maxTokens: 2000,
        promptKey: stage.prompt_key,
      });

      totalCostCents += aiResponse.costCents;

      const review = parseAIJson<StageReview>(aiResponse.content, {
        stage_key: stage.stage_key,
        verdict: 'needs_modification',
        confidence_score: 0.5,
        review_rationale: 'Unable to complete review',
        identified_risks: [],
        suggested_modifications: [],
        veto_exercised: false
      });

      review.stage_key = stage.stage_key;

      // Persist review
      const processingTime = Date.now() - stageStartTime;
      await supabase.from('decision_reviews').insert({
        user_id: userId,
        profile_id: profileId,
        campaign_id: campaignId,
        chamber_type: chamberType,
        review_session_id: reviewSessionId,
        stage_key: stage.stage_key,
        stage_order: i + 1,
        reviewer_verdict: review.verdict,
        confidence_score: review.confidence_score,
        review_rationale: review.review_rationale,
        identified_risks: review.identified_risks,
        suggested_modifications: review.suggested_modifications,
        veto_exercised: review.veto_exercised,
        cost_cents: aiResponse.costCents,
        processing_time_ms: processingTime,
      });

      stageReviews.push(review);

      // Accumulate modifications
      if (review.suggested_modifications.length > 0) {
        allModifications = [...allModifications, ...review.suggested_modifications];
      }

      // Check for veto or rejection (if unanimous required)
      if (review.veto_exercised || (requireUnanimous && review.verdict === 'rejected')) {
        blockingStage = stage.stage_key;
        break;
      }
    }

    // Determine final verdict
    const stagesPassed = stageReviews.filter(r => r.verdict === 'approved').length;
    const hasModifications = stageReviews.some(r => r.verdict === 'needs_modification');
    
    let finalVerdict: 'approved' | 'rejected' | 'modified_approved';
    let unanimousApproval = false;

    if (blockingStage) {
      finalVerdict = 'rejected';
    } else if (stagesPassed === stageReviews.length) {
      finalVerdict = 'approved';
      unanimousApproval = true;
    } else if (hasModifications && !requireUnanimous) {
      finalVerdict = 'modified_approved';
    } else {
      finalVerdict = 'rejected';
    }

    const totalProcessingMs = Date.now() - startTime;

    // Persist chamber decision
    await supabase.from('chamber_decisions').insert({
      user_id: userId,
      profile_id: profileId,
      campaign_id: campaignId,
      chamber_type: chamberType,
      review_session_id: reviewSessionId,
      final_verdict: finalVerdict,
      unanimous_approval: unanimousApproval,
      stages_passed: stagesPassed,
      stages_total: orderedStages.length,
      blocking_stage: blockingStage,
      applied_modifications: allModifications,
      total_cost_cents: totalCostCents,
      total_processing_ms: totalProcessingMs,
    });

    // End trace session
    if (traceSession) {
      await endTraceSession(supabase, traceSession.sessionId, 'completed', totalCostCents);
    }

    return new Response(JSON.stringify({
      success: true,
      reviewSessionId,
      chamberType,
      finalVerdict,
      unanimousApproval,
      stagesPassed,
      stagesTotal: orderedStages.length,
      blockingStage,
      appliedModifications: allModifications,
      stageReviews: stageReviews.map(r => ({
        stage: r.stage_key,
        verdict: r.verdict,
        confidence: r.confidence_score,
        risksIdentified: r.identified_risks.length,
      })),
      totalCostCents,
      totalProcessingMs,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verification chamber error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
