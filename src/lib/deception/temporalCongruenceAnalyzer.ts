/**
 * Temporal Congruence Analyzer
 * 
 * Cross-references statement timestamps against known event data
 * to detect temporal impossibilities, inconsistencies, and fabrication indicators.
 * 
 * @module temporalCongruenceAnalyzer
 */

// ============================================
// Types
// ============================================

export interface TemporalClaim {
  id: string;
  text: string;
  claimedTime: Date | null;
  claimedDuration?: number; // minutes
  location?: string;
  activityType: string;
  confidence: number;
}

export interface KnownEvent {
  id: string;
  description: string;
  timestamp: Date;
  endTimestamp?: Date;
  location?: string;
  source: 'digital_record' | 'witness' | 'surveillance' | 'document' | 'physical_evidence';
  reliability: number; // 0-1
}

export interface TemporalInconsistency {
  type: 'impossibility' | 'improbability' | 'gap' | 'overlap' | 'sequence_violation' | 'duration_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  claimId: string;
  conflictingEventId?: string;
  description: string;
  timeGapMinutes?: number;
  deceptionIndicator: number; // 0-1
}

export interface TemporalCongruenceResult {
  claims: TemporalClaim[];
  knownEvents: KnownEvent[];
  inconsistencies: TemporalInconsistency[];
  timeline: TimelineEntry[];
  overallCongruenceScore: number; // 0-1
  temporalCoveragePercent: number;
  unaccountedPeriods: TimePeriod[];
  deceptionIndicator: number;
  recommendations: string[];
}

export interface TimelineEntry {
  timestamp: Date;
  type: 'claim' | 'known_event' | 'inconsistency';
  sourceId: string;
  description: string;
  verified: boolean | null;
}

export interface TimePeriod {
  start: Date;
  end: Date;
  durationMinutes: number;
  context: string;
}

// ============================================
// Core Analysis
// ============================================

/**
 * Analyze temporal congruence between statements and known events
 */
export function analyzeTemporalCongruence(
  claims: TemporalClaim[],
  knownEvents: KnownEvent[]
): TemporalCongruenceResult {
  const inconsistencies: TemporalInconsistency[] = [];

  // 1. Check temporal impossibilities (being in two places at once)
  inconsistencies.push(...detectImpossibilities(claims, knownEvents));

  // 2. Check sequence violations
  inconsistencies.push(...detectSequenceViolations(claims));

  // 3. Check duration mismatches
  inconsistencies.push(...detectDurationMismatches(claims));

  // 4. Cross-reference claims with known events
  inconsistencies.push(...crossReferenceEvents(claims, knownEvents));

  // 5. Build unified timeline
  const timeline = buildTimeline(claims, knownEvents, inconsistencies);

  // 6. Find unaccounted periods
  const unaccountedPeriods = findUnaccountedPeriods(claims, knownEvents);

  // 7. Calculate coverage
  const totalSpanMs = calculateTotalSpan(claims, knownEvents);
  const coveredMs = calculateCoveredTime(claims);
  const temporalCoveragePercent = totalSpanMs > 0 ? Math.min(1, coveredMs / totalSpanMs) : 0;

  // Overall congruence score
  const criticalCount = inconsistencies.filter(i => i.severity === 'critical').length;
  const highCount = inconsistencies.filter(i => i.severity === 'high').length;
  const overallCongruenceScore = Math.max(0, 1 - (criticalCount * 0.3 + highCount * 0.15 + inconsistencies.length * 0.05));

  const deceptionIndicator = Math.min(1,
    criticalCount * 0.25 + highCount * 0.15 + (1 - temporalCoveragePercent) * 0.2 + unaccountedPeriods.length * 0.05
  );

  return {
    claims,
    knownEvents,
    inconsistencies,
    timeline,
    overallCongruenceScore,
    temporalCoveragePercent,
    unaccountedPeriods,
    deceptionIndicator,
    recommendations: generateTemporalRecommendations(inconsistencies, unaccountedPeriods, deceptionIndicator)
  };
}

// ============================================
// Detection Functions
// ============================================

