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
    const { conversationId, userId, recentOnly = false } = await req.json();
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    console.log(`Starting conversation summary for ${conversationId}, recentOnly: ${recentOnly}`);

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

    // Fetch messages - optionally only recent ones
    let messagesQuery = supabase
      .from('messages')
      .select('content, is_from_contact, sent_at')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (recentOnly) {
      // Get messages from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      messagesQuery = messagesQuery.gte('sent_at', thirtyDaysAgo.toISOString());
    }

    const { data: messages, error: msgError } = await messagesQuery;

    if (msgError) throw msgError;

    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    console.log(`Fetched ${messages.length} messages for summary`);

    // Sample if too many messages
    const MAX_MESSAGES = 1000;
    let messagesToSummarize = messages;
    if (messages.length > MAX_MESSAGES) {
      const step = Math.floor(messages.length / MAX_MESSAGES);
      messagesToSummarize = messages.filter((_, idx) => idx % step === 0).slice(0, MAX_MESSAGES);
      console.log(`Sampled ${messagesToSummarize.length} messages from ${messages.length}`);
    }

    // Format messages for AI
    const formattedMessages = messagesToSummarize.map(msg => {
      const sender = msg.is_from_contact ? 'Contact' : 'You';
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      return `[${date}] ${sender}: ${msg.content}`;
    }).join('\n');

    // Use AI for summarization
    const aiPrompt = `Summarize this conversation between you and ${contactName}. Provide a JSON response:

{
  "summary": "A comprehensive 2-3 paragraph summary of the conversation covering main themes, relationship context, and important developments.",
  "key_topics": ["topic1", "topic2", "topic3"],
  "action_items": ["Any commitments or tasks mentioned", "Follow-up items discussed"],
  "important_dates": ["Any dates or events mentioned with context"]
}

Focus on extracting actionable information and relationship context. Be specific.

CONVERSATION:
${formattedMessages}`;

    console.log('Calling Lovable AI for summary...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at summarizing conversations. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
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
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response received, parsing...');

    // Parse AI response
    let aiSummary;
    try {
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      aiSummary = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      aiSummary = {
        summary: 'Summary could not be generated. Please try again.',
        key_topics: [],
        action_items: [],
        important_dates: []
      };
    }

    // Save summary to database
    const summaryData = {
      conversation_id: conversationId,
      user_id: userId,
      summary: aiSummary.summary,
      key_topics: aiSummary.key_topics || [],
      action_items: aiSummary.action_items || [],
      important_dates: aiSummary.important_dates || [],
      message_count_summarized: messages.length,
      date_range_start: messages[0].sent_at,
      date_range_end: messages[messages.length - 1].sent_at,
      ai_model_used: 'gemini-2.5-flash',
    };

    const { data: savedSummary, error: saveError } = await supabase
      .from('conversation_summaries')
      .insert(summaryData)
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save summary:', saveError);
      throw saveError;
    }

    console.log('Summary saved successfully:', savedSummary.id);

    return new Response(JSON.stringify({ success: true, summary: savedSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in summarize-conversation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
