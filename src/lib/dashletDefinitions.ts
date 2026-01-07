import React from 'react';
import { Users, MessageSquare, Calendar, Star, Clock, TrendingUp, BarChart3, Network, Sparkles, UserPlus, Target, Activity, Shield, Brain, ShieldCheck, Zap, Radio, AlertTriangle, PieChart, CalendarClock, UsersRound, Fingerprint } from 'lucide-react';

// All available dashlet types
export interface DashletConfig {
  id: string;
  type: DashletType;
  title: string;
  visible: boolean;
  order: number;
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
  | 'influence-overview';

export interface DashletDefinition {
  type: DashletType;
  title: string;
  description: string;
  icon: React.ElementType;
  defaultVisible: boolean;
  category: 'overview' | 'ai' | 'relationships' | 'tools';
}

export const DASHLET_DEFINITIONS: DashletDefinition[] = [
  {
    type: 'stats',
    title: 'Statistics Overview',
    description: 'Key metrics: contacts, favorites, communications, events',
    icon: BarChart3,
    defaultVisible: true,
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
    defaultVisible: true,
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
    defaultVisible: true,
    category: 'tools',
  },
  {
    type: 'contact-groups',
    title: 'Contact Groups',
    description: 'View and manage contact circles',
    icon: Users,
    defaultVisible: true,
    category: 'relationships',
  },
  {
    type: 'relationship-scores',
    title: 'Relationship Scores',
    description: 'Top and bottom relationship scores',
    icon: Star,
    defaultVisible: true,
    category: 'relationships',
  },
  {
    type: 'network-graph',
    title: 'Network Graph',
    description: 'Visual network of your connections',
    icon: Network,
    defaultVisible: true,
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
    defaultVisible: true,
    category: 'tools',
  },
  {
    type: 'intelligence-insights',
    title: 'Intelligence Insights',
    description: 'AI-powered network analysis and predictions',
    icon: Brain,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'data-quality',
    title: 'Data Quality Monitor',
    description: 'Proactive data health scanning and issue detection',
    icon: ShieldCheck,
    defaultVisible: true,
    category: 'tools',
  },
  {
    type: 'proactive-actions',
    title: 'Proactive Actions',
    description: 'AI-suggested follow-ups and timely actions',
    icon: Zap,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'live-activity-feed',
    title: 'Live Activity Feed',
    description: 'Real-time activity stream with anomaly detection',
    icon: Radio,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'anomaly-detection',
    title: 'Anomaly Detection',
    description: 'Behavioral pattern analysis and deviation alerts',
    icon: AlertTriangle,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'relationship-analytics',
    title: 'Relationship Analytics',
    description: 'Communication trends, engagement charts, and metrics',
    icon: PieChart,
    defaultVisible: true,
    category: 'relationships',
  },
  {
    type: 'ai-contact-grouping',
    title: 'AI Contact Grouping',
    description: 'AI-suggested smart groups based on patterns',
    icon: UsersRound,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'calendar-sync-status',
    title: 'Calendar Sync Status',
    description: 'Monitor calendar synchronization status',
    icon: CalendarClock,
    defaultVisible: true,
    category: 'tools',
  },
  {
    type: 'biometric-status',
    title: 'Biometric Identity',
    description: 'Overview of contact biometric enrollment and pending matches',
    icon: Fingerprint,
    defaultVisible: true,
    category: 'ai',
  },
  {
    type: 'influence-overview',
    title: 'Influence Command Center',
    description: 'Pending influence actions and methodology effectiveness',
    icon: Target,
    defaultVisible: true,
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
  }));
};

export const getDashletDefinition = (type: DashletType): DashletDefinition | undefined => {
  return DASHLET_DEFINITIONS.find(d => d.type === type);
};
