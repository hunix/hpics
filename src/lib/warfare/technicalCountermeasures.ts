/**
 * Technical Surveillance Countermeasures (TSCM)
 * Digital security sweeps, compromise detection
 */

export interface TSCMSweepResult {
  id: string;
  sweepType: TSCMSweepType;
  deviceId: string;
  timestamp: Date;
  anomalies: TSCMAnomaly[];
  compromiseIndicators: CompromiseIndicator[];
  networkAnomalies: NetworkAnomaly[];
  riskScore: number;
  recommendations: string[];
}

export type TSCMSweepType = 
  | 'mobile_device'
  | 'computer'
  | 'network'
  | 'physical_space'
  | 'vehicle'
  | 'cloud_accounts'
  | 'communications';

export interface TSCMAnomaly {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  remediation: string[];
}

export interface CompromiseIndicator {
  category: CompromiseCategory;
  indicator: string;
  confidence: number; // 0-100
  source: string;
  action: string;
}

export type CompromiseCategory = 
  | 'malware'
  | 'spyware'
  | 'keylogger'
  | 'remote_access'
  | 'data_exfiltration'
  | 'credential_theft'
  | 'account_takeover'
  | 'physical_access';

export interface NetworkAnomaly {
  type: string;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  bytesTransferred: number;
  timestamp: Date;
  isSuspicious: boolean;
  analysis: string;
}

// Mobile Device Compromise Indicators
export const MOBILE_COMPROMISE_INDICATORS = {
  BEHAVIORAL: [
    'Unusual battery drain (background processes)',
    'Device running hot when idle',
    'Unexplained data usage spikes',
    'Slow performance without explanation',
    'Apps launching without user action',
    'Strange sounds during calls',
    'Delayed shutdown or restart',
    'Unknown apps in app list'
  ],
  TECHNICAL: [
    'Jailbreak/root detection tools triggered',
    'Unknown device administrators',
    'Unrecognized certificates installed',
    'MDM profile from unknown source',
    'Developer options enabled without user action',
    'Unknown VPN profiles',
    'Accessibility services for unknown apps',
    'Battery usage by unknown processes'
  ],
  NETWORK: [
    'Connections to unusual IP addresses',
    'Data transmission during sleep',
    'Unknown WiFi networks in history',
    'Unusual DNS queries',
    'Encrypted traffic to unknown servers',
    'High volume of outbound connections'
  ]
};

// Computer Compromise Indicators
export const COMPUTER_COMPROMISE_INDICATORS = {
  SYSTEM: [
    'Unexpected startup programs',
    'Unknown browser extensions',
    'Disabled antivirus/security software',
    'New user accounts created',
    'Modified system files',
    'Unusual scheduled tasks',
    'Disabled Windows Defender',
    'Changed DNS settings'
  ],
  BEHAVIORAL: [
    'Mouse/cursor moving on its own',
    'Programs opening/closing unexpectedly',
    'Webcam light on without use',
    'Unusual disk activity',
    'Files encrypted or modified',
    'Passwords no longer working',
    'Browser redirects',
    'Popup ads on clean sites'
  ],
  NETWORK: [
    'Outbound connections to unusual ports',
    'Large data transfers during off-hours',
    'Connections to known malicious IPs',
    'Unusual protocol usage',
    'Encrypted traffic bypassing proxy',
    'Tor/proxy traffic without user action'
  ]
};

// Cloud Account Compromise Indicators
export const CLOUD_COMPROMISE_INDICATORS = {
  ACCOUNT: [
    'Logins from unusual locations',
    'Logins from new devices',
    'Password reset requests you didn\'t initiate',
    'Recovery email/phone changed',
    'New app permissions granted',
    'OAuth tokens for unknown apps',
    'Session from unexpected IP ranges',
    'Failed login attempts before success'
  ],
  DATA: [
    'Files accessed/downloaded in bulk',
    'Unusual sharing activity',
    'Data export requests',
    'Deleted items that weren\'t you',
    'Modified files you didn\'t change',
    'New folders or documents created'
  ],
  SETTINGS: [
    'Forwarding rules added to email',
    'Security settings changed',
    'MFA disabled',
    'New trusted devices added',
    'API keys created',
    'Notification settings modified'
  ]
};

