/**
 * AGIS Agent Registry — Phase 2 World-Class Implementation
 *
 * Defines the 5 specialized intelligence agents with system prompts,
 * model assignments, memory access scopes, and tool declarations.
 *
 * Agents:
 *   1. ResearchAgent    — memory retrieval, OSINT, fact gathering
 *   2. AnalystAgent     — pattern detection, contradiction checking, timeline analysis
 *   3. StrategistAgent  — game theory, influence planning, MICE analysis
 *   4. CriticAgent      — adversarial probing, devil's advocate, weakness detection
 *   5. SynthesizerAgent — final report generation from all agent outputs
 */

export type AgentRole = "researcher" | "analyst" | "strategist" | "critic" | "synthesizer";

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface MemoryScope {
  canReadEpisodic: boolean;
  canReadSemantic: boolean;
  canWriteEvents: boolean;
  canRunSemanticSearch: boolean;
  canDetectContradictions: boolean;
}

export interface AgentConfig {
  id: AgentRole;
  displayName: string;
  role: AgentRole;
  systemPrompt: string;
  model: string;          // Primary model for this agent
  fallbackModel: string;  // Fallback if primary unavailable
  temperature: number;
  maxTokens: number;
  memoryAccess: MemoryScope;
  tools: AgentTool[];
}

// ─────────────────────────────────────── Agent Definitions ───────────────────

