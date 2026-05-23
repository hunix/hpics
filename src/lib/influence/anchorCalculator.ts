/**
 * Negotiation Anchor Calculator
 * Strategic anchor positioning for optimal negotiation outcomes
 */

export interface NegotiationContext {
  type: 'salary' | 'price' | 'terms' | 'timeline' | 'custom';
  your_role: 'buyer' | 'seller' | 'neutral';
  target_outcome: number;
  your_batna: number; // Best Alternative To Negotiated Agreement
  their_likely_batna?: number;
  market_reference?: number;
  relationship_importance: 'low' | 'medium' | 'high';
  their_anchoring_susceptibility?: number; // 0-1
}

export interface AnchorRecommendation {
  recommended_anchor: number;
  anchor_type: 'aggressive' | 'moderate' | 'conservative';
  justification: string;
  expected_counter: number;
  expected_settlement: number;
  concession_strategy: ConcessionStep[];
  scripts: NegotiationScript[];
  counter_anchor_defense: string[];
}

export interface ConcessionStep {
  step: number;
  your_position: number;
  concession_size: number;
  framing: string;
  condition: string;
}

export interface NegotiationScript {
  situation: string;
  script: string;
  psychological_principle: string;
}

// Anchor multipliers based on role and context
const ANCHOR_MULTIPLIERS = {
  salary: {
    seller: 1.25, // Asking for salary, ask 25% above target
    buyer: 0.75   // Offering salary, offer 25% below target
  },
  price: {
    seller: 1.30, // Selling item, ask 30% above target
    buyer: 0.65   // Buying item, offer 35% below target
  },
  terms: {
    seller: 1.40, // Seeking favorable terms, push 40% beyond target
    buyer: 0.60   // Offering terms, start 40% below target
  },
  timeline: {
    seller: 0.70, // Want faster timeline, ask for 30% faster
    buyer: 1.40   // Want more time, ask for 40% more
  },
  custom: {
    seller: 1.25,
    buyer: 0.75
  }
};

/**
 * Calculate optimal anchor for negotiation
 */
export function calculateOptimalAnchor(context: NegotiationContext): AnchorRecommendation {
  const multiplier = context.your_role === 'neutral'
    ? 1.0
    : ANCHOR_MULTIPLIERS[context.type][context.your_role];
  const susceptibility = context.their_anchoring_susceptibility ?? 0.5;
  
  // Adjust multiplier based on relationship importance
  let adjustedMultiplier = multiplier;
  if (context.relationship_importance === 'high') {
    adjustedMultiplier = context.your_role === 'seller' 
      ? Math.min(multiplier, 1.15) 
      : Math.max(multiplier, 0.85);
  }
  
  // Adjust for anchoring susceptibility
  if (susceptibility > 0.7) {
    // High susceptibility = can be more aggressive
    adjustedMultiplier = context.your_role === 'seller'
      ? adjustedMultiplier * 1.1
      : adjustedMultiplier * 0.9;
  }
  
  // Calculate anchor
  const baseAnchor = context.target_outcome * adjustedMultiplier;
  
  // Ensure anchor doesn't exceed reasonable bounds
  const anchor = context.your_role === 'seller'
    ? Math.min(baseAnchor, context.target_outcome * 1.5)
    : Math.max(baseAnchor, context.target_outcome * 0.5);
  
  // Determine anchor type
  let anchorType: AnchorRecommendation['anchor_type'];
  if (context.your_role === 'seller') {
    anchorType = anchor > context.target_outcome * 1.25 ? 'aggressive' : 
                 anchor > context.target_outcome * 1.15 ? 'moderate' : 'conservative';
  } else {
    anchorType = anchor < context.target_outcome * 0.75 ? 'aggressive' :
                 anchor < context.target_outcome * 0.85 ? 'moderate' : 'conservative';
  }
  
  // Calculate expected counter and settlement
  const expectedCounter = context.your_role === 'seller'
    ? anchor * 0.7 + (context.their_likely_batna || context.target_outcome * 0.8) * 0.3
    : anchor * 1.4 - (context.their_likely_batna || context.target_outcome * 1.2) * 0.3;
  
  const expectedSettlement = (anchor + expectedCounter) / 2;
  
  // Generate concession strategy
  const concessions = generateConcessionStrategy(anchor, context.target_outcome, context.your_role);
  
  // Generate scripts
  const scripts = generateNegotiationScripts(context, anchor);
  
  return {
    recommended_anchor: Math.round(anchor * 100) / 100,
    anchor_type: anchorType,
    justification: generateJustification(context, anchor, anchorType),
    expected_counter: Math.round(expectedCounter * 100) / 100,
    expected_settlement: Math.round(expectedSettlement * 100) / 100,
    concession_strategy: concessions,
    scripts,
    counter_anchor_defense: generateCounterDefense(context)
  };
}

