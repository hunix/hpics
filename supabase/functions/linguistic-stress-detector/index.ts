// Linguistic Stress Detector - SCIP 2025
// NLP modules detecting micro-shifts in leadership rhetoric for strategic pivot detection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinguisticMarker {
  markerType: string;
  frequency: number;
  baseline: number;
  deviation: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
}

interface StrategicShift {
  shiftType: string;
  confidence: number;
  indicators: string[];
  timeframe: string;
  implications: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'linguistic-stress-detector', 
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
    const analysisWindow = body.analysisWindow || body.analysis_window || 90; // days

    if (!profileId || !userId) {
      throw new Error('Missing required parameters: profileId and userId');
    }

    console.log(`[LinguisticStress] Analyzing rhetoric patterns for profile: ${profileId}`);

    // Fetch communication history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - analysisWindow);

    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .gte('occurred_at', cutoffDate.toISOString())
      .order('occurred_at', { ascending: true })
      .limit(500);

    const { data: messages } = await supabase
      .from('messages')
      .select('*, conversations!inner(profile_id)')
      .eq('conversations.profile_id', profileId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(500);

    // Linguistic Baseline Establishment
    const baseline = establishLinguisticBaseline(communications || [], messages || []);

    // Micro-Shift Detection
    const microShifts = detectMicroShifts(communications || [], messages || [], baseline);

    // Stress Indicator Analysis
    const stressIndicators = analyzeStressIndicators(communications || [], messages || []);

    // Cognitive Load Markers
    const cognitiveLoadMarkers = analyzeCognitiveLoad(messages || []);

    // Strategic Shift Detection
    const strategicShifts = detectStrategicShifts(microShifts, stressIndicators);

    // Temporal Pattern Analysis
    const temporalPatterns = analyzeTemporalPatterns(communications || [], microShifts);

    // Early Warning Generation
    const earlyWarnings = generateEarlyWarnings(strategicShifts, stressIndicators);

    const result = {
      profileId,
      analysisType: 'linguistic_stress_detection',
      baseline,
      microShifts,
      stressIndicators,
      cognitiveLoadMarkers,
      strategicShifts,
      temporalPatterns,
      earlyWarnings,
      metrics: {
        overallStressLevel: calculateOverallStress(stressIndicators),
        shiftProbability: calculateShiftProbability(strategicShifts),
        rhetoricalConsistency: calculateConsistency(baseline, microShifts)
      },
      recommendations: generateRecommendations(strategicShifts, earlyWarnings),
      confidence: 0.84,
      timestamp: new Date().toISOString()
    };

    // Persist analysis
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'linguistic_stress_detection',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[LinguisticStress] Analysis complete. Stress level: ${result.metrics.overallStressLevel}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[LinguisticStress] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function establishLinguisticBaseline(comms: any[], messages: any[]): any {
  const allContent = [
    ...comms.map(c => c.notes || ''),
    ...messages.map(m => m.content || '')
  ].filter(c => c.length > 0);

  if (allContent.length === 0) {
    return { insufficient_data: true };
  }

  // Calculate baseline metrics
  const avgLength = allContent.reduce((sum, c) => sum + c.length, 0) / allContent.length;
  const avgWordCount = allContent.reduce((sum, c) => sum + c.split(/\s+/).length, 0) / allContent.length;
  
  // Pronoun usage baseline
  const pronounPatterns = analyzePronounUsage(allContent);
  
  // Hedging language baseline
  const hedgingBaseline = analyzeHedgingLanguage(allContent);
  
  // Certainty markers
  const certaintyBaseline = analyzeCertaintyMarkers(allContent);
  
  // Emotional language
  const emotionalBaseline = analyzeEmotionalLanguage(allContent);

  return {
    sampleSize: allContent.length,
    avgMessageLength: Math.round(avgLength),
    avgWordCount: Math.round(avgWordCount),
    pronounPatterns,
    hedgingBaseline,
    certaintyBaseline,
    emotionalBaseline,
    vocabularyDiversity: calculateVocabularyDiversity(allContent)
  };
}

function analyzePronounUsage(content: string[]): any {
  const allText = content.join(' ').toLowerCase();
  const words = allText.split(/\s+/);
  const totalWords = words.length;

  const pronounCounts = {
    firstPersonSingular: (allText.match(/\b(i|me|my|mine|myself)\b/gi) || []).length,
    firstPersonPlural: (allText.match(/\b(we|us|our|ours|ourselves)\b/gi) || []).length,
    secondPerson: (allText.match(/\b(you|your|yours|yourself)\b/gi) || []).length,
    thirdPerson: (allText.match(/\b(he|she|it|they|him|her|them|his|hers|its|their|theirs)\b/gi) || []).length
  };

  return {
    ...pronounCounts,
    firstPersonRatio: (pronounCounts.firstPersonSingular + pronounCounts.firstPersonPlural) / totalWords,
    weVsIRatio: pronounCounts.firstPersonPlural / Math.max(pronounCounts.firstPersonSingular, 1)
  };
}

function analyzeHedgingLanguage(content: string[]): any {
  const hedgingTerms = [
    'maybe', 'perhaps', 'possibly', 'might', 'could', 'would',
    'somewhat', 'sort of', 'kind of', 'probably', 'likely',
    'i think', 'i believe', 'i guess', 'it seems', 'appear'
  ];

  const allText = content.join(' ').toLowerCase();
  const totalWords = allText.split(/\s+/).length;

  let hedgingCount = 0;
  hedgingTerms.forEach(term => {
    const matches = allText.match(new RegExp(`\\b${term}\\b`, 'gi'));
    if (matches) hedgingCount += matches.length;
  });

  return {
    hedgingFrequency: hedgingCount / totalWords,
    hedgingCount,
    level: hedgingCount / totalWords > 0.02 ? 'high' : hedgingCount / totalWords > 0.01 ? 'moderate' : 'low'
  };
}

function analyzeCertaintyMarkers(content: string[]): any {
  const certaintyTerms = [
    'definitely', 'certainly', 'absolutely', 'clearly', 'obviously',
    'undoubtedly', 'surely', 'always', 'never', 'must', 'will'
  ];

  const allText = content.join(' ').toLowerCase();
  const totalWords = allText.split(/\s+/).length;

  let certaintyCount = 0;
  certaintyTerms.forEach(term => {
    const matches = allText.match(new RegExp(`\\b${term}\\b`, 'gi'));
    if (matches) certaintyCount += matches.length;
  });

  return {
    certaintyFrequency: certaintyCount / totalWords,
    certaintyCount,
    level: certaintyCount / totalWords > 0.015 ? 'high' : certaintyCount / totalWords > 0.008 ? 'moderate' : 'low'
  };
}

function analyzeEmotionalLanguage(content: string[]): any {
  const positiveTerms = ['happy', 'great', 'excellent', 'wonderful', 'love', 'amazing', 'fantastic', 'good', 'pleased'];
  const negativeTerms = ['sad', 'angry', 'terrible', 'awful', 'hate', 'horrible', 'bad', 'frustrated', 'disappointed'];
  const anxietyTerms = ['worried', 'anxious', 'concerned', 'nervous', 'stressed', 'afraid', 'fear', 'uncertain'];

  const allText = content.join(' ').toLowerCase();

  const countMatches = (terms: string[]) => terms.reduce((sum, term) => {
    const matches = allText.match(new RegExp(`\\b${term}\\b`, 'gi'));
    return sum + (matches?.length || 0);
  }, 0);

  return {
    positive: countMatches(positiveTerms),
    negative: countMatches(negativeTerms),
    anxiety: countMatches(anxietyTerms),
    emotionalBalance: countMatches(positiveTerms) - countMatches(negativeTerms)
  };
}

function calculateVocabularyDiversity(content: string[]): number {
  const allWords = content.join(' ').toLowerCase().split(/\s+/);
  const uniqueWords = new Set(allWords);
  return uniqueWords.size / Math.max(allWords.length, 1);
}

function detectMicroShifts(comms: any[], messages: any[], baseline: any): LinguisticMarker[] {
  const shifts: LinguisticMarker[] = [];

  if (baseline.insufficient_data) return shifts;

  // Split data into temporal segments
  const allData = [...comms, ...messages].sort((a, b) => 
    new Date(a.occurred_at || a.created_at).getTime() - new Date(b.occurred_at || b.created_at).getTime()
  );

  const segmentSize = Math.max(Math.floor(allData.length / 4), 5);
  const recentSegment = allData.slice(-segmentSize);
  const recentContent = recentSegment.map(d => d.notes || d.content || '').filter(c => c.length > 0);

  // Compare recent to baseline
  const recentPronouns = analyzePronounUsage(recentContent);
  const recentHedging = analyzeHedgingLanguage(recentContent);
  const recentCertainty = analyzeCertaintyMarkers(recentContent);
  const recentEmotional = analyzeEmotionalLanguage(recentContent);

  // Pronoun shift detection
  const pronounDeviation = Math.abs(recentPronouns.firstPersonRatio - baseline.pronounPatterns.firstPersonRatio);
  if (pronounDeviation > 0.02) {
    shifts.push({
      markerType: 'Pronoun Usage Shift',
      frequency: recentPronouns.firstPersonRatio,
      baseline: baseline.pronounPatterns.firstPersonRatio,
      deviation: pronounDeviation,
      significance: pronounDeviation > 0.05 ? 'high' : 'medium'
    });
  }

  // Hedging shift detection
  const hedgingDeviation = Math.abs(recentHedging.hedgingFrequency - baseline.hedgingBaseline.hedgingFrequency);
  if (hedgingDeviation > 0.01) {
    shifts.push({
      markerType: 'Hedging Language Shift',
      frequency: recentHedging.hedgingFrequency,
      baseline: baseline.hedgingBaseline.hedgingFrequency,
      deviation: hedgingDeviation,
      significance: hedgingDeviation > 0.02 ? 'high' : 'medium'
    });
  }

  // Certainty shift detection
  const certaintyDeviation = Math.abs(recentCertainty.certaintyFrequency - baseline.certaintyBaseline.certaintyFrequency);
  if (certaintyDeviation > 0.008) {
    shifts.push({
      markerType: 'Certainty Marker Shift',
      frequency: recentCertainty.certaintyFrequency,
      baseline: baseline.certaintyBaseline.certaintyFrequency,
      deviation: certaintyDeviation,
      significance: certaintyDeviation > 0.015 ? 'high' : 'medium'
    });
  }

  // Emotional shift detection
  const emotionalShift = recentEmotional.emotionalBalance - baseline.emotionalBaseline.emotionalBalance;
  if (Math.abs(emotionalShift) > 3) {
    shifts.push({
      markerType: 'Emotional Tone Shift',
      frequency: recentEmotional.emotionalBalance,
      baseline: baseline.emotionalBaseline.emotionalBalance,
      deviation: emotionalShift,
      significance: Math.abs(emotionalShift) > 8 ? 'critical' : Math.abs(emotionalShift) > 5 ? 'high' : 'medium'
    });
  }

  return shifts;
}

function analyzeStressIndicators(comms: any[], messages: any[]): any {
  const allContent = [...comms.map(c => c.notes || ''), ...messages.map(m => m.content || '')];
  const recentContent = allContent.slice(-50);

  // Stress linguistic markers
  const stressMarkers = [
    'urgent', 'immediately', 'asap', 'critical', 'emergency',
    'overwhelmed', 'exhausted', 'stressed', 'pressure', 'deadline'
  ];

  const recentText = recentContent.join(' ').toLowerCase();
  
  let stressCount = 0;
  stressMarkers.forEach(marker => {
    const matches = recentText.match(new RegExp(`\\b${marker}\\b`, 'gi'));
    if (matches) stressCount += matches.length;
  });

  return {
    stressMarkerCount: stressCount,
    stressFrequency: stressCount / Math.max(recentContent.length, 1),
    indicators: {
      highUrgency: stressCount > 5,
      emotionalVolatility: analyzeEmotionalLanguage(recentContent).negative > 10,
      cognitiveOverload: recentContent.some(c => c.length > 500 && c.includes('...')),
      decreasedClarity: false // Would need more sophisticated analysis
    },
    level: stressCount > 10 ? 'critical' : stressCount > 5 ? 'high' : stressCount > 2 ? 'moderate' : 'low'
  };
}

function analyzeCognitiveLoad(messages: any[]): any {
  const recentMessages = messages.slice(-30);
  
  // Cognitive load indicators
  const indicators = {
    incompleteSentences: recentMessages.filter(m => 
      m.content?.endsWith('...') || m.content?.includes('...')
    ).length,
    selfCorrections: recentMessages.filter(m =>
      m.content?.includes('I mean') || m.content?.includes('actually') || m.content?.includes('wait')
    ).length,
    repetition: 0, // Would need comparison
    simplifiedVocabulary: false
  };

  const loadScore = (indicators.incompleteSentences * 2 + indicators.selfCorrections * 1.5) / Math.max(recentMessages.length, 1);

  return {
    ...indicators,
    loadScore,
    level: loadScore > 0.3 ? 'high' : loadScore > 0.15 ? 'moderate' : 'low',
    interpretation: loadScore > 0.3 ? 
      'High cognitive load detected - decision quality may be impaired' :
      loadScore > 0.15 ?
        'Moderate cognitive load - monitor for changes' :
        'Normal cognitive load levels'
  };
}

function detectStrategicShifts(microShifts: LinguisticMarker[], stressIndicators: any): StrategicShift[] {
  const shifts: StrategicShift[] = [];

  // Defensive posture shift
  const hedgingShift = microShifts.find(s => s.markerType.includes('Hedging'));
  if (hedgingShift && hedgingShift.deviation > 0) {
    shifts.push({
      shiftType: 'Defensive Communication Posture',
      confidence: Math.min(hedgingShift.deviation * 20, 0.9),
      indicators: ['Increased hedging language', 'More qualified statements', 'Reduced certainty'],
      timeframe: 'Recent (last 25% of communications)',
      implications: [
        'May be preparing for negative news or change',
        'Possible uncertainty about position or decisions',
        'Could indicate external pressure or doubt'
      ]
    });
  }

  // Distancing shift
  const pronounShift = microShifts.find(s => s.markerType.includes('Pronoun'));
  if (pronounShift && pronounShift.frequency < pronounShift.baseline) {
    shifts.push({
      shiftType: 'Psychological Distancing',
      confidence: 0.65,
      indicators: ['Decreased first-person pronoun usage', 'More passive constructions', 'Reduced personal ownership'],
      timeframe: 'Gradual trend',
      implications: [
        'May be distancing from decisions or outcomes',
        'Possible preparation for departure or change',
        'Reduced personal investment signals'
      ]
    });
  }

  // Emotional escalation
  const emotionalShift = microShifts.find(s => s.markerType.includes('Emotional'));
  if (emotionalShift && emotionalShift.significance === 'critical') {
    shifts.push({
      shiftType: 'Emotional State Change',
      confidence: 0.8,
      indicators: ['Significant emotional tone shift', 'Changed sentiment patterns', 'Altered emotional expression'],
      timeframe: 'Recent acute change',
      implications: [
        'Major stressor or event may have occurred',
        'Decision-making may be emotionally influenced',
        'Relationship dynamics may be shifting'
      ]
    });
  }

  // Stress-driven shift
  if (stressIndicators.level === 'critical' || stressIndicators.level === 'high') {
    shifts.push({
      shiftType: 'Stress-Induced Communication Change',
      confidence: 0.75,
      indicators: ['Elevated stress markers', 'Urgency language increase', 'Potential cognitive overload'],
      timeframe: 'Current period',
      implications: [
        'May be facing significant pressure',
        'Decision quality could be compromised',
        'Vulnerability window may be present'
      ]
    });
  }

  return shifts;
}

function analyzeTemporalPatterns(comms: any[], microShifts: LinguisticMarker[]): any {
  const weekdayDistribution = new Array(7).fill(0);
  const hourlyDistribution = new Array(24).fill(0);

  comms.forEach(c => {
    if (c.occurred_at) {
      const date = new Date(c.occurred_at);
      weekdayDistribution[date.getDay()]++;
      hourlyDistribution[date.getHours()]++;
    }
  });

  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const peakDay = weekdayDistribution.indexOf(Math.max(...weekdayDistribution));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    communicationPatterns: {
      peakHour,
      peakDay: days[peakDay],
      weekdayDistribution,
      hourlyDistribution
    },
    shiftTiming: microShifts.length > 0 ? 'Recent shifts detected' : 'Stable patterns',
    trend: microShifts.some(s => s.significance === 'high' || s.significance === 'critical') ? 
      'escalating' : 'stable'
  };
}

function generateEarlyWarnings(shifts: StrategicShift[], stressIndicators: any): string[] {
  const warnings: string[] = [];

  shifts.forEach(shift => {
    if (shift.confidence > 0.7) {
      warnings.push(`HIGH PRIORITY: ${shift.shiftType} detected with ${Math.round(shift.confidence * 100)}% confidence`);
    }
  });

  if (stressIndicators.level === 'critical') {
    warnings.push('CRITICAL: Stress indicators at critical level - immediate attention recommended');
  }

  if (shifts.some(s => s.shiftType.includes('Distancing'))) {
    warnings.push('WATCH: Psychological distancing pattern may indicate upcoming changes');
  }

  if (warnings.length === 0) {
    warnings.push('No significant early warnings detected - patterns within normal range');
  }

  return warnings;
}

function calculateOverallStress(indicators: any): string {
  return indicators.level;
}

function calculateShiftProbability(shifts: StrategicShift[]): number {
  if (shifts.length === 0) return 0.1;
  const avgConfidence = shifts.reduce((sum, s) => sum + s.confidence, 0) / shifts.length;
  return Math.round(avgConfidence * 100) / 100;
}

function calculateConsistency(baseline: any, shifts: LinguisticMarker[]): number {
  if (baseline.insufficient_data) return 0.5;
  const highSignificanceShifts = shifts.filter(s => s.significance === 'high' || s.significance === 'critical');
  return Math.max(0.3, 1 - (highSignificanceShifts.length * 0.15));
}

function generateRecommendations(shifts: StrategicShift[], warnings: string[]): string[] {
  const recommendations: string[] = [];

  if (shifts.some(s => s.shiftType.includes('Defensive'))) {
    recommendations.push('Consider addressing potential concerns proactively');
  }

  if (shifts.some(s => s.shiftType.includes('Distancing'))) {
    recommendations.push('Increase engagement frequency to maintain relationship');
  }

  if (shifts.some(s => s.shiftType.includes('Emotional'))) {
    recommendations.push('Approach with empathy - emotional state may be volatile');
  }

  if (shifts.some(s => s.shiftType.includes('Stress'))) {
    recommendations.push('Be mindful of timing for important requests');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current engagement patterns - communication stable');
  }

  return recommendations;
}
