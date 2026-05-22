/**
 * @fileoverview Deep OSINT Intelligence Engine
 * Comprehensive open-source intelligence gathering and analysis
 */

import { supabase } from '@/integrations/supabase/client';

export interface DigitalFootprint {
  platforms: Array<{
    name: string;
    username: string;
    activityLevel: string;
    followerCount: number;
    contentFocus: string[];
  }>;
  identityConsistency: {
    score: number;
    discrepancies: string[];
  };
  onlineReputation: {
    score: number;
    positiveSignals: string[];
    negativeSignals: string[];
  };
  publishingPatterns: {
    frequency: string;
    preferredTimes: string[];
    contentTypes: string[];
  };
}

export interface ProfessionalIntelligence {
  careerTrajectory: {
    current: string;
    trajectory: string;
    milestones: string[];
  };
  industryInfluence: {
    score: number;
    domains: string[];
    evidence: string[];
  };
  intellectualProperty: {
    patents: number;
    publications: number;
    domains: string[];
  };
}

export interface FinancialIndicators {
  wealthTier: string;
  incomeEstimate: string;
  assetSignals: string[];
  financialHealth: string;
  investmentPatterns: string[];
}

export interface RiskAssessment {
  overallRisk: string;
  vulnerabilities: Array<{
    type: string;
    severity: string;
    exploitability: string;
  }>;
  leveragePoints: string[];
  redFlags: string[];
  trustScore: number;
}

export interface OsintResult {
  digitalFootprint: DigitalFootprint;
  professionalIntelligence: ProfessionalIntelligence;
  publicRecords: {
    businessOwnerships: Array<{ entity: string; role: string; status: string }>;
    licenses: string[];
    domains: string[];
    trademarks: string[];
  };
  mediaIntelligence: {
    newsMentions: Array<{ source: string; date: string; sentiment: string; summary: string }>;
    controversies: Array<{ topic: string; severity: string; status: string }>;
    publicStatements: string[];
  };
  academicProfile: {
    education: Array<{ institution: string; degree: string; field: string; year: string }>;
    publications: number;
    citations: number;
    expertiseDomains: string[];
  };
  socialGraph: {
    keyConnections: Array<{ name: string; relationship: string; influence: string }>;
    organizations: string[];
    influenceScore: number;
  };
  financialIndicators: FinancialIndicators;
  locationIntelligence: {
    primaryLocation: string;
    frequentLocations: string[];
    travelPatterns: string[];
    timezone: string;
  };
  behavioralOsint: {
    communicationStyle: string;
    responsePatterns: string;
    activitySchedule: string[];
    preferredChannels: string[];
  };
  riskAssessment: RiskAssessment;
  opportunities: {
    approachVectors: string[];
    commonGround: string[];
    optimalTiming: string;
    recommendations: string[];
  };
  confidenceScore: number;
  dataFreshness: string;
  sourcesUsed: string[];
}

export type SearchDepth = 'quick' | 'standard' | 'comprehensive' | 'exhaustive';

/**
 * Perform deep OSINT scan on a profile
 */
export async function performDeepOsintScan(
  profileData: any,
  searchDepth: SearchDepth = 'comprehensive'
): Promise<OsintResult> {
  try {
    const { data, error } = await supabase.functions.invoke('deep-osint-scan', {
      body: {
        profileData,
        searchDepth
      }
    });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.error || 'OSINT scan failed');
    }

    return data.analysis;
  } catch (error) {
    console.error('Deep OSINT scan error:', error);
    throw error;
  }
}

/**
 * Build OSINT query from profile data
 */
export function buildOsintQueries(profileData: any): string[] {
  const queries: string[] = [];
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
  
  if (fullName) {
    queries.push(`"${fullName}"`);
    
    const orgName = profileData.organization || profileData.company;
    if (orgName) {
      queries.push(`"${fullName}" "${orgName}"`);
    }
    
    if (profileData.job_title) {
      queries.push(`"${fullName}" "${profileData.job_title}"`);
    }
    
    if (profileData.location) {
      queries.push(`"${fullName}" "${profileData.location}"`);
    }
  }
  
  if (profileData.email) {
    queries.push(`"${profileData.email}"`);
  }
  
  if (profileData.linkedin_url) {
    const username = profileData.linkedin_url.split('/').pop();
    if (username) {
      queries.push(`"${username}" linkedin`);
    }
  }
  
  return queries;
}

