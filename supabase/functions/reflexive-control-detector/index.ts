/**
 * Reflexive Control Detector Edge Function
 * 
 * Identifies when a target is attempting to "transmit motives" to stimulate 
 * self-defeating decisions. Based on CIA Studies in Intelligence (Dec 2025).
 * 
 * Features:
 * - Motive transmission detection
 * - False narrative identification
 * - Perception management tracking
 * - Counter-strategy generation
 * 
 * @version 7.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReflexiveControlRequest {
  profileId: string;
  // Communication analysis
  communications?: {
    content: string;
    direction: 'inbound' | 'outbound';
    timestamp: string;
    channel: string;
  }[];
  // Behavioral observations
  behavioralCues?: {
    urgencyPressure?: boolean;
    exclusivityClaims?: boolean;
    reciprocityTriggers?: boolean;
    authorityAppeals?: boolean;
    scarcityFraming?: boolean;
    socialProof?: boolean;
    flattery?: boolean;
    fearInduction?: boolean;
  };
  // Context
  context?: {
    relationshipDuration?: string;
    powerDynamic?: 'equal' | 'superior' | 'subordinate';
    knownObjectives?: string[];
    previousManipulationAttempts?: number;
  };
}

interface ReflexiveControlIndicator {
  technique: string;
  description: string;
  evidence: string[];
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ReflexiveControlAnalysis {
  indicators: ReflexiveControlIndicator[];
  overallRisk: number;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  primaryTechnique?: string;
  detectedTechniques: string[];
  counterStrategies: string[];
  communicationFlags: string[];
  manipulationPatterns: {
    pattern: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
}

// Reflexive control techniques (based on Soviet/Russian doctrine)
const RC_TECHNIQUES = {
  motive_transmission: {
    name: 'Motive Transmission',
    description: 'Conveying motives that cause target to make self-defeating decisions',
    indicators: ['suggested urgency', 'implied consequences', 'false alternatives'],
  },
  false_narrative: {
    name: 'False Narrative',
    description: 'Presenting false information as true to shape perception',
    indicators: ['unverifiable claims', 'emotional framing', 'selective facts'],
  },
  perception_management: {
    name: 'Perception Management',
    description: 'Controlling how information is perceived and interpreted',
    indicators: ['reframing', 'context manipulation', 'emotional priming'],
  },
  decision_paralysis: {
    name: 'Decision Paralysis',
    description: 'Creating conditions that prevent effective decision-making',
    indicators: ['information overload', 'contradictory signals', 'time pressure'],
  },
  trust_exploitation: {
    name: 'Trust Exploitation',
    description: 'Leveraging established trust for manipulation',
    indicators: ['intimacy claims', 'shared history invocation', 'loyalty tests'],
  },
  commitment_consistency: {
    name: 'Commitment & Consistency',
    description: 'Using past commitments to force unwanted decisions',
    indicators: ['past agreement references', 'consistency pressure', 'escalating requests'],
  },
};

// Linguistic markers for manipulation detection
const MANIPULATION_MARKERS = {
  urgency: ['immediately', 'right now', 'urgent', 'time-sensitive', 'deadline', 'expiring', 'last chance'],
  scarcity: ['limited', 'exclusive', 'only', 'rare', 'special access', 'few remaining'],
  authority: ['experts say', 'authorities confirm', 'official', 'verified', 'proven'],
  reciprocity: ['I did this for you', 'you owe', 'remember when I', 'favor', 'helped you'],
  social_proof: ['everyone', 'most people', 'widely accepted', 'popular', 'trending'],
  flattery: ['smart like you', 'special', 'talented', 'only you can', 'unique ability'],
  fear: ['dangerous', 'risk', 'threat', 'warning', 'consequences', 'harm', 'lose'],
  false_alternatives: ['only two options', 'either or', 'no choice but', 'must decide'],
};

function analyzeContent(content: string): {
  markers: Record<string, string[]>;
  score: number;
  dominantPattern?: string;
} {
  const lowerContent = content.toLowerCase();
  const foundMarkers: Record<string, string[]> = {};
  let totalFound = 0;
  let maxCategory = '';
  let maxCount = 0;

  for (const [category, words] of Object.entries(MANIPULATION_MARKERS)) {
    const found = words.filter(word => lowerContent.includes(word));
    if (found.length > 0) {
      foundMarkers[category] = found;
      totalFound += found.length;
      if (found.length > maxCount) {
        maxCount = found.length;
        maxCategory = category;
      }
    }
  }

  // Score based on density of manipulation markers
  const wordCount = content.split(/\s+/).length;
  const score = Math.min(1, (totalFound * 5) / Math.max(wordCount, 1));

  return {
    markers: foundMarkers,
    score,
    dominantPattern: maxCategory || undefined,
  };
}

function analyzeBehavioralCues(cues: ReflexiveControlRequest['behavioralCues']): {
  techniques: string[];
  score: number;
} {
  if (!cues) return { techniques: [], score: 0 };

  const techniques: string[] = [];
  let cueCount = 0;
  let totalCues = 0;

  const cueMap: Record<string, string> = {
    urgencyPressure: 'motive_transmission',
    exclusivityClaims: 'perception_management',
    reciprocityTriggers: 'trust_exploitation',
    authorityAppeals: 'perception_management',
    scarcityFraming: 'motive_transmission',
    socialProof: 'perception_management',
    flattery: 'trust_exploitation',
    fearInduction: 'decision_paralysis',
  };

  for (const [cue, technique] of Object.entries(cueMap)) {
    totalCues++;
    if (cues[cue as keyof typeof cues]) {
      cueCount++;
      if (!techniques.includes(technique)) {
        techniques.push(technique);
      }
    }
  }

  return {
    techniques,
    score: totalCues > 0 ? cueCount / totalCues : 0,
  };
}

function generateCounterStrategies(techniques: string[], context?: ReflexiveControlRequest['context']): string[] {
  const strategies: string[] = [];

  if (techniques.includes('motive_transmission')) {
    strategies.push('Pause before responding to urgent requests - verify independently');
    strategies.push('Question the source of urgency claims');
  }

  if (techniques.includes('false_narrative')) {
    strategies.push('Cross-reference claims with independent sources');
    strategies.push('Request documentation for factual assertions');
  }

  if (techniques.includes('perception_management')) {
    strategies.push('Maintain awareness of framing effects');
    strategies.push('Seek alternative perspectives before deciding');
  }

  if (techniques.includes('decision_paralysis')) {
    strategies.push('Break complex decisions into smaller steps');
    strategies.push('Set firm deadlines for decision-making');
  }

  if (techniques.includes('trust_exploitation')) {
    strategies.push('Evaluate requests on merit, not relationship');
    strategies.push('Maintain boundaries regardless of intimacy claims');
  }

  if (techniques.includes('commitment_consistency')) {
    strategies.push('Past agreements don\'t obligate future compliance');
    strategies.push('Re-evaluate commitments in current context');
  }

  // Context-specific strategies
  if (context?.powerDynamic === 'subordinate') {
    strategies.push('Document all requests and responses');
    strategies.push('Consult with peers before major decisions');
  }

  if (context?.previousManipulationAttempts && context.previousManipulationAttempts > 2) {
    strategies.push('Consider limiting or restructuring the relationship');
    strategies.push('Establish clear boundaries with explicit consequences');
  }

  return strategies;
}

function buildIndicators(
  contentAnalysis: ReturnType<typeof analyzeContent>,
  behavioralAnalysis: ReturnType<typeof analyzeBehavioralCues>,
  context?: ReflexiveControlRequest['context']
): ReflexiveControlIndicator[] {
  const indicators: ReflexiveControlIndicator[] = [];

  // Build indicators from content analysis
  for (const [category, markers] of Object.entries(contentAnalysis.markers)) {
    const technique = category === 'urgency' || category === 'scarcity' ? 'motive_transmission'
      : category === 'authority' || category === 'social_proof' ? 'perception_management'
      : category === 'reciprocity' || category === 'flattery' ? 'trust_exploitation'
      : category === 'fear' || category === 'false_alternatives' ? 'decision_paralysis'
      : 'perception_management';

    const rcTechnique = RC_TECHNIQUES[technique as keyof typeof RC_TECHNIQUES];
    
    indicators.push({
      technique,
      description: rcTechnique?.description || 'Manipulation technique detected',
      evidence: markers,
      confidence: Math.min(0.9, 0.4 + markers.length * 0.15),
      severity: markers.length >= 3 ? 'high' : markers.length >= 2 ? 'medium' : 'low',
    });
  }

  // Build indicators from behavioral cues
  for (const technique of behavioralAnalysis.techniques) {
    const rcTechnique = RC_TECHNIQUES[technique as keyof typeof RC_TECHNIQUES];
    
    if (!indicators.find(i => i.technique === technique)) {
      indicators.push({
        technique,
        description: rcTechnique?.description || 'Behavioral manipulation pattern',
        evidence: rcTechnique?.indicators || [],
        confidence: 0.6,
        severity: 'medium',
      });
    }
  }

  // Elevate severity based on context
  if (context?.previousManipulationAttempts && context.previousManipulationAttempts > 0) {
    indicators.forEach(ind => {
      if (ind.severity === 'medium') ind.severity = 'high';
      if (ind.severity === 'high') ind.severity = 'critical';
      ind.confidence = Math.min(0.95, ind.confidence + 0.1);
    });
  }

  return indicators;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'reflexive-control-detector', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReflexiveControlRequest = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = (body as any).userId || (body as any).user_id;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required for service calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
    }

    const { profileId, communications, behavioralCues, context } = body;

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'profileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze content from communications
    let contentAnalysis: { markers: Record<string, string[]>; score: number; dominantPattern?: string } = { markers: {}, score: 0, dominantPattern: undefined };
    const communicationFlags: string[] = [];

    if (communications && communications.length > 0) {
      const inboundComms = communications.filter(c => c.direction === 'inbound');
      const combinedContent = inboundComms.map(c => c.content).join(' ');
      contentAnalysis = analyzeContent(combinedContent);
      
      // Flag specific communications
      for (const comm of inboundComms) {
        const analysis = analyzeContent(comm.content);
        if (analysis.score > 0.3) {
          communicationFlags.push(`${comm.channel} (${comm.timestamp}): ${analysis.dominantPattern || 'manipulation'} detected`);
        }
      }
    }

    // Analyze behavioral cues
    const behavioralAnalysis = analyzeBehavioralCues(behavioralCues);

    // Build indicators
    const indicators = buildIndicators(contentAnalysis, behavioralAnalysis, context);

    // Calculate overall risk
    const overallRisk = Math.min(1, 
      (contentAnalysis.score * 0.4) + 
      (behavioralAnalysis.score * 0.4) +
      (indicators.length * 0.05) +
      ((context?.previousManipulationAttempts || 0) * 0.05)
    );

    // Determine risk level
    let riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
    if (overallRisk >= 0.8) riskLevel = 'critical';
    else if (overallRisk >= 0.6) riskLevel = 'high';
    else if (overallRisk >= 0.4) riskLevel = 'moderate';
    else if (overallRisk >= 0.2) riskLevel = 'low';
    else riskLevel = 'minimal';

    // Get all detected techniques
    const detectedTechniques = [...new Set([
      ...behavioralAnalysis.techniques,
      ...indicators.map(i => i.technique),
    ])];

    // Generate counter strategies
    const counterStrategies = generateCounterStrategies(detectedTechniques, context);

    const analysis: ReflexiveControlAnalysis = {
      indicators,
      overallRisk,
      riskLevel,
      primaryTechnique: contentAnalysis.dominantPattern || detectedTechniques[0],
      detectedTechniques,
      counterStrategies,
      communicationFlags,
      manipulationPatterns: detectedTechniques.map(t => ({
        pattern: t,
        frequency: indicators.filter(i => i.technique === t).length,
        trend: 'stable',
      })),
    };

    // Store in reflexive_control_indicators table
    if (indicators.length > 0) {
      for (const indicator of indicators.slice(0, 5)) { // Store top 5
        await supabaseClient
          .from('reflexive_control_indicators')
          .insert({
            profile_id: profileId,
            user_id: userId,
            rc_technique: indicator.technique,
            confidence_score: indicator.confidence,
            counter_strategy: counterStrategies[0] || null,
            detection_context: { source: 'edge_function', version: '7.0.0' },
            indicators_found: indicator.evidence,
          });
      }
    }

    // Store in ai_analyses for fusion
    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'reflexive_control',
        result: { ...analysis, analysisVersion: '7.0.0', source: 'CIA Studies in Intelligence' },
        generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        confidence: 1 - (overallRisk * 0.3), // Higher risk = slightly lower confidence in benign intent
        payload: analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[reflexive-control-detector] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
