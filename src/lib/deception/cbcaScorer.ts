/**
 * Criteria-Based Content Analysis (CBCA) & Reality Monitoring (RM) Scorer
 * 
 * Implements the structured credibility assessment framework per
 * Steller & Köhnken (1989), with SVA Validity Checklist.
 * 
 * @module cbcaScorer
 */

// ============================================
// Types
// ============================================

export interface CBCACriteria {
  /** 1. Logical structure */
  logicalStructure: CriterionScore;
  /** 2. Unstructured production */
  unstructuredProduction: CriterionScore;
  /** 3. Quantity of details */
  quantityOfDetails: CriterionScore;
  /** 4. Contextual embedding */
  contextualEmbedding: CriterionScore;
  /** 5. Descriptions of interactions */
  interactions: CriterionScore;
  /** 6. Reproduction of conversation */
  reproductionOfConversation: CriterionScore;
  /** 7. Unexpected complications during the incident */
  unexpectedComplications: CriterionScore;
  /** 8. Unusual details */
  unusualDetails: CriterionScore;
  /** 9. Superfluous details */
  superfluousDetails: CriterionScore;
  /** 10. Accurately reported details misunderstood */
  misunderstoodDetails: CriterionScore;
  /** 11. Related external associations */
  relatedExternalAssociations: CriterionScore;
  /** 12. Accounts of subjective mental state */
  subjectiveMentalState: CriterionScore;
  /** 13. Attribution of perpetrator's mental state */
  perpetratorMentalState: CriterionScore;
  /** 14. Spontaneous corrections */
  spontaneousCorrections: CriterionScore;
  /** 15. Admitting lack of memory */
  admittingLackOfMemory: CriterionScore;
  /** 16. Raising doubts about own testimony */
  raisingDoubts: CriterionScore;
  /** 17. Self-deprecation */
  selfDeprecation: CriterionScore;
  /** 18. Pardoning the perpetrator */
  pardoningPerpetrator: CriterionScore;
  /** 19. Details characteristic of the offense */
  detailsCharacteristic: CriterionScore;
}

export interface CriterionScore {
  score: 0 | 1 | 2; // 0 = absent, 1 = present, 2 = strongly present
  evidence: string[];
  confidence: number;
}

export interface RealityMonitoringCriteria {
  perceptualInformation: CriterionScore;
  spatialInformation: CriterionScore;
  temporalInformation: CriterionScore;
  affectiveInformation: CriterionScore;
  reconstructability: CriterionScore;
  realism: CriterionScore;
  cognitiveOperations: CriterionScore;
  selfReference: CriterionScore;
}

export interface ValidityChecklist {
  linguisticAbility: boolean;
  appropriateAffect: boolean;
  suggestibility: boolean;
  motiveToReport: boolean;
  contextOfDisclosure: boolean;
  pressureToReport: boolean;
  investigationQuality: boolean;
  consistencyWithLaws: boolean;
  consistencyWithOtherStatements: boolean;
  consistencyWithEvidence: boolean;
  overallValidity: number;
}

export interface CBCAResult {
  cbca: CBCACriteria;
  cbcaTotal: number;
  cbcaMaxPossible: 38;
  credibilityLevel: 'low' | 'medium' | 'high';
  rm: RealityMonitoringCriteria;
  rmTotal: number;
  rmMemoryType: 'experienced' | 'fabricated' | 'uncertain';
  validity: ValidityChecklist;
  compositeCredibility: number;
  confidenceInterval: [number, number];
  recommendations: string[];
}

// ============================================
// Core Scoring
// ============================================

/**
 * Score a statement using CBCA, RM, and Validity Checklist
 */
export function scoreCBCA(statement: string): CBCAResult {
  const cbca = analyzeCBCACriteria(statement);
  const rm = analyzeRealityMonitoring(statement);
  const validity = assessValidity(statement);

  const cbcaTotal = sumCBCA(cbca);
  const rmTotal = sumRM(rm);

  const credibilityLevel = cbcaTotal >= 26 ? 'high' : cbcaTotal >= 16 ? 'medium' : 'low';
  const rmMemoryType = rmTotal >= 12 ? 'experienced' : rmTotal >= 7 ? 'uncertain' : 'fabricated';

  // Composite: weighted combination of CBCA (60%), RM (30%), Validity (10%)
  const cbcaNormalized = cbcaTotal / 38;
  const rmNormalized = rmTotal / 16;
  const compositeCredibility = cbcaNormalized * 0.6 + rmNormalized * 0.3 + validity.overallValidity * 0.1;

  // Confidence interval based on statement length and detail density
  const words = statement.split(/\s+/).length;
  const marginOfError = words < 100 ? 0.2 : words < 300 ? 0.12 : 0.08;

  return {
    cbca,
    cbcaTotal,
    cbcaMaxPossible: 38,
    credibilityLevel,
    rm,
    rmTotal,
    rmMemoryType,
    validity,
    compositeCredibility,
    confidenceInterval: [
      Math.max(0, compositeCredibility - marginOfError),
      Math.min(1, compositeCredibility + marginOfError)
    ],
    recommendations: generateCBCARecommendations(cbca, rm, credibilityLevel, rmMemoryType)
  };
}