/**
 * Extract social handles from profile
 */
export function extractSocialHandles(profileData: any): Record<string, string> {
  const handles: Record<string, string> = {};
  
  if (profileData.linkedin_url) {
    const match = profileData.linkedin_url.match(/linkedin\.com\/in\/([^/?]+)/);
    if (match) handles.linkedin = match[1];
  }
  
  if (profileData.twitter_url) {
    const match = profileData.twitter_url.match(/(?:twitter|x)\.com\/([^/?]+)/);
    if (match) handles.twitter = match[1];
  }
  
  if (profileData.instagram_url) {
    const match = profileData.instagram_url.match(/instagram\.com\/([^/?]+)/);
    if (match) handles.instagram = match[1];
  }
  
  if (profileData.facebook_url) {
    const match = profileData.facebook_url.match(/facebook\.com\/([^/?]+)/);
    if (match) handles.facebook = match[1];
  }
  
  if (profileData.github_url) {
    const match = profileData.github_url.match(/github\.com\/([^/?]+)/);
    if (match) handles.github = match[1];
  }
  
  return handles;
}

/**
 * Estimate data freshness based on last update times
 */
export function estimateDataFreshness(profileData: any): {
  overallFreshness: 'stale' | 'aging' | 'current' | 'fresh';
  lastUpdate: string | null;
  refreshRecommended: boolean;
} {
  const now = new Date();
  const lastUpdated = profileData.updated_at ? new Date(profileData.updated_at) : null;
  
  if (!lastUpdated) {
    return {
      overallFreshness: 'stale',
      lastUpdate: null,
      refreshRecommended: true
    };
  }
  
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceUpdate <= 7) {
    return {
      overallFreshness: 'fresh',
      lastUpdate: lastUpdated.toISOString(),
      refreshRecommended: false
    };
  } else if (daysSinceUpdate <= 30) {
    return {
      overallFreshness: 'current',
      lastUpdate: lastUpdated.toISOString(),
      refreshRecommended: false
    };
  } else if (daysSinceUpdate <= 90) {
    return {
      overallFreshness: 'aging',
      lastUpdate: lastUpdated.toISOString(),
      refreshRecommended: true
    };
  } else {
    return {
      overallFreshness: 'stale',
      lastUpdate: lastUpdated.toISOString(),
      refreshRecommended: true
    };
  }
}

/**
 * Calculate wealth indicators from available data
 */
export function inferWealthIndicators(profileData: any): {
  tier: string;
  confidence: number;
  signals: string[];
} {
  const signals: string[] = [];
  let score = 50; // Start neutral
  
  // Job title analysis
  if (profileData.job_title) {
    const title = profileData.job_title.toLowerCase();
    
    if (title.includes('ceo') || title.includes('founder') || title.includes('owner')) {
      score += 25;
      signals.push('Executive/founder position');
    } else if (title.includes('director') || title.includes('vp') || title.includes('partner')) {
      score += 15;
      signals.push('Senior leadership role');
    } else if (title.includes('manager') || title.includes('lead')) {
      score += 5;
      signals.push('Management position');
    }
  }
  
  // Company analysis
  const orgName = profileData.organization || profileData.company;
  if (orgName) {
    signals.push('Company affiliation noted');
  }
  
  // Location analysis
  if (profileData.location) {
    const location = profileData.location.toLowerCase();
    const highCostAreas = ['san francisco', 'new york', 'manhattan', 'london', 'zurich', 'singapore', 'hong kong'];
    
    if (highCostAreas.some(area => location.includes(area))) {
      score += 10;
      signals.push('High cost-of-living location');
    }
  }
  
  // Education analysis
  if (profileData.education) {
    // Would analyze school prestige
    signals.push('Education data available');
  }
  
  let tier: string;
  if (score >= 80) tier = 'Ultra High Net Worth';
  else if (score >= 65) tier = 'High Net Worth';
  else if (score >= 50) tier = 'Upper Middle';
  else if (score >= 35) tier = 'Middle';
  else tier = 'Emerging';
  
  return {
    tier,
    confidence: Math.min(0.9, signals.length * 0.15),
    signals
  };
}
