/**
 * Economic Warfare Indicators
 * Financial attack patterns, asset protection intelligence
 */

export interface EconomicThreat {
  id: string;
  type: EconomicThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  targetAssets: AssetCategory[];
  attackVectors: string[];
  countermeasures: string[];
  legalRemedies: string[];
}

export type EconomicThreatType = 
  | 'credit_weaponization'
  | 'business_sabotage'
  | 'supply_chain_attack'
  | 'investment_fraud'
  | 'market_manipulation'
  | 'reputation_financial'
  | 'litigation_drain'
  | 'asset_seizure'
  | 'currency_manipulation'
  | 'insider_theft';

export type AssetCategory = 
  | 'liquid_assets'
  | 'real_estate'
  | 'business_equity'
  | 'investments'
  | 'intellectual_property'
  | 'receivables'
  | 'insurance'
  | 'retirement'
  | 'crypto';

export interface FinancialRedFlag {
  category: string;
  indicator: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

export interface AssetProtectionStrategy {
  name: string;
  description: string;
  applicableAssets: AssetCategory[];
  implementation: string[];
  costLevel: 'high' | 'medium' | 'low';
  complexity: 'high' | 'medium' | 'low';
  effectiveness: number; // 0-100
}

// Economic Threat Library
export const ECONOMIC_THREATS: EconomicThreat[] = [
  {
    id: 'et_credit_weaponization',
    type: 'credit_weaponization',
    severity: 'high',
    description: 'Deliberate actions to damage credit rating or access',
    indicators: [
      'Unexplained credit inquiries',
      'Fraudulent accounts opened',
      'False reports to credit bureaus',
      'Identity theft targeting credit',
      'Coordinated disputes on legitimate accounts'
    ],
    targetAssets: ['liquid_assets', 'real_estate', 'business_equity'],
    attackVectors: [
      'Identity theft to open accounts',
      'False information to creditors',
      'Fraudulent collection claims',
      'Business credit interference',
      'Coordinated negative reporting'
    ],
    countermeasures: [
      'Credit freeze on all bureaus',
      'Credit monitoring with alerts',
      'Identity theft protection',
      'Dispute inaccurate information promptly',
      'Document all legitimate accounts'
    ],
    legalRemedies: [
      'FCRA violations (15 USC 1681)',
      'Identity theft affidavit',
      'Defamation claims',
      'Tortious interference claims'
    ]
  },
  {
    id: 'et_business_sabotage',
    type: 'business_sabotage',
    severity: 'high',
    description: 'Deliberate interference with business operations',
    indicators: [
      'Unusual employee departures',
      'Client/vendor relationship interference',
      'False regulatory complaints',
      'Negative review campaigns',
      'Supply chain disruptions'
    ],
    targetAssets: ['business_equity', 'receivables', 'intellectual_property'],
    attackVectors: [
      'Employee poaching',
      'False claims to regulators',
      'Interference with contracts',
      'Trade secret theft',
      'Customer intimidation'
    ],
    countermeasures: [
      'Non-compete/NDA enforcement',
      'Customer relationship documentation',
      'Regulatory relationship management',
      'Supply chain diversification',
      'Employee loyalty programs'
    ],
    legalRemedies: [
      'Tortious interference claims',
      'Trade secret misappropriation',
      'Defamation per se (business)',
      'Unfair competition statutes'
    ]
  },
  {
    id: 'et_investment_fraud',
    type: 'investment_fraud',
    severity: 'critical',
    description: 'Fraudulent investment schemes targeting victim',
    indicators: [
      'Unsolicited investment opportunities',
      'Guaranteed returns promises',
      'Pressure to invest quickly',
      'Exclusive or secretive opportunities',
      'Affinity-based appeals'
    ],
    targetAssets: ['liquid_assets', 'investments', 'retirement'],
    attackVectors: [
      'Ponzi/pyramid schemes',
      'Pump and dump manipulation',
      'Fake investment products',
      'Advisor fraud',
      'Crypto scams'
    ],
    countermeasures: [
      'Verify all investment professionals',
      'Check SEC/FINRA registrations',
      'Independent due diligence',
      'Diversification across institutions',
      'Regular account audits'
    ],
    legalRemedies: [
      'Securities fraud claims',
      'FINRA arbitration',
      'State securities violations',
      'Wire fraud (federal)'
    ]
  },
  {
    id: 'et_litigation_drain',
    type: 'litigation_drain',
    severity: 'medium',
    description: 'Using legal system to drain resources',
    indicators: [
      'Multiple frivolous lawsuits',
      'Excessive discovery demands',
      'Forum shopping to inconvenient jurisdictions',
      'Delaying tactics',
      'Threatening new suits upon settlement'
    ],
    targetAssets: ['liquid_assets', 'business_equity', 'insurance'],
    attackVectors: [
      'Serial litigation',
      'Vexatious discovery',
      'Appeals without merit',
      'Publicity as leverage',
      'Settlement extortion'
    ],
    countermeasures: [
      'Litigation insurance',
      'Anti-SLAPP motions',
      'Vexatious litigant designation',
      'Fee-shifting requests',
      'Countersuit strategy'
    ],
    legalRemedies: [
      'Malicious prosecution claims',
      'Abuse of process',
      'Fee sanctions (Rule 11)',
      'Vexatious litigant orders'
    ]
  }
];

// Financial Red Flags
export const FINANCIAL_RED_FLAGS: FinancialRedFlag[] = [
  {
    category: 'Credit Activity',
    indicator: 'Multiple hard inquiries you didn\'t authorize',
    severity: 'high',
    action: 'Freeze credit immediately, dispute inquiries'
  },
  {
    category: 'Credit Activity',
    indicator: 'New accounts appearing on credit report',
    severity: 'high',
    action: 'Report identity theft, freeze credit, file affidavit'
  },
  {
    category: 'Banking',
    indicator: 'Unexplained transactions on statements',
    severity: 'high',
    action: 'Report to bank, change credentials, file fraud report'
  },
  {
    category: 'Banking',
    indicator: 'Wire transfer requests with urgency/secrecy',
    severity: 'high',
    action: 'Verify independently, never wire to new recipients without confirmation'
  },
  {
    category: 'Investment',
    indicator: 'Advisor recommending concentration in single investment',
    severity: 'medium',
    action: 'Get second opinion, verify suitability, document recommendations'
  },
  {
    category: 'Investment',
    indicator: 'Returns that seem too consistent or too good',
    severity: 'high',
    action: 'Request independent audit, verify with custodian directly'
  },
  {
    category: 'Business',
    indicator: 'Key employees leaving for competitor simultaneously',
    severity: 'medium',
    action: 'Review NDAs/non-competes, investigate potential trade secret theft'
  },
  {
    category: 'Business',
    indicator: 'Vendor suddenly terminating with vague reasons',
    severity: 'medium',
    action: 'Investigate if competitor interference, document relationship history'
  },
  {
    category: 'Legal',
    indicator: 'Demand letter from unknown party with short deadline',
    severity: 'medium',
    action: 'Do not respond directly, engage counsel immediately'
  },
  {
    category: 'Insurance',
    indicator: 'Claims denied citing policy exclusions you weren\'t aware of',
    severity: 'medium',
    action: 'Review policy, engage insurance attorney if significant'
  }
];

// Asset Protection Strategies
export const ASSET_PROTECTION_STRATEGIES: AssetProtectionStrategy[] = [
  {
    name: 'Credit Freezes',
    description: 'Prevent new credit from being opened in your name',
    applicableAssets: ['liquid_assets', 'real_estate'],
    implementation: [
      'Freeze credit at all three bureaus (Equifax, Experian, TransUnion)',
      'Also freeze at Innovis and NCTUE',
      'Keep PINs secure but accessible',
      'Temporarily lift for legitimate applications'
    ],
    costLevel: 'low',
    complexity: 'low',
    effectiveness: 85
  },
  {
    name: 'Entity Structuring',
    description: 'Use legal entities to separate and protect assets',
    applicableAssets: ['real_estate', 'business_equity', 'investments'],
    implementation: [
      'Form LLC for each major real estate holding',
      'Operating business in separate entity from assets',
      'Consider domestic asset protection trusts (DAPT)',
      'Maintain proper corporate formalities'
    ],
    costLevel: 'medium',
    complexity: 'high',
    effectiveness: 75
  },
  {
    name: 'Insurance Layering',
    description: 'Comprehensive insurance coverage across all risk areas',
    applicableAssets: ['liquid_assets', 'real_estate', 'business_equity'],
    implementation: [
      'Umbrella policy ($1M+ over underlying)',
      'D&O insurance for business roles',
      'E&O/professional liability',
      'Cyber liability',
      'Key person insurance'
    ],
    costLevel: 'medium',
    complexity: 'medium',
    effectiveness: 70
  },
  {
    name: 'Geographic Diversification',
    description: 'Spread assets across multiple jurisdictions',
    applicableAssets: ['liquid_assets', 'investments', 'real_estate'],
    implementation: [
      'Bank accounts in multiple states',
      'Investment accounts at multiple institutions',
      'Real estate in different jurisdictions',
      'Consider offshore structures for significant wealth (with proper reporting)'
    ],
    costLevel: 'low',
    complexity: 'low',
    effectiveness: 60
  },
  {
    name: 'Crypto Asset Protection',
    description: 'Secure cryptocurrency holdings',
    applicableAssets: ['crypto'],
    implementation: [
      'Hardware wallet for majority of holdings',
      'Multi-signature arrangements',
      'Geographic distribution of keys',
      'Inheritance planning for crypto',
      'Never store passwords/seeds digitally'
    ],
    costLevel: 'low',
    complexity: 'medium',
    effectiveness: 80
  }
];

// Partner/Associate Financial Health Indicators
export interface FinancialHealthIndicator {
  category: string;
  positiveIndicators: string[];
  negativeIndicators: string[];
  investigationMethods: string[];
}

export const PARTNER_FINANCIAL_HEALTH: FinancialHealthIndicator[] = [
  {
    category: 'Business Stability',
    positiveIndicators: [
      'Consistent revenue growth',
      'Positive cash flow',
      'No recent layoffs',
      'Paying vendors on time',
      'Healthy balance sheet ratios'
    ],
    negativeIndicators: [
      'Frequent management changes',
      'Vendor complaints about payment',
      'Unusual financing arrangements',
      'Key staff departures',
      'Audit opinions with qualifications'
    ],
    investigationMethods: [
      'D&B or Experian business credit report',
      'Public filings (if applicable)',
      'Vendor/customer references',
      'News and litigation searches',
      'Site visits'
    ]
  },
  {
    category: 'Individual Financial Stress',
    positiveIndicators: [
      'Stable employment',
      'Lifestyle consistent with income',
      'No recent credit issues',
      'Owns assets with equity',
      'Appropriate insurance coverage'
    ],
    negativeIndicators: [
      'Gambling activity',
      'Substance abuse indicators',
      'Living beyond apparent means',
      'Unusual cash requirements',
      'Defensive about finances'
    ],
    investigationMethods: [
      'Background check services',
      'Public record searches',
      'Social media lifestyle analysis',
      'Reference checks',
      'Court records search'
    ]
  }
];

// Investment Scam Patterns (for detection)
export const INVESTMENT_SCAM_PATTERNS = {
  PONZI_SCHEME: {
    indicators: [
      'Consistently high returns regardless of market',
      'Vague or complex investment strategy',
      'Difficulty withdrawing funds',
      'Unregistered investments',
      'Secretive/exclusive nature'
    ],
    redFlags: [
      'Returns that don\'t match market conditions',
      'Advisor discourages independent custody',
      'Pressure to reinvest returns',
      'Lack of audited financials'
    ]
  },
  PUMP_AND_DUMP: {
    indicators: [
      'Unsolicited stock tips',
      'Low-volume stocks with sudden interest',
      'Aggressive promotion via email/social',
      'Touted "insider" information',
      'Price spikes on no news'
    ],
    redFlags: [
      'Source has history of such promotions',
      'Company has minimal operations',
      'Promoter can\'t explain business model',
      'Immediate pressure to buy'
    ]
  },
  AFFINITY_FRAUD: {
    indicators: [
      'Investment opportunity shared within community',
      'Trusted community member promoting',
      'Appeals to shared identity',
      'Exclusivity within group',
      'Social pressure to participate'
    ],
    redFlags: [
      'Promoter not licensed',
      'Investment not registered',
      'Documentation is incomplete',
      'Returns promised without risk'
    ]
  },
  CRYPTO_SCAM: {
    indicators: [
      'Guaranteed returns on crypto',
      'New/unknown tokens or platforms',
      'Pressure to act before "opportunity closes"',
      'Complex yield/staking promises',
      'Celebrity endorsements (often fake)'
    ],
    redFlags: [
      'Anonymous team',
      'No smart contract audit',
      'Centralized control of funds',
      'Too-good-to-be-true yields',
      'Difficulty withdrawing'
    ]
  }
};

export default {
  ECONOMIC_THREATS,
  FINANCIAL_RED_FLAGS,
  ASSET_PROTECTION_STRATEGIES,
  PARTNER_FINANCIAL_HEALTH,
  INVESTMENT_SCAM_PATTERNS
};
