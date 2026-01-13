/**
 * Financial Intelligence & Wealth Estimation Engine
 * 
 * Estimates wealth tier, financial trajectory, and identifies
 * financial vulnerabilities and opportunity windows.
 */

// Wealth tier definitions
export type WealthTier = 1 | 2 | 3 | 4 | 5;

export interface WealthTierInfo {
  tier: WealthTier;
  label: string;
  netWorthRange: { min: number; max: number };
  description: string;
  characteristics: string[];
}

export const WEALTH_TIERS: Record<WealthTier, WealthTierInfo> = {
  1: {
    tier: 1,
    label: 'Entry Level',
    netWorthRange: { min: 0, max: 50000 },
    description: 'Entry level, often debt-burdened',
    characteristics: [
      'Living paycheck to paycheck',
      'Limited savings',
      'May have student or consumer debt',
      'Price-conscious decision making'
    ]
  },
  2: {
    tier: 2,
    label: 'Emerging Wealth',
    netWorthRange: { min: 50000, max: 250000 },
    description: 'Emerging wealth, building assets',
    characteristics: [
      'Building emergency fund',
      'Contributing to retirement',
      'May own property with mortgage',
      'Balancing spending and saving'
    ]
  },
  3: {
    tier: 3,
    label: 'Established Professional',
    netWorthRange: { min: 250000, max: 1000000 },
    description: 'Established professional wealth',
    characteristics: [
      'Significant home equity',
      'Diversified investments',
      'Children\'s education planning',
      'Career-focused wealth building'
    ]
  },
  4: {
    tier: 4,
    label: 'High Net Worth',
    netWorthRange: { min: 1000000, max: 5000000 },
    description: 'High net worth individual',
    characteristics: [
      'Multiple properties',
      'Investment portfolio',
      'May use financial advisors',
      'Wealth preservation focus'
    ]
  },
  5: {
    tier: 5,
    label: 'Ultra High Net Worth',
    netWorthRange: { min: 5000000, max: Infinity },
    description: 'Ultra high net worth',
    characteristics: [
      'Multiple properties/locations',
      'Business ownership likely',
      'Family office potential',
      'Legacy planning focus'
    ]
  }
};

// Industry salary data (US median, 2024)
const INDUSTRY_SALARY_RANGES: Record<string, { entry: number; mid: number; senior: number; executive: number }> = {
  technology: { entry: 85000, mid: 140000, senior: 200000, executive: 400000 },
  finance: { entry: 75000, mid: 130000, senior: 250000, executive: 500000 },
  healthcare: { entry: 65000, mid: 100000, senior: 180000, executive: 350000 },
  legal: { entry: 80000, mid: 160000, senior: 300000, executive: 600000 },
  consulting: { entry: 90000, mid: 150000, senior: 250000, executive: 450000 },
  education: { entry: 45000, mid: 65000, senior: 90000, executive: 150000 },
  retail: { entry: 35000, mid: 55000, senior: 85000, executive: 200000 },
  manufacturing: { entry: 50000, mid: 75000, senior: 120000, executive: 250000 },
  media: { entry: 45000, mid: 80000, senior: 150000, executive: 300000 },
  nonprofit: { entry: 40000, mid: 60000, senior: 100000, executive: 180000 },
  government: { entry: 50000, mid: 80000, senior: 130000, executive: 200000 },
  default: { entry: 50000, mid: 80000, senior: 130000, executive: 250000 }
};

// Title level mapping
const TITLE_LEVEL_MAP: Record<string, 'entry' | 'mid' | 'senior' | 'executive'> = {
  // Entry level
  intern: 'entry', associate: 'entry', analyst: 'entry', junior: 'entry',
  assistant: 'entry', coordinator: 'entry', specialist: 'entry',
  
  // Mid level
  manager: 'mid', lead: 'mid', senior: 'mid', principal: 'mid',
  staff: 'mid', consultant: 'mid',
  
  // Senior level
  director: 'senior', head: 'senior', vp: 'senior', 'vice president': 'senior',
  partner: 'senior', fellow: 'senior',
  
  // Executive level
  ceo: 'executive', cfo: 'executive', cto: 'executive', coo: 'executive',
  president: 'executive', founder: 'executive', owner: 'executive',
  'managing director': 'executive', 'general manager': 'executive',
  'chief': 'executive', 'c-level': 'executive', 'c-suite': 'executive'
};

