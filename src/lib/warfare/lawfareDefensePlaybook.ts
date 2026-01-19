/**
 * Lawfare Defense Playbook
 * Legal threat modeling, SLAPP suit patterns, evidence preservation
 */

export interface LegalThreatPattern {
  id: string;
  name: string;
  category: LegalThreatCategory;
  severity: 'existential' | 'severe' | 'moderate' | 'nuisance';
  description: string;
  indicators: string[];
  defenseStrategies: string[];
  counterMeasures: string[];
  evidenceNeeds: string[];
  timelinePressure: string;
  typicalCosts: CostEstimate;
}

export type LegalThreatCategory = 
  | 'defamation'
  | 'slapp'
  | 'contract_dispute'
  | 'ip_claim'
  | 'regulatory'
  | 'employment'
  | 'fraud_allegation'
  | 'criminal'
  | 'civil_rights'
  | 'family_law';

export interface CostEstimate {
  low: number;
  high: number;
  currency: string;
  timeframe: string;
}

export interface EvidencePreservationProtocol {
  name: string;
  description: string;
  immediateActions: string[];
  ongoingActions: string[];
  documentTypes: string[];
  retentionPeriod: string;
}

// SLAPP (Strategic Lawsuit Against Public Participation) Detection
export const SLAPP_INDICATORS = {
  COMMON_PATTERNS: [
    'Filed after public criticism or review',
    'Plaintiff has significantly more resources',
    'Demands are disproportionate to alleged harm',
    'Quick amendment or dismissal offers in exchange for silence',
    'Lawsuit filed in distant or inconvenient jurisdiction',
    'Claims are vague or poorly specified',
    'Discovery requests seem designed to harass',
    'Plaintiff has history of similar suits'
  ],
  RED_FLAGS: [
    'Immediate demand for gag order',
    'Threats of additional claims if you speak publicly',
    'Settlement requires admission of wrongdoing',
    'Plaintiff refuses early mediation',
    'Disproportionate legal team for claim size'
  ],
  ANTI_SLAPP_STATES: [
    'California', 'Texas', 'Washington', 'Oregon', 'Nevada',
    'Arizona', 'Florida', 'Louisiana', 'Maine', 'Massachusetts',
    'Minnesota', 'Nebraska', 'New Mexico', 'New York', 'Oklahoma',
    'Pennsylvania', 'Rhode Island', 'Tennessee', 'Utah', 'Vermont'
  ]
};

