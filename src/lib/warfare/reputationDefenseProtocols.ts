/**
 * Reputation Defense Protocols
 * Coordinated Inauthentic Behavior detection, narrative defense
 */

export interface ReputationThreat {
  id: string;
  type: ReputationThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  sourcePatterns: SourcePattern[];
  counterStrategies: string[];
  estimatedReach: number;
  velocityScore: number; // How fast it's spreading
}

export type ReputationThreatType = 
  | 'bot_network'
  | 'review_bombing'
  | 'coordinated_hashtag'
  | 'fake_news'
  | 'impersonation'
  | 'doxxing'
  | 'cancel_campaign'
  | 'astroturfing'
  | 'sockpuppet'
  | 'search_manipulation';

export interface SourcePattern {
  type: string;
  characteristics: string[];
  confidence: number;
}

export interface NarrativeDefense {
  id: string;
  name: string;
  description: string;
  applicableThreats: ReputationThreatType[];
  steps: string[];
  messaging: MessagingTemplate[];
  timing: string;
  risks: string[];
}

export interface MessagingTemplate {
  audience: string;
  tone: string;
  keyPoints: string[];
  avoidances: string[];
}

// Bot Network Detection Patterns
export const BOT_NETWORK_INDICATORS = {
  ACCOUNT_PATTERNS: [
    'Account created recently (< 30 days)',
    'Numeric suffix in username',
    'Default or stock profile picture',
    'Bio contains common bot phrases',
    'Follows/followers ratio extremely skewed',
    'Posts at inhuman intervals',
    'Copy-paste identical content',
    'Responds within seconds to specific keywords'
  ],
  BEHAVIORAL_PATTERNS: [
    'Posts 24/7 with no break',
    'Amplifies specific hashtags only',
    'Engages only with specific topics',
    'Uses identical or templated language',
    'Coordinates timing with other accounts',
    'Sudden activity spikes on your content',
    'Geographic inconsistencies'
  ],
  NETWORK_PATTERNS: [
    'Accounts created in same time period',
    'Same or similar usernames',
    'Cross-follow each other',
    'Retweet/share same content simultaneously',
    'All link to same websites',
    'Use same URL shorteners'
  ]
};

// Coordinated Inauthentic Behavior (CIB) Detection
export const CIB_DETECTION_FRAMEWORK = {
  COORDINATION_SIGNALS: [
    'Synchronized posting times across accounts',
    'Identical or near-identical messaging',
    'Shared infrastructure (domains, hosting)',
    'Cross-promotion patterns',
    'Coordinated engagement bursts',
    'Narrative amplification chains'
  ],
  INAUTHENTICITY_SIGNALS: [
    'Misrepresentation of identity',
    'Fake location claims',
    'Manufactured personas',
    'Deceptive origin of content',
    'Hidden financial motivations',
    'Masked affiliations'
  ],
  ATTRIBUTION_METHODS: [
    'Shared IP/device fingerprints',
    'Common EXIF data in images',
    'Writing style analysis',
    'Timing pattern correlation',
    'Network graph analysis',
    'Content source tracing'
  ]
};

