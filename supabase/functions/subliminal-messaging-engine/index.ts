import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrimingTechnique {
  type: string;
  name: string;
  mechanism: string;
  implementation: string;
  effectiveness: number;
  duration_minutes: number;
  applications: string[];
}

const PRIMING_TECHNIQUES: PrimingTechnique[] = [
  // Semantic Priming
  {
    type: 'semantic',
    name: 'Associative Semantic Prime',
    mechanism: 'Activating related concepts through associated words',
    implementation: 'Embed related words in preceding messages',
    effectiveness: 0.72,
    duration_minutes: 15,
    applications: ['concept_activation', 'category_accessibility', 'memory_retrieval']
  },
  {
    type: 'semantic',
    name: 'Category Priming',
    mechanism: 'Activating category membership to influence categorization',
    implementation: 'Mention category exemplars before target',
    effectiveness: 0.68,
    duration_minutes: 10,
    applications: ['classification', 'stereotype_activation', 'prototype_access']
  },
  
  // Affective Priming
  {
    type: 'affective',
    name: 'Emotional State Preparation',
    mechanism: 'Pre-activating emotional valence for subsequent evaluation',
    implementation: 'Positive/negative words before target evaluation',
    effectiveness: 0.76,
    duration_minutes: 5,
    applications: ['attitude_formation', 'evaluation_bias', 'liking_induction']
  },
  {
    type: 'affective',
    name: 'Mood Congruence Priming',
    mechanism: 'Matching message content to induced mood',
    implementation: 'Create mood through imagery then deliver message',
    effectiveness: 0.71,
    duration_minutes: 20,
    applications: ['message_reception', 'persuasion', 'memory_encoding']
  },
  
  // Goal Priming
  {
    type: 'goal',
    name: 'Achievement Goal Activation',
    mechanism: 'Unconsciously activating achievement motivation',
    implementation: 'Expose to achievement-related words/images',
    effectiveness: 0.79,
    duration_minutes: 30,
    applications: ['motivation', 'performance', 'persistence']
  },
  {
    type: 'goal',
    name: 'Affiliation Goal Priming',
    mechanism: 'Activating belongingness and connection needs',
    implementation: 'Social warmth cues and togetherness imagery',
    effectiveness: 0.74,
    duration_minutes: 25,
    applications: ['cooperation', 'compliance', 'relationship_focus']
  },
  {
    type: 'goal',
    name: 'Power Goal Priming',
    mechanism: 'Activating dominance and control motivation',
    implementation: 'Authority symbols, height, expansive postures',
    effectiveness: 0.73,
    duration_minutes: 20,
    applications: ['confidence', 'risk_taking', 'assertiveness']
  },
  
  // Perceptual Priming
  {
    type: 'perceptual',
    name: 'Fluency Enhancement',
    mechanism: 'Increasing processing fluency creates positive affect',
    implementation: 'Pre-exposure to make target seem familiar',
    effectiveness: 0.81,
    duration_minutes: 60,
    applications: ['preference', 'truth_perception', 'ease_feeling']
  },
  {
    type: 'perceptual',
    name: 'Feature Detection Prime',
    mechanism: 'Sensitizing to specific visual/auditory features',
    implementation: 'Highlight features in preceding exposure',
    effectiveness: 0.65,
    duration_minutes: 5,
    applications: ['attention_direction', 'detection', 'salience']
  },
  
  // Conceptual Priming
  {
    type: 'conceptual',
    name: 'Schema Activation',
    mechanism: 'Activating cognitive schemas that frame interpretation',
    implementation: 'Trigger schema-related concepts before target',
    effectiveness: 0.77,
    duration_minutes: 30,
    applications: ['interpretation_bias', 'expectation_setting', 'meaning_making']
  },
  {
    type: 'conceptual',
    name: 'Mindset Priming',
    mechanism: 'Activating deliberative vs implemental mindsets',
    implementation: 'Questions about why vs how',
    effectiveness: 0.74,
    duration_minutes: 15,
    applications: ['decision_mode', 'action_orientation', 'planning']
  },
  
  // Behavioral Priming
  {
    type: 'behavioral',
    name: 'Ideomotor Priming',
    mechanism: 'Concept activation leads to behavioral tendencies',
    implementation: 'Expose to action-related concepts',
    effectiveness: 0.69,
    duration_minutes: 10,
    applications: ['behavior_trigger', 'habit_activation', 'motor_preparation']
  },
  {
    type: 'behavioral',
    name: 'Social Role Priming',
    mechanism: 'Activating role-consistent behaviors',
    implementation: 'Role reminders and identity cues',
    effectiveness: 0.78,
    duration_minutes: 30,
    applications: ['role_behavior', 'identity_salience', 'norm_compliance']
  }
];

