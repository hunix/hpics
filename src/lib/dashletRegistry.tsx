import React, { lazy, Suspense, ComponentType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, TrendingUp, Users, Star, MessageSquare } from 'lucide-react';
import type { DashletType } from '@/lib/dashletDefinitions';

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

// Dashlet Suspense wrapper
function DashletLoader() {
  return <Skeleton className="h-64 w-full" />;
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

  'decay-alert': () => <Suspense fallback={<DashletLoader />}><DecayAlertWidget /></Suspense>,
  'relationship-health': () => <Suspense fallback={<DashletLoader />}><RelationshipHealthWidget /></Suspense>,
  'weekly-summary': () => <Suspense fallback={<DashletLoader />}><WeeklySummaryWidget /></Suspense>,
  'introduction-suggestions': () => <Suspense fallback={<DashletLoader />}><IntroductionSuggestions /></Suspense>,
  'followup-suggestions': () => <Suspense fallback={<DashletLoader />}><FollowUpSuggestions /></Suspense>,
  'auto-schedule': () => <Suspense fallback={<DashletLoader />}><AutoScheduleFollowups /></Suspense>,
  'contact-groups': () => <Suspense fallback={<DashletLoader />}><ContactGroupsWidget /></Suspense>,
  'relationship-scores': () => <Suspense fallback={<DashletLoader />}><RelationshipScoreCard /></Suspense>,
  'network-graph': () => <Suspense fallback={<DashletLoader />}><NetworkGraph /></Suspense>,
  'security-alerts': () => <Suspense fallback={<DashletLoader />}><SecurityAlertsWidget /></Suspense>,
  'intelligence-insights': () => <Suspense fallback={<DashletLoader />}><IntelligenceInsightsWidget /></Suspense>,
  'data-quality': () => <Suspense fallback={<DashletLoader />}><DataQualityMonitor /></Suspense>,
  'proactive-actions': () => <Suspense fallback={<DashletLoader />}><ProactiveActionsWidget /></Suspense>,
  'live-activity-feed': () => <Suspense fallback={<DashletLoader />}><LiveActivityFeed /></Suspense>,
  'anomaly-detection': () => <Suspense fallback={<DashletLoader />}><AnomalyDetectionWidget /></Suspense>,
  'relationship-analytics': () => <Suspense fallback={<DashletLoader />}><RelationshipAnalytics /></Suspense>,
  'ai-contact-grouping': () => <Suspense fallback={<DashletLoader />}><AIContactGrouping /></Suspense>,
  'calendar-sync-status': () => <Suspense fallback={<DashletLoader />}><CalendarSyncStatus /></Suspense>,
  'biometric-status': () => <Suspense fallback={<DashletLoader />}><BiometricStatusWidget /></Suspense>,
  'influence-overview': () => <Suspense fallback={<DashletLoader />}><RelationshipOverviewWidget /></Suspense>,
  'relationship-forecast': () => <Suspense fallback={<DashletLoader />}><RelationshipForecastWidget /></Suspense>,
  'network-risk': () => <Suspense fallback={<DashletLoader />}><NetworkRiskPanel /></Suspense>,
  'introduction-matcher': () => <Suspense fallback={<DashletLoader />}><IntroductionMatcherPanel /></Suspense>,
  'daily-briefing': () => <Suspense fallback={<DashletLoader />}><DailyBriefingWidget /></Suspense>,
  'gift-suggestions': () => null, // Requires profileId
  'outreach-scheduler': () => <Suspense fallback={<DashletLoader />}><OutreachSchedulerWidget /></Suspense>,
  'relationship-autopilot': () => <Suspense fallback={<DashletLoader />}><RelationshipAutopilotWidget /></Suspense>,
  'gift-calendar': () => <Suspense fallback={<DashletLoader />}><GiftCalendarWidget /></Suspense>,
  'ai-chat-assistant': () => <Suspense fallback={<DashletLoader />}><AIChatAssistant className="h-[500px]" /></Suspense>,
  'unified-intelligence': () => <Suspense fallback={<DashletLoader />}><UnifiedIntelligenceDashboard /></Suspense>,
  'communication-velocity': () => <Suspense fallback={<DashletLoader />}><CommunicationVelocityWidget /></Suspense>,
  'behavioral-anomalies': () => <Suspense fallback={<DashletLoader />}><BehavioralAnomalyDashboard /></Suspense>,
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
