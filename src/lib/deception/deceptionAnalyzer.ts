/**
 * Multimodal Deception Analysis Engine
 * 
 * Analyzes multiple communication channels (facial, vocal, linguistic, behavioral)
 * to detect deception and assess authenticity.
 */

// Deception indicator types
export interface DeceptionIndicator {
  type: 'facial' | 'vocal' | 'linguistic' | 'behavioral';
  indicator: string;
  description: string;
  confidence: number;  // 0-1
  timestamp?: number;  // ms from start
  severity: 'low' | 'medium' | 'high';
}

export interface MicroExpression {
  emotion: string;
  duration: number;      // ms
  timestamp: number;     // ms from start
  authenticity: number;  // 0-1
  actionUnits: string[]; // FACS action units
}

export interface VoiceStressMarker {
  type: 'pitch_variation' | 'speech_rate' | 'pause_pattern' | 'tremor' | 'filler_words';
  value: number;
  baseline: number;
  deviation: number;
  timestamp: number;
  significance: number;
}

export interface LinguisticMarker {
  type: 'pronoun_shift' | 'hedging' | 'distancing' | 'negation' | 'cognitive_load' | 'tense_inconsistency';
  text: string;
  explanation: string;
  weight: number;
}

export interface CrossModalConflict {
  modalities: string[];
  description: string;
  severity: number;
  timestamp?: number;
  interpretation: string;
}

export interface DeceptionAnalysisResult {
  overallScore: number;               // 0-1 (0 = truthful, 1 = deceptive)
  likelihood: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  confidence: number;
  facialAnalysis: {
    authenticityScore: number;
    microExpressions: MicroExpression[];
    indicators: DeceptionIndicator[];
  };
  vocalAnalysis: {
    authenticityScore: number;
    stressMarkers: VoiceStressMarker[];
    indicators: DeceptionIndicator[];
  };
  linguisticAnalysis: {
    authenticityScore: number;
    markers: LinguisticMarker[];
    indicators: DeceptionIndicator[];
  };
  crossModalConflicts: CrossModalConflict[];
  timeline: DeceptionTimelineEvent[];
  peakDeceptionMoments: { timestamp: number; score: number; triggers: string[] }[];
  recommendations: string[];
}

export interface DeceptionTimelineEvent {
  timestamp: number;
  score: number;
  modality: string;
  event: string;
}

// LIWC-based linguistic deception markers
const LINGUISTIC_DECEPTION_PATTERNS = {
  // Pronoun distancing
  pronounDistancing: {
    patterns: [
      /\bthey\b/gi, /\bthose people\b/gi, /\bthat person\b/gi,
      /\bone\b/gi, /\bsomeone\b/gi
    ],
    weight: 0.3,
    explanation: 'Distancing language - avoiding personal pronouns'
  },
  
  // I-reduction (fewer first-person pronouns)
  iReduction: {
    patterns: [/\bi\b/gi, /\bme\b/gi, /\bmy\b/gi, /\bmyself\b/gi],
    weight: -0.2, // Negative weight - presence indicates truthfulness
    explanation: 'First-person pronoun usage'
  },
  
  // Hedging language
  hedging: {
    patterns: [
      /\bmaybe\b/gi, /\bperhaps\b/gi, /\bprobably\b/gi, /\bpossibly\b/gi,
      /\bkind of\b/gi, /\bsort of\b/gi, /\bi think\b/gi, /\bi guess\b/gi,
      /\bmore or less\b/gi, /\bbasically\b/gi, /\bi believe\b/gi
    ],
    weight: 0.25,
    explanation: 'Hedging and uncertainty markers'
  },
  
  // Excessive qualifiers
  qualifiers: {
    patterns: [
      /\bhonestly\b/gi, /\bto be honest\b/gi, /\bfrankly\b/gi,
      /\btruthfully\b/gi, /\bi swear\b/gi, /\bbelieve me\b/gi,
      /\bi promise\b/gi, /\bto tell you the truth\b/gi
    ],
    weight: 0.35,
    explanation: 'Truth-asserting phrases often indicate deception'
  },
  
  // Negation
  negation: {
    patterns: [
      /\bnever\b/gi, /\bno\b/gi, /\bnot\b/gi, /\bnone\b/gi,
      /\bnothing\b/gi, /\bnobody\b/gi, /\bnowhere\b/gi
    ],
    weight: 0.15,
    explanation: 'Excessive negation can indicate defensiveness'
  },
  
  // Cognitive complexity markers (low complexity = deception)
  simplification: {
    patterns: [
      /\bjust\b/gi, /\bsimply\b/gi, /\bonly\b/gi, /\bmerely\b/gi
    ],
    weight: 0.1,
    explanation: 'Over-simplification markers'
  },
  
  // Filler words (cognitive load)
  fillers: {
    patterns: [
      /\bum+\b/gi, /\buh+\b/gi, /\ber+\b/gi, /\blike\b/gi,
      /\byou know\b/gi, /\bi mean\b/gi, /\bwell\b/gi
    ],
    weight: 0.2,
    explanation: 'Filler words indicate cognitive load from fabrication'
  },
  
  // Tense inconsistency
  tenseInconsistency: {
    patterns: [
      /\bwas\b.*\bis\b/gi, /\bis\b.*\bwas\b/gi,
      /\bwill\b.*\bhad\b/gi, /\bhad\b.*\bwill\b/gi
    ],
    weight: 0.3,
    explanation: 'Tense inconsistencies in narrative'
  }
};

