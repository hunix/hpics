/**
 * PEACE Model Compliance Scorer
 * 
 * Scores interviews against the UK College of Policing PEACE framework:
 * Planning & Preparation, Engage & Explain, Account, Closure, Evaluate.
 * 
 * Includes Cognitive Interview (CI) technique detection per Fisher & Geiselman.
 * 
 * @module peaceModelScorer
 */

// ============================================
// Types
// ============================================

export interface PEACEPhaseScore {
  score: number; // 0-10
  maxScore: 10;
  indicators: PhaseIndicator[];
  compliance: 'non_compliant' | 'partial' | 'compliant' | 'exemplary';
}

export interface PhaseIndicator {
  name: string;
  present: boolean;
  description: string;
}

export interface CognitiveInterviewTechniques {
  contextReinstatement: boolean;
  reportEverything: boolean;
  reverseOrder: boolean;
  changePerspective: boolean;
  score: number; // 0-4
}

export interface CoercionIndicator {
  type: 'leading_question' | 'accusatory' | 'minimization' | 'maximization' | 'false_evidence' | 'promise' | 'threat' | 'interruption';
  text: string;
  severity: number; // 0-1
  timestamp?: number;
}

export interface PEACEResult {
  planning: PEACEPhaseScore;
  engage: PEACEPhaseScore;
  account: PEACEPhaseScore;
  closure: PEACEPhaseScore;
  evaluate: PEACEPhaseScore;
  totalScore: number; // 0-50
  complianceLevel: 'non_compliant' | 'partial' | 'compliant' | 'exemplary';
  cognitiveInterview: CognitiveInterviewTechniques;
  coercionIndicators: CoercionIndicator[];
  rapportVsCoercionRatio: number; // 0-1, higher = more rapport-based
  openQuestionPercentage: number;
  recommendations: string[];
}

// ============================================
// Core Scoring
// ============================================

/**
 * Score an interview transcript against the PEACE model.
 * 
 * @param interviewerLines - Array of interviewer's statements/questions
 * @param subjectLines - Array of subject's responses
 * @param fullTranscript - Optional full transcript for context
 */
export function scorePEACE(
  interviewerLines: string[],
  subjectLines: string[],
  fullTranscript?: string
): PEACEResult {
  const transcript = fullTranscript || [...interviewerLines, ...subjectLines].join('\n');
  const interviewerText = interviewerLines.join(' ').toLowerCase();

  const planning = scorePlanning(interviewerLines, transcript);
  const engage = scoreEngage(interviewerLines, transcript);
  const account = scoreAccount(interviewerLines, subjectLines, transcript);
  const closure = scoreClosure(interviewerLines, transcript);
  const evaluate = scoreEvaluate(interviewerLines, subjectLines, transcript);

  const cognitiveInterview = detectCITechniques(interviewerLines);
  const coercionIndicators = detectCoercion(interviewerLines);
  const openQPct = calculateOpenQuestionPercentage(interviewerLines);

  const totalScore = planning.score + engage.score + account.score + closure.score + evaluate.score;
  const complianceLevel = totalScore >= 40 ? 'exemplary' : totalScore >= 30 ? 'compliant' : totalScore >= 20 ? 'partial' : 'non_compliant';

  // Rapport vs coercion: ratio of positive indicators to coercion
  const rapportIndicators = countRapportIndicators(interviewerText);
  const rapportVsCoercionRatio = rapportIndicators + coercionIndicators.length > 0
    ? rapportIndicators / (rapportIndicators + coercionIndicators.length)
    : 0.5;

  return {
    planning,
    engage,
    account,
    closure,
    evaluate,
    totalScore,
    complianceLevel,
    cognitiveInterview,
    coercionIndicators,
    rapportVsCoercionRatio,
    openQuestionPercentage: openQPct,
    recommendations: generatePEACERecommendations(planning, engage, account, closure, evaluate, coercionIndicators, openQPct, cognitiveInterview)
  };
}

// ============================================
// Phase Scorers
// ============================================