function detectImpossibilities(claims: TemporalClaim[], events: KnownEvent[]): TemporalInconsistency[] {
  const issues: TemporalInconsistency[] = [];

  for (const claim of claims) {
    if (!claim.claimedTime || !claim.location) continue;

    for (const event of events) {
      if (!event.location) continue;

      // Check temporal overlap
      const claimEnd = claim.claimedDuration
        ? new Date(claim.claimedTime.getTime() + claim.claimedDuration * 60000)
        : new Date(claim.claimedTime.getTime() + 60 * 60000); // Default 1hr

      const eventEnd = event.endTimestamp || new Date(event.timestamp.getTime() + 30 * 60000);

      const overlaps = claim.claimedTime < eventEnd && claimEnd > event.timestamp;

      if (overlaps && claim.location.toLowerCase() !== event.location.toLowerCase()) {
        // Different locations at overlapping times
        const gapMinutes = Math.abs(claim.claimedTime.getTime() - event.timestamp.getTime()) / 60000;

        issues.push({
          type: 'impossibility',
          severity: 'critical',
          claimId: claim.id,
          conflictingEventId: event.id,
          description: `Claims to be at "${claim.location}" while evidence places subject at "${event.location}" during overlapping timeframe`,
          timeGapMinutes: gapMinutes,
          deceptionIndicator: 0.9 * event.reliability
        });
      }
    }
  }

  return issues;
}

function detectSequenceViolations(claims: TemporalClaim[]): TemporalInconsistency[] {
  const issues: TemporalInconsistency[] = [];
  const timedClaims = claims.filter(c => c.claimedTime).sort((a, b) => a.claimedTime!.getTime() - b.claimedTime!.getTime());

  for (let i = 1; i < timedClaims.length; i++) {
    const prev = timedClaims[i - 1];
    const curr = timedClaims[i];

    // Check if narrative order implies a different sequence than claimed times
    const timeDiff = curr.claimedTime!.getTime() - prev.claimedTime!.getTime();

    if (timeDiff < 0) {
      issues.push({
        type: 'sequence_violation',
        severity: 'high',
        claimId: curr.id,
        description: `Claim "${curr.text.slice(0, 50)}..." is narrated after "${prev.text.slice(0, 50)}..." but claimed time is earlier`,
        timeGapMinutes: Math.abs(timeDiff) / 60000,
        deceptionIndicator: 0.6
      });
    }
  }

  return issues;
}

function detectDurationMismatches(claims: TemporalClaim[]): TemporalInconsistency[] {
  const issues: TemporalInconsistency[] = [];

  for (const claim of claims) {
    if (!claim.claimedDuration) continue;

    // Flag unreasonably short or long durations
    if (claim.claimedDuration < 1 && claim.activityType !== 'observation') {
      issues.push({
        type: 'duration_mismatch',
        severity: 'medium',
        claimId: claim.id,
        description: `Claimed duration of ${claim.claimedDuration} minutes for "${claim.activityType}" seems implausibly short`,
        deceptionIndicator: 0.4
      });
    }

    if (claim.claimedDuration > 480) { // > 8 hours
      issues.push({
        type: 'duration_mismatch',
        severity: 'low',
        claimId: claim.id,
        description: `Claimed duration of ${claim.claimedDuration} minutes (${(claim.claimedDuration / 60).toFixed(1)} hours) — verify this extended period`,
        deceptionIndicator: 0.2
      });
    }
  }

  return issues;
}

function crossReferenceEvents(claims: TemporalClaim[], events: KnownEvent[]): TemporalInconsistency[] {
  const issues: TemporalInconsistency[] = [];

  // Find events that should have been mentioned but weren't
  for (const event of events) {
    const mentionedInClaims = claims.some(c => {
      if (!c.claimedTime) return false;
      const timeDiff = Math.abs(c.claimedTime.getTime() - event.timestamp.getTime());
      return timeDiff < 30 * 60000; // Within 30 minutes
    });

    if (!mentionedInClaims && event.reliability > 0.7) {
      issues.push({
        type: 'gap',
        severity: 'medium',
        claimId: '',
        conflictingEventId: event.id,
        description: `Known event "${event.description}" at ${event.timestamp.toISOString()} not addressed in any statement`,
        deceptionIndicator: 0.5 * event.reliability
      });
    }
  }

  return issues;
}

