// Generate Meeting Follow-Up
// Creates personalized follow-up content after meetings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowUpResult {
  emailDraft: {
    subject: string;
    body: string;
    tone: string;
  };
  actionItems: Array<{
    task: string;
    owner: string;
    dueDate: string | null;
    priority: 'high' | 'medium' | 'low';
  }>;
  nextSteps: string[];
  suggestedNextMeeting: {
    topic: string;
    suggestedDate: string;
    agenda: string[];
  } | null;
  relationshipInsights: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { eventId, profileId, meetingNotes, meetingOutcome, attendees } = await req.json();

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    // Get profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, communications(*)')
      .eq('id', profileId)
      .single();

    // Get relationship context
    const { data: recentComms } = await supabase
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .order('occurred_at', { ascending: false })
      .limit(10);

    // Get any existing meeting intelligence
    const { data: meetingIntel } = await supabase
      .from('meeting_intelligence')
      .select('*')
      .eq('event_id', eventId)
      .single();

    // Generate follow-up with AI
    const followUp = await generateFollowUpWithAI({
      event,
      profile,
      meetingNotes,
      meetingOutcome,
      attendees,
      recentComms,
      meetingIntel
    }, supabase, user.id);

    // Store/update meeting intelligence
    await supabase.from('meeting_intelligence').upsert({
      user_id: user.id,
      event_id: eventId,
      profile_id: profileId,
      post_summary: {
        outcome: meetingOutcome,
        notes: meetingNotes,
        generatedAt: new Date().toISOString()
      },
      action_items: followUp.actionItems,
      follow_up_draft: followUp.emailDraft,
      next_meeting_suggestion: followUp.suggestedNextMeeting,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'event_id'
    });

    // Create tasks for action items
    for (const item of followUp.actionItems.filter(a => a.owner === 'me' || a.owner === 'self')) {
      await supabase.from('follow_ups').insert({
        user_id: user.id,
        profile_id: profileId,
        title: item.task,
        due_date: item.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: item.priority === 'high' ? 1 : item.priority === 'medium' ? 2 : 3,
        status: 'pending',
        source_event_id: eventId
      });
    }

    return new Response(JSON.stringify({
      success: true,
      followUp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Follow-up generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateFollowUpWithAI(context: any, supabase: any, userId: string): Promise<FollowUpResult> {
  const startTime = Date.now();
  const { event, profile, meetingNotes, meetingOutcome, recentComms } = context;

  const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'the attendee';
  const eventTitle = event?.title || 'the meeting';
  
  const commHistory = recentComms?.slice(0, 5).map((c: any) => 
    `${c.channel}: ${c.subject || 'No subject'} (${c.is_from_contact ? 'inbound' : 'outbound'})`
  ).join('\n') || 'No recent communications';

  const prompt = `Generate a comprehensive meeting follow-up for this meeting.

Meeting: ${eventTitle}
Date: ${event?.start_time || 'Recently'}
Attendee: ${profileName}
Organization: ${profile?.organization || 'Unknown'}

Meeting Notes:
${meetingNotes || 'No detailed notes provided'}

Meeting Outcome:
${meetingOutcome || 'Standard meeting'}

Recent Communication History:
${commHistory}

Generate a follow-up package in JSON format:
{
  "emailDraft": {
    "subject": "Professional subject line",
    "body": "Full email body with proper formatting. Include greeting, recap, action items, next steps, and sign-off.",
    "tone": "professional/friendly/formal"
  },
  "actionItems": [
    {
      "task": "Specific task description",
      "owner": "me or them or both",
      "dueDate": "ISO date or null",
      "priority": "high/medium/low"
    }
  ],
  "nextSteps": ["Step 1", "Step 2"],
  "suggestedNextMeeting": {
    "topic": "Next meeting topic",
    "suggestedDate": "Suggested timeframe",
    "agenda": ["Agenda item 1", "Agenda item 2"]
  },
  "relationshipInsights": ["Insight about the relationship or next engagement opportunity"]
}`;

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'generate-meeting-followup',
      model_name: 'gemini-2.5-flash',
      provider: 'google',
      estimated_cost_cents: 1,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  // Fallback
  return {
    emailDraft: {
      subject: `Follow-up: ${eventTitle}`,
      body: `Hi ${profileName},\n\nThank you for meeting with me today. I wanted to follow up on our discussion.\n\n${meetingNotes || 'Key points from our meeting...'}\n\nPlease let me know if you have any questions.\n\nBest regards`,
      tone: 'professional'
    },
    actionItems: [],
    nextSteps: ['Review meeting notes', 'Schedule follow-up if needed'],
    suggestedNextMeeting: null,
    relationshipInsights: []
  };
}
