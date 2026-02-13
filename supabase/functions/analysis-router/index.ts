/**
 * Analysis Domain Router (v4.0.0)
 * 
 * Consolidates ~50 analysis edge functions into a single Hono-based router.
 * Each analysis type is a POST route handled by a generic AI analysis handler.
 * 
 * @module analysis-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';
import { getServiceClient } from '../_shared/auth-handler.ts';

const app = createRouter('analysis-router');

/**
 * Generic AI analysis handler factory.
 * Creates a route handler that:
 * 1. Fetches profile data
 * 2. Sends to AI with the analysis-specific prompt
 * 3. Stores results in ai_analyses and unified_analysis_store
 */
function createAnalysisHandler(
  analysisType: string,
  analysisDomain: string,
  promptBuilder: (profile: unknown, interactions: unknown[], extra: Record<string, unknown>) => string
) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);

    if (!profileId) {
      return c.json({ error: 'profileId is required' }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return c.json({ error: 'AI service not configured' }, 500);
    }

    // Fetch profile data
    const [profileRes, interactionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_interaction_notes').select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const model = (body.model as string) || 'google/gemini-2.5-flash';
    const prompt = promptBuilder(profileRes.data, interactionsRes.data || [], body);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Perform ${analysisType} analysis for profile ${profileId}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return c.json({ error: 'Rate limit exceeded' }, 429);
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';

    let analysis: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    // Store in ai_analyses (legacy compatibility)
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: analysisType,
      result: analysis,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id,analysis_type' });

    // Store in unified_analysis_store
    await supabase.from('unified_analysis_store').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_domain: analysisDomain,
      analysis_type: analysisType,
      result: analysis,
      confidence_score: (analysis.confidence as number) || null,
      model_used: model,
    }, { onConflict: 'user_id,profile_id,analysis_type' }).catch(() => {
      // unified table may not exist yet during migration
    });

    return c.json({
      success: true,
      profileId,
      analysisType,
      analysis,
      timestamp: new Date().toISOString(),
    });
  });
}

// ═══════════════════════════════════════════
// ANALYSIS ROUTE DEFINITIONS
// ═══════════════════════════════════════════

// Generic prompt builder for most analyses
function genericPromptBuilder(type: string, framework: string) {
  return (profile: unknown, interactions: unknown[], extra: Record<string, unknown>) => {
    return `You are an expert ${type} analyst. ${framework}

PROFILE DATA:
${JSON.stringify(profile, null, 2)}

RECENT INTERACTIONS (last 30):
${JSON.stringify(interactions?.slice(0, 15), null, 2)}

${extra.additionalContext ? `ADDITIONAL CONTEXT:\n${JSON.stringify(extra.additionalContext)}` : ''}

Respond with a detailed JSON analysis. Include confidence scores where applicable.`;
  };
}