// ============================================
// CBCA Criteria Analysis
// ============================================

function analyzeCBCACriteria(text: string): CBCACriteria {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.split(/\s+/);
  const lowerText = text.toLowerCase();

  return {
    logicalStructure: scoreLogicalStructure(text, sentences),
    unstructuredProduction: scoreUnstructuredProduction(sentences),
    quantityOfDetails: scoreQuantityOfDetails(text, words),
    contextualEmbedding: scoreContextualEmbedding(lowerText),
    interactions: scoreInteractions(lowerText),
    reproductionOfConversation: scoreReproductionOfConversation(text),
    unexpectedComplications: scoreUnexpectedComplications(lowerText),
    unusualDetails: scoreUnusualDetails(lowerText),
    superfluousDetails: scoreSuperfluousDetails(lowerText, words),
    misunderstoodDetails: scoreMisunderstoodDetails(lowerText),
    relatedExternalAssociations: scoreExternalAssociations(lowerText),
    subjectiveMentalState: scoreSubjectiveMentalState(lowerText),
    perpetratorMentalState: scorePerpMentalState(lowerText),
    spontaneousCorrections: scoreSpontaneousCorrections(lowerText),
    admittingLackOfMemory: scoreAdmittingLackMemory(lowerText),
    raisingDoubts: scoreRaisingDoubts(lowerText),
    selfDeprecation: scoreSelfDeprecation(lowerText),
    pardoningPerpetrator: scorePardoningPerpetrator(lowerText),
    detailsCharacteristic: scoreDetailsCharacteristic(lowerText),
  };
}

function scoreLogicalStructure(text: string, sentences: string[]): CriterionScore {
  const connectors = (text.match(/\b(because|therefore|then|after|before|so|when|while|since)\b/gi) || []).length;
  const ratio = connectors / Math.max(1, sentences.length);
  const score: 0 | 1 | 2 = ratio > 0.3 ? 2 : ratio > 0.1 ? 1 : 0;
  return { score, evidence: [`${connectors} logical connectors in ${sentences.length} sentences`], confidence: 0.7 };
}

function scoreUnstructuredProduction(sentences: string[]): CriterionScore {
  // Check for non-chronological jumps (temporal markers out of order)
  const temporalMarkers = sentences.map((s, i) => ({ index: i, hasMarker: /\b(then|later|before|earlier|after|next)\b/i.test(s) }));
  const jumps = temporalMarkers.filter((m, i) => i > 0 && m.hasMarker && temporalMarkers[i - 1].hasMarker).length;
  const score: 0 | 1 | 2 = jumps > 2 ? 2 : jumps > 0 ? 1 : 0;
  return { score, evidence: [`${jumps} narrative jumps/digressions detected`], confidence: 0.6 };
}

