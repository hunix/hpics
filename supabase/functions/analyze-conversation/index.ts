import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

const FUNCTION_VERSION = "2026-01-07-unified-ai-v1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get model-specific API parameters
function getModelParams(model: string): { maxTokensKey: string, includeTemperature: boolean } {
  // OpenAI GPT-5 and newer models use max_completion_tokens and don't support temperature
  if (model.startsWith('openai/gpt-5') || model.startsWith('openai/o3') || model.startsWith('openai/o4')) {
    return { maxTokensKey: 'max_completion_tokens', includeTemperature: false };
  }
  // All other models (Gemini, older OpenAI) use max_tokens and support temperature
  return { maxTokensKey: 'max_tokens', includeTemperature: true };
}

// Paginated fetch to get ALL messages
async function fetchAllMessages(supabase: any, conversationId: string) {
  const allMessages: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  
  console.log('Starting paginated message fetch...');
  
  while (true) {
    const { data, error } = await supabase
      .from('messages')
      .select('content, is_from_contact, sent_at')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allMessages.push(...data);
    console.log(`Fetched ${allMessages.length} messages so far...`);
    
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  console.log(`Total messages fetched: ${allMessages.length}`);
  return allMessages;
}

// Intelligent weighted sampling for large conversations
function sampleMessages(messages: any[], maxSamples: number): { sampled: any[], strategy: string } {
  if (messages.length <= maxSamples) {
    return { sampled: messages, strategy: 'full' };
  }

  const totalCount = messages.length;
  
  // Weighted sampling: 40% recent, 30% middle, 30% early
  const recentCount = Math.floor(maxSamples * 0.4);
  const middleCount = Math.floor(maxSamples * 0.3);
  const earlyCount = maxSamples - recentCount - middleCount;

  // Calculate boundaries
  const earlyEnd = Math.floor(totalCount * 0.25);
  const middleStart = Math.floor(totalCount * 0.25);
  const middleEnd = Math.floor(totalCount * 0.75);
  const recentStart = Math.floor(totalCount * 0.75);

  // Sample from each period
  const earlyMessages = messages.slice(0, earlyEnd);
  const middleMessages = messages.slice(middleStart, middleEnd);
  const recentMessages = messages.slice(recentStart);

  const sampleEvenly = (arr: any[], count: number) => {
    if (arr.length <= count) return arr;
    const step = Math.floor(arr.length / count);
    return arr.filter((_, idx) => idx % step === 0).slice(0, count);
  };

  const sampled = [
    ...sampleEvenly(earlyMessages, earlyCount),
    ...sampleEvenly(middleMessages, middleCount),
    ...sampleEvenly(recentMessages, recentCount),
  ].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  console.log(`Sampled ${sampled.length} messages: ${earlyCount} early, ${middleCount} middle, ${recentCount} recent`);

  return { 
    sampled, 
    strategy: `weighted_sampling (${earlyCount} early / ${middleCount} middle / ${recentCount} recent)` 
  };
}

// Build activity heatmap (hour x day of week)
function buildActivityHeatmap(messages: any[]): Record<string, number>[][] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
  
  messages.forEach(msg => {
    const d = new Date(msg.sent_at);
    const dayIdx = d.getDay();
    const hour = d.getHours();
    heatmap[dayIdx][hour]++;
  });

  // Convert to structured format
  return days.map((day, dayIdx) => 
    heatmap[dayIdx].map((count, hour) => ({ day, hour, count }))
  ).flat() as any;
}

// Calculate response time trend over months
function calculateResponseTimeTrend(messages: any[]): any[] {
  const monthlyData: Record<string, { total: number, count: number }> = {};
  
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].is_from_contact !== messages[i - 1].is_from_contact) {
      const diff = new Date(messages[i].sent_at).getTime() - new Date(messages[i - 1].sent_at).getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) { // Under 24 hours
        const month = messages[i].sent_at.slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { total: 0, count: 0 };
        monthlyData[month].total += diff;
        monthlyData[month].count++;
      }
    }
  }

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      avgMinutes: Math.round(data.total / data.count / 60000),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