// Network Anomaly Detection Patterns
export const NETWORK_ANOMALY_PATTERNS = {
  DATA_EXFILTRATION: {
    indicators: [
      'Large outbound transfers outside business hours',
      'Encrypted traffic to unknown IPs',
      'DNS tunneling patterns',
      'Unusual protocols on standard ports',
      'Connections to file sharing services',
      'Cloud storage sync anomalies'
    ],
    severity: 'critical'
  },
  COMMAND_AND_CONTROL: {
    indicators: [
      'Periodic beacon-like connections',
      'Traffic to known C2 infrastructure',
      'Domain generation algorithm patterns',
      'Unusual SSL certificates',
      'Fast-flux DNS behavior',
      'Encrypted traffic to residential IPs'
    ],
    severity: 'critical'
  },
  LATERAL_MOVEMENT: {
    indicators: [
      'SMB traffic between unusual hosts',
      'RDP from unexpected sources',
      'Service account anomalies',
      'Admin tool usage patterns',
      'WMI/PowerShell remoting',
      'Credential access patterns'
    ],
    severity: 'high'
  },
  RECONNAISSANCE: {
    indicators: [
      'Port scanning activity',
      'Network mapping attempts',
      'LDAP enumeration',
      'Service discovery',
      'DNS zone transfers',
      'Active Directory queries'
    ],
    severity: 'medium'
  }
};

// Keylogger Detection Methods
export const KEYLOGGER_DETECTION = {
  SOFTWARE: {
    checkMethods: [
      'Review installed programs for unknown entries',
      'Check startup programs and services',
      'Look for unknown browser extensions',
      'Review accessibility permissions',
      'Check for screen overlay apps',
      'Scan with multiple AV engines',
      'Review network connections for unexpected traffic'
    ],
    commonIndicators: [
      'Unknown processes with keyboard hooks',
      'Services running as SYSTEM with network access',
      'Hidden or system-attributed files in temp folders',
      'Unusual CPU usage when typing',
      'Outbound connections during keyboard activity'
    ]
  },
  HARDWARE: {
    checkMethods: [
      'Physical inspection of keyboard connection',
      'Check for inline USB devices',
      'Inspect inside keyboard housing',
      'Look for additional WiFi devices nearby',
      'Check for unknown Bluetooth devices'
    ],
    commonDevices: [
      'Inline USB keylogger (between keyboard and port)',
      'Modified keyboard with built-in logger',
      'Wireless keyboard sniffer',
      'WiFi-enabled logger with remote access',
      'Audio-based keystroke capture'
    ]
  }
};

// Spyware Categories and Detection
export const SPYWARE_CATEGORIES = {
  STALKERWARE: {
    description: 'Consumer-grade spyware marketed for "monitoring"',
    commonNames: ['mSpy', 'FlexiSpy', 'Cocospy', 'Spyic', 'Hoverwatch'],
    indicators: [
      'Unknown admin profile on mobile',
      'Jailbreak/root on device you didn\'t do',
      'Unknown accessibility services',
      'High data usage',
      'Battery drain'
    ],
    detection: [
      'Anti-stalkerware apps (e.g., Certo)',
      'Check for unknown device administrators',
      'Review app permissions',
      'Check for modified system apps',
      'Factory reset may be required'
    ]
  },
  CORPORATE_SPYWARE: {
    description: 'Enterprise monitoring software',
    commonNames: ['Teramind', 'ActivTrak', 'Hubstaff', 'DeskTime'],
    indicators: [
      'MDM profile installed',
      'Unknown agent in system tray',
      'Screenshot activity in background',
      'Keylogger processes running',
      'Screen recording indicators'
    ],
    detection: [
      'Check system tray for monitoring icons',
      'Review installed services',
      'Check for screen capture processes',
      'Monitor network for monitoring server traffic',
      'Review company policies'
    ]
  },
  STATE_ACTOR: {
    description: 'Advanced spyware used by governments',
    commonNames: ['Pegasus', 'Predator', 'FinFisher', 'Hermit'],
    indicators: [
      'Zero-click compromise (no user action needed)',
      'Sophisticated evasion techniques',
      'Targets high-value individuals',
      'Exploits zero-day vulnerabilities',
      'Extremely difficult to detect'
    ],
    detection: [
      'iVerify or Lookout for iOS',
      'Mobile Verification Toolkit (MVT)',
      'Amnesty Tech indicators',
      'Network traffic analysis',
      'Professional forensic examination'
    ]
  }
};

