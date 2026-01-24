import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Life Sequence Predictor (Life2Vec-inspired)
 * Predicts life trajectories based on event sequences:
 * - Career trajectory forecasting
 * - Relationship trajectory modeling
 * - Financial trajectory prediction
 * - Health trajectory estimation
 * - Crisis early warning
 * - Vulnerability window forecasting
 */

interface LifeEvent {
  timestamp: string;
  category: 'career' | 'relationship' | 'financial' | 'health' | 'social' | 'education' | 'family';
  event_type: string;
  magnitude: 'minor' | 'moderate' | 'major' | 'life_changing';
  sentiment: 'positive' | 'neutral' | 'negative';
  context?: string;
}

interface LifeSequence {
  events: LifeEvent[];
  current_age?: number;
  gender?: string;
  location?: string;
  socioeconomic_indicators?: {
    education_level?: string;
    income_bracket?: string;
    occupation_type?: string;
  };
}

interface TrajectoryPrediction {
  category: string;
  current_state: string;
  predicted_trajectory: 'ascending' | 'stable' | 'declining' | 'volatile';
  confidence: number;
  key_predictions: {
    prediction: string;
    timeframe: string;
    probability: number;
    triggering_factors: string[];
  }[];
  risk_factors: string[];
  opportunity_windows: {
    opportunity: string;
    optimal_timing: string;
    action_required: string;
  }[];
}

interface CrisisWarning {
  crisis_type: string;
  probability: number;
  estimated_timeframe: string;
  warning_signs: string[];
  preventive_actions: string[];
  exploitation_opportunity?: string;
}

interface VulnerabilityForecast {
  window_start: string;
  window_end: string;
  vulnerability_type: string;
  intensity: 'mild' | 'moderate' | 'severe';
  recommended_approach: string;
  psychological_state: string;
}

// Life event patterns that predict future outcomes
const PATTERN_INDICATORS = {
  career_decline: [
    'job_loss', 'demotion', 'missed_promotion', 'conflict_with_boss', 
    'industry_decline', 'skill_obsolescence', 'burnout'
  ],
  career_ascent: [
    'promotion', 'new_opportunity', 'skill_acquisition', 'recognition',
    'network_expansion', 'leadership_role', 'successful_project'
  ],
  relationship_crisis: [
    'conflict_increase', 'communication_breakdown', 'infidelity', 'financial_stress',
    'family_pressure', 'life_stage_mismatch', 'intimacy_decline'
  ],
  relationship_growth: [
    'milestone_achieved', 'challenge_overcome', 'commitment_deepened',
    'family_expansion', 'shared_success', 'trust_building'
  ],
  financial_distress: [
    'income_loss', 'unexpected_expense', 'debt_increase', 'investment_loss',
    'lifestyle_inflation', 'emergency', 'poor_planning'
  ],
  mental_health_decline: [
    'isolation', 'stress_accumulation', 'sleep_disruption', 'relationship_loss',
    'identity_crisis', 'trauma', 'substance_increase'
  ]
};