serve(async (req) => {
  console.log(`=== ANALYZE-CONVERSATION ${FUNCTION_VERSION} ===`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, anonymize = true, userId, model } = await req.json();
    
    console.log(`Request params: conversationId=${conversationId}, userId=${userId}, model=${model}, anonymize=${anonymize}`);
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    // Use provided model or default
    const selectedModel = model || 'google/gemini-2.5-flash';
    console.log(`Selected model: ${selectedModel}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation details
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('*, profiles!inner(first_name, last_name)')
      .eq('id', conversationId)
      .single();

    if (convoError || !conversation) {
      throw new Error('Conversation not found');
    }

    const contactName = `${conversation.profiles.first_name} ${conversation.profiles.last_name || ''}`.trim();

    // Fetch ALL messages using pagination
    const messages = await fetchAllMessages(supabase, conversationId);

    if (!messages || messages.length === 0) {
      throw new Error('No messages to analyze');
    }

    console.log(`Total messages fetched: ${messages.length}`);

    // Sample if too many for AI context
    const MAX_SAMPLES = 3000;
    const { sampled: messagesToAnalyze, strategy: samplingStrategy } = sampleMessages(messages, MAX_SAMPLES);

    // Build activity heatmap from ALL messages
    const activityHeatmap = buildActivityHeatmap(messages);
    
    // Calculate response time trend from ALL messages
    const responseTimeTrend = calculateResponseTimeTrend(messages);

    // Anonymize if requested
    const personA = anonymize ? 'Person A' : contactName;
    const personB = anonymize ? 'Person B' : 'You';

    const formattedMessages = messagesToAnalyze.map(msg => {
      const sender = msg.is_from_contact ? personA : personB;
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      const time = new Date(msg.sent_at).toTimeString().split(' ')[0].slice(0, 5);
      return `[${date} ${time}] ${sender}: ${msg.content}`;
    }).join('\n');

    // Calculate basic stats from ALL messages
    const fromContact = messages.filter(m => m.is_from_contact).length;
    const fromUser = messages.length - fromContact;
    
    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].is_from_contact !== messages[i - 1].is_from_contact) {
        const diff = new Date(messages[i].sent_at).getTime() - new Date(messages[i - 1].sent_at).getTime();
        if (diff < 24 * 60 * 60 * 1000) {
          totalResponseTime += diff;
          responseCount++;
        }
      }
    }
    const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 60000) : 0;

    // Calculate initiation
    let initiationByContact = 0;
    let totalInitiations = 0;
    for (let i = 1; i < messages.length; i++) {
      const gap = new Date(messages[i].sent_at).getTime() - new Date(messages[i - 1].sent_at).getTime();
      if (gap > 4 * 60 * 60 * 1000) {
        totalInitiations++;
        if (messages[i].is_from_contact) initiationByContact++;
      }
    }
    const initiationRatio = totalInitiations > 0 ? initiationByContact / totalInitiations : 0.5;

    // Peak hours and days from ALL messages
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    messages.forEach(msg => {
      const d = new Date(msg.sent_at);
      const hour = d.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[days[d.getDay()]] = (dayCounts[days[d.getDay()]] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => {
        const hour = parseInt(h);
        return `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
      });

    const mostActiveDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    // Message lengths
    const contactMsgLengths = messages.filter(m => m.is_from_contact).map(m => m.content.length);
    const userMsgLengths = messages.filter(m => !m.is_from_contact).map(m => m.content.length);
    const avgContactLength = contactMsgLengths.length > 0 ? Math.round(contactMsgLengths.reduce((a, b) => a + b, 0) / contactMsgLengths.length) : 0;
    const avgUserLength = userMsgLengths.length > 0 ? Math.round(userMsgLengths.reduce((a, b) => a + b, 0) / userMsgLengths.length) : 0;

    // Enhanced AI prompt with anomaly detection
    const dateRangeStart = messages[0].sent_at.split('T')[0];
    const dateRangeEnd = messages[messages.length - 1].sent_at.split('T')[0];
    
    const aiPrompt = `Analyze this conversation between ${personA} and ${personB} spanning from ${dateRangeStart} to ${dateRangeEnd} (${messages.length} total messages, ${messagesToAnalyze.length} shown). Provide a comprehensive JSON response:

{
  "sentiment": {
    "overall": "positive/neutral/negative",
    "timeline": [{"period": "YYYY-MM", "sentiment": 0.0-1.0, "dominant_emotion": "string"}]
  },
  "intents": {
    "questions": number,
    "requests": number,
    "informational": number,
    "confirmations": number,
    "greetings": number,
    "emotional_support": number,
    "planning": number,
    "jokes_humor": number
  },
  "topics": [
    {"topic": "string", "frequency": number, "sentiment": 0.0-1.0, "first_mentioned": "YYYY-MM", "last_mentioned": "YYYY-MM"}
  ],
  "anomalies": [
    {
      "type": "silent_period/sentiment_shift/topic_change/pattern_change/unusual_timing",
      "description": "Detailed description of what was unusual",
      "period": "YYYY-MM or date range",
      "severity": "low/medium/high",
      "potential_cause": "Possible explanation"
    }
  ],
  "relationship_health_score": 0-100,
  "insights": [
    "Insight about communication patterns...",
    "Observation about relationship evolution over ${dateRangeStart} to ${dateRangeEnd}...",
    "Notable changes or trends...",
    "Recommendation for better communication..."
  ],
  "recommended_actions": [
    {"action": "Specific actionable recommendation", "priority": "high/medium/low", "reason": "Why this matters"}
  ]
}

ANALYZE FOR:
1. Long-term relationship evolution (this spans ${dateRangeStart} to ${dateRangeEnd})
2. Communication pattern changes over time
3. Silent periods (gaps of weeks/months) and what might have caused them
4. Sentiment shifts and their timing
5. Topic evolution - what used to be discussed vs now
6. Red flags or concerns in the relationship
7. Balance and reciprocity in the relationship

Be specific and actionable. Include 8-12 meaningful insights. Detect any anomalies or unusual patterns.

CONVERSATION:
${formattedMessages}`;

    console.log(`Calling unified AI client (${selectedModel}) for analysis...`);

    // Use unified AI client for automatic logging and cost tracking
    const aiResponse = await callAI({
      model: selectedModel,
      messages: [
        { role: 'system', content: 'You are an expert conversation analyst specializing in relationship dynamics and communication patterns. Always respond with valid JSON only, no markdown or extra text.' },
        { role: 'user', content: aiPrompt }
      ],
      userId,
      functionName: 'analyze-conversation',
      profileId: conversation.profile_id,
      temperature: 0.3,
      maxTokens: 6000,
      metadata: {
        conversationId,
        totalMessages: messages.length,
        samplingStrategy,
      },
    });

    console.log(`AI response received (${aiResponse.totalTokens} tokens, ${aiResponse.costCents}¢)`);

    // Parse AI response
    const aiAnalysis = parseAIJson(aiResponse.content, {
      sentiment: { overall: 'neutral', timeline: [] },
      intents: {},
      topics: [],
      anomalies: [],
      relationship_health_score: 50,
      insights: ['Analysis completed but detailed insights could not be extracted.'],
      recommended_actions: []
    });

    // Compile full analysis
    const fullAnalysis = {
      conversation_id: conversationId,
      user_id: userId,
      analysis_type: 'full',
      total_messages_analyzed: messages.length,
      sampling_strategy: samplingStrategy,
      messaging_patterns: {
        total_messages: messages.length,
        from_contact: fromContact,
        from_user: fromUser,
        initiation_ratio: Math.round(initiationRatio * 100) / 100,
        avg_response_time_minutes: avgResponseMinutes,
        peak_hours: peakHours,
        most_active_days: mostActiveDays,
      },
      activity_heatmap: activityHeatmap,
      response_time_trend: responseTimeTrend,
      sentiment_analysis: aiAnalysis.sentiment || { overall: 'neutral', timeline: [] },
      intent_breakdown: aiAnalysis.intents || {},
      topic_clusters: aiAnalysis.topics || [],
      anomalies: aiAnalysis.anomalies || [],
      relationship_health_score: aiAnalysis.relationship_health_score || null,
      communication_dynamics: {
        dominant_speaker: fromUser > fromContact ? 'user' : 'contact',
        balance_score: Math.min(fromContact, fromUser) / Math.max(fromContact, fromUser),
        avg_message_length_user: avgUserLength,
        avg_message_length_contact: avgContactLength,
        recommended_actions: aiAnalysis.recommended_actions || [],
      },
      insights: aiAnalysis.insights || [],
      confidence_score: messages.length >= 500 ? 90 : messages.length >= 100 ? 80 : Math.min(60 + messages.length / 5, 75),
      model_used: selectedModel,
      ai_model_used: selectedModel,
      anonymization_enabled: anonymize,
      message_count_analyzed: messages.length,
      date_range_start: messages[0].sent_at,
      date_range_end: messages[messages.length - 1].sent_at,
    };

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('conversation_analyses')
      .insert(fullAnalysis)
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
      throw saveError;
    }

    console.log('Analysis saved successfully:', savedAnalysis.id);

    return new Response(JSON.stringify({ success: true, analysis: savedAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-conversation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
