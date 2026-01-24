import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeceptionIndicator {
  indicator: string;
  weight: number;
  description: string;
  detected: boolean;
  evidence: string[];
  confidence: number;
}

interface StatementAnalysis {
  overall_deception_score: number;
  confidence: number;
  indicators: DeceptionIndicator[];
  linguistic_analysis: {
    pronoun_patterns: any;
    verb_tense_analysis: any;
    sensory_details: any;
    temporal_analysis: any;
    emotional_language: any;
  };
  credibility_factors: string[];
  concern_areas: string[];
  recommendations: string[];
}

// SCAN (Scientific Content Analysis) indicators
const DECEPTION_INDICATORS = [
  {
    id: 'missing_i',
    name: 'Missing "I"',
    weight: 0.85,
    description: 'Avoidance of first-person pronoun in self-referential statements'
  },
  {
    id: 'pronoun_distancing',
    name: 'Pronoun Distancing',
    weight: 0.80,
    description: 'Using "the" instead of "my", or avoiding possessive pronouns'
  },
  {
    id: 'verb_tense_shift',
    name: 'Verb Tense Inconsistency',
    weight: 0.75,
    description: 'Shifting between past and present tense inappropriately'
  },
  {
    id: 'temporal_gaps',
    name: 'Temporal Lacunae',
    weight: 0.90,
    description: 'Missing time periods in narrative'
  },
  {
    id: 'sensory_imbalance',
    name: 'Sensory Detail Imbalance',
    weight: 0.70,
    description: 'Lack of sensory details in key moments'
  },
  {
    id: 'conviction_lack',
    name: 'Lack of Conviction',
    weight: 0.78,
    description: 'Use of hedging words and modal verbs'
  },
  {
    id: 'unnecessary_connectors',
    name: 'Unnecessary Connectors',
    weight: 0.65,
    description: 'Excessive use of "and then", "so", "therefore"'
  },
  {
    id: 'passive_voice',
    name: 'Passive Voice Usage',
    weight: 0.60,
    description: 'Using passive voice to avoid agency'
  },
  {
    id: 'denial_vs_memory',
    name: 'Denial vs Memory Failure',
    weight: 0.85,
    description: 'Categorical denial vs "I don\'t remember"'
  },
  {
    id: 'negative_statements',
    name: 'Negative Statements',
    weight: 0.70,
    description: 'Telling what didn\'t happen instead of what did'
  },
  {
    id: 'out_of_sequence',
    name: 'Out of Sequence Information',
    weight: 0.75,
    description: 'Important details placed out of chronological order'
  },
  {
    id: 'bolstering',
    name: 'Excessive Bolstering',
    weight: 0.72,
    description: 'Over-emphasis on truthfulness or honesty'
  }
];

function analyzePronounPatterns(text: string): { 
  score: number; 
  patterns: any;
  evidence: string[];
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const evidence: string[] = [];
  
  let iCount = 0;
  let weCount = 0;
  let theyCount = 0;
  let passiveSentences = 0;
  let distancingPhrases = 0;

  const distancingPatterns = [
    /the (car|house|room|phone|wallet|bag)/gi,
    /that (person|man|woman|guy|girl)/gi,
    /this (thing|situation|matter)/gi
  ];

  sentences.forEach(sentence => {
    // Count pronouns
    iCount += (sentence.match(/\bI\b/g) || []).length;
    weCount += (sentence.match(/\bwe\b/gi) || []).length;
    theyCount += (sentence.match(/\bthey\b/gi) || []).length;

    // Check for passive voice
    if (/\b(was|were|been|being)\b.*\b(by|done|made|taken)\b/i.test(sentence)) {
      passiveSentences++;
      evidence.push(`Passive voice: "${sentence.trim().substring(0, 50)}..."`);
    }

    // Check for distancing
    distancingPatterns.forEach(pattern => {
      if (pattern.test(sentence)) {
        distancingPhrases++;
        evidence.push(`Distancing: "${sentence.trim().substring(0, 50)}..."`);
      }
    });
  });

  const totalPronouns = iCount + weCount + theyCount;
  const iRatio = totalPronouns > 0 ? iCount / totalPronouns : 0;
  const passiveRatio = sentences.length > 0 ? passiveSentences / sentences.length : 0;

  // Low I usage and high passive = higher deception score
  const score = (1 - iRatio) * 0.5 + passiveRatio * 0.3 + (distancingPhrases / sentences.length) * 0.2;

  return {
    score: Math.min(1, score),
    patterns: {
      i_count: iCount,
      we_count: weCount,
      they_count: theyCount,
      i_ratio: iRatio,
      passive_sentences: passiveSentences,
      passive_ratio: passiveRatio,
      distancing_phrases: distancingPhrases
    },
    evidence
  };
}

