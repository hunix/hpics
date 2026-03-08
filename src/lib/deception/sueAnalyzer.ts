/**
 * Strategic Use of Evidence (SUE) Analyzer
 * 
 * Implements the SUE framework (Granhag & Hartwig 2015; Jang et al. 2025)
 * for analyzing evidence disclosure timing and statement-evidence consistency.
 * 
 * @module sueAnalyzer
 */

// ============================================
// Types
// ============================================

export interface EvidenceItem {
  id: string;
  description: string;
  category: 'physical' | 'digital' | 'testimonial' | 'documentary' | 'circumstantial';
  strength: number; // 0-1
  disclosed: boolean;
  disclosurePhase: 'withheld' | 'early' | 'strategic' | 'late';
  disclosureTimestamp?: number;
}

export interface StatementEvidencePair {
  evidenceId: string;
  statementBefore: string;
  statementAfter: string;
  consistency: 'consistent' | 'inconsistent' | 'evasive' | 'withholding';
  consistencyScore: number; // 0-1
  behavioralShift: BehavioralShift | null;
}

export interface BehavioralShift {
  type: 'denial_to_admission' | 'detail_change' | 'evasion_increase' | 'emotional_shift' | 'narrative_restructure';
  magnitude: number; // 0-1
  description: string;
}

export interface CounterInterrogationIndicator {
  type: 'information_probing' | 'evidence_fishing' | 'strategic_disclosure' | 'answer_mirroring' | 'topic_deflection';
  description: string;
  confidence: number;
  timestamp?: number;
}

export interface SUEAnalysisResult {
  evidenceItems: EvidenceItem[];
  statementEvidencePairs: StatementEvidencePair[];
  overallConsistencyScore: number;
  counterInterrogationIndicators: CounterInterrogationIndicator[];
  optimalDisclosureSequence: DisclosureRecommendation[];
  overallDeceptionIndicator: number;
  strategyEffectiveness: number;
  recommendations: string[];
}

export interface DisclosureRecommendation {
  evidenceId: string;
  recommendedPhase: 'early' | 'strategic' | 'late';
  rationale: string;
  expectedImpact: number; // 0-1
}

// ============================================
// Core Analysis
// ============================================

/**
 * Analyze an interview using the SUE framework.
 * Evaluates how evidence was used and statement-evidence consistency.
 */
export function analyzeSUE(
  statements: string[],
  evidence: EvidenceItem[],
  interviewTranscript?: string
): SUEAnalysisResult {
  // Analyze statement-evidence pairs
  const pairs = evidence.map(ev => analyzeStatementEvidencePair(ev, statements));
  
  // Calculate overall consistency
  const consistencyScores = pairs.map(p => p.consistencyScore);
  const overallConsistency = consistencyScores.length > 0
    ? consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length
    : 0.5;

  // Detect counter-interrogation strategies
  const counterIndicators = detectCounterInterrogation(statements, interviewTranscript);

  // Generate optimal disclosure sequence
  const disclosureSequence = generateOptimalDisclosure(evidence, pairs);

  // Calculate deception indicator
  const inconsistentCount = pairs.filter(p => p.consistency === 'inconsistent').length;
  const evasiveCount = pairs.filter(p => p.consistency === 'evasive').length;
  const deceptionIndicator = Math.min(1, 
    (inconsistentCount * 0.3 + evasiveCount * 0.15 + counterIndicators.length * 0.1) / 
    Math.max(1, evidence.length)
  );

  // Strategy effectiveness
  const strategicCount = evidence.filter(e => e.disclosurePhase === 'strategic').length;
  const strategyEffectiveness = evidence.length > 0 
    ? strategicCount / evidence.length * (1 - overallConsistency) 
    : 0;

  return {
    evidenceItems: evidence,
    statementEvidencePairs: pairs,
    overallConsistencyScore: overallConsistency,
    counterInterrogationIndicators: counterIndicators,
    optimalDisclosureSequence: disclosureSequence,
    overallDeceptionIndicator: deceptionIndicator,
    strategyEffectiveness,
    recommendations: generateSUERecommendations(pairs, counterIndicators, deceptionIndicator)
  };
}

// ============================================
// Helpers
// ============================================

