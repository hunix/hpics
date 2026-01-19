/**
 * Family Protection Matrix
 * Executive protection protocols, inner circle defense
 */

export interface ProtectedPerson {
  id: string;
  name: string;
  relationship: ProtectedRelationship;
  ageCategory: AgeCategory;
  riskLevel: RiskLevel;
  vulnerabilities: Vulnerability[];
  protectionProtocols: ProtectionProtocol[];
  emergencyContacts: EmergencyContact[];
  digitalExposure: DigitalExposure;
}

export type ProtectedRelationship = 
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'partner'
  | 'close_friend'
  | 'employee'
  | 'assistant';

export type AgeCategory = 'minor' | 'young_adult' | 'adult' | 'elderly';

export type RiskLevel = 'critical' | 'high' | 'elevated' | 'moderate' | 'low';

export interface Vulnerability {
  type: VulnerabilityType;
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigations: string[];
}

export type VulnerabilityType = 
  | 'digital_exposure'
  | 'physical_access'
  | 'social_engineering'
  | 'financial'
  | 'medical'
  | 'travel'
  | 'routine_predictability'
  | 'institutional';

export interface ProtectionProtocol {
  name: string;
  category: ProtocolCategory;
  description: string;
  implementation: string[];
  frequency: string;
  owner: string;
  lastReviewed: Date | null;
}

export type ProtocolCategory = 
  | 'communications'
  | 'travel'
  | 'residence'
  | 'digital'
  | 'financial'
  | 'social'
  | 'emergency';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  role: string;
  priority: number;
}

export interface DigitalExposure {
  socialMediaPresence: SocialMediaPresence[];
  searchVisibility: number; // 0-100
  databrokerExposure: boolean;
  photosPublic: boolean;
  locationSharingActive: boolean;
  recommendations: string[];
}

export interface SocialMediaPresence {
  platform: string;
  isPublic: boolean;
  followersCount: number;
  contentType: string[];
  riskLevel: RiskLevel;
}

// Risk Assessment Matrix
export const RISK_ASSESSMENT_FACTORS = {
  THREAT_LIKELIHOOD: {
    HIGH: { weight: 3, examples: ['Active threats known', 'High public profile', 'Controversial activities'] },
    MEDIUM: { weight: 2, examples: ['Moderate public presence', 'Industry with risks', 'Past incidents'] },
    LOW: { weight: 1, examples: ['Private life', 'Low profile', 'No known adversaries'] }
  },
  VULNERABILITY: {
    HIGH: { weight: 3, examples: ['Public location', 'Predictable routine', 'High digital exposure'] },
    MEDIUM: { weight: 2, examples: ['Some public info', 'Semi-predictable', 'Moderate security'] },
    LOW: { weight: 1, examples: ['Private location', 'Varied routine', 'Strong security'] }
  },
  IMPACT: {
    HIGH: { weight: 3, examples: ['Minor children', 'Medical vulnerabilities', 'Key relationship'] },
    MEDIUM: { weight: 2, examples: ['Adult dependents', 'Moderate impact if harmed'] },
    LOW: { weight: 1, examples: ['Independent adults', 'Resilient', 'Recoverable'] }
  }
};