// Reputation Threat Library
export const REPUTATION_THREATS: ReputationThreat[] = [
  {
    id: 'rt_review_bombing',
    type: 'review_bombing',
    severity: 'high',
    description: 'Coordinated negative reviews across platforms',
    indicators: [
      'Sudden spike in 1-star reviews',
      'Reviews from accounts with no other activity',
      'Similar language across reviews',
      'Reviews reference events not related to product/service',
      'Geographic clustering from unusual locations',
      'Timing correlation with public dispute'
    ],
    sourcePatterns: [
      {
        type: 'Competitor',
        characteristics: ['Industry knowledge in reviews', 'Promotes alternatives'],
        confidence: 0.7
      },
      {
        type: 'Activist Group',
        characteristics: ['Ideological messaging', 'Coordinates on forums'],
        confidence: 0.8
      },
      {
        type: 'Disgruntled Individual',
        characteristics: ['Personal details', 'Single obsessive focus'],
        confidence: 0.6
      }
    ],
    counterStrategies: [
      'Document pattern for platform abuse reports',
      'Flag reviews for removal based on policy violations',
      'Respond professionally to legitimate complaints',
      'Request platform investigation',
      'Encourage authentic positive reviews from real customers',
      'Consider legal action if damages quantifiable'
    ],
    estimatedReach: 50000,
    velocityScore: 85
  },
  {
    id: 'rt_cancel_campaign',
    type: 'cancel_campaign',
    severity: 'critical',
    description: 'Organized effort to damage reputation and relationships',
    indicators: [
      'Hashtag campaign targeting you',
      'Outreach to your professional contacts',
      'Contact with employers/clients',
      'Media outreach by organizers',
      'Compilation of past statements out of context',
      'Demands for public apology or resignation'
    ],
    sourcePatterns: [
      {
        type: 'Ideological Opposition',
        characteristics: ['Values-based criticism', 'Purity testing'],
        confidence: 0.8
      },
      {
        type: 'Professional Rival',
        characteristics: ['Industry focus', 'Competitive benefit'],
        confidence: 0.6
      }
    ],
    counterStrategies: [
      'Document all harassment for potential legal action',
      'Proactively reach out to key relationships',
      'Prepare factual response for inquiries',
      'Avoid engaging directly with mob',
      'Wait for news cycle to pass',
      'Build support from allies privately',
      'Consider strategic silence vs. response'
    ],
    estimatedReach: 500000,
    velocityScore: 95
  },
  {
    id: 'rt_impersonation',
    type: 'impersonation',
    severity: 'high',
    description: 'Fake accounts or profiles pretending to be you',
    indicators: [
      'Accounts using your name/likeness',
      'Slightly misspelled usernames',
      'Your photos on other accounts',
      'Others receiving messages "from you"',
      'Statements attributed to you that you didn\'t make'
    ],
    sourcePatterns: [
      {
        type: 'Scammer',
        characteristics: ['Financial requests', 'Romance angle'],
        confidence: 0.9
      },
      {
        type: 'Reputation Attacker',
        characteristics: ['Damaging statements', 'Controversial posts'],
        confidence: 0.8
      }
    ],
    counterStrategies: [
      'Report to platform immediately',
      'Post warning to followers about impersonation',
      'Document with screenshots',
      'Consider trademark filing for name',
      'Legal cease and desist if identity known',
      'Set up impersonation alerts'
    ],
    estimatedReach: 10000,
    velocityScore: 60
  },
  {
    id: 'rt_search_manipulation',
    type: 'search_manipulation',
    severity: 'medium',
    description: 'SEO manipulation to surface negative content',
    indicators: [
      'Negative content suddenly ranks higher',
      'Newly created sites targeting your name',
      'Link building to negative articles',
      'Keyword stuffing with your name',
      'Removal of positive content from search'
    ],
    sourcePatterns: [
      {
        type: 'SEO Attack Service',
        characteristics: ['Professional execution', 'Multiple sites'],
        confidence: 0.9
      },
      {
        type: 'Competitor',
        characteristics: ['Industry angle', 'Promotes alternatives'],
        confidence: 0.7
      }
    ],
    counterStrategies: [
      'Create positive content targeting same keywords',
      'Build backlinks to positive content',
      'Request removal of defamatory content',
      'File DMCA if content uses your IP',
      'Engage ORM services if severe',
      'Right to be forgotten request (GDPR)'
    ],
    estimatedReach: 100000,
    velocityScore: 40
  }
];

