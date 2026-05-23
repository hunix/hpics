import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNetworkHealthStats, useTopInfluencers, useRelationshipTypeDistribution } from '@/hooks/network/useNetworkIntelligence';
import { 
  Network, AlertTriangle, TrendingUp, Users, 
  Calendar, Zap, Brain, Shield, Target, Clock, BarChart3, Route, Layers, Cpu
} from 'lucide-react';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { RelationshipForecastWidget } from '@/components/intelligence/RelationshipForecastWidget';
import { NetworkRiskPanel } from '@/components/intelligence/NetworkRiskPanel';
import { DailyBriefingWidget } from '@/components/intelligence/DailyBriefingWidget';
import { IntroductionMatcherPanel } from '@/components/intelligence/IntroductionMatcherPanel';
import { RelationshipOverviewWidget } from '@/components/intelligence/RelationshipOverviewWidget';
import { PredictionAccuracyPanel } from '@/components/intelligence/PredictionAccuracyPanel';
import { StructuralHolesPanel } from '@/components/intelligence/StructuralHolesPanel';
import { MeetingPrepWidget } from '@/components/calendar/MeetingPrepWidget';
import { InfluencePathFinder } from '@/components/intelligence/InfluencePathFinder';
import { CrossContactPatternsWidget } from '@/components/intelligence/CrossContactPatternsWidget';
import { AdvancedNetworkDashboard } from '@/components/network/AdvancedNetworkDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function NetworkIntelligence() {
  const { data: networkStats, isLoading: statsLoading } = useNetworkHealthStats();
  const { data: topInfluencers } = useTopInfluencers(5);
  const { data: typeDistribution } = useRelationshipTypeDistribution();

  const healthPercentage = networkStats?.scoredContacts 
    ? Math.round((networkStats.healthDistribution.healthy / networkStats.scoredContacts) * 100)
    : 0;

  return (
    <AppLayout title="Network Intelligence">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{networkStats?.totalContacts || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Network Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{healthPercentage}%</div>
                  <Progress value={healthPercentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-yellow-600">
                  {(networkStats?.healthDistribution.atRisk || 0) + (networkStats?.healthDistribution.declining || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{networkStats?.pendingActions || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{networkStats?.averageScore || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risks
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="bridges" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Bridges
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Patterns
            </TabsTrigger>
            <TabsTrigger value="pathfinder" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Path Finder
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Accuracy
            </TabsTrigger>
            <TabsTrigger value="ml-analytics" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              ML Analytics
            </TabsTrigger>
            <TabsTrigger value="briefing" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Brief
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Network Graph */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Network Visualization
                  </CardTitle>
                  <CardDescription>
                    Interactive view of your relationship network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NetworkGraph />
                </CardContent>
              </Card>

              {/* Top Influencers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Top Influencers
                  </CardTitle>
                  <CardDescription>
                    Most influential contacts in your network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topInfluencers && topInfluencers.length > 0 ? (
                    <div className="space-y-3">
                      {topInfluencers.map((influencer: any, idx) => (
                        <div key={influencer.profile_id} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {influencer.profiles?.first_name} {influencer.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {influencer.profiles?.relationship_type?.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{influencer.influence_score}</p>
                            <p className="text-xs text-muted-foreground">score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No influence data yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Relationship Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Network Composition
                  </CardTitle>
                  <CardDescription>
                    Distribution by relationship type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {typeDistribution && Object.keys(typeDistribution).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(typeDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize text-sm">{type.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(count / (networkStats?.totalContacts || 1)) * 100} 
                                className="w-24 h-2" 
                              />
                              <span className="text-sm font-medium w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No contacts yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Influence Overview */}
            <RelationshipOverviewWidget />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <RelationshipForecastWidget />
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <NetworkRiskPanel />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <IntroductionMatcherPanel />
          </TabsContent>

          <TabsContent value="briefing" className="space-y-6">
            <DailyBriefingWidget />
          </TabsContent>

          <TabsContent value="bridges" className="space-y-6">
            <StructuralHolesPanel />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <CrossContactPatternsWidget />
          </TabsContent>

          <TabsContent value="pathfinder" className="space-y-6">
            <InfluencePathFinder />
          </TabsContent>

          <TabsContent value="accuracy" className="space-y-6">
            <PredictionAccuracyPanel />
          </TabsContent>

          <TabsContent value="ml-analytics" className="space-y-6">
            <AdvancedNetworkDashboard />
          </TabsContent>

          <TabsContent value="briefing" className="space-y-6">
            <DailyBriefingWidget />
            <MeetingPrepWidget />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
