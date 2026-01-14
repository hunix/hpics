import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HypnoticPattern {
  type: string;
  name: string;
  template: string;
  description: string;
  effectiveness: number;
  useCases: string[];
}

const HYPNOTIC_PATTERNS: HypnoticPattern[] = [
  // Embedded Commands
  {
    type: 'embedded_command',
    name: 'Embedded Directive',
    template: "I'm wondering if you might {COMMAND} as we continue...",
    description: 'Hidden imperatives within casual speech that bypass conscious resistance',
    effectiveness: 0.78,
    useCases: ['compliance', 'behavior_change', 'decision_influence']
  },
  {
    type: 'embedded_command',
    name: 'Quotes Pattern',
    template: "A friend once told me, '{COMMAND}', and it really resonated...",
    description: 'Commands delivered through quoted speech to create psychological distance',
    effectiveness: 0.82,
    useCases: ['suggestion', 'belief_modification', 'action_trigger']
  },
  
  // Presuppositions
  {
    type: 'presupposition',
    name: 'Temporal Presupposition',
    template: "Before you {ACTION}, you might want to consider...",
    description: 'Assumes the action will happen, embedding it as background fact',
    effectiveness: 0.85,
    useCases: ['commitment', 'action_framing', 'assumption_embedding']
  },
  {
    type: 'presupposition',
    name: 'Awareness Presupposition',
    template: "Have you noticed how you've already begun to {DESIRED_STATE}?",
    description: 'Presupposes change has already occurred',
    effectiveness: 0.79,
    useCases: ['state_change', 'reframing', 'progress_acceleration']
  },
  {
    type: 'presupposition',
    name: 'Ordinal Presupposition',
    template: "What's the first thing you'll notice when {OUTCOME}?",
    description: 'Presupposes the outcome through ordinal reference',
    effectiveness: 0.81,
    useCases: ['future_pacing', 'outcome_assumption', 'visualization']
  },
  
  // Future Pacing
  {
    type: 'future_pacing',
    name: 'Vivid Future',
    template: "Imagine a month from now, when you've already {OUTCOME}, looking back at this moment...",
    description: 'Guides visualization of desired outcome as accomplished',
    effectiveness: 0.88,
    useCases: ['motivation', 'commitment', 'resistance_bypass']
  },
  {
    type: 'future_pacing',
    name: 'Consequential Future',
    template: "When you {ACTION} and experience {BENEFIT}, you'll understand why...",
    description: 'Links present action to future benefit as certainty',
    effectiveness: 0.84,
    useCases: ['action_trigger', 'benefit_association', 'motivation']
  },
  
  // Temporal Distortion
  {
    type: 'temporal_distortion',
    name: 'Time Compression',
    template: "In just a moment, which can feel like no time at all, you'll find yourself...",
    description: 'Manipulates perception of time passing quickly',
    effectiveness: 0.76,
    useCases: ['urgency', 'waiting_tolerance', 'action_acceleration']
  },
  {
    type: 'temporal_distortion',
    name: 'Time Expansion',
    template: "Take all the time you need, even if it's just a few seconds, to fully appreciate...",
    description: 'Creates perception of having more time for reflection',
    effectiveness: 0.74,
    useCases: ['deep_processing', 'consideration', 'value_appreciation']
  },
  
  // Analogical Marking
  {
    type: 'analogical_marking',
    name: 'Emphasis Pattern',
    template: "When you really THINK about it, the obvious CHOICE becomes CLEAR...",
    description: 'Tonal emphasis on key words creates embedded message',
    effectiveness: 0.77,
    useCases: ['voice_delivery', 'subliminal_message', 'emphasis']
  },
  
  // Confusion Techniques
  {
    type: 'confusion',
    name: 'Overload Pattern',
    template: "As you consider the ways in which what you're thinking about relates to what you're feeling about what you want...",
    description: 'Overloads rational processing to bypass resistance',
    effectiveness: 0.71,
    useCases: ['pattern_interrupt', 'resistance_bypass', 'suggestion_insertion']
  },
  {
    type: 'confusion',
    name: 'Negation Confusion',
    template: "Don't think about how easy it would be to {ACTION}, unless you're ready to...",
    description: 'Uses negation paradox to embed suggestion',
    effectiveness: 0.73,
    useCases: ['reverse_psychology', 'attention_capture', 'suggestion']
  },
  
  // Yes-Set Patterns
  {
    type: 'yes_set',
    name: 'Agreement Ladder',
    template: "You're {TRUISM_1}, and you're {TRUISM_2}, and naturally {SUGGESTION}...",
    description: 'Builds agreement momentum through undeniable truths',
    effectiveness: 0.86,
    useCases: ['compliance', 'agreement_building', 'suggestion_acceptance']
  },
  
  // Double Binds
  {
    type: 'double_bind',
    name: 'Illusory Choice',
    template: "Would you prefer to {OPTION_A} now, or would you rather {OPTION_B}?",
    description: 'Offers choices that lead to same outcome',
    effectiveness: 0.89,
    useCases: ['decision_forcing', 'compliance', 'action_trigger']
  },
  {
    type: 'double_bind',
    name: 'Temporal Bind',
    template: "I don't know if you'll {ACTION} immediately or take a moment first...",
    description: 'Binds timing while presupposing action',
    effectiveness: 0.83,
    useCases: ['action_certainty', 'timing_flexibility', 'commitment']
  },
  
  // Rapport & Pacing
  {
    type: 'pacing_leading',
    name: 'Pace-Pace-Lead',
    template: "You're {OBSERVATION_1}... and you're {OBSERVATION_2}... which means you can {SUGGESTION}...",
    description: 'Validates current state then leads to new state',
    effectiveness: 0.87,
    useCases: ['rapport', 'state_change', 'suggestion']
  },
  
  // Cause-Effect Linkage
  {
    type: 'cause_effect',
    name: 'Causal Bridge',
    template: "As you {CURRENT_ACTION}, you'll notice {DESIRED_EFFECT}...",
    description: 'Links unrelated events as cause and effect',
    effectiveness: 0.80,
    useCases: ['association', 'state_linking', 'behavior_chaining']
  },
  
  // Meta-Model Violations (Strategic)
  {
    type: 'meta_model',
    name: 'Universal Quantifier',
    template: "Everyone who {ACTION} discovers that {BENEFIT}...",
    description: 'Uses universal claim to create social proof',
    effectiveness: 0.75,
    useCases: ['social_proof', 'normalization', 'expectation_setting']
  },
  {
    type: 'meta_model',
    name: 'Nominalization',
    template: "The understanding you're developing leads to transformation...",
    description: 'Converts processes to things, making them seem fixed',
    effectiveness: 0.72,
    useCases: ['reification', 'stability', 'permanence']
  }
];