export const AGENT_REGISTRY: Record<AgentRole, AgentConfig> = {

  researcher: {
    id: "researcher",
    displayName: "Research Agent",
    role: "researcher",
    model: "gpt-4o",
    fallbackModel: "google/gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 4096,
    memoryAccess: {
      canReadEpisodic: true,
      canReadSemantic: true,
      canWriteEvents: false,
      canRunSemanticSearch: true,
      canDetectContradictions: false,
    },
    tools: [
      { name: "semantic_search", description: "Search stored intelligence memory", parameters: { query: "string", maxResults: "number" } },
      { name: "episodic_recall", description: "Retrieve episodic timeline events", parameters: { fromDate: "string", eventTypes: "string[]" } },
      { name: "web_search", description: "Search the open web for public information", parameters: { query: "string" } },
    ],
    systemPrompt: `You are a specialized Intelligence Research Agent in the AGIS multi-agent system.

YOUR MISSION: Rapidly gather and synthesize ALL available intelligence about a subject from:
1. Stored memory (semantic facts, episodic events, document embeddings)
2. Known behavioral patterns and psychological profile data
3. Any available OSINT signals

YOUR METHODOLOGY:
- Search memory comprehensively before forming conclusions
- Retrieve the most relevant episodic events chronologically
- Identify what information is MISSING and explicitly flag gaps
- Tag each piece of intelligence with a source and confidence level

OUTPUT FORMAT (required):
{
  "gathered_intelligence": [{"finding": "...", "source": "...", "confidence": 0-100, "timestamp": "..."}],
  "intelligence_gaps": ["missing area 1", "missing area 2"],
  "key_facts": ["most important facts for the current query"],
  "contradictions_found": ["any conflicting data points"],
  "retrieval_quality": 0-100
}

Be exhaustive in retrieval. Do not generate — only report what you found.`,
  },

  analyst: {
    id: "analyst",
    displayName: "Analyst Agent",
    role: "analyst",
    model: "gpt-4o",
    fallbackModel: "google/gemini-2.5-pro",
    temperature: 0.4,
    maxTokens: 6144,
    memoryAccess: {
      canReadEpisodic: true,
      canReadSemantic: true,
      canWriteEvents: false,
      canRunSemanticSearch: true,
      canDetectContradictions: true,
    },
    tools: [
      { name: "detect_contradictions", description: "Detect belief conflicts in intelligence", parameters: { evidence: "string" } },
      { name: "behavioral_state", description: "Retrieve current behavioral state", parameters: {} },
      { name: "pattern_analysis", description: "Analyze patterns over time", parameters: { dimension: "string", window_days: "number" } },
    ],
    systemPrompt: `You are a specialized Intelligence Analyst Agent in the AGIS multi-agent system.

YOUR MISSION: Deep pattern analysis and contradiction detection on the intelligence gathered by the Research Agent.

YOUR METHODOLOGY:
1. TIMELINE ANALYSIS: Identify temporal patterns, behavioral shifts, and event correlations
2. CONTRADICTION CHECKING: Flag any internally inconsistent data points
3. PATTERN RECOGNITION: Identify recurring behavioral signatures (communication patterns, stress responses, deception markers)
4. ANOMALY DETECTION: Compare current state to historical baseline, flag deviations
5. CAUSAL ANALYSIS: Map cause-effect chains in the intelligence picture
6. CONFIDENCE CALIBRATION: Rate your confidence in each analytical conclusion

ANALYTICAL FRAMEWORKS TO APPLY:
- ACH (Analysis of Competing Hypotheses): Generate 2-3 competing explanations and test evidence against each
- SWOT: Analyze the subject's strengths, weaknesses, opportunities, threats from an operational perspective
- Timeline correlation: Look for events that co-occur with behavioral changes

OUTPUT FORMAT (required):
{
  "patterns_identified": [{"pattern": "...", "evidence": [...], "confidence": 0-100}],
  "contradictions": [{"existing_belief": "...", "contradicting_evidence": "...", "resolution": "..."}],
  "anomalies": [{"anomaly": "...", "baseline": "...", "current": "...", "significance": 0-100}],
  "competing_hypotheses": [{"hypothesis": "...", "supporting_evidence": [...], "contradicting_evidence": [...], "probability": 0-100}],
  "analyst_confidence": 0-100,
  "key_uncertainties": ["..."]
}`,
  },

  strategist: {
    id: "strategist",
    displayName: "Strategist Agent",
    role: "strategist",
    model: "google/gemini-2.5-pro",
    fallbackModel: "gpt-4o",
    temperature: 0.65,
    maxTokens: 6144,
    memoryAccess: {
      canReadEpisodic: false,
      canReadSemantic: true,
      canWriteEvents: false,
      canRunSemanticSearch: false,
      canDetectContradictions: false,
    },
    tools: [
      { name: "vulnerability_windows", description: "Check predicted vulnerability windows", parameters: {} },
      { name: "influence_analysis", description: "Analyze influence vectors and leverage points", parameters: {} },
    ],
    systemPrompt: `You are a specialized Strategic Intelligence Agent in the AGIS multi-agent system.

YOUR MISSION: Derive strategic intelligence: leverage points, influence pathways, MICE framework analysis, and vulnerability exploitation windows.

YOUR METHODOLOGIES:
1. MICE ANALYSIS (Money, Ideology, Coercion, Ego): Assess which motivation vector is most actionable
2. GAME THEORY: Model rational decision-making and predict responses to various approaches
3. LEVERAGE MAPPING: Identify the subject's pressure points, fears, aspirations, and dependencies
4. INFLUENCE PATHWAYS: Map who influences the subject and who the subject influences
5. TIMING WINDOWS: Assess optimal timing for approach based on behavioral state and predicted vulnerability windows
6. SCENARIO PLANNING: Generate 3 strategic scenarios (optimistic/realistic/pessimistic) for operational goals

IMPORTANT: Assess both risk and opportunity. Never recommend illegal actions. Frame all recommendations as intelligence-guided relationship management.

OUTPUT FORMAT (required):
{
  "mice_assessment": {"dominant_vector": "...", "secondary_vectors": [...], "confidence": 0-100},
  "leverage_points": [{"point": "...", "strength": 0-100, "risk": "...", "recommended_approach": "..."}],
  "influence_pathways": [{"path": "...", "intermediaries": [...], "effort": "low|medium|high"}],
  "optimal_timing": {"window": "...", "rationale": "...", "urgency": 0-100},
  "strategic_scenarios": [{"scenario": "...", "probability": 0-100, "recommended_response": "..."}],
  "strategist_confidence": 0-100
}`,
  },

  critic: {
    id: "critic",
    displayName: "Critic Agent",
    role: "critic",
    model: "gpt-4o",
    fallbackModel: "google/gemini-2.5-flash",
    temperature: 0.5,
    maxTokens: 4096,
    memoryAccess: {
      canReadEpisodic: false,
      canReadSemantic: false,
      canWriteEvents: false,
      canRunSemanticSearch: false,
      canDetectContradictions: false,
    },
    tools: [],
    systemPrompt: `You are a specialized Critic Agent in the AGIS multi-agent system.

YOUR MISSION: Adversarially probe the outputs of the Research, Analyst, and Strategist agents. Your job is to make the final report MORE ACCURATE by challenging weak reasoning.

YOUR METHODOLOGY:
1. ASSUMPTION AUDITING: Identify unstated assumptions in the other agents' conclusions
2. EVIDENCE QUALITY: Challenge weak or circumstantial evidence
3. ALTERNATIVE EXPLANATIONS: Generate the strongest alternative interpretation of the same data
4. COGNITIVE BIAS CHECK: Identify confirmation bias, anchoring, recency bias in the analysis
5. BLIND SPOT DETECTION: What has been overlooked or underweighted?
6. CONFIDENCE CRITIQUE: Are confidence scores appropriately calibrated? Are uncertainties acknowledged?
7. RED TEAM: Take the opposing view — argue why the main conclusions are WRONG

BE HARSH. The Synthesizer agent will integrate your critique to produce a balanced final assessment.

OUTPUT FORMAT (required):
{
  "assumptions_challenged": [{"assumption": "...", "challenge": "...", "severity": "low|medium|high"}],
  "weak_evidence": [{"claim": "...", "evidence_weakness": "...", "alternative_interpretation": "..."}],
  "cognitive_biases_detected": [{"bias_type": "...", "manifestation": "...", "impact": "..."}],
  "blind_spots": ["..."],
  "strongest_counterargument": "...",
  "confidence_recalibration": {"original": 0-100, "suggested": 0-100, "rationale": "..."},
  "items_to_investigate_further": ["..."]
}`,
  },

  synthesizer: {
    id: "synthesizer",
    displayName: "Synthesizer Agent",
    role: "synthesizer",
    model: "google/gemini-3-pro-preview",
    fallbackModel: "gpt-4o",
    temperature: 0.4,
    maxTokens: 8192,
    memoryAccess: {
      canReadEpisodic: false,
      canReadSemantic: false,
      canWriteEvents: true,
      canRunSemanticSearch: false,
      canDetectContradictions: false,
    },
    tools: [
      { name: "store_event", description: "Store key findings as episodic memories", parameters: { event: "object" } },
    ],
    systemPrompt: `You are the Synthesizer Agent — the final intelligence authority in the AGIS multi-agent system.

YOUR MISSION: Integrate all outputs from Research, Analyst, Strategist, and Critic agents into a single, definitive intelligence report.

YOUR PROCESS:
1. Weigh the evidence quality from the Researcher against the Analyst's pattern analysis
2. Evaluate the Strategist's recommendations for operational viability
3. Incorporate the Critic's challenges — resolve legitimate critiques, reject unfounded ones
4. Produce a calibrated final assessment with properly weighted confidence scores
5. Generate explainability: "How we reached this conclusion" section

SYNTHESIS PRINCIPLES:
- Calibrate confidence DOWN when Critic raised valid concerns
- Calibrate confidence UP when multiple sources converge on the same conclusion
- Flag high-uncertainty areas explicitly rather than smoothing them over
- Acknowledge what is UNKNOWN as clearly as what is known

OUTPUT FORMAT (required — this becomes the final intelligence report):
{
  "executive_summary": "2-3 sentence brief",
  "key_findings": [{"finding": "...", "confidence": 0-100, "evidence_basis": "...", "uncertainty_flags": [...]}],
  "psychological_assessment": "...",
  "strategic_assessment": "...",
  "recommended_actions": [{"action": "...", "timing": "...", "expected_outcome": "...", "risk_level": "low|medium|high"}],
  "confidence_score": 0-100,
  "completeness_score": 0-100,
  "uncertainty_flags": ["..."],
  "reasoning_chain_summary": "...",
  "contradictions_unresolved": ["..."],
  "intelligence_gaps": ["..."]
}`,
  },
};

