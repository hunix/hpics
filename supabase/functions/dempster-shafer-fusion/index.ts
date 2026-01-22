import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvidenceSource {
  sourceType: string;
  sourceId?: string;
  hypotheses: Record<string, number>; // hypothesis -> mass value
  reliability: number; // 0-1
}

interface DSTRequest {
  action: 'fuse' | 'analyze' | 'conflict';
  profileId: string;
  evidenceSources?: EvidenceSource[];
  hypothesis?: string;
}

interface MassFunction {
  masses: Map<string, number>;
  belief: Map<string, number>;
  plausibility: Map<string, number>;
}

// Power set generation for hypothesis combinations
function powerSet(set: string[]): string[][] {
  const result: string[][] = [[]];
  for (const element of set) {
    const newSubsets = result.map(subset => [...subset, element]);
    result.push(...newSubsets);
  }
  return result.filter(s => s.length > 0);
}

// Dempster's rule of combination
function dempsterCombine(m1: Map<string, number>, m2: Map<string, number>): { combined: Map<string, number>; conflict: number } {
  const combined = new Map<string, number>();
  let conflictSum = 0;

  // Calculate all mass intersections
  for (const [set1, mass1] of m1) {
    for (const [set2, mass2] of m2) {
      const elements1 = new Set(set1.split(',').filter(s => s));
      const elements2 = new Set(set2.split(',').filter(s => s));
      
      // Intersection
      const intersection = [...elements1].filter(e => elements2.has(e));
      
      if (intersection.length === 0) {
        // Conflict
        conflictSum += mass1 * mass2;
      } else {
        // Valid combination
        const key = intersection.sort().join(',');
        combined.set(key, (combined.get(key) || 0) + mass1 * mass2);
      }
    }
  }

  // Normalize by (1 - conflict)
  const normFactor = 1 - conflictSum;
  if (normFactor > 0) {
    for (const [key, value] of combined) {
      combined.set(key, value / normFactor);
    }
  }

  return { combined, conflict: conflictSum };
}

// Calculate belief (lower probability bound)
function calculateBelief(masses: Map<string, number>, hypothesis: string): number {
  let belief = 0;
  const hypSet = new Set(hypothesis.split(','));
  
  for (const [set, mass] of masses) {
    const setElements = new Set(set.split(','));
    // Check if set is subset of hypothesis
    const isSubset = [...setElements].every(e => hypSet.has(e));
    if (isSubset) {
      belief += mass;
    }
  }
  
  return belief;
}

// Calculate plausibility (upper probability bound)
function calculatePlausibility(masses: Map<string, number>, hypothesis: string): number {
  let plausibility = 0;
  const hypSet = new Set(hypothesis.split(','));
  
  for (const [set, mass] of masses) {
    const setElements = new Set(set.split(','));
    // Check if intersection is non-empty
    const hasIntersection = [...setElements].some(e => hypSet.has(e));
    if (hasIntersection) {
      plausibility += mass;
    }
  }
  
  return plausibility;
}

// Convert evidence source to mass function
function evidenceToMass(source: EvidenceSource): Map<string, number> {
  const masses = new Map<string, number>();
  let totalMass = 0;

  // Discount by reliability
  for (const [hyp, mass] of Object.entries(source.hypotheses)) {
    const discountedMass = mass * source.reliability;
    masses.set(hyp, discountedMass);
    totalMass += discountedMass;
  }

  // Assign remaining mass to frame of discernment (uncertainty)
  if (totalMass < 1) {
    const allHypotheses = Object.keys(source.hypotheses).sort().join(',');
    masses.set(allHypotheses, 1 - totalMass);
  }

  return masses;
}