function generateConcessionStrategy(
  anchor: number, 
  target: number, 
  role: 'buyer' | 'seller' | 'neutral'
): ConcessionStep[] {
  const steps: ConcessionStep[] = [];
  const totalConcession = Math.abs(anchor - target);
  
  // Use decreasing concession pattern (signals approaching limit)
  const concessionRatios = [0.40, 0.25, 0.20, 0.10, 0.05];
  
  let currentPosition = anchor;
  
  concessionRatios.forEach((ratio, index) => {
    const concession = totalConcession * ratio;
    currentPosition = role === 'seller' 
      ? currentPosition - concession 
      : currentPosition + concession;
    
    steps.push({
      step: index + 1,
      your_position: Math.round(currentPosition * 100) / 100,
      concession_size: Math.round(concession * 100) / 100,
      framing: getConcessionFraming(index, role),
      condition: getConcessionCondition(index)
    });
  });
  
  return steps;
}

function getConcessionFraming(step: number, role: 'buyer' | 'seller' | 'neutral'): string {
  const framings = {
    seller: [
      '"I can consider coming down, but I\'d need something in return..."',
      '"This is a significant move for me, but I want to make this work..."',
      '"I\'m stretching here, but I value this relationship..."',
      '"This is really my limit, but let me see what I can do..."',
      '"This is absolutely the best I can do - I\'m at my floor."'
    ],
    buyer: [
      '"I can stretch my budget a bit, but I need to see value..."',
      '"Let me see if I can find additional funds, but this is tough..."',
      '"This is getting close to my ceiling..."',
      '"I\'m really pushing my limits here..."',
      '"This is my absolute maximum - I can\'t go any higher."'
    ]
  };
  
  return framings[role === 'neutral' ? 'buyer' : role][step];
}

function getConcessionCondition(step: number): string {
  const conditions = [
    'Require reciprocal concession on timeline or terms',
    'Ask for added value (warranty, support, extras)',
    'Request commitment or signing intent',
    'Demand written agreement to proceed',
    'Final offer - take it or leave it positioning'
  ];
  
  return conditions[step];
}

function generateJustification(
  context: NegotiationContext, 
  anchor: number, 
  type: 'aggressive' | 'moderate' | 'conservative'
): string {
  const justifications = {
    aggressive: `Anchor at ${anchor} positions you ${Math.round((anchor / context.target_outcome - 1) * 100)}% above target, maximizing negotiation range. Use when counterparty has high anchoring susceptibility or weak BATNA.`,
    moderate: `Anchor at ${anchor} balances aggressive positioning with relationship preservation. Optimal for ongoing relationships where trust matters.`,
    conservative: `Anchor at ${anchor} prioritizes relationship and quick agreement over maximum value extraction. Appropriate for high-importance relationships.`
  };
  
  return justifications[type];
}

function generateNegotiationScripts(
  context: NegotiationContext, 
  anchor: number
): NegotiationScript[] {
  return [
    {
      situation: 'Initial anchor presentation',
      script: context.your_role === 'seller'
        ? `"Based on the value this provides and comparable market rates, I'm looking at ${anchor}. Let me explain why this represents fair value..."`
        : `"Given my research and budget constraints, I can offer ${anchor}. Here's the analysis that led me here..."`,
      psychological_principle: 'Anchor with confidence and justification increases stickiness'
    },
    {
      situation: 'Defending your anchor',
      script: '"I understand that might seem [high/low], but consider [specific value points]. The comparable alternatives are actually [reference higher/lower numbers]..."',
      psychological_principle: 'Reanchoring with reference points reinforces your position'
    },
    {
      situation: 'Responding to their counter-anchor',
      script: '"I appreciate you sharing that. Let me understand how you arrived at that number. [Listen, then] My analysis suggests a different picture because..."',
      psychological_principle: 'Understanding their anchor before dismissing it shows respect while allowing reframe'
    },
    {
      situation: 'Making a concession',
      script: '"I\'ve thought about this carefully, and I can move to [new position]. This is a significant shift for me, and I\'d need [reciprocal ask] to make this work."',
      psychological_principle: 'Concessions should be difficult and conditional to maintain anchor power'
    },
    {
      situation: 'Final position',
      script: '"I\'ve stretched as far as I can. [Final number] is genuinely my limit. I hope we can make this work because I value [relationship/opportunity]."',
      psychological_principle: 'Clear final offers prevent endless negotiation and trigger decision'
    }
  ];
}