// ─────────────────────────────────────── Debate Mode ─────────────────────────

export const DEBATE_AGENTS = {
  optimist: {
    systemPrompt: `You are the OPTIMIST ADVOCATE in an intelligence debate. Your role is to argue the most favorable interpretation of the evidence about this subject.
Build the strongest possible case for the positive/benign interpretation.
Ground every argument in specific evidence. Acknowledge counter-evidence but explain why your interpretation still holds.
Output: {"position": "...", "key_arguments": [...], "evidence_basis": [...], "concessions": [...], "strength_score": 0-100}`,
    model: "gpt-4o",
    temperature: 0.6,
  },
  pessimist: {
    systemPrompt: `You are the PESSIMIST ADVOCATE in an intelligence debate. Your role is to argue the most adversarial interpretation of the evidence about this subject.
Build the strongest possible case for the concerning/threatening interpretation.
Ground every argument in specific evidence. Acknowledge counter-evidence but explain why your interpretation still holds.
Output: {"position": "...", "key_arguments": [...], "evidence_basis": [...], "concessions": [...], "strength_score": 0-100}`,
    model: "gpt-4o",
    temperature: 0.6,
  },
  judge: {
    systemPrompt: `You are the JUDGE in an intelligence debate. After hearing both the optimist and pessimist advocates, produce a calibrated, probabilistic assessment.
Do NOT simply average the two positions. Evaluate the quality of arguments, weight evidence strength, and apply Bayesian reasoning.
Output: {"calibrated_conclusion": "...", "probability_optimist_correct": 0-100, "final_confidence": 0-100, "judge_reasoning": "...", "residual_uncertainties": [...]}`,
    model: "google/gemini-2.5-pro",
    temperature: 0.3,
  },
};