// Legal Threat Pattern Library
export const LEGAL_THREAT_PATTERNS: LegalThreatPattern[] = [
  {
    id: 'defamation_corporate',
    name: 'Corporate Defamation Suit',
    category: 'defamation',
    severity: 'severe',
    description: 'Lawsuit alleging false statements harming reputation of a business',
    indicators: [
      'Demand letter citing specific statements',
      'Threatened unless retraction published',
      'Claims of specific monetary damages',
      'Reference to witnesses who heard statements'
    ],
    defenseStrategies: [
      'Truth defense - document veracity of statements',
      'Opinion defense - statements are protected opinion',
      'Fair comment defense - matter of public interest',
      'Anti-SLAPP motion if available in jurisdiction',
      'Demand specificity in pleadings'
    ],
    counterMeasures: [
      'Preserve all evidence of statement truth',
      'Document context of statements',
      'Identify supporting witnesses',
      'Research plaintiff\'s reputation pre-statement',
      'Check for plaintiff\'s prior legal history'
    ],
    evidenceNeeds: [
      'Original statements with full context',
      'Evidence supporting truth of statements',
      'Witness statements',
      'Plaintiff\'s public reputation evidence',
      'Communication thread history'
    ],
    timelinePressure: '20-30 days to respond to complaint',
    typicalCosts: { low: 25000, high: 250000, currency: 'USD', timeframe: 'full litigation' }
  },
  {
    id: 'slapp_silencing',
    name: 'SLAPP Suit - Silencing Tactic',
    category: 'slapp',
    severity: 'moderate',
    description: 'Lawsuit designed primarily to silence criticism through legal costs',
    indicators: [
      'Filed immediately after negative review/criticism',
      'Plaintiff much larger/wealthier than defendant',
      'Claims seem inflated relative to actual harm',
      'Quick settlement offers involving silence',
      'Plaintiff has filed similar suits before'
    ],
    defenseStrategies: [
      'File anti-SLAPP motion immediately',
      'Request fee shifting under anti-SLAPP statute',
      'Publicize lawsuit as attempted silencing',
      'Rally support from advocacy organizations',
      'Move to strike in early stages'
    ],
    counterMeasures: [
      'Document pattern of plaintiff silencing critics',
      'Connect with other defendants if pattern exists',
      'Engage media attention strategically',
      'Seek pro bono representation',
      'File bar complaints if attorney conduct improper'
    ],
    evidenceNeeds: [
      'Plaintiff\'s litigation history',
      'Other critics who received threats',
      'Timeline showing retaliatory intent',
      'Resources disparity documentation',
      'Public interest value of speech'
    ],
    timelinePressure: 'Anti-SLAPP motion within 60 days typically',
    typicalCosts: { low: 15000, high: 75000, currency: 'USD', timeframe: 'to anti-SLAPP ruling' }
  },
  {
    id: 'trade_secret_claim',
    name: 'Trade Secret Misappropriation',
    category: 'ip_claim',
    severity: 'severe',
    description: 'Allegation of stealing or misusing confidential business information',
    indicators: [
      'Claim follows departure from employer',
      'Allegations of taking documents/data',
      'Reference to NDAs or employment agreements',
      'Demand for forensic examination of devices',
      'Temporary restraining order sought'
    ],
    defenseStrategies: [
      'Challenge trade secret status of information',
      'Demonstrate independent development',
      'Show information was publicly available',
      'Challenge scope of confidentiality agreements',
      'Document legitimate acquisition methods'
    ],
    counterMeasures: [
      'Preserve all device states (do not wipe)',
      'Document legitimate knowledge sources',
      'Identify public sources for disputed info',
      'Retain forensic expert early',
      'Review all employment agreements'
    ],
    evidenceNeeds: [
      'Employment agreements and NDAs',
      'Public sources for disputed information',
      'Development history of any work product',
      'Timeline of information access',
      'Prior art and industry knowledge'
    ],
    timelinePressure: 'TRO hearing within 14 days',
    typicalCosts: { low: 50000, high: 500000, currency: 'USD', timeframe: 'full litigation' }
  },
  {
    id: 'regulatory_investigation',
    name: 'Regulatory Investigation',
    category: 'regulatory',
    severity: 'severe',
    description: 'Government agency investigation into business practices',
    indicators: [
      'Subpoena or civil investigative demand received',
      'Request for voluntary interview',
      'Information request from agency',
      'Whistleblower complaint referenced',
      'Industry-wide inquiry notification'
    ],
    defenseStrategies: [
      'Engage specialized regulatory counsel immediately',
      'Conduct parallel internal investigation',
      'Prepare privilege log for withheld documents',
      'Consider proactive cooperation strategy',
      'Assess exposure and potential remediation'
    ],
    counterMeasures: [
      'Implement litigation hold immediately',
      'Preserve all responsive documents',
      'Review privilege and work product issues',
      'Prepare key witnesses',
      'Assess need for voluntary disclosure'
    ],
    evidenceNeeds: [
      'All responsive documents',
      'Communication logs',
      'Policy and procedure documentation',
      'Training records',
      'Prior compliance audit results'
    ],
    timelinePressure: 'Response deadline per subpoena (typically 30 days)',
    typicalCosts: { low: 100000, high: 2000000, currency: 'USD', timeframe: 'investigation phase' }
  }
];

// Evidence Preservation Protocols
export const EVIDENCE_PRESERVATION_PROTOCOLS: EvidencePreservationProtocol[] = [
  {
    name: 'Electronic Communications Hold',
    description: 'Preserve all electronic communications related to matter',
    immediateActions: [
      'Disable auto-delete on email accounts',
      'Suspend retention policies on relevant mailboxes',
      'Capture current state of messaging apps',
      'Preserve cloud storage contents',
      'Document collection methodology'
    ],
    ongoingActions: [
      'Continue preservation as new communications occur',
      'Periodic collection and indexing',
      'Maintain chain of custody documentation'
    ],
    documentTypes: [
      'Email', 'Text messages', 'Slack/Teams', 'Social media DMs',
      'Voicemail', 'Calendar entries', 'Cloud storage files'
    ],
    retentionPeriod: 'Until matter fully resolved + 1 year'
  },
  {
    name: 'Document Preservation',
    description: 'Preserve all documents and files related to matter',
    immediateActions: [
      'Identify all custodians of relevant documents',
      'Issue litigation hold notices',
      'Suspend document destruction policies',
      'Image computers if forensics needed',
      'Secure physical files'
    ],
    ongoingActions: [
      'Monitor for new relevant documents',
      'Track custodian compliance',
      'Update hold notices as scope changes'
    ],
    documentTypes: [
      'Contracts', 'Agreements', 'Memos', 'Reports',
      'Presentations', 'Spreadsheets', 'Notes', 'Drafts'
    ],
    retentionPeriod: 'Until matter fully resolved + 1 year'
  },
  {
    name: 'Social Media Preservation',
    description: 'Preserve social media content and interactions',
    immediateActions: [
      'Screenshot all relevant posts with metadata',
      'Archive profile states',
      'Preserve message history',
      'Document follower/connection lists',
      'Use archiving services for completeness'
    ],
    ongoingActions: [
      'Monitor for edits or deletions by other parties',
      'Continue archiving relevant interactions',
      'Document any changes to preserved content'
    ],
    documentTypes: [
      'Posts', 'Comments', 'Messages', 'Profile information',
      'Photos/videos', 'Stories', 'Engagement data'
    ],
    retentionPeriod: 'Until matter fully resolved + 1 year'
  }
];

