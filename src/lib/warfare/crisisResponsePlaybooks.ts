/**
 * Crisis Response Playbooks
 * Based on FEMA ICS, NATO Crisis Management, NIST Incident Response
 */

export interface CrisisPlaybook {
  id: string;
  name: string;
  category: CrisisCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  triggerConditions: string[];
  immediateActions: PlaybookAction[];
  shortTermActions: PlaybookAction[];
  longTermActions: PlaybookAction[];
  stakeholders: StakeholderNotification[];
  evidencePreservation: string[];
  escalationCriteria: string[];
  deescalationCriteria: string[];
  timelineTemplate: TimelinePhase[];
  kpis: string[];
}

export type CrisisCategory = 
  | 'reputational'
  | 'legal'
  | 'physical_security'
  | 'cyber'
  | 'financial'
  | 'personnel'
  | 'media'
  | 'regulatory'
  | 'operational'
  | 'family';

export interface PlaybookAction {
  id: string;
  action: string;
  owner: string;
  timeframe: string;
  dependencies: string[];
  resources: string[];
  successCriteria: string;
  fallback: string;
}

export interface StakeholderNotification {
  role: string;
  channel: string;
  timing: string;
  template: string;
  priority: number;
}

export interface TimelinePhase {
  name: string;
  duration: string;
  objectives: string[];
  milestones: string[];
}

// OODA Loop Implementation
export const OODA_LOOP = {
  OBSERVE: {
    name: 'Observe',
    description: 'Collect raw information from all available sources',
    activities: [
      'Gather all available intelligence',
      'Monitor social media and news',
      'Collect internal reports',
      'Survey physical environment',
      'Interview witnesses',
      'Analyze data patterns'
    ]
  },
  ORIENT: {
    name: 'Orient',
    description: 'Analyze and synthesize observations into understanding',
    activities: [
      'Assess threat severity',
      'Identify affected stakeholders',
      'Map dependencies and cascade effects',
      'Compare to historical patterns',
      'Consider adversary capabilities',
      'Evaluate resource availability'
    ]
  },
  DECIDE: {
    name: 'Decide',
    description: 'Select course of action from available options',
    activities: [
      'Generate response options',
      'Evaluate risk/reward of each',
      'Consider second-order effects',
      'Select optimal response',
      'Prepare contingencies',
      'Allocate resources'
    ]
  },
  ACT: {
    name: 'Act',
    description: 'Execute selected course of action',
    activities: [
      'Deploy resources',
      'Execute countermeasures',
      'Communicate with stakeholders',
      'Document all actions',
      'Monitor effectiveness',
      'Adjust as needed'
    ]
  }
};

// Crisis Severity Matrix
export const CRISIS_SEVERITY_MATRIX = {
  CRITICAL: {
    level: 4,
    responseTime: '< 1 hour',
    description: 'Existential threat to person/organization',
    examples: [
      'Physical threat to life',
      'Major data breach with exposure',
      'Criminal investigation targeting',
      'Kidnapping/hostage situation',
      'Massive financial fraud'
    ],
    escalation: 'CEO/Principal + Legal + Security + PR immediately'
  },
  HIGH: {
    level: 3,
    responseTime: '< 4 hours',
    description: 'Significant impact requiring immediate action',
    examples: [
      'Viral negative media coverage',
      'Lawsuit filed',
      'Key relationship compromise',
      'Significant financial loss',
      'System breach detected'
    ],
    escalation: 'Leadership + relevant department heads'
  },
  MEDIUM: {
    level: 2,
    responseTime: '< 24 hours',
    description: 'Notable issue requiring managed response',
    examples: [
      'Negative social media trend',
      'Employee complaint',
      'Minor security incident',
      'Vendor relationship issue',
      'Compliance inquiry'
    ],
    escalation: 'Department manager + SMEs'
  },
  LOW: {
    level: 1,
    responseTime: '< 72 hours',
    description: 'Minor issue for monitoring and standard handling',
    examples: [
      'Isolated negative comment',
      'Minor policy violation',
      'Routine inquiry',
      'Small operational issue'
    ],
    escalation: 'Standard reporting channels'
  }
};

