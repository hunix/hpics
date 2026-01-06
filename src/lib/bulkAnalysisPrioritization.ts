/**
 * Bulk Analysis Prioritization Engine
 * 
 * Calculates priority scores for analysis items based on multiple factors:
 * - Recency (30%): Recent media first
 * - Contact Importance (25%): Based on relationship scores
 * - Unanalyzed Priority (20%): Never-analyzed items first
 * - Content Richness (15%): Larger files likely have more content
 * - User Interest (10%): Files user has interacted with
 */

export interface PrioritizationInput {
  id: string;
  mediaId?: string;
  documentId?: string;
  profileId: string;
  createdAt: string;
  fileSize?: number;
  hasBeenAnalyzed: boolean;
  contactScore?: number; // 0-100 from relationship_scores
  userViews?: number;
  mediaType: string;
}

export interface PrioritizedItem extends PrioritizationInput {
  priorityScore: number;
  priorityBreakdown: {
    recency: number;
    importance: number;
    unanalyzed: number;
    richness: number;
    interest: number;
  };
}

const WEIGHTS = {
  recency: 0.30,
  importance: 0.25,
  unanalyzed: 0.20,
  richness: 0.15,
  interest: 0.10,
};

/**
 * Calculate recency score (0-100)
 * Items from last 24h = 100, items older than 30 days = 0
 */
function calculateRecencyScore(createdAt: string): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const ageMs = now - created;
  const ageHours = ageMs / (1000 * 60 * 60);
  
  if (ageHours <= 24) return 100;
  if (ageHours <= 72) return 90;
  if (ageHours <= 168) return 75; // 1 week
  if (ageHours <= 720) return 50; // 30 days
  if (ageHours <= 2160) return 25; // 90 days
  return 10;
}

/**
 * Calculate content richness score (0-100)
 * Based on file size - larger files tend to have more content
 */
function calculateRichnessScore(fileSize: number | undefined, mediaType: string): number {
  if (!fileSize) return 50; // Default for unknown size
  
  // Different thresholds for different media types
  const thresholds: Record<string, { min: number; max: number }> = {
    image: { min: 100_000, max: 5_000_000 }, // 100KB - 5MB
    video: { min: 5_000_000, max: 500_000_000 }, // 5MB - 500MB
    audio: { min: 500_000, max: 50_000_000 }, // 500KB - 50MB
    document: { min: 10_000, max: 10_000_000 }, // 10KB - 10MB
  };
  
  const t = thresholds[mediaType] || thresholds.image;
  
  if (fileSize <= t.min) return 20;
  if (fileSize >= t.max) return 100;
  
  // Linear interpolation
  return 20 + ((fileSize - t.min) / (t.max - t.min)) * 80;
}

/**
 * Calculate interest score based on user interactions
 */
function calculateInterestScore(userViews: number | undefined): number {
  if (!userViews) return 30; // Default for no views
  if (userViews >= 10) return 100;
  if (userViews >= 5) return 80;
  if (userViews >= 3) return 60;
  if (userViews >= 1) return 40;
  return 30;
}

/**
 * Calculate priority score for a single item
 */
export function calculateItemPriority(item: PrioritizationInput): PrioritizedItem {
  const recency = calculateRecencyScore(item.createdAt);
  const importance = item.contactScore ?? 50; // Default to medium importance
  const unanalyzed = item.hasBeenAnalyzed ? 0 : 100;
  const richness = calculateRichnessScore(item.fileSize, item.mediaType);
  const interest = calculateInterestScore(item.userViews);
  
  const priorityScore = 
    recency * WEIGHTS.recency +
    importance * WEIGHTS.importance +
    unanalyzed * WEIGHTS.unanalyzed +
    richness * WEIGHTS.richness +
    interest * WEIGHTS.interest;
  
  return {
    ...item,
    priorityScore,
    priorityBreakdown: {
      recency,
      importance,
      unanalyzed,
      richness,
      interest,
    },
  };
}

/**
 * Prioritize a list of items and return sorted by priority score
 */
export function prioritizeItems(items: PrioritizationInput[]): PrioritizedItem[] {
  return items
    .map(calculateItemPriority)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Cost estimation for bulk analysis
 */
export interface CostEstimate {
  totalCents: number;
  breakdown: {
    mediaType: string;
    count: number;
    estimatedCents: number;
  }[];
  warningThreshold: number;
  criticalThreshold: number;
}

const BASE_COSTS: Record<string, Record<string, number>> = {
  image: { quick: 0.5, standard: 1, deep: 3 },
  audio: { quick: 1, standard: 2, deep: 5 },
  video: { quick: 3, standard: 5, deep: 10 },
  document: { quick: 0.3, standard: 0.8, deep: 2 },
};

/**
 * Estimate cost for bulk analysis
 */
export function estimateBulkCost(
  items: { mediaType: string; fileSize?: number }[],
  modes: string[],
  depth: string
): CostEstimate {
  const breakdown: CostEstimate['breakdown'] = [];
  const byType: Record<string, number> = {};
  
  // Count by type
  for (const item of items) {
    byType[item.mediaType] = (byType[item.mediaType] || 0) + 1;
  }
  
  let totalCents = 0;
  const modeFactor = 1 + (modes.length - 1) * 0.3; // Each additional mode adds 30%
  
  for (const [mediaType, count] of Object.entries(byType)) {
    const baseCost = BASE_COSTS[mediaType]?.[depth] || BASE_COSTS.image[depth];
    const typeCost = Math.ceil(baseCost * modeFactor * count);
    
    breakdown.push({
      mediaType,
      count,
      estimatedCents: typeCost,
    });
    
    totalCents += typeCost;
  }
  
  return {
    totalCents,
    breakdown,
    warningThreshold: Math.ceil(totalCents * 0.8),
    criticalThreshold: totalCents,
  };
}

/**
 * Format cents to display string
 */
export function formatCost(cents: number): string {
  if (cents < 100) {
    return `${cents}¢`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}