interface ProfilePsychology {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  dominantEmotionalState: string;
  resistanceLevel: string;
  primaryValues: string[];
  communicationStyle: string;
}

function selectOptimalPatterns(
  psychology: ProfilePsychology,
  objective: string,
  context: string
): HypnoticPattern[] {
  const scored = HYPNOTIC_PATTERNS.map(pattern => {
    let score = pattern.effectiveness;
    
    // Adjust for personality traits
    if (psychology.openness > 0.7) {
      if (['future_pacing', 'meta_model'].includes(pattern.type)) score += 0.1;
    }
    if (psychology.agreeableness > 0.7) {
      if (['yes_set', 'pacing_leading'].includes(pattern.type)) score += 0.15;
    }
    if (psychology.conscientiousness > 0.7) {
      if (['presupposition', 'cause_effect'].includes(pattern.type)) score += 0.1;
    }
    if (psychology.neuroticism > 0.6) {
      if (['confusion'].includes(pattern.type)) score -= 0.2; // Avoid with anxious
      if (['pacing_leading'].includes(pattern.type)) score += 0.1;
    }
    
    // Adjust for resistance level
    if (psychology.resistanceLevel === 'high') {
      if (['embedded_command', 'double_bind'].includes(pattern.type)) score += 0.15;
      if (['yes_set'].includes(pattern.type)) score -= 0.1;
    }
    
    // Adjust for objective match
    if (pattern.useCases.some(uc => objective.toLowerCase().includes(uc))) {
      score += 0.2;
    }
    
    return { pattern, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.pattern);
}

function generateScript(
  patterns: HypnoticPattern[],
  variables: Record<string, string>,
  psychology: ProfilePsychology
): string {
  const scripts: string[] = [];
  
  for (const pattern of patterns) {
    let script = pattern.template;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      script = script.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    
    // Add delivery notes
    const deliveryNote = generateDeliveryNotes(pattern, psychology);
    scripts.push(`[${pattern.name}]\n${script}\n\n${deliveryNote}`);
  }
  
  return scripts.join('\n\n---\n\n');
}

function generateDeliveryNotes(pattern: HypnoticPattern, psychology: ProfilePsychology): string {
  const notes: string[] = ['📌 Delivery Notes:'];
  
  if (pattern.type === 'embedded_command') {
    notes.push('• Lower voice slightly on the embedded command');
    notes.push('• Pause briefly before and after the command');
  }
  
  if (pattern.type === 'analogical_marking') {
    notes.push('• Use distinct tonal shift for CAPITALIZED words');
    notes.push('• Maintain eye contact during marked words');
  }
  
  if (pattern.type === 'confusion') {
    notes.push('• Speak slightly faster to overwhelm processing');
    notes.push('• Insert suggestion during confused state');
  }
  
  if (psychology.communicationStyle === 'visual') {
    notes.push('• Use visual language: "See how...", "Picture this..."');
  } else if (psychology.communicationStyle === 'auditory') {
    notes.push('• Use auditory language: "Sounds like...", "Hear me out..."');
  } else if (psychology.communicationStyle === 'kinesthetic') {
    notes.push('• Use feeling language: "Get a feel for...", "Grasp this..."');
  }
  
  return notes.join('\n');
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

    const { action, profileId, objective, context, variables, userId } = await req.json();

    if (action === 'get_patterns') {
      // Get profile psychology
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('psychological_profile, communication_patterns')
        .eq('id', profileId)
        .single();

      const psychology: ProfilePsychology = {
        openness: profile?.psychological_profile?.big_five?.openness ?? 0.5,
        conscientiousness: profile?.psychological_profile?.big_five?.conscientiousness ?? 0.5,
        extraversion: profile?.psychological_profile?.big_five?.extraversion ?? 0.5,
        agreeableness: profile?.psychological_profile?.big_five?.agreeableness ?? 0.5,
        neuroticism: profile?.psychological_profile?.big_five?.neuroticism ?? 0.5,
        dominantEmotionalState: profile?.psychological_profile?.dominant_emotion ?? 'neutral',
        resistanceLevel: profile?.psychological_profile?.resistance_level ?? 'medium',
        primaryValues: profile?.psychological_profile?.values ?? [],
        communicationStyle: profile?.communication_patterns?.preferred_style ?? 'mixed'
      };

      const selectedPatterns = selectOptimalPatterns(psychology, objective, context);

      return new Response(JSON.stringify({
        success: true,
        patterns: selectedPatterns,
        psychology_summary: psychology
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate_script') {
      // Get profile psychology
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('psychological_profile, communication_patterns')
        .eq('id', profileId)
        .single();

      const psychology: ProfilePsychology = {
        openness: profile?.psychological_profile?.big_five?.openness ?? 0.5,
        conscientiousness: profile?.psychological_profile?.big_five?.conscientiousness ?? 0.5,
        extraversion: profile?.psychological_profile?.big_five?.extraversion ?? 0.5,
        agreeableness: profile?.psychological_profile?.big_five?.agreeableness ?? 0.5,
        neuroticism: profile?.psychological_profile?.big_five?.neuroticism ?? 0.5,
        dominantEmotionalState: profile?.psychological_profile?.dominant_emotion ?? 'neutral',
        resistanceLevel: profile?.psychological_profile?.resistance_level ?? 'medium',
        primaryValues: profile?.psychological_profile?.values ?? [],
        communicationStyle: profile?.communication_patterns?.preferred_style ?? 'mixed'
      };

      const selectedPatterns = selectOptimalPatterns(psychology, objective, context);
      const script = generateScript(selectedPatterns, variables, psychology);

      // Log usage
      await supabaseClient.from('influence_scripts').insert({
        user_id: userId,
        profile_id: profileId,
        objective,
        context,
        patterns_used: selectedPatterns.map(p => p.name),
        generated_script: script,
        effectiveness_estimate: selectedPatterns.reduce((sum, p) => sum + p.effectiveness, 0) / selectedPatterns.length
      });

      return new Response(JSON.stringify({
        success: true,
        script,
        patterns_used: selectedPatterns,
        estimated_effectiveness: selectedPatterns.reduce((sum, p) => sum + p.effectiveness, 0) / selectedPatterns.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list_all_patterns') {
      return new Response(JSON.stringify({
        success: true,
        patterns: HYPNOTIC_PATTERNS,
        categories: [...new Set(HYPNOTIC_PATTERNS.map(p => p.type))]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in nlp-hypnotic-patterns:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