// Device Security Audit Checklist
export const DEVICE_SECURITY_AUDIT = {
  MOBILE: [
    { check: 'OS is up to date', priority: 'critical' },
    { check: 'No unknown device administrators', priority: 'critical' },
    { check: 'No jailbreak/root detected', priority: 'critical' },
    { check: 'Unknown apps removed', priority: 'high' },
    { check: 'App permissions reviewed', priority: 'high' },
    { check: 'Find My Device enabled', priority: 'medium' },
    { check: 'Screen lock with biometrics', priority: 'high' },
    { check: 'No unknown certificates', priority: 'high' },
    { check: 'VPN not to unknown provider', priority: 'medium' },
    { check: 'Bluetooth pairing list reviewed', priority: 'medium' }
  ],
  COMPUTER: [
    { check: 'OS and software updated', priority: 'critical' },
    { check: 'Antivirus active and updated', priority: 'critical' },
    { check: 'Firewall enabled', priority: 'high' },
    { check: 'Unknown startup programs removed', priority: 'high' },
    { check: 'Browser extensions reviewed', priority: 'high' },
    { check: 'Full disk encryption enabled', priority: 'high' },
    { check: 'No unknown user accounts', priority: 'critical' },
    { check: 'Remote access software reviewed', priority: 'high' },
    { check: 'Network connections audited', priority: 'medium' },
    { check: 'Physical ports secured', priority: 'medium' }
  ],
  NETWORK: [
    { check: 'Router firmware updated', priority: 'critical' },
    { check: 'Default passwords changed', priority: 'critical' },
    { check: 'WPA3 or WPA2 encryption', priority: 'high' },
    { check: 'Guest network isolated', priority: 'medium' },
    { check: 'Unknown devices removed', priority: 'high' },
    { check: 'Remote management disabled', priority: 'high' },
    { check: 'DNS settings verified', priority: 'high' },
    { check: 'UPnP disabled', priority: 'medium' },
    { check: 'Firewall rules reviewed', priority: 'medium' },
    { check: 'Traffic monitoring active', priority: 'low' }
  ]
};

// Secure Communications Recommendations
export const SECURE_COMMS_RECOMMENDATIONS = {
  MESSAGING: {
    recommended: ['Signal', 'Wire', 'Wickr'],
    acceptable: ['WhatsApp (with caveats)', 'iMessage (Apple-to-Apple)'],
    avoid: ['SMS', 'Telegram secret chats disabled', 'Unencrypted email'],
    bestPractices: [
      'Enable disappearing messages',
      'Verify safety numbers/keys',
      'Use registration lock/PIN',
      'Don\'t backup to cloud (or use encrypted backup)',
      'Screen lock on app'
    ]
  },
  EMAIL: {
    recommended: ['ProtonMail', 'Tutanota', 'PGP-encrypted'],
    acceptable: ['Gmail/Outlook with encryption extension'],
    avoid: ['Unencrypted email for sensitive content'],
    bestPractices: [
      'Use end-to-end encryption for sensitive content',
      'Verify recipient can decrypt',
      'Be aware of metadata exposure',
      'Don\'t click links in unexpected emails',
      'Verify sender identity for sensitive requests'
    ]
  },
  VOICE: {
    recommended: ['Signal calls', 'FaceTime', 'Wire calls'],
    acceptable: ['WhatsApp calls', 'Google Fi encrypted'],
    avoid: ['Regular phone calls for sensitive content', 'VoIP without encryption'],
    bestPractices: [
      'Verify identity before sensitive calls',
      'Use video when possible for verification',
      'Be aware of surroundings/eavesdropping',
      'Consider secure room for high-sensitivity'
    ]
  }
};

export function calculateCompromiseRiskScore(indicators: CompromiseIndicator[]): number {
  const severityWeights: Record<CompromiseCategory, number> = {
    malware: 25,
    spyware: 30,
    keylogger: 28,
    remote_access: 30,
    data_exfiltration: 35,
    credential_theft: 32,
    account_takeover: 30,
    physical_access: 20
  };

  let score = 0;
  for (const indicator of indicators) {
    const weight = severityWeights[indicator.category] || 15;
    score += (weight * indicator.confidence) / 100;
  }

  return Math.min(100, score);
}

export default {
  MOBILE_COMPROMISE_INDICATORS,
  COMPUTER_COMPROMISE_INDICATORS,
  CLOUD_COMPROMISE_INDICATORS,
  NETWORK_ANOMALY_PATTERNS,
  KEYLOGGER_DETECTION,
  SPYWARE_CATEGORIES,
  DEVICE_SECURITY_AUDIT,
  SECURE_COMMS_RECOMMENDATIONS,
  calculateCompromiseRiskScore
};
