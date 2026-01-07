import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = "2026-01-07-deep-analysis-v1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get model-specific API parameters
function getModelParams(model: string): { maxTokensKey: string, includeTemperature: boolean } {
  if (model.startsWith('openai/gpt-5') || model.startsWith('openai/o3') || model.startsWith('openai/o4')) {
    return { maxTokensKey: 'max_completion_tokens', includeTemperature: false };
  }
  return { maxTokensKey: 'max_tokens', includeTemperature: true };
}

// Paginated fetch to get ALL messages
async function fetchAllMessages(supabase: any, conversationId: string) {
  const allMessages: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('messages')
      .select('content, is_from_contact, sent_at, media_url')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allMessages.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  return allMessages;
}

// Fetch analyzed media for a profile
async function fetchAnalyzedMedia(supabase: any, profileId: string, userId: string) {
  const allMedia: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('media')
      .select('id, mime_type, ai_metadata, created_at, caption')
      .eq('profile_id', profileId)
      .eq('user_id', userId)
      .not('ai_metadata', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allMedia.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  return allMedia;
}

// Extract key intelligence from media analyses
function extractMediaIntelligence(analyzedMedia: any[]): any {
  const people: string[] = [];
  const locations: string[] = [];
  const activities: string[] = [];
  const emotions: Record<string, number> = {};
  const transcriptions: string[] = [];
  const objects: string[] = [];
  
  analyzedMedia.forEach(media => {
    const metadata = media.ai_metadata;
    if (!metadata) return;
    
    // Extract people
    if (metadata.people_detected) {
      metadata.people_detected.forEach((p: string) => {
        if (!people.includes(p)) people.push(p);
      });
    }
    if (metadata.faces_detected) {
      metadata.faces_detected.forEach((f: any) => {
        if (f.name && !people.includes(f.name)) people.push(f.name);
      });
    }
    
    // Extract locations
    if (metadata.location) locations.push(metadata.location);
    if (metadata.detected_location) locations.push(metadata.detected_location);
    if (metadata.setting) locations.push(metadata.setting);
    
    // Extract activities
    if (metadata.activity) activities.push(metadata.activity);
    if (metadata.scene_description) activities.push(metadata.scene_description);
    if (metadata.action) activities.push(metadata.action);
    
    // Count emotions
    if (metadata.mood) {
      const mood = metadata.mood.toLowerCase();
      emotions[mood] = (emotions[mood] || 0) + 1;
    }
    if (metadata.emotional_context) {
      const emotion = metadata.emotional_context.toLowerCase();
      emotions[emotion] = (emotions[emotion] || 0) + 1;
    }
    
    // Extract transcriptions
    if (metadata.transcription) {
      transcriptions.push(metadata.transcription);
    }
    if (metadata.speech_content) {
      transcriptions.push(metadata.speech_content);
    }
    
    // Extract objects
    if (metadata.objects_detected) {
      metadata.objects_detected.forEach((o: string) => {
        if (!objects.includes(o)) objects.push(o);
      });
    }
    if (metadata.items) {
      metadata.items.forEach((o: string) => {
        if (!objects.includes(o)) objects.push(o);
      });
    }
  });
  
  // Get unique locations
  const uniqueLocations = [...new Set(locations)].filter(l => l && l.trim());
  
  // Get top emotions
  const sortedEmotions = Object.entries(emotions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));
  
  return {
    totalAnalyzed: analyzedMedia.length,
    people: people.slice(0, 20),
    locations: uniqueLocations.slice(0, 20),
    activities: [...new Set(activities)].slice(0, 20),
    emotionalContext: sortedEmotions,
    hasTranscriptions: transcriptions.length > 0,
    transcriptionCount: transcriptions.length,
    sampleTranscriptions: transcriptions.slice(0, 5),
    commonObjects: [...new Set(objects)].slice(0, 30),
  };
}