function analyzeLifeSequence(sequence: LifeSequence): {
  patterns: string[];
  trajectory_indicators: Record<string, number>;
  transition_probability: Record<string, number>;
} {
  const patterns: string[] = [];
  const categoryScores: Record<string, { positive: number; negative: number }> = {};
  
  // Initialize category scores
  ['career', 'relationship', 'financial', 'health', 'social'].forEach(cat => {
    categoryScores[cat] = { positive: 0, negative: 0 };
  });
  
  // Analyze recent events (weighted by recency)
  const sortedEvents = [...sequence.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  sortedEvents.forEach((event, index) => {
    const recencyWeight = 1 / (index + 1); // More recent = higher weight
    const magnitudeWeight = 
      event.magnitude === 'life_changing' ? 3 :
      event.magnitude === 'major' ? 2 :
      event.magnitude === 'moderate' ? 1 : 0.5;
    
    const score = recencyWeight * magnitudeWeight;
    
    if (event.sentiment === 'positive') {
      categoryScores[event.category].positive += score;
    } else if (event.sentiment === 'negative') {
      categoryScores[event.category].negative += score;
    }
  });
  
  // Detect patterns
  Object.entries(PATTERN_INDICATORS).forEach(([pattern, indicators]) => {
    const matchingEvents = sequence.events.filter(e => 
      indicators.some(ind => e.event_type.toLowerCase().includes(ind))
    );
    if (matchingEvents.length >= 2) {
      patterns.push(pattern);
    }
  });
  
  // Calculate trajectory indicators
  const trajectoryIndicators: Record<string, number> = {};
  Object.entries(categoryScores).forEach(([category, scores]) => {
    const total = scores.positive + scores.negative;
    if (total > 0) {
      trajectoryIndicators[category] = (scores.positive - scores.negative) / total;
    } else {
      trajectoryIndicators[category] = 0;
    }
  });
  
  // Calculate transition probabilities based on patterns
  const transitionProbability: Record<string, number> = {
    'career_change': patterns.includes('career_decline') ? 0.65 : 0.15,
    'relationship_change': patterns.includes('relationship_crisis') ? 0.55 : 0.10,
    'financial_crisis': patterns.includes('financial_distress') ? 0.70 : 0.08,
    'mental_health_event': patterns.includes('mental_health_decline') ? 0.60 : 0.12,
    'major_life_change': patterns.length >= 2 ? 0.75 : 0.20
  };
  
  return { patterns, trajectory_indicators: trajectoryIndicators, transition_probability: transitionProbability };
}

function predictTrajectory(
  sequence: LifeSequence,
  category: string,
  analysis: ReturnType<typeof analyzeLifeSequence>
): TrajectoryPrediction {
  const indicator = analysis.trajectory_indicators[category] || 0;
  
  let trajectory: 'ascending' | 'stable' | 'declining' | 'volatile';
  if (indicator > 0.3) trajectory = 'ascending';
  else if (indicator < -0.3) trajectory = 'declining';
  else if (Math.abs(indicator) < 0.1) trajectory = 'stable';
  else trajectory = 'volatile';
  
  const predictions: TrajectoryPrediction['key_predictions'] = [];
  const riskFactors: string[] = [];
  const opportunities: TrajectoryPrediction['opportunity_windows'] = [];
  
  // Generate category-specific predictions
  switch (category) {
    case 'career':
      if (trajectory === 'declining') {
        predictions.push({
          prediction: 'Job change or career transition likely',
          timeframe: '6-12 months',
          probability: 0.65,
          triggering_factors: ['Accumulated dissatisfaction', 'Market conditions', 'Skill mismatch']
        });
        riskFactors.push('Burnout risk', 'Income instability', 'Identity crisis');
        opportunities.push({
          opportunity: 'Offer support during transition',
          optimal_timing: 'When they first express doubt',
          action_required: 'Position yourself as trusted advisor'
        });
      } else if (trajectory === 'ascending') {
        predictions.push({
          prediction: 'Promotion or significant opportunity',
          timeframe: '3-9 months',
          probability: 0.55,
          triggering_factors: ['Strong performance', 'Network positioning', 'Market demand']
        });
        opportunities.push({
          opportunity: 'Align with their success trajectory',
          optimal_timing: 'Before major win announced',
          action_required: 'Offer value that accelerates their path'
        });
      }
      break;
      
    case 'relationship':
      if (trajectory === 'declining') {
        predictions.push({
          prediction: 'Relationship restructuring or ending',
          timeframe: '3-12 months',
          probability: 0.50,
          triggering_factors: ['Communication breakdown', 'Unmet needs', 'External stress']
        });
        riskFactors.push('Emotional volatility', 'Decision-making impairment', 'Support seeking');
        opportunities.push({
          opportunity: 'Become emotional support anchor',
          optimal_timing: 'During early signs of distress',
          action_required: 'Be available and non-judgmental'
        });
      }
      break;
      
    case 'financial':
      if (trajectory === 'declining') {
        predictions.push({
          prediction: 'Financial stress event',
          timeframe: '3-6 months',
          probability: 0.60,
          triggering_factors: ['Spending patterns', 'Income instability', 'Debt accumulation']
        });
        opportunities.push({
          opportunity: 'Offer financial guidance or opportunity',
          optimal_timing: 'Before crisis peaks',
          action_required: 'Position as solution provider'
        });
      }
      break;
  }
  
  return {
    category,
    current_state: `${trajectory} trajectory with indicator ${(indicator * 100).toFixed(0)}%`,
    predicted_trajectory: trajectory,
    confidence: Math.min(0.85, 0.5 + sequence.events.length * 0.02),
    key_predictions: predictions,
    risk_factors: riskFactors,
    opportunity_windows: opportunities
  };
}

function forecastVulnerabilityWindows(
  sequence: LifeSequence,
  analysis: ReturnType<typeof analyzeLifeSequence>
): VulnerabilityForecast[] {
  const forecasts: VulnerabilityForecast[] = [];
  const now = new Date();
  
  // Identify upcoming vulnerability windows based on patterns
  if (analysis.patterns.includes('career_decline')) {
    forecasts.push({
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      vulnerability_type: 'Career Identity Crisis',
      intensity: 'moderate',
      recommended_approach: 'Offer alternative identity validation',
      psychological_state: 'Self-doubt, openness to new paths, ego vulnerability'
    });
  }
  
  if (analysis.patterns.includes('relationship_crisis')) {
    forecasts.push({
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      vulnerability_type: 'Emotional Dependency',
      intensity: 'severe',
      recommended_approach: 'Provide consistent emotional support',
      psychological_state: 'Loneliness, validation seeking, attachment activation'
    });
  }
  
  if (analysis.patterns.includes('financial_distress')) {
    forecasts.push({
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      vulnerability_type: 'Financial Desperation',
      intensity: 'severe',
      recommended_approach: 'Offer solutions that require reciprocity',
      psychological_state: 'Anxiety, impaired judgment, openness to risky propositions'
    });
  }
  
  // Add cyclical vulnerability windows
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 1) { // Sunday/Monday
    forecasts.push({
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      vulnerability_type: 'Weekly Low Point',
      intensity: 'mild',
      recommended_approach: 'Offer distraction or support',
      psychological_state: 'Reflective, potentially anxious, receptive to connection'
    });
  }
  
  return forecasts;
}