function scoreQuantityOfDetails(text: string, words: string[]): CriterionScore {
  const detailPatterns = /\b(red|blue|green|left|right|small|large|approximately|about \d|around \d|\d+ (minutes|hours|meters|feet|o'clock))\b/gi;
  const detailCount = (text.match(detailPatterns) || []).length;
  const density = detailCount / Math.max(1, words.length) * 100;
  const score: 0 | 1 | 2 = density > 3 ? 2 : density > 1 ? 1 : 0;
  return { score, evidence: [`${detailCount} specific details (${density.toFixed(1)}% density)`], confidence: 0.75 };
}

function scoreContextualEmbedding(text: string): CriterionScore {
  const contextMarkers = (text.match(/\b(at the time|in those days|that (morning|evening|day|week)|we were|it was (raining|sunny|cold|warm|dark))\b/gi) || []).length;
  const score: 0 | 1 | 2 = contextMarkers > 3 ? 2 : contextMarkers > 0 ? 1 : 0;
  return { score, evidence: [`${contextMarkers} contextual embedding markers`], confidence: 0.7 };
}

function scoreInteractions(text: string): CriterionScore {
  const interactionPatterns = (text.match(/\b(he (said|did|told|asked|looked)|she (said|did|told|asked)|they (said|did|were)|i (asked|said|told|replied))\b/gi) || []).length;
  const score: 0 | 1 | 2 = interactionPatterns > 4 ? 2 : interactionPatterns > 1 ? 1 : 0;
  return { score, evidence: [`${interactionPatterns} interaction descriptions`], confidence: 0.7 };
}

function scoreReproductionOfConversation(text: string): CriterionScore {
  const quotes = (text.match(/"[^"]+"|'[^']+'/g) || []).length;
  const dialogueMarkers = (text.match(/\b(he said|she said|i said|told me|asked me)\b/gi) || []).length;
  const total = quotes + dialogueMarkers;
  const score: 0 | 1 | 2 = total > 3 ? 2 : total > 0 ? 1 : 0;
  return { score, evidence: [`${quotes} direct quotes, ${dialogueMarkers} dialogue markers`], confidence: 0.8 };
}

function scoreUnexpectedComplications(text: string): CriterionScore {
  const markers = (text.match(/\b(suddenly|unexpectedly|out of nowhere|then (something|everything) (changed|happened)|it didn't go as|interrupted)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 2 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} unexpected complication markers`], confidence: 0.6 };
}

function scoreUnusualDetails(text: string): CriterionScore {
  const markers = (text.match(/\b(strange|odd|weird|unusual|peculiar|i noticed|what struck me)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 2 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} unusual detail markers`], confidence: 0.6 };
}

function scoreSuperfluousDetails(text: string, words: string[]): CriterionScore {
  const parentheticals = (text.match(/\(([^)]+)\)|—[^—]+—|, (which|who|although|even though)/gi) || []).length;
  const score: 0 | 1 | 2 = parentheticals > 3 ? 2 : parentheticals > 0 ? 1 : 0;
  return { score, evidence: [`${parentheticals} superfluous detail instances`], confidence: 0.5 };
}

function scoreMisunderstoodDetails(text: string): CriterionScore {
  const markers = (text.match(/\b(i didn't understand|i didn't know what|confused me|at the time i thought|later i realized)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 1 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} misunderstood detail reports`], confidence: 0.65 };
}

function scoreExternalAssociations(text: string): CriterionScore {
  const markers = (text.match(/\b(reminds me of|similar to|like when|just like|it was like)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 1 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} external associations`], confidence: 0.55 };
}

function scoreSubjectiveMentalState(text: string): CriterionScore {
  const markers = (text.match(/\b(i felt|i was (scared|afraid|angry|happy|sad|nervous|confused|shocked)|my heart|i thought|i was thinking)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 3 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} subjective mental state references`], confidence: 0.75 };
}

function scorePerpMentalState(text: string): CriterionScore {
  const markers = (text.match(/\b(he (seemed|looked|appeared|must have)|she (seemed|looked|appeared|must have)|they (seemed|were trying|wanted))\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 2 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} perpetrator mental state attributions`], confidence: 0.6 };
}

function scoreSpontaneousCorrections(text: string): CriterionScore {
  const markers = (text.match(/\b(actually|no wait|i mean|correction|let me correct|that's not right, it was)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 2 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} spontaneous corrections`], confidence: 0.7 };
}

function scoreAdmittingLackMemory(text: string): CriterionScore {
  const markers = (text.match(/\b(i don't remember|i can't recall|i'm not sure|i forgot|my memory is|it's fuzzy)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 2 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} memory limitation admissions`], confidence: 0.7 };
}

function scoreRaisingDoubts(text: string): CriterionScore {
  const markers = (text.match(/\b(i know (it sounds|this seems)|you might not believe|it's hard to believe|i realize this sounds)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 1 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} self-doubt expressions`], confidence: 0.65 };
}

function scoreSelfDeprecation(text: string): CriterionScore {
  const markers = (text.match(/\b(i should have|it was my fault|i was stupid|i made a mistake|i shouldn't have)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 1 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} self-deprecation instances`], confidence: 0.65 };
}

function scorePardoningPerpetrator(text: string): CriterionScore {
  const markers = (text.match(/\b(maybe (he|she|they) didn't mean|i understand why|i don't blame|perhaps (he|she|they) was|it wasn't entirely)\b/gi) || []).length;
  const score: 0 | 1 | 2 = markers > 1 ? 2 : markers > 0 ? 1 : 0;
  return { score, evidence: [`${markers} perpetrator pardoning instances`], confidence: 0.6 };
}

function scoreDetailsCharacteristic(text: string): CriterionScore {
  // This is domain-specific; detect details that would only be known through experience
  const sensoryDetails = (text.match(/\b(tasted|smelled|texture|sound of|felt like|temperature|vibration)\b/gi) || []).length;
  const score: 0 | 1 | 2 = sensoryDetails > 3 ? 2 : sensoryDetails > 0 ? 1 : 0;
  return { score, evidence: [`${sensoryDetails} characteristic experiential details`], confidence: 0.6 };
}

// ============================================
// Reality Monitoring
// ============================================

function analyzeRealityMonitoring(text: string): RealityMonitoringCriteria {
  const lowerText = text.toLowerCase();

  const perceptual = (lowerText.match(/\b(saw|heard|felt|smelled|tasted|looked like|sounded like|warm|cold|loud|bright|dark)\b/gi) || []).length;
  const spatial = (lowerText.match(/\b(left|right|above|below|beside|behind|in front|corner|door|window|room|street)\b/gi) || []).length;
  const temporal = (lowerText.match(/\b(before|after|then|when|while|during|at \d|\d (am|pm)|o'clock|morning|evening|night)\b/gi) || []).length;
  const affective = (lowerText.match(/\b(scared|happy|sad|angry|nervous|excited|worried|anxious|relieved|terrified)\b/gi) || []).length;
  const cognitive = (lowerText.match(/\b(i thought|i realized|i decided|i knew|i understood|i figured|it occurred to me)\b/gi) || []).length;

  return {
    perceptualInformation: { score: perceptual > 4 ? 2 : perceptual > 1 ? 1 : 0, evidence: [`${perceptual} perceptual details`], confidence: 0.7 },
    spatialInformation: { score: spatial > 4 ? 2 : spatial > 1 ? 1 : 0, evidence: [`${spatial} spatial details`], confidence: 0.7 },
    temporalInformation: { score: temporal > 3 ? 2 : temporal > 1 ? 1 : 0, evidence: [`${temporal} temporal markers`], confidence: 0.7 },
    affectiveInformation: { score: affective > 3 ? 2 : affective > 0 ? 1 : 0, evidence: [`${affective} affective references`], confidence: 0.7 },
    reconstructability: { score: (perceptual + spatial + temporal) > 8 ? 2 : (perceptual + spatial + temporal) > 3 ? 1 : 0, evidence: ['Based on combined perceptual/spatial/temporal density'], confidence: 0.6 },
    realism: { score: text.split(/[.!?]+/).length > 5 && perceptual > 2 ? 2 : perceptual > 0 ? 1 : 0, evidence: ['Based on narrative coherence and detail'], confidence: 0.6 },
    cognitiveOperations: { score: cognitive > 3 ? 2 : cognitive > 0 ? 1 : 0, evidence: [`${cognitive} cognitive operation references`], confidence: 0.65 },
    selfReference: { score: (text.match(/\bi\b/gi) || []).length > 10 ? 2 : (text.match(/\bi\b/gi) || []).length > 3 ? 1 : 0, evidence: [`${(text.match(/\bi\b/gi) || []).length} first-person references`], confidence: 0.7 },
  };
}

// ============================================
// Validity Checklist
// ============================================

function assessValidity(text: string): ValidityChecklist {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgSentenceLen = words / Math.max(1, sentences);

  return {
    linguisticAbility: avgSentenceLen > 5 && avgSentenceLen < 40,
    appropriateAffect: true, // Requires external assessment
    suggestibility: false, // Requires interview context
    motiveToReport: true, // Assumed unless flagged
    contextOfDisclosure: true,
    pressureToReport: false,
    investigationQuality: true,
    consistencyWithLaws: true,
    consistencyWithOtherStatements: true, // Requires external data
    consistencyWithEvidence: true, // Requires external data
    overallValidity: 0.7 // Default moderate validity
  };
}

// ============================================
// Helpers
// ============================================

function sumCBCA(cbca: CBCACriteria): number {
  return Object.values(cbca).reduce((sum, criterion) => sum + criterion.score, 0);
}

function sumRM(rm: RealityMonitoringCriteria): number {
  return Object.values(rm).reduce((sum, criterion) => sum + criterion.score, 0);
}

function generateCBCARecommendations(
  cbca: CBCACriteria,
  rm: RealityMonitoringCriteria,
  credLevel: string,
  memType: string
): string[] {
  const recs: string[] = [];

  if (credLevel === 'low') {
    recs.push('Low CBCA score — statement lacks typical markers of experienced events. Consider additional verification.');
  }

  if (memType === 'fabricated') {
    recs.push('Reality Monitoring suggests fabricated memory — high cognitive operations, low perceptual/sensory detail.');
  }

  if (cbca.reproductionOfConversation.score === 0) {
    recs.push('No conversation reproduction — ask subject to recall specific dialogues verbatim.');
  }

  if (cbca.spontaneousCorrections.score === 0 && cbca.admittingLackOfMemory.score === 0) {
    recs.push('Absence of spontaneous corrections and memory admissions — often seen in rehearsed statements.');
  }

  if (rm.perceptualInformation.score === 0) {
    recs.push('No perceptual details — probe for sensory experiences (what did you see/hear/feel?).');
  }

  return recs;
}