function generateCounterDefense(context: NegotiationContext): string[] {
  return [
    'If they anchor first, acknowledge without accepting: "I hear your number. Let me share a different perspective..."',
    'Never negotiate against yourself - wait for their counter before moving',
    'Ignore extreme anchors: "That doesn\'t match my research. Let\'s focus on realistic numbers..."',
    `Reference your BATNA if needed: "I have alternatives at ${context.your_batna}, so I need to see value beyond that."`,
    'Use questions to weaken their anchor: "How did you arrive at that? What assumptions did you make?"',
    'Introduce new reference points to shift the anchor: "Industry standard is actually..."',
    'If cornered, bracket: create a range that puts your target in the middle'
  ];
}

/**
 * Calculate Zone of Possible Agreement (ZOPA)
 */
export function calculateZOPA(
  yourBATNA: number,
  theirBATNA: number,
  yourRole: 'buyer' | 'seller'
): {
  zopa_exists: boolean;
  zopa_range: { min: number; max: number } | null;
  zopa_midpoint: number | null;
  negotiation_power: 'yours' | 'theirs' | 'balanced';
  strategy_recommendation: string;
} {
  // ZOPA exists when there's overlap between reservation prices
  const zopaExists = yourRole === 'seller' 
    ? theirBATNA > yourBATNA
    : yourBATNA > theirBATNA;
  
  if (!zopaExists) {
    return {
      zopa_exists: false,
      zopa_range: null,
      zopa_midpoint: null,
      negotiation_power: 'balanced',
      strategy_recommendation: 'No ZOPA exists. Either improve your BATNA, weaken theirs, or create additional value to expand the pie.'
    };
  }
  
  const zopaRange = yourRole === 'seller'
    ? { min: yourBATNA, max: theirBATNA }
    : { min: theirBATNA, max: yourBATNA };
  
  const zopaSize = zopaRange.max - zopaRange.min;
  const midpoint = (zopaRange.min + zopaRange.max) / 2;
  
  // Determine negotiation power
  let power: 'yours' | 'theirs' | 'balanced';
  if (yourRole === 'seller') {
    power = yourBATNA > (theirBATNA * 0.7) ? 'yours' : 
            theirBATNA < (yourBATNA * 1.3) ? 'theirs' : 'balanced';
  } else {
    power = yourBATNA > (theirBATNA * 1.3) ? 'yours' :
            theirBATNA > (yourBATNA * 0.7) ? 'theirs' : 'balanced';
  }
  
  return {
    zopa_exists: true,
    zopa_range: zopaRange,
    zopa_midpoint: midpoint,
    negotiation_power: power,
    strategy_recommendation: power === 'yours' 
      ? `Strong position. Anchor aggressively at ${yourRole === 'seller' ? zopaRange.max * 1.1 : zopaRange.min * 0.9} and make small concessions.`
      : power === 'theirs'
      ? 'Weaker position. Focus on creating value and differentiating your offer. Consider improving your BATNA before negotiating.'
      : `Balanced power. Anchor at ${yourRole === 'seller' ? midpoint * 1.15 : midpoint * 0.85} and aim for slightly above midpoint.`
  };
}

/**
 * Generate bracketing strategy
 */
export function generateBracket(
  yourTarget: number,
  theirAnchor: number,
  yourRole: 'buyer' | 'seller'
): {
  your_counter: number;
  bracket_midpoint: number;
  explanation: string;
} {
  // Bracket: position your counter so the midpoint equals your target
  const yourCounter = yourRole === 'seller'
    ? yourTarget * 2 - theirAnchor
    : yourTarget * 2 - theirAnchor;
  
  return {
    your_counter: Math.round(yourCounter * 100) / 100,
    bracket_midpoint: yourTarget,
    explanation: `Counter with ${yourCounter}. If you split the difference from their ${theirAnchor} and your ${yourCounter}, you land at your target of ${yourTarget}.`
  };
}