// Pre-Built Crisis Playbooks
export const CRISIS_PLAYBOOKS: CrisisPlaybook[] = [
  {
    id: 'pb_reputation_attack',
    name: 'Coordinated Reputation Attack Response',
    category: 'reputational',
    severity: 'high',
    description: 'Response to organized negative campaign (social media, review bombing, etc.)',
    triggerConditions: [
      'Sudden spike in negative mentions',
      'Coordinated posting patterns detected',
      'Bot network activity identified',
      'Hashtag campaign against you',
      'Negative articles published in multiple outlets'
    ],
    immediateActions: [
      {
        id: 'rep_1',
        action: 'Document all attack content with timestamps',
        owner: 'Intelligence Team',
        timeframe: '0-30 minutes',
        dependencies: [],
        resources: ['Screenshot tools', 'Archive.org'],
        successCriteria: 'All content preserved with metadata',
        fallback: 'Use Wayback Machine submissions'
      },
      {
        id: 'rep_2',
        action: 'Activate monitoring on all channels',
        owner: 'Communications',
        timeframe: '0-1 hour',
        dependencies: [],
        resources: ['Social monitoring tools'],
        successCriteria: 'Real-time alerts active',
        fallback: 'Manual monitoring rotation'
      },
      {
        id: 'rep_3',
        action: 'Identify attack coordination source',
        owner: 'Intelligence Team',
        timeframe: '1-4 hours',
        dependencies: ['rep_1'],
        resources: ['OSINT tools', 'Network analysis'],
        successCriteria: 'Source/motivation identified',
        fallback: 'Engage external investigators'
      }
    ],
    shortTermActions: [
      {
        id: 'rep_4',
        action: 'Prepare counter-narrative statement',
        owner: 'Communications + Legal',
        timeframe: '4-12 hours',
        dependencies: ['rep_3'],
        resources: ['PR counsel', 'Legal review'],
        successCriteria: 'Approved statement ready',
        fallback: 'Use holding statement template'
      },
      {
        id: 'rep_5',
        action: 'Engage platform abuse reporting',
        owner: 'Legal/Compliance',
        timeframe: '4-24 hours',
        dependencies: ['rep_1'],
        resources: ['Platform relationships', 'Legal templates'],
        successCriteria: 'Reports filed with all platforms',
        fallback: 'Escalate through legal channels'
      }
    ],
    longTermActions: [
      {
        id: 'rep_6',
        action: 'SEO recovery campaign',
        owner: 'Marketing/PR',
        timeframe: '1-4 weeks',
        dependencies: ['rep_4'],
        resources: ['SEO specialists', 'Content team'],
        successCriteria: 'Positive content outranks negative',
        fallback: 'Engage reputation management firm'
      }
    ],
    stakeholders: [
      { role: 'Legal Counsel', channel: 'Phone', timing: 'Immediate', template: 'CRISIS_LEGAL', priority: 1 },
      { role: 'PR/Communications', channel: 'Secure Message', timing: 'Immediate', template: 'CRISIS_PR', priority: 1 },
      { role: 'Key Clients', channel: 'Personal call', timing: 'Before public response', template: 'CLIENT_HEADS_UP', priority: 2 }
    ],
    evidencePreservation: [
      'Screenshot all attack content',
      'Archive URLs',
      'Preserve metadata',
      'Document timeline',
      'Save account profiles of attackers',
      'Record engagement metrics'
    ],
    escalationCriteria: [
      'Mainstream media picks up story',
      'Physical threats identified',
      'Client/partner relationships threatened',
      'Attack continues beyond 48 hours'
    ],
    deescalationCriteria: [
      'Attack volume decreases 80%+',
      'No new outlets covering story',
      'Positive sentiment returning',
      'Counter-narrative gaining traction'
    ],
    timelineTemplate: [
      { name: 'Golden Hour', duration: '0-1 hour', objectives: ['Assess scope', 'Preserve evidence', 'Activate team'], milestones: ['Team assembled', 'Initial report'] },
      { name: 'Containment', duration: '1-24 hours', objectives: ['Stop bleeding', 'Prepare response', 'Notify stakeholders'], milestones: ['Statement approved', 'Platforms notified'] },
      { name: 'Counter-Offensive', duration: '24-72 hours', objectives: ['Deploy response', 'Engage supporters', 'Monitor effectiveness'], milestones: ['Statement published', 'Allies activated'] },
      { name: 'Recovery', duration: '1-4 weeks', objectives: ['Rebuild reputation', 'Bury negative content', 'After-action review'], milestones: ['Sentiment normalized', 'Lessons documented'] }
    ],
    kpis: [
      'Time to first response',
      'Sentiment score trajectory',
      'Media pickup rate',
      'Content removal rate',
      'Stakeholder retention rate'
    ]
  },
  {
    id: 'pb_legal_threat',
    name: 'Legal Threat / Lawsuit Response',
    category: 'legal',
    severity: 'high',
    description: 'Response to legal threats, demand letters, or filed lawsuits',
    triggerConditions: [
      'Receipt of demand letter',
      'Lawsuit filed',
      'Subpoena received',
      'Government investigation notice',
      'Cease and desist received'
    ],
    immediateActions: [
      {
        id: 'legal_1',
        action: 'Do not respond to opposing party directly',
        owner: 'All personnel',
        timeframe: 'Immediate',
        dependencies: [],
        resources: [],
        successCriteria: 'No unauthorized communications',
        fallback: 'N/A'
      },
      {
        id: 'legal_2',
        action: 'Engage legal counsel immediately',
        owner: 'Principal',
        timeframe: '0-2 hours',
        dependencies: [],
        resources: ['Attorney contacts', 'Retainer agreements'],
        successCriteria: 'Counsel engaged and briefed',
        fallback: 'Emergency legal hotline'
      },
      {
        id: 'legal_3',
        action: 'Implement litigation hold on all relevant documents',
        owner: 'Legal/IT',
        timeframe: '0-4 hours',
        dependencies: ['legal_2'],
        resources: ['Document management system'],
        successCriteria: 'Hold in place, no deletions possible',
        fallback: 'Manual collection and isolation'
      }
    ],
    shortTermActions: [
      {
        id: 'legal_4',
        action: 'Gather all relevant documentation',
        owner: 'Legal Team',
        timeframe: '24-72 hours',
        dependencies: ['legal_3'],
        resources: ['Document review software'],
        successCriteria: 'Complete document inventory',
        fallback: 'Phased collection'
      }
    ],
    longTermActions: [],
    stakeholders: [
      { role: 'Legal Counsel', channel: 'Phone/Secure', timing: 'Immediate', template: 'LEGAL_ENGAGE', priority: 1 },
      { role: 'Insurance Carrier', channel: 'Email', timing: 'Within 24 hours', template: 'INSURANCE_NOTICE', priority: 2 }
    ],
    evidencePreservation: [
      'Implement litigation hold',
      'Preserve all communications',
      'Secure relevant documents',
      'Document chain of custody',
      'Back up electronic evidence'
    ],
    escalationCriteria: [],
    deescalationCriteria: [],
    timelineTemplate: [
      { name: 'Initial Response', duration: '0-24 hours', objectives: ['Secure counsel', 'Preserve evidence', 'No external comment'], milestones: ['Counsel retained'] },
      { name: 'Assessment', duration: '1-7 days', objectives: ['Evaluate claim', 'Gather documents', 'Develop strategy'], milestones: ['Strategy approved'] }
    ],
    kpis: [
      'Time to counsel engagement',
      'Document preservation completeness',
      'Response deadline compliance'
    ]
  },
  {
    id: 'pb_data_breach',
    name: 'Data Breach / Cyber Incident Response',
    category: 'cyber',
    severity: 'critical',
    description: 'Response to confirmed or suspected data breach',
    triggerConditions: [
      'Unauthorized access confirmed',
      'Data exfiltration detected',
      'Ransomware deployment',
      'Credential compromise at scale',
      'Third party breach affecting our data'
    ],
    immediateActions: [
      {
        id: 'breach_1',
        action: 'Isolate affected systems',
        owner: 'Security/IT',
        timeframe: '0-15 minutes',
        dependencies: [],
        resources: ['Network access', 'Isolation protocols'],
        successCriteria: 'Affected systems quarantined',
        fallback: 'Network segment isolation'
      },
      {
        id: 'breach_2',
        action: 'Preserve forensic evidence',
        owner: 'Security',
        timeframe: '0-1 hour',
        dependencies: ['breach_1'],
        resources: ['Forensic tools', 'Evidence storage'],
        successCriteria: 'Memory dumps and logs secured',
        fallback: 'External forensics team'
      },
      {
        id: 'breach_3',
        action: 'Assess scope of compromise',
        owner: 'Security Team',
        timeframe: '1-4 hours',
        dependencies: ['breach_2'],
        resources: ['SIEM', 'Log analysis'],
        successCriteria: 'Scope documented',
        fallback: 'Assume worst case until proven otherwise'
      }
    ],
    shortTermActions: [
      {
        id: 'breach_4',
        action: 'Notify legal counsel for breach obligations',
        owner: 'Legal',
        timeframe: '0-4 hours',
        dependencies: ['breach_3'],
        resources: ['Breach notification templates'],
        successCriteria: 'Legal assessment of obligations',
        fallback: 'Follow most stringent jurisdiction requirements'
      },
      {
        id: 'breach_5',
        action: 'Credential rotation for affected accounts',
        owner: 'IT/Security',
        timeframe: '1-12 hours',
        dependencies: ['breach_3'],
        resources: ['Identity management system'],
        successCriteria: 'All affected credentials changed',
        fallback: 'Force password reset at next login'
      }
    ],
    longTermActions: [],
    stakeholders: [
      { role: 'Legal Counsel', channel: 'Phone', timing: 'Immediate', template: 'BREACH_LEGAL', priority: 1 },
      { role: 'Affected Individuals', channel: 'Per regulations', timing: 'Per legal requirements', template: 'BREACH_NOTICE', priority: 2 }
    ],
    evidencePreservation: [
      'Capture memory state',
      'Preserve all logs',
      'Document timeline',
      'Maintain chain of custody',
      'Secure affected systems'
    ],
    escalationCriteria: [
      'PII/PHI confirmed exposed',
      'Ransom demanded',
      'Regulatory reporting required',
      'Ongoing attack activity'
    ],
    deescalationCriteria: [
      'Attack contained',
      'No ongoing exfiltration',
      'Systems restored',
      'Notification obligations met'
    ],
    timelineTemplate: [
      { name: 'Detection & Containment', duration: '0-4 hours', objectives: ['Stop attack', 'Preserve evidence', 'Assess scope'], milestones: ['Systems isolated', 'Evidence secured'] },
      { name: 'Investigation', duration: '4-48 hours', objectives: ['Determine cause', 'Identify affected data', 'Assess obligations'], milestones: ['Root cause identified', 'Data inventory complete'] },
      { name: 'Notification', duration: '48-72 hours', objectives: ['Notify regulators', 'Notify affected parties', 'Public disclosure if required'], milestones: ['Notifications sent'] },
      { name: 'Recovery', duration: '1-4 weeks', objectives: ['Restore systems', 'Implement fixes', 'Monitoring enhancement'], milestones: ['Systems restored', 'Controls enhanced'] }
    ],
    kpis: [
      'Time to detection',
      'Time to containment',
      'Notification compliance',
      'Recovery time',
      'Repeat incident rate'
    ]
  }
];