function analyzeVerbTense(text: string): {
  score: number;
  analysis: any;
  evidence: string[];
} {
  const evidence: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  let pastCount = 0;
  let presentCount = 0;
  let shiftCount = 0;
  let prevTense: 'past' | 'present' | null = null;

  const pastIndicators = /\b(was|were|had|did|went|said|saw|came|took|made|got|knew|thought|told|found|gave|left|felt|became|kept|began|seemed|heard|brought|held|wrote|stood|lost|paid|met|ran|set|learned|changed|led|understood|watched|followed|stopped|created|spoken|broken|chosen|driven|eaten|fallen|forgotten|given|gone|grown|hidden|known|lain|ridden|risen|seen|shaken|shown|sung|spoken|stolen|sworn|taken|thrown|worn|written)\b/gi;
  const presentIndicators = /\b(is|are|am|do|does|go|goes|say|says|see|sees|come|comes|take|takes|make|makes|get|gets|know|knows|think|thinks|tell|tells|find|finds|give|gives|leave|leaves|feel|feels|become|becomes|keep|keeps|begin|begins|seem|seems|hear|hears|bring|brings|hold|holds|write|writes|stand|stands|lose|loses|pay|pays|meet|meets|run|runs)\b/gi;

  sentences.forEach((sentence, index) => {
    const pastMatches = sentence.match(pastIndicators) || [];
    const presentMatches = sentence.match(presentIndicators) || [];

    const sentenceTense: 'past' | 'present' | null = 
      pastMatches.length > presentMatches.length ? 'past' :
      presentMatches.length > pastMatches.length ? 'present' : null;

    if (sentenceTense === 'past') pastCount++;
    if (sentenceTense === 'present') presentCount++;

    if (prevTense && sentenceTense && prevTense !== sentenceTense) {
      shiftCount++;
      evidence.push(`Tense shift at: "${sentence.trim().substring(0, 40)}..."`);
    }
    prevTense = sentenceTense;
  });

  const totalSentences = sentences.length;
  const shiftRatio = totalSentences > 1 ? shiftCount / (totalSentences - 1) : 0;

  return {
    score: Math.min(1, shiftRatio * 2), // High shifts = higher score
    analysis: {
      past_tense_sentences: pastCount,
      present_tense_sentences: presentCount,
      tense_shifts: shiftCount,
      shift_ratio: shiftRatio
    },
    evidence
  };
}

function analyzeSensoryDetails(text: string): {
  score: number;
  details: any;
  evidence: string[];
} {
  const evidence: string[] = [];
  
  const visualWords = text.match(/\b(saw|looked|appeared|watched|noticed|observed|visible|bright|dark|color|red|blue|green|light|shadow|shape|size)\b/gi) || [];
  const auditoryWords = text.match(/\b(heard|sound|loud|quiet|noise|voice|said|told|spoke|listen|ring|bang|whisper|yell|scream)\b/gi) || [];
  const tactileWords = text.match(/\b(felt|touch|cold|hot|warm|soft|hard|rough|smooth|pain|pressure)\b/gi) || [];
  const olfactoryWords = text.match(/\b(smell|odor|scent|fragrance|stink|aroma)\b/gi) || [];
  const gustatory = text.match(/\b(taste|sweet|sour|bitter|salty|delicious|flavor)\b/gi) || [];

  const totalWords = text.split(/\s+/).length;
  const sensoryWords = visualWords.length + auditoryWords.length + tactileWords.length + 
                       olfactoryWords.length + gustatory.length;
  
  const sensoryDensity = sensoryWords / totalWords;

  // Low sensory details in narrative = potential issue
  if (sensoryDensity < 0.02) {
    evidence.push('Very low sensory detail density');
  }

  // Check for imbalance (only one type)
  const types = [visualWords.length, auditoryWords.length, tactileWords.length];
  const maxType = Math.max(...types);
  const totalSensory = types.reduce((a, b) => a + b, 0);
  
  if (totalSensory > 0 && maxType / totalSensory > 0.8) {
    evidence.push('Sensory details heavily skewed to one type');
  }

  return {
    score: sensoryDensity < 0.015 ? 0.7 : sensoryDensity < 0.03 ? 0.4 : 0.2,
    details: {
      visual: visualWords.length,
      auditory: auditoryWords.length,
      tactile: tactileWords.length,
      olfactory: olfactoryWords.length,
      gustatory: gustatory.length,
      total: sensoryWords,
      density: sensoryDensity
    },
    evidence
  };
}

