import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * FBI Tactical Negotiation Engine
 * Implements Chris Voss negotiation techniques:
 * - Late-Night FM DJ Voice coaching
 * - Tactical Mirroring
 * - Labeling emotions
 * - Accusation Audit
 * - Calibrated Questions
 * - Strategic Use of Evidence (SUE)
 */

interface NegotiationContext {
  profile_id: string;
  objective: string;
  relationship_history?: string;
  known_positions?: string[];
  emotional_state?: string;
  power_dynamic?: 'advantage' | 'disadvantage' | 'neutral';
  stakes?: 'high' | 'medium' | 'low';
  transcript?: string;
}

interface MirroringResponse {
  original_statement: string;
  mirror_phrase: string;
  purpose: string;
  expected_response: string;
}

interface LabelResponse {
  detected_emotion: string;
  label_phrase: string;
  purpose: string;
  follow_up_silence_seconds: number;
}

interface CalibratedQuestion {
  question: string;
  type: 'how' | 'what';
  purpose: string;
  expected_outcome: string;
  power_shift: 'towards_you' | 'neutral';
}

interface AccusationAuditItem {
  potential_objection: string;
  preemptive_acknowledgment: string;
  defusing_effect: string;
}

interface SUEStrategy {
  evidence_pieces: string[];
  disclosure_order: string[];
  behavior_provoking_questions: string[];
  punishment_questions: string[];
  expected_inconsistencies: string[];
}

// FBI negotiation tactics generator
function generateMirrors(statements: string[]): MirroringResponse[] {
  return statements.map(statement => {
    // Extract last 1-3 critical words
    const words = statement.split(' ').filter(w => w.length > 3);
    const lastWords = words.slice(-3).join(' ');
    
    return {
      original_statement: statement,
      mirror_phrase: `${lastWords}?`,
      purpose: 'Encourage elaboration and buy thinking time',
      expected_response: 'Target will expand on their statement, often revealing more information'
    };
  });
}

function generateLabels(emotionalCues: string[]): LabelResponse[] {
  const labelPrefixes = [
    'It seems like',
    'It sounds like',
    'It looks like',
    'It feels like'
  ];
  
  const emotionMappings: Record<string, string[]> = {
    'frustration': ['you\'re frustrated with', 'this has been challenging for you', 'you feel stuck'],
    'anger': ['you\'re upset about', 'this really bothers you', 'you feel wronged'],
    'fear': ['you\'re worried about', 'there\'s some concern about', 'you\'re uncertain about'],
    'excitement': ['you\'re excited about', 'this is important to you', 'you see potential here'],
    'distrust': ['you\'re skeptical about', 'you\'ve been burned before', 'trust is an issue'],
    'pressure': ['you feel pressured', 'there\'s urgency here', 'timing is critical for you'],
    'hope': ['you\'re hopeful about', 'you see a way forward', 'there\'s optimism here']
  };
  
  return emotionalCues.map(cue => {
    const emotion = cue.toLowerCase();
    const mappings = emotionMappings[emotion] || [`you\'re experiencing ${emotion}`];
    const prefix = labelPrefixes[Math.floor(Math.random() * labelPrefixes.length)];
    const mapping = mappings[Math.floor(Math.random() * mappings.length)];
    
    return {
      detected_emotion: cue,
      label_phrase: `${prefix} ${mapping}...`,
      purpose: 'Validate emotion, build rapport, encourage "that\'s right" response',
      follow_up_silence_seconds: 4
    };
  });
}

