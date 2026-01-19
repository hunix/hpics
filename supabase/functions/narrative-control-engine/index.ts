import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NarrativeRequest {
  campaignId?: string;
  profileId?: string;
  action: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'narrative-control-engine', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaignId, profileId, action } = await req.json() as NarrativeRequest;

    if (action === 'deploy') {
      // Fetch campaign details
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('narrative_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Generate narrative nodes for each deployment channel
      const deploymentChannels = campaign.deployment_channels || [];
      const nodes: any[] = [];

      for (const channel of deploymentChannels) {
        // Generate content nodes for each channel
        const nodeCount = 3 + Math.floor(Math.random() * 5); // 3-7 nodes per channel
        
        for (let i = 0; i < nodeCount; i++) {
          const persona = generatePersona(channel.channel);
          
          nodes.push({
            user_id: user.id,
            campaign_id: campaignId,
            node_type: i === 0 ? 'primary' : 'amplifier',
            content: generateNarrativeContent(campaign.target_narrative, channel.channel, i),
            persona_config: persona,
            platform: channel.channel,
            engagement_metrics: { likes: 0, shares: 0, comments: 0, reach: 0 },
            amplification_score: Math.random() * 0.5 + (i === 0 ? 0.5 : 0.2),
            authenticity_rating: persona.authenticityScore,
            connections: [],
            is_active: true,
          });
        }
      }

      // Insert nodes
      if (nodes.length > 0) {
        const { error: nodesError } = await supabaseClient
          .from('narrative_nodes')
          .insert(nodes);

        if (nodesError) throw nodesError;
      }

      // Update campaign status
      await supabaseClient
        .from('narrative_campaigns')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return new Response(JSON.stringify({ 
        success: true,
        nodesDeployed: nodes.length,
        channelsActivated: deploymentChannels.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'measure_perception') {
      // Fetch current perception data
      let query = supabaseClient
        .from('perception_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data: existingData } = await query.limit(10);

      // Simulate new perception measurements
      const dimensions = [
        'trust_level',
        'brand_sentiment',
        'message_penetration',
        'narrative_alignment',
        'influence_susceptibility',
      ];

      const newMeasurements: any[] = [];

      for (const dimension of dimensions) {
        const existing = existingData?.find((d: any) => d.perception_dimension === dimension);
        const baseline = existing?.baseline_value || 0.5;
        const previous = existing?.current_value || baseline;
        
        // Simulate perception shift
        const shift = (Math.random() - 0.45) * 0.1; // Slight positive bias
        const current = Math.min(1, Math.max(0, previous + shift));

        newMeasurements.push({
          user_id: user.id,
          profile_id: profileId,
          campaign_id: campaignId,
          perception_dimension: dimension,
          baseline_value: baseline,
          current_value: current,
          target_value: 0.8,
          measurement_method: 'sentiment_analysis',
          data_sources: ['social_monitoring', 'interaction_analysis', 'behavioral_signals'],
          trend_analysis: {
            direction: current > previous ? 'improving' : current < previous ? 'declining' : 'stable',
            velocity: Math.abs(current - previous),
            momentum: current > previous ? 'positive' : 'negative',
          },
          influencing_factors: [
            { factor: 'content_engagement', impact: Math.random() * 0.3 },
            { factor: 'social_proof', impact: Math.random() * 0.25 },
            { factor: 'repetition', impact: Math.random() * 0.2 },
          ],
          measured_at: new Date().toISOString(),
        });
      }

      // Insert new measurements
      const { error: measureError } = await supabaseClient
        .from('perception_tracking')
        .insert(newMeasurements);

      if (measureError) throw measureError;

      // Calculate aggregate perception shift
      const avgShift = newMeasurements.reduce((sum, m) => {
        return sum + (m.current_value - m.baseline_value);
      }, 0) / newMeasurements.length;

      // Update campaign sentiment shift if applicable
      if (campaignId) {
        const { data: campaign } = await supabaseClient
          .from('narrative_campaigns')
          .select('sentiment_shift, current_reach')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          await supabaseClient
            .from('narrative_campaigns')
            .update({
              sentiment_shift: (campaign.sentiment_shift || 0) + avgShift,
              current_reach: (campaign.current_reach || 0) + Math.floor(Math.random() * 100),
            })
            .eq('id', campaignId);
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        dimensionsMeasured: dimensions.length,
        averageShift: avgShift,
        measurements: newMeasurements.map(m => ({
          dimension: m.perception_dimension,
          current: m.current_value,
          baseline: m.baseline_value,
          trend: m.trend_analysis.direction,
        })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate_counter_narrative') {
      // Analyze opponent narratives and generate counter-strategies
      const counterStrategies = generateCounterStrategies();

      return new Response(JSON.stringify({ 
        success: true,
        strategies: counterStrategies,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Narrative control error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generatePersona(channel: string): Record<string, unknown> {
  const personas: Record<string, any> = {
    email: {
      type: 'professional',
      tone: 'authoritative',
      style: 'formal',
      authenticityScore: 0.85,
    },
    social: {
      type: 'peer',
      tone: 'casual',
      style: 'conversational',
      authenticityScore: 0.75,
    },
    direct: {
      type: 'trusted_advisor',
      tone: 'empathetic',
      style: 'personal',
      authenticityScore: 0.9,
    },
    indirect: {
      type: 'third_party',
      tone: 'neutral',
      style: 'informative',
      authenticityScore: 0.7,
    },
    event: {
      type: 'thought_leader',
      tone: 'inspiring',
      style: 'dynamic',
      authenticityScore: 0.8,
    },
  };

  const basePersona = personas[channel] || personas.social;

  return {
    ...basePersona,
    name: `Persona_${Math.random().toString(36).substr(2, 8)}`,
    backstory: generateBackstory(basePersona.type),
    credibilityMarkers: generateCredibilityMarkers(basePersona.type),
  };
}

function generateBackstory(type: string): string {
  const backstories: Record<string, string> = {
    professional: 'Industry veteran with 15+ years of experience',
    peer: 'Fellow community member with shared interests',
    trusted_advisor: 'Long-time connection with proven track record',
    third_party: 'Independent observer with relevant expertise',
    thought_leader: 'Recognized authority in the field',
  };
  return backstories[type] || 'Engaged community participant';
}

function generateCredibilityMarkers(type: string): string[] {
  const markers: Record<string, string[]> = {
    professional: ['Verified credentials', 'Published work', 'Industry recognition'],
    peer: ['Shared connections', 'Common interests', 'Similar experiences'],
    trusted_advisor: ['History of good advice', 'Mutual benefit track record', 'Transparent communication'],
    third_party: ['Neutral stance', 'Verified expertise', 'No apparent conflicts'],
    thought_leader: ['Speaking engagements', 'Publications', 'Follower count'],
  };
  return markers[type] || ['Active engagement', 'Consistent presence'];
}

function generateNarrativeContent(targetNarrative: string, channel: string, index: number): string {
  const templates: Record<string, string[]> = {
    email: [
      `I wanted to share some insights about ${targetNarrative}...`,
      `Following up on our discussion about ${targetNarrative}...`,
      `Here's an important update regarding ${targetNarrative}...`,
    ],
    social: [
      `Just learned something fascinating about ${targetNarrative} 🧵`,
      `Thread: Why ${targetNarrative} matters more than ever...`,
      `Hot take: ${targetNarrative} is about to change everything...`,
    ],
    direct: [
      `I've been thinking about ${targetNarrative} and wanted your perspective...`,
      `Can we discuss ${targetNarrative}? I value your input...`,
      `Important: ${targetNarrative} - we should talk...`,
    ],
    indirect: [
      `Industry report: ${targetNarrative} trends and implications`,
      `Third-party analysis: ${targetNarrative} deep dive`,
      `Expert consensus on ${targetNarrative}...`,
    ],
    event: [
      `Key takeaways from the ${targetNarrative} summit`,
      `What leading voices are saying about ${targetNarrative}`,
      `The future of ${targetNarrative}: A comprehensive view`,
    ],
  };

  const channelTemplates = templates[channel] || templates.social;
  return channelTemplates[index % channelTemplates.length] || channelTemplates[0];
}

function generateCounterStrategies(): Array<{
  strategy: string;
  targetNarrative: string;
  counterApproach: string;
  effectiveness: number;
}> {
  return [
    {
      strategy: 'Reframe',
      targetNarrative: 'Original narrative',
      counterApproach: 'Shift perspective to highlight alternative interpretation',
      effectiveness: 0.75,
    },
    {
      strategy: 'Discredit source',
      targetNarrative: 'Source credibility',
      counterApproach: 'Highlight inconsistencies or conflicts of interest',
      effectiveness: 0.6,
    },
    {
      strategy: 'Flood zone',
      targetNarrative: 'Information environment',
      counterApproach: 'Introduce competing narratives to dilute impact',
      effectiveness: 0.65,
    },
    {
      strategy: 'Inoculation',
      targetNarrative: 'Target audience',
      counterApproach: 'Pre-expose audience to weakened version of narrative',
      effectiveness: 0.8,
    },
  ];
}
