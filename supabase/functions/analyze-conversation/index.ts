import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, anonymize = true, userId } = await req.json();
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    console.log(`Starting conversation analysis for ${conversationId}, anonymize: ${anonymize}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation and messages
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('*, profiles!inner(first_name, last_name)')
      .eq('id', conversationId)
      .single();

    if (convoError || !conversation) {
      throw new Error('Conversation not found');
    }

    const contactName = `${conversation.profiles.first_name} ${conversation.profiles.last_name || ''}`.trim();

    // Fetch all messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('content, is_from_contact, sent_at')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (msgError) throw msgError;

    if (!messages || messages.length === 0) {
      throw new Error('No messages to analyze');
    }

    console.log(`Fetched ${messages.length} messages for analysis`);

    // Prepare messages for analysis - sample if too many
    const MAX_MESSAGES = 2000;
    let messagesToAnalyze = messages;
    if (messages.length > MAX_MESSAGES) {
      // Sample evenly throughout the conversation
      const step = Math.floor(messages.length / MAX_MESSAGES);
      messagesToAnalyze = messages.filter((_, idx) => idx % step === 0).slice(0, MAX_MESSAGES);
      console.log(`Sampled ${messagesToAnalyze.length} messages from ${messages.length}`);
    }

    // Anonymize if requested
    const personA = anonymize ? 'Person A' : contactName;
    const personB = anonymize ? 'Person B' : 'You';

    const formattedMessages = messagesToAnalyze.map(msg => {
      const sender = msg.is_from_contact ? personA : personB;
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      const time = new Date(msg.sent_at).toTimeString().split(' ')[0].slice(0, 5);
      return `[${date} ${time}] ${sender}: ${msg.content}`;
    }).join('\n');

    // Calculate basic stats that don't need AI
    const fromContact = messages.filter(m => m.is_from_contact).length;
    const fromUser = messages.length - fromContact;
    
    // Calculate response times (simplified)
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].is_from_contact !== messages[i - 1].is_from_contact) {
        const diff = new Date(messages[i].sent_at).getTime() - new Date(messages[i - 1].sent_at).getTime();
        if (diff < 24 * 60 * 60 * 1000) { // Only count if under 24 hours
          totalResponseTime += diff;
          responseCount++;
        }
      }
    }
    const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 60000) : 0;

    // Calculate initiation (who starts conversations after gaps)
    let initiationByContact = 0;
    let totalInitiations = 0;
    for (let i = 1; i < messages.length; i++) {
      const gap = new Date(messages[i].sent_at).getTime() - new Date(messages[i - 1].sent_at).getTime();
      if (gap > 4 * 60 * 60 * 1000) { // 4 hour gap = new conversation
        totalInitiations++;
        if (messages[i].is_from_contact) initiationByContact++;
      }
    }
    const initiationRatio = totalInitiations > 0 ? initiationByContact / totalInitiations : 0.5;

    // Peak hours analysis
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

    // Calculate average message lengths
    const contactMsgLengths = messages.filter(m => m.is_from_contact).map(m => m.content.length);
    const userMsgLengths = messages.filter(m => !m.is_from_contact).map(m => m.content.length);
    const avgContactLength = contactMsgLengths.length > 0 ? Math.round(contactMsgLengths.reduce((a, b) => a + b, 0) / contactMsgLengths.length) : 0;
    const avgUserLength = userMsgLengths.length > 0 ? Math.round(userMsgLengths.reduce((a, b) => a + b, 0) / userMsgLengths.length) : 0;

    // Use AI for sentiment, topics, intents, and insights
    const aiPrompt = `Analyze this conversation between ${personA} and ${personB}. Provide a JSON response with the following structure:

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
    "emotional_support": number
  },
  "topics": [
    {"topic": "string", "frequency": number, "sentiment": 0.0-1.0}
  ],
  "insights": [
    "Insight about communication patterns...",
    "Observation about relationship dynamics...",
    "Recommendation for better communication..."
  ]
}

Be specific and actionable in your insights. Include 5-8 meaningful insights.

CONVERSATION:
${formattedMessages}`;

    console.log('Calling Lovable AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert conversation analyst. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response received, parsing...');

    // Parse AI response
    let aiAnalysis;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      aiAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Provide defaults if parsing fails
      aiAnalysis = {
        sentiment: { overall: 'neutral', timeline: [] },
        intents: {},
        topics: [],
        insights: ['Analysis completed but detailed insights could not be extracted.']
      };
    }

    // Compile full analysis
    const fullAnalysis = {
      conversation_id: conversationId,
      user_id: userId,
      analysis_type: 'full',
      messaging_patterns: {
        total_messages: messages.length,
        from_contact: fromContact,
        from_user: fromUser,
        initiation_ratio: Math.round(initiationRatio * 100) / 100,
        avg_response_time_minutes: avgResponseMinutes,
        peak_hours: peakHours,
        most_active_days: mostActiveDays,
      },
      sentiment_analysis: aiAnalysis.sentiment || { overall: 'neutral', timeline: [] },
      intent_breakdown: aiAnalysis.intents || {},
      topic_clusters: aiAnalysis.topics || [],
      communication_dynamics: {
        dominant_speaker: fromUser > fromContact ? 'user' : 'contact',
        balance_score: Math.min(fromContact, fromUser) / Math.max(fromContact, fromUser),
        avg_message_length_user: avgUserLength,
        avg_message_length_contact: avgContactLength,
      },
      insights: aiAnalysis.insights || [],
      confidence_score: messagesToAnalyze.length >= 100 ? 85 : Math.min(60 + messagesToAnalyze.length / 5, 80),
      ai_model_used: 'gemini-2.5-flash',
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
