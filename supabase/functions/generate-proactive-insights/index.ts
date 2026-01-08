import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProactiveInsight {
  type: 'opportunity' | 'risk' | 'action' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  affected_contacts: Array<{ id: string; name: string }>;
  suggested_action: string;
  deadline?: string;
  context: string;
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather comprehensive data for proactive insights
    const [
      { data: profiles },
      { data: upcomingEvents },
      { data: churnRisks },
      { data: recentAnomalies },
      { data: dormantRelationships },
      { data: lifecycleStages },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, last_contact_date, is_favorite')
        .eq('user_id', user.id)
        .limit(100),
      supabase
        .from('events')
        .select('id, title, event_type, event_date, profile_id')
        .eq('user_id', user.id)
        .gte('event_date', new Date().toISOString())
        .lte('event_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('event_date', { ascending: true }),
      supabase
        .from('churn_predictions')
        .select('profile_id, risk_score, risk_level, intervention_recommended')
        .eq('user_id', user.id)
        .gte('risk_score', 0.6)
        .order('risk_score', { ascending: false })
        .limit(10),
      supabase
        .from('behavioral_anomalies')
        .select('profile_id, anomaly_type, severity, description')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('id, first_name, last_name, last_contact_date')
        .eq('user_id', user.id)
        .lt('last_contact_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10),
      supabase
        .from('relationship_inferences')
        .select('profile_id, inference_type, inference_data')
        .eq('user_id', user.id)
        .eq('inference_type', 'lifecycle_stage'),
    ]);

    // Build context for AI
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const contextData = {
      upcomingEvents: upcomingEvents?.map(e => ({
        ...e,
        contact: profileMap.get(e.profile_id),
      })),
      churnRisks: churnRisks?.map(c => ({
        ...c,
        contact: profileMap.get(c.profile_id),
      })),
      anomalies: recentAnomalies?.map(a => ({
        ...a,
        contact: profileMap.get(a.profile_id),
      })),
      dormantRelationships: dormantRelationships?.map(d => ({
        id: d.id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
        lastContact: d.last_contact_date,
        daysSinceContact: Math.floor((Date.now() - new Date(d.last_contact_date).getTime()) / (24 * 60 * 60 * 1000)),
      })),
      lifecycleStages: lifecycleStages?.map(l => ({
        ...l,
        contact: profileMap.get(l.profile_id),
      })),
      totalContacts: profiles?.length || 0,
      favoriteContacts: profiles?.filter(p => p.is_favorite).length || 0,
    };

    // Generate proactive insights using AI
    const aiResponse = await callAI({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a proactive relationship intelligence system. Analyze the provided data and generate actionable insights.

Focus on:
1. Upcoming opportunities (birthdays, milestones, follow-ups)
2. At-risk relationships needing intervention
3. Optimal timing for outreach
4. Cross-contact opportunities (introductions, shared interests)
5. Maintenance tasks for relationship health

Return a JSON object:
{
  "insights": [
    {
      "type": "opportunity|risk|action|milestone",
      "priority": "low|medium|high|urgent",
      "title": "Brief title",
      "description": "Detailed description",
      "affected_contacts": [{"id": "uuid", "name": "Name"}],
      "suggested_action": "What to do",
      "deadline": "ISO date if applicable",
      "context": "Why this matters"
    }
  ],
  "daily_focus": "One sentence about today's priority",
  "weekly_summary": "Overview of relationship health this week"
}`
        },
        {
          role: 'user',
          content: `Generate proactive insights from this data:\n${JSON.stringify(contextData, null, 2)}`
        }
      ],
      temperature: 0.4,
      userId: user.id,
      functionName: 'generate-proactive-insights',
    });

    const analysis = parseAIJson<{
      insights: ProactiveInsight[];
      daily_focus: string;
      weekly_summary: string;
    }>(aiResponse.content, { 
      insights: [], 
      daily_focus: 'Review your relationship priorities',
      weekly_summary: 'Maintain regular contact with key relationships'
    });

    // Store high-priority insights as notifications/tasks
    for (const insight of analysis.insights.filter(i => i.priority === 'urgent' || i.priority === 'high')) {
      await supabase.from('contact_activity_feed').insert({
        user_id: user.id,
        profile_id: insight.affected_contacts[0]?.id || null,
        activity_type: 'proactive_insight',
        activity_subtype: insight.type,
        title: insight.title,
        description: insight.description,
        importance_score: insight.priority === 'urgent' ? 10 : 8,
        metadata: {
          suggested_action: insight.suggested_action,
          deadline: insight.deadline,
          context: insight.context,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      insights: analysis.insights,
      dailyFocus: analysis.daily_focus,
      weeklySummary: analysis.weekly_summary,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