// Escalation Level Definitions
export const ESCALATION_LEVELS = {
  LEVEL_1: {
    name: 'Monitor',
    description: 'Standard monitoring, no active response',
    color: 'green',
    actions: ['Log incident', 'Continue monitoring'],
    notifications: []
  },
  LEVEL_2: {
    name: 'Alert',
    description: 'Elevated attention, prepare for escalation',
    color: 'yellow',
    actions: ['Increase monitoring', 'Prepare response team', 'Draft communications'],
    notifications: ['Team lead']
  },
  LEVEL_3: {
    name: 'Engage',
    description: 'Active response initiated',
    color: 'orange',
    actions: ['Execute playbook', 'Notify stakeholders', 'Document all actions'],
    notifications: ['Leadership', 'Legal', 'PR']
  },
  LEVEL_4: {
    name: 'Full Mobilization',
    description: 'All resources engaged, top priority',
    color: 'red',
    actions: ['War room activated', 'All hands on deck', 'External resources engaged'],
    notifications: ['All stakeholders', 'External counsel', 'Crisis PR firm']
  }
};

// Counter-Measure Categories
export const COUNTERMEASURE_TYPES = {
  PREVENTIVE: {
    name: 'Preventive',
    description: 'Actions to prevent crisis from occurring',
    examples: ['Training', 'Policies', 'Technical controls', 'Monitoring']
  },
  DETECTIVE: {
    name: 'Detective',
    description: 'Actions to detect crisis early',
    examples: ['Alerts', 'Monitoring', 'Audits', 'Intelligence gathering']
  },
  CORRECTIVE: {
    name: 'Corrective',
    description: 'Actions to respond to and fix crisis',
    examples: ['Incident response', 'Remediation', 'Recovery', 'Restoration']
  },
  DETERRENT: {
    name: 'Deterrent',
    description: 'Actions to discourage future attacks',
    examples: ['Legal action', 'Public response', 'Security improvements', 'Cost imposition']
  }
};

export default {
  OODA_LOOP,
  CRISIS_SEVERITY_MATRIX,
  CRISIS_PLAYBOOKS,
  ESCALATION_LEVELS,
  COUNTERMEASURE_TYPES
};
