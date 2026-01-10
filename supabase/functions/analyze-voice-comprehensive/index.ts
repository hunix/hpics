import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoiceAnalysisOptions {
  transcription: boolean;
  speakerDiarization: boolean;
  vocalPsychology: boolean;
  contentIntelligence: boolean;
  keywordDetection: boolean;
  contactIdentification: boolean;
  voiceBiometrics: boolean;
  moodPatterns: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      audioUrl, 
      sourceType, 
      sourceId, 
      profileId, 
      jobId,
      options,
      model: requestedModel 
    } = await req.json() as {
      audioUrl: string;
      sourceType: string;
      sourceId: string;
      profileId?: string;
      jobId?: string;
      options: VoiceAnalysisOptions;
      model?: string;
    };

    if (!audioUrl || !sourceType || !sourceId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['analyze-voice-comprehensive'] || 'voice_analysis';
    const model = requestedModel || await getUserPreferredModel(user.id, analysisType, 'google/gemini-2.5-flash');

    // Step 1: Transcription with ElevenLabs Scribe
    let transcriptionData: any = null;
    if (options.transcription || options.speakerDiarization) {
      const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (!elevenLabsKey) {
        throw new Error("ElevenLabs API key not configured");
      }

      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error("Failed to download audio file");
      }

      const audioBlob = await audioResponse.blob();
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model_id', 'scribe_v1');
      formData.append('diarize', String(options.speakerDiarization));
      formData.append('tag_audio_events', 'true');

      const transcribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': elevenLabsKey },
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.detail?.message || 'Transcription failed');
      }

      transcriptionData = await transcribeResponse.json();
    }

    // Step 2: Get user's keyword watchlists for detection
    let watchlists: any[] = [];
    if (options.keywordDetection) {
      const { data } = await supabase
        .from('keyword_watchlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      watchlists = data || [];
    }

    // Step 3: AI Analysis with comprehensive prompt
    const analysisPrompt = buildAnalysisPrompt(
      transcriptionData?.text || '',
      transcriptionData?.words || [],
      options,
      watchlists
    );

    const aiResponse = await callAI({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt(options) },
        { role: 'user', content: analysisPrompt }
      ],
      userId: user.id,
      functionName: 'analyze-voice-comprehensive',
      profileId,
      maxTokens: 4000,
      temperature: 0.3,
    });

    const analysis: Record<string, any> = parseAIJson(aiResponse.content, {});

    // Step 4: Store results in voice_insights
    const insightData = {
      user_id: user.id,
      source_type: sourceType,
      source_id: sourceId,
      profile_id: profileId || null,
      job_id: jobId || null,
      
      // Transcription data
      full_transcription: transcriptionData?.text || null,
      transcription_with_timestamps: transcriptionData?.words || null,
      speakers: extractSpeakers(transcriptionData?.words || []),
      audio_events: transcriptionData?.audio_events || null,
      
      // Content intelligence
      topics_discussed: analysis.topics || null,
      named_entities: analysis.entities || null,
      action_items: analysis.action_items || null,
      commitments: analysis.commitments || null,
      
      // Psychological analysis
      sentiment_timeline: analysis.sentiment_timeline || null,
      stress_points: analysis.stress_points || null,
      deception_indicators: analysis.deception_indicators || null,
      mood_patterns: analysis.mood_patterns || null,
      
      // Keyword detection
      detected_keywords: analysis.detected_keywords || null,
      flagged_content: analysis.flagged_content || null,
      
      // Contact identification
      identified_contacts: analysis.identified_contacts || null,
      mentioned_contacts: analysis.mentioned_contacts || null,
      
      // Voice biometrics
      voice_signatures: analysis.voice_signatures || null,
      
      confidence_score: analysis.confidence || 0.7,
      ai_model_used: model,
      processing_time_ms: aiResponse.responseTimeMs,
    };

    const { data: insight, error: insertError } = await supabase
      .from('voice_insights')
      .insert(insightData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save voice insight: ${insertError.message}`);
    }

    // Step 5: Create keyword detections
    if (analysis.detected_keywords && analysis.detected_keywords.length > 0) {
      const detections = analysis.detected_keywords.map((kw: any) => ({
        user_id: user.id,
        watchlist_id: kw.watchlist_id || null,
        keyword_matched: kw.keyword,
        source_type: 'voice_insight',
        source_id: insight.id,
        profile_id: profileId || null,
        context_text: kw.context,
        timestamp_in_source: kw.timestamp,
        sentiment: kw.sentiment || 'neutral',
        urgency: kw.urgency || 'low',
      }));

      await supabase.from('keyword_detections').insert(detections);
    }

    // Step 6: Create content relationships if contacts identified
    if (analysis.mentioned_contacts && analysis.mentioned_contacts.length > 1) {
      const relationships = [];
      for (let i = 0; i < analysis.mentioned_contacts.length - 1; i++) {
        for (let j = i + 1; j < analysis.mentioned_contacts.length; j++) {
          const contact1 = analysis.mentioned_contacts[i];
          const contact2 = analysis.mentioned_contacts[j];
          if (contact1.profile_id && contact2.profile_id) {
            relationships.push({
              user_id: user.id,
              profile_id_1: contact1.profile_id,
              profile_id_2: contact2.profile_id,
              source_type: 'voice_mention',
              source_id: insight.id,
              relationship_type: 'mentioned_together',
              context: `Both mentioned in ${sourceType}`,
              confidence: 0.7,
            });
          }
        }
      }
      if (relationships.length > 0) {
        await supabase.from('content_relationships').insert(relationships);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      insightId: insight.id,
      transcription: transcriptionData?.text || null,
      analysis,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Voice analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getSystemPrompt(options: VoiceAnalysisOptions): string {
  return `You are an expert audio analyst specializing in voice analysis, psychology, and content intelligence.
Analyze the provided transcription and extract structured insights.
Always respond with valid JSON matching the requested schema.
Be precise and factual - only report what you can confidently detect.`;
}

function buildAnalysisPrompt(
  transcription: string,
  words: any[],
  options: VoiceAnalysisOptions,
  watchlists: any[]
): string {
  const sections: string[] = [];
  
  sections.push(`TRANSCRIPTION:\n${transcription || 'No transcription available'}`);
  
  if (words.length > 0) {
    sections.push(`WORD-LEVEL DATA (sample): ${JSON.stringify(words.slice(0, 20))}`);
  }
  
  if (options.keywordDetection && watchlists.length > 0) {
    const allKeywords = watchlists.flatMap(w => w.keywords.map((k: string) => ({
      keyword: k,
      watchlist_id: w.id,
      priority: w.priority
    })));
    sections.push(`KEYWORDS TO DETECT:\n${JSON.stringify(allKeywords)}`);
  }
  
  const schema: any = {};
  
  if (options.contentIntelligence) {
    schema.topics = '[{topic, importance: 1-10, timestamp_ranges: [{start, end}]}]';
    schema.entities = '{people: [], places: [], organizations: [], dates: [], amounts: []}';
    schema.action_items = '[{item, assignee, deadline, status}]';
    schema.commitments = '[{commitment, by_whom, to_whom}]';
  }
  
  if (options.vocalPsychology || options.moodPatterns) {
    schema.sentiment_timeline = '[{timestamp, sentiment, score: -1 to 1, emotion}]';
    schema.stress_points = '[{timestamp, intensity: 1-10, context}]';
    schema.deception_indicators = '[{timestamp, indicator, confidence}]';
    schema.mood_patterns = '[{phase, mood, energy: 1-10, engagement: 1-10}]';
  }
  
  if (options.keywordDetection) {
    schema.detected_keywords = '[{keyword, watchlist_id, count, timestamps: [], context, sentiment, urgency}]';
    schema.flagged_content = '[{content, reason, severity}]';
  }
  
  if (options.contactIdentification) {
    schema.mentioned_contacts = '[{name, context, possible_profile_id}]';
    schema.identified_contacts = '[{profile_id, confidence, method}]';
  }
  
  if (options.voiceBiometrics) {
    schema.voice_signatures = '[{speaker_id, characteristics: {pitch, pace, timbre}}]';
  }
  
  schema.confidence = 'overall confidence score 0-1';
  
  sections.push(`RESPOND WITH JSON MATCHING THIS SCHEMA:\n${JSON.stringify(schema, null, 2)}`);
  
  return sections.join('\n\n');
}

function extractSpeakers(words: any[]): any[] {
  const speakerMap = new Map<string, { speakingTime: number; wordCount: number }>();
  
  for (const word of words) {
    const speaker = word.speaker || 'unknown';
    const duration = (word.end || 0) - (word.start || 0);
    
    if (!speakerMap.has(speaker)) {
      speakerMap.set(speaker, { speakingTime: 0, wordCount: 0 });
    }
    
    const data = speakerMap.get(speaker)!;
    data.speakingTime += duration;
    data.wordCount += 1;
  }
  
  return Array.from(speakerMap.entries()).map(([id, data]) => ({
    id,
    speaking_time: data.speakingTime,
    word_count: data.wordCount,
  }));
}
