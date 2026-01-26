/**
 * Interviewer Bias Detector (v9.0)
 * 
 * Source: Applied Cognitive Psychology (Jan 2025)
 * 
 * Analyze interview transcripts for manipulative techniques,
 * leading questions, and coercive patterns.
 */

export interface TranscriptSegment {
  speaker: 'interviewer' | 'subject';
  text: string;
  timestamp: number;
  duration: number;
  tone?: 'neutral' | 'aggressive' | 'sympathetic' | 'accusatory';
  pauseAfter?: number;
}

export interface BiasIndicator {
  type: BiasType;
  severity: 'low' | 'medium' | 'high' | 'severe';
  location: { start: number; end: number };
  text: string;
  explanation: string;
  suggestedAlternative?: string;
}

export type BiasType = 
  | 'leading_question'
  | 'suggestive_framing'
  | 'presumptive_question'
  | 'repeated_questioning'
  | 'confirmation_bias'
  | 'minimization'
  | 'maximization'
  | 'false_evidence'
  | 'emotional_manipulation'
  | 'time_pressure'
  | 'isolation_threat'
  | 'rapport_exploitation';

export interface InterviewAnalysis {
  overallBiasScore: number;
  coercionScore: number;
  suggestibilityRisk: number;
  indicators: BiasIndicator[];
  patterns: InterviewPattern[];
  recommendations: string[];
  reliabilityEstimate: number;
}