function generateCrisisWarnings(
  analysis: ReturnType<typeof analyzeLifeSequence>
): CrisisWarning[] {
  const warnings: CrisisWarning[] = [];
  
  Object.entries(analysis.transition_probability).forEach(([crisis, probability]) => {
    if (probability > 0.4) {
      warnings.push({
        crisis_type: crisis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        probability,
        estimated_timeframe: probability > 0.6 ? '1-3 months' : '3-6 months',
        warning_signs: getWarningSignsForCrisis(crisis),
        preventive_actions: getPreventiveActionsForCrisis(crisis),
        exploitation_opportunity: getExploitationOpportunity(crisis)
      });
    }
  });
  
  return warnings.sort((a, b) => b.probability - a.probability);
}

function getWarningSignsForCrisis(crisis: string): string[] {
  const signs: Record<string, string[]> = {
    career_change: [
      'Increased complaints about work',
      'Reduced engagement in current role',
      'Exploring alternative opportunities',
      'Networking more actively'
    ],
    relationship_change: [
      'Decreased communication frequency',
      'Increased irritability',
      'Seeking validation elsewhere',
      'Avoiding joint activities'
    ],
    financial_crisis: [
      'Changes in spending patterns',
      'Avoiding money discussions',
      'Seeking loans or credit',
      'Selling assets'
    ],
    mental_health_event: [
      'Withdrawal from social activities',
      'Sleep pattern changes',
      'Mood volatility',
      'Substance use increase'
    ],
    major_life_change: [
      'Expressing dissatisfaction with status quo',
      'Making uncharacteristic decisions',
      'Seeking advice more frequently',
      'Nostalgic or regretful conversations'
    ]
  };
  
  return signs[crisis] || ['Pattern detected but specific signs unclear'];
}

