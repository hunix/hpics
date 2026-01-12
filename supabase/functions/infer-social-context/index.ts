import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContextSignal {
  type: 'location' | 'bluetooth' | 'calendar' | 'motion' | 'time' | 'audio';
  value: unknown;
  confidence: number;
  timestamp: string;
}

interface SocialContext {
  primaryContext: 'work' | 'social' | 'family' | 'commute' | 'rest' | 'meeting' | 'exercise' | 'unknown';
  confidence: number;
  subContext?: string;
  suggestedActions: string[];
  nearbyContacts: string[];
  appropriateBehaviors: string[];
}

function inferContext(signals: ContextSignal[]): SocialContext {
  const contextScores: Record<string, number> = {
    work: 0,
    social: 0,
    family: 0,
    commute: 0,
    rest: 0,
    meeting: 0,
    exercise: 0
  };

  const nearbyContacts: string[] = [];
  let totalConfidence = 0;

  for (const signal of signals) {
    totalConfidence += signal.confidence;

    switch (signal.type) {
      case 'location':
        const location = signal.value as { type?: string; name?: string };
        if (location.type === 'office' || location.type === 'work') {
          contextScores.work += 30 * signal.confidence;
        } else if (location.type === 'home') {
          contextScores.rest += 20 * signal.confidence;
          contextScores.family += 15 * signal.confidence;
        } else if (location.type === 'gym' || location.type === 'park') {
          contextScores.exercise += 25 * signal.confidence;
        } else if (location.type === 'restaurant' || location.type === 'bar' || location.type === 'cafe') {
          contextScores.social += 25 * signal.confidence;
        } else if (location.type === 'transit') {
          contextScores.commute += 30 * signal.confidence;
        }
        break;

      case 'bluetooth':
        const devices = signal.value as { names?: string[]; count?: number };
        if (devices.count && devices.count > 5) {
          contextScores.meeting += 20 * signal.confidence;
          contextScores.social += 15 * signal.confidence;
        }
        if (devices.names) {
          nearbyContacts.push(...devices.names);
        }
        break;

      case 'calendar':
        const event = signal.value as { type?: string; attendees?: number };
        if (event.type === 'meeting') {
          contextScores.meeting += 40 * signal.confidence;
          contextScores.work += 20 * signal.confidence;
        } else if (event.type === 'personal') {
          contextScores.social += 20 * signal.confidence;
        }
        if (event.attendees && event.attendees > 2) {
          contextScores.meeting += 10 * signal.confidence;
        }
        break;

      case 'motion':
        const motion = signal.value as { activity?: string; speed?: number };
        if (motion.activity === 'driving' || motion.activity === 'in_vehicle') {
          contextScores.commute += 35 * signal.confidence;
        } else if (motion.activity === 'walking' && motion.speed && motion.speed > 4) {
          contextScores.exercise += 20 * signal.confidence;
        } else if (motion.activity === 'running') {
          contextScores.exercise += 35 * signal.confidence;
        } else if (motion.activity === 'still') {
          contextScores.rest += 10 * signal.confidence;
          contextScores.work += 10 * signal.confidence;
        }
        break;

      case 'time':
        const time = signal.value as { hour?: number; dayOfWeek?: number };
        if (time.hour !== undefined) {
          if (time.hour >= 9 && time.hour <= 17 && time.dayOfWeek !== undefined && time.dayOfWeek >= 1 && time.dayOfWeek <= 5) {
            contextScores.work += 15 * signal.confidence;
          } else if (time.hour >= 22 || time.hour <= 6) {
            contextScores.rest += 25 * signal.confidence;
          } else if (time.hour >= 18 && time.hour <= 21) {
            contextScores.social += 10 * signal.confidence;
            contextScores.family += 10 * signal.confidence;
          }
        }
        break;

      case 'audio':
        const audio = signal.value as { type?: string; volume?: number };
        if (audio.type === 'speech' && audio.volume && audio.volume > 0.6) {
          contextScores.meeting += 15 * signal.confidence;
          contextScores.social += 10 * signal.confidence;
        } else if (audio.type === 'music') {
          contextScores.rest += 10 * signal.confidence;
          contextScores.exercise += 5 * signal.confidence;
        }
        break;
    }
  }

  // Find primary context
  let primaryContext: SocialContext['primaryContext'] = 'unknown';
  let maxScore = 0;

  for (const [context, score] of Object.entries(contextScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryContext = context as SocialContext['primaryContext'];
    }
  }

  // Calculate normalized confidence
  const totalScores = Object.values(contextScores).reduce((a, b) => a + b, 0);
  const confidence = totalScores > 0 ? Math.min(0.95, maxScore / totalScores + 0.3) : 0.5;

  // Generate suggested actions based on context
  const suggestedActions: string[] = [];
  const appropriateBehaviors: string[] = [];

  switch (primaryContext) {
    case 'work':
      suggestedActions.push('Focus on professional tasks', 'Check work messages');
      appropriateBehaviors.push('Professional communication', 'Minimize personal calls');
      break;
    case 'meeting':
      suggestedActions.push('Take notes', 'Silence notifications', 'Capture key insights');
      appropriateBehaviors.push('Active listening', 'Note-taking', 'Professional demeanor');
      break;
    case 'social':
      suggestedActions.push('Capture moment', 'Log interaction', 'Exchange contacts');
      appropriateBehaviors.push('Relaxed conversation', 'Active engagement');
      break;
    case 'family':
      suggestedActions.push('Be present', 'Minimize work distractions');
      appropriateBehaviors.push('Quality time focus', 'Personal attention');
      break;
    case 'commute':
      suggestedActions.push('Review schedule', 'Listen to briefings', 'Prepare for next context');
      appropriateBehaviors.push('Hands-free only', 'Planning mindset');
      break;
    case 'rest':
      suggestedActions.push('Relax', 'Review tomorrow\'s schedule');
      appropriateBehaviors.push('Wind down', 'Minimal screen time');
      break;
    case 'exercise':
      suggestedActions.push('Track workout', 'Stay focused');
      appropriateBehaviors.push('Physical activity focus', 'Minimal interruptions');
      break;
    default:
      suggestedActions.push('Assess situation', 'Check notifications');
      appropriateBehaviors.push('Context-appropriate behavior');
  }

  return {
    primaryContext,
    confidence: Math.round(confidence * 100) / 100,
    subContext: contextScores[primaryContext] > 30 ? 'high_confidence' : 'low_confidence',
    suggestedActions,
    nearbyContacts: [...new Set(nearbyContacts)],
    appropriateBehaviors
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signals } = await req.json() as { signals: ContextSignal[] };

    if (!signals || !Array.isArray(signals)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signals data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const context = inferContext(signals);

    return new Response(
      JSON.stringify({
        success: true,
        context,
        processedSignals: signals.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in infer-social-context:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
