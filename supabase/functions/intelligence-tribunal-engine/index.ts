/**
 * Intelligence Tribunal Engine
 * Multi-agent deliberation system for high-stakes intelligence decisions
 * 
 * Implements structured argumentation where multiple advocate agents
 * debate to reach consensus on critical assessments.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';
import { withSpan, startTraceSession, endTraceSession } from '../_shared/observability.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TribunalRequest {
  userId?: string;
  user_id?: string;
  profileId?: string;
  profile_id?: string;
  tribunalType: string;
  tribunal_type?: string;
  subjectData: Record<string, unknown>;
  subject_data?: Record<string, unknown>;
  contextData?: Record<string, unknown>;
  context_data?: Record<string, unknown>;
}

interface AdvocateRole {
  role: string;
  prompt_key: string;
  focus_area: string;
}

interface Argument {
  position: 'support' | 'oppose' | 'neutral' | 'abstain';
  argument_text: string;
  evidence_references: Array<{ source_type: string; source_id?: string; excerpt: string }>;
  confidence_score: number;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'intelligence-tribunal-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate: validate JWT or service role key
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isServiceRole = token === supabaseServiceKey;
    let userId: string | undefined;

    // Parse request with field normalization
    const body = await req.json() as TribunalRequest;
    const profileId = body.profileId || body.profile_id;

    if (isServiceRole) {
      userId = body.userId || body.user_id;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }
    const tribunalType = body.tribunalType || body.tribunal_type || 'threat_assessment';
    const subjectData = body.subjectData || body.subject_data || {};
    const contextData = body.contextData || body.context_data || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start trace session
    const traceSession = await startTraceSession(supabase, userId, 'tribunal');

    // Load tribunal configuration from database
    const { data: tribunalConfig, error: configError } = await supabase
      .from('agent_tribunal_config')
      .select('*')
      .eq('tribunal_type', tribunalType)
      .eq('is_active', true)
      .single();

    if (configError || !tribunalConfig) {
      return new Response(JSON.stringify({ 
        error: `Tribunal configuration not found for type: ${tribunalType}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const advocateRoles = tribunalConfig.advocate_roles as AdvocateRole[];
    const consensusThreshold = tribunalConfig.consensus_threshold || 0.67;
    const stabilityRounds = tribunalConfig.stability_rounds || 2;
    const maxRounds = 5;

    // Generate deliberation session ID
    const deliberationSessionId = crypto.randomUUID();

    // Track arguments by round
    const allArguments: Array<{
      round: number;
      role: string;
      argument: Argument;
      costCents: number;
    }> = [];

    let consensusReached = false;
    let currentRound = 0;
    let stabilityCount = 0;
    let lastConsensusState: string | null = null;
    let totalCostCents = 0;

    // Execute deliberation rounds
    while (currentRound < maxRounds && !consensusReached) {
      currentRound++;
      const roundArguments: Argument[] = [];

      // Each advocate argues in parallel
      const advocatePromises = advocateRoles.map(async (advocate) => {
        // Load prompt from prompt_versions
        const { data: promptData } = await supabase
          .from('prompt_versions')
          .select('prompt_text, variables')
          .eq('prompt_key', advocate.prompt_key)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        const basePrompt = promptData?.prompt_text || `You are the ${advocate.role} in an intelligence tribunal. Focus on ${advocate.focus_area}.`;
        
        // Build previous arguments context
        const previousArguments = allArguments
          .filter(a => a.round === currentRound - 1)
          .map(a => `[${a.role}] Position: ${a.argument.position}, Confidence: ${a.argument.confidence_score}\n${a.argument.argument_text}`)
          .join('\n\n');

        const systemPrompt = basePrompt
          .replace('{{subject_data}}', JSON.stringify(subjectData, null, 2))
          .replace('{{previous_arguments}}', previousArguments || 'No previous arguments - this is round 1.');

        const userPrompt = `Analyze the subject and provide your ${advocate.focus_area} assessment.

SUBJECT DATA:
${JSON.stringify(subjectData, null, 2)}

CONTEXT:
${JSON.stringify(contextData, null, 2)}

${previousArguments ? `PREVIOUS ROUND ARGUMENTS:\n${previousArguments}` : ''}

Respond with a JSON object containing:
{
  "position": "support" | "oppose" | "neutral" | "abstain",
  "argument_text": "Your detailed argument (200-400 words)",
  "evidence_references": [{"source_type": "...", "excerpt": "..."}],
  "confidence_score": 0.0-1.0
}`;

        const aiResponse = await callAI({
          model: selectModel('quality'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          userId,
          functionName: 'intelligence-tribunal-engine',
          profileId,
          temperature: 0.7,
          maxTokens: 2000,
          promptKey: advocate.prompt_key,
        });

        const argument = parseAIJson<Argument>(aiResponse.content, {
          position: 'neutral',
          argument_text: 'Unable to form position',
          evidence_references: [],
          confidence_score: 0.5
        });

        return {
          role: advocate.role,
          argument,
          costCents: aiResponse.costCents
        };
      });

      const advocateResults = await Promise.all(advocatePromises);

      // Record arguments
      for (const result of advocateResults) {
        allArguments.push({
          round: currentRound,
          role: result.role,
          argument: result.argument,
          costCents: result.costCents
        });
        totalCostCents += result.costCents;

        // Persist to database
        await supabase.from('agent_deliberations').insert({
          user_id: userId,
          profile_id: profileId,
          tribunal_type: tribunalType,
          deliberation_session_id: deliberationSessionId,
          round_number: currentRound,
          agent_role: result.role,
          position: result.argument.position,
          argument_text: result.argument.argument_text,
          evidence_references: result.argument.evidence_references,
          confidence_score: result.argument.confidence_score,
          cost_cents: result.costCents,
        });

        roundArguments.push(result.argument);
      }

      // Check consensus
      const positionCounts: Record<string, number> = {};
      const totalConfidence = roundArguments.reduce((sum, arg) => {
        positionCounts[arg.position] = (positionCounts[arg.position] || 0) + 1;
        return sum + arg.confidence_score;
      }, 0);

      const avgConfidence = totalConfidence / roundArguments.length;
      const dominantPosition = Object.entries(positionCounts)
        .sort((a, b) => b[1] - a[1])[0];
      
      const consensusRatio = dominantPosition[1] / roundArguments.length;
      const currentConsensusState = `${dominantPosition[0]}-${consensusRatio.toFixed(2)}`;

      if (consensusRatio >= consensusThreshold && avgConfidence >= 0.6) {
        if (currentConsensusState === lastConsensusState) {
          stabilityCount++;
          if (stabilityCount >= stabilityRounds) {
            consensusReached = true;
          }
        } else {
          stabilityCount = 1;
          lastConsensusState = currentConsensusState;
        }
      } else {
        stabilityCount = 0;
        lastConsensusState = null;
      }
    }

    // Determine final verdict
    const finalRoundArgs = allArguments.filter(a => a.round === currentRound);
    const supportCount = finalRoundArgs.filter(a => a.argument.position === 'support').length;
    const opposeCount = finalRoundArgs.filter(a => a.argument.position === 'oppose').length;
    const avgFinalConfidence = finalRoundArgs.reduce((sum, a) => sum + a.argument.confidence_score, 0) / finalRoundArgs.length;

    let verdict: 'approved' | 'rejected' | 'escalated' | 'deferred';
    if (consensusReached) {
      verdict = supportCount > opposeCount ? 'approved' : 'rejected';
    } else if (currentRound >= maxRounds) {
      verdict = tribunalConfig.auto_escalate_to_arbitrator ? 'escalated' : 'deferred';
    } else {
      verdict = 'deferred';
    }

    // Generate verdict rationale
    const verdictRationale = `After ${currentRound} rounds of deliberation, the tribunal reached a ${verdict} decision. ` +
      `Support: ${supportCount}, Oppose: ${opposeCount}. ` +
      `Average confidence: ${(avgFinalConfidence * 100).toFixed(1)}%. ` +
      `Consensus ${consensusReached ? 'was reached' : 'was not reached'}.`;

    // Collect dissenting opinions
    const dissentingOpinions = finalRoundArgs
      .filter(a => 
        (verdict === 'approved' && a.argument.position === 'oppose') ||
        (verdict === 'rejected' && a.argument.position === 'support')
      )
      .map(a => ({
        role: a.role,
        position: a.argument.position,
        rationale: a.argument.argument_text.substring(0, 500)
      }));

    // Persist verdict
    await supabase.from('tribunal_verdicts').insert({
      user_id: userId,
      profile_id: profileId,
      deliberation_session_id: deliberationSessionId,
      tribunal_type: tribunalType,
      verdict,
      consensus_reached: consensusReached,
      final_confidence: avgFinalConfidence,
      total_rounds: currentRound,
      participating_agents: advocateRoles.map(a => a.role),
      verdict_rationale: verdictRationale,
      dissenting_opinions: dissentingOpinions,
      arbitrator_involved: verdict === 'escalated',
      total_cost_cents: totalCostCents,
    });

    // End trace session
    if (traceSession) {
      await endTraceSession(supabase, traceSession.sessionId, 'completed', totalCostCents);
    }

    return new Response(JSON.stringify({
      success: true,
      deliberationSessionId,
      tribunalType,
      verdict,
      consensusReached,
      totalRounds: currentRound,
      finalConfidence: avgFinalConfidence,
      participatingAgents: advocateRoles.map(a => a.role),
      verdictRationale,
      dissentingOpinions,
      totalCostCents,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tribunal engine error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