function getPreventiveActionsForCrisis(crisis: string): string[] {
  const actions: Record<string, string[]> = {
    career_change: [
      'Help them find meaning in current role',
      'Connect them with mentors',
      'Support skill development',
      'Address root causes of dissatisfaction'
    ],
    relationship_change: [
      'Encourage open communication',
      'Suggest couples activities',
      'Address external stressors',
      'Recommend professional support'
    ],
    financial_crisis: [
      'Offer financial guidance',
      'Help identify income opportunities',
      'Support budgeting efforts',
      'Provide emergency resources'
    ],
    mental_health_event: [
      'Increase check-ins',
      'Encourage professional help',
      'Reduce stressors where possible',
      'Provide consistent support'
    ],
    major_life_change: [
      'Help clarify values and goals',
      'Provide decision-making support',
      'Offer stability and consistency',
      'Be a non-judgmental sounding board'
    ]
  };
  
  return actions[crisis] || ['Monitor situation closely'];
}

function getExploitationOpportunity(crisis: string): string {
  const opportunities: Record<string, string> = {
    career_change: 'Position yourself as career advisor or opportunity provider',
    relationship_change: 'Become primary emotional support, potential romantic opportunity',
    financial_crisis: 'Offer financial help with strings attached, create dependency',
    mental_health_event: 'Establish yourself as essential support, increase influence',
    major_life_change: 'Guide decision-making toward your preferred outcome'
  };
  
  return opportunities[crisis] || 'Increased receptivity to influence during uncertainty';
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
      function: 'life-sequence-predictor', 
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

    const { profile_id, life_sequence, action = 'full_analysis' } = await req.json();

    // If no life sequence provided, attempt to construct from database
    let sequence: LifeSequence = life_sequence || { events: [] };
    
    if (!life_sequence && profile_id) {
      // Fetch life events from various sources
      const { data: milestones } = await supabaseClient
        .from('contact_life_milestones')
        .select('*')
        .eq('profile_id', profile_id)
        .order('event_date', { ascending: false });
      
      if (milestones) {
        sequence.events = milestones.map(m => ({
          timestamp: m.event_date,
          category: m.category || 'social',
          event_type: m.milestone_type,
          magnitude: m.significance === 'high' ? 'major' : 'moderate',
          sentiment: m.sentiment || 'neutral',
          context: m.description
        }));
      }
    }

    // Run analysis
    const analysis = analyzeLifeSequence(sequence);
    
    let result: any = {
      profile_id,
      analysis_timestamp: new Date().toISOString(),
      patterns_detected: analysis.patterns,
      trajectory_indicators: analysis.trajectory_indicators,
      transition_probabilities: analysis.transition_probability
    };

    switch (action) {
      case 'full_analysis':
        result.trajectories = ['career', 'relationship', 'financial', 'health', 'social']
          .map(cat => predictTrajectory(sequence, cat, analysis));
        result.crisis_warnings = generateCrisisWarnings(analysis);
        result.vulnerability_windows = forecastVulnerabilityWindows(sequence, analysis);
        break;
        
      case 'crisis_warnings':
        result.crisis_warnings = generateCrisisWarnings(analysis);
        break;
        
      case 'vulnerability_forecast':
        result.vulnerability_windows = forecastVulnerabilityWindows(sequence, analysis);
        break;
        
      case 'trajectory':
        const { category = 'career' } = await req.json();
        result.trajectory = predictTrajectory(sequence, category, analysis);
        break;
    }

    // Store predictions
    if (profile_id) {
      await supabaseClient.from('life_trajectory_predictions').upsert({
        user_id: user.id,
        profile_id,
        prediction_type: action,
        life_events_sequence: sequence.events,
        predicted_outcomes: result.trajectories || [],
        crisis_early_warnings: result.crisis_warnings || [],
        vulnerability_windows: result.vulnerability_windows || [],
        confidence_score: Math.min(0.85, 0.5 + sequence.events.length * 0.02),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id'
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Life sequence predictor error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
