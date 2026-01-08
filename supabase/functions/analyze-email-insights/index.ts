import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailInsight {
  threadId: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  topics: string[];
  actionItems: string[];
  keyPoints: string[];
  suggestedResponse?: string;
  relationshipImpact: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json().catch(() => ({}));
    const { profileId, threadId, analyzeAll = false } = body;

    console.log(`[analyze-email-insights] Analyzing for user: ${userId}, profile: ${profileId}`);

    // Fetch email threads
    let query = supabase
      .from('email_threads')
      .select(`
        id,
        conversation_id,
        subject,
        participant_emails,
        message_count,
        last_message_at,
        email_messages (
          id,
          subject,
          body_text,
          sender_email,
          sender_name,
          sent_at,
          is_from_contact
        )
      `)
      .eq('user_id', userId);

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    if (threadId) {
      query = query.eq('id', threadId);
    }
    
    query = query.order('last_message_at', { ascending: false }).limit(analyzeAll ? 50 : 10);

    const { data: threads, error: threadsError } = await query;

    if (threadsError) {
      console.error('[analyze-email-insights] Error fetching threads:', threadsError);
      throw threadsError;
    }

    if (!threads || threads.length === 0) {
      return new Response(JSON.stringify({ 
        insights: [],
        message: 'No email threads found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile info if available
    let profileName = 'the contact';
    if (profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profileId)
        .single();
      if (profile) {
        profileName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      }
    }

    const insights: EmailInsight[] = [];

    for (const thread of threads) {
      const messages = thread.email_messages || [];
      if (messages.length === 0) continue;

      // Build conversation context
      const conversationText = messages
        .slice(0, 10) // Limit to recent 10 messages
        .map((m: any) => `[${m.is_from_contact ? profileName : 'You'}]: ${m.body_text?.slice(0, 500) || m.subject}`)
        .join('\n\n');

      const prompt = `Analyze this email thread and provide insights:

Subject: ${thread.subject}
Participants: ${thread.participant_emails?.join(', ')}
Messages:
${conversationText}

Provide a JSON response with:
{
  "summary": "2-3 sentence summary of the thread",
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "high" | "medium" | "low",
  "topics": ["array of main topics discussed"],
  "actionItems": ["array of action items or follow-ups needed"],
  "keyPoints": ["array of key points or decisions"],
  "suggestedResponse": "brief suggested response if action is needed, or null",
  "relationshipImpact": "one sentence on how this thread affects the relationship"
}`;

      try {
        const response = await callAI({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          functionName: 'analyze-email-insights',
          userId,
        });

        // Parse JSON from response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights.push({
            threadId: thread.id,
            ...parsed,
          });
        }
      } catch (aiError) {
        console.error(`[analyze-email-insights] AI error for thread ${thread.id}:`, aiError);
        // Add basic insight without AI
        insights.push({
          threadId: thread.id,
          summary: `Email thread with ${messages.length} messages about "${thread.subject}"`,
          sentiment: 'neutral',
          urgency: 'medium',
          topics: [thread.subject || 'General'],
          actionItems: [],
          keyPoints: [],
          relationshipImpact: 'Standard communication',
        });
      }
    }

    // Store insights for caching (only if we have a profileId)
    if (profileId) {
      for (const insight of insights) {
        await supabase
          .from('ai_analyses')
          .upsert({
            id: `email-insight-${insight.threadId}`,
            user_id: userId,
            profile_id: profileId,
            analysis_type: 'email_insight',
            result: insight,
            generated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
      }
    }

    console.log(`[analyze-email-insights] Generated ${insights.length} insights`);

    return new Response(JSON.stringify({ 
      success: true,
      insights,
      analyzedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[analyze-email-insights] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