interface PrimingSequence {
  id: string;
  target_concept: string;
  primes: Array<{
    content: string;
    timing_seconds: number;
    technique: string;
    delivery_method: string;
  }>;
  total_duration_seconds: number;
  estimated_effectiveness: number;
}

function generateSemanticPrimes(targetConcept: string): string[] {
  // Generate semantically related primes
  const primeCategories: Record<string, string[]> = {
    'trust': ['reliable', 'honest', 'consistent', 'dependable', 'integrity', 'faith', 'bond'],
    'success': ['achieve', 'win', 'accomplish', 'excel', 'triumph', 'prosper', 'thrive'],
    'safety': ['secure', 'protect', 'stable', 'certain', 'comfort', 'shelter', 'guard'],
    'urgency': ['now', 'immediate', 'quick', 'rapid', 'instant', 'deadline', 'limited'],
    'value': ['worth', 'benefit', 'gain', 'advantage', 'profit', 'reward', 'treasure'],
    'connection': ['together', 'united', 'bond', 'link', 'relate', 'join', 'share'],
    'power': ['control', 'authority', 'command', 'influence', 'strength', 'force', 'lead'],
    'freedom': ['choice', 'liberty', 'independent', 'autonomy', 'flexible', 'unrestricted'],
    'exclusivity': ['rare', 'unique', 'special', 'select', 'premium', 'elite', 'privileged'],
    'novelty': ['new', 'fresh', 'innovative', 'discover', 'explore', 'breakthrough', 'first']
  };

  const normalizedConcept = targetConcept.toLowerCase();
  
  // Find matching category or use general positive primes
  for (const [category, primes] of Object.entries(primeCategories)) {
    if (normalizedConcept.includes(category) || category.includes(normalizedConcept)) {
      return primes;
    }
  }

  // Default positive primes
  return ['good', 'positive', 'excellent', 'beneficial', 'advantageous', 'favorable'];
}

function generatePrimingSequence(
  targetConcept: string,
  objective: string,
  deliveryContext: string,
  profileData: any
): PrimingSequence {
  const primes: PrimingSequence['primes'] = [];
  let totalDuration = 0;

  // Select appropriate techniques based on objective
  const selectedTechniques = PRIMING_TECHNIQUES.filter(t => {
    if (objective === 'attitude_change') return t.type === 'affective' || t.type === 'semantic';
    if (objective === 'motivation') return t.type === 'goal';
    if (objective === 'behavior') return t.type === 'behavioral' || t.type === 'goal';
    if (objective === 'evaluation') return t.type === 'affective' || t.type === 'perceptual';
    return true;
  }).slice(0, 3);

  const semanticPrimes = generateSemanticPrimes(targetConcept);

  // Build priming sequence
  selectedTechniques.forEach((technique, index) => {
    const prime = semanticPrimes[index % semanticPrimes.length];
    const timing = totalDuration + (index * 10);
    
    primes.push({
      content: prime,
      timing_seconds: timing,
      technique: technique.name,
      delivery_method: deliveryContext === 'text' ? 'embedded_text' : 
                       deliveryContext === 'visual' ? 'flash_image' : 'audio_whisper'
    });

    totalDuration += technique.duration_minutes * 60;
  });

  // Calculate overall effectiveness
  const avgEffectiveness = selectedTechniques.reduce((sum, t) => sum + t.effectiveness, 0) / selectedTechniques.length;

  return {
    id: crypto.randomUUID(),
    target_concept: targetConcept,
    primes,
    total_duration_seconds: totalDuration,
    estimated_effectiveness: avgEffectiveness
  };
}