// Weighted sampling for large conversations
function sampleMessages(messages: any[], maxSamples: number): { sampled: any[], strategy: string } {
  if (messages.length <= maxSamples) {
    return { sampled: messages, strategy: 'full' };
  }

  const recentCount = Math.floor(maxSamples * 0.4);
  const middleCount = Math.floor(maxSamples * 0.3);
  const earlyCount = maxSamples - recentCount - middleCount;

  const earlyEnd = Math.floor(messages.length * 0.25);
  const middleStart = Math.floor(messages.length * 0.25);
  const middleEnd = Math.floor(messages.length * 0.75);
  const recentStart = Math.floor(messages.length * 0.75);

  const sampleEvenly = (arr: any[], count: number) => {
    if (arr.length <= count) return arr;
    const step = Math.floor(arr.length / count);
    return arr.filter((_, idx) => idx % step === 0).slice(0, count);
  };

  const sampled = [
    ...sampleEvenly(messages.slice(0, earlyEnd), earlyCount),
    ...sampleEvenly(messages.slice(middleStart, middleEnd), middleCount),
    ...sampleEvenly(messages.slice(recentStart), recentCount),
  ].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  return { 
    sampled, 
    strategy: `weighted_sampling (${earlyCount} early / ${middleCount} middle / ${recentCount} recent)` 
  };
}