// Protection Protocol Templates
export const PROTECTION_PROTOCOLS: ProtectionProtocol[] = [
  {
    name: 'Secure Communications Protocol',
    category: 'communications',
    description: 'Establish secure communication channels with family members',
    implementation: [
      'Set up Signal with disappearing messages for sensitive discussions',
      'Create family group with verified members only',
      'Establish code words for distress situations',
      'Regular check-in schedule (daily/weekly)',
      'Backup communication method if primary fails'
    ],
    frequency: 'Daily use, monthly review',
    owner: 'Principal',
    lastReviewed: null
  },
  {
    name: 'Travel Security Protocol',
    category: 'travel',
    description: 'Security measures for family travel',
    implementation: [
      'Share itineraries through secure channel only',
      'Avoid public check-ins until after departure',
      'Vary routes and transportation methods',
      'Establish arrival confirmation procedures',
      'Emergency extraction plan for high-risk destinations'
    ],
    frequency: 'Per trip',
    owner: 'Principal',
    lastReviewed: null
  },
  {
    name: 'Residence Security Protocol',
    category: 'residence',
    description: 'Physical security for family residence',
    implementation: [
      'Security system with mobile alerts',
      'Secure mail/package handling',
      'Visitor verification procedures',
      'Safe room designation and supplies',
      'Emergency evacuation routes'
    ],
    frequency: 'Continuous',
    owner: 'Principal',
    lastReviewed: null
  },
  {
    name: 'Digital Security Protocol',
    category: 'digital',
    description: 'Protect family digital presence and privacy',
    implementation: [
      'Privacy settings audit on all accounts',
      'Remove from data broker sites',
      'Location sharing disabled by default',
      'Strong, unique passwords with manager',
      'Two-factor authentication everywhere'
    ],
    frequency: 'Monthly audit',
    owner: 'Principal',
    lastReviewed: null
  },
  {
    name: 'School/Institution Protocol',
    category: 'social',
    description: 'Coordinate security with children\'s schools and activities',
    implementation: [
      'Authorized pickup list strictly enforced',
      'Code word for alternative pickup',
      'School notified of any custody concerns',
      'Staff have emergency contact list',
      'Social media policy for school events'
    ],
    frequency: 'Per semester',
    owner: 'Principal + School',
    lastReviewed: null
  },
  {
    name: 'Financial Protection Protocol',
    category: 'financial',
    description: 'Protect family from financial exploitation',
    implementation: [
      'Credit freezes for all family members including minors',
      'Authorized user controls on accounts',
      'Alert thresholds on transactions',
      'Power of attorney documentation',
      'Asset protection structures reviewed'
    ],
    frequency: 'Quarterly review',
    owner: 'Principal + Financial Advisor',
    lastReviewed: null
  },
  {
    name: 'Emergency Response Protocol',
    category: 'emergency',
    description: 'Rapid response procedures for crisis situations',
    implementation: [
      'Emergency contact hierarchy established',
      'Safe meeting locations designated',
      'Go-bag locations and contents known',
      'Medical information accessible',
      'Legal power of attorney in place'
    ],
    frequency: 'Quarterly drill',
    owner: 'All family members',
    lastReviewed: null
  }
];

// Threat Scenarios for Family
export const FAMILY_THREAT_SCENARIOS = {
  KIDNAPPING_EXTORTION: {
    name: 'Kidnapping/Extortion',
    severity: 'critical',
    indicators: [
      'Surveillance of family members',
      'Unusual inquiries about routines',
      'Social engineering of household staff',
      'Probing calls or messages'
    ],
    preventiveMeasures: [
      'Unpredictable routines',
      'Professional driver/security',
      'Tracking devices (with consent)',
      'Duress code words',
      'K&R insurance'
    ],
    responseActions: [
      'Contact law enforcement immediately',
      'Engage K&R consultant if available',
      'Do not publicize',
      'Preserve all communications',
      'Follow professional guidance'
    ]
  },
  SOCIAL_ENGINEERING: {
    name: 'Social Engineering of Family',
    severity: 'high',
    indicators: [
      'Unusual friend requests to family',
      'Probing questions about you',
      'Gift/prize scams targeting family',
      'Impersonation attempts'
    ],
    preventiveMeasures: [
      'Family security awareness training',
      'Verification protocols for requests',
      'Limited public information',
      'Code words for emergencies'
    ],
    responseActions: [
      'Document all contact attempts',
      'Block and report accounts',
      'Brief all family members',
      'Increase monitoring temporarily'
    ]
  },
  HARASSMENT_STALKING: {
    name: 'Harassment/Stalking',
    severity: 'high',
    indicators: [
      'Unwanted contact attempts',
      'Showing up at locations',
      'Online harassment of family',
      'Threats direct or implied'
    ],
    preventiveMeasures: [
      'Document everything',
      'Restraining orders if warranted',
      'Security awareness for family',
      'Vary routines'
    ],
    responseActions: [
      'Report to law enforcement',
      'Document all incidents',
      'Consider protective orders',
      'Increase physical security'
    ]
  },
  DOXXING_EXPOSURE: {
    name: 'Doxxing/Information Exposure',
    severity: 'medium',
    indicators: [
      'Personal information published online',
      'Home address shared publicly',
      'Family photos/info released',
      'Harassment following exposure'
    ],
    preventiveMeasures: [
      'Minimize digital footprint',
      'Use privacy services',
      'Separate public/private personas',
      'Monitor for data exposure'
    ],
    responseActions: [
      'Request content removal',
      'Notify platforms',
      'Consider temporary relocation if severe',
      'Legal action if source identifiable'
    ]
  }
};

