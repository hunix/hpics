import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateSummaryForUser(supabase: any, userId: string) {
  // Calculate week boundaries
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch all activity from this week
  const [
    communicationsResult,
    eventsResult,
    profilesResult,
    analysesResult,
    goalsResult
  ] = await Promise.all([
    supabase.from('communications').select('*, profiles(first_name, last_name)')
      .eq('user_id', userId)
      .gte('occurred_at', weekStart.toISOString())
      .lte('occurred_at', weekEnd.toISOString()),
    supabase.from('events').select('*, profiles(first_name, last_name)')
      .eq('user_id', userId)
      .gte('event_date', weekStart.toISOString())
      .lte('event_date', weekEnd.toISOString()),
    supabase.from('profiles').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('ai_analyses').select('*, profiles(first_name, last_name)')
      .eq('user_id', userId)
      .gte('generated_at', weekStart.toISOString()),
    supabase.from('relationship_goals').select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
  ]);

  const communications = communicationsResult.data || [];
  const events = eventsResult.data || [];
  const profiles = profilesResult.data || [];
  const analyses = analysesResult.data || [];
  const goals = goalsResult.data || [];

  // Calculate statistics
  const stats = {
    totalCommunications: communications.length,
    inboundCommunications: communications.filter((c: any) => c.direction === 'inbound').length,
    outboundCommunications: communications.filter((c: any) => c.direction === 'outbound').length,
    uniqueContactsReached: new Set(communications.map((c: any) => c.profile_id)).size,
    eventsThisWeek: events.length,
    analysesGenerated: analyses.length,
    activeGoals: goals.length,
    goalsCompleted: goals.filter((g: any) => g.last_completed_at && new Date(g.last_completed_at) >= weekStart).length
  };

  // Channel breakdown
  const channelBreakdown: Record<string, number> = {};
  communications.forEach((c: any) => {
    channelBreakdown[c.channel] = (channelBreakdown[c.channel] || 0) + 1;
  });

  // Top contacts this week
  const contactCounts: Record<string, { count: number; name: string }> = {};
  communications.forEach((c: any) => {
    const name = c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name || ''}`.trim() : 'Unknown';
    if (!contactCounts[c.profile_id]) {
      contactCounts[c.profile_id] = { count: 0, name };
    }
    contactCounts[c.profile_id].count++;
  });
  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, data]) => ({ profileId: id, name: data.name, interactions: data.count }));

  // Generate AI summary using unified client
  const prompt = `Generate a personalized weekly relationship summary based on this data:

STATISTICS:
- Total communications: ${stats.totalCommunications} (${stats.inboundCommunications} inbound, ${stats.outboundCommunications} outbound)
- Unique contacts reached: ${stats.uniqueContactsReached} out of ${profiles.length} total contacts
- Events this week: ${stats.eventsThisWeek}
- AI analyses generated: ${stats.analysesGenerated}
- Goals completed: ${stats.goalsCompleted} of ${stats.activeGoals} active goals

TOP CONTACTS:
${topContacts.map(c => `- ${c.name}: ${c.interactions} interactions`).join('\n')}

CHANNEL USAGE:
${Object.entries(channelBreakdown).map(([ch, count]) => `- ${ch}: ${count}`).join('\n')}

Provide:
1. A brief executive summary (2-3 sentences)
2. 3 key highlights from the week
3. 3 recommendations for next week
4. An engagement score (0-100) based on activity level

Be encouraging and specific.`;

  let aiSummary = {
    executiveSummary: 'Your weekly relationship activity summary.',
    highlights: ['Check your dashboard for detailed insights.'],
    recommendations: ['Keep nurturing your important relationships.'],
    engagementScore: 50
  };

  try {
    const aiResponse = await callAI({
      model: selectModel('speed'), // Use speed tier for summaries
      messages: [
        { role: 'system', content: 'You are a supportive relationship coach providing weekly summaries.' },
        { role: 'user', content: prompt }
      ],
      userId,
      functionName: 'generate-weekly-summary',
      temperature: 0.7,
      maxTokens: 1500,
      metadata: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalCommunications: stats.totalCommunications,
      },
    });

    // Parse structured output
    const parsed = parseAIJson(aiResponse.content, {
      executiveSummary: 'Your weekly summary is ready.',
      highlights: [],
      recommendations: [],
      engagementScore: 50
    });

    aiSummary = {
      executiveSummary: parsed.executiveSummary || aiSummary.executiveSummary,
      highlights: parsed.highlights?.length ? parsed.highlights : aiSummary.highlights,
      recommendations: parsed.recommendations?.length ? parsed.recommendations : aiSummary.recommendations,
      engagementScore: parsed.engagementScore || aiSummary.engagementScore,
    };
  } catch (err) {
    console.error('AI summary error:', err);
  }

  // Store the summary
  const summaryData = {
    stats,
    channelBreakdown,
    topContacts,
    aiSummary
  };

  const { error: insertError } = await supabase.from('weekly_summaries').upsert({
    user_id: userId,
    week_start: weekStart.toISOString().split('T')[0],
    week_end: weekEnd.toISOString().split('T')[0],
    summary_data: summaryData,
    highlights: aiSummary.highlights,
    recommendations: aiSummary.recommendations,
    generated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,week_start'
  });

  if (insertError) {
    console.error('Error storing summary for user:', userId, insertError);
  }

  return {
    userId,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    stats,
    aiSummary
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    
    // Check if this is a cron call (no auth header or anon key auth)
    const isCronCall = !authHeader || authHeader === `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;

    if (isCronCall) {
      // Cron mode: Process all users with email reminders enabled
      console.log('Cron mode: Generating weekly summaries for all users');
      
      const { data: users, error: usersError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('email_reminders', true);
      
      if (usersError) {
        throw usersError;
      }

      const results = [];
      for (const { user_id } of users || []) {
        try {
          const result = await generateSummaryForUser(supabase, user_id);
          results.push(result);
        } catch (err) {
          console.error('Error generating summary for user:', user_id, err);
          results.push({ userId: user_id, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        mode: 'cron',
        usersProcessed: results.length,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Authenticated mode: Process only the requesting user
      const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader! } }
      });
      const token = authHeader!.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) throw new Error('Unauthorized');
      const user = { id: claimsData.claims.sub };

      const result = await generateSummaryForUser(supabase, user.id);

      return new Response(JSON.stringify({ 
        success: true,
        mode: 'authenticated',
        ...result,
        generatedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