function scorePlanning(interviewerLines: string[], transcript: string): PEACEPhaseScore {
  const indicators: PhaseIndicator[] = [];
  const text = transcript.toLowerCase();

  // Check for evidence of preparation
  const objectivesClear = /\b(purpose of|reason (for|we're)|i'd like to (discuss|ask|talk)|today we will)\b/i.test(text);
  indicators.push({ name: 'Objectives stated', present: objectivesClear, description: 'Interviewer clearly stated interview objectives' });

  const evidenceReviewed = interviewerLines.some(l => /\b(based on|according to|evidence|information we have|report indicates)\b/i.test(l));
  indicators.push({ name: 'Evidence reviewed', present: evidenceReviewed, description: 'Evidence was referenced during questioning' });

  const structuredApproach = interviewerLines.length > 5; // Minimum structured length
  indicators.push({ name: 'Structured approach', present: structuredApproach, description: 'Interview shows structured progression' });

  const score = Math.min(10, (objectivesClear ? 4 : 0) + (evidenceReviewed ? 3 : 0) + (structuredApproach ? 3 : 0));
  return { score, maxScore: 10, indicators, compliance: score >= 8 ? 'exemplary' : score >= 6 ? 'compliant' : score >= 3 ? 'partial' : 'non_compliant' };
}

function scoreEngage(interviewerLines: string[], transcript: string): PEACEPhaseScore {
  const indicators: PhaseIndicator[] = [];
  const earlyLines = interviewerLines.slice(0, Math.min(5, interviewerLines.length)).join(' ').toLowerCase();

  const rapportBuilt = /\b(how are you|thank you for|comfortable|can i get you|before we begin)\b/i.test(earlyLines);
  indicators.push({ name: 'Rapport established', present: rapportBuilt, description: 'Rapport-building language in opening' });

  const processExplained = /\b(explain|outline|process|how this works|your rights|free to|solicitor|lawyer)\b/i.test(earlyLines);
  indicators.push({ name: 'Process explained', present: processExplained, description: 'Interview process was explained' });

  const groundRules = /\b(take your time|if you don't understand|feel free to|you can stop|don't guess|say if you're unsure)\b/i.test(earlyLines);
  indicators.push({ name: 'Ground rules set', present: groundRules, description: 'Ground rules communicated' });

  const score = Math.min(10, (rapportBuilt ? 4 : 0) + (processExplained ? 3 : 0) + (groundRules ? 3 : 0));
  return { score, maxScore: 10, indicators, compliance: score >= 8 ? 'exemplary' : score >= 6 ? 'compliant' : score >= 3 ? 'partial' : 'non_compliant' };
}

function scoreAccount(interviewerLines: string[], subjectLines: string[], transcript: string): PEACEPhaseScore {
  const indicators: PhaseIndicator[] = [];

  // Free recall phase
  const freeRecall = interviewerLines.some(l => /\b(tell me (everything|what happened|in your own words)|describe|walk me through|start from the beginning)\b/i.test(l));
  indicators.push({ name: 'Free recall used', present: freeRecall, description: 'Open free recall invitation given' });

  // Open vs closed questions
  const openQPct = calculateOpenQuestionPercentage(interviewerLines);
  indicators.push({ name: 'Open questions dominant', present: openQPct > 0.5, description: `${(openQPct * 100).toFixed(0)}% open questions` });

  // Leading question detection
  const leadingCount = interviewerLines.filter(l => isLeadingQuestion(l)).length;
  indicators.push({ name: 'Minimal leading questions', present: leadingCount < 3, description: `${leadingCount} leading questions detected` });

  // Subject speaking ratio
  const subjectWords = subjectLines.join(' ').split(/\s+/).length;
  const interviewerWords = interviewerLines.join(' ').split(/\s+/).length;
  const subjectRatio = subjectWords / Math.max(1, subjectWords + interviewerWords);
  indicators.push({ name: 'Subject speaking majority', present: subjectRatio > 0.6, description: `Subject spoke ${(subjectRatio * 100).toFixed(0)}% of words` });

  const score = Math.min(10, 
    (freeRecall ? 3 : 0) + 
    (openQPct > 0.5 ? 3 : openQPct > 0.3 ? 1 : 0) + 
    (leadingCount < 3 ? 2 : leadingCount < 6 ? 1 : 0) + 
    (subjectRatio > 0.6 ? 2 : subjectRatio > 0.4 ? 1 : 0)
  );
  return { score, maxScore: 10, indicators, compliance: score >= 8 ? 'exemplary' : score >= 6 ? 'compliant' : score >= 3 ? 'partial' : 'non_compliant' };
}

function scoreClosure(interviewerLines: string[], transcript: string): PEACEPhaseScore {
  const indicators: PhaseIndicator[] = [];
  const lastLines = interviewerLines.slice(-Math.min(5, interviewerLines.length)).join(' ').toLowerCase();

  const summaryProvided = /\b(to summarize|so what you're saying|let me recap|in summary)\b/i.test(lastLines);
  indicators.push({ name: 'Summary provided', present: summaryProvided, description: 'Interview summary given' });

  const questionsInvited = /\b(anything (else|you'd like)|questions for (me|us)|anything to add|is there anything)\b/i.test(lastLines);
  indicators.push({ name: 'Questions invited', present: questionsInvited, description: 'Subject invited to ask questions' });

  const nextSteps = /\b(what happens next|next steps|we'll be in touch|contact|follow.up)\b/i.test(lastLines);
  indicators.push({ name: 'Next steps explained', present: nextSteps, description: 'Next steps communicated' });

  const score = Math.min(10, (summaryProvided ? 4 : 0) + (questionsInvited ? 3 : 0) + (nextSteps ? 3 : 0));
  return { score, maxScore: 10, indicators, compliance: score >= 8 ? 'exemplary' : score >= 6 ? 'compliant' : score >= 3 ? 'partial' : 'non_compliant' };
}

function scoreEvaluate(interviewerLines: string[], subjectLines: string[], transcript: string): PEACEPhaseScore {
  const indicators: PhaseIndicator[] = [];

  // Objectives met — did interviewer cover key topics?
  const topicsCovered = new Set(interviewerLines.filter(l => l.includes('?')).map(l => l.split(/\s+/).slice(0, 3).join(' '))).size;
  indicators.push({ name: 'Multiple topics covered', present: topicsCovered > 5, description: `${topicsCovered} distinct topic areas addressed` });

  // New leads identified
  const followUpQuestions = interviewerLines.filter(l => /\b(you mentioned|earlier you said|tell me more about|can you elaborate)\b/i.test(l)).length;
  indicators.push({ name: 'Follow-up probing', present: followUpQuestions > 2, description: `${followUpQuestions} follow-up probes` });

  // Credibility assessment attempted
  const credibilityCheck = interviewerLines.some(l => /\b(how do you know|how can you be sure|what makes you think|is it possible)\b/i.test(l));
  indicators.push({ name: 'Credibility assessed', present: credibilityCheck, description: 'Credibility probing questions asked' });

  const score = Math.min(10, (topicsCovered > 5 ? 4 : topicsCovered > 3 ? 2 : 0) + (followUpQuestions > 2 ? 3 : followUpQuestions > 0 ? 1 : 0) + (credibilityCheck ? 3 : 0));
  return { score, maxScore: 10, indicators, compliance: score >= 8 ? 'exemplary' : score >= 6 ? 'compliant' : score >= 3 ? 'partial' : 'non_compliant' };
}

// ============================================
// Cognitive Interview Detection
// ============================================

function detectCITechniques(interviewerLines: string[]): CognitiveInterviewTechniques {
  const text = interviewerLines.join(' ').toLowerCase();

  const contextReinstatement = /\b(think back to|picture yourself|imagine you're back|close your eyes|remember the (scene|setting|environment))\b/i.test(text);
  const reportEverything = /\b(tell me everything|every detail|no matter how (small|insignificant)|even if it seems|don't leave anything out)\b/i.test(text);
  const reverseOrder = /\b(start from the end|work backwards|in reverse|from the last thing|end to beginning)\b/i.test(text);
  const changePerspective = /\b(from (his|her|their) perspective|if you were|what would .* have seen|from another angle|someone watching)\b/i.test(text);

  const score = [contextReinstatement, reportEverything, reverseOrder, changePerspective].filter(Boolean).length;

  return { contextReinstatement, reportEverything, reverseOrder, changePerspective, score };
}

// ============================================
// Coercion Detection
// ============================================

function detectCoercion(interviewerLines: string[]): CoercionIndicator[] {
  const indicators: CoercionIndicator[] = [];

  for (const line of interviewerLines) {
    const lower = line.toLowerCase();

    // Leading questions
    if (isLeadingQuestion(line)) {
      indicators.push({ type: 'leading_question', text: line.slice(0, 100), severity: 0.5 });
    }

    // Accusatory
    if (/\b(you did|you were there|we know you|admit it|stop lying|tell the truth)\b/i.test(lower)) {
      indicators.push({ type: 'accusatory', text: line.slice(0, 100), severity: 0.8 });
    }

    // Minimization
    if (/\b(it's not a big deal|anyone would|understandable|we just need|help us help you)\b/i.test(lower)) {
      indicators.push({ type: 'minimization', text: line.slice(0, 100), severity: 0.6 });
    }

    // Maximization
    if (/\b(this is very serious|you could face|prison|charges|punish|consequences)\b/i.test(lower)) {
      indicators.push({ type: 'maximization', text: line.slice(0, 100), severity: 0.7 });
    }

    // False evidence ploy
    if (/\b(we have (evidence|proof|witnesses)|someone saw you|your (dna|fingerprints|phone) was)\b/i.test(lower)) {
      indicators.push({ type: 'false_evidence', text: line.slice(0, 100), severity: 0.9 });
    }

    // Promise
    if (/\b(if you (tell|cooperate)|things will go (better|easier)|i can help if)\b/i.test(lower)) {
      indicators.push({ type: 'promise', text: line.slice(0, 100), severity: 0.7 });
    }
  }

  return indicators;
}

// ============================================
// Helpers
// ============================================

function isLeadingQuestion(line: string): boolean {
  return /\b(isn't it|didn't you|wasn't it|weren't you|don't you think|you did .+, right|correct\?|isn't that so)\b/i.test(line);
}

function calculateOpenQuestionPercentage(lines: string[]): number {
  const questions = lines.filter(l => l.trim().endsWith('?'));
  if (questions.length === 0) return 0;

  const openPatterns = /^(what|how|why|tell|describe|explain|where|when|who|which|could you|can you tell|would you)\b/i;
  const openCount = questions.filter(q => openPatterns.test(q.trim())).length;

  return openCount / questions.length;
}

function countRapportIndicators(text: string): number {
  const patterns = /\b(thank you|i understand|i appreciate|take your time|that must have been|i can see|it's okay|no rush)\b/gi;
  return (text.match(patterns) || []).length;
}

function generatePEACERecommendations(
  planning: PEACEPhaseScore,
  engage: PEACEPhaseScore,
  account: PEACEPhaseScore,
  closure: PEACEPhaseScore,
  evaluate: PEACEPhaseScore,
  coercion: CoercionIndicator[],
  openQPct: number,
  ci: CognitiveInterviewTechniques
): string[] {
  const recs: string[] = [];

  if (planning.score < 6) recs.push('Improve interview planning — state clear objectives and review evidence before starting.');
  if (engage.score < 6) recs.push('Build rapport before questioning — explain the process and set ground rules.');
  if (account.score < 6) recs.push('Use free recall before specific questions — let the subject tell their story first.');
  if (closure.score < 6) recs.push('Provide proper closure — summarize, invite questions, explain next steps.');
  if (evaluate.score < 6) recs.push('Conduct post-interview evaluation — assess credibility and identify new leads.');

  if (coercion.length > 3) {
    recs.push(`WARNING: ${coercion.length} coercion indicators detected — this may compromise interview validity and admissibility.`);
  }

  if (openQPct < 0.5) {
    recs.push(`Only ${(openQPct * 100).toFixed(0)}% open questions — increase use of "tell me", "describe", "explain" prompts.`);
  }

  if (ci.score < 2) {
    recs.push('Consider using Cognitive Interview techniques: context reinstatement, report everything, reverse order, change perspective.');
  }

  return recs;
}