// Facial Action Coding System (FACS) deception indicators
const FACS_DECEPTION_INDICATORS = {
  // Microexpression patterns associated with deception
  contemptFlash: {
    actionUnits: ['AU14'], // Dimpler
    description: 'Brief flash of contempt - possible concealment',
    weight: 0.4
  },
  forcedSmile: {
    actionUnits: ['AU12'], // Without AU6 (Duchenne marker)
    description: 'Non-genuine smile - missing crow\'s feet',
    weight: 0.3
  },
  asymmetry: {
    actionUnits: ['asymmetric'],
    description: 'Asymmetrical expression - fabricated emotion',
    weight: 0.35
  },
  delayedOnset: {
    actionUnits: ['delayed'],
    description: 'Delayed expression onset - not spontaneous',
    weight: 0.25
  },
  browLowerer: {
    actionUnits: ['AU4'],
    description: 'Concentrated effort - possible cognitive load',
    weight: 0.2
  },
  lipPress: {
    actionUnits: ['AU24'],
    description: 'Lip pressing - withholding information',
    weight: 0.3
  },
  noseScrunch: {
    actionUnits: ['AU9'],
    description: 'Disgust microexpression during positive claims',
    weight: 0.4
  }
};

/**
 * Analyze text for linguistic deception markers
 */
export function analyzeLinguisticDeception(text: string): {
  score: number;
  markers: LinguisticMarker[];
  indicators: DeceptionIndicator[];
} {
  const markers: LinguisticMarker[] = [];
  let totalWeight = 0;
  let markerCount = 0;
  
  const wordCount = text.split(/\s+/).length;
  
  // Analyze each pattern category
  for (const [category, config] of Object.entries(LINGUISTIC_DECEPTION_PATTERNS)) {
    let matchCount = 0;
    const matches: string[] = [];
    
    for (const pattern of config.patterns) {
      const found = text.match(pattern);
      if (found) {
        matchCount += found.length;
        matches.push(...found.slice(0, 3));
      }
    }
    
    if (matchCount > 0) {
      const normalizedCount = matchCount / wordCount;
      const weight = config.weight * Math.min(normalizedCount * 10, 1);
      
      markers.push({
        type: category as LinguisticMarker['type'],
        text: matches.join(', '),
        explanation: config.explanation,
        weight
      });
      
      totalWeight += weight;
      markerCount++;
    }
  }
  
  // Check I-reduction specifically
  const iCount = (text.match(/\bi\b/gi) || []).length;
  const iRatio = iCount / wordCount;
  if (iRatio < 0.02 && wordCount > 20) {
    markers.push({
      type: 'pronoun_shift',
      text: `Only ${iCount} first-person pronouns in ${wordCount} words`,
      explanation: 'Unusually low first-person pronoun usage',
      weight: 0.25
    });
    totalWeight += 0.25;
  }
  
  // Calculate overall score
  const score = Math.min(1, totalWeight / (markerCount || 1));
  
  // Generate indicators
  const indicators: DeceptionIndicator[] = markers
    .filter(m => m.weight > 0.2)
    .map(m => ({
      type: 'linguistic' as const,
      indicator: m.type,
      description: m.explanation,
      confidence: m.weight,
      severity: m.weight > 0.3 ? 'high' : m.weight > 0.2 ? 'medium' : 'low'
    }));
  
  return { score, markers, indicators };
}

