/**
 * IIO Attribution Engine Edge Function
 * 
 * Traffic-light confidence matrix for Information Influence Operations attribution.
 * Based on NATO/EU declassified frameworks (Feb 2025).
 * 
 * Features:
 * - Technical evidence scoring (infrastructure, TTPs)
 * - Behavioral evidence scoring (campaign patterns)
 * - Contextual evidence scoring (narrative alignment)
 * - Doppelgänger campaign pattern detection
 * - Traffic-light (Red/Amber/Green) confidence output
 * 
 * @version 7.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IIOAttributionRequest {
  profileId: string;
  // Technical indicators
  technicalIndicators?: {
    ipAddresses?: string[];
    domains?: string[];
    infrastructure?: string[];
    ttps?: string[]; // Tactics, Techniques, Procedures
    malwareHashes?: string[];
    certificates?: string[];
  };
  // Behavioral indicators
  behavioralIndicators?: {
    postingPatterns?: { timezone?: string; peakHours?: number[]; frequency?: number };
    languagePatterns?: { primaryLang?: string; translationArtifacts?: boolean; idiomMisuse?: string[] };
    targetingPatterns?: { demographics?: string[]; topics?: string[]; platforms?: string[] };
    coordinationSignals?: { amplificationNetworks?: string[]; synchronizedPosting?: boolean };
  };
  // Contextual indicators
  contextualIndicators?: {
    narrativeAlignment?: { themes?: string[]; stateMedia?: boolean; officialEchoing?: boolean };
    geopoliticalContext?: { beneficiary?: string; adversary?: string; eventTiming?: string };
    historicalPatterns?: { previousCampaigns?: string[]; knownActors?: string[] };
  };
}

interface AttributionEvidence {
  category: string;
  indicator: string;
  confidence: number;
  weight: number;
  description: string;
}

interface IIOAttribution {
  technicalEvidence: AttributionEvidence[];
  behavioralEvidence: AttributionEvidence[];
  contextualEvidence: AttributionEvidence[];
  technicalScore: number;
  behavioralScore: number;
  contextualScore: number;
  overallConfidence: number;
  confidenceLevel: 'red' | 'amber' | 'green';
  likelyActor?: string;
  campaignType?: string;
  doppelgangerIndicators: string[];
  recommendations: string[];
}

// Known TTP patterns for major threat actors
const KNOWN_TTPS: Record<string, string[]> = {
  'APT28': ['spearphishing', 'credential-harvesting', 'watering-hole', 'zero-day-exploitation'],
  'APT29': ['supply-chain-compromise', 'cloud-exploitation', 'dormant-implants'],
  'Lazarus': ['financial-targeting', 'cryptocurrency-theft', 'destructive-malware'],
  'Ghostwriter': ['credential-phishing', 'media-impersonation', 'hack-and-leak'],
  'Secondary-Infektion': ['forged-documents', 'false-personas', 'cross-platform-amplification'],
  'Doppelganger': ['typosquatting', 'clone-sites', 'ai-generated-content', 'impersonation'],
};

// Known infrastructure patterns
const INFRASTRUCTURE_PATTERNS: Record<string, string[]> = {
  'russia': ['vps-providers-ru', 'bulletproof-hosting', 'tor-exit-nodes', 'residential-proxies'],
  'china': ['cloud-front-asia', 'cdn-obfuscation', 'compromised-websites'],
  'iran': ['middle-east-hosting', 'social-media-farms'],
  'dprk': ['cryptocurrency-infrastructure', 'compromised-routers'],
};

function scoreTechnicalEvidence(indicators: IIOAttributionRequest['technicalIndicators']): {
  evidence: AttributionEvidence[];
  score: number;
  likelyActor?: string;
} {
  const evidence: AttributionEvidence[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  const actorMatches: Record<string, number> = {};

  if (!indicators) return { evidence, score: 0 };

  // Analyze TTPs
  if (indicators.ttps && indicators.ttps.length > 0) {
    for (const ttp of indicators.ttps) {
      const ttpLower = ttp.toLowerCase();
      for (const [actor, patterns] of Object.entries(KNOWN_TTPS)) {
        if (patterns.some(p => ttpLower.includes(p))) {
          actorMatches[actor] = (actorMatches[actor] || 0) + 1;
          evidence.push({
            category: 'TTP Match',
            indicator: ttp,
            confidence: 0.7,
            weight: 0.8,
            description: `Matches known ${actor} techniques`,
          });
          totalScore += 0.7 * 0.8;
          totalWeight += 0.8;
        }
      }
    }
  }

  // Analyze infrastructure
  if (indicators.infrastructure && indicators.infrastructure.length > 0) {
    for (const infra of indicators.infrastructure) {
      const infraLower = infra.toLowerCase();
      for (const [origin, patterns] of Object.entries(INFRASTRUCTURE_PATTERNS)) {
        if (patterns.some(p => infraLower.includes(p))) {
          evidence.push({
            category: 'Infrastructure',
            indicator: infra,
            confidence: 0.6,
            weight: 0.7,
            description: `Consistent with ${origin} operations infrastructure`,
          });
          totalScore += 0.6 * 0.7;
          totalWeight += 0.7;
        }
      }
    }
  }

  // Domain analysis
  if (indicators.domains && indicators.domains.length > 0) {
    for (const domain of indicators.domains) {
      // Check for typosquatting patterns
      if (domain.includes('-') || /\d/.test(domain)) {
        evidence.push({
          category: 'Domain Pattern',
          indicator: domain,
          confidence: 0.5,
          weight: 0.5,
          description: 'Suspicious domain pattern (possible typosquatting)',
        });
        totalScore += 0.5 * 0.5;
        totalWeight += 0.5;
      }
    }
  }

  const score = totalWeight > 0 ? totalScore / totalWeight : 0;
  const likelyActor = Object.entries(actorMatches)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  return { evidence, score, likelyActor };
}

function scoreBehavioralEvidence(indicators: IIOAttributionRequest['behavioralIndicators']): {
  evidence: AttributionEvidence[];
  score: number;
  doppelgangerIndicators: string[];
} {
  const evidence: AttributionEvidence[] = [];
  const doppelgangerIndicators: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  if (!indicators) return { evidence, score: 0, doppelgangerIndicators };

  // Posting pattern analysis
  if (indicators.postingPatterns) {
    const { timezone, peakHours, frequency } = indicators.postingPatterns;
    
    // Unusual timezone/hour combinations
    if (timezone && peakHours && peakHours.length > 0) {
      const suspiciousHours = peakHours.filter(h => h < 6 || h > 22);
      if (suspiciousHours.length > 0) {
        evidence.push({
          category: 'Posting Pattern',
          indicator: `Peak activity at unusual hours: ${suspiciousHours.join(', ')}`,
          confidence: 0.6,
          weight: 0.6,
          description: 'Activity pattern inconsistent with claimed location',
        });
        totalScore += 0.6 * 0.6;
        totalWeight += 0.6;
      }
    }

    // High frequency automated patterns
    if (frequency && frequency > 50) {
      evidence.push({
        category: 'Posting Frequency',
        indicator: `${frequency} posts per day`,
        confidence: 0.7,
        weight: 0.7,
        description: 'Posting frequency suggests automation',
      });
      totalScore += 0.7 * 0.7;
      totalWeight += 0.7;
    }
  }

  // Language pattern analysis
  if (indicators.languagePatterns) {
    const { translationArtifacts, idiomMisuse } = indicators.languagePatterns;
    
    if (translationArtifacts) {
      evidence.push({
        category: 'Language',
        indicator: 'Translation artifacts detected',
        confidence: 0.65,
        weight: 0.7,
        description: 'Text shows signs of machine translation',
      });
      doppelgangerIndicators.push('Translation artifacts');
      totalScore += 0.65 * 0.7;
      totalWeight += 0.7;
    }

    if (idiomMisuse && idiomMisuse.length > 0) {
      evidence.push({
        category: 'Language',
        indicator: `Idiom misuse: ${idiomMisuse.join(', ')}`,
        confidence: 0.6,
        weight: 0.6,
        description: 'Cultural/linguistic inconsistencies',
      });
      doppelgangerIndicators.push('Idiom misuse');
      totalScore += 0.6 * 0.6;
      totalWeight += 0.6;
    }
  }

  // Coordination signals
  if (indicators.coordinationSignals) {
    const { synchronizedPosting, amplificationNetworks } = indicators.coordinationSignals;
    
    if (synchronizedPosting) {
      evidence.push({
        category: 'Coordination',
        indicator: 'Synchronized posting detected',
        confidence: 0.8,
        weight: 0.9,
        description: 'Multiple accounts posting identical/similar content simultaneously',
      });
      doppelgangerIndicators.push('Synchronized amplification');
      totalScore += 0.8 * 0.9;
      totalWeight += 0.9;
    }

    if (amplificationNetworks && amplificationNetworks.length > 0) {
      evidence.push({
        category: 'Amplification',
        indicator: `${amplificationNetworks.length} connected amplification accounts`,
        confidence: 0.75,
        weight: 0.8,
        description: 'Artificial amplification network detected',
      });
      totalScore += 0.75 * 0.8;
      totalWeight += 0.8;
    }
  }

  const score = totalWeight > 0 ? totalScore / totalWeight : 0;
  return { evidence, score, doppelgangerIndicators };
}

function scoreContextualEvidence(indicators: IIOAttributionRequest['contextualIndicators']): {
  evidence: AttributionEvidence[];
  score: number;
  campaignType?: string;
} {
  const evidence: AttributionEvidence[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  let campaignType: string | undefined;

  if (!indicators) return { evidence, score: 0 };

  // Narrative alignment
  if (indicators.narrativeAlignment) {
    const { stateMedia, officialEchoing, themes } = indicators.narrativeAlignment;
    
    if (stateMedia && officialEchoing) {
      evidence.push({
        category: 'Narrative',
        indicator: 'Narratives align with state media and official positions',
        confidence: 0.85,
        weight: 0.9,
        description: 'Strong alignment with state-sponsored messaging',
      });
      campaignType = 'State-Sponsored Influence Operation';
      totalScore += 0.85 * 0.9;
      totalWeight += 0.9;
    } else if (stateMedia) {
      evidence.push({
        category: 'Narrative',
        indicator: 'Narratives echo state media themes',
        confidence: 0.65,
        weight: 0.7,
        description: 'Alignment with state media narratives',
      });
      totalScore += 0.65 * 0.7;
      totalWeight += 0.7;
    }

    if (themes && themes.length > 0) {
      evidence.push({
        category: 'Themes',
        indicator: `Promoting themes: ${themes.join(', ')}`,
        confidence: 0.5,
        weight: 0.5,
        description: 'Identified narrative themes',
      });
      totalScore += 0.5 * 0.5;
      totalWeight += 0.5;
    }
  }

  // Geopolitical context
  if (indicators.geopoliticalContext) {
    const { beneficiary, adversary, eventTiming } = indicators.geopoliticalContext;
    
    if (beneficiary && adversary) {
      evidence.push({
        category: 'Geopolitical',
        indicator: `Benefits: ${beneficiary}, Targets: ${adversary}`,
        confidence: 0.7,
        weight: 0.75,
        description: 'Clear cui bono pattern',
      });
      totalScore += 0.7 * 0.75;
      totalWeight += 0.75;
    }

    if (eventTiming) {
      evidence.push({
        category: 'Timing',
        indicator: `Correlated with: ${eventTiming}`,
        confidence: 0.6,
        weight: 0.6,
        description: 'Operation timing correlates with significant events',
      });
      totalScore += 0.6 * 0.6;
      totalWeight += 0.6;
    }
  }

  // Historical patterns
  if (indicators.historicalPatterns) {
    const { previousCampaigns, knownActors } = indicators.historicalPatterns;
    
    if (previousCampaigns && previousCampaigns.length > 0) {
      evidence.push({
        category: 'Historical',
        indicator: `Similar to: ${previousCampaigns.join(', ')}`,
        confidence: 0.7,
        weight: 0.75,
        description: 'Resembles previous documented campaigns',
      });
      totalScore += 0.7 * 0.75;
      totalWeight += 0.75;
    }

    if (knownActors && knownActors.length > 0) {
      evidence.push({
        category: 'Attribution',
        indicator: `Linked to: ${knownActors.join(', ')}`,
        confidence: 0.75,
        weight: 0.8,
        description: 'Matches TTPs of known threat actors',
      });
      totalScore += 0.75 * 0.8;
      totalWeight += 0.8;
    }
  }

  const score = totalWeight > 0 ? totalScore / totalWeight : 0;
  return { evidence, score, campaignType };
}

function generateRecommendations(attribution: Partial<IIOAttribution>): string[] {
  const recommendations: string[] = [];

  if (attribution.confidenceLevel === 'green') {
    recommendations.push('Proceed with public attribution');
    recommendations.push('Document evidence chain for legal/diplomatic use');
    recommendations.push('Coordinate with allied partners for joint attribution');
  } else if (attribution.confidenceLevel === 'amber') {
    recommendations.push('Gather additional technical evidence');
    recommendations.push('Seek corroboration from third-party sources');
    recommendations.push('Consider private diplomatic channels');
    recommendations.push('Continue monitoring for additional indicators');
  } else {
    recommendations.push('Insufficient evidence for attribution');
    recommendations.push('Expand collection on technical indicators');
    recommendations.push('Deploy additional monitoring capabilities');
    recommendations.push('Cross-reference with partner intelligence');
  }

  if (attribution.doppelgangerIndicators && attribution.doppelgangerIndicators.length > 2) {
    recommendations.push('High probability of Doppelganger-style operation - coordinate with EU EEAS');
  }

  return recommendations;
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
      JSON.stringify({ ok: true, function: 'iio-attribution-engine', timestamp: Date.now() }),
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

    const body: IIOAttributionRequest = await req.json();
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

    const { profileId, technicalIndicators, behavioralIndicators, contextualIndicators } = body;

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'profileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score each evidence category
    const technical = scoreTechnicalEvidence(technicalIndicators);
    const behavioral = scoreBehavioralEvidence(behavioralIndicators);
    const contextual = scoreContextualEvidence(contextualIndicators);

    // Calculate overall confidence (weighted average)
    const weights = { technical: 0.35, behavioral: 0.35, contextual: 0.30 };
    const overallConfidence = 
      technical.score * weights.technical +
      behavioral.score * weights.behavioral +
      contextual.score * weights.contextual;

    // Determine traffic light level
    let confidenceLevel: 'red' | 'amber' | 'green';
    if (overallConfidence >= 0.75) {
      confidenceLevel = 'green';
    } else if (overallConfidence >= 0.5) {
      confidenceLevel = 'amber';
    } else {
      confidenceLevel = 'red';
    }

    const attribution: IIOAttribution = {
      technicalEvidence: technical.evidence,
      behavioralEvidence: behavioral.evidence,
      contextualEvidence: contextual.evidence,
      technicalScore: technical.score,
      behavioralScore: behavioral.score,
      contextualScore: contextual.score,
      overallConfidence,
      confidenceLevel,
      likelyActor: technical.likelyActor,
      campaignType: contextual.campaignType,
      doppelgangerIndicators: behavioral.doppelgangerIndicators,
      recommendations: [],
    };

    attribution.recommendations = generateRecommendations(attribution);

    // Store in iio_attributions table
    const { error: insertError } = await supabaseClient
      .from('iio_attributions')
      .insert({
        profile_id: profileId,
        user_id: userId,
        technical_evidence: technical.evidence,
        behavioral_evidence: behavioral.evidence,
        contextual_evidence: contextual.evidence,
        confidence_level: confidenceLevel,
        overall_confidence: overallConfidence,
      });

    if (insertError) {
      console.error('[iio-attribution-engine] Insert error:', insertError);
    }

    // Store in ai_analyses for fusion
    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'iio_attribution',
        result: { ...attribution, analysisVersion: '7.0.0', framework: 'NATO/EU 2025' },
        generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        confidence: overallConfidence,
        payload: attribution,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[iio-attribution-engine] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