// Counter-Documentation Timeline Template
export interface CounterDocumentationItem {
  date: Date;
  description: string;
  evidence: string[];
  witnesses: string[];
  category: string;
}

export function generateCounterTimeline(items: CounterDocumentationItem[]): string {
  return items
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      const witnessStr = item.witnesses.length > 0 
        ? ` [Witnesses: ${item.witnesses.join(', ')}]` 
        : '';
      const evidenceStr = item.evidence.length > 0 
        ? ` [Evidence: ${item.evidence.join(', ')}]` 
        : '';
      return `${dateStr}: ${item.description}${witnessStr}${evidenceStr}`;
    })
    .join('\n');
}

// Jurisdictional Analysis
export interface JurisdictionFactors {
  antiSlappStrength: 'strong' | 'moderate' | 'weak' | 'none';
  defamationStandard: 'actual_malice' | 'negligence' | 'strict';
  statuteOfLimitations: number; // years
  feeShifting: boolean;
  specialMotions: string[];
}

export const US_JURISDICTION_ANALYSIS: Record<string, JurisdictionFactors> = {
  'California': {
    antiSlappStrength: 'strong',
    defamationStandard: 'actual_malice',
    statuteOfLimitations: 1,
    feeShifting: true,
    specialMotions: ['Anti-SLAPP under CCP §425.16', 'Motion to Strike']
  },
  'Texas': {
    antiSlappStrength: 'strong',
    defamationStandard: 'actual_malice',
    statuteOfLimitations: 1,
    feeShifting: true,
    specialMotions: ['TCPA Motion to Dismiss']
  },
  'New York': {
    antiSlappStrength: 'moderate',
    defamationStandard: 'actual_malice',
    statuteOfLimitations: 1,
    feeShifting: true,
    specialMotions: ['Motion to Dismiss under Civil Rights Law §70-a']
  },
  'Florida': {
    antiSlappStrength: 'moderate',
    defamationStandard: 'negligence',
    statuteOfLimitations: 2,
    feeShifting: true,
    specialMotions: ['Motion under §768.295']
  }
};

// Expert Witness Requirements by Case Type
export const EXPERT_WITNESS_NEEDS: Record<LegalThreatCategory, string[]> = {
  defamation: [
    'Reputation expert',
    'Damages calculation expert',
    'Industry expert (for context)',
    'Digital forensics (for authentication)'
  ],
  slapp: [
    'First Amendment scholar',
    'Public participation expert',
    'Litigation pattern expert'
  ],
  contract_dispute: [
    'Industry expert',
    'Damages expert',
    'Contract interpretation expert'
  ],
  ip_claim: [
    'Technical expert',
    'Prior art expert',
    'Damages/valuation expert'
  ],
  regulatory: [
    'Compliance expert',
    'Industry standard expert',
    'Forensic accountant'
  ],
  employment: [
    'HR/employment practices expert',
    'Damages expert',
    'Vocational expert'
  ],
  fraud_allegation: [
    'Forensic accountant',
    'Industry practices expert',
    'Damages expert'
  ],
  criminal: [
    'Various depending on charges',
    'Forensic experts',
    'Mental health expert (if relevant)'
  ],
  civil_rights: [
    'Civil rights expert',
    'Policy expert',
    'Damages expert'
  ],
  family_law: [
    'Child custody evaluator',
    'Forensic accountant',
    'Mental health expert'
  ]
};

export default {
  SLAPP_INDICATORS,
  LEGAL_THREAT_PATTERNS,
  EVIDENCE_PRESERVATION_PROTOCOLS,
  US_JURISDICTION_ANALYSIS,
  EXPERT_WITNESS_NEEDS,
  generateCounterTimeline
};
