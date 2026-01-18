import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceInsight {
  id: string;
  source_id: string;
  source_type: string;
  profile_id: string | null;
  transcription: string | null;
  speakers: any;
  vocal_psychology: any;
  content_intelligence: any;
  voice_biometrics: any;
  keywords: string[] | null;
  sentiment: any;
  topics: string[] | null;
  action_items: string[] | null;
  confidence_score: number | null;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
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

    const { profile_id } = await req.json();

    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[AggregateVoiceIntelligence] Aggregating for profile: ${profile_id}`);

    // Fetch all voice insights for this profile
    const { data: voiceInsights, error: insightsError } = await supabase
      .from('voice_insights')
      .select('*')
      .eq('profile_id', profile_id)
      .order('created_at', { ascending: false });

    if (insightsError) {
      throw insightsError;
    }

    if (!voiceInsights || voiceInsights.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No voice insights to aggregate',
        aggregated: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[AggregateVoiceIntelligence] Found ${voiceInsights.length} voice insights`);

    // Aggregate transcriptions
    const allTranscriptions = voiceInsights
      .filter(vi => vi.transcription)
      .map(vi => vi.transcription);

    // Aggregate speakers across all recordings
    const allSpeakers = new Map<string, any>();
    voiceInsights.forEach(vi => {
      if (vi.speakers && Array.isArray(vi.speakers)) {
        vi.speakers.forEach((speaker: any) => {
          const key = speaker.name || speaker.id || 'Unknown';
          if (!allSpeakers.has(key)) {
            allSpeakers.set(key, { ...speaker, occurrences: 1 });
          } else {
            const existing = allSpeakers.get(key);
            existing.occurrences = (existing.occurrences || 0) + 1;
          }
        });
      }
    });

    // Aggregate vocal psychology patterns
    const psychologyPatterns: any = {
      dominantEmotions: {},
      energyLevels: [],
      speakingPatterns: [],
      stressIndicators: [],
    };

    voiceInsights.forEach(vi => {
      if (vi.vocal_psychology) {
        const vp = vi.vocal_psychology;
        if (vp.emotion) {
          psychologyPatterns.dominantEmotions[vp.emotion] = 
            (psychologyPatterns.dominantEmotions[vp.emotion] || 0) + 1;
        }
        if (vp.energy_level !== undefined) {
          psychologyPatterns.energyLevels.push(vp.energy_level);
        }
        if (vp.speaking_rate) {
          psychologyPatterns.speakingPatterns.push(vp.speaking_rate);
        }
        if (vp.stress_level !== undefined) {
          psychologyPatterns.stressIndicators.push(vp.stress_level);
        }
      }
    });

    // Calculate averages
    const avgEnergy = psychologyPatterns.energyLevels.length > 0
      ? psychologyPatterns.energyLevels.reduce((a: number, b: number) => a + b, 0) / psychologyPatterns.energyLevels.length
      : null;
    const avgStress = psychologyPatterns.stressIndicators.length > 0
      ? psychologyPatterns.stressIndicators.reduce((a: number, b: number) => a + b, 0) / psychologyPatterns.stressIndicators.length
      : null;

    // Aggregate keywords and topics
    const keywordCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();

    voiceInsights.forEach(vi => {
      if (vi.keywords) {
        vi.keywords.forEach((kw: string) => {
          keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
        });
      }
      if (vi.topics) {
        vi.topics.forEach((topic: string) => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      }
    });

    // Get top keywords and topics
    const topKeywords = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([kw, count]) => ({ keyword: kw, frequency: count }));

    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, frequency: count }));

    // Aggregate action items
    const allActionItems = voiceInsights
      .flatMap(vi => vi.action_items || [])
      .filter((item, index, arr) => arr.indexOf(item) === index); // Deduplicate

    // Aggregate sentiment
    const sentimentScores = voiceInsights
      .filter(vi => vi.sentiment?.score !== undefined)
      .map(vi => vi.sentiment.score);
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : null;

    // Calculate overall confidence
    const confidenceScores = voiceInsights
      .filter(vi => vi.confidence_score !== null)
      .map(vi => vi.confidence_score as number);
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : null;

    // Build aggregated intelligence object
    const aggregatedIntelligence = {
      totalRecordings: voiceInsights.length,
      aggregatedAt: new Date().toISOString(),
      transcriptionSummary: {
        totalTranscriptions: allTranscriptions.length,
        totalWordCount: allTranscriptions.join(' ').split(/\s+/).length,
      },
      speakers: Array.from(allSpeakers.values()),
      vocalPsychology: {
        dominantEmotions: Object.entries(psychologyPatterns.dominantEmotions)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5),
        averageEnergyLevel: avgEnergy,
        averageStressLevel: avgStress,
      },
      contentIntelligence: {
        topKeywords,
        topTopics,
        actionItemsCount: allActionItems.length,
        actionItems: allActionItems.slice(0, 20),
      },
      sentiment: {
        averageScore: avgSentiment,
        trend: avgSentiment !== null 
          ? avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral'
          : 'unknown',
      },
      confidence: avgConfidence,
    };

    // Store aggregated intelligence in ai_analyses
    const { error: insertError } = await supabase
      .from('ai_analyses')
      .upsert({
        profile_id,
        user_id: user.id,
        analysis_type: 'voice_intelligence_aggregate',
        result: aggregatedIntelligence,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    if (insertError) {
      console.error('[AggregateVoiceIntelligence] Error storing aggregate:', insertError);
    }

    // Update psychological profile if it exists
    const { data: existingProfile } = await supabase
      .from('psychological_profiles')
      .select('id, voice_analysis_data')
      .eq('profile_id', profile_id)
      .single();

    if (existingProfile) {
      await supabase
        .from('psychological_profiles')
        .update({
          voice_analysis_data: aggregatedIntelligence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
    }

    console.log(`[AggregateVoiceIntelligence] Successfully aggregated ${voiceInsights.length} insights`);

    return new Response(JSON.stringify({
      success: true,
      aggregated: true,
      insightsCount: voiceInsights.length,
      result: aggregatedIntelligence,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AggregateVoiceIntelligence] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
