import React from 'react';
import { Users, MessageSquare, Calendar, Star, Clock, TrendingUp, BarChart3, Network, Sparkles, UserPlus, Target, Activity, Shield, Brain, ShieldCheck, Zap, Radio, AlertTriangle, PieChart, CalendarClock, UsersRound, Fingerprint, Gift, Link2, Compass, Send } from 'lucide-react';

// All available dashlet types
export interface DashletConfig {
  id: string;
  type: DashletType;
  title: string;
  visible: boolean;
  order: number;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
}

// Layout preset types
export type LayoutPresetId = 'minimal' | 'standard' | 'power-user' | 'analytics' | 'ai-focused';

export interface LayoutPreset {
  id: LayoutPresetId;
  name: string;
  description: string;
  gridColumns: number;
  visibleDashlets: DashletType[];
  colSpans?: Partial<Record<DashletType, number>>;
}

export type DashletType = 
  | 'stats'
  | 'recent-contacts'
  | 'upcoming-events'
  | 'decay-alert'
  | 'relationship-health'
  | 'weekly-summary'
  | 'introduction-suggestions'
  | 'followup-suggestions'
  | 'auto-schedule'
  | 'contact-groups'
  | 'relationship-scores'
  | 'network-graph'
  | 'quick-tips'
  | 'security-alerts'
  | 'intelligence-insights'
  | 'data-quality'
  | 'proactive-actions'
  | 'live-activity-feed'
  | 'anomaly-detection'
  | 'relationship-analytics'
  | 'ai-contact-grouping'
  | 'calendar-sync-status'
  | 'biometric-status'
  | 'influence-overview'
  | 'relationship-forecast'
  | 'network-risk'
  | 'introduction-matcher'
  | 'daily-briefing'
  | 'gift-suggestions'
  | 'outreach-scheduler'
  | 'relationship-autopilot'
  | 'gift-calendar'
  | 'ai-chat-assistant'
  | 'unified-intelligence'
  | 'communication-velocity'
  | 'behavioral-anomalies'
  | 'proactive-insights';

