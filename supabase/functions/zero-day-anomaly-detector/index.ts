/**
 * Zero-Day Anomaly Detector Edge Function (v6.0)
 * 
 * Detects novel behavioral patterns that don't match any known baseline
 * or historical pattern, indicating potential new threats or opportunities.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZeroDayAnomaly {
  anomalyId: string;
  profileId: string;
  profileName: string;
  detectedAt: string;
  noveltyScore: number;
  description: string;
  affectedDomains: string[];
  baselineDeviations: Array<{
    baseline: string;
    deviation: number;
    direction: 'above' | 'below';
  }>;
  potentialInterpretations: string[];
  urgency: 'critical' | 'high' | 'medium' | 'low';
  recommendedActions: string[];
  similarHistoricalPatterns: string[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({
      ok: true,
      function: 'zero-day-anomaly-detector',
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

    console.log(`[zero-day-anomaly-detector] Processing for user: ${user.id}, profile: ${profileId || 'all'}`);

    // Fetch all required data
    const [
      baselinesResult,
      anomaliesResult,
      communicationsResult,
      observationsResult,
      biometricsResult,
      profilesResult,
    ] = await Promise.all([
      supabase.from('behavioral_baselines').select('*')
        .eq('user_id', user.id)
        .order('baseline_date', { ascending: false })
        .limit(100),
      supabase.from('behavioral_anomalies').select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(200),
      profileId 
        ? supabase.from('communications').select('*')
            .eq('profile_id', profileId)
            .order('communication_date', { ascending: false })
            .limit(100)
        : supabase.from('communications').select('*')
            .eq('user_id', user.id)
            .order('communication_date', { ascending: false })
            .limit(500),
      profileId
        ? supabase.from('contact_observations').select('*')
            .eq('profile_id', profileId)
            .order('observation_date', { ascending: false })
            .limit(50)
        : supabase.from('contact_observations').select('*')
            .eq('user_id', user.id)
            .order('observation_date', { ascending: false })
            .limit(200),
      supabase.from('interaction_biometrics').select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(100),
      supabase.from('profiles').select('id, first_name, last_name')
        .eq('user_id', user.id)
        .limit(200),
    ]);

    const baselines = baselinesResult.data || [];
    const historicalAnomalies = anomaliesResult.data || [];
    const communications = communicationsResult.data || [];
    const observations = observationsResult.data || [];
    const biometrics = biometricsResult.data || [];
    const profiles = profilesResult.data || [];

    // Build profile name map
    const profileNameMap = new Map<string, string>();
    profiles.forEach(p => {
      profileNameMap.set(p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown');
    });

    // Extract known anomaly patterns
    const knownAnomalyTypes = new Set(historicalAnomalies.map(a => a.anomaly_type));
    
    // Build baseline metrics
    const baselineMetrics = buildBaselineMetrics(baselines);
    
    // Detect zero-day anomalies
    const zeroDayAnomalies: ZeroDayAnomaly[] = [];

    // 1. Analyze communication patterns for novel deviations
    const commAnomalies = detectCommunicationAnomalies(
      communications, 
      baselineMetrics, 
      knownAnomalyTypes,
      profileNameMap
    );
    zeroDayAnomalies.push(...commAnomalies);

    // 2. Analyze behavioral observations for novel patterns
    const observationAnomalies = detectObservationAnomalies(
      observations,
      baselineMetrics,
      knownAnomalyTypes,
      profileNameMap
    );
    zeroDayAnomalies.push(...observationAnomalies);

    // 3. Analyze biometric patterns for novel signatures
    const biometricAnomalies = detectBiometricAnomalies(
      biometrics,
      baselineMetrics,
      knownAnomalyTypes,
      profileNameMap
    );
    zeroDayAnomalies.push(...biometricAnomalies);

    // 4. Cross-domain correlation analysis
    const crossDomainAnomalies = detectCrossDomainAnomalies(
      communications,
      observations,
      biometrics,
      baselineMetrics,
      profileNameMap
    );
    zeroDayAnomalies.push(...crossDomainAnomalies);

    // Calculate overall novelty level
    const avgNovelty = zeroDayAnomalies.length > 0
      ? zeroDayAnomalies.reduce((sum, a) => sum + a.noveltyScore, 0) / zeroDayAnomalies.length
      : 0;

    let overallNoveltyLevel: 'unprecedented' | 'rare' | 'uncommon' | 'normal' = 'normal';
    if (avgNovelty > 0.9) overallNoveltyLevel = 'unprecedented';
    else if (avgNovelty > 0.7) overallNoveltyLevel = 'rare';
    else if (avgNovelty > 0.5) overallNoveltyLevel = 'uncommon';

    // Environmental factors that might explain anomalies
    const environmentalFactors = identifyEnvironmentalFactors(communications, observations);

    // Calculate false positive probability based on data quality
    const dataQuality = calculateDataQuality(baselines, historicalAnomalies);
    const falsePositiveProbability = Math.max(0.1, 1 - dataQuality);

    // Determine if escalation is required
    const escalationRequired = zeroDayAnomalies.some(a => 
      a.urgency === 'critical' || (a.urgency === 'high' && a.noveltyScore > 0.8)
    );

    const result = {
      zeroDayAnomalies,
      overallNoveltyLevel,
      environmentalFactors,
      falsePositiveProbability: Math.round(falsePositiveProbability * 100) / 100,
      escalationRequired,
      analysisMetadata: {
        baselinesUsed: baselines.length,
        historicalAnomaliesCompared: historicalAnomalies.length,
        communicationsAnalyzed: communications.length,
        observationsAnalyzed: observations.length,
        biometricsAnalyzed: biometrics.length,
        knownPatternTypes: knownAnomalyTypes.size,
      },
    };

    // Save detected zero-day anomalies to behavioral_anomalies table
    for (const anomaly of zeroDayAnomalies) {
      await supabase.from('behavioral_anomalies').insert({
        user_id: user.id,
        profile_id: anomaly.profileId,
        anomaly_type: 'zero_day_' + anomaly.affectedDomains[0],
        description: anomaly.description,
        severity: anomaly.urgency,
        deviation_score: anomaly.noveltyScore,
        is_zero_day: true,
        novelty_score: anomaly.noveltyScore,
        matched_known_patterns: anomaly.similarHistoricalPatterns,
        detected_at: new Date().toISOString(),
      });
    }

    // Save analysis result
    const targetProfileId = profileId || user.id;
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: targetProfileId,
      analysis_type: 'zero_day_anomaly',
      result,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,analysis_type',
    });

    console.log(`[zero-day-anomaly-detector] Found ${zeroDayAnomalies.length} zero-day anomalies, novelty: ${overallNoveltyLevel}`);

    return new Response(JSON.stringify({
      success: true,
      result,
      confidence: 1 - falsePositiveProbability,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[zero-day-anomaly-detector] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface BaselineMetrics {
  communicationFrequency: { mean: number; stdDev: number };
  responseTime: { mean: number; stdDev: number };
  sentimentRange: { min: number; max: number; mean: number };
  activityHours: Set<number>;
  topicPatterns: Map<string, number>;
}

function buildBaselineMetrics(baselines: any[]): BaselineMetrics {
  const metrics: BaselineMetrics = {
    communicationFrequency: { mean: 5, stdDev: 2 },
    responseTime: { mean: 120, stdDev: 60 },
    sentimentRange: { min: -0.3, max: 0.7, mean: 0.2 },
    activityHours: new Set([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
    topicPatterns: new Map(),
  };

  if (baselines.length > 0) {
    // Extract metrics from actual baselines
    baselines.forEach(b => {
      if (b.metrics) {
        const m = typeof b.metrics === 'string' ? JSON.parse(b.metrics) : b.metrics;
        if (m.communicationFrequency) {
          metrics.communicationFrequency = m.communicationFrequency;
        }
        if (m.responseTime) {
          metrics.responseTime = m.responseTime;
        }
      }
    });
  }

  return metrics;
}

function detectCommunicationAnomalies(
  communications: any[],
  baselines: BaselineMetrics,
  knownTypes: Set<string>,
  nameMap: Map<string, string>
): ZeroDayAnomaly[] {
  const anomalies: ZeroDayAnomaly[] = [];
  
  // Group by profile
  const profileComms = new Map<string, any[]>();
  communications.forEach(c => {
    if (!c.profile_id) return;
    const comms = profileComms.get(c.profile_id) || [];
    comms.push(c);
    profileComms.set(c.profile_id, comms);
  });

  profileComms.forEach((comms, profileId) => {
    // Check for unusual timing patterns
    const hours = comms.map(c => new Date(c.communication_date).getHours());
    const unusualHours = hours.filter(h => !baselines.activityHours.has(h));
    
    if (unusualHours.length > comms.length * 0.3) {
      const anomalyType = 'unusual_timing';
      if (!knownTypes.has(anomalyType)) {
        anomalies.push({
          anomalyId: `comm-timing-${profileId}-${Date.now()}`,
          profileId,
          profileName: nameMap.get(profileId) || 'Unknown',
          detectedAt: new Date().toISOString(),
          noveltyScore: 0.75,
          description: 'Unusual communication timing pattern detected - activity outside normal hours',
          affectedDomains: ['communication', 'behavioral'],
          baselineDeviations: [{
            baseline: 'activity_hours',
            deviation: unusualHours.length / comms.length,
            direction: 'above',
          }],
          potentialInterpretations: [
            'Change in work schedule or timezone',
            'Stress or sleep disruption',
            'Urgent matters requiring off-hours communication',
            'Potential account compromise',
          ],
          urgency: 'medium',
          recommendedActions: [
            'Verify identity through out-of-band channel',
            'Inquire about schedule changes',
            'Monitor for additional anomalies',
          ],
          similarHistoricalPatterns: [],
        });
      }
    }

    // Check for sentiment anomalies
    const sentiments = comms.filter(c => c.sentiment_score !== null).map(c => c.sentiment_score);
    if (sentiments.length > 5) {
      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      if (avgSentiment < baselines.sentimentRange.min - 0.3 || avgSentiment > baselines.sentimentRange.max + 0.3) {
        anomalies.push({
          anomalyId: `comm-sentiment-${profileId}-${Date.now()}`,
          profileId,
          profileName: nameMap.get(profileId) || 'Unknown',
          detectedAt: new Date().toISOString(),
          noveltyScore: 0.8,
          description: `Extreme sentiment deviation detected (avg: ${avgSentiment.toFixed(2)})`,
          affectedDomains: ['communication', 'behavioral', 'social'],
          baselineDeviations: [{
            baseline: 'sentiment_range',
            deviation: Math.abs(avgSentiment - baselines.sentimentRange.mean),
            direction: avgSentiment > baselines.sentimentRange.mean ? 'above' : 'below',
          }],
          potentialInterpretations: [
            'Significant life event (positive or negative)',
            'Relationship status change',
            'Professional success or setback',
            'Manipulation attempt',
          ],
          urgency: avgSentiment < -0.5 ? 'high' : 'medium',
          recommendedActions: [
            'Conduct empathetic check-in',
            'Gather context through indirect inquiries',
            'Prepare support resources if needed',
          ],
          similarHistoricalPatterns: [],
        });
      }
    }
  });

  return anomalies;
}

function detectObservationAnomalies(
  observations: any[],
  baselines: BaselineMetrics,
  knownTypes: Set<string>,
  nameMap: Map<string, string>
): ZeroDayAnomaly[] {
  const anomalies: ZeroDayAnomaly[] = [];
  
  // Check for clusters of negative observations
  const recentObs = observations.filter(o => {
    const daysSince = (Date.now() - new Date(o.observation_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  const profileClusters = new Map<string, any[]>();
  recentObs.forEach(o => {
    if (!o.profile_id) return;
    const cluster = profileClusters.get(o.profile_id) || [];
    cluster.push(o);
    profileClusters.set(o.profile_id, cluster);
  });

  profileClusters.forEach((cluster, profileId) => {
    if (cluster.length >= 3) {
      // Multiple observations in short period is unusual
      anomalies.push({
        anomalyId: `obs-cluster-${profileId}-${Date.now()}`,
        profileId,
        profileName: nameMap.get(profileId) || 'Unknown',
        detectedAt: new Date().toISOString(),
        noveltyScore: 0.7,
        description: `Unusual observation cluster: ${cluster.length} observations in 7 days`,
        affectedDomains: ['behavioral'],
        baselineDeviations: [{
          baseline: 'observation_frequency',
          deviation: cluster.length / 7,
          direction: 'above',
        }],
        potentialInterpretations: [
          'Increased monitoring due to concerns',
          'Subject exhibiting unusual behavior',
          'Preparation for significant interaction',
        ],
        urgency: 'low',
        recommendedActions: [
          'Review observation content for patterns',
          'Assess if increased attention is warranted',
        ],
        similarHistoricalPatterns: [],
      });
    }
  });

  return anomalies;
}

function detectBiometricAnomalies(
  biometrics: any[],
  baselines: BaselineMetrics,
  knownTypes: Set<string>,
  nameMap: Map<string, string>
): ZeroDayAnomaly[] {
  const anomalies: ZeroDayAnomaly[] = [];
  
  // Check for stress patterns
  const highStressReadings = biometrics.filter(b => 
    (b.stress_level && b.stress_level > 0.8) ||
    (b.hrv_score && b.hrv_score < 20)
  );

  if (highStressReadings.length > biometrics.length * 0.3 && biometrics.length >= 5) {
    const profileId = highStressReadings[0]?.profile_id;
    if (profileId) {
      anomalies.push({
        anomalyId: `bio-stress-${profileId}-${Date.now()}`,
        profileId,
        profileName: nameMap.get(profileId) || 'Unknown',
        detectedAt: new Date().toISOString(),
        noveltyScore: 0.85,
        description: 'Sustained elevated stress indicators detected across multiple interactions',
        affectedDomains: ['biometric', 'behavioral', 'financial'],
        baselineDeviations: [{
          baseline: 'stress_level',
          deviation: 0.4,
          direction: 'above',
        }],
        potentialInterpretations: [
          'External life stressor affecting interactions',
          'Concealment of important information',
          'Preparation for difficult conversation',
          'Medical condition',
        ],
        urgency: 'high',
        recommendedActions: [
          'Approach with sensitivity',
          'Avoid high-pressure topics',
          'Create safe space for disclosure',
          'Monitor for changes',
        ],
        similarHistoricalPatterns: [],
      });
    }
  }

  return anomalies;
}

function detectCrossDomainAnomalies(
  communications: any[],
  observations: any[],
  biometrics: any[],
  baselines: BaselineMetrics,
  nameMap: Map<string, string>
): ZeroDayAnomaly[] {
  const anomalies: ZeroDayAnomaly[] = [];
  
  // Find profiles with anomalies in multiple domains
  const profileIssues = new Map<string, Set<string>>();
  
  // Check communication issues
  communications.forEach(c => {
    if (c.profile_id && c.sentiment_score && c.sentiment_score < -0.5) {
      const issues = profileIssues.get(c.profile_id) || new Set();
      issues.add('communication');
      profileIssues.set(c.profile_id, issues);
    }
  });
  
  // Check observation issues
  observations.forEach(o => {
    if (o.profile_id && o.importance_score && o.importance_score > 8) {
      const issues = profileIssues.get(o.profile_id) || new Set();
      issues.add('behavioral');
      profileIssues.set(o.profile_id, issues);
    }
  });
  
  // Check biometric issues
  biometrics.forEach(b => {
    if (b.profile_id && b.stress_level && b.stress_level > 0.7) {
      const issues = profileIssues.get(b.profile_id) || new Set();
      issues.add('biometric');
      profileIssues.set(b.profile_id, issues);
    }
  });
  
  // Flag profiles with issues in 2+ domains
  profileIssues.forEach((domains, profileId) => {
    if (domains.size >= 2) {
      anomalies.push({
        anomalyId: `cross-domain-${profileId}-${Date.now()}`,
        profileId,
        profileName: nameMap.get(profileId) || 'Unknown',
        detectedAt: new Date().toISOString(),
        noveltyScore: 0.9,
        description: `Cross-domain anomaly: Issues detected in ${Array.from(domains).join(', ')} domains`,
        affectedDomains: Array.from(domains),
        baselineDeviations: Array.from(domains).map(d => ({
          baseline: d,
          deviation: 0.5,
          direction: 'above' as const,
        })),
        potentialInterpretations: [
          'Significant life event causing multi-domain impact',
          'Coordinated deception attempt',
          'Emerging crisis situation',
          'Relationship status change',
        ],
        urgency: 'critical',
        recommendedActions: [
          'Immediate holistic assessment recommended',
          'Cross-reference all data sources',
          'Consider direct intervention',
          'Prepare contingency responses',
        ],
        similarHistoricalPatterns: [],
      });
    }
  });

  return anomalies;
}

function identifyEnvironmentalFactors(communications: any[], observations: any[]): string[] {
  const factors: string[] = [];
  
  // Check for seasonal patterns
  const now = new Date();
  const month = now.getMonth();
  if (month === 11 || month === 0) {
    factors.push('Holiday season may affect behavior patterns');
  }
  if (month >= 5 && month <= 7) {
    factors.push('Summer schedules may explain timing variations');
  }
  
  // Check for day-of-week patterns
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    factors.push('Weekend activity may differ from weekday baselines');
  }
  
  return factors;
}

function calculateDataQuality(baselines: any[], anomalies: any[]): number {
  let quality = 0.5; // Base quality
  
  // More baselines = better quality
  if (baselines.length >= 10) quality += 0.2;
  else if (baselines.length >= 5) quality += 0.1;
  
  // More historical anomalies for comparison = better quality
  if (anomalies.length >= 50) quality += 0.2;
  else if (anomalies.length >= 20) quality += 0.1;
  
  return Math.min(1, quality);
}