function generateCalibratedQuestions(objective: string, context: NegotiationContext): CalibratedQuestion[] {
  const questions: CalibratedQuestion[] = [];
  
  // How questions - implementation focused
  const howQuestions = [
    {
      question: 'How am I supposed to do that?',
      type: 'how' as const,
      purpose: 'Force them to consider your constraints without saying no',
      expected_outcome: 'They propose solutions or modify their demand',
      power_shift: 'towards_you' as const
    },
    {
      question: 'How can we make this work for both of us?',
      type: 'how' as const,
      purpose: 'Create collaborative framing while maintaining your position',
      expected_outcome: 'Opens negotiation space without conceding',
      power_shift: 'neutral' as const
    },
    {
      question: 'How would you like me to proceed?',
      type: 'how' as const,
      purpose: 'Give illusion of control while gathering information',
      expected_outcome: 'Reveals their priorities and preferred outcome',
      power_shift: 'towards_you' as const
    },
    {
      question: 'How does this fit into your overall goals?',
      type: 'how' as const,
      purpose: 'Understand bigger picture and find leverage points',
      expected_outcome: 'Reveals underlying motivations',
      power_shift: 'towards_you' as const
    }
  ];
  
  // What questions - information gathering
  const whatQuestions = [
    {
      question: 'What\'s the biggest challenge you\'re facing here?',
      type: 'what' as const,
      purpose: 'Identify pain points you can address',
      expected_outcome: 'Reveals core concerns and potential value adds',
      power_shift: 'towards_you' as const
    },
    {
      question: 'What would it take to make this happen?',
      type: 'what' as const,
      purpose: 'Get them to define success criteria',
      expected_outcome: 'Creates clear target for negotiation',
      power_shift: 'neutral' as const
    },
    {
      question: 'What happens if we don\'t reach an agreement?',
      type: 'what' as const,
      purpose: 'Explore BATNA without threatening',
      expected_outcome: 'Reveals their alternatives and pressure points',
      power_shift: 'towards_you' as const
    },
    {
      question: 'What are we missing here?',
      type: 'what' as const,
      purpose: 'Uncover hidden objections or concerns',
      expected_outcome: 'Surfaces unspoken issues',
      power_shift: 'neutral' as const
    }
  ];
  
  questions.push(...howQuestions, ...whatQuestions);
  
  // Context-specific questions
  if (context.power_dynamic === 'disadvantage') {
    questions.push({
      question: 'What would you do in my position?',
      type: 'what' as const,
      purpose: 'Create empathy and buy time',
      expected_outcome: 'They consider your perspective, softens their position',
      power_shift: 'towards_you' as const
    });
  }
  
  if (context.stakes === 'high') {
    questions.push({
      question: 'How do we make sure neither of us regrets this later?',
      type: 'how' as const,
      purpose: 'Frame as mutual risk, create partnership feeling',
      expected_outcome: 'Shifts from adversarial to collaborative',
      power_shift: 'towards_you' as const
    });
  }
  
  return questions;
}

function generateAccusationAudit(context: NegotiationContext): AccusationAuditItem[] {
  const commonObjections = [
    {
      potential_objection: 'You\'re just trying to take advantage of me',
      preemptive_acknowledgment: 'You probably think I\'m trying to take advantage of you...',
      defusing_effect: 'By naming it first, you take away its power and seem more trustworthy'
    },
    {
      potential_objection: 'This isn\'t fair to me',
      preemptive_acknowledgment: 'I know this might seem one-sided at first...',
      defusing_effect: 'Acknowledges their perspective, opens space for explanation'
    },
    {
      potential_objection: 'You\'re being unreasonable',
      preemptive_acknowledgment: 'You might think I\'m being unreasonable here...',
      defusing_effect: 'Disarms defensive reaction, invites dialogue'
    },
    {
      potential_objection: 'Why should I trust you?',
      preemptive_acknowledgment: 'I know you have no reason to trust me yet...',
      defusing_effect: 'Shows self-awareness, builds credibility'
    },
    {
      potential_objection: 'You\'re wasting my time',
      preemptive_acknowledgment: 'I know your time is valuable and this might seem like a waste...',
      defusing_effect: 'Validates their concern, earns permission to continue'
    }
  ];
  
  // Add context-specific objections
  if (context.relationship_history?.includes('conflict')) {
    commonObjections.push({
      potential_objection: 'We\'ve had problems before',
      preemptive_acknowledgment: 'I know we\'ve had difficulties in the past, and you\'re probably skeptical...',
      defusing_effect: 'Acknowledges history, shows willingness to move forward'
    });
  }
  
  if (context.power_dynamic === 'advantage') {
    commonObjections.push({
      potential_objection: 'You\'re bullying me',
      preemptive_acknowledgment: 'I don\'t want you to feel pressured or backed into a corner...',
      defusing_effect: 'Softens power dynamic, creates space for genuine discussion'
    });
  }
  
  return commonObjections;
}

function generateSUEStrategy(evidence: string[], context: NegotiationContext): SUEStrategy {
  // Strategic Use of Evidence - hold evidence, ask questions, reveal strategically
  const sortedEvidence = [...evidence].sort((a, b) => {
    // Sort by importance (longer = more detailed = more important for this demo)
    return b.length - a.length;
  });
  
  const disclosureOrder = sortedEvidence.map((_, i) => `Phase ${i + 1}`);
  
  const bpqs = sortedEvidence.map(e => {
    return `Tell me about ${e.split(' ').slice(0, 3).join(' ')}...`;
  });
  
  const punishmentQuestions = [
    'Why do you think someone might say differently?',
    'What would explain the discrepancy between what you\'re saying and what I\'m hearing from others?',
    'Help me understand why the evidence might suggest otherwise',
    'If I told you I had proof, what would you want me to know first?'
  ];
  
  return {
    evidence_pieces: sortedEvidence,
    disclosure_order: disclosureOrder,
    behavior_provoking_questions: bpqs,
    punishment_questions: punishmentQuestions,
    expected_inconsistencies: sortedEvidence.map(e => `Statement regarding: ${e.substring(0, 30)}...`)
  };
}

