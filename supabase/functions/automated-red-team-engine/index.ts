/**
 * Automated Red Team (ART) Engine Edge Function (v6.0)
 * 
 * Simulates attacks against the user's own OPSEC posture by analyzing
 * how an adversary would approach exploitation using available data.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttackVector {
  vector: string;
  exploitability: 'trivial' | 'easy' | 'moderate' | 'difficult' | 'expert';
  attackPath: string[];
  requiredResources: 'low' | 'medium' | 'high';
  potentialImpact: 'critical' | 'high' | 'medium' | 'low';
  mitigationSteps: string[];
  timeToExploit: string;
}

interface AttackNarrative {
  scenario: string;
  steps: string[];
  successProbability: number;
  detectability: 'low' | 'medium' | 'high';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'automated-red-team-engine',
      timestamp: Date.now(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;

    console.log(`[automated-red-team-engine] Processing for user: ${user.id}, profile: ${profileId || 'self'}`);

    // Fetch security-relevant data
    const [
      opsecResult,
      footprintResult,
      socialEngResult,
      profilesResult,
      relationshipsResult,
      communicationsResult,
    ] = await Promise.all([
      supabase.from('opsec_assessments').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('digital_footprint_items').select('*')
        .eq('user_id', user.id)
        .limit(50),
      supabase.from('social_engineering_incidents').select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(20),
      supabase.from('profiles').select('*')
        .eq('user_id', user.id)
        .limit(100),
      supabase.from('contact_relationships').select('*')
        .eq('user_id', user.id)
        .limit(200),
      supabase.from('communications').select('*')
        .eq('user_id', user.id)
        .order('communication_date', { ascending: false })
        .limit(100),
    ]);

    const opsecData = opsecResult.data || [];
    const footprints = footprintResult.data || [];
    const socialEngIncidents = socialEngResult.data || [];
    const profiles = profilesResult.data || [];
    const relationships = relationshipsResult.data || [];
    const communications = communicationsResult.data || [];

    // Analyze attack vectors
    const attackVectors: AttackVector[] = [];

    // 1. Social Engineering Vector
    const socialEngScore = analyzeSocialEngineeringRisk(socialEngIncidents, profiles);
    attackVectors.push({
      vector: 'social_engineering',
      exploitability: socialEngScore > 0.7 ? 'easy' : socialEngScore > 0.4 ? 'moderate' : 'difficult',
      attackPath: [
        'Identify high-trust contact',
        'Craft pretext using relationship data',
        'Initial engagement via preferred channel',
        'Escalate to sensitive request',
      ],
      requiredResources: 'low',
      potentialImpact: 'high',
      mitigationSteps: [
        'Implement verification protocols for sensitive requests',
        'Train on common social engineering tactics',
        'Establish out-of-band verification channels',
        'Limit information shared in profiles',
      ],
      timeToExploit: 'hours',
    });

    // 2. OSINT Exposure Vector
    const osintScore = analyzeOsintExposure(footprints, profiles);
    attackVectors.push({
      vector: 'osint',
      exploitability: osintScore > 0.7 ? 'trivial' : osintScore > 0.4 ? 'easy' : 'moderate',
      attackPath: [
        'Aggregate public digital footprint',
        'Cross-reference social media presence',
        'Build comprehensive profile',
        'Identify exploitation opportunities',
      ],
      requiredResources: 'low',
      potentialImpact: 'medium',
      mitigationSteps: [
        'Audit and remove unnecessary digital presence',
        'Use privacy settings on all platforms',
        'Separate personal and professional identities',
        'Regular OSINT self-assessment',
      ],
      timeToExploit: 'hours',
    });

    // 3. Relationship Mapping Vector
    const relationshipScore = analyzeRelationshipExposure(relationships, profiles);
    attackVectors.push({
      vector: 'relationship',
      exploitability: relationshipScore > 0.6 ? 'easy' : 'moderate',
      attackPath: [
        'Map social/professional network',
        'Identify trusted intermediaries',
        'Approach via trusted contact',
        'Exploit transitive trust',
      ],
      requiredResources: 'medium',
      potentialImpact: 'high',
      mitigationSteps: [
        'Compartmentalize network knowledge',
        'Verify requests through direct channels',
        'Limit visible connection data',
        'Monitor for contact impersonation',
      ],
      timeToExploit: 'days',
    });

    // 4. Communication Pattern Analysis
    const commScore = analyzeCommunicationPatterns(communications);
    attackVectors.push({
      vector: 'communication',
      exploitability: commScore > 0.5 ? 'moderate' : 'difficult',
      attackPath: [
        'Analyze communication timing patterns',
        'Identify preferred channels',
        'Monitor for security lapses',
        'Time attack for maximum impact',
      ],
      requiredResources: 'medium',
      potentialImpact: 'medium',
      mitigationSteps: [
        'Use encrypted communication channels',
        'Randomize communication patterns when possible',
        'Implement communication security protocols',
        'Regular channel security audits',
      ],
      timeToExploit: 'days',
    });

    // 5. Digital Footprint Exploitation
    const digitalScore = analyzeDigitalFootprint(footprints);
    attackVectors.push({
      vector: 'digital',
      exploitability: digitalScore > 0.6 ? 'easy' : digitalScore > 0.3 ? 'moderate' : 'difficult',
      attackPath: [
        'Enumerate digital accounts',
        'Check for credential reuse',
        'Identify weak authentication',
        'Attempt account takeover',
      ],
      requiredResources: 'low',
      potentialImpact: 'critical',
      mitigationSteps: [
        'Use unique passwords per service',
        'Enable 2FA on all accounts',
        'Regular credential audit',
        'Monitor for unauthorized access',
      ],
      timeToExploit: 'minutes',
    });

    // 6. Physical Security
    attackVectors.push({
      vector: 'physical',
      exploitability: 'moderate',
      attackPath: [
        'Conduct surveillance of known locations',
        'Identify access patterns',
        'Social engineer physical access',
        'Deploy physical collection methods',
      ],
      requiredResources: 'high',
      potentialImpact: 'critical',
      mitigationSteps: [
        'Vary routine patterns',
        'Secure physical access points',
        'TSCM sweeps for sensitive areas',
        'Physical security awareness training',
      ],
      timeToExploit: 'weeks',
    });

    // Generate attack narratives
    const simulatedAttackNarratives: AttackNarrative[] = generateAttackNarratives(
      attackVectors,
      profiles,
      relationships
    );

    // Calculate overall vulnerability score
    const vectorScores = [socialEngScore, osintScore, relationshipScore, commScore, digitalScore];
    const overallVulnerabilityScore = Math.round(
      vectorScores.reduce((a, b) => a + b, 0) / vectorScores.length * 100
    );

    // Generate prioritized recommendations
    const prioritizedRecommendations = generateRecommendations(attackVectors, overallVulnerabilityScore);

    // Compare to baseline if previous assessment exists
    const previousAssessment = opsecData.length > 0 ? opsecData[0] : null;
    const comparisonToBaseline = previousAssessment ? {
      improvement: previousAssessment.overall_score 
        ? Math.round((previousAssessment.overall_score - overallVulnerabilityScore) * 10) / 10
        : 0,
      newVulnerabilities: attackVectors.filter(v => v.exploitability === 'trivial' || v.exploitability === 'easy').length,
      resolvedVulnerabilities: 0, // Would need historical comparison
    } : null;

    const result = {
      overallVulnerabilityScore,
      attackVectors,
      simulatedAttackNarratives,
      prioritizedRecommendations,
      comparisonToBaseline,
      assessmentDate: new Date().toISOString(),
      dataSourcesSurveyed: {
        footprints: footprints.length,
        socialEngIncidents: socialEngIncidents.length,
        profiles: profiles.length,
        relationships: relationships.length,
        communications: communications.length,
      },
    };

    // Update opsec_assessments with red team findings
    await supabase.from('opsec_assessments').insert({
      user_id: user.id,
      profile_id: profileId || null,
      assessment_type: 'automated_red_team',
      overall_score: overallVulnerabilityScore,
      vulnerabilities: attackVectors,
      recommendations: prioritizedRecommendations,
      created_at: new Date().toISOString(),
    });

    // Save to ai_analyses
    const targetProfileId = profileId || user.id;
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: targetProfileId,
      analysis_type: 'automated_red_team',
      result,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,analysis_type',
    });

    console.log(`[automated-red-team-engine] Completed: vulnerability=${overallVulnerabilityScore}`);

    return new Response(JSON.stringify({
      success: true,
      result,
      confidence: 0.8,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[automated-red-team-engine] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeSocialEngineeringRisk(incidents: any[], profiles: any[]): number {
  let risk = 0.3; // Base risk
  
  // Historical incidents increase risk
  if (incidents.length > 0) {
    risk += Math.min(0.3, incidents.length * 0.05);
    // Recent incidents increase risk more
    const recentIncidents = incidents.filter(i => {
      const daysSince = (Date.now() - new Date(i.detected_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 90;
    });
    risk += recentIncidents.length * 0.1;
  }
  
  // High-value profiles increase targeting risk
  const highValueProfiles = profiles.filter(p => p.is_favorite || p.relationship_type === 'client');
  if (highValueProfiles.length > 10) {
    risk += 0.1;
  }
  
  return Math.min(1, risk);
}

function analyzeOsintExposure(footprints: any[], profiles: any[]): number {
  let exposure = 0.2;
  
  // Each digital footprint item increases exposure
  exposure += Math.min(0.5, footprints.length * 0.01);
  
  // Profiles with rich data increase exposure
  const richProfiles = profiles.filter(p => 
    p.email && p.phone_number && p.organization
  );
  exposure += Math.min(0.2, richProfiles.length * 0.01);
  
  return Math.min(1, exposure);
}

function analyzeRelationshipExposure(relationships: any[], profiles: any[]): number {
  let exposure = 0.2;
  
  // Dense relationship networks are more mappable
  if (relationships.length > 50) exposure += 0.2;
  if (relationships.length > 100) exposure += 0.2;
  
  // Profiles with visible relationship data
  const withRelationships = profiles.filter(p => p.relationship_type);
  exposure += Math.min(0.2, withRelationships.length * 0.01);
  
  return Math.min(1, exposure);
}

function analyzeCommunicationPatterns(communications: any[]): number {
  let exposure = 0.2;
  
  if (communications.length > 50) {
    exposure += 0.2;
  }
  
  // Check for pattern regularity
  const channels = new Set(communications.map(c => c.channel));
  if (channels.size < 3) {
    exposure += 0.1; // Limited channel diversity
  }
  
  return Math.min(1, exposure);
}

function analyzeDigitalFootprint(footprints: any[]): number {
  let score = 0.2;
  
  score += Math.min(0.4, footprints.length * 0.01);
  
  // High-risk footprint items
  const highRisk = footprints.filter(f => 
    f.platform_type === 'financial' || 
    f.platform_type === 'email' ||
    f.exposure_level === 'high'
  );
  score += Math.min(0.3, highRisk.length * 0.05);
  
  return Math.min(1, score);
}

function generateAttackNarratives(vectors: AttackVector[], profiles: any[], relationships: any[]): AttackNarrative[] {
  const narratives: AttackNarrative[] = [];
  
  // Easy attack scenario
  const easyVectors = vectors.filter(v => v.exploitability === 'trivial' || v.exploitability === 'easy');
  if (easyVectors.length > 0) {
    narratives.push({
      scenario: 'Opportunistic Social Engineering Attack',
      steps: [
        'Adversary discovers target through open source research',
        'Identifies trusted contacts from visible network',
        'Crafts phishing pretext using relationship context',
        'Delivers targeted message via preferred channel',
        'Extracts credentials or sensitive information',
      ],
      successProbability: 0.65,
      detectability: 'low',
    });
  }
  
  // Persistent threat scenario
  narratives.push({
    scenario: 'Advanced Persistent Approach',
    steps: [
      'Comprehensive OSINT collection over weeks',
      'Build detailed target profile and network map',
      'Establish rapport through shared connection',
      'Gradually escalate information requests',
      'Maintain long-term access for intelligence collection',
    ],
    successProbability: 0.45,
    detectability: 'medium',
  });
  
  // Insider threat scenario
  if (relationships.length > 20) {
    narratives.push({
      scenario: 'Trusted Insider Exploitation',
      steps: [
        'Identify vulnerable or compromised contact',
        'Leverage existing trust relationship',
        'Extract information through legitimate-seeming requests',
        'Use insider access to expand collection',
      ],
      successProbability: 0.55,
      detectability: 'low',
    });
  }
  
  return narratives;
}

function generateRecommendations(vectors: AttackVector[], overallScore: number): string[] {
  const recommendations: string[] = [];
  
  if (overallScore > 70) {
    recommendations.push('CRITICAL: Implement immediate security hardening measures');
  }
  
  // Prioritize by exploitability
  const criticalVectors = vectors.filter(v => 
    v.exploitability === 'trivial' || v.exploitability === 'easy'
  );
  
  criticalVectors.forEach(v => {
    recommendations.push(`Address ${v.vector} vulnerability: ${v.mitigationSteps[0]}`);
  });
  
  recommendations.push('Conduct regular security awareness refresher training');
  recommendations.push('Implement zero-trust verification for sensitive requests');
  recommendations.push('Schedule quarterly red team assessments');
  
  return recommendations.slice(0, 10);
}
