import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Paginated fetch to get ALL messages
async function fetchAllMessages(supabase: any, conversationId: string, recentOnly: boolean) {
  const allMessages: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  
  // If recentOnly, get last 30 days
  const thirtyDaysAgo = recentOnly ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : null;
  
  console.log('Starting paginated message fetch...');
  
  while (true) {
    let query = supabase
      .from('messages')
      .select('content, is_from_contact, sent_at')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    
    if (thirtyDaysAgo) {
      query = query.gte('sent_at', thirtyDaysAgo);
    }
    
    const { data, error } = await query;
    
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

// Weighted sampling for large conversations
function sampleMessages(messages: any[], maxSamples: number): any[] {
  if (messages.length <= maxSamples) {
    return messages;
  }

  const totalCount = messages.length;
  
  // Weighted: 40% recent, 30% middle, 30% early
  const recentCount = Math.floor(maxSamples * 0.4);
  const middleCount = Math.floor(maxSamples * 0.3);
  const earlyCount = maxSamples - recentCount - middleCount;

  const earlyEnd = Math.floor(totalCount * 0.25);
  const middleStart = Math.floor(totalCount * 0.25);
  const middleEnd = Math.floor(totalCount * 0.75);
  const recentStart = Math.floor(totalCount * 0.75);

  const earlyMessages = messages.slice(0, earlyEnd);
  const middleMessages = messages.slice(middleStart, middleEnd);
  const recentMessages = messages.slice(recentStart);

  const sampleEvenly = (arr: any[], count: number) => {
    if (arr.length <= count) return arr;
    const step = Math.floor(arr.length / count);
    return arr.filter((_, idx) => idx % step === 0).slice(0, count);
  };

  return [
    ...sampleEvenly(earlyMessages, earlyCount),
    ...sampleEvenly(middleMessages, middleCount),
    ...sampleEvenly(recentMessages, recentCount),
  ].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userId, recentOnly = false, model } = await req.json();
    
    if (!conversationId || !userId) {
      throw new Error('conversationId and userId are required');
    }

    const selectedModel = model || 'google/gemini-2.5-flash';
    console.log(`Starting conversation summary for ${conversationId}, model: ${selectedModel}, recentOnly: ${recentOnly}`);

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
    const messages = await fetchAllMessages(supabase, conversationId, recentOnly);

    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    console.log(`Total messages fetched: ${messages.length}`);

    // Sample if too many for AI context
    const MAX_SAMPLES = 2000;
    const messagesToSummarize = sampleMessages(messages, MAX_SAMPLES);
    console.log(`Using ${messagesToSummarize.length} messages for summary`);

    // Format messages for AI
    const formattedMessages = messagesToSummarize.map(msg => {
      const sender = msg.is_from_contact ? 'Contact' : 'You';
      const date = new Date(msg.sent_at).toISOString().split('T')[0];
      return `[${date}] ${sender}: ${msg.content}`;
    }).join('\n');

    const dateRangeStart = messages[0].sent_at.split('T')[0];
    const dateRangeEnd = messages[messages.length - 1].sent_at.split('T')[0];

    // Use AI for summarization
    const aiPrompt = `Summarize this conversation between you and ${contactName} spanning from ${dateRangeStart} to ${dateRangeEnd} (${messages.length} total messages). Provide a JSON response:

{
  "summary": "A comprehensive 3-4 paragraph summary covering: 1) The nature of the relationship and how it evolved, 2) Main themes and recurring topics, 3) Key events or milestones, 4) Current state of the relationship and recent developments.",
  "key_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "action_items": ["Any outstanding commitments", "Follow-up items discussed", "Pending decisions"],
  "important_dates": ["Specific dates mentioned with context"],
  "relationship_summary": "One sentence describing the current relationship status and dynamic",
  "notable_events": ["Significant events or changes in the relationship over time"]
}

Focus on extracting actionable information, relationship context, and evolution over the ${dateRangeStart} to ${dateRangeEnd} period. Be specific and include dates when relevant.

CONVERSATION:
${formattedMessages}`;

    console.log(`Calling Lovable AI (${selectedModel}) for summary...`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'You are an expert at summarizing conversations and extracting key information. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
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
      ai_model_used: selectedModel,
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
