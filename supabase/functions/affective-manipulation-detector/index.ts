// Affective Manipulation Detector - Harvard Business School (January 2025)
// Identifies conversational dark patterns: guilt appeals, FOMO hooks, emotional manipulation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManipulationPattern {
  patternType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  evidence: string[];
  counterMeasures: string[];
}

interface ExitPointAnalysis {
  exitType: string;
  manipulationIntensity: number;
  engagementMultiplier: number;
  patterns: ManipulationPattern[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'affective-manipulation-detector', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const communicationContent = body.content || body.communication_content;
    const contextType = body.contextType || body.context_type || 'general';

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[AffectiveManip] Analyzing manipulation patterns for profile: ${profileId}`);

    // Fetch communication history
    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .order('occurred_at', { ascending: false })
      .limit(100);

    // Fetch messages if available
    const { data: messages } = await supabase
      .from('messages')
      .select('*, conversations!inner(profile_id)')
      .eq('conversations.profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(200);

    // Dark Pattern Detection
    const darkPatterns = detectDarkPatterns(communications || [], messages || []);

    // Exit Point Analysis
    const exitPointAnalysis = analyzeExitPoints(communications || [], messages || []);

    // Guilt Appeal Detection
    const guiltPatterns = detectGuiltAppeals(messages || []);

    // FOMO Hook Detection
    const fomoPatterns = detectFOMOHooks(messages || []);

    // Emotional Bypass Detection
    const emotionalBypass = detectEmotionalBypass(messages || []);

    // Reciprocity Exploitation
    const reciprocityExploitation = detectReciprocityExploitation(communications || []);

    // Social Proof Manipulation
    const socialProofManipulation = detectSocialProofManipulation(messages || []);

    // Generate Counter-Measures
    const counterMeasures = generateCounterMeasures([
      ...darkPatterns,
      ...guiltPatterns,
      ...fomoPatterns,
      ...emotionalBypass,
      ...reciprocityExploitation,
      ...socialProofManipulation
    ]);

    const allPatterns = [
      ...darkPatterns,
      ...guiltPatterns,
      ...fomoPatterns,
      ...emotionalBypass,
      ...reciprocityExploitation,
      ...socialProofManipulation
    ];

    const overallSeverity = calculateOverallSeverity(allPatterns);
    const manipulationScore = calculateManipulationScore(allPatterns);

    const result = {
      profileId,
      analysisType: 'affective_manipulation_detection',
      patterns: {
        darkPatterns,
        guiltAppeals: guiltPatterns,
        fomoHooks: fomoPatterns,
        emotionalBypass,
        reciprocityExploitation,
        socialProofManipulation
      },
      exitPointAnalysis,
      metrics: {
        totalPatternsDetected: allPatterns.length,
        overallSeverity,
        manipulationScore,
        engagementImpact: exitPointAnalysis.reduce((sum, e) => sum + e.engagementMultiplier, 0) / Math.max(exitPointAnalysis.length, 1)
      },
      counterMeasures,
      recommendations: generateRecommendations(allPatterns, overallSeverity),
      confidence: 0.88,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'affective_manipulation_detection',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[AffectiveManip] Analysis complete. Patterns detected: ${allPatterns.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AffectiveManip] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function detectDarkPatterns(comms: any[], messages: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  // Confirmshaming detection
  const confirmshaming = messages.filter(m => 
    m.content?.toLowerCase().includes('miss out') ||
    m.content?.toLowerCase().includes('regret') ||
    m.content?.toLowerCase().includes("don't you care")
  );
  if (confirmshaming.length > 0) {
    patterns.push({
      patternType: 'Confirmshaming',
      severity: confirmshaming.length > 5 ? 'high' : 'medium',
      confidence: 0.85,
      evidence: confirmshaming.slice(0, 3).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Recognize shame-based language',
        'Separate emotional pressure from rational decision',
        'Delay response to reduce emotional reactivity'
      ]
    });
  }

  // Urgency patterns
  const urgencyPatterns = messages.filter(m =>
    m.content?.toLowerCase().includes('limited time') ||
    m.content?.toLowerCase().includes('act now') ||
    m.content?.toLowerCase().includes('last chance')
  );
  if (urgencyPatterns.length > 0) {
    patterns.push({
      patternType: 'False Urgency',
      severity: urgencyPatterns.length > 3 ? 'high' : 'medium',
      confidence: 0.82,
      evidence: urgencyPatterns.slice(0, 3).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Verify time constraints independently',
        'Impose self-mandated cooling-off period',
        'Question the source of urgency'
      ]
    });
  }

  // Scarcity manipulation
  const scarcityPatterns = messages.filter(m =>
    m.content?.toLowerCase().includes('only') && m.content?.toLowerCase().includes('left') ||
    m.content?.toLowerCase().includes('running out') ||
    m.content?.toLowerCase().includes('exclusive')
  );
  if (scarcityPatterns.length > 0) {
    patterns.push({
      patternType: 'Artificial Scarcity',
      severity: 'medium',
      confidence: 0.79,
      evidence: scarcityPatterns.slice(0, 3).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Research actual availability',
        'Recognize manufactured urgency',
        'Base decisions on need, not fear of missing out'
      ]
    });
  }

  return patterns;
}

function analyzeExitPoints(comms: any[], messages: any[]): ExitPointAnalysis[] {
  const exitPoints: ExitPointAnalysis[] = [];

  // Analyze conversation endings
  const conversationEndings = messages.filter((m, i, arr) => {
    const nextMessage = arr[i - 1];
    if (!nextMessage) return true;
    const timeDiff = new Date(nextMessage.created_at).getTime() - new Date(m.created_at).getTime();
    return timeDiff > 24 * 60 * 60 * 1000; // 24 hours gap
  });

  conversationEndings.forEach(ending => {
    const patterns = detectExitManipulation(ending);
    if (patterns.length > 0) {
      exitPoints.push({
        exitType: 'Conversation abandonment',
        manipulationIntensity: patterns.reduce((sum, p) => sum + (p.severity === 'high' ? 3 : p.severity === 'medium' ? 2 : 1), 0) / patterns.length,
        engagementMultiplier: patterns.length > 2 ? 14 : patterns.length * 3, // HBS finding: 14x engagement
        patterns
      });
    }
  });

  return exitPoints;
}

function detectExitManipulation(message: any): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];
  const content = message.content?.toLowerCase() || '';

  if (content.includes('before you go') || content.includes('wait')) {
    patterns.push({
      patternType: 'Exit interception',
      severity: 'medium',
      confidence: 0.75,
      evidence: [message.content?.substring(0, 100)],
      counterMeasures: ['Recognize exit manipulation', 'Commit to original decision']
    });
  }

  if (content.includes('one more thing') || content.includes('special offer')) {
    patterns.push({
      patternType: 'Last-minute hook',
      severity: 'medium',
      confidence: 0.78,
      evidence: [message.content?.substring(0, 100)],
      counterMeasures: ['Delay new decisions', 'Apply original evaluation criteria']
    });
  }

  return patterns;
}

function detectGuiltAppeals(messages: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];
  
  const guiltIndicators = [
    'disappointed', 'hurt', 'after everything', 'thought you cared',
    'how could you', 'let me down', 'expected more', 'abandoned'
  ];

  const guiltMessages = messages.filter(m => 
    guiltIndicators.some(indicator => m.content?.toLowerCase().includes(indicator))
  );

  if (guiltMessages.length > 0) {
    patterns.push({
      patternType: 'Guilt induction',
      severity: guiltMessages.length > 5 ? 'critical' : guiltMessages.length > 2 ? 'high' : 'medium',
      confidence: 0.87,
      evidence: guiltMessages.slice(0, 5).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Recognize guilt as manipulation tactic',
        'Separate legitimate concerns from emotional coercion',
        'Establish and maintain boundaries',
        'Seek objective third-party perspective'
      ]
    });
  }

  return patterns;
}

function detectFOMOHooks(messages: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  const fomoIndicators = [
    'everyone else', 'missing out', "don't be left behind",
    'others have already', 'opportunity', 'once in a lifetime'
  ];

  const fomoMessages = messages.filter(m =>
    fomoIndicators.some(indicator => m.content?.toLowerCase().includes(indicator))
  );

  if (fomoMessages.length > 0) {
    patterns.push({
      patternType: 'FOMO exploitation',
      severity: fomoMessages.length > 4 ? 'high' : 'medium',
      confidence: 0.84,
      evidence: fomoMessages.slice(0, 4).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Evaluate opportunities on individual merit',
        'Recognize social comparison manipulation',
        'Make decisions based on personal values, not peer pressure',
        'Accept that missing some opportunities is normal'
      ]
    });
  }

  return patterns;
}

function detectEmotionalBypass(messages: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  // Detect appeals that bypass rational thought
  const emotionalTriggers = messages.filter(m => {
    const content = m.content?.toLowerCase() || '';
    return (
      (content.includes('feel') && content.includes('heart')) ||
      content.includes('trust your gut') ||
      content.includes("don't overthink") ||
      content.includes('just do it')
    );
  });

  if (emotionalTriggers.length > 0) {
    patterns.push({
      patternType: 'Rational bypass',
      severity: 'medium',
      confidence: 0.76,
      evidence: emotionalTriggers.slice(0, 3).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Insist on time for rational evaluation',
        'Request concrete information over emotional appeals',
        'Separate feelings from facts in decision-making'
      ]
    });
  }

  return patterns;
}

function detectReciprocityExploitation(comms: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  // Detect "I did this for you, now you owe me" patterns
  const reciprocityIndicators = comms.filter(c =>
    c.notes?.toLowerCase().includes('favor') ||
    c.notes?.toLowerCase().includes('owe') ||
    c.notes?.toLowerCase().includes('after i')
  );

  if (reciprocityIndicators.length > 0) {
    patterns.push({
      patternType: 'Reciprocity exploitation',
      severity: reciprocityIndicators.length > 3 ? 'high' : 'medium',
      confidence: 0.81,
      evidence: reciprocityIndicators.slice(0, 3).map(c => c.notes?.substring(0, 100)),
      counterMeasures: [
        'Recognize unsolicited favors as potential manipulation setup',
        'Maintain autonomy in decision-making regardless of perceived debts',
        'Evaluate requests on their own merit'
      ]
    });
  }

  return patterns;
}

function detectSocialProofManipulation(messages: any[]): ManipulationPattern[] {
  const patterns: ManipulationPattern[] = [];

  const socialProofIndicators = [
    'everyone agrees', 'all your friends', 'nobody would',
    'people like you', 'smart people', 'successful people'
  ];

  const socialProofMessages = messages.filter(m =>
    socialProofIndicators.some(indicator => m.content?.toLowerCase().includes(indicator))
  );

  if (socialProofMessages.length > 0) {
    patterns.push({
      patternType: 'Social proof manipulation',
      severity: 'medium',
      confidence: 0.79,
      evidence: socialProofMessages.slice(0, 3).map(m => m.content?.substring(0, 100)),
      counterMeasures: [
        'Verify claims about others independently',
        'Recognize bandwagon appeals',
        'Make decisions based on personal analysis, not crowd behavior'
      ]
    });
  }

  return patterns;
}

function generateCounterMeasures(patterns: ManipulationPattern[]): any {
  const allCounterMeasures = patterns.flatMap(p => p.counterMeasures);
  const uniqueMeasures = [...new Set(allCounterMeasures)];

  return {
    immediate: uniqueMeasures.filter(m => m.includes('Recognize') || m.includes('Delay')),
    shortTerm: uniqueMeasures.filter(m => m.includes('Evaluate') || m.includes('Verify')),
    longTerm: uniqueMeasures.filter(m => m.includes('Establish') || m.includes('Maintain')),
    cognitive: [
      'Practice metacognition during high-pressure interactions',
      'Develop personal decision-making framework',
      'Build emotional regulation skills'
    ]
  };
}

function calculateOverallSeverity(patterns: ManipulationPattern[]): string {
  if (patterns.some(p => p.severity === 'critical')) return 'critical';
  if (patterns.filter(p => p.severity === 'high').length > 2) return 'critical';
  if (patterns.some(p => p.severity === 'high')) return 'high';
  if (patterns.filter(p => p.severity === 'medium').length > 3) return 'high';
  if (patterns.some(p => p.severity === 'medium')) return 'medium';
  return 'low';
}

function calculateManipulationScore(patterns: ManipulationPattern[]): number {
  const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
  const totalWeight = patterns.reduce((sum, p) => sum + (severityWeights[p.severity] || 1) * p.confidence, 0);
  return Math.min(totalWeight / Math.max(patterns.length, 1) * 25, 100);
}

function generateRecommendations(patterns: ManipulationPattern[], severity: string): string[] {
  const recommendations: string[] = [];

  if (severity === 'critical') {
    recommendations.push('URGENT: High manipulation exposure detected - consider reducing contact');
    recommendations.push('Document manipulation instances for personal records');
  }

  if (severity === 'high' || severity === 'critical') {
    recommendations.push('Implement mandatory cooling-off period before major decisions');
    recommendations.push('Seek third-party perspective on important communications');
  }

  if (patterns.some(p => p.patternType.includes('Guilt'))) {
    recommendations.push('Boundary reinforcement training recommended');
  }

  if (patterns.some(p => p.patternType.includes('FOMO'))) {
    recommendations.push('Develop personal value-based decision framework');
  }

  recommendations.push('Regular review of manipulation pattern awareness');

  return recommendations.slice(0, 6);
}