/**
 * Analyze facial data for deception indicators
 */
export function analyzeFacialDeception(
  facialData: {
    expressions: Array<{ emotion: string; confidence: number; timestamp: number }>;
    actionUnits?: Array<{ au: string; intensity: number; timestamp: number }>;
    asymmetry?: Array<{ score: number; timestamp: number }>;
  }
): {
  score: number;
  microExpressions: MicroExpression[];
  indicators: DeceptionIndicator[];
} {
  const microExpressions: MicroExpression[] = [];
  const indicators: DeceptionIndicator[] = [];
  let deceptionScore = 0;
  let indicatorCount = 0;
  
  // Analyze expressions for micro-expressions
  const expressions = facialData.expressions;
  for (let i = 1; i < expressions.length; i++) {
    const prev = expressions[i - 1];
    const curr = expressions[i];
    
    // Detect rapid emotion changes (potential micro-expressions)
    const timeDiff = curr.timestamp - prev.timestamp;
    if (timeDiff < 500 && prev.emotion !== curr.emotion) {
      // Brief expression flash
      if (timeDiff < 250) {
        microExpressions.push({
          emotion: prev.emotion,
          duration: timeDiff,
          timestamp: prev.timestamp,
          authenticity: 1 - (timeDiff / 500),
          actionUnits: []
        });
        
        // Contempt or disgust flashes are highly suspicious
        if (['contempt', 'disgust'].includes(prev.emotion.toLowerCase())) {
          deceptionScore += 0.3;
          indicatorCount++;
          indicators.push({
            type: 'facial',
            indicator: `${prev.emotion} micro-expression`,
            description: `Brief ${prev.emotion} flash detected (${timeDiff}ms)`,
            confidence: 0.7,
            timestamp: prev.timestamp,
            severity: 'high'
          });
        }
      }
    }
  }
  
  // Analyze asymmetry
  if (facialData.asymmetry) {
    const highAsymmetry = facialData.asymmetry.filter(a => a.score > 0.3);
    if (highAsymmetry.length > 0) {
      const avgAsymmetry = highAsymmetry.reduce((a, b) => a + b.score, 0) / highAsymmetry.length;
      deceptionScore += avgAsymmetry * 0.4;
      indicatorCount++;
      indicators.push({
        type: 'facial',
        indicator: 'Facial asymmetry',
        description: `Elevated facial asymmetry (${Math.round(avgAsymmetry * 100)}%) suggests fabricated expressions`,
        confidence: avgAsymmetry,
        severity: avgAsymmetry > 0.5 ? 'high' : 'medium'
      });
    }
  }
  
  // Analyze action units
  if (facialData.actionUnits) {
    for (const [indicator, config] of Object.entries(FACS_DECEPTION_INDICATORS)) {
      const matching = facialData.actionUnits.filter(au => 
        config.actionUnits.includes(au.au) && au.intensity > 0.3
      );
      
      if (matching.length > 0) {
        deceptionScore += config.weight;
        indicatorCount++;
        indicators.push({
          type: 'facial',
          indicator,
          description: config.description,
          confidence: config.weight,
          timestamp: matching[0].timestamp,
          severity: config.weight > 0.35 ? 'high' : 'medium'
        });
      }
    }
  }
  
  const score = indicatorCount > 0 ? Math.min(1, deceptionScore / indicatorCount) : 0;
  
  return { score, microExpressions, indicators };
}

