/**
 * AGIS Orchestrator — Phase 2 World-Class Implementation
 *
 * Master orchestrator for the multi-agent intelligence pipeline.
 * Accepts a goal + contact context, orchestrates 5 specialized agents
 * through a structured pipeline with CoT scaffolding and self-verification.
 *
 * Pipeline:
 *   1. Complexity Assessment → Model Routing
 *   2. ResearchAgent → memory retrieval + OSINT
 *   3. AnalystAgent → pattern analysis + contradiction detection
 *   4. StrategistAgent → strategic assessment + leverage mapping
 *   5. CriticAgent → adversarial challenge of all above
 *   6. SynthesizerAgent → final calibrated report
 *   7. Self-Verification Loop (if confidence < 70)
 *   8. Store report + episodic events
 *
 * Optional: Debate Mode (Optimist vs Pessimist with Judge)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  AGENT_REGISTRY,
  DEBATE_AGENTS,
  scoreQueryComplexity,
  getModelForComplexity,
  type AgentRole,
} from "../_shared/agis-agent-registry.ts";
import { getRAGContext } from "../_shared/rag-helper.ts";
import { logLLMObservability, startTimer } from "../_shared/llm-observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_BASE_URL = "https://ai.gateway.lovable.dev/v1";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface OrchestratorRequest {
  goal: string;
  profileId: string;
  mode?: "standard" | "debate" | "deep_analysis";
  agisPhases?: number[];
  contextOverride?: string;
  maxAgentTurns?: number;
}

interface AgentTurn {
  agent_role: AgentRole;
  model: string;
  thinking: string | null;
  output: Record<string, unknown>;
  duration_ms: number;
  tokens: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Core LLM call with optional streaming capture
// ──────────────────────────────────────────────────────────────────────────────

async function callAgent(
  systemPrompt: string,
  userContent: string,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<{ content: string; tokens: number; durationMs: number }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const timer = startTimer();

  // Normalize model name for the gateway
  const normalizedModel = model.includes("/") ? model.split("/")[1] : model;

  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: normalizedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  const durationMs = timer();

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const tokens = json.usage?.total_tokens ?? 0;

  return { content, tokens, durationMs };
}

// ──────────────────────────────────────────────────────────────────────────────
// JSON parse with fallback
// ──────────────────────────────────────────────────────────────────────────────

function parseAgentOutput(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { raw_output: raw };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// CoT Scaffolding wrapper
// ──────────────────────────────────────────────────────────────────────────────

function buildCoTPrompt(
  base: string,
  retrievedContext: string,
  step: "retrieve" | "analyze" | "strategize" | "critique" | "synthesize",
): string {
  const stepInstructions: Record<string, string> = {
    retrieve: "Step 1: RETRIEVE all relevant intelligence from memory and context provided.",
    analyze: "Step 2: ANALYZE patterns in the retrieved intelligence. Identify contradictions and anomalies.",
    strategize: "Step 3: Generate STRATEGIC ASSESSMENTS based on the analysis.",
    critique: "Step 4: ADVERSARIALLY CHALLENGE the analysis and strategy. Find weaknesses.",
    synthesize: "Step 5: SYNTHESIZE a final calibrated intelligence report integrating all prior steps.",
  };

  return `${base}

--- RETRIEVED INTELLIGENCE CONTEXT ---
${retrievedContext}

--- YOUR TASK ---
${stepInstructions[step]}

Apply Chain-of-Thought reasoning. Think step by step before producing your structured JSON output.`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Standard Pipeline
// ──────────────────────────────────────────────────────────────────────────────

async function runStandardPipeline(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  req: OrchestratorRequest,
  sessionId: string,
): Promise<{ turns: AgentTurn[]; finalReport: Record<string, unknown>; confidence: number }> {
  const { goal, profileId, agisPhases = [1, 2, 3, 4, 5] } = req;
  const turns: AgentTurn[] = [];
  let accumulatedContext = `GOAL: ${goal}\n`;

  // Step 0: Retrieve context via memory router
  const ragCtx = await getRAGContext(userId, profileId, goal, {
    maxResults: 20,
    sourceTypes: ["document", "observation", "analysis", "message"],
    minRelevance: 0.25,
    useSemanticSearch: true,
  });
  accumulatedContext += `\n--- RETRIEVED MEMORY ---\n${ragCtx.context}`;

  // Step 1: Research Agent
  const researcher = AGENT_REGISTRY.researcher;
  const researchPrompt = buildCoTPrompt(researcher.systemPrompt, accumulatedContext, "retrieve");
  const researchResult = await callAgent(
    researchPrompt,
    `Goal: ${goal}\nSubject Profile ID: ${profileId}`,
    researcher.model,
    researcher.temperature,
    researcher.maxTokens,
  );
  const researchOutput = parseAgentOutput(researchResult.content);
  turns.push({
    agent_role: "researcher",
    model: researcher.model,
    thinking: null,
    output: researchOutput,
    duration_ms: researchResult.durationMs,
    tokens: researchResult.tokens,
  });
  accumulatedContext += `\n\n--- RESEARCH FINDINGS ---\n${JSON.stringify(researchOutput, null, 2)}`;

  // Step 2: Analyst Agent
  const analyst = AGENT_REGISTRY.analyst;
  const analystPrompt = buildCoTPrompt(analyst.systemPrompt, accumulatedContext, "analyze");
  const analysisResult = await callAgent(
    analystPrompt,
    `Goal: ${goal}\nAnalyze the research findings above.`,
    analyst.model,
    analyst.temperature,
    analyst.maxTokens,
  );
  const analysisOutput = parseAgentOutput(analysisResult.content);
  turns.push({
    agent_role: "analyst",
    model: analyst.model,
    thinking: null,
    output: analysisOutput,
    duration_ms: analysisResult.durationMs,
    tokens: analysisResult.tokens,
  });
  accumulatedContext += `\n\n--- ANALYSIS ---\n${JSON.stringify(analysisOutput, null, 2)}`;

  // Step 3: Strategist Agent
  const strategist = AGENT_REGISTRY.strategist;
  const stratPrompt = buildCoTPrompt(strategist.systemPrompt, accumulatedContext, "strategize");
  const stratResult = await callAgent(
    stratPrompt,
    `Goal: ${goal}\nProvide strategic assessment based on research and analysis.`,
    strategist.model,
    strategist.temperature,
    strategist.maxTokens,
  );
  const stratOutput = parseAgentOutput(stratResult.content);
  turns.push({
    agent_role: "strategist",
    model: strategist.model,
    thinking: null,
    output: stratOutput,
    duration_ms: stratResult.durationMs,
    tokens: stratResult.tokens,
  });
  accumulatedContext += `\n\n--- STRATEGIC ASSESSMENT ---\n${JSON.stringify(stratOutput, null, 2)}`;

  // Step 4: Critic Agent
  const critic = AGENT_REGISTRY.critic;
  const criticPrompt = buildCoTPrompt(critic.systemPrompt, accumulatedContext, "critique");
  const criticResult = await callAgent(
    criticPrompt,
    `Goal: ${goal}\nChallenge all conclusions above.`,
    critic.model,
    critic.temperature,
    critic.maxTokens,
  );
  const criticOutput = parseAgentOutput(criticResult.content);
  turns.push({
    agent_role: "critic",
    model: critic.model,
    thinking: null,
    output: criticOutput,
    duration_ms: criticResult.durationMs,
    tokens: criticResult.tokens,
  });
  accumulatedContext += `\n\n--- CRITICAL REVIEW ---\n${JSON.stringify(criticOutput, null, 2)}`;

  // Step 5: Synthesizer Agent
  // Complexity score determines which model synthesizer uses
  const complexityScore = scoreQueryComplexity({
    query: goal,
    hasContradictions: Array.isArray((analysisOutput as Record<string, unknown[]>).contradictions) &&
      ((analysisOutput as Record<string, unknown[]>).contradictions?.length ?? 0) > 0,
    sourceCount: ragCtx.sourceCount,
    agisPhases,
    profileCompleteness: 50, // default; ideally from convergence score
  });

  const synthesizerModel = complexityScore > 70
    ? "gemini-2.5-pro"  // deep thinking for complex queries
    : getModelForComplexity(complexityScore).split("/").pop()!;

  const synthesizer = AGENT_REGISTRY.synthesizer;
  const synthPrompt = buildCoTPrompt(synthesizer.systemPrompt, accumulatedContext, "synthesize");
  const synthResult = await callAgent(
    synthPrompt,
    `Goal: ${goal}\nProduce the final intelligence report.`,
    synthesizerModel,
    synthesizer.temperature,
    synthesizer.maxTokens,
  );
  const synthOutput = parseAgentOutput(synthResult.content);
  turns.push({
    agent_role: "synthesizer",
    model: synthesizerModel,
    thinking: null,
    output: synthOutput,
    duration_ms: synthResult.durationMs,
    tokens: synthResult.tokens,
  });

  const confidence = typeof synthOutput.confidence_score === "number"
    ? synthOutput.confidence_score as number
    : 65;

  // Self-verification loop if confidence < 70
  if (confidence < 70) {
    const verifyResult = await callAgent(
      `You are a verification agent. Review the intelligence report below and:
1. Check for factual consistency with the retrieved evidence
2. Identify any conclusions that overreach the evidence
3. Rate the report's overall accuracy: 0-100
Return JSON: {"verification_score": 0-100, "issues_found": [...], "corrections": [...]}`,
      `Report to verify:\n${JSON.stringify(synthOutput, null, 2)}\n\nOriginal context:\n${ragCtx.context.slice(0, 3000)}`,
      "gpt-4o",
      0.2,
      2048,
    );
    const verification = parseAgentOutput(verifyResult.content);
    synthOutput.self_verification = verification;
    synthOutput.self_verification_score = verification.verification_score;
  }

  return { turns, finalReport: synthOutput, confidence };
}

// ──────────────────────────────────────────────────────────────────────────────
// Debate Mode Pipeline
// ──────────────────────────────────────────────────────────────────────────────

async function runDebatePipeline(
  userId: string,
  profileId: string,
  topic: string,
  evidence: string,
): Promise<{ optimistOutput: Record<string, unknown>; pessimistOutput: Record<string, unknown>; judgeOutput: Record<string, unknown> }> {
  // Run both advocates in parallel
  const [optimistResult, pessimistResult] = await Promise.all([
    callAgent(DEBATE_AGENTS.optimist.systemPrompt, `Topic: ${topic}\n\nEvidence:\n${evidence}`, "gpt-4o", 0.6, 3000),
    callAgent(DEBATE_AGENTS.pessimist.systemPrompt, `Topic: ${topic}\n\nEvidence:\n${evidence}`, "gpt-4o", 0.6, 3000),
  ]);

  const optimistOutput = parseAgentOutput(optimistResult.content);
  const pessimistOutput = parseAgentOutput(pessimistResult.content);

  // Judge receives both positions
  const judgeResult = await callAgent(
    DEBATE_AGENTS.judge.systemPrompt,
    `Topic: ${topic}

OPTIMIST POSITION: ${JSON.stringify(optimistOutput)}

PESSIMIST POSITION: ${JSON.stringify(pessimistOutput)}

Produce your calibrated judgment.`,
    "gemini-2.5-pro",
    0.3,
    4096,
  );

  return {
    optimistOutput,
    pessimistOutput,
    judgeOutput: parseAgentOutput(judgeResult.content),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const globalTimer = startTimer();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: OrchestratorRequest = await req.json();
    const { goal, profileId, mode = "standard", agisPhases = [1, 2, 3, 4, 5] } = body;

    if (!goal || !profileId) {
      return new Response(JSON.stringify({ error: "goal and profileId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create session record
    const { data: session } = await supabase
      .from("agent_sessions")
      .insert({
        user_id: user.id,
        profile_id: profileId,
        session_type: mode,
        goal,
        status: "running",
        phase_ids: agisPhases,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const sessionId = session?.id;

    let result: Record<string, unknown>;

    if (mode === "debate") {
      // Get evidence first via RAG
      const ragCtx = await getRAGContext(user.id, profileId, goal, { maxResults: 15, useSemanticSearch: true });
      const { optimistOutput, pessimistOutput, judgeOutput } = await runDebatePipeline(
        user.id, profileId, goal, ragCtx.context
      );

      // Store debate record
      await supabase.from("agent_debate_records").insert({
        user_id: user.id,
        profile_id: profileId,
        agent_session_id: sessionId,
        topic: goal,
        optimist_position: JSON.stringify(optimistOutput.position),
        pessimist_position: JSON.stringify(pessimistOutput.position),
        optimist_evidence: optimistOutput.evidence_basis,
        pessimist_evidence: pessimistOutput.evidence_basis,
        judge_conclusion: JSON.stringify(judgeOutput.calibrated_conclusion),
        judge_confidence: judgeOutput.final_confidence,
        calibrated_assessment: JSON.stringify(judgeOutput),
        optimist_score: optimistOutput.strength_score,
        pessimist_score: pessimistOutput.strength_score,
      });

      result = {
        mode: "debate",
        optimist: optimistOutput,
        pessimist: pessimistOutput,
        judge: judgeOutput,
        session_id: sessionId,
      };
    } else {
      // Standard or deep analysis pipeline
      const { turns, finalReport, confidence } = await runStandardPipeline(supabase, user.id, body, sessionId!);

      const totalTokens = turns.reduce((sum, t) => sum + t.tokens, 0);
      const totalDuration = globalTimer();

      // Store reasoning chain
      await supabase.from("intelligence_reasoning_chains").insert({
        user_id: user.id,
        profile_id: profileId,
        agent_session_id: sessionId,
        agis_phase: agisPhases[0],
        initial_query: goal,
        steps: turns.map((t, i) => ({
          step_number: i + 1,
          type: t.agent_role,
          content: JSON.stringify(t.output).slice(0, 2000),
          duration_ms: t.duration_ms,
          confidence: 70,
        })),
        conclusion: JSON.stringify(finalReport.executive_summary),
        confidence_score: confidence,
        uncertainty_flags: (finalReport.uncertainty_flags as string[]) ?? [],
        model_used: turns[4]?.model ?? "unknown",
      }).catch(() => null);

      // Store intelligence report
      const { data: report } = await supabase.from("intelligence_reports").insert({
        user_id: user.id,
        profile_id: profileId,
        agent_session_id: sessionId,
        report_type: mode === "deep_analysis" ? "threat_assessment" : "standard",
        title: `Intelligence Report: ${goal.slice(0, 80)}`,
        executive_summary: finalReport.executive_summary as string,
        full_content: JSON.stringify(finalReport),
        confidence_score: confidence,
        completeness_score: finalReport.completeness_score as number ?? 50,
        reasoning_quality: (finalReport.self_verification_score ?? confidence) as number,
        key_findings: finalReport.key_findings,
        uncertainty_flags: finalReport.uncertainty_flags,
        contradictions_detected: (finalReport.contradictions_unresolved as string[] ?? []).length,
        phase_coverage: agisPhases,
      }).select().single();

      // Update session
      await supabase.from("agent_sessions").update({
        status: "completed",
        agent_turns: turns,
        final_report: JSON.stringify(finalReport),
        confidence_score: confidence,
        self_verification_score: finalReport.self_verification_score as number ?? null,
        reasoning_chain: turns.map(t => ({ agent: t.agent_role, summary: JSON.stringify(t.output).slice(0, 500) })),
        models_used: Object.fromEntries(turns.map(t => [t.agent_role, t.model])),
        completed_at: new Date().toISOString(),
        duration_ms: totalDuration,
        total_tokens: totalTokens,
      }).eq("id", sessionId!).catch(() => null);

      result = {
        mode: "standard",
        report: finalReport,
        report_id: report?.id,
        session_id: sessionId,
        confidence,
        total_tokens: totalTokens,
        duration_ms: totalDuration,
        agent_turns: turns.length,
      };
    }

    // Log observability
    logLLMObservability({
      userId: user.id,
      edgeFunction: "agis-orchestrator",
      model: "multi-agent",
      latencyMs: globalTimer(),
      success: true,
    }).catch(() => null);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[agis-orchestrator] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