// Location cost multipliers
const LOCATION_MULTIPLIERS: Record<string, number> = {
  // High cost
  'san francisco': 1.6, 'new york': 1.5, 'boston': 1.35, 'seattle': 1.35,
  'los angeles': 1.3, 'washington dc': 1.3, 'chicago': 1.15, 'denver': 1.1,
  'austin': 1.1, 'miami': 1.15, 'london': 1.4, 'zurich': 1.6, 'singapore': 1.3,
  'hong kong': 1.4, 'sydney': 1.2, 'tokyo': 1.3,
  
  // Standard
  'atlanta': 1.0, 'dallas': 1.0, 'phoenix': 0.95, 'philadelphia': 1.05,
  'houston': 1.0, 'minneapolis': 1.0, 'portland': 1.1, 'san diego': 1.2,
  
  // Lower cost
  'default': 0.9
};

export interface ContactFinancialData {
  name: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  location?: string;
  yearsExperience?: number;
  education?: string;
  
  // Observable indicators
  propertyOwnership?: boolean;
  vehicleMentions?: string[];
  travelPatterns?: string[];
  luxuryIndicators?: string[];
  investmentMentions?: string[];
  debtIndicators?: string[];
  
  // Social indicators
  lifestylePhotos?: string[];
  expensivePurchases?: string[];
  vacationFrequency?: 'rarely' | 'occasionally' | 'frequently' | 'constantly';
  diningPatterns?: 'budget' | 'moderate' | 'upscale' | 'luxury';
}

export interface FinancialIntelligenceResult {
  wealthTier: WealthTier;
  wealthTierConfidence: number;
  estimatedNetWorth: { min: number; max: number };
  estimatedIncome: { min: number; max: number };
  incomeTrajectory: 'declining' | 'stable' | 'growing' | 'accelerating';
  financialStressScore: number;  // 0-100, higher = more stress
  vulnerabilityWindows: FinancialVulnerabilityWindow[];
  opportunityWindows: FinancialOpportunityWindow[];
  evidenceSources: EvidenceSource[];
  recommendations: string[];
}

export interface FinancialVulnerabilityWindow {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  exploitability: number;  // 0-1
  suggestedApproach: string;
}

export interface FinancialOpportunityWindow {
  type: string;
  description: string;
  timing: string;
  optimalAsk: string;
  successProbability: number;
}

export interface EvidenceSource {
  type: string;
  indicator: string;
  implication: string;
  confidence: number;
}

/**
 * Estimate income based on job title and industry
 */
export function estimateIncomeFromJob(
  jobTitle?: string,
  industry?: string,
  location?: string,
  yearsExperience?: number
): { min: number; max: number; confidence: number } {
  if (!jobTitle) {
    return { min: 40000, max: 120000, confidence: 0.2 };
  }
  
  const titleLower = jobTitle.toLowerCase();
  
  // Determine level
  let level: 'entry' | 'mid' | 'senior' | 'executive' = 'mid';
  for (const [keyword, titleLevel] of Object.entries(TITLE_LEVEL_MAP)) {
    if (titleLower.includes(keyword)) {
      level = titleLevel;
      break;
    }
  }
  
  // Adjust for experience if provided
  if (yearsExperience !== undefined) {
    if (yearsExperience < 3) level = 'entry';
    else if (yearsExperience < 8) level = level === 'entry' ? 'mid' : level;
    else if (yearsExperience < 15) level = ['entry', 'mid'].includes(level) ? 'senior' : level;
    else level = level !== 'executive' ? 'senior' : level;
  }
  
  // Get industry salary
  const industryKey = industry?.toLowerCase() || 'default';
  const salaryRange = INDUSTRY_SALARY_RANGES[industryKey] || INDUSTRY_SALARY_RANGES.default;
  const baseSalary = salaryRange[level];
  
  // Apply location multiplier
  const locationKey = location?.toLowerCase() || 'default';
  let locationMultiplier = LOCATION_MULTIPLIERS.default;
  for (const [loc, mult] of Object.entries(LOCATION_MULTIPLIERS)) {
    if (locationKey.includes(loc)) {
      locationMultiplier = mult;
      break;
    }
  }
  
  const adjustedSalary = baseSalary * locationMultiplier;
  
  // Calculate range
  const min = Math.round(adjustedSalary * 0.8);
  const max = Math.round(adjustedSalary * 1.3);
  
  // Confidence based on data quality
  let confidence = 0.5;
  if (jobTitle) confidence += 0.15;
  if (industry) confidence += 0.1;
  if (location) confidence += 0.1;
  if (yearsExperience !== undefined) confidence += 0.1;
  
  return { min, max, confidence: Math.min(0.9, confidence) };
}