/**
 * Analyze voice for stress markers
 */
export function analyzeVocalDeception(
  vocalData: {
    pitchData?: Array<{ value: number; timestamp: number }>;
    speechRate?: Array<{ wordsPerMinute: number; timestamp: number }>;
    pauses?: Array<{ duration: number; timestamp: number }>;
    fillers?: Array<{ word: string; timestamp: number }>;
  },
  baseline?: {
    avgPitch?: number;
    avgSpeechRate?: number;
    avgPauseLength?: number;
  }
): {
  score: number;
  stressMarkers: VoiceStressMarker[];
  indicators: DeceptionIndicator[];
} {
  const stressMarkers: VoiceStressMarker[] = [];
  const indicators: DeceptionIndicator[] = [];
  let deceptionScore = 0;
  
  // Establish baseline if not provided
  const effectiveBaseline = baseline || {
    avgPitch: vocalData.pitchData?.reduce((a, b) => a + b.value, 0) / (vocalData.pitchData?.length || 1) || 150,
    avgSpeechRate: vocalData.speechRate?.reduce((a, b) => a + b.wordsPerMinute, 0) / (vocalData.speechRate?.length || 1) || 130,
    avgPauseLength: vocalData.pauses?.reduce((a, b) => a + b.duration, 0) / (vocalData.pauses?.length || 1) || 400
  };
  
  // Analyze pitch variations
  if (vocalData.pitchData && vocalData.pitchData.length > 0) {
    for (const pitch of vocalData.pitchData) {
      const deviation = Math.abs(pitch.value - effectiveBaseline.avgPitch!) / effectiveBaseline.avgPitch!;
      
      if (deviation > 0.3) {
        stressMarkers.push({
          type: 'pitch_variation',
          value: pitch.value,
          baseline: effectiveBaseline.avgPitch!,
          deviation,
          timestamp: pitch.timestamp,
          significance: Math.min(1, deviation)
        });
        
        if (deviation > 0.5) {
          deceptionScore += 0.2;
          indicators.push({
            type: 'vocal',
            indicator: 'Pitch spike',
            description: `Significant pitch deviation (${Math.round(deviation * 100)}% from baseline)`,
            confidence: Math.min(1, deviation),
            timestamp: pitch.timestamp,
            severity: deviation > 0.7 ? 'high' : 'medium'
          });
        }
      }
    }
  }
  
  // Analyze speech rate changes
  if (vocalData.speechRate && vocalData.speechRate.length > 0) {
    for (const rate of vocalData.speechRate) {
      const deviation = Math.abs(rate.wordsPerMinute - effectiveBaseline.avgSpeechRate!) / effectiveBaseline.avgSpeechRate!;
      
      if (deviation > 0.25) {
        stressMarkers.push({
          type: 'speech_rate',
          value: rate.wordsPerMinute,
          baseline: effectiveBaseline.avgSpeechRate!,
          deviation,
          timestamp: rate.timestamp,
          significance: Math.min(1, deviation * 2)
        });
        
        if (deviation > 0.4) {
          deceptionScore += 0.15;
          const direction = rate.wordsPerMinute > effectiveBaseline.avgSpeechRate! ? 'faster' : 'slower';
          indicators.push({
            type: 'vocal',
            indicator: `Speech ${direction}`,
            description: `Speaking ${Math.round(deviation * 100)}% ${direction} than normal`,
            confidence: Math.min(1, deviation * 1.5),
            timestamp: rate.timestamp,
            severity: 'medium'
          });
        }
      }
    }
  }
  
  // Analyze pauses
  if (vocalData.pauses && vocalData.pauses.length > 0) {
    const longPauses = vocalData.pauses.filter(p => p.duration > effectiveBaseline.avgPauseLength! * 2);
    
    if (longPauses.length > 0) {
      for (const pause of longPauses) {
        stressMarkers.push({
          type: 'pause_pattern',
          value: pause.duration,
          baseline: effectiveBaseline.avgPauseLength!,
          deviation: pause.duration / effectiveBaseline.avgPauseLength!,
          timestamp: pause.timestamp,
          significance: Math.min(1, pause.duration / 2000)
        });
      }
      
      deceptionScore += 0.15;
      indicators.push({
        type: 'vocal',
        indicator: 'Extended pauses',
        description: `${longPauses.length} unusually long pauses detected`,
        confidence: 0.6,
        severity: longPauses.length > 3 ? 'high' : 'medium'
      });
    }
  }
  
  // Analyze filler words
  if (vocalData.fillers && vocalData.fillers.length > 0) {
    const fillerRate = vocalData.fillers.length; // per segment
    
    if (fillerRate > 5) {
      deceptionScore += 0.1;
      indicators.push({
        type: 'vocal',
        indicator: 'Excessive fillers',
        description: `High frequency of filler words (${fillerRate})`,
        confidence: Math.min(1, fillerRate / 10),
        severity: fillerRate > 10 ? 'high' : 'medium'
      });
    }
  }
  
  const score = Math.min(1, deceptionScore);
  
  return { score, stressMarkers, indicators };
}