export interface InterviewPattern {
  name: string;
  occurrences: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

// Leading question patterns
const LEADING_PATTERNS = [
  { regex: /didn't you/i, explanation: 'Tag question implies expected answer' },
  { regex: /isn't it true that/i, explanation: 'Presumptive assertion as question' },
  { regex: /you must have/i, explanation: 'Implies certainty about subject\'s actions' },
  { regex: /everyone knows/i, explanation: 'False consensus framing' },
  { regex: /obviously|clearly|surely/i, explanation: 'Presumptive adverb suggests predetermined conclusion' },
  { regex: /you would agree that/i, explanation: 'Assumes agreement before asking' },
  { regex: /so what you're saying is/i, explanation: 'Reframing subject\'s words' },
  { regex: /why did you/i, explanation: 'Presupposes action occurred' },
];

// Coercive patterns
const COERCIVE_PATTERNS = [
  { regex: /if you don't cooperate/i, explanation: 'Threat of consequences' },
  { regex: /things will go easier/i, explanation: 'Implicit promise of leniency' },
  { regex: /we already know/i, explanation: 'Bluff about evidence' },
  { regex: /your friend already told us/i, explanation: 'Possible false evidence ploy' },
  { regex: /just admit/i, explanation: 'Pressure to confess' },
  { regex: /you're only making this harder/i, explanation: 'Blame shifting' },
  { regex: /be honest with me/i, explanation: 'Implies dishonesty, pressure tactic' },
];

// Emotional manipulation patterns
const EMOTIONAL_PATTERNS = [
  { regex: /think about your family/i, explanation: 'Emotional leverage' },
  { regex: /how would.*feel/i, explanation: 'Guilt induction' },
  { regex: /I'm trying to help you/i, explanation: 'False ally positioning' },
  { regex: /you seem like a good person/i, explanation: 'Flattery manipulation' },
  { regex: /I understand.*but/i, explanation: 'False empathy before pressure' },
];

/**
 * Analyze interview transcript for bias and manipulation
 */
export function analyzeInterview(
  segments: TranscriptSegment[]
): InterviewAnalysis {
  const indicators: BiasIndicator[] = [];
  const patterns: InterviewPattern[] = [];
  
  let totalBiasScore = 0;
  let coercionScore = 0;
  const questionCounts = new Map<string, number>();
  
  const interviewerSegments = segments.filter(s => s.speaker === 'interviewer');
  
  for (let i = 0; i < interviewerSegments.length; i++) {
    const segment = interviewerSegments[i];
    const segmentIndicators = analyzeSegment(segment, i);
    indicators.push(...segmentIndicators);
    
    // Track repeated questions
    const normalizedText = segment.text.toLowerCase().replace(/[?.,!]/g, '').trim();
    questionCounts.set(normalizedText, (questionCounts.get(normalizedText) || 0) + 1);
    
    // Accumulate scores
    for (const indicator of segmentIndicators) {
      const severityScore = { low: 0.1, medium: 0.3, high: 0.6, severe: 1.0 };
      totalBiasScore += severityScore[indicator.severity];
      
      if (['false_evidence', 'isolation_threat', 'time_pressure', 'minimization', 'maximization']
          .includes(indicator.type)) {
        coercionScore += severityScore[indicator.severity];
      }
    }
  }
  
  // Detect repeated questioning pattern
  const repeatedQuestions = Array.from(questionCounts.entries())
    .filter(([_, count]) => count >= 3);
  
  if (repeatedQuestions.length > 0) {
    patterns.push({
      name: 'Repeated Questioning',
      occurrences: repeatedQuestions.reduce((sum, [_, count]) => sum + count, 0),
      description: 'Same or similar questions asked multiple times',
      impact: repeatedQuestions.some(([_, count]) => count >= 5) ? 'high' : 'medium',
    });
    
    for (const [question, count] of repeatedQuestions) {
      indicators.push({
        type: 'repeated_questioning',
        severity: count >= 5 ? 'high' : 'medium',
        location: { start: 0, end: 0 },
        text: question,
        explanation: `Question asked ${count} times - can contaminate memory and create false certainty`,
      });
    }
  }
  
  // Analyze questioning flow
  const flowPatterns = analyzeQuestioningFlow(segments);
  patterns.push(...flowPatterns);
  
  // Normalize scores
  const normalizedBias = Math.min(1, totalBiasScore / Math.max(interviewerSegments.length, 1));
  const normalizedCoercion = Math.min(1, coercionScore / Math.max(interviewerSegments.length, 1));
  
  // Estimate reliability based on bias indicators
  const reliabilityEstimate = Math.max(0, 1 - normalizedBias * 0.5 - normalizedCoercion * 0.3);
  
  // Calculate suggestibility risk
  const leadingCount = indicators.filter(i => 
    ['leading_question', 'suggestive_framing', 'presumptive_question'].includes(i.type)
  ).length;
  const suggestibilityRisk = Math.min(1, leadingCount * 0.1);
  
  // Generate recommendations
  const recommendations = generateRecommendations(indicators, patterns);
  
  return {
    overallBiasScore: normalizedBias,
    coercionScore: normalizedCoercion,
    suggestibilityRisk,
    indicators,
    patterns,
    recommendations,
    reliabilityEstimate,
  };
}

function analyzeSegment(
  segment: TranscriptSegment,
  index: number
): BiasIndicator[] {
  const indicators: BiasIndicator[] = [];
  const text = segment.text;
  
  // Check leading patterns
  for (const pattern of LEADING_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      indicators.push({
        type: 'leading_question',
        severity: 'medium',
        location: { start: match.index || 0, end: (match.index || 0) + match[0].length },
        text: match[0],
        explanation: pattern.explanation,
        suggestedAlternative: generateOpenAlternative(text),
      });
    }
  }
  
  // Check coercive patterns
  for (const pattern of COERCIVE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      indicators.push({
        type: 'false_evidence',
        severity: 'high',
        location: { start: match.index || 0, end: (match.index || 0) + match[0].length },
        text: match[0],
        explanation: pattern.explanation,
      });
    }
  }
  
  // Check emotional manipulation
  for (const pattern of EMOTIONAL_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      indicators.push({
        type: 'emotional_manipulation',
        severity: 'medium',
        location: { start: match.index || 0, end: (match.index || 0) + match[0].length },
        text: match[0],
        explanation: pattern.explanation,
      });
    }
  }
  
  // Check for minimization ("it's not a big deal", "just a small thing")
  if (/not a big deal|just a small|minor issue|no one will know/i.test(text)) {
    indicators.push({
      type: 'minimization',
      severity: 'high',
      location: { start: 0, end: text.length },
      text: text,
      explanation: 'Minimization reduces perceived consequences to encourage disclosure',
    });
  }
  
  // Check for maximization ("this is very serious", "you could face...")
  if (/very serious|maximum penalty|worst case|you could face/i.test(text)) {
    indicators.push({
      type: 'maximization',
      severity: 'high',
      location: { start: 0, end: text.length },
      text: text,
      explanation: 'Maximization exaggerates consequences to induce fear',
    });
  }
  
  // Check for time pressure
  if (/right now|immediately|last chance|running out of time/i.test(text)) {
    indicators.push({
      type: 'time_pressure',
      severity: 'medium',
      location: { start: 0, end: text.length },
      text: text,
      explanation: 'Time pressure reduces deliberation and increases compliance',
    });
  }
  
  // Analyze tone
  if (segment.tone === 'aggressive' || segment.tone === 'accusatory') {
    indicators.push({
      type: 'emotional_manipulation',
      severity: 'medium',
      location: { start: 0, end: text.length },
      text: `[${segment.tone} tone]`,
      explanation: 'Aggressive/accusatory tone can intimidate and contaminate responses',
    });
  }
  
  return indicators;
}

function analyzeQuestioningFlow(segments: TranscriptSegment[]): InterviewPattern[] {
  const patterns: InterviewPattern[] = [];
  
  // Calculate talk-time ratio
  const interviewerTime = segments
    .filter(s => s.speaker === 'interviewer')
    .reduce((sum, s) => sum + s.duration, 0);
  const subjectTime = segments
    .filter(s => s.speaker === 'subject')
    .reduce((sum, s) => sum + s.duration, 0);
  
  if (interviewerTime > subjectTime * 2) {
    patterns.push({
      name: 'Interviewer Dominance',
      occurrences: 1,
      description: 'Interviewer speaks more than twice as much as subject',
      impact: 'medium',
    });
  }
  
  // Check for rapid-fire questioning
  let rapidFireSequences = 0;
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].speaker === 'interviewer' && 
        segments[i - 1].speaker === 'interviewer' &&
        (segments[i - 1].pauseAfter || 0) < 1000) {
      rapidFireSequences++;
    }
  }
  