// Fuse multiple evidence sources
function fuseEvidence(sources: EvidenceSource[]): { 
  combined: Map<string, number>; 
  totalConflict: number;
  conflictSources: Array<{ source1: string; source2: string; conflict: number }>;
} {
  if (sources.length === 0) {
    return { combined: new Map(), totalConflict: 0, conflictSources: [] };
  }

  let currentMass = evidenceToMass(sources[0]);
  let totalConflict = 0;
  const conflictSources: Array<{ source1: string; source2: string; conflict: number }> = [];

  for (let i = 1; i < sources.length; i++) {
    const sourceMass = evidenceToMass(sources[i]);
    const { combined, conflict } = dempsterCombine(currentMass, sourceMass);
    
    if (conflict > 0.1) { // Significant conflict
      conflictSources.push({
        source1: sources[i - 1].sourceType,
        source2: sources[i].sourceType,
        conflict
      });
    }
    
    totalConflict = Math.max(totalConflict, conflict);
    currentMass = combined;
  }

  return { combined: currentMass, totalConflict, conflictSources };
}

// Extract evidence from profile data
async function extractEvidenceFromProfile(
  supabase: any,
  profileId: string,
  userId: string
): Promise<EvidenceSource[]> {
  const sources: EvidenceSource[] = [];

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profile) {
    // Trust level evidence
    const trustLevel = profile.trust_level || 50;
    sources.push({
      sourceType: 'profile_trust',
      sourceId: profileId,
      hypotheses: {
        'trustworthy': trustLevel / 100,
        'untrustworthy': (100 - trustLevel) / 100 * 0.3,
      },
      reliability: 0.7
    });

    // Relationship strength evidence
    const relStrength = profile.relationship_strength || 50;
    sources.push({
      sourceType: 'relationship_strength',
      sourceId: profileId,
      hypotheses: {
        'strong_ally': relStrength > 70 ? 0.6 : 0.2,
        'neutral': relStrength >= 40 && relStrength <= 70 ? 0.5 : 0.2,
        'potential_threat': relStrength < 30 ? 0.4 : 0.1,
      },
      reliability: 0.6
    });
  }

  // Get AI analyses
  const { data: analyses } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('profile_id', profileId)
    .order('generated_at', { ascending: false })
    .limit(5);

  for (const analysis of analyses || []) {
    const result = analysis.result as any;
    
    if (analysis.analysis_type === 'personality' && result.traits) {
      sources.push({
        sourceType: 'personality_analysis',
        sourceId: analysis.id,
        hypotheses: {
          'cooperative': result.traits.agreeableness > 60 ? 0.5 : 0.2,
          'competitive': result.traits.agreeableness < 40 ? 0.4 : 0.1,
          'unpredictable': result.traits.neuroticism > 70 ? 0.3 : 0.1,
        },
        reliability: result.confidence || 0.65
      });
    }

    if (analysis.analysis_type === 'sentiment' && result.overall_sentiment) {
      const sentiment = result.overall_sentiment;
      sources.push({
        sourceType: 'sentiment_analysis',
        sourceId: analysis.id,
        hypotheses: {
          'positive_intent': sentiment > 60 ? 0.5 : 0.15,
          'neutral_intent': sentiment >= 40 && sentiment <= 60 ? 0.4 : 0.2,
          'negative_intent': sentiment < 40 ? 0.4 : 0.1,
        },
        reliability: 0.55
      });
    }
  }

  // Get interaction history
  const { data: interactions } = await supabase
    .from('contact_interaction_notes')
    .select('relationship_temperature, mood_observed')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (interactions && interactions.length > 0) {
    // Use relationship_temperature (1-10 scale) and mood_observed as proxies
    const avgSentiment = interactions.reduce((a: number, i: any) => a + ((i.relationship_temperature || 5) * 10), 0) / interactions.length;
    const avgEngagement = interactions.reduce((a: number, i: any) => {
      const mood = (i.mood_observed || '').toLowerCase();
      if (mood.includes('positive') || mood.includes('happy') || mood.includes('engaged')) return a + 70;
      if (mood.includes('negative') || mood.includes('distant') || mood.includes('disengaged')) return a + 30;
      return a + 50;
    }, 0) / interactions.length;

    sources.push({
      sourceType: 'contact_interaction_notes',
      hypotheses: {
        'engaged': avgEngagement > 60 ? 0.5 : 0.2,
        'disengaged': avgEngagement < 40 ? 0.4 : 0.1,
        'positive': avgSentiment > 60 ? 0.4 : 0.2,
        'negative': avgSentiment < 40 ? 0.3 : 0.1,
      },
      reliability: Math.min(0.8, interactions.length / 10)
    });
  }

  return sources;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'dempster-shafer-fusion', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileId, evidenceSources, hypothesis } = await req.json() as DSTRequest;

    console.log(`[DST Fusion] Action: ${action} for profile ${profileId}`);

    // Get evidence sources
    let sources = evidenceSources || [];
    if (sources.length === 0) {
      sources = await extractEvidenceFromProfile(supabase, profileId, user.id);
    }

    // Fuse evidence
    const { combined, totalConflict, conflictSources } = fuseEvidence(sources);

    // Calculate belief and plausibility for all hypotheses
    const allHypotheses = new Set<string>();
    for (const source of sources) {
      Object.keys(source.hypotheses).forEach(h => allHypotheses.add(h));
    }

    const results: Record<string, { belief: number; plausibility: number; uncertainty: number }> = {};
    for (const hyp of allHypotheses) {
      const belief = calculateBelief(combined, hyp);
      const plausibility = calculatePlausibility(combined, hyp);
      results[hyp] = {
        belief: Math.round(belief * 100) / 100,
        plausibility: Math.round(plausibility * 100) / 100,
        uncertainty: Math.round((plausibility - belief) * 100) / 100
      };
    }

    // Store in database
    for (const source of sources) {
      await supabase.from('evidence_mass_functions').insert({
        user_id: user.id,
        profile_id: profileId,
        hypothesis_set: source.hypotheses,
        mass_value: Object.values(source.hypotheses).reduce((a, b) => a + b, 0),
        source_reliability: source.reliability,
        source_type: source.sourceType,
        conflict_level: totalConflict,
        evidence_metadata: { sourceId: source.sourceId }
      });
    }

    // Determine most likely hypothesis
    const rankedHypotheses = Object.entries(results)
      .map(([hyp, scores]) => ({
        hypothesis: hyp,
        ...scores,
        score: (scores.belief + scores.plausibility) / 2
      }))
      .sort((a, b) => b.score - a.score);

    const result = {
      profileId,
      evidenceSourceCount: sources.length,
      evidenceSources: sources.map(s => ({
        type: s.sourceType,
        reliability: Math.round(s.reliability * 100),
        hypotheses: Object.entries(s.hypotheses).map(([h, m]) => ({ hypothesis: h, mass: Math.round(m * 100) }))
      })),
      
      fusionResults: {
        combinedMasses: Object.fromEntries([...combined].map(([k, v]) => [k, Math.round(v * 100) / 100])),
        hypothesisAssessments: results,
        rankedHypotheses: rankedHypotheses.slice(0, 5),
        mostLikely: rankedHypotheses[0],
        leastCertain: rankedHypotheses.sort((a, b) => b.uncertainty - a.uncertainty)[0]
      },
      
      conflictAnalysis: {
        totalConflict: Math.round(totalConflict * 100),
        conflictLevel: totalConflict > 0.5 ? 'high' : totalConflict > 0.2 ? 'moderate' : 'low',
        conflictingSources: conflictSources,
        recommendation: totalConflict > 0.5 
          ? 'High conflict - seek additional corroborating evidence'
          : totalConflict > 0.2
          ? 'Moderate conflict - consider source reliability'
          : 'Low conflict - evidence is consistent'
      },
      
      uncertaintyAnalysis: {
        overallUncertainty: Math.round(rankedHypotheses.reduce((a, h) => a + h.uncertainty, 0) / rankedHypotheses.length * 100),
        mostUncertainHypothesis: rankedHypotheses.sort((a, b) => b.uncertainty - a.uncertainty)[0]?.hypothesis,
        evidenceGaps: sources.length < 3 ? 'insufficient_sources' : totalConflict > 0.3 ? 'conflicting_evidence' : 'adequate'
      }
    };

    console.log(`[DST Fusion] Complete. ${sources.length} sources, ${Math.round(totalConflict * 100)}% conflict`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DST Fusion] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
