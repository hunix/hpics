/**
 * @fileoverview Dashlet Registry with Lazy Loading and Error Boundaries
 * Centralizes dashlet component loading and rendering for the Dashboard.
 * Implements factory pattern with Suspense and error isolation.
 */

import React, { lazy, Suspense, ComponentType, Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, TrendingUp, Users, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import type { DashletType } from '@/lib/dashletDefinitions';

// Error Boundary for individual dashlets
interface DashletErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface DashletErrorBoundaryProps {
  children: ReactNode;
  dashletType: string;
}

class DashletErrorBoundary extends Component<DashletErrorBoundaryProps, DashletErrorBoundaryState> {
  constructor(props: DashletErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashletErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Dashlet [${this.props.dashletType}] error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load widget
            </p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Lazy load heavy components for better performance
const DecayAlertWidget = lazy(() => import('@/components/dashboard/DecayAlertWidget').then(m => ({ default: m.DecayAlertWidget })));
const FollowUpSuggestions = lazy(() => import('@/components/dashboard/FollowUpSuggestions').then(m => ({ default: m.FollowUpSuggestions })));
const RelationshipHealthWidget = lazy(() => import('@/components/dashboard/RelationshipHealthWidget').then(m => ({ default: m.RelationshipHealthWidget })));
const WeeklySummaryWidget = lazy(() => import('@/components/dashboard/WeeklySummaryWidget').then(m => ({ default: m.WeeklySummaryWidget })));
const IntroductionSuggestions = lazy(() => import('@/components/dashboard/IntroductionSuggestions').then(m => ({ default: m.IntroductionSuggestions })));
const AutoScheduleFollowups = lazy(() => import('@/components/dashboard/AutoScheduleFollowups').then(m => ({ default: m.AutoScheduleFollowups })));
const NetworkGraph = lazy(() => import('@/components/network/NetworkGraph').then(m => ({ default: m.NetworkGraph })));
const ContactGroupsWidget = lazy(() => import('@/components/dashboard/ContactGroupsWidget').then(m => ({ default: m.ContactGroupsWidget })));
const RelationshipScoreCard = lazy(() => import('@/components/dashboard/RelationshipScoreCard').then(m => ({ default: m.RelationshipScoreCard })));
const SecurityAlertsWidget = lazy(() => import('@/components/security/SecurityAlertsWidget').then(m => ({ default: m.SecurityAlertsWidget })));
const IntelligenceInsightsWidget = lazy(() => import('@/components/intelligence/IntelligenceInsightsWidget').then(m => ({ default: m.IntelligenceInsightsWidget })));
const DataQualityMonitor = lazy(() => import('@/components/intelligence/DataQualityMonitor').then(m => ({ default: m.DataQualityMonitor })));
const ProactiveActionsWidget = lazy(() => import('@/components/intelligence/ProactiveActionsWidget').then(m => ({ default: m.ProactiveActionsWidget })));
const LiveActivityFeed = lazy(() => import('@/components/intelligence/LiveActivityFeed').then(m => ({ default: m.LiveActivityFeed })));
const AnomalyDetectionWidget = lazy(() => import('@/components/intelligence/AnomalyDetectionWidget').then(m => ({ default: m.AnomalyDetectionWidget })));
const RelationshipAnalytics = lazy(() => import('@/components/dashboard/RelationshipAnalytics').then(m => ({ default: m.RelationshipAnalytics })));
const AIContactGrouping = lazy(() => import('@/components/contacts/AIContactGrouping').then(m => ({ default: m.AIContactGrouping })));
const CalendarSyncStatus = lazy(() => import('@/components/dashboard/CalendarSyncStatus').then(m => ({ default: m.CalendarSyncStatus })));
const BiometricStatusWidget = lazy(() => import('@/components/dashboard/BiometricStatusWidget').then(m => ({ default: m.BiometricStatusWidget })));
const RelationshipOverviewWidget = lazy(() => import('@/components/intelligence/RelationshipOverviewWidget').then(m => ({ default: m.RelationshipOverviewWidget })));
const RelationshipForecastWidget = lazy(() => import('@/components/intelligence/RelationshipForecastWidget').then(m => ({ default: m.RelationshipForecastWidget })));
const NetworkRiskPanel = lazy(() => import('@/components/intelligence/NetworkRiskPanel').then(m => ({ default: m.NetworkRiskPanel })));
const IntroductionMatcherPanel = lazy(() => import('@/components/intelligence/IntroductionMatcherPanel').then(m => ({ default: m.IntroductionMatcherPanel })));
const DailyBriefingWidget = lazy(() => import('@/components/intelligence/DailyBriefingWidget').then(m => ({ default: m.DailyBriefingWidget })));
const OutreachSchedulerWidget = lazy(() => import('@/components/intelligence/OutreachSchedulerWidget').then(m => ({ default: m.OutreachSchedulerWidget })));
const RelationshipAutopilotWidget = lazy(() => import('@/components/intelligence/RelationshipAutopilotWidget').then(m => ({ default: m.RelationshipAutopilotWidget })));
const GiftCalendarWidget = lazy(() => import('@/components/intelligence/GiftCalendarWidget').then(m => ({ default: m.GiftCalendarWidget })));
const AIChatAssistant = lazy(() => import('@/components/ai/AIChatAssistant').then(m => ({ default: m.AIChatAssistant })));
const UnifiedIntelligenceDashboard = lazy(() => import('@/components/intelligence/UnifiedIntelligenceDashboard').then(m => ({ default: m.UnifiedIntelligenceDashboard })));
const CommunicationVelocityWidget = lazy(() => import('@/components/dashboard/CommunicationVelocityWidget').then(m => ({ default: m.CommunicationVelocityWidget })));
const BehavioralAnomalyDashboard = lazy(() => import('@/components/intelligence/BehavioralAnomalyDashboard').then(m => ({ default: m.BehavioralAnomalyDashboard })));

/**
 * Suspense loading fallback for dashlets
 */
function DashletLoader() {
  return <Skeleton className="h-64 w-full" />;
}

/**
 * Wraps a lazy component with Suspense and Error Boundary
 */
function withDashletSafety(dashletType: string, element: ReactNode): ReactNode {
  return (
    <DashletErrorBoundary dashletType={dashletType}>
      <Suspense fallback={<DashletLoader />}>
        {element}
      </Suspense>
    </DashletErrorBoundary>
  );
}

// Type for dashlet renderer context
interface DashletContext {
  statCards: Array<{
    title: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
    color: string;
  }>;
  recentContacts: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    relationship_type: string | null;
  }> | undefined;
  upcomingEvents: Array<{
    id: string;
    title: string;
    event_type: string;
    event_date: string;
  }> | undefined;
  formatDistanceToNow: (date: Date, options?: { addSuffix?: boolean }) => string;
}

// Registry of dashlet renderers
type DashletRenderer = (ctx: DashletContext) => React.ReactNode;

const dashletRenderers: Partial<Record<DashletType, DashletRenderer>> = {
  'stats': (ctx) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {ctx.statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),

  'recent-contacts': (ctx) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Contacts
        </CardTitle>
        <CardDescription>People you've recently added or updated</CardDescription>
      </CardHeader>
      <CardContent>
        {ctx.recentContacts && ctx.recentContacts.length > 0 ? (
          <div className="space-y-3">
            {ctx.recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {contact.relationship_type?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No contacts yet.</p>
        )}
      </CardContent>
    </Card>
  ),

  'upcoming-events': (ctx) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Important dates coming up</CardDescription>
      </CardHeader>
      <CardContent>
        {ctx.upcomingEvents && ctx.upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {ctx.upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ctx.formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No upcoming events.</p>
        )}
      </CardContent>
    </Card>
  ),

  'quick-tips': () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-1">Add Your Contacts</h4>
            <p className="text-sm text-muted-foreground">
              Start by adding the people who matter most to you.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-1">Log Interactions</h4>
            <p className="text-sm text-muted-foreground">
              Track calls, meetings, and messages to never forget a conversation.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-1">Set Reminders</h4>
            <p className="text-sm text-muted-foreground">
              Never miss a birthday or important milestone again.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  'decay-alert': () => withDashletSafety('decay-alert', <DecayAlertWidget />),
  'relationship-health': () => withDashletSafety('relationship-health', <RelationshipHealthWidget />),
  'weekly-summary': () => withDashletSafety('weekly-summary', <WeeklySummaryWidget />),
  'introduction-suggestions': () => withDashletSafety('introduction-suggestions', <IntroductionSuggestions />),
  'followup-suggestions': () => withDashletSafety('followup-suggestions', <FollowUpSuggestions />),
  'auto-schedule': () => withDashletSafety('auto-schedule', <AutoScheduleFollowups />),
  'contact-groups': () => withDashletSafety('contact-groups', <ContactGroupsWidget />),
  'relationship-scores': () => withDashletSafety('relationship-scores', <RelationshipScoreCard />),
  'network-graph': () => withDashletSafety('network-graph', <NetworkGraph />),
  'security-alerts': () => withDashletSafety('security-alerts', <SecurityAlertsWidget />),
  'intelligence-insights': () => withDashletSafety('intelligence-insights', <IntelligenceInsightsWidget />),
  'data-quality': () => withDashletSafety('data-quality', <DataQualityMonitor />),
  'proactive-actions': () => withDashletSafety('proactive-actions', <ProactiveActionsWidget />),
  'live-activity-feed': () => withDashletSafety('live-activity-feed', <LiveActivityFeed />),
  'anomaly-detection': () => withDashletSafety('anomaly-detection', <AnomalyDetectionWidget />),
  'relationship-analytics': () => withDashletSafety('relationship-analytics', <RelationshipAnalytics />),
  'ai-contact-grouping': () => withDashletSafety('ai-contact-grouping', <AIContactGrouping />),
  'calendar-sync-status': () => withDashletSafety('calendar-sync-status', <CalendarSyncStatus />),
  'biometric-status': () => withDashletSafety('biometric-status', <BiometricStatusWidget />),
  'influence-overview': () => withDashletSafety('influence-overview', <RelationshipOverviewWidget />),
  'relationship-forecast': () => withDashletSafety('relationship-forecast', <RelationshipForecastWidget />),
  'network-risk': () => withDashletSafety('network-risk', <NetworkRiskPanel />),
  'introduction-matcher': () => withDashletSafety('introduction-matcher', <IntroductionMatcherPanel />),
  'daily-briefing': () => withDashletSafety('daily-briefing', <DailyBriefingWidget />),
  'gift-suggestions': () => null, // Requires profileId
  'outreach-scheduler': () => withDashletSafety('outreach-scheduler', <OutreachSchedulerWidget />),
  'relationship-autopilot': () => withDashletSafety('relationship-autopilot', <RelationshipAutopilotWidget />),
  'gift-calendar': () => withDashletSafety('gift-calendar', <GiftCalendarWidget />),
  'ai-chat-assistant': () => withDashletSafety('ai-chat-assistant', <AIChatAssistant className="h-[500px]" />),
  'unified-intelligence': () => withDashletSafety('unified-intelligence', <UnifiedIntelligenceDashboard />),
  'communication-velocity': () => withDashletSafety('communication-velocity', <CommunicationVelocityWidget />),
  'behavioral-anomalies': () => withDashletSafety('behavioral-anomalies', <BehavioralAnomalyDashboard />),
};

/**
 * Renders a dashlet by type using the registry pattern
 */
export function renderDashlet(type: DashletType, ctx: DashletContext): React.ReactNode {
  const renderer = dashletRenderers[type];
  if (!renderer) return null;
  return renderer(ctx);
}

/**
 * Export context type for Dashboard usage
 */
export type { DashletContext };