async function generateNegotiationPlaybook(
  context: NegotiationContext,
  supabaseClient: any
): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  // Generate tactical components
  const calibratedQuestions = generateCalibratedQuestions(context.objective, context);
  const accusationAudit = generateAccusationAudit(context);
  
  // If we have transcript, analyze for mirroring and labeling opportunities
  let mirrors: MirroringResponse[] = [];
  let labels: LabelResponse[] = [];
  
  if (context.transcript) {
    const statements = context.transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
    mirrors = generateMirrors(statements.slice(-5)); // Last 5 statements
  }
  
  if (context.emotional_state) {
    labels = generateLabels([context.emotional_state]);
  }
  
  // Generate AI-enhanced strategy if API key available
  let aiStrategy = null;
  if (LOVABLE_API_KEY) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert negotiation strategist trained in FBI negotiation techniques (Chris Voss methodology). 
              Generate a comprehensive negotiation strategy based on the context provided.
              Focus on: tactical empathy, calibrated questions, labeling, mirroring, and the accusation audit.
              Be specific and actionable.`
            },
            {
              role: 'user',
              content: `Generate a negotiation strategy for the following situation:
              
              Objective: ${context.objective}
              Power Dynamic: ${context.power_dynamic || 'neutral'}
              Stakes: ${context.stakes || 'medium'}
              Relationship History: ${context.relationship_history || 'unknown'}
              Target's Known Positions: ${context.known_positions?.join(', ') || 'unknown'}
              Target's Emotional State: ${context.emotional_state || 'unknown'}
              
              Provide:
              1. Opening strategy (first 3 moves)
              2. Key emotional labels to use
              3. 5 calibrated questions specific to this situation
              4. Potential "that's right" moment to aim for
              5. Walk-away point recommendation
              6. Concession strategy (what to give, in what order)
              7. Black Swan opportunities to look for`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        aiStrategy = data.choices?.[0]?.message?.content;
      }
    } catch (error) {
      console.error('AI strategy generation failed:', error);
    }
  }
  
  return {
    context: {
      objective: context.objective,
      power_dynamic: context.power_dynamic || 'neutral',
      stakes: context.stakes || 'medium'
    },
    tactical_components: {
      calibrated_questions: calibratedQuestions,
      accusation_audit: accusationAudit,
      mirroring_opportunities: mirrors,
      emotional_labels: labels
    },
    voice_coaching: {
      primary_voice: 'Late-Night FM DJ Voice',
      characteristics: [
        'Slow, measured pace',
        'Downward inflection at end of sentences',
        'Calm and reassuring tone',
        'Strategic pauses after key statements'
      ],
      when_to_use: 'Default voice for building rapport and calming tense situations'
    },
    ai_enhanced_strategy: aiStrategy,
    execution_tips: [
      'Label emotions before making any request',
      'Use calibrated questions to say "no" without saying no',
      'Mirror the last 1-3 words to keep them talking',
      'Aim for "that\'s right" not "you\'re right"',
      'Let silence work for you after labels',
      'Never split the difference on important issues'
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'tactical-negotiation-engine', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { action, context, profile_id } = body;

    let result;

    switch (action) {
      case 'generate_playbook':
        result = await generateNegotiationPlaybook(context as NegotiationContext, supabaseClient);
        
        // Store the session
        if (profile_id) {
          await supabaseClient.from('negotiation_sessions').insert({
            user_id: user.id,
            profile_id,
            session_type: context.objective,
            objectives: [context.objective],
            fbi_tactics_used: ['mirroring', 'labeling', 'calibrated_questions', 'accusation_audit'],
            calibrated_questions: result.tactical_components.calibrated_questions,
            accusation_audit: result.tactical_components.accusation_audit
          });
        }
        break;
        
      case 'generate_mirrors':
        const { statements } = body;
        result = generateMirrors(statements);
        break;
        
      case 'generate_labels':
        const { emotions } = body;
        result = generateLabels(emotions);
        break;
        
      case 'generate_questions':
        result = generateCalibratedQuestions(context.objective, context);
        break;
        
      case 'generate_audit':
        result = generateAccusationAudit(context);
        break;
        
      case 'generate_sue_strategy':
        const { evidence } = body;
        result = generateSUEStrategy(evidence, context);
        break;
        
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tactical negotiation engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
