// Suggest Meeting Time
// AI-powered optimal meeting time suggestions based on patterns

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeSuggestion {
  dateTime: string;
  score: number;
  reasoning: string;
  conflictLevel: 'none' | 'low' | 'medium' | 'high';
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

    const { 
      profileId, 
      meetingDuration = 30, 
      preferredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      dateRange = 14,
      meetingType = 'general'
    } = await req.json();

    // Get profile communication patterns
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, communications(*)')
      .eq('id', profileId)
      .single();

    // Analyze historical communication times
    const { data: comms } = await supabase
      .from('communications')
      .select('occurred_at, channel, direction')
      .eq('profile_id', profileId)
      .order('occurred_at', { ascending: false })
      .limit(50);

    // Get existing calendar events
    const startDate = new Date();
    const endDate = new Date(Date.now() + dateRange * 24 * 60 * 60 * 1000);
    
    const { data: events } = await supabase
      .from('events')
      .select('start_time, end_time, title')
      .eq('user_id', user.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    // Get meeting patterns from past events with this contact
    const { data: pastMeetings } = await supabase
      .from('events')
      .select('start_time, title')
      .eq('user_id', user.id)
      .contains('attendee_emails', [profile?.primary_email])
      .limit(20);

    // Analyze patterns
    const patterns = analyzePatterns(comms || [], pastMeetings || []);
    
    // Generate suggestions
    const suggestions = generateTimeSuggestions(
      patterns,
      events || [],
      preferredDays,
      meetingDuration,
      dateRange
    );

    // Enhance with AI reasoning
    const enhancedSuggestions = await enhanceWithAI(
      suggestions,
      profile,
      patterns,
      meetingType,
      supabase,
      user.id
    );

    return new Response(JSON.stringify({
      success: true,
      suggestions: enhancedSuggestions,
      patterns,
      profileTimezone: profile?.timezone || 'UTC'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Meeting suggestion error:', error);
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

interface CommunicationPatterns {
  preferredHours: number[];
  preferredDays: number[];
  responseTimeAvg: number;
  mostActiveChannel: string;
  typicalMeetingDuration: number;
}

function analyzePatterns(comms: any[], pastMeetings: any[]): CommunicationPatterns {
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};
  let totalResponseTime = 0;
  let responseCount = 0;
  const channelCounts: Record<string, number> = {};

  for (const comm of comms) {
    const date = new Date(comm.occurred_at);
    const hour = date.getHours();
    const day = date.getDay();
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    channelCounts[comm.channel] = (channelCounts[comm.channel] || 0) + 1;
  }

  // Calculate response times (simplified)
  const inbound = comms.filter(c => c.direction === 'inbound').map(c => new Date(c.occurred_at).getTime());
  const outbound = comms.filter(c => c.direction === 'outbound').map(c => new Date(c.occurred_at).getTime());
  
  for (const inTime of inbound) {
    const nextOut = outbound.find(o => o > inTime);
    if (nextOut) {
      totalResponseTime += (nextOut - inTime) / (1000 * 60 * 60); // hours
      responseCount++;
    }
  }

  // Find preferred hours (top 3)
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h));

  // Find preferred days
  const sortedDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => parseInt(d));

  // Most active channel
  const mostActiveChannel = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'email';

  // Average meeting duration from past meetings
  const typicalDuration = 30; // Default, would need actual duration data

  return {
    preferredHours: sortedHours.length > 0 ? sortedHours : [10, 14, 16],
    preferredDays: sortedDays.length > 0 ? sortedDays : [1, 2, 3, 4], // Mon-Thu
    responseTimeAvg: responseCount > 0 ? totalResponseTime / responseCount : 24,
    mostActiveChannel,
    typicalMeetingDuration: typicalDuration
  };
}

function generateTimeSuggestions(
  patterns: CommunicationPatterns,
  existingEvents: any[],
  preferredDays: string[],
  duration: number,
  daysAhead: number
): TimeSuggestion[] {
  const suggestions: TimeSuggestion[] = [];
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };
  const allowedDays = new Set(preferredDays.map(d => dayMap[d.toLowerCase()]));

  const now = new Date();
  
  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    
    if (!allowedDays.has(dayOfWeek)) continue;

    for (const hour of patterns.preferredHours) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      // Check conflicts
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.start_time).getTime();
        const eventEnd = new Date(event.end_time).getTime();
        return slotStart.getTime() < eventEnd && slotEnd.getTime() > eventStart;
      });

      if (!hasConflict) {
        const isPreferredDay = patterns.preferredDays.includes(dayOfWeek);
        const isPreferredHour = patterns.preferredHours[0] === hour;
        
        let score = 50;
        if (isPreferredDay) score += 20;
        if (isPreferredHour) score += 20;
        if (d <= 3) score += 10; // Bonus for sooner dates

        suggestions.push({
          dateTime: slotStart.toISOString(),
          score,
          reasoning: `Based on communication patterns`,
          conflictLevel: 'none'
        });
      }
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

async function enhanceWithAI(
  suggestions: TimeSuggestion[],
  profile: any,
  patterns: CommunicationPatterns,
  meetingType: string,
  supabase: any,
  userId: string
): Promise<TimeSuggestion[]> {
  if (suggestions.length === 0) return suggestions;

  const startTime = Date.now();
  const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

  const prompt = `Analyze these meeting time suggestions for ${profileName} and enhance the reasoning.

Meeting Type: ${meetingType}
Contact's Communication Patterns:
- Preferred hours: ${patterns.preferredHours.join(', ')}:00
- Response time average: ${patterns.responseTimeAvg.toFixed(1)} hours
- Most active channel: ${patterns.mostActiveChannel}

Top Suggestions:
${suggestions.slice(0, 5).map((s, i) => 
  `${i + 1}. ${new Date(s.dateTime).toLocaleString()} - Score: ${s.score}`
).join('\n')}

Provide enhanced reasoning for the top 3 suggestions in JSON format:
{
  "enhancements": [
    {"index": 0, "reasoning": "Specific reasoning based on patterns", "adjustment": 0},
    {"index": 1, "reasoning": "...", "adjustment": 0},
    {"index": 2, "reasoning": "...", "adjustment": 0}
  ],
  "generalAdvice": "Brief advice for scheduling with this contact"
}`;

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'suggest-meeting-time',
      model_name: 'gemini-2.5-flash-lite',
      provider: 'google',
      estimated_cost_cents: 0.5,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const enhancements = JSON.parse(jsonMatch[0]);
      for (const enh of enhancements.enhancements || []) {
        if (suggestions[enh.index]) {
          suggestions[enh.index].reasoning = enh.reasoning;
          suggestions[enh.index].score += enh.adjustment || 0;
        }
      }
    }
  } catch (error) {
    console.error('AI enhancement error:', error);
  }

  return suggestions;
}