// Narrative Defense Strategies
export const NARRATIVE_DEFENSE_STRATEGIES: NarrativeDefense[] = [
  {
    id: 'nd_truth_campaign',
    name: 'Truth & Context Campaign',
    description: 'Proactively publishing accurate information to counter false narratives',
    applicableThreats: ['fake_news', 'cancel_campaign', 'astroturfing'],
    steps: [
      '1. Document false claims with evidence',
      '2. Prepare factual rebuttal with sources',
      '3. Get third-party verification where possible',
      '4. Publish on owned channels first',
      '5. Distribute to friendly media contacts',
      '6. Encourage supporters to share',
      '7. Monitor narrative shift'
    ],
    messaging: [
      {
        audience: 'General Public',
        tone: 'Calm, factual, confident',
        keyPoints: ['Facts contradict claims', 'Evidence available', 'Open to questions'],
        avoidances: ['Defensive language', 'Personal attacks', 'Emotional reactions']
      },
      {
        audience: 'Supporters/Allies',
        tone: 'Direct, appreciative, mobilizing',
        keyPoints: ['Thank you for support', 'Here are the facts', 'How you can help'],
        avoidances: ['Victimhood framing', 'Conspiracy language']
      }
    ],
    timing: 'Within 24-48 hours of attack peak',
    risks: ['Can amplify attack if poorly executed', 'May invite counter-response']
  },
  {
    id: 'nd_strategic_silence',
    name: 'Strategic Silence',
    description: 'Deliberately not engaging to avoid amplification',
    applicableThreats: ['cancel_campaign', 'coordinated_hashtag'],
    steps: [
      '1. Assess if engagement would amplify',
      '2. Monitor but do not respond publicly',
      '3. Prepare response but hold',
      '4. Engage privately with key stakeholders',
      '5. Wait for news cycle to shift',
      '6. Assess after 72 hours'
    ],
    messaging: [
      {
        audience: 'Close Stakeholders',
        tone: 'Private, reassuring',
        keyPoints: ['Aware of situation', 'Have legal counsel', 'Choosing not to engage'],
        avoidances: ['Public statements', 'Social media']
      }
    ],
    timing: 'During active attack phase',
    risks: ['May be seen as admission of guilt', 'Attack may grow without response']
  },
  {
    id: 'nd_ally_mobilization',
    name: 'Ally Mobilization',
    description: 'Activating supporters to counter narrative organically',
    applicableThreats: ['review_bombing', 'cancel_campaign', 'bot_network'],
    steps: [
      '1. Identify willing allies privately',
      '2. Provide them with factual talking points',
      '3. Coordinate timing but not messaging (avoid looking coordinated)',
      '4. Encourage authentic personal testimonials',
      '5. Thank and amplify ally content',
      '6. Monitor for backlash against allies'
    ],
    messaging: [
      {
        audience: 'Potential Allies',
        tone: 'Personal, humble, factual',
        keyPoints: ['Situation explanation', 'No pressure to engage', 'Appreciation for support'],
        avoidances: ['Scripted responses', 'Aggressive asks', 'Public coordination']
      }
    ],
    timing: 'After initial attack, before peak',
    risks: ['Allies may face backlash', 'Coordination may be exposed']
  }
];

// Sentiment Monitoring Thresholds
export const SENTIMENT_ALERT_THRESHOLDS = {
  NEGATIVE_VELOCITY: {
    warning: 20, // % increase in negative sentiment per hour
    critical: 50
  },
  VOLUME_SPIKE: {
    warning: 300, // % increase in mention volume
    critical: 1000
  },
  INFLUENCER_ENGAGEMENT: {
    warning: 1, // Number of high-follower accounts engaging negatively
    critical: 5
  },
  MEDIA_PICKUP: {
    warning: 1, // Media outlet coverage
    critical: 3
  }
};

// Platform-Specific Abuse Reporting
export const PLATFORM_ABUSE_REPORTING = {
  TWITTER: {
    impersonation: 'Report > Abusive or harmful > Pretending to be me or someone else',
    harassment: 'Report > Abusive or harmful > Targeted harassment',
    bot_network: 'Report > Suspicious or spam > Fake engagement',
    doxxing: 'Report > Abusive or harmful > Sharing my private info'
  },
  FACEBOOK: {
    impersonation: 'Report Profile > Pretending to Be Someone',
    harassment: 'Report > Violence or dangerous organizations > Bullying or harassment',
    fake_account: 'Report Profile > Fake Account',
    coordinated: 'Report > Spam > Coordinated inauthentic behavior'
  },
  LINKEDIN: {
    impersonation: 'Report > Impersonation',
    harassment: 'Report > Harassment',
    fake_profile: 'Report > Fake profile'
  },
  GOOGLE: {
    reviews: 'Flag review > Policy violation > Spam and fake content',
    search: 'Legal Removal Request for defamatory content',
    youtube: 'Report > Spam or misleading > Scams or fraud'
  }
};

export default {
  BOT_NETWORK_INDICATORS,
  CIB_DETECTION_FRAMEWORK,
  REPUTATION_THREATS,
  NARRATIVE_DEFENSE_STRATEGIES,
  SENTIMENT_ALERT_THRESHOLDS,
  PLATFORM_ABUSE_REPORTING
};