function analyzeTemporalFlow(text: string): {
  score: number;
  analysis: any;
  evidence: string[];
} {
  const evidence: string[] = [];
  
  // Look for temporal markers
  const temporalMarkers = text.match(/\b(then|after|before|when|while|during|later|earlier|next|first|second|finally|meanwhile|subsequently|previously|soon|immediately|suddenly)\b/gi) || [];
  
  // Look for time gaps
  const timeGaps = text.match(/\b(the next (day|week|month)|some time later|I don't remember (when|how long)|at some point|eventually)\b/gi) || [];
  
  // Look for sequence indicators
  const sequences = text.match(/\b(and then|so then|after that|following that)\b/gi) || [];
  
  const totalSentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const markerDensity = temporalMarkers.length / totalSentences;

  if (timeGaps.length > 0) {
    evidence.push(`Temporal gaps found: ${timeGaps.length} instances`);
    timeGaps.slice(0, 3).forEach(gap => {
      evidence.push(`Gap indicator: "${gap}"`);
    });
  }

  // Excessive "and then" can indicate fabrication
  if (sequences.length > totalSentences * 0.2) {
    evidence.push('Excessive sequential connectors (possible fabrication)');
  }

  return {
    score: (timeGaps.length * 0.2) + (markerDensity < 0.1 ? 0.3 : 0),
    analysis: {
      temporal_markers: temporalMarkers.length,
      time_gaps: timeGaps.length,
      sequence_connectors: sequences.length,
      marker_density: markerDensity
    },
    evidence
  };
}

function analyzeEmotionalLanguage(text: string): {
  score: number;
  analysis: any;
  evidence: string[];
} {
  const evidence: string[] = [];
  
  // Hedging words indicate uncertainty/deception
  const hedgingWords = text.match(/\b(maybe|perhaps|possibly|probably|might|could|sort of|kind of|I think|I believe|I guess|supposedly|apparently)\b/gi) || [];
  
  // Certainty markers (too much = overcompensation)
  const certaintyWords = text.match(/\b(definitely|absolutely|certainly|surely|honestly|truly|really|actually|literally|I swear|to be honest|truthfully)\b/gi) || [];
  
  // Emotional words
  const emotionWords = text.match(/\b(scared|afraid|angry|happy|sad|worried|nervous|upset|shocked|surprised|confused|frustrated)\b/gi) || [];
  
  const totalWords = text.split(/\s+/).length;

  // High hedging = deception indicator
  if (hedgingWords.length / totalWords > 0.02) {
    evidence.push('High frequency of hedging language');
  }

  // Excessive certainty markers = bolstering (deception indicator)
  if (certaintyWords.length > 3) {
    evidence.push('Excessive truthfulness bolstering detected');
  }

  // Low emotion in emotional narrative = concerning
  if (emotionWords.length < 2 && text.length > 500) {
    evidence.push('Notably absent emotional language in lengthy statement');
  }

  const hedgingScore = Math.min(1, (hedgingWords.length / totalWords) * 30);
  const bolsteringScore = Math.min(1, certaintyWords.length * 0.15);

  return {
    score: (hedgingScore + bolsteringScore) / 2,
    analysis: {
      hedging_words: hedgingWords.length,
      certainty_bolstering: certaintyWords.length,
      emotion_words: emotionWords.length,
      hedging_ratio: hedgingWords.length / totalWords
    },
    evidence
  };
}

async function analyzeStatement(
  statement: string,
  context: string,
  supabaseClient: any,
  useAI: boolean = false
): Promise<StatementAnalysis> {
  const indicators: DeceptionIndicator[] = [];
  const concernAreas: string[] = [];
  const credibilityFactors: string[] = [];

  // Run all linguistic analyses
  const pronounAnalysis = analyzePronounPatterns(statement);
  const verbAnalysis = analyzeVerbTense(statement);
  const sensoryAnalysis = analyzeSensoryDetails(statement);
  const temporalAnalysis = analyzeTemporalFlow(statement);
  const emotionalAnalysis = analyzeEmotionalLanguage(statement);

  // Map analyses to indicators
  DECEPTION_INDICATORS.forEach(indicator => {
    let detected = false;
    let confidence = 0;
    const evidence: string[] = [];

    switch (indicator.id) {
      case 'missing_i':
      case 'pronoun_distancing':
        detected = pronounAnalysis.score > 0.5;
        confidence = pronounAnalysis.score;
        evidence.push(...pronounAnalysis.evidence);
        break;
      case 'passive_voice':
        detected = pronounAnalysis.patterns.passive_ratio > 0.3;
        confidence = pronounAnalysis.patterns.passive_ratio;
        break;
      case 'verb_tense_shift':
        detected = verbAnalysis.score > 0.4;
        confidence = verbAnalysis.score;
        evidence.push(...verbAnalysis.evidence);
        break;
      case 'sensory_imbalance':
        detected = sensoryAnalysis.score > 0.5;
        confidence = sensoryAnalysis.score;
        evidence.push(...sensoryAnalysis.evidence);
        break;
      case 'temporal_gaps':
        detected = temporalAnalysis.analysis.time_gaps > 0;
        confidence = Math.min(1, temporalAnalysis.analysis.time_gaps * 0.3);
        evidence.push(...temporalAnalysis.evidence);
        break;
      case 'conviction_lack':
        detected = emotionalAnalysis.analysis.hedging_ratio > 0.02;
        confidence = emotionalAnalysis.score;
        evidence.push(...emotionalAnalysis.evidence);
        break;
      case 'bolstering':
        detected = emotionalAnalysis.analysis.certainty_bolstering > 3;
        confidence = Math.min(1, emotionalAnalysis.analysis.certainty_bolstering * 0.2);
        break;
      case 'unnecessary_connectors':
        detected = temporalAnalysis.analysis.sequence_connectors > 5;
        confidence = Math.min(1, temporalAnalysis.analysis.sequence_connectors * 0.1);
        break;
    }

    if (detected) {
      concernAreas.push(indicator.name);
    }

    indicators.push({
      ...indicator,
      indicator: indicator.name,
      detected,
      evidence,
      confidence
    });
  });

  // Calculate overall deception score
  const detectedIndicators = indicators.filter(i => i.detected);
  const weightedScore = detectedIndicators.reduce((sum, i) => sum + (i.weight * i.confidence), 0);
  const maxPossibleScore = DECEPTION_INDICATORS.reduce((sum, i) => sum + i.weight, 0);
  const overallScore = weightedScore / maxPossibleScore;

  // Determine credibility factors
  if (sensoryAnalysis.details.density > 0.03) {
    credibilityFactors.push('Rich sensory details present');
  }
  if (pronounAnalysis.patterns.i_ratio > 0.4) {
    credibilityFactors.push('Strong first-person commitment');
  }
  if (verbAnalysis.analysis.shift_ratio < 0.1) {
    credibilityFactors.push('Consistent verb tense usage');
  }
  if (emotionalAnalysis.analysis.emotion_words > 3) {
    credibilityFactors.push('Appropriate emotional content');
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (overallScore > 0.6) {
    recommendations.push('Statement requires detailed follow-up questioning');
    recommendations.push('Focus verification on temporal gaps identified');
    recommendations.push('Request specific sensory details for key events');
  } else if (overallScore > 0.4) {
    recommendations.push('Some indicators warrant clarifying questions');
    recommendations.push('Cross-reference with available evidence');
  } else {
    recommendations.push('Statement shows consistent linguistic patterns');
    recommendations.push('Verify factual claims through standard procedures');
  }

  return {
    overall_deception_score: overallScore,
    confidence: detectedIndicators.length > 3 ? 0.8 : 0.6,
    indicators,
    linguistic_analysis: {
      pronoun_patterns: pronounAnalysis,
      verb_tense_analysis: verbAnalysis,
      sensory_details: sensoryAnalysis,
      temporal_analysis: temporalAnalysis,
      emotional_language: emotionalAnalysis
    },
    credibility_factors: credibilityFactors,
    concern_areas: concernAreas,
    recommendations
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, data } = await req.json();

    if (action === 'analyze') {
      const { statement, context, profileId } = data;

      const analysis = await analyzeStatement(
        statement,
        context || '',
        supabaseClient
      );

      // Store analysis
      await supabaseClient.from('statement_analyses').insert({
        user_id: userId,
        profile_id: profileId,
        statement_text: statement,
        context,
        analysis_result: analysis,
        deception_score: analysis.overall_deception_score,
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'compare_statements') {
      const { statements } = data;
      
      const analyses = await Promise.all(
        statements.map((s: any) => analyzeStatement(s.text, s.context || '', supabaseClient))
      );

      // Find inconsistencies between statements
      const inconsistencies: string[] = [];
      
      // Compare pronoun usage patterns
      const pronounPatterns = analyses.map(a => a.linguistic_analysis.pronoun_patterns.patterns.i_ratio);
      const pronounVariance = Math.max(...pronounPatterns) - Math.min(...pronounPatterns);
      if (pronounVariance > 0.2) {
        inconsistencies.push('Significant variation in pronoun usage between statements');
      }

      // Compare sensory detail density
      const sensoryDensities = analyses.map(a => a.linguistic_analysis.sensory_details.details.density);
      const sensoryVariance = Math.max(...sensoryDensities) - Math.min(...sensoryDensities);
      if (sensoryVariance > 0.02) {
        inconsistencies.push('Inconsistent sensory detail richness across statements');
      }

      return new Response(JSON.stringify({
        success: true,
        individual_analyses: analyses,
        inconsistencies,
        overall_consistency_score: 1 - (inconsistencies.length * 0.2)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_indicators') {
      return new Response(JSON.stringify({
        success: true,
        indicators: DECEPTION_INDICATORS
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in forensic-statement-analyzer:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