// Age-Appropriate Security Measures
export const AGE_APPROPRIATE_MEASURES: Record<AgeCategory, string[]> = {
  minor: [
    'Parental controls on all devices',
    'School coordination on pickup',
    'Limited social media (if any)',
    'GPS tracking (age-appropriate)',
    'Stranger danger education',
    'Code words for emergencies',
    'Safe internet practices training'
  ],
  young_adult: [
    'Digital literacy training',
    'Social media privacy settings',
    'Financial protection (credit freeze)',
    'Location sharing opt-in with trusted contacts',
    'Personal safety awareness',
    'Secure communication setup'
  ],
  adult: [
    'Full security briefing',
    'Opt-in to protection protocols',
    'Independent security measures',
    'Financial independence protection',
    'Emergency procedures training'
  ],
  elderly: [
    'Scam awareness training',
    'Financial monitoring with consent',
    'Medical emergency protocols',
    'Regular check-in schedule',
    'Simplified security measures',
    'Trusted contact designation'
  ]
};

// Digital Exposure Reduction Checklist
export const DIGITAL_EXPOSURE_CHECKLIST = [
  { task: 'Audit social media privacy settings', priority: 'high', recurring: 'monthly' },
  { task: 'Remove from data broker sites', priority: 'high', recurring: 'quarterly' },
  { task: 'Google yourself and family members', priority: 'medium', recurring: 'monthly' },
  { task: 'Review tagged photos and posts', priority: 'medium', recurring: 'monthly' },
  { task: 'Check location sharing settings', priority: 'high', recurring: 'monthly' },
  { task: 'Audit connected apps and permissions', priority: 'medium', recurring: 'quarterly' },
  { task: 'Review public records exposure', priority: 'medium', recurring: 'annually' },
  { task: 'Check breach databases for family emails', priority: 'high', recurring: 'monthly' },
  { task: 'Update emergency contact information', priority: 'low', recurring: 'annually' },
  { task: 'Review and update passwords', priority: 'high', recurring: 'quarterly' }
];

export function calculateFamilyRiskScore(person: ProtectedPerson): number {
  const baseLevelScores: Record<RiskLevel, number> = {
    critical: 90,
    high: 70,
    elevated: 50,
    moderate: 30,
    low: 10
  };
  
  let score = baseLevelScores[person.riskLevel];
  
  // Add vulnerability scores
  for (const vuln of person.vulnerabilities) {
    const vulnScores = { high: 15, medium: 8, low: 3 };
    score += vulnScores[vuln.severity];
  }
  
  // Adjust for digital exposure
  score += person.digitalExposure.searchVisibility / 5;
  if (person.digitalExposure.databrokerExposure) score += 10;
  if (person.digitalExposure.locationSharingActive) score += 15;
  
  // Adjust for age category
  const ageAdjustments: Record<AgeCategory, number> = {
    minor: 20,
    elderly: 15,
    young_adult: 5,
    adult: 0
  };
  score += ageAdjustments[person.ageCategory];
  
  return Math.min(100, Math.max(0, score));
}

export default {
  RISK_ASSESSMENT_FACTORS,
  PROTECTION_PROTOCOLS,
  FAMILY_THREAT_SCENARIOS,
  AGE_APPROPRIATE_MEASURES,
  DIGITAL_EXPOSURE_CHECKLIST,
  calculateFamilyRiskScore
};