function analyzeStatementEvidencePair(
  evidence: EvidenceItem,
  statements: string[]
): StatementEvidencePair {
  // Find statements that reference or relate to this evidence
  const relevantStatements = statements.filter(s => {
    const keywords = evidence.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return keywords.some(kw => s.toLowerCase().includes(kw));
  });

  const beforeDisclosure = relevantStatements[0] || '';
  const afterDisclosure = relevantStatements.length > 1 ? relevantStatements[relevantStatements.length - 1] : '';

  // Analyze consistency
  let consistency: StatementEvidencePair['consistency'] = 'consistent';
  let consistencyScore = 0.8;
  let behavioralShift: BehavioralShift | null = null;

  if (relevantStatements.length === 0) {
    consistency = 'withholding';
    consistencyScore = 0.3;
  } else if (beforeDisclosure && afterDisclosure && beforeDisclosure !== afterDisclosure) {
    // Check for narrative changes
    const beforeWords = new Set(beforeDisclosure.toLowerCase().split(/\s+/));
    const afterWords = new Set(afterDisclosure.toLowerCase().split(/\s+/));
    const overlap = [...beforeWords].filter(w => afterWords.has(w)).length;
    const similarity = overlap / Math.max(beforeWords.size, afterWords.size);

    if (similarity < 0.3) {
      consistency = 'inconsistent';
      consistencyScore = 0.2;
      behavioralShift = {
        type: 'narrative_restructure',
        magnitude: 1 - similarity,
        description: 'Significant narrative change after evidence disclosure'
      };
    } else if (similarity < 0.6) {
      consistency = 'evasive';
      consistencyScore = 0.5;
      behavioralShift = {
        type: 'detail_change',
        magnitude: 1 - similarity,
        description: 'Moderate detail changes detected'
      };
    }
  }

  // Check for evasion markers
  const evasionPatterns = /\b(I don't recall|can't remember|not sure|it's possible|I think maybe)\b/gi;
  const evasionCount = (relevantStatements.join(' ').match(evasionPatterns) || []).length;
  if (evasionCount > 2 && consistency === 'consistent') {
    consistency = 'evasive';
    consistencyScore = Math.min(consistencyScore, 0.4);
  }

  return {
    evidenceId: evidence.id,
    statementBefore: beforeDisclosure,
    statementAfter: afterDisclosure,
    consistency,
    consistencyScore,
    behavioralShift
  };
}

function detectCounterInterrogation(
  statements: string[],
  transcript?: string
): CounterInterrogationIndicator[] {
  const indicators: CounterInterrogationIndicator[] = [];
  const text = (transcript || statements.join(' ')).toLowerCase();

  // Information probing — subject asks questions about evidence
  const probingPatterns = /\b(what (do you|evidence)|how did you (find|know)|who told you|what makes you think)\b/gi;
  const probingMatches = text.match(probingPatterns) || [];
  if (probingMatches.length > 0) {
    indicators.push({
      type: 'information_probing',
      description: `Subject probed for evidence information ${probingMatches.length} times`,
      confidence: Math.min(1, probingMatches.length * 0.3)
    });
  }

  // Topic deflection
  const deflectionPatterns = /\b(that's not (the point|relevant)|let me explain something else|you should know that|more importantly)\b/gi;
  const deflectionMatches = text.match(deflectionPatterns) || [];
  if (deflectionMatches.length > 0) {
    indicators.push({
      type: 'topic_deflection',
      description: `Detected ${deflectionMatches.length} topic deflection attempts`,
      confidence: Math.min(1, deflectionMatches.length * 0.25)
    });
  }

  // Answer mirroring — reflecting questions back
  const mirrorPatterns = /\b(what do you mean|could you clarify|define what you mean|in what sense)\b/gi;
  const mirrorMatches = text.match(mirrorPatterns) || [];
  if (mirrorMatches.length > 2) {
    indicators.push({
      type: 'answer_mirroring',
      description: `Excessive question mirroring detected (${mirrorMatches.length} instances)`,
      confidence: Math.min(1, mirrorMatches.length * 0.2)
    });
  }

  return indicators;
}

function generateOptimalDisclosure(
  evidence: EvidenceItem[],
  pairs: StatementEvidencePair[]
): DisclosureRecommendation[] {
  return evidence
    .sort((a, b) => a.strength - b.strength)
    .map((ev, index, arr) => {
      const pair = pairs.find(p => p.evidenceId === ev.id);
      const position = index / Math.max(1, arr.length - 1);

      let recommendedPhase: DisclosureRecommendation['recommendedPhase'];
      let rationale: string;

      if (ev.strength < 0.3) {
        recommendedPhase = 'early';
        rationale = 'Weak evidence — use early to establish baseline and observe initial reactions';
      } else if (ev.strength > 0.7 || pair?.consistency === 'inconsistent') {
        recommendedPhase = 'late';
        rationale = 'Strong evidence — withhold for maximum impact after gathering free narrative';
      } else {
        recommendedPhase = 'strategic';
        rationale = 'Medium-strength evidence — disclose strategically to test consistency';
      }

      return {
        evidenceId: ev.id,
        recommendedPhase,
        rationale,
        expectedImpact: ev.strength * (pair?.consistency === 'inconsistent' ? 1.5 : 1)
      };
    });
}

function generateSUERecommendations(
  pairs: StatementEvidencePair[],
  counterIndicators: CounterInterrogationIndicator[],
  deceptionIndicator: number
): string[] {
  const recs: string[] = [];

  const inconsistent = pairs.filter(p => p.consistency === 'inconsistent');
  if (inconsistent.length > 0) {
    recs.push(`${inconsistent.length} statement-evidence inconsistencies detected — conduct targeted follow-up on these specific points`);
  }

  const evasive = pairs.filter(p => p.consistency === 'evasive');
  if (evasive.length > 0) {
    recs.push(`${evasive.length} evasive responses detected — use open-ended questions to probe these areas`);
  }

  if (counterIndicators.length > 0) {
    recs.push(`Counter-interrogation behavior detected (${counterIndicators.map(c => c.type).join(', ')}) — maintain information control`);
  }

  if (deceptionIndicator > 0.7) {
    recs.push('High deception probability — consider introducing strongest evidence last for maximum cognitive load');
  } else if (deceptionIndicator > 0.4) {
    recs.push('Moderate deception indicators — continue strategic evidence disclosure and monitor behavioral shifts');
  }

  const withheld = pairs.filter(p => p.consistency === 'withholding');
  if (withheld.length > 0) {
    recs.push(`Subject avoided addressing ${withheld.length} evidence items — direct questioning recommended`);
  }

  return recs;
}
