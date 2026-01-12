/**
 * @fileoverview Action Intelligence Engine
 * Generates contextual action recommendations and strategic playbooks
 */

import { supabase } from '@/integrations/supabase/client';

export interface ActionRecommendation {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timing: string;
  script?: string;
  expectedOutcome: string;
  successProbability: number;
}

export interface CommunicationTemplate {
  context: string;
  template: string;
  tone: string;
}

export interface GiftRecommendation {
  item: string;
  reason: string;
  timing: string;
  budget: string;
  impact: string;
}

export interface ActionIntelligenceResult {
  immediateActions: ActionRecommendation[];
  shortTermStrategy: {
    weeklyPlan: Array<{ week: number; focus: string; actions: string[] }>;
    trustBuilders: string[];
    valuePropositions: string[];
  };
  longTermRoadmap: {
    milestones: Array<{ month: number; milestone: string; actions: string[] }>;
    strategicMoves: string[];
    networkLeverage: string[];
  };
  communicationTemplates: {
    openers: CommunicationTemplate[];
    followUps: Array<{ stage: string; template: string; timing: string }>;
    reEngagement: Array<{ scenario: string; template: string }>;
    difficultConversations: Array<{ topic: string; framework: string }>;
  };
  giftIntelligence: {
    recommendations: GiftRecommendation[];
    gestureIdeas: Array<{ gesture: string; occasion: string; personalityMatch: string }>;
  };
  meetingPlanning: {
    venueRecommendations: Array<{ type: string; reason: string }>;
    agendaSuggestions: string[];
    talkingPoints: string[];
    bodyLanguageTips: string[];
  };
  influenceTactics: {
    primaryApproach: string;
    persuasionVectors: string[];
    objectionHandlers: Array<{ objection: string; response: string }>;
    commitmentTechniques: string[];
  };
  riskManagement: {
    pitfalls: Array<{ risk: string; mitigation: string }>;
    rejectionPlans: string[];
    repairStrategies: string[];
  };
  timingIntelligence: {
    optimalContactTimes: string[];
    responseWindows: { minimum: string; maximum: string };
    upcomingOpportunities: Array<{ date: string; occasion: string; action: string }>;
  };
  successMetrics: {
    responseRateTarget: number;
    engagementBenchmarks: string[];
    progressIndicators: string[];
  };
  confidenceScore: number;
}

export type GoalType = 
  | 'relationship_building'
  | 'business_development'
  | 'networking'
  | 'conflict_resolution'
  | 'influence_expansion'
  | 're_engagement'
  | 'information_gathering'
  | 'trust_building';

export interface ActionContext {
  currentRelationshipStatus: string;
  recentInteractions: string[];
  knownPreferences: string[];
  upcomingEvents: string[];
  sharedConnections: string[];
}

/**
 * Generate comprehensive action intelligence for a contact
 */
export async function generateActionIntelligence(
  profileData: any,
  context: ActionContext,
  goalType: GoalType = 'relationship_building'
): Promise<ActionIntelligenceResult> {
  try {
    const { data, error } = await supabase.functions.invoke('action-intelligence-engine', {
      body: {
        profileData,
        context,
        goalType
      }
    });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.error || 'Action intelligence generation failed');
    }

    return data.intelligence;
  } catch (error) {
    console.error('Action intelligence generation error:', error);
    throw error;
  }
}

/**
 * Get quick action suggestions without full AI processing
 */
export function getQuickActions(
  profileData: any,
  context: ActionContext
): ActionRecommendation[] {
  const actions: ActionRecommendation[] = [];
  const now = new Date();
  
  // Check for birthday opportunity
  if (profileData.birthday) {
    const birthday = new Date(profileData.birthday);
    const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
    const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 0 && daysUntil <= 7) {
      actions.push({
        action: `Prepare birthday message for ${profileData.first_name}`,
        priority: 'high',
        timing: `${daysUntil} days before birthday`,
        expectedOutcome: 'Strengthen relationship through personal recognition',
        successProbability: 0.95
      });
    }
  }
  
  // Check for re-engagement opportunity
  const lastContact = profileData.last_contact_date ? new Date(profileData.last_contact_date) : null;
  if (lastContact) {
    const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceContact > 30 && daysSinceContact <= 60) {
      actions.push({
        action: 'Initiate casual check-in',
        priority: 'medium',
        timing: 'This week',
        script: `Hey ${profileData.first_name}, it's been a while! How have you been?`,
        expectedOutcome: 'Re-establish communication rhythm',
        successProbability: 0.7
      });
    } else if (daysSinceContact > 60) {
      actions.push({
        action: 'Re-engagement outreach required',
        priority: 'high',
        timing: 'Within 48 hours',
        expectedOutcome: 'Prevent relationship decay',
        successProbability: 0.5
      });
    }
  }
  
  // Check for shared connection leverage
  if (context.sharedConnections.length > 0) {
    actions.push({
      action: `Leverage connection through ${context.sharedConnections[0]}`,
      priority: 'medium',
      timing: 'When appropriate',
      expectedOutcome: 'Build trust through mutual network',
      successProbability: 0.65
    });
  }
  
  // Check for upcoming events
  if (context.upcomingEvents.length > 0) {
    actions.push({
      action: `Mention/discuss: ${context.upcomingEvents[0]}`,
      priority: 'medium',
      timing: 'Next interaction',
      expectedOutcome: 'Demonstrate awareness and interest',
      successProbability: 0.8
    });
  }
  
  return actions;
}

/**
 * Generate conversation starters based on profile data
 */
export function generateConversationStarters(profileData: any): string[] {
  const starters: string[] = [];
  
  if (profileData.company) {
    starters.push(`I saw some interesting news about ${profileData.company}. How are things going there?`);
  }
  
  if (profileData.interests && profileData.interests.length > 0) {
    const interest = profileData.interests[0];
    starters.push(`I was thinking about ${interest} recently and thought of you. Have you...?`);
  }
  
  if (profileData.job_title) {
    starters.push(`How's the ${profileData.job_title} role treating you these days?`);
  }
  
  // Generic but personalized
  if (profileData.first_name) {
    starters.push(`${profileData.first_name}, I came across something that made me think of our last conversation...`);
  }
  
  return starters;
}

/**
 * Calculate optimal contact timing
 */
export function calculateOptimalTiming(
  profileData: any,
  historicalPatterns?: any
): { bestDays: string[]; bestTimes: string[]; avoid: string[] } {
  const result = {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestTimes: ['10:00 AM', '2:00 PM'],
    avoid: ['Monday morning', 'Friday afternoon']
  };
  
  // Adjust based on profession
  if (profileData.job_title) {
    const title = profileData.job_title.toLowerCase();
    
    if (title.includes('executive') || title.includes('ceo') || title.includes('founder')) {
      result.bestTimes = ['7:00 AM', '6:00 PM'];
      result.avoid.push('Standard business hours (busy in meetings)');
    }
    
    if (title.includes('developer') || title.includes('engineer')) {
      result.bestTimes = ['11:00 AM', '3:00 PM'];
      result.avoid.push('Early morning (deep work time)');
    }
    
    if (title.includes('sales')) {
      result.bestDays = ['Tuesday', 'Wednesday'];
      result.avoid.push('End of month (quota pressure)');
    }
  }
  
  // Adjust based on timezone if available
  if (profileData.timezone) {
    // Would adjust times based on timezone difference
  }
  
  return result;
}
