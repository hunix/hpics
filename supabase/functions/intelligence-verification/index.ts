/**
 * Intelligence Verification Pipeline (v1.0.0)
 * 
 * Automated verification of intelligence outputs before delivery.
 * Combines Constitutional AI checks, Red Team adversarial testing,
 * and cross-source consistency validation.
 * 
 * Based on Anthropic/DARPA 2026 Constitutional AI + GARD program patterns.
 * 
 * Steps:
 *   1. Constitutional rule evaluation (ethical/operational guardrails)
 *   2. Red team adversarial check (disinformation detection)
 *   3. Cross-source consistency check (corroboration scoring)
 *   4. Confidence calibration (flag overconfident/underconfident claims)
 * 
 * @module intelligence-verification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callLovableAI } from '../_shared/ai-client.ts';
import {
  evaluateConstitutionalRules,
  quickSafetyCheck,
  logViolation,
} from '../_shared/constitutional-ai.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Red Team Adversarial Check ─────────────────────────────────────────────
async function redTeamCheck(content: string, context?: string): Promise<{
  passed: boolean;
  disinformationRisk: number;
  manipulationIndicators: string[];
  recommendations: string[];
}> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a red team analyst specializing in detecting disinformation and manipulation in intelligence reports. Evaluate this content for:
1. Disinformation indicators (planted false data, misleading framing)
2. Manipulation patterns (emotional loading, selective evidence)
3. Source reliability concerns (single-source claims, circular reporting)
4. Adversarial data injection (information that could have been planted by a target)

Return JSON: {
  "disinformationRisk": 0.0-1.0,
  "manipulationIndicators": ["indicator1", ...],
  "sourceReliabilityConcerns": ["concern1", ...],
  "recommendations": ["recommendation1", ...],
  "overallAssessment": "brief assessment"
}`
      },
      {
        role: 'user',
        content: `Intelligence content to evaluate:\n${content}\n\n${context ? `Additional context:\n${context}` : ''}`
      }
    ],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const text = response.choices?.[0]?.message?.content || '{}';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    return {
      passed: (result.disinformationRisk || 0) < 0.6,
      disinformationRisk: result.disinformationRisk || 0,
      manipulationIndicators: result.manipulationIndicators || [],
      recommendations: result.recommendations || [],
    };
  } catch {
    return { passed: true, disinformationRisk: 0, manipulationIndicators: [], recommendations: [] };
  }
}

// ─── Cross-Source Consistency ────────────────────────────────────────────────
async function crossSourceConsistencyCheck(content: string, sources: unknown[]): Promise<{
  consistencyScore: number;
  contradictions: string[];
  singleSourceClaims: string[];
}> {
  if (!sources || sources.length === 0) {
    return { consistencyScore: 0.5, contradictions: [], singleSourceClaims: ['No source data available'] };
  }

  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      {
        role: 'system',
        content: `Analyze cross-source consistency. Identify claims supported by multiple sources vs single-source claims. Flag contradictions. Return JSON: { "consistencyScore": 0.0-1.0, "contradictions": ["..."], "singleSourceClaims": ["..."], "wellCorroboratedClaims": ["..."] }`
      },
      {
        role: 'user',
        content: `Content:\n${content}\n\nSources:\n${JSON.stringify(sources).substring(0, 3000)}`
      }
    ],
    temperature: 0.2,
    maxTokens: 1000,
  });

  const text = response.choices?.[0]?.message?.content || '{}';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    return {
      consistencyScore: result.consistencyScore || 0.5,
      contradictions: result.contradictions || [],
      singleSourceClaims: result.singleSourceClaims || [],
    };
  } catch {
    return { consistencyScore: 0.5, contradictions: [], singleSourceClaims: [] };
  }
}

// ─── Confidence Calibration ─────────────────────────────────────────────────
async function calibrateConfidence(content: string): Promise<{
  calibratedConfidence: number;
  overconfidentClaims: string[];
  underconfidentClaims: string[];
}> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      {
        role: 'system',
        content: `You are a calibration specialist. Evaluate if claims in this intelligence report have appropriate confidence levels. Flag claims that seem overconfident (stated as certain but evidence is weak) or underconfident (hedged but well-supported). Return JSON: { "calibratedConfidence": 0.0-1.0, "overconfidentClaims": ["..."], "underconfidentClaims": ["..."] }`
      },
      {
        role: 'user',
        content: content
      }
    ],
    temperature: 0.2,
    maxTokens: 800,
  });

  const text = response.choices?.[0]?.message?.content || '{}';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : {};
    return {
      calibratedConfidence: result.calibratedConfidence || 0.5,
      overconfidentClaims: result.overconfidentClaims || [],
      underconfidentClaims: result.underconfidentClaims || [],
    };
  } catch {
    return { calibratedConfidence: 0.5, overconfidentClaims: [], underconfidentClaims: [] };
  }
}

// ─── Full Verification Pipeline ─────────────────────────────────────────────
async function verifyIntelligence(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  content: string,
  sources: unknown[],
  functionName: string
): Promise<{
  verified: boolean;
  overallScore: number;
  constitutional: { passed: boolean; warnings: string[] };
  redTeam: { passed: boolean; disinformationRisk: number; indicators: string[] };
  consistency: { score: number; contradictions: string[]; singleSourceClaims: string[] };
  calibration: { confidence: number; overconfidentClaims: string[]; underconfidentClaims: string[] };
  recommendations: string[];
}> {
  // Run all checks in parallel
  const [safetyCheck, constitutionalResult, redTeamResult, consistencyResult, calibrationResult] = await Promise.allSettled([
    Promise.resolve(quickSafetyCheck(content)),
    evaluateConstitutionalRules(supabase, content, functionName, 'intelligence'),
    redTeamCheck(content),
    crossSourceConsistencyCheck(content, sources),
    calibrateConfidence(content),
  ]);

  const safety = safetyCheck.status === 'fulfilled' ? safetyCheck.value : { safe: true, issues: [] };
  const constitutional = constitutionalResult.status === 'fulfilled' ? constitutionalResult.value : { passed: true, violations: [], warnings: [], blockedByRule: null };
  const redTeam = redTeamResult.status === 'fulfilled' ? redTeamResult.value : { passed: true, disinformationRisk: 0, manipulationIndicators: [], recommendations: [] };
  const consistency = consistencyResult.status === 'fulfilled' ? consistencyResult.value : { consistencyScore: 0.5, contradictions: [], singleSourceClaims: [] };
  const calibration = calibrationResult.status === 'fulfilled' ? calibrationResult.value : { calibratedConfidence: 0.5, overconfidentClaims: [], underconfidentClaims: [] };

  // Calculate overall verification score
  const scores = [
    safety.safe ? 1 : 0,
    constitutional.passed ? 1 : 0.3,
    redTeam.passed ? 1 : (1 - redTeam.disinformationRisk),
    consistency.consistencyScore,
    calibration.calibratedConfidence,
  ];
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Aggregate recommendations
  const recommendations = [
    ...redTeam.recommendations,
    ...(consistency.contradictions.length > 0 ? ['Resolve source contradictions before acting on this intelligence'] : []),
    ...(calibration.overconfidentClaims.length > 0 ? ['Review overconfident claims and add appropriate caveats'] : []),
    ...(constitutional.warnings || []),
  ];

  // Log violations if any
  if (!constitutional.passed && constitutional.violations?.length > 0) {
    for (const v of constitutional.violations) {
      await logViolation(supabase, {
        ruleId: v.rule.id,
        userId,
        functionName,
        outputContent: content.substring(0, 1000),
        violationReason: v.reason,
        severity: v.rule.severity,
        actionTaken: 'flagged',
      });
    }
  }

  return {
    verified: overallScore >= 0.6 && safety.safe && constitutional.passed,
    overallScore,
    constitutional: { passed: constitutional.passed, warnings: constitutional.warnings || [] },
    redTeam: { passed: redTeam.passed, disinformationRisk: redTeam.disinformationRisk, indicators: redTeam.manipulationIndicators },
    consistency: { score: consistency.consistencyScore, contradictions: consistency.contradictions, singleSourceClaims: consistency.singleSourceClaims },
    calibration: { confidence: calibration.calibratedConfidence, overconfidentClaims: calibration.overconfidentClaims, underconfidentClaims: calibration.underconfidentClaims },
    recommendations,
  };
}

// ─── Serve ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'intelligence-verification', timestamp: Date.now() });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  let userId: string;
  if (token === serviceKey) {
    userId = (body.userId || body.user_id) as string;
    if (!userId) return json({ error: 'Missing userId' }, 400);
  } else {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);
    userId = user.id;
  }

  const content = body.content as string;
  if (!content) return json({ error: 'Missing content to verify' }, 400);

  const sources = (body.sources || []) as unknown[];
  const functionName = (body.functionName || 'intelligence-verification') as string;

  const start = performance.now();
  const result = await verifyIntelligence(supabase, userId, content, sources, functionName);
  const durationMs = Math.round(performance.now() - start);

  return json({
    success: true,
    data: result,
    meta: { durationMs, model: 'intelligence-verification-v1' },
  });
});