export interface DashletDefinition {
  type: DashletType;
  title: string;
  description: string;
  icon: React.ElementType;
  defaultVisible: boolean;
  category: 'overview' | 'ai' | 'relationships' | 'tools';
  defaultColSpan?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const DASHLET_DEFINITIONS: DashletDefinition[] = [
  {
    type: 'stats',
    title: 'Statistics Overview',
    description: 'Key metrics: contacts, favorites, communications, events',
    icon: BarChart3,
    defaultVisible: false,
    category: 'overview',
  },
  {
    type: 'recent-contacts',
    title: 'Recent Contacts',
    description: 'People you have recently added or updated',
    icon: Clock,
    defaultVisible: true,
    category: 'overview',
  },
  {
    type: 'upcoming-events',
    title: 'Upcoming Events',
    description: 'Important dates coming up',
    icon: Calendar,
    defaultVisible: true,
    category: 'overview',
  },
  {
    type: 'decay-alert',
    title: 'Relationship Decay Alerts',
    description: 'Contacts with declining relationship health',
    icon: Activity,
    defaultVisible: true,
    category: 'relationships',
  },
  {
    type: 'relationship-health',
    title: 'Relationship Health',
    description: 'Overall health distribution of your network',
    icon: TrendingUp,
    defaultVisible: true,
    category: 'relationships',
  },
  {
    type: 'weekly-summary',
    title: 'Weekly Summary',
    description: 'AI-generated weekly relationship insights',
    icon: Sparkles,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'introduction-suggestions',
    title: 'Introduction Suggestions',
    description: 'AI-suggested mutual introductions',
    icon: UserPlus,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'followup-suggestions',
    title: 'Follow-up Suggestions',
    description: 'AI-powered follow-up recommendations',
    icon: MessageSquare,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'auto-schedule',
    title: 'Auto-Schedule Follow-ups',
    description: 'Batch schedule reminders for multiple contacts',
    icon: Target,
    defaultVisible: false,
    category: 'tools',
  },
  {
    type: 'contact-groups',
    title: 'Contact Groups',
    description: 'View and manage contact circles',
    icon: Users,
    defaultVisible: false,
    category: 'relationships',
  },
  {
    type: 'relationship-scores',
    title: 'Relationship Scores',
    description: 'Top and bottom relationship scores',
    icon: Star,
    defaultVisible: false,
    category: 'relationships',
  },
  {
    type: 'network-graph',
    title: 'Network Graph',
    description: 'Visual network of your connections',
    icon: Network,
    defaultVisible: false,
    category: 'overview',
  },
  {
    type: 'quick-tips',
    title: 'Quick Tips',
    description: 'Helpful tips for using the CRM',
    icon: TrendingUp,
    defaultVisible: false,
    category: 'tools',
  },
  {
    type: 'security-alerts',
    title: 'Security Alerts',
    description: 'Real-time security monitoring and threat detection',
    icon: Shield,
    defaultVisible: false,
    category: 'tools',
  },
  {
    type: 'intelligence-insights',
    title: 'Intelligence Insights',
    description: 'AI-powered network analysis and predictions',
    icon: Brain,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'data-quality',
    title: 'Data Quality Monitor',
    description: 'Proactive data health scanning and issue detection',
    icon: ShieldCheck,
    defaultVisible: false,
    category: 'tools',
  },
  {
    type: 'proactive-actions',
    title: 'Proactive Actions',
    description: 'AI-suggested follow-ups and timely actions',
    icon: Zap,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'live-activity-feed',
    title: 'Live Activity Feed',
    description: 'Real-time activity stream with anomaly detection',
    icon: Radio,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'anomaly-detection',
    title: 'Anomaly Detection',
    description: 'Behavioral pattern analysis and deviation alerts',
    icon: AlertTriangle,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'relationship-analytics',
    title: 'Relationship Analytics',
    description: 'Communication trends, engagement charts, and metrics',
    icon: PieChart,
    defaultVisible: false,
    category: 'relationships',
  },
  {
    type: 'ai-contact-grouping',
    title: 'AI Contact Grouping',
    description: 'AI-suggested smart groups based on patterns',
    icon: UsersRound,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'calendar-sync-status',
    title: 'Calendar Sync Status',
    description: 'Monitor calendar synchronization status',
    icon: CalendarClock,
    defaultVisible: false,
    category: 'tools',
  },
  {
    type: 'biometric-status',
    title: 'Biometric Identity',
    description: 'Overview of contact biometric enrollment and pending matches',
    icon: Fingerprint,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'influence-overview',
    title: 'Influence Command Center',
    description: 'Pending influence actions and methodology effectiveness',
    icon: Target,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'relationship-forecast',
    title: 'Relationship Forecast',
    description: '30-day trajectory predictions for your network',
    icon: TrendingUp,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'network-risk',
    title: 'Network Risk Monitor',
    description: 'At-risk relationships and AI recommendations',
    icon: Shield,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'introduction-matcher',
    title: 'Introduction Matcher',
    description: 'High-value connection opportunities in your network',
    icon: Link2,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'daily-briefing',
    title: 'Daily Briefing',
    description: 'Today\'s priorities, alerts, and opportunities',
    icon: Compass,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'gift-suggestions',
    title: 'Gift Suggestions',
    description: 'AI-powered personalized gift recommendations',
    icon: Gift,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'outreach-scheduler',
    title: 'Outreach Scheduler',
    description: 'Optimal timing recommendations for contacting',
    icon: Send,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'relationship-autopilot',
    title: 'Relationship Autopilot',
    description: 'AI-powered churn prevention with auto-drafted outreach',
    icon: Zap,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'gift-calendar',
    title: 'Gift Calendar',
    description: 'Upcoming occasions with AI gift suggestions',
    icon: Gift,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'ai-chat-assistant',
    title: 'AI Chat Assistant',
    description: 'Natural language queries about your contacts',
    icon: Brain,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'unified-intelligence',
    title: 'Intelligence Hub',
    description: 'Unified proactive insights, anomalies, and action items',
    icon: Sparkles,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'communication-velocity',
    title: 'Communication Velocity',
    description: 'Track communication rate changes across contacts',
    icon: Activity,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'behavioral-anomalies',
    title: 'Behavioral Anomalies',
    description: 'Detected behavioral pattern deviations',
    icon: AlertTriangle,
    defaultVisible: false,
    category: 'ai',
  },
  {
    type: 'proactive-insights',
    title: 'Proactive Insights',
    description: 'AI-generated proactive intelligence suggestions',
    icon: Lightbulb,
    defaultVisible: false,
    category: 'ai',
  },
];

export const getDefaultLayout = (): DashletConfig[] => {
  return DASHLET_DEFINITIONS.map((def, index) => ({
    id: `dashlet-${def.type}`,
    type: def.type,
    title: def.title,
    visible: def.defaultVisible,
    order: index,
    colSpan: def.defaultColSpan ?? 1,
  }));
};

export const getDashletDefinition = (type: DashletType): DashletDefinition | undefined => {
  return DASHLET_DEFINITIONS.find(d => d.type === type);
};

// Layout presets
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, focused view with essential widgets only',
    gridColumns: 2,
    visibleDashlets: ['daily-briefing', 'recent-contacts', 'upcoming-events', 'followup-suggestions'],
    colSpans: { 'daily-briefing': 2 },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced layout for everyday use',
    gridColumns: 3,
    visibleDashlets: [
      'daily-briefing', 'recent-contacts', 'upcoming-events', 
      'relationship-health', 'decay-alert', 'followup-suggestions',
      'weekly-summary', 'contact-groups'
    ],
    colSpans: { 'daily-briefing': 2, 'weekly-summary': 2 },
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Dense information layout for advanced users',
    gridColumns: 4,
    visibleDashlets: [
      'daily-briefing', 'recent-contacts', 'upcoming-events', 'relationship-health',
      'decay-alert', 'followup-suggestions', 'weekly-summary', 'contact-groups',
      'relationship-scores', 'introduction-suggestions', 'proactive-actions',
      'calendar-sync-status', 'network-graph', 'intelligence-insights'
    ],
    colSpans: { 'daily-briefing': 2, 'network-graph': 2, 'intelligence-insights': 2 },
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data-focused view with charts and metrics',
    gridColumns: 3,
    visibleDashlets: [
      'stats', 'relationship-analytics', 'relationship-health',
      'relationship-scores', 'communication-velocity', 'network-graph',
      'decay-alert', 'behavioral-anomalies'
    ],
    colSpans: { 'stats': 3, 'relationship-analytics': 2, 'network-graph': 2 },
  },
  {
    id: 'ai-focused',
    name: 'AI Focused',
    description: 'AI-powered insights and automation',
    gridColumns: 3,
    visibleDashlets: [
      'daily-briefing', 'unified-intelligence', 'weekly-summary',
      'followup-suggestions', 'introduction-suggestions', 'proactive-actions',
      'relationship-autopilot', 'gift-suggestions', 'ai-contact-grouping'
    ],
    colSpans: { 'daily-briefing': 2, 'unified-intelligence': 2, 'weekly-summary': 2 },
  },
];

export const applyPreset = (presetId: LayoutPresetId): { layout: DashletConfig[]; gridColumns: number } => {
  const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
  if (!preset) {
    return { layout: getDefaultLayout(), gridColumns: 2 };
  }

  const layout = DASHLET_DEFINITIONS.map((def, index) => ({
    id: `dashlet-${def.type}`,
    type: def.type,
    title: def.title,
    visible: preset.visibleDashlets.includes(def.type),
    order: preset.visibleDashlets.includes(def.type) 
      ? preset.visibleDashlets.indexOf(def.type) 
      : 1000 + index,
    colSpan: (preset.colSpans?.[def.type] ?? def.defaultColSpan ?? 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }));

  // Sort by order
  layout.sort((a, b) => a.order - b.order);
  // Re-assign order sequentially
  layout.forEach((d, i) => d.order = i);

  return { layout, gridColumns: preset.gridColumns };
};