// ============================================
// Timeline & Coverage
// ============================================

function buildTimeline(
  claims: TemporalClaim[],
  events: KnownEvent[],
  inconsistencies: TemporalInconsistency[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const claim of claims) {
    if (claim.claimedTime) {
      entries.push({
        timestamp: claim.claimedTime,
        type: 'claim',
        sourceId: claim.id,
        description: claim.text.slice(0, 100),
        verified: null
      });
    }
  }

  for (const event of events) {
    entries.push({
      timestamp: event.timestamp,
      type: 'known_event',
      sourceId: event.id,
      description: event.description,
      verified: true
    });
  }

  for (const inc of inconsistencies) {
    if (inc.type === 'impossibility' || inc.type === 'sequence_violation') {
      const claim = claims.find(c => c.id === inc.claimId);
      if (claim?.claimedTime) {
        entries.push({
          timestamp: claim.claimedTime,
          type: 'inconsistency',
          sourceId: inc.claimId,
          description: inc.description,
          verified: false
        });
      }
    }
  }

  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function findUnaccountedPeriods(claims: TemporalClaim[], events: KnownEvent[]): TimePeriod[] {
  const allTimes = [
    ...claims.filter(c => c.claimedTime).map(c => ({
      start: c.claimedTime!,
      end: new Date(c.claimedTime!.getTime() + (c.claimedDuration || 60) * 60000)
    })),
    ...events.map(e => ({
      start: e.timestamp,
      end: e.endTimestamp || new Date(e.timestamp.getTime() + 30 * 60000)
    }))
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: TimePeriod[] = [];
  for (let i = 1; i < allTimes.length; i++) {
    const gapStart = allTimes[i - 1].end;
    const gapEnd = allTimes[i].start;
    const gapMinutes = (gapEnd.getTime() - gapStart.getTime()) / 60000;

    if (gapMinutes > 30) {
      gaps.push({
        start: gapStart,
        end: gapEnd,
        durationMinutes: gapMinutes,
        context: `Unaccounted gap of ${gapMinutes.toFixed(0)} minutes`
      });
    }
  }

  return gaps;
}

function calculateTotalSpan(claims: TemporalClaim[], events: KnownEvent[]): number {
  const times = [
    ...claims.filter(c => c.claimedTime).map(c => c.claimedTime!.getTime()),
    ...events.map(e => e.timestamp.getTime())
  ];
  if (times.length < 2) return 0;
  return Math.max(...times) - Math.min(...times);
}

function calculateCoveredTime(claims: TemporalClaim[]): number {
  return claims
    .filter(c => c.claimedTime && c.claimedDuration)
    .reduce((sum, c) => sum + (c.claimedDuration || 0) * 60000, 0);
}

function generateTemporalRecommendations(
  inconsistencies: TemporalInconsistency[],
  gaps: TimePeriod[],
  deceptionIndicator: number
): string[] {
  const recs: string[] = [];

  const impossibilities = inconsistencies.filter(i => i.type === 'impossibility');
  if (impossibilities.length > 0) {
    recs.push(`CRITICAL: ${impossibilities.length} temporal impossibilities detected — subject cannot be in two locations simultaneously.`);
  }

  const seqViolations = inconsistencies.filter(i => i.type === 'sequence_violation');
  if (seqViolations.length > 0) {
    recs.push(`${seqViolations.length} sequence violations — narrative order contradicts claimed timeline.`);
  }

  if (gaps.length > 0) {
    const totalGapMinutes = gaps.reduce((s, g) => s + g.durationMinutes, 0);
    recs.push(`${gaps.length} unaccounted time periods totaling ${(totalGapMinutes / 60).toFixed(1)} hours — probe for activities during these gaps.`);
  }

  if (deceptionIndicator > 0.7) {
    recs.push('High temporal deception probability — recommend detailed timeline reconstruction with independent verification.');
  }

  return recs;
}