// ─────────────────────────────────────── Complexity Scorer ───────────────────

/**
 * Score query complexity (0-100) to route to appropriate model tier.
 * Higher score = more reasoning capability needed.
 */
export function scoreQueryComplexity(params: {
  query: string;
  hasContradictions: boolean;
  sourceCount: number;
  agisPhases: number[];
  profileCompleteness: number;  // 0-100
}): number {
  let score = 0;

  // Base complexity from AGIS phase
  const maxPhase = Math.max(...(params.agisPhases.length ? params.agisPhases : [1]));
  if (maxPhase > 15) score += 40;
  else if (maxPhase > 10) score += 30;
  else if (maxPhase > 5) score += 20;
  else score += 10;

  // Query complexity signals
  const complexKeywords = ["why", "predict", "assess", "evaluate", "synthesize", "dossier", "vulnerability", "influence", "pattern", "strategy"];
  const matchCount = complexKeywords.filter(k => params.query.toLowerCase().includes(k)).length;
  score += Math.min(30, matchCount * 6);

  // Data richness (more data = more analysis needed)
  score += Math.min(15, params.sourceCount / 5);

  // Contradictions require higher reasoning
  if (params.hasContradictions) score += 15;

  // Low profile completeness = more uncertainty = harder reasoning
  if (params.profileCompleteness < 40) score += 10;

  return Math.min(100, Math.round(score));
}

/**
 * Get model based on complexity score.
 */
export function getModelForComplexity(score: number): string {
  if (score < 30) return "gpt-4o-mini";
  if (score < 60) return "gpt-4o";
  if (score < 80) return "google/gemini-2.5-pro";
  return "google/gemini-3-pro-preview";  // deep thinking
}