/**
 * Detect cross-modal contradictions
 */
export function detectCrossModalConflicts(
  facialScore: number,
  vocalScore: number,
  linguisticScore: number,
  facialIndicators: DeceptionIndicator[],
  vocalIndicators: DeceptionIndicator[],
  linguisticIndicators: DeceptionIndicator[]
): CrossModalConflict[] {
  const conflicts: CrossModalConflict[] = [];
  
  // Check facial vs vocal
  if (Math.abs(facialScore - vocalScore) > 0.4) {
    conflicts.push({
      modalities: ['facial', 'vocal'],
      description: 'Significant discrepancy between facial and vocal authenticity',
      severity: Math.abs(facialScore - vocalScore),
      interpretation: facialScore > vocalScore 
        ? 'Face shows more stress than voice - possible visual masking'
        : 'Voice shows more stress than face - possible vocal leakage'
    });
  }
  
  // Check facial vs linguistic
  if (Math.abs(facialScore - linguisticScore) > 0.4) {
    conflicts.push({
      modalities: ['facial', 'linguistic'],
      description: 'Mismatch between facial expressions and language patterns',
      severity: Math.abs(facialScore - linguisticScore),
      interpretation: 'Words and face are telling different stories'
    });
  }
  
  // Check vocal vs linguistic
  if (Math.abs(vocalScore - linguisticScore) > 0.4) {
    conflicts.push({
      modalities: ['vocal', 'linguistic'],
      description: 'Discrepancy between voice stress and language patterns',
      severity: Math.abs(vocalScore - linguisticScore),
      interpretation: 'How they sound doesn\'t match what they\'re saying'
    });
  }
  
  // All three high = high confidence deception
  if (facialScore > 0.6 && vocalScore > 0.6 && linguisticScore > 0.6) {
    conflicts.push({
      modalities: ['facial', 'vocal', 'linguistic'],
      description: 'All modalities show elevated deception indicators',
      severity: (facialScore + vocalScore + linguisticScore) / 3,
      interpretation: 'Strong cross-modal evidence of deception'
    });
  }
  
  return conflicts;
}

/**
 * Combine all analyses into comprehensive deception assessment
 */
