import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CorrelationRequest {
  userId: string;
  correlationType?: 'all' | 'behavioral' | 'information' | 'hidden' | 'coalition';
}

const CORRELATION_MAPPER_PROMPT = `You are an elite intelligence analyst specializing in discovering hidden patterns, correlations, and relationships that are not immediately obvious.

Your task is to find DEEP CORRELATIONS across contacts that reveal:

1. HIDDEN CONNECTIONS:
   - People who seem unconnected but share patterns
   - Indirect relationship chains
   - Common third-party connections
   - Shared contexts or environments

2. BEHAVIORAL SYNCHRONIZATION:
   - Contacts who behave similarly at similar times
   - Coordinated communication patterns
   - Parallel decision-making
   - Synchronized mood or activity patterns

3. INFORMATION FLOW PATTERNS:
   - How information spreads through the network
   - Who shares information with whom
   - Information lag between contacts
   - Potential information sources and sinks

4. IMPLICIT COALITIONS:
   - Groups that act in concert without explicit coordination
   - Shared interests or adversaries
   - Complementary relationship patterns
   - Potential alliance formations

5. SHARED SECRETS OR KNOWLEDGE:
   - Topics known to multiple contacts
   - Information asymmetries
   - Gossip patterns
   - Confidentiality violations

Return JSON:
{
  "hidden_connections": [
    {
      "contacts": string[],
      "connection_type": string,
      "evidence": string[],
      "strength": number,
      "confidence": number,
      "implications": string[],
      "actionable_insight": string
    }
  ],
  "behavioral_synchronizations": [
    {
      "contacts": string[],
      "sync_type": string,
      "pattern_description": string,
      "temporal_correlation": number,
      "significance": string,
      "possible_causes": string[]
    }
  ],
  "information_flow_patterns": [
    {
      "pattern_name": string,
      "source_contacts": string[],
      "sink_contacts": string[],
      "intermediaries": string[],
      "information_types": string[],
      "flow_speed": string,
      "strategic_value": string
    }
  ],
  "implicit_coalitions": [
    {
      "coalition_name": string,
      "members": string[],
      "binding_factor": string,
      "coalition_strength": number,
      "potential_actions": string[],
      "threat_level": number,
      "opportunity_level": number
    }
  ],
  "shared_knowledge_patterns": [
    {
      "topic": string,
      "informed_contacts": string[],
      "uninformed_contacts": string[],
      "knowledge_source": string,
      "sensitivity_level": number,
      "leak_risk": number
    }
  ],
  "anomalous_patterns": [
    {
      "pattern_type": string,
      "description": string,
      "contacts_involved": string[],
      "anomaly_score": number,
      "investigation_priority": number,
      "recommended_actions": string[]
    }
  ],
  "predictive_correlations": [
    {
      "if_condition": string,
      "then_prediction": string,
      "correlation_strength": number,
      "historical_accuracy": number,
      "next_occurrence_estimate": string
    }
  ],
  "strategic_insights": {
    "highest_value_discovery": string,
    "urgent_attention_needed": string[],
    "opportunity_alerts": string[],
    "risk_alerts": string[]
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, correlationType = 'all' } = await req.json() as CorrelationRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather comprehensive cross-contact data
    const [
      { data: profiles },
      { data: messages },
      { data: interactions },
      { data: observations },
      { data: meetings },
      { data: locationData },
      { data: behavioralData },
      { data: relationships }
    ] = await Promise.all([
      supabase.from('profiles').select('id, name, company, title, tags, relationship_type').eq('user_id', userId).limit(200),
      supabase.from('messages').select('profile_id, content, created_at, direction, ai_analysis').eq('user_id', userId).order('created_at', { ascending: false }).limit(1000),
      supabase.from('contact_interactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
      supabase.from('contact_observations').select('profile_id, observation_type, notes, created_at').eq('user_id', userId).limit(300),
      supabase.from('meeting_recordings').select('profile_id, summary, entities_mentioned, created_at').eq('user_id', userId).limit(100),
      supabase.from('location_history').select('profile_id, location, created_at').eq('user_id', userId).limit(500),
      supabase.from('behavioral_analyses').select('profile_id, behavioral_patterns, personality_indicators').eq('user_id', userId).limit(100),
      supabase.from('contact_relationships').select('*').eq('user_id', userId)
    ]);

    // Build cross-contact correlation data
    const correlationData = {
      contacts: profiles?.map(p => ({
        id: p.id,
        name: p.name,
        company: p.company,
        title: p.title,
        tags: p.tags,
        relationshipType: p.relationship_type
      })),
      communicationPatterns: messages?.reduce((acc, m) => {
        const key = m.profile_id;
        if (!acc[key]) acc[key] = { messages: [], timestamps: [], topics: [] };
        acc[key].messages.push(m.content?.slice(0, 200));
        acc[key].timestamps.push(m.created_at);
        if (m.ai_analysis?.topics) acc[key].topics.push(...m.ai_analysis.topics);
        return acc;
      }, {} as Record<string, { messages: string[]; timestamps: string[]; topics: string[] }>),
      interactionTimelines: interactions?.reduce((acc, i) => {
        const key = i.profile_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ type: i.interaction_type, time: i.created_at, sentiment: i.sentiment });
        return acc;
      }, {} as Record<string, any[]>),
      observationsByContact: observations?.reduce((acc, o) => {
        const key = o.profile_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ type: o.observation_type, note: o.notes, time: o.created_at });
        return acc;
      }, {} as Record<string, any[]>),
      entityMentions: meetings?.reduce((acc, m) => {
        if (m.entities_mentioned) {
          Object.entries(m.entities_mentioned).forEach(([entity, mentions]) => {
            if (!acc[entity]) acc[entity] = [];
            acc[entity].push({ by: m.profile_id, context: m.summary?.slice(0, 100) });
          });
        }
        return acc;
      }, {} as Record<string, any[]>),
      locationOverlaps: locationData?.reduce((acc, l) => {
        const location = l.location;
        if (!acc[location]) acc[location] = [];
        acc[location].push({ profile: l.profile_id, time: l.created_at });
        return acc;
      }, {} as Record<string, any[]>),
      behavioralProfiles: behavioralData?.reduce((acc, b) => {
        acc[b.profile_id] = { patterns: b.behavioral_patterns, personality: b.personality_indicators };
        return acc;
      }, {} as Record<string, any>),
      knownRelationships: relationships,
      correlationType
    };

    // Perform deep correlation analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: CORRELATION_MAPPER_PROMPT },
          { role: 'user', content: `Find deep correlations in this cross-contact data:\n\n${JSON.stringify(correlationData, null, 2)}` }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysis = { error: 'Failed to parse correlation analysis', raw: content };
    }

    // Store correlations
    const correlationsToInsert = [
      ...(analysis.hidden_connections || []).map((c: any) => ({
        user_id: userId,
        correlation_type: 'hidden_connection',
        involved_profiles: c.contacts,
        strength: c.strength,
        evidence: c.evidence,
        implications: c.implications,
        confidence: c.confidence
      })),
      ...(analysis.implicit_coalitions || []).map((c: any) => ({
        user_id: userId,
        correlation_type: 'coalition',
        involved_profiles: c.members,
        strength: c.coalition_strength,
        evidence: [c.binding_factor],
        implications: c.potential_actions,
        confidence: 0.7
      }))
    ];

    if (correlationsToInsert.length > 0) {
      await supabase.from('deep_correlations').insert(correlationsToInsert);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'deep-correlation-mapper',
      model_name: 'google/gemini-2.5-pro',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      correlationsFound: {
        hiddenConnections: analysis.hidden_connections?.length || 0,
        behavioralSyncs: analysis.behavioral_synchronizations?.length || 0,
        infoFlowPatterns: analysis.information_flow_patterns?.length || 0,
        coalitions: analysis.implicit_coalitions?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Correlation mapping error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