  if (rapidFireSequences > 3) {
    patterns.push({
      name: 'Rapid-Fire Questioning',
      occurrences: rapidFireSequences,
      description: 'Multiple questions without waiting for complete answers',
      impact: 'high',
    });
  }
  
  // Check for confirmation seeking (only asking closed questions after initial open ones)
  const interviewerSegments = segments.filter(s => s.speaker === 'interviewer');
  const closedQuestionCount = interviewerSegments.filter(s => 
    /^(did|was|were|is|are|do|does|have|has|can|could|would|should)\s/i.test(s.text.trim())
  ).length;
  
  const closedRatio = closedQuestionCount / Math.max(interviewerSegments.length, 1);
  if (closedRatio > 0.7) {
    patterns.push({
      name: 'Closed Question Dominance',
      occurrences: closedQuestionCount,
      description: 'Over 70% closed questions limit free recall',
      impact: 'high',
    });
  }
  
  return patterns;
}

function generateOpenAlternative(leadingQuestion: string): string {
  // Simple transformation suggestions
  if (/didn't you/i.test(leadingQuestion)) {
    return 'What happened regarding...?';
  }
  if (/isn't it true/i.test(leadingQuestion)) {
    return 'Can you tell me about...?';
  }
  if (/why did you/i.test(leadingQuestion)) {
    return 'What can you tell me about that situation?';
  }
  if (/you must have/i.test(leadingQuestion)) {
    return 'What do you remember about...?';
  }
  return 'Tell me more about that.';
}

function generateRecommendations(
  indicators: BiasIndicator[],
  patterns: InterviewPattern[]
): string[] {
  const recommendations: string[] = [];
  
  const leadingCount = indicators.filter(i => i.type === 'leading_question').length;
  if (leadingCount > 3) {
    recommendations.push('Replace leading questions with open-ended prompts (who, what, when, where, how)');
  }
  
  const coerciveIndicators = indicators.filter(i => 
    ['false_evidence', 'minimization', 'maximization', 'time_pressure'].includes(i.type)
  );
  if (coerciveIndicators.length > 0) {
    recommendations.push('Remove coercive elements - they produce unreliable information');
    recommendations.push('Consider whether statements obtained are legally admissible');
  }
  
  if (indicators.some(i => i.type === 'repeated_questioning')) {
    recommendations.push('Avoid repeating questions - repetition implies the answer was wrong');
  }
  
  if (patterns.some(p => p.name === 'Interviewer Dominance')) {
    recommendations.push('Allow more time for subject to speak freely');
    recommendations.push('Use active listening and minimal encouragers');
  }
  
  if (patterns.some(p => p.name === 'Closed Question Dominance')) {
    recommendations.push('Use the cognitive interview technique with free recall phases');
    recommendations.push('Start with "Tell me everything you remember about..."');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Interview techniques appear within acceptable bounds');
  }
  
  return recommendations;
}