serve(async (req) => {
  console.log(`=== ANALYZE-CONVERSATION-DEEP ${FUNCTION_VERSION} ===`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, profileId, includeMediaIntelligence = true, anonymize = true, userId, model } = await req.json();
    
    console.log(`Request: conversationId=${conversationId}, profileId=${profileId}, includeMedia=${includeMediaIntelligence}, model=${model}`);
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    const selectedModel = model || 'google/gemini-2.5-flash';
    console.log(`Selected model: ${selectedModel}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation details
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('*, profiles!inner(id, first_name, last_name)')
      .eq('id', conversationId)
      .single();

    if (convoError || !conversation) {
      throw new Error('Conversation not found');
    }

    const contactProfileId = profileId || conversation.profiles.id;
    const contactName = `${conversation.profiles.first_name} ${conversation.profiles.last_name || ''}`.trim();

    // Fetch ALL messages
    const messages = await fetchAllMessages(supabase, conversationId);
    console.log(`Total messages: ${messages.length}`);

    if (!messages || messages.length === 0) {
      throw new Error('No messages to analyze');
    }

    // Fetch analyzed media if requested
    let mediaIntelligence = null;
    let analyzedMediaCount = 0;
    let totalMediaCount = 0;
    
    if (includeMediaIntelligence && contactProfileId) {
      console.log('Fetching analyzed media for profile:', contactProfileId);
      
      const analyzedMedia = await fetchAnalyzedMedia(supabase, contactProfileId, userId);
      analyzedMediaCount = analyzedMedia.length;
      
      // Get total media count
      const { count } = await supabase
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', contactProfileId)
        .eq('user_id', userId);
      totalMediaCount = count || 0;
      
      console.log(`Analyzed media: ${analyzedMediaCount} / ${totalMediaCount}`);
      
      if (analyzedMedia.length > 0) {
        mediaIntelligence = extractMediaIntelligence(analyzedMedia);
      }
    }

    // Sample messages for AI
    const MAX_SAMPLES = 2500;
    const { sampled: messagesToAnalyze, strategy: samplingStrategy } = sampleMessages(messages, MAX_SAMPLES);

    // Anonymize names
    const personA = anonymize ? 'Person A' : contactName;
    const personB = anonymize ? 'Person B' : 'You';

    const formattedMessages = messagesToAnalyze.map(msg => {
      const sender = msg.is_from_contact ? personA : personB;
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      const time = new Date(msg.sent_at).toTimeString().split(' ')[0].slice(0, 5);
      const hasMedia = msg.media_url ? ' [+media]' : '';
      return `[${date} ${time}] ${sender}: ${msg.content}${hasMedia}`;
    }).join('\n');

    // Build enhanced prompt with media intelligence
    const dateRangeStart = messages[0].sent_at.split('T')[0];
    const dateRangeEnd = messages[messages.length - 1].sent_at.split('T')[0];
    
    let mediaContext = '';
    if (mediaIntelligence) {
      mediaContext = `

MEDIA INTELLIGENCE (from ${mediaIntelligence.totalAnalyzed} analyzed photos/videos/audio):
- People appearing in media: ${mediaIntelligence.people.join(', ') || 'None identified'}
- Locations captured: ${mediaIntelligence.locations.join(', ') || 'None identified'}
- Activities observed: ${mediaIntelligence.activities.slice(0, 10).join(', ') || 'None identified'}
- Emotional context from media: ${mediaIntelligence.emotionalContext.map((e: { emotion: string; count: number }) => `${e.emotion} (${e.count})`).join(', ') || 'N/A'}
- Voice messages transcribed: ${mediaIntelligence.transcriptionCount}
${mediaIntelligence.sampleTranscriptions.length > 0 ? `- Sample voice messages: "${mediaIntelligence.sampleTranscriptions.slice(0, 2).join('", "')}"` : ''}
- Common objects in photos: ${mediaIntelligence.commonObjects.slice(0, 15).join(', ') || 'None'}

Use this media context to provide deeper insights about:
1. Shared experiences and memories visible in photos
2. Relationship evolution based on visual context
3. Places you've been together
4. Who else appears in your relationship (mutual friends, family)
5. Emotional patterns visible in photos/videos
6. Important moments captured in media`;
    }

    const aiPrompt = `Perform a DEEP analysis of this relationship between ${personA} and ${personB}, spanning ${dateRangeStart} to ${dateRangeEnd} (${messages.length} total messages, ${messagesToAnalyze.length} analyzed).${mediaContext}

Return comprehensive JSON:

{
  "executive_summary": "2-3 sentence summary of the relationship and its current state",
  "relationship_profile": {
    "type": "romantic/friendship/family/professional/acquaintance",
    "stage": "early/developing/established/mature/declining",
    "depth_score": 0-100,
    "health_score": 0-100,
    "trajectory": "improving/stable/declining"
  },
  "shared_history": {
    "significant_events": ["Event 1...", "Event 2..."],
    "shared_interests": ["Interest 1...", "Interest 2..."],
    "inside_jokes_references": ["Reference 1...", "Reference 2..."],
    "milestone_moments": ["First meeting...", "First trip together..."]
  },
  "communication_dynamics": {
    "primary_topics": ["Topic 1", "Topic 2"],
    "communication_style": "Description of how they communicate",
    "conflict_patterns": "How they handle disagreements",
    "support_patterns": "How they support each other",
    "humor_style": "Description of shared humor"
  },
  "emotional_intelligence": {
    "sentiment_trend": "positive/neutral/negative",
    "emotional_depth": 0-100,
    "vulnerability_level": "low/medium/high",
    "emotional_reciprocity": 0-100,
    "dominant_emotions": ["emotion1", "emotion2"]
  },
  "visual_relationship_context": ${mediaIntelligence ? `{
    "shared_experiences": ["Experience from photos..."],
    "relationship_visibility": "Description of what photos reveal",
    "important_people": ["People who appear frequently..."],
    "memorable_locations": ["Places visited together..."],
    "photo_based_insights": ["Insight from visual analysis..."]
  }` : 'null'},
  "voice_message_insights": ${mediaIntelligence?.hasTranscriptions ? `{
    "tone_analysis": "Overall tone in voice messages",
    "emotional_patterns": "Emotions expressed in voice",
    "key_revelations": ["Important things said in voice messages..."]
  }` : 'null'},
  "actionable_intelligence": [
    {
      "action": "Specific thing to do",
      "reason": "Why this matters for the relationship",
      "priority": "high/medium/low",
      "timing": "When to do this"
    }
  ],
  "relationship_risks": [
    {
      "risk": "Description of potential issue",
      "severity": "low/medium/high",
      "mitigation": "How to address it"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Way to strengthen relationship",
      "impact": "Expected positive outcome"
    }
  ],
  "deep_insights": [
    "Profound insight about this relationship...",
    "Pattern not obvious from surface reading...",
    "Long-term trend observation..."
  ],
  "conversation_highlights": [
    {
      "period": "YYYY-MM",
      "highlight": "What made this period notable"
    }
  ]
}

Be specific, insightful, and actionable. This is a deep psychological and relational analysis.

CONVERSATION:
${formattedMessages}`;

    console.log(`Calling Lovable AI (${selectedModel}) for deep analysis...`);

    const { maxTokensKey, includeTemperature } = getModelParams(selectedModel);
    const requestBody: any = {
      model: selectedModel,
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert relationship analyst and psychologist. Provide deep, meaningful insights that go beyond surface observations. Consider long-term patterns, emotional dynamics, and the full context of the relationship including any media/visual context provided. Always respond with valid JSON only.' 
        },
        { role: 'user', content: aiPrompt }
      ],
      [maxTokensKey]: 8000,
    };
    if (includeTemperature) {
      requestBody.temperature = 0.4;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response received, parsing...');

    let aiAnalysis;
    try {
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      aiAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      aiAnalysis = {
        executive_summary: 'Deep analysis completed but detailed parsing failed.',
        relationship_profile: { health_score: 50 },
        deep_insights: ['Analysis data could not be fully extracted.']
      };
    }

    // Compile full analysis
    const fullAnalysis = {
      conversation_id: conversationId,
      user_id: userId,
      profile_id: contactProfileId,
      analysis_type: 'deep_with_media',
      total_messages_analyzed: messages.length,
      sampling_strategy: samplingStrategy,
      media_included: includeMediaIntelligence,
      analyzed_media_count: analyzedMediaCount,
      total_media_count: totalMediaCount,
      executive_summary: aiAnalysis.executive_summary,
      relationship_profile: aiAnalysis.relationship_profile,
      shared_history: aiAnalysis.shared_history,
      communication_dynamics: aiAnalysis.communication_dynamics,
      emotional_intelligence: aiAnalysis.emotional_intelligence,
      visual_relationship_context: aiAnalysis.visual_relationship_context,
      voice_message_insights: aiAnalysis.voice_message_insights,
      actionable_intelligence: aiAnalysis.actionable_intelligence,
      relationship_risks: aiAnalysis.relationship_risks,
      opportunities: aiAnalysis.opportunities,
      deep_insights: aiAnalysis.deep_insights,
      conversation_highlights: aiAnalysis.conversation_highlights,
      media_intelligence_summary: mediaIntelligence,
      model_used: selectedModel,
      created_at: new Date().toISOString(),
      date_range_start: messages[0].sent_at,
      date_range_end: messages[messages.length - 1].sent_at,
    };

    // Save to conversation_analyses with extended data
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('conversation_analyses')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        analysis_type: 'deep_with_media',
        total_messages_analyzed: messages.length,
        sampling_strategy: samplingStrategy,
        relationship_health_score: aiAnalysis.relationship_profile?.health_score || 50,
        insights: aiAnalysis.deep_insights || [],
        sentiment_analysis: aiAnalysis.emotional_intelligence || {},
        communication_dynamics: {
          ...aiAnalysis.communication_dynamics,
          recommended_actions: aiAnalysis.actionable_intelligence || [],
        },
        topic_clusters: aiAnalysis.shared_history?.shared_interests?.map((i: string) => ({ topic: i, frequency: 1 })) || [],
        anomalies: aiAnalysis.relationship_risks?.map((r: any) => ({
          type: 'risk',
          description: r.risk,
          severity: r.severity,
          potential_cause: r.mitigation,
        })) || [],
        model_used: selectedModel,
        ai_model_used: selectedModel,
        confidence_score: messages.length >= 500 ? 90 : messages.length >= 100 ? 80 : 70,
        message_count_analyzed: messages.length,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
    }

    console.log('Deep analysis complete');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: fullAnalysis,
      savedId: savedAnalysis?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-conversation-deep:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