// Register all analysis routes
const analysisRoutes: Array<{ path: string; type: string; domain: string; framework: string }> = [
  { path: '/mice', type: 'mice_assessment', domain: 'intelligence', framework: 'Apply the MICE framework (Money, Ideology, Coercion, Ego) to assess recruitment vulnerability. Score each factor 0-1.' },
  { path: '/behavioral-dna', type: 'behavioral_dna', domain: 'intelligence', framework: 'Extract behavioral DNA sequence: communication patterns, decision-making style, risk tolerance, social dynamics.' },
  { path: '/attachment', type: 'attachment_vulnerability', domain: 'psychological', framework: 'Analyze attachment style (secure, anxious, avoidant, disorganized) and associated vulnerabilities.' },
  { path: '/deception', type: 'deception_detection', domain: 'intelligence', framework: 'Detect deception indicators in communication patterns. Analyze linguistic markers, consistency, and behavioral cues.' },
  { path: '/dark-tetrad', type: 'dark_tetrad', domain: 'psychological', framework: 'Profile Dark Tetrad traits (Machiavellianism, Narcissism, Psychopathy, Sadism). Score each 0-1.' },
  { path: '/influence-profile', type: 'influence_profile', domain: 'intelligence', framework: 'Map influence vectors: authority, reciprocity, commitment, social proof, liking, scarcity.' },
  { path: '/coercion', type: 'coercion_resistance', domain: 'intelligence', framework: 'Assess resistance to coercion tactics. Map psychological resilience factors.' },
  { path: '/existential', type: 'existential_leverage', domain: 'intelligence', framework: 'Calculate existential leverage points: career dependencies, relationship anchors, financial pressure points.' },
  { path: '/manipulation', type: 'manipulation_vulnerability', domain: 'psychological', framework: 'Assess vulnerability to manipulation techniques. Map cognitive biases and emotional triggers.' },
  { path: '/phobia', type: 'phobia_exploitation', domain: 'psychological', framework: 'Map fear responses, phobias, and anxiety triggers. Assess exploitability and resilience.' },
  { path: '/behavioral', type: 'behavioral_analysis', domain: 'intelligence', framework: 'Comprehensive behavioral analysis: patterns, anomalies, predictors.' },
  { path: '/communication-patterns', type: 'communication_patterns', domain: 'intelligence', framework: 'Analyze communication patterns: frequency, timing, channel preferences, sentiment trends.' },
  { path: '/conversation-deep', type: 'conversation_deep_analysis', domain: 'intelligence', framework: 'Deep conversation analysis: themes, power dynamics, information flow, hidden agendas.' },
  { path: '/conversation', type: 'conversation_analysis', domain: 'intelligence', framework: 'Analyze conversation dynamics, key topics, and sentiment shifts.' },
  { path: '/profile', type: 'profile_analysis', domain: 'intelligence', framework: 'Comprehensive profile analysis: background, motivations, capabilities, vulnerabilities.' },
  { path: '/deep-psychological', type: 'deep_psychological', domain: 'psychological', framework: 'Deep psychological profiling: personality structure, defense mechanisms, core beliefs, unconscious drives.' },
  { path: '/linguistic-patterns', type: 'linguistic_patterns', domain: 'intelligence', framework: 'Analyze linguistic patterns: vocabulary complexity, hedging, certainty markers, emotional language.' },
  { path: '/email-insights', type: 'email_insights', domain: 'intelligence', framework: 'Extract insights from email patterns: response times, formality shifts, topic priorities.' },
  { path: '/romantic', type: 'romantic_intelligence', domain: 'intelligence', framework: 'Analyze romantic relationship dynamics, attachment patterns, and compatibility indicators.' },
  { path: '/methodology', type: 'methodology_effectiveness', domain: 'intelligence', framework: 'Assess methodology effectiveness across different engagement approaches.' },
  { path: '/personality-dna', type: 'personality_dna', domain: 'psychological', framework: 'Extract personality DNA: Big Five traits, values hierarchy, motivational drivers.' },
  { path: '/behavioral-economics', type: 'behavioral_economics', domain: 'intelligence', framework: 'Apply behavioral economics: prospect theory, loss aversion, anchoring, framing effects.' },
  { path: '/behavioral-fingerprint', type: 'behavioral_fingerprint', domain: 'intelligence', framework: 'Create unique behavioral fingerprint from digital interaction patterns.' },
  { path: '/behavioral-future', type: 'behavioral_future', domain: 'prediction', framework: 'Model future behavioral trajectories based on current patterns and environmental factors.' },
  { path: '/behavioral-baseline', type: 'behavioral_baseline', domain: 'intelligence', framework: 'Establish behavioral baseline for anomaly detection. Map normal patterns.' },
  { path: '/betrayal-likelihood', type: 'betrayal_likelihood', domain: 'intelligence', framework: 'Score betrayal likelihood based on loyalty indicators, grievances, and opportunity factors.' },
  { path: '/breaking-point', type: 'breaking_point', domain: 'psychological', framework: 'Calculate psychological breaking points under various stress scenarios.' },
  { path: '/choice-architecture', type: 'choice_architecture', domain: 'intelligence', framework: 'Design optimal choice architectures to influence decision-making in desired directions.' },
  { path: '/chronotype', type: 'chronotype_analysis', domain: 'intelligence', framework: 'Analyze chronotype patterns: peak performance times, vulnerability windows, circadian preferences.' },
  { path: '/conditioning', type: 'conditioning_protocol', domain: 'psychological', framework: 'Design conditioning protocols using classical and operant conditioning principles.' },
  { path: '/elicitation', type: 'elicitation_strategy', domain: 'intelligence', framework: 'Design elicitation strategies for information extraction without raising awareness.' },
  { path: '/emotional-contagion', type: 'emotional_contagion', domain: 'psychological', framework: 'Model emotional contagion patterns: susceptibility, transmission vectors, amplification.' },
  { path: '/emotional-trajectory', type: 'emotional_trajectory', domain: 'psychological', framework: 'Track emotional trajectory over time. Predict future emotional states.' },
  { path: '/epistemic', type: 'epistemic_vulnerability', domain: 'psychological', framework: 'Scan for epistemic vulnerabilities: belief rigidity, confirmation bias, source dependence.' },
  { path: '/forensic-statement', type: 'forensic_statement', domain: 'intelligence', framework: 'Apply forensic statement analysis: SCAN, CBCA, reality monitoring criteria.' },
  { path: '/gottman', type: 'gottman_analysis', domain: 'psychological', framework: 'Apply Gottman relationship analysis: Four Horsemen, repair attempts, positive sentiment override.' },
  { path: '/family-systems', type: 'family_systems', domain: 'psychological', framework: 'Analyze family systems: roles, boundaries, triangulation, multigenerational patterns.' },
  { path: '/family-protection', type: 'family_protection', domain: 'intelligence', framework: 'Assess family protection needs: vulnerabilities, threat vectors, security measures.' },
  { path: '/hyperpersonalization', type: 'hyperpersonalization', domain: 'intelligence', framework: 'Generate hyperpersonalized engagement strategies based on psychological profile.' },
  { path: '/insider-threat', type: 'insider_threat', domain: 'intelligence', framework: 'Apply insider threat matrix: access, motivation, opportunity, capability, intent signals.' },
  { path: '/theory-of-mind', type: 'theory_of_mind', domain: 'psychological', framework: 'Build theory of mind model: mental states, beliefs, desires, intentions of target.' },
  { path: '/karmic-pattern', type: 'karmic_pattern', domain: 'psychological', framework: 'Map karmic patterns: recurring relationship dynamics, lessons, growth trajectories.' },
  { path: '/nlp-hypnotic', type: 'nlp_hypnotic', domain: 'psychological', framework: 'Analyze susceptibility to NLP and hypnotic language patterns.' },
  { path: '/pattern-of-life', type: 'pattern_of_life', domain: 'intelligence', framework: 'Map pattern of life: daily routines, weekly cycles, seasonal variations, anomalies.' },
  { path: '/relationship-half-life', type: 'relationship_half_life', domain: 'intelligence', framework: 'Calculate relationship half-life: decay rate, maintenance requirements, intervention points.' },
  { path: '/sacred-values', type: 'sacred_values', domain: 'psychological', framework: 'Map sacred values: non-negotiables, identity-linked beliefs, taboo trade-offs.' },
  { path: '/sacred-value-predictor', type: 'sacred_value_prediction', domain: 'psychological', framework: 'Predict sacred value activation triggers and defensive responses.' },
  { path: '/social-engineering', type: 'social_engineering', domain: 'intelligence', framework: 'Detect social engineering vulnerability: pretexting susceptibility, authority compliance, urgency response.' },
];

// Register all routes
for (const route of analysisRoutes) {
  app.post(route.path, createAnalysisHandler(
    route.type,
    route.domain,
    genericPromptBuilder(route.type, route.framework)
  ));
}

// ═══════════════════════════════════════════
// INTERNAL ROUTING (from adapter's _route field)
// ═══════════════════════════════════════════
app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;

  if (!routePath) {
    return c.json({ error: 'Missing _route parameter' }, 400);
  }

  // Find matching route handler
  const route = analysisRoutes.find(r => r.path === routePath);
  if (!route) {
    return c.json({ error: `Unknown analysis route: ${routePath}` }, 404);
  }

  // Forward to the handler
  const handler = createAnalysisHandler(
    route.type,
    route.domain,
    genericPromptBuilder(route.type, route.framework)
  );
  return handler(c);
}));

serve(app.fetch);
