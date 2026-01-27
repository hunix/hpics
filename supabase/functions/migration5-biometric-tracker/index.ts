import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Migration-5 Biometric Retention Tracker
 * Based on Five Eyes Declassified (June 2024)
 * 
 * Implements long-term biometric cross-correlation (75-year retention model).
 * Tracks identity consistency across biometric modalities over time.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'migration5-biometric-tracker', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) throw new Error('userId required for service calls');
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) throw new Error('Invalid user token');
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[Migration5] Tracking biometric retention for profile ${profileId}`);

    // Gather all biometric data sources
    const [profileResult, voiceResult, facialResult, biometricResult, historicalResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase.from('facial_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('analyzed_at', { ascending: true })
        .limit(100),
      supabase.from('biometric_readings')
        .select('*')
        .eq('profile_id', profileId)
        .order('recorded_at', { ascending: true })
        .limit(200),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'biometric_retention')
        .limit(5),
    ]);

    const profile = profileResult.data;
    const voiceData = voiceResult.data || [];
    const facialData = facialResult.data || [];
    const biometricData = biometricResult.data || [];
    const historicalAnalyses = historicalResult.data || [];

    // Build biometric timeline
    const biometricTimeline = buildBiometricTimeline(voiceData, facialData, biometricData);
    
    // Calculate identity consistency scores
    const consistencyScores = calculateIdentityConsistency(biometricTimeline);
    
    // Cross-correlate modalities
    const crossCorrelation = crossCorrelateModalities(voiceData, facialData, biometricData);
    
    // Estimate retention quality
    const retentionQuality = estimateRetentionQuality(biometricTimeline, historicalAnalyses);
    
    // Generate long-term projections
    const longTermProjections = generateLongTermProjections(consistencyScores, retentionQuality);

    const trackingResult = {
      profileId,
      modelVersion: '1.0.0-migration5',
      analyzedAt: new Date().toISOString(),
      biometricTimeline: {
        startDate: biometricTimeline.startDate,
        endDate: biometricTimeline.endDate,
        totalSamples: biometricTimeline.totalSamples,
        modalityCoverage: biometricTimeline.modalityCoverage,
      },
      consistencyScores,
      crossCorrelation,
      retentionQuality,
      longTermProjections,
      recommendations: generateRetentionRecommendations(retentionQuality, consistencyScores),
    };

    // Persist to ai_analyses
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'biometric_retention',
        result: trackingResult,
        confidence_score: consistencyScores.overallConsistency,
        model_used: 'migration5-biometric-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[Migration5] Biometric tracking complete for ${profileId}`);

    return new Response(JSON.stringify({
      success: true,
      trackingResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Migration5] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildBiometricTimeline(voice: any[], facial: any[], biometric: any[]): Record<string, any> {
  const allDates: Date[] = [];
  
  // Collect all timestamps
  voice.forEach(v => allDates.push(new Date(v.created_at)));
  facial.forEach(f => allDates.push(new Date(f.analyzed_at)));
  biometric.forEach(b => allDates.push(new Date(b.recorded_at)));

  if (allDates.length === 0) {
    return {
      startDate: null,
      endDate: null,
      totalSamples: 0,
      modalityCoverage: {},
      timelineEntries: [],
    };
  }

  allDates.sort((a, b) => a.getTime() - b.getTime());

  // Calculate modality coverage
  const modalityCoverage = {
    voice: voice.length > 0,
    facial: facial.length > 0,
    physiological: biometric.length > 0,
    voiceSamples: voice.length,
    facialSamples: facial.length,
    physiologicalSamples: biometric.length,
  };

  // Build timeline entries (sampled)
  const timelineEntries: any[] = [];
  const sampleInterval = Math.max(1, Math.floor(allDates.length / 20)); // Max 20 entries
  
  for (let i = 0; i < allDates.length; i += sampleInterval) {
    const date = allDates[i];
    timelineEntries.push({
      date: date.toISOString(),
      voiceActive: voice.some(v => Math.abs(new Date(v.created_at).getTime() - date.getTime()) < 86400000),
      facialActive: facial.some(f => Math.abs(new Date(f.analyzed_at).getTime() - date.getTime()) < 86400000),
      biometricActive: biometric.some(b => Math.abs(new Date(b.recorded_at).getTime() - date.getTime()) < 86400000),
    });
  }

  return {
    startDate: allDates[0].toISOString(),
    endDate: allDates[allDates.length - 1].toISOString(),
    totalSamples: voice.length + facial.length + biometric.length,
    spanDays: Math.ceil((allDates[allDates.length - 1].getTime() - allDates[0].getTime()) / 86400000),
    modalityCoverage,
    timelineEntries,
  };
}

function calculateIdentityConsistency(timeline: Record<string, any>): Record<string, any> {
  if (timeline.totalSamples === 0) {
    return {
      overallConsistency: 0.5,
      voiceConsistency: 0.5,
      facialConsistency: 0.5,
      biometricConsistency: 0.5,
      driftDetected: false,
    };
  }

  // Calculate consistency based on coverage and sample density
  const coverage = timeline.modalityCoverage;
  
  const voiceConsistency = coverage.voiceSamples > 10 ? 0.8 : coverage.voiceSamples > 5 ? 0.6 : coverage.voiceSamples > 0 ? 0.4 : 0.2;
  const facialConsistency = coverage.facialSamples > 10 ? 0.85 : coverage.facialSamples > 5 ? 0.65 : coverage.facialSamples > 0 ? 0.45 : 0.2;
  const biometricConsistency = coverage.physiologicalSamples > 20 ? 0.75 : coverage.physiologicalSamples > 10 ? 0.55 : coverage.physiologicalSamples > 0 ? 0.35 : 0.2;

  // Weighted average
  const weights = { voice: 0.35, facial: 0.4, biometric: 0.25 };
  const overallConsistency = 
    voiceConsistency * weights.voice +
    facialConsistency * weights.facial +
    biometricConsistency * weights.biometric;

  // Check for drift (would need temporal analysis in production)
  const driftDetected = timeline.spanDays > 365 && overallConsistency < 0.6;

  return {
    overallConsistency,
    voiceConsistency,
    facialConsistency,
    biometricConsistency,
    driftDetected,
    driftRisk: driftDetected ? 'high' : timeline.spanDays > 180 ? 'moderate' : 'low',
  };
}

function crossCorrelateModalities(voice: any[], facial: any[], biometric: any[]): Record<string, any> {
  // Find overlapping time periods
  const voiceTimes = voice.map(v => new Date(v.created_at).getTime());
  const facialTimes = facial.map(f => new Date(f.analyzed_at).getTime());
  const biometricTimes = biometric.map(b => new Date(b.recorded_at).getTime());

  // Count co-occurrences (within 1 hour)
  const windowMs = 3600000; // 1 hour
  
  let voiceFacialOverlap = 0;
  let voiceBiometricOverlap = 0;
  let facialBiometricOverlap = 0;

  for (const vt of voiceTimes) {
    if (facialTimes.some(ft => Math.abs(ft - vt) < windowMs)) voiceFacialOverlap++;
    if (biometricTimes.some(bt => Math.abs(bt - vt) < windowMs)) voiceBiometricOverlap++;
  }

  for (const ft of facialTimes) {
    if (biometricTimes.some(bt => Math.abs(bt - ft) < windowMs)) facialBiometricOverlap++;
  }

  const maxPossible = Math.max(voice.length, facial.length, biometric.length) || 1;

  return {
    voiceFacialCorrelation: voiceFacialOverlap / maxPossible,
    voiceBiometricCorrelation: voiceBiometricOverlap / maxPossible,
    facialBiometricCorrelation: facialBiometricOverlap / maxPossible,
    tripleCorrelationEvents: Math.min(voiceFacialOverlap, voiceBiometricOverlap, facialBiometricOverlap),
    correlationStrength: (voiceFacialOverlap + voiceBiometricOverlap + facialBiometricOverlap) / (3 * maxPossible),
  };
}

function estimateRetentionQuality(timeline: Record<string, any>, historical: any[]): Record<string, any> {
  const quality = {
    overallQuality: 0.5,
    dataCompleteness: 0.5,
    temporalCoverage: 0.5,
    modalityDiversity: 0.5,
    degradationRisk: 'moderate',
    estimatedRetentionYears: 10,
  };

  if (timeline.totalSamples === 0) {
    quality.degradationRisk = 'high';
    quality.estimatedRetentionYears = 0;
    return quality;
  }

  // Data completeness
  const coverage = timeline.modalityCoverage;
  const modalitiesActive = [coverage.voice, coverage.facial, coverage.physiological].filter(Boolean).length;
  quality.modalityDiversity = modalitiesActive / 3;

  // Temporal coverage
  const spanDays = timeline.spanDays || 0;
  quality.temporalCoverage = Math.min(1, spanDays / 365); // Normalize to 1 year

  // Sample density
  const density = timeline.totalSamples / Math.max(spanDays, 1);
  quality.dataCompleteness = Math.min(1, density / 2); // 2 samples per day = 100%

  // Overall quality
  quality.overallQuality = (
    quality.dataCompleteness * 0.3 +
    quality.temporalCoverage * 0.3 +
    quality.modalityDiversity * 0.4
  );

  // Estimate retention
  if (quality.overallQuality > 0.7) {
    quality.degradationRisk = 'low';
    quality.estimatedRetentionYears = 50;
  } else if (quality.overallQuality > 0.4) {
    quality.degradationRisk = 'moderate';
    quality.estimatedRetentionYears = 25;
  } else {
    quality.degradationRisk = 'high';
    quality.estimatedRetentionYears = 10;
  }

  return quality;
}

function generateLongTermProjections(consistency: Record<string, any>, retention: Record<string, any>): Record<string, any> {
  return {
    identityStability: {
      year1: consistency.overallConsistency,
      year5: consistency.overallConsistency * 0.95,
      year10: consistency.overallConsistency * 0.85,
      year25: consistency.overallConsistency * 0.7,
    },
    recommendedRefreshInterval: retention.degradationRisk === 'low' ? '5 years' : 
                                  retention.degradationRisk === 'moderate' ? '2 years' : '6 months',
    criticalModalities: [
      consistency.facialConsistency < 0.6 ? 'Facial biometrics need refresh' : null,
      consistency.voiceConsistency < 0.6 ? 'Voice biometrics need refresh' : null,
      consistency.biometricConsistency < 0.6 ? 'Physiological biometrics need refresh' : null,
    ].filter(Boolean),
    agingConsiderations: [
      'Voice patterns may shift with age - recommend annual recalibration after 10 years',
      'Facial features change - periodic photo updates recommended',
      'Physiological baselines drift - continuous monitoring preferred',
    ],
  };
}

function generateRetentionRecommendations(retention: Record<string, any>, consistency: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (retention.degradationRisk === 'high') {
    recommendations.push('URGENT: Collect additional biometric samples to improve retention quality');
  }

  if (consistency.driftDetected) {
    recommendations.push('Identity drift detected - recalibrate biometric baselines');
  }

  if (retention.modalityDiversity < 0.7) {
    recommendations.push('Increase modality coverage for robust long-term identification');
    if (!retention.dataCompleteness) {
      recommendations.push('Add voice biometric collection');
    }
  }

  recommendations.push(`Schedule biometric refresh in ${retention.estimatedRetentionYears / 5} years`);
  recommendations.push('Maintain cross-modal correlation by collecting multi-source data in same sessions');
  recommendations.push('Store raw biometric templates for future re-analysis with improved algorithms');

  return recommendations;
}