/**
 * Score interview reliability for legal/evidentiary purposes
 */
export function scoreInterviewReliability(
  analysis: InterviewAnalysis
): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  admissibilityRisk: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
} {
  const issues: string[] = [];
  
  // Count severe issues
  const severeIndicators = analysis.indicators.filter(i => 
    i.severity === 'severe' || i.severity === 'high'
  );
  
  if (severeIndicators.length > 0) {
    issues.push(`${severeIndicators.length} high/severe bias indicators detected`);
  }
  
  if (analysis.coercionScore > 0.3) {
    issues.push('Significant coercive elements present');
  }
  
  if (analysis.suggestibilityRisk > 0.5) {
    issues.push('High suggestibility contamination risk');
  }
  
  // Calculate final score
  const score = Math.max(0, analysis.reliabilityEstimate - (severeIndicators.length * 0.1));
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 0.9) grade = 'A';
  else if (score >= 0.75) grade = 'B';
  else if (score >= 0.6) grade = 'C';
  else if (score >= 0.4) grade = 'D';
  else grade = 'F';
  
  let admissibilityRisk: 'low' | 'medium' | 'high' | 'critical';
  if (analysis.coercionScore > 0.5) admissibilityRisk = 'critical';
  else if (analysis.coercionScore > 0.3 || severeIndicators.length > 3) admissibilityRisk = 'high';
  else if (analysis.overallBiasScore > 0.4) admissibilityRisk = 'medium';
  else admissibilityRisk = 'low';
  
  return { score, grade, admissibilityRisk, issues };
}

/**
 * Detect dark nudge patterns in communications
 */
export function detectDarkNudges(
  content: string
): Array<{
  type: string;
  severity: 'low' | 'medium' | 'high';
  text: string;
  explanation: string;
}> {
  const nudges: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    text: string;
    explanation: string;
  }> = [];
  
  // Scarcity illusions
  if (/only \d+ left|limited time|ending soon|last chance/i.test(content)) {
    nudges.push({
      type: 'scarcity_illusion',
      severity: 'medium',
      text: content.match(/only \d+ left|limited time|ending soon|last chance/i)?.[0] || '',
      explanation: 'Creates artificial urgency to pressure decision-making',
    });
  }
  
  // Social proof fabrication
  if (/\d+,?\d* people (are|have)|trending|popular choice|best seller/i.test(content)) {
    nudges.push({
      type: 'social_proof',
      severity: 'low',
      text: content.match(/\d+,?\d* people (are|have)|trending|popular choice|best seller/i)?.[0] || '',
      explanation: 'May be fabricated social proof to influence choice',
    });
  }
  
  // Confirmshaming
  if (/no thanks|i don't want|i'll pass on/i.test(content) && 
      /saving|missing|opportunity/i.test(content)) {
    nudges.push({
      type: 'confirmshaming',
      severity: 'medium',
      text: content,
      explanation: 'Guilt-inducing opt-out language',
    });
  }
  
  // Hidden costs / drip pricing
  if (/plus|additional|processing|service fee|handling/i.test(content)) {
    nudges.push({
      type: 'drip_pricing',
      severity: 'medium',
      text: content.match(/plus|additional|processing|service fee|handling/i)?.[0] || '',
      explanation: 'Potential hidden cost introduction',
    });
  }
  
  // Forced continuity
  if (/auto-renew|automatically|unless you cancel/i.test(content)) {
    nudges.push({
      type: 'forced_continuity',
      severity: 'high',
      text: content.match(/auto-renew|automatically|unless you cancel/i)?.[0] || '',
      explanation: 'Automatic continuation without explicit consent',
    });
  }
  
  return nudges;
}