function generateMessageWithEmbeddedPrimes(
  baseMessage: string,
  primes: string[],
  technique: 'interleave' | 'bookend' | 'cluster'
): string {
  switch (technique) {
    case 'interleave':
      // Spread primes throughout message
      const sentences = baseMessage.split('. ');
      const result: string[] = [];
      sentences.forEach((sentence, i) => {
        if (i < primes.length && i % 2 === 0) {
          result.push(`${primes[i]},`);
        }
        result.push(sentence);
      });
      return result.join('. ');

    case 'bookend':
      // Prime at start and end
      return `${primes[0]}... ${baseMessage} ...${primes[primes.length - 1]}`;

    case 'cluster':
      // Cluster primes together before message
      return `${primes.join(' - ')}. ${baseMessage}`;

    default:
      return baseMessage;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, profileId, data } = await req.json();

    if (action === 'list_techniques') {
      return new Response(JSON.stringify({
        success: true,
        techniques: PRIMING_TECHNIQUES,
        categories: [...new Set(PRIMING_TECHNIQUES.map(t => t.type))]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate_sequence') {
      const { targetConcept, objective, deliveryContext } = data;

      // Get profile data if available
      let profileData = null;
      if (profileId) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('psychological_profile')
          .eq('id', profileId)
          .single();
        profileData = profile;
      }

      const sequence = generatePrimingSequence(
        targetConcept,
        objective,
        deliveryContext,
        profileData
      );

      // Store sequence for tracking
      await supabaseClient.from('priming_protocols').insert({
        id: sequence.id,
        user_id: userId,
        profile_id: profileId,
        prime_type: objective,
        target_concept: targetConcept,
        delivery_schedule: sequence,
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        sequence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'embed_primes') {
      const { baseMessage, targetConcept, technique } = data;
      
      const primes = generateSemanticPrimes(targetConcept);
      const enhancedMessage = generateMessageWithEmbeddedPrimes(
        baseMessage,
        primes,
        technique || 'interleave'
      );

      return new Response(JSON.stringify({
        success: true,
        original_message: baseMessage,
        primed_message: enhancedMessage,
        primes_used: primes
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'measure_effect') {
      const { sequenceId, measuredResponse } = data;

      // Update sequence with measured effect
      await supabaseClient
        .from('priming_protocols')
        .update({
          measured_effect: measuredResponse.effect_magnitude,
          measurement_notes: measuredResponse.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', sequenceId);

      return new Response(JSON.stringify({
        success: true,
        recorded: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_recommendations') {
      const { objective, context } = data;

      const recommendations = PRIMING_TECHNIQUES
        .filter(t => t.applications.some(a => objective.toLowerCase().includes(a)))
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, 5)
        .map(t => ({
          technique: t.name,
          type: t.type,
          effectiveness: t.effectiveness,
          implementation: t.implementation,
          duration: `${t.duration_minutes} minutes`
        }));

      return new Response(JSON.stringify({
        success: true,
        recommendations,
        general_tips: [
          'Prime timing should be 50-500ms before target for perceptual priming',
          'Semantic primes work best within 15 minutes of target',
          'Goal primes can have effects lasting 30+ minutes',
          'Avoid obvious primes that trigger conscious awareness',
          'Repeated exposure increases fluency effect'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in subliminal-messaging-engine:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