/**
 * Estimate wealth tier from all available data
 */
export function estimateWealthTier(data: ContactFinancialData): FinancialIntelligenceResult {
  const evidenceSources: EvidenceSource[] = [];
  let tierScores: Record<WealthTier, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // 1. Income-based estimation
  const incomeEstimate = estimateIncomeFromJob(
    data.jobTitle,
    data.industry,
    data.location,
    data.yearsExperience
  );
  
  if (incomeEstimate.confidence > 0.3) {
    const avgIncome = (incomeEstimate.min + incomeEstimate.max) / 2;
    
    if (avgIncome < 50000) tierScores[1] += 2;
    else if (avgIncome < 100000) tierScores[2] += 2;
    else if (avgIncome < 200000) tierScores[3] += 2;
    else if (avgIncome < 400000) tierScores[4] += 2;
    else tierScores[5] += 2;
    
    evidenceSources.push({
      type: 'income',
      indicator: `${data.jobTitle || 'Unknown'} in ${data.industry || 'unknown industry'}`,
      implication: `Estimated income $${incomeEstimate.min.toLocaleString()}-${incomeEstimate.max.toLocaleString()}`,
      confidence: incomeEstimate.confidence
    });
  }
  
  // 2. Property ownership
  if (data.propertyOwnership === true) {
    tierScores[3] += 1.5;
    tierScores[4] += 1;
    evidenceSources.push({
      type: 'asset',
      indicator: 'Property ownership indicated',
      implication: 'Suggests established financial position',
      confidence: 0.7
    });
  }
  
  // 3. Vehicle analysis
  if (data.vehicleMentions && data.vehicleMentions.length > 0) {
    const luxuryBrands = ['mercedes', 'bmw', 'audi', 'lexus', 'tesla', 'porsche', 'ferrari', 'lamborghini', 'bentley', 'rolls royce', 'range rover'];
    const ultraLuxury = ['ferrari', 'lamborghini', 'bentley', 'rolls royce', 'mclaren', 'aston martin'];
    
    for (const vehicle of data.vehicleMentions) {
      const vehicleLower = vehicle.toLowerCase();
      
      if (ultraLuxury.some(brand => vehicleLower.includes(brand))) {
        tierScores[5] += 2;
        evidenceSources.push({
          type: 'asset',
          indicator: `Ultra-luxury vehicle: ${vehicle}`,
          implication: 'Strong indicator of significant wealth',
          confidence: 0.85
        });
      } else if (luxuryBrands.some(brand => vehicleLower.includes(brand))) {
        tierScores[4] += 1;
        tierScores[3] += 0.5;
        evidenceSources.push({
          type: 'asset',
          indicator: `Luxury vehicle: ${vehicle}`,
          implication: 'Suggests upper-middle to high income',
          confidence: 0.7
        });
      }
    }
  }
  
  // 4. Travel patterns
  if (data.travelPatterns && data.travelPatterns.length > 0) {
    const luxuryIndicators = ['first class', 'business class', 'private jet', 'yacht', 'five star', '5 star', 'suite'];
    const luxuryDestinations = ['maldives', 'monaco', 'st. barts', 'aspen', 'hamptons', 'côte d\'azur', 'swiss alps'];
    
    let luxuryTravelCount = 0;
    for (const travel of data.travelPatterns) {
      const travelLower = travel.toLowerCase();
      if (luxuryIndicators.some(ind => travelLower.includes(ind)) ||
          luxuryDestinations.some(dest => travelLower.includes(dest))) {
        luxuryTravelCount++;
      }
    }
    
    if (luxuryTravelCount >= 3) {
      tierScores[5] += 1.5;
      tierScores[4] += 1;
    } else if (luxuryTravelCount >= 1) {
      tierScores[4] += 1;
      tierScores[3] += 0.5;
    }
    
    if (luxuryTravelCount > 0) {
      evidenceSources.push({
        type: 'lifestyle',
        indicator: `${luxuryTravelCount} luxury travel indicators`,
        implication: 'Discretionary income for luxury experiences',
        confidence: 0.65
      });
    }
  }
  
  // 5. Vacation frequency
  if (data.vacationFrequency) {
    if (data.vacationFrequency === 'constantly') {
      tierScores[4] += 1;
      tierScores[5] += 1;
    } else if (data.vacationFrequency === 'frequently') {
      tierScores[3] += 1;
      tierScores[4] += 0.5;
    } else if (data.vacationFrequency === 'rarely') {
      tierScores[1] += 1;
      tierScores[2] += 0.5;
    }
  }
  
  // 6. Dining patterns
  if (data.diningPatterns) {
    if (data.diningPatterns === 'luxury') {
      tierScores[4] += 1;
      tierScores[5] += 0.5;
    } else if (data.diningPatterns === 'upscale') {
      tierScores[3] += 1;
      tierScores[4] += 0.5;
    } else if (data.diningPatterns === 'budget') {
      tierScores[1] += 1;
      tierScores[2] += 0.5;
    }
  }
  
  // 7. Debt indicators (negative signal)
  let financialStressScore = 20; // Base stress level
  if (data.debtIndicators && data.debtIndicators.length > 0) {
    const stressIndicators = ['student loan', 'credit card debt', 'behind on', 'collection', 'bankruptcy', 'foreclosure'];
    let stressCount = 0;
    
    for (const debt of data.debtIndicators) {
      const debtLower = debt.toLowerCase();
      if (stressIndicators.some(ind => debtLower.includes(ind))) {
        stressCount++;
        tierScores[1] += 1;
        tierScores[2] -= 0.5;
      }
    }
    
    financialStressScore += stressCount * 15;
    
    if (stressCount > 0) {
      evidenceSources.push({
        type: 'liability',
        indicator: `${stressCount} debt stress indicators`,
        implication: 'May indicate financial pressure',
        confidence: 0.7
      });
    }
  }
  
  // Determine most likely tier
  let maxScore = 0;
  let estimatedTier: WealthTier = 2;
  for (const [tier, score] of Object.entries(tierScores) as [string, number][]) {
    if (score > maxScore) {
      maxScore = score;
      estimatedTier = parseInt(tier) as WealthTier;
    }
  }
  
  // Calculate confidence
  const totalEvidence = evidenceSources.length;
  const tierConfidence = Math.min(0.9, 0.3 + (totalEvidence * 0.1) + (maxScore / 10));
  
  // Get net worth range
  const tierInfo = WEALTH_TIERS[estimatedTier];
  
  // Determine income trajectory
  let incomeTrajectory: 'declining' | 'stable' | 'growing' | 'accelerating' = 'stable';
  if (data.yearsExperience !== undefined) {
    if (data.yearsExperience < 5) incomeTrajectory = 'accelerating';
    else if (data.yearsExperience < 15) incomeTrajectory = 'growing';
    else if (data.yearsExperience < 25) incomeTrajectory = 'stable';
    else incomeTrajectory = 'stable';
  }
  
  // Generate vulnerability windows
  const vulnerabilityWindows: FinancialVulnerabilityWindow[] = [];
  
  if (financialStressScore > 50) {
    vulnerabilityWindows.push({
      type: 'Financial Stress',
      description: 'Indicators of financial pressure present',
      severity: financialStressScore > 70 ? 'high' : 'medium',
      exploitability: financialStressScore / 100,
      suggestedApproach: 'Offer solutions to financial problems, emphasize value and savings'
    });
  }
  
  if (estimatedTier <= 2 && data.yearsExperience && data.yearsExperience > 10) {
    vulnerabilityWindows.push({
      type: 'Career Stagnation',
      description: 'Income may not match experience level',
      severity: 'medium',
      exploitability: 0.6,
      suggestedApproach: 'Position opportunities as career advancement'
    });
  }
  
  // Generate opportunity windows
  const opportunityWindows: FinancialOpportunityWindow[] = [];
  
  if (estimatedTier >= 4) {
    opportunityWindows.push({
      type: 'Investment Capacity',
      description: 'Significant discretionary capital available',
      timing: 'Quarterly/annually when reviewing investments',
      optimalAsk: 'Investment opportunities, partnerships',
      successProbability: 0.4
    });
  }
  
  if (incomeTrajectory === 'accelerating') {
    opportunityWindows.push({
      type: 'Rising Income',
      description: 'Income growing faster than expenses',
      timing: 'After promotions or raises',
      optimalAsk: 'Premium services, growth opportunities',
      successProbability: 0.5
    });
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (estimatedTier >= 4) {
    recommendations.push('Target with premium/exclusive offerings');
    recommendations.push('Emphasize status and exclusivity over price');
  } else if (estimatedTier <= 2) {
    recommendations.push('Focus on value proposition and ROI');
    recommendations.push('Offer payment plans or flexible terms');
  }
  
  if (financialStressScore > 50) {
    recommendations.push('Approach with empathy about financial concerns');
    recommendations.push('Avoid high-pressure tactics that may backfire');
  }
  
  return {
    wealthTier: estimatedTier,
    wealthTierConfidence: tierConfidence,
    estimatedNetWorth: tierInfo.netWorthRange,
    estimatedIncome: incomeEstimate,
    incomeTrajectory,
    financialStressScore: Math.min(100, financialStressScore),
    vulnerabilityWindows,
    opportunityWindows,
    evidenceSources,
    recommendations
  };
}

/**
 * Analyze financial mentions in text
 */
export function analyzeFinancialMentions(text: string): {
  propertyIndicators: string[];
  vehicleIndicators: string[];
  luxuryIndicators: string[];
  debtIndicators: string[];
  investmentIndicators: string[];
} {
  const textLower = text.toLowerCase();
  
  const propertyPatterns = [
    /\b(my|our)\s+(house|home|apartment|condo|property|place)\b/gi,
    /\b(bought|purchased|own|mortgage|renovating)\s+.{0,20}(house|home|property)\b/gi,
    /\breal estate\b/gi
  ];
  
  const vehiclePatterns = [
    /\b(my|our)\s+(car|vehicle|suv|truck|motorcycle)\b/gi,
    /\b(tesla|bmw|mercedes|audi|lexus|porsche|ferrari|lamborghini|range rover)\b/gi,
    /\b(bought|purchased|leased)\s+.{0,20}(car|vehicle)\b/gi
  ];
  
  const luxuryPatterns = [
    /\b(rolex|cartier|louis vuitton|gucci|hermes|prada|chanel)\b/gi,
    /\b(yacht|private jet|first class|business class|country club|golf club)\b/gi,
    /\b(maldives|st\. barts|monaco|aspen|hamptons)\b/gi
  ];
  
  const debtPatterns = [
    /\b(student loans?|credit card debt|mortgage payment|car payment)\b/gi,
    /\b(debt|owe|behind on|collections?|bankruptcy)\b/gi,
    /\b(can't afford|too expensive|saving up)\b/gi
  ];
  
  const investmentPatterns = [
    /\b(invest|portfolio|stocks?|bonds?|401k|ira|retirement)\b/gi,
    /\b(dividend|capital gains|returns?|roi)\b/gi,
    /\b(financial advisor|wealth manager)\b/gi
  ];
  
  const extractMatches = (patterns: RegExp[]) => {
    const matches: string[] = [];
    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }
    return [...new Set(matches)];
  };
  
  return {
    propertyIndicators: extractMatches(propertyPatterns),
    vehicleIndicators: extractMatches(vehiclePatterns),
    luxuryIndicators: extractMatches(luxuryPatterns),
    debtIndicators: extractMatches(debtPatterns),
    investmentIndicators: extractMatches(investmentPatterns)
  };
}