export function performComprehensiveDeceptionAnalysis(
  text: string,
  facialData?: Parameters<typeof analyzeFacialDeception>[0],
  vocalData?: Parameters<typeof analyzeVocalDeception>[0]
): DeceptionAnalysisResult {
  // Perform individual analyses
  const linguisticResult = analyzeLinguisticDeception(text);
  
  const facialResult = facialData 
    ? analyzeFacialDeception(facialData)
    : { score: 0, microExpressions: [], indicators: [] };
  
  const vocalResult = vocalData
    ? analyzeVocalDeception(vocalData)
    : { score: 0, stressMarkers: [], indicators: [] };
  
  // Detect cross-modal conflicts
  const crossModalConflicts = detectCrossModalConflicts(
    facialResult.score,
    vocalResult.score,
    linguisticResult.score,
    facialResult.indicators,
    vocalResult.indicators,
    linguisticResult.indicators
  );
  
  // Calculate overall score (weighted average)
  const weights = {
    facial: facialData ? 0.35 : 0,
    vocal: vocalData ? 0.30 : 0,
    linguistic: 0.35,
    crossModal: crossModalConflicts.length > 0 ? 0.20 : 0
  };
  
  const totalWeight = weights.facial + weights.vocal + weights.linguistic + weights.crossModal;
  const normalizedWeights = {
    facial: weights.facial / totalWeight,
    vocal: weights.vocal / totalWeight,
    linguistic: weights.linguistic / totalWeight,
    crossModal: weights.crossModal / totalWeight
  };
  
  const crossModalScore = crossModalConflicts.length > 0
    ? crossModalConflicts.reduce((a, b) => a + b.severity, 0) / crossModalConflicts.length
    : 0;
  
  const overallScore = 
    facialResult.score * normalizedWeights.facial +
    vocalResult.score * normalizedWeights.vocal +
    linguisticResult.score * normalizedWeights.linguistic +
    crossModalScore * normalizedWeights.crossModal;
  
  // Determine likelihood category
  let likelihood: DeceptionAnalysisResult['likelihood'];
  if (overallScore < 0.2) likelihood = 'very_low';
  else if (overallScore < 0.4) likelihood = 'low';
  else if (overallScore < 0.6) likelihood = 'moderate';
  else if (overallScore < 0.8) likelihood = 'high';
  else likelihood = 'very_high';
  
  // Build timeline
  const timeline: DeceptionTimelineEvent[] = [];
  for (const indicator of [...facialResult.indicators, ...vocalResult.indicators]) {
    if (indicator.timestamp !== undefined) {
      timeline.push({
        timestamp: indicator.timestamp,
        score: indicator.confidence,
        modality: indicator.type,
        event: indicator.indicator
      });
    }
  }
  timeline.sort((a, b) => a.timestamp - b.timestamp);
  
  // Find peak deception moments
  const peakMoments = timeline
    .filter(e => e.score > 0.6)
    .slice(0, 5)
    .map(e => ({
      timestamp: e.timestamp,
      score: e.score,
      triggers: [e.event]
    }));
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (overallScore > 0.6) {
    recommendations.push('Exercise caution with claims made during this interaction');
    recommendations.push('Verify key statements through independent sources');
    recommendations.push('Note specific timestamps for potential deception review');
  }
  if (crossModalConflicts.length > 0) {
    recommendations.push('Cross-modal conflicts suggest incongruent communication');
  }
  if (linguisticResult.score > 0.5) {
    recommendations.push('Language patterns show markers consistent with fabrication');
  }
  
  // Calculate confidence
  const dataPointCount = 
    (facialData ? 1 : 0) + 
    (vocalData ? 1 : 0) + 
    (text.length > 50 ? 1 : 0);
  const confidence = Math.min(0.95, dataPointCount * 0.3 + 0.1);
  
  return {
    overallScore,
    likelihood,
    confidence,
    facialAnalysis: {
      authenticityScore: 1 - facialResult.score,
      microExpressions: facialResult.microExpressions,
      indicators: facialResult.indicators
    },
    vocalAnalysis: {
      authenticityScore: 1 - vocalResult.score,
      stressMarkers: vocalResult.stressMarkers,
      indicators: vocalResult.indicators
    },
    linguisticAnalysis: {
      authenticityScore: 1 - linguisticResult.score,
      markers: linguisticResult.markers,
      indicators: linguisticResult.indicators
    },
    crossModalConflicts,
    timeline,
    peakDeceptionMoments: peakMoments,
    recommendations
  };
}
