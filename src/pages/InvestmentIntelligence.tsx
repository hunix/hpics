import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Globe, 
  Newspaper, 
  Target, 
  Zap, 
  Brain,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { useEconomicIntelligence } from '@/hooks/useEconomicIntelligence';
import { ContactNewsAlerts } from '@/components/intelligence/ContactNewsAlerts';
import { cn } from '@/lib/utils';

const SIGNAL_COLORS: Record<string, string> = {
  buy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  sell: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  hold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  watch: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  avoid: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  extreme: 'bg-rose-500/20 text-rose-400',
};

const URGENCY_ICONS: Record<string, React.ReactNode> = {
  immediate: <Zap className="h-3 w-3" />,
  this_week: <Clock className="h-3 w-3" />,
  this_month: <Clock className="h-3 w-3" />,
  monitor: <Target className="h-3 w-3" />,
};

export default function InvestmentIntelligence() {
  const {
    dashboardData,
    opportunities,
    recentNews,
    signals,
    events,
    isDashboardLoading,
    isRunningPipeline,
    runPipeline,
    generateOpportunities,
    isGeneratingOpportunities,
    refetchDashboard,
  } = useEconomicIntelligence();

  const [activeTab, setActiveTab] = useState('overview');

  const fearGreedLabel = (value: number) => {
    if (value < 0.2) return 'Extreme Fear';
    if (value < 0.4) return 'Fear';
    if (value < 0.6) return 'Neutral';
    if (value < 0.8) return 'Greed';
    return 'Extreme Greed';
  };

  const fearGreedColor = (value: number) => {
    if (value < 0.2) return 'text-rose-400';
    if (value < 0.4) return 'text-orange-400';
    if (value < 0.6) return 'text-amber-400';
    if (value < 0.8) return 'text-lime-400';
    return 'text-emerald-400';
  };

  return (
    <AppLayout title="Investment Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 via-primary/20 to-amber-500/20">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-primary to-amber-400 bg-clip-text text-transparent">
                Investment Intelligence Center
              </h1>
              <p className="text-muted-foreground">
                AI-powered market analysis & opportunity detection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDashboard()}
              disabled={isDashboardLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isDashboardLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => runPipeline()}
              disabled={isRunningPipeline}
              className="bg-gradient-to-r from-emerald-600 to-primary"
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Run Intelligence Pipeline
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Opportunities"
            value={dashboardData?.stats.totalOpportunities || 0}
            subtitle={`${dashboardData?.stats.highConviction || 0} high conviction`}
            icon={<Target className="h-4 w-4" />}
            color="emerald"
            isLoading={isDashboardLoading}
          />
          <StatCard
            title="Active Signals"
            value={dashboardData?.stats.activeSignals || 0}
            subtitle={`${dashboardData?.stats.buySignals || 0} buy / ${dashboardData?.stats.sellSignals || 0} sell`}
            icon={<Activity className="h-4 w-4" />}
            color="blue"
            isLoading={isDashboardLoading}
          />
          <StatCard
            title="Geopolitical Events"
            value={dashboardData?.stats.ongoingEvents || 0}
            subtitle={`${dashboardData?.stats.criticalEvents || 0} critical`}
            icon={<Globe className="h-4 w-4" />}
            color="amber"
            isLoading={isDashboardLoading}
          />
          <StatCard
            title="Market Sentiment"
            value={((dashboardData?.stats.overallSentiment || 0) * 100).toFixed(0)}
            subtitle={dashboardData?.stats.overallSentiment > 0 ? 'Bullish' : 'Bearish'}
            icon={dashboardData?.stats.overallSentiment > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            color={dashboardData?.stats.overallSentiment > 0 ? 'emerald' : 'rose'}
            isLoading={isDashboardLoading}
          />
          <StatCard
            title="Fear & Greed"
            value={((dashboardData?.stats.fearGreedIndex || 0.5) * 100).toFixed(0)}
            subtitle={fearGreedLabel(dashboardData?.stats.fearGreedIndex || 0.5)}
            icon={<BarChart3 className="h-4 w-4" />}
            color="violet"
            isLoading={isDashboardLoading}
          />
          <StatCard
            title="Urgent Actions"
            value={dashboardData?.stats.urgentOpportunities || 0}
            subtitle="Immediate attention"
            icon={<Zap className="h-4 w-4" />}
            color="rose"
            isLoading={isDashboardLoading}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <Target className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2">
              <Activity className="h-4 w-4" />
              Signals
            </TabsTrigger>
            <TabsTrigger value="geopolitical" className="gap-2">
              <Globe className="h-4 w-4" />
              Geopolitical
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="h-4 w-4" />
              News Feed
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Opportunities */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      Top Investment Opportunities
                    </CardTitle>
                    <CardDescription>AI-generated opportunities based on market intelligence</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateOpportunities({})}
                    disabled={isGeneratingOpportunities}
                  >
                    {isGeneratingOpportunities ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {isDashboardLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full" />
                        ))}
                      </div>
                    ) : dashboardData?.opportunities?.length ? (
                      <div className="space-y-3">
                        {dashboardData.opportunities.map((opp) => (
                          <OpportunityCard key={opp.id} opportunity={opp} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <Target className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No opportunities generated yet</p>
                        <p className="text-sm text-muted-foreground">Run the intelligence pipeline first</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Fear & Greed + Sector Heat */}
              <div className="space-y-6">
                {/* Fear & Greed Meter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fear & Greed Index</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className={cn(
                          "text-4xl font-bold",
                          fearGreedColor(dashboardData?.stats.fearGreedIndex || 0.5)
                        )}>
                          {((dashboardData?.stats.fearGreedIndex || 0.5) * 100).toFixed(0)}
                        </span>
                        <p className={cn(
                          "text-sm font-medium",
                          fearGreedColor(dashboardData?.stats.fearGreedIndex || 0.5)
                        )}>
                          {fearGreedLabel(dashboardData?.stats.fearGreedIndex || 0.5)}
                        </p>
                      </div>
                      <Progress 
                        value={(dashboardData?.stats.fearGreedIndex || 0.5) * 100} 
                        className="h-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Extreme Fear</span>
                        <span>Extreme Greed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Asset Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Opportunities by Asset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.assetBreakdown && Object.keys(dashboardData.assetBreakdown).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(dashboardData.assetBreakdown).map(([asset, count]) => (
                          <div key={asset} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{asset}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No asset data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Active Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Active Geopolitical Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.events?.length ? (
                      <div className="space-y-2">
                        {dashboardData.events.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.event_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                event.severity_level === 'critical' && 'border-rose-500 text-rose-400',
                                event.severity_level === 'high' && 'border-orange-500 text-orange-400',
                                event.severity_level === 'medium' && 'border-amber-500 text-amber-400',
                              )}
                            >
                              {event.severity_level}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active events tracked
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Signals Row */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Active Trading Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardData?.signals?.slice(0, 8).map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                  {(!dashboardData?.signals || dashboardData.signals.length === 0) && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No active signals. Run the intelligence pipeline to generate signals.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">All</Button>
                <Button variant="ghost" size="sm">Stocks</Button>
                <Button variant="ghost" size="sm">Crypto</Button>
                <Button variant="ghost" size="sm">Commodities</Button>
                <Button variant="ghost" size="sm">Forex</Button>
              </div>
              <Button
                onClick={() => generateOpportunities({})}
                disabled={isGeneratingOpportunities}
              >
                {isGeneratingOpportunities ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate New Opportunities
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities?.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} expanded />
              ))}
              {(!opportunities || opportunities.length === 0) && (
                <div className="col-span-full">
                  <Card className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Target className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Run the intelligence pipeline to analyze news and generate investment opportunities.
                      </p>
                      <Button onClick={() => runPipeline()} disabled={isRunningPipeline}>
                        <Brain className="h-4 w-4 mr-2" />
                        Run Intelligence Pipeline
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signals?.map((signal) => (
                <SignalCard key={signal.id} signal={signal} expanded />
              ))}
              {(!signals || signals.length === 0) && (
                <div className="col-span-full">
                  <Card className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Signals</h3>
                      <p className="text-muted-foreground">
                        Signals are generated from news correlations.
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Geopolitical Tab */}
          <TabsContent value="geopolitical" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events?.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {(!events || events.length === 0) && (
                <div className="col-span-full">
                  <Card className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Geopolitical Events Tracked</h3>
                      <p className="text-muted-foreground">
                        Events are detected from news with geopolitical topics.
                      </p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4">
            <div className="space-y-3">
              {recentNews?.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
              {(!recentNews || recentNews.length === 0) && (
                <Card className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No News Collected</h3>
                    <p className="text-muted-foreground mb-4">
                      Run the intelligence pipeline to fetch and analyze news.
                    </p>
                    <Button onClick={() => runPipeline()} disabled={isRunningPipeline}>
                      <Brain className="h-4 w-4 mr-2" />
                      Run Intelligence Pipeline
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Component: StatCard
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  isLoading 
}: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  icon: React.ReactNode; 
  color: string; 
  isLoading?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
  };

  const iconColorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    violet: 'text-violet-400',
  };

  if (isLoading) {
    return (
      <Card className="border bg-gradient-to-br from-muted/50 to-transparent">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border bg-gradient-to-br", colorClasses[color])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={iconColorClasses[color]}>{icon}</span>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// Component: OpportunityCard
function OpportunityCard({ opportunity, expanded }: { opportunity: any; expanded?: boolean }) {
  const directionIcon = opportunity.action === 'buy' || opportunity.action === 'accumulate' 
    ? <ArrowUpRight className="h-4 w-4" />
    : opportunity.action === 'sell' || opportunity.action === 'short'
    ? <ArrowDownRight className="h-4 w-4" />
    : <Minus className="h-4 w-4" />;

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={SIGNAL_COLORS[opportunity.action] || SIGNAL_COLORS.hold}>
                {directionIcon}
                {opportunity.action}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {opportunity.asset_class}
              </Badge>
              {opportunity.urgency === 'immediate' && (
                <Badge variant="destructive" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
            </div>
            <h4 className="font-semibold truncate">{opportunity.title}</h4>
            {opportunity.asset_identifier && (
              <p className="text-sm text-muted-foreground">{opportunity.asset_identifier}</p>
            )}
            {expanded && opportunity.thesis && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{opportunity.thesis}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm font-medium">
                {(opportunity.confidence_score * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">conf</span>
            </div>
            {opportunity.expected_roi_pct && (
              <p className={cn(
                "text-sm font-medium",
                opportunity.expected_roi_pct > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {opportunity.expected_roi_pct > 0 ? '+' : ''}{opportunity.expected_roi_pct}% ROI
              </p>
            )}
            <Badge className={RISK_COLORS[opportunity.risk_level] || RISK_COLORS.medium}>
              <Shield className="h-3 w-3 mr-1" />
              {opportunity.risk_level}
            </Badge>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {opportunity.entry_price_suggestion && (
                <span>Entry: ${opportunity.entry_price_suggestion}</span>
              )}
              {opportunity.target_price && (
                <span className="text-emerald-400">Target: ${opportunity.target_price}</span>
              )}
              {opportunity.stop_loss && (
                <span className="text-rose-400">Stop: ${opportunity.stop_loss}</span>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component: SignalCard
function SignalCard({ signal, expanded }: { signal: any; expanded?: boolean }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={SIGNAL_COLORS[signal.signal_type]}>
            {signal.signal_type.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">{signal.asset_class}</span>
        </div>
        {signal.asset_identifier && (
          <p className="font-semibold">{signal.asset_identifier}</p>
        )}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Strength</span>
            <span>{(signal.signal_strength * 100).toFixed(0)}%</span>
          </div>
          <Progress value={signal.signal_strength * 100} className="h-1" />
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Direction</span>
              <span className="capitalize">{signal.expected_direction}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Magnitude</span>
              <span className="capitalize">{signal.expected_magnitude}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horizon</span>
              <span className="capitalize">{signal.time_horizon}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component: EventCard
function EventCard({ event }: { event: any }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{event.event_name}</CardTitle>
            <CardDescription className="capitalize">{event.event_type}</CardDescription>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              event.severity_level === 'critical' && 'border-rose-500 text-rose-400',
              event.severity_level === 'high' && 'border-orange-500 text-orange-400',
              event.status === 'escalating' && 'border-rose-500 text-rose-400',
            )}
          >
            {event.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {event.summary && (
          <p className="text-sm text-muted-foreground mb-4">{event.summary}</p>
        )}
        <div className="flex flex-wrap gap-1 mb-4">
          {event.countries?.map((country: string) => (
            <Badge key={country} variant="secondary" className="text-xs">
              {country}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Opportunity Score</span>
            <div className="flex items-center gap-2">
              <Progress value={(event.opportunity_score || 0) * 100} className="h-2 flex-1" />
              <span>{((event.opportunity_score || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Risk Score</span>
            <div className="flex items-center gap-2">
              <Progress value={(event.risk_score || 0) * 100} className="h-2 flex-1" />
              <span>{((event.risk_score || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component: NewsCard
function NewsCard({ news }: { news: any }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "shrink-0 w-2 h-2 mt-2 rounded-full",
            news.sentiment_label === 'positive' && "bg-emerald-400",
            news.sentiment_label === 'negative' && "bg-rose-400",
            news.sentiment_label === 'neutral' && "bg-amber-400",
          )} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium line-clamp-2">{news.title}</h4>
            {news.summary && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{news.summary}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {news.source_name}
              </Badge>
              {news.sectors?.slice(0, 2).map((sector: string) => (
                <Badge key={sector} variant="secondary" className="text-xs capitalize">
                  {sector}
                </Badge>
              ))}
              {news.urgency_level === 'critical' && (
                <Badge variant="destructive" className="text-xs">Critical</Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn(
              "text-sm font-medium",
              news.sentiment_score > 0.2 && "text-emerald-400",
              news.sentiment_score < -0.2 && "text-rose-400",
            )}>
              {news.sentiment_score > 0 ? '+' : ''}{(news.sentiment_score * 100).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Impact: {(news.impact_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
