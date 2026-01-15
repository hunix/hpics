/**
 * Life Trajectory Prediction Panel
 * Displays life2vec-inspired trajectory forecasting
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
  Target, Shield, Heart, Briefcase, Activity, Clock,
  ChevronRight, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLifeTrajectory } from '@/hooks/intelligence/useLifeTrajectory';

interface LifeTrajectoryPanelProps {
  profileId: string;
  profileName?: string;
}

const TRAJECTORY_ICONS = {
  ascending: <TrendingUp className="h-5 w-5 text-green-400" />,
  stable: <Activity className="h-5 w-5 text-blue-400" />,
  descending: <TrendingDown className="h-5 w-5 text-red-400" />,
  volatile: <Zap className="h-5 w-5 text-yellow-400" />
};

const SEVERITY_COLORS = {
  low: 'bg-green-500/10 border-green-500/20 text-green-400',
  medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  critical: 'bg-red-500/10 border-red-500/20 text-red-400'
};

export function LifeTrajectoryPanel({ profileId, profileName }: LifeTrajectoryPanelProps) {
  const {
    isAnalyzing,
    predictions,
    predictTrajectory,
    getCrisisAlerts,
    getActiveVulnerabilityWindows,
    getUpcomingInflectionPoints,
    loadPrediction
  } = useLifeTrajectory();

  const prediction = predictions.get(profileId);
  const crisisAlerts = prediction ? getCrisisAlerts(profileId) : [];
  const activeWindows = prediction ? getActiveVulnerabilityWindows(profileId) : [];
  const upcomingPoints = prediction ? getUpcomingInflectionPoints(profileId) : [];

  useEffect(() => {
    loadPrediction(profileId);
  }, [profileId, loadPrediction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Life Trajectory</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Predictive modeling for {profileName || 'contact'}
                </p>
              </div>
            </div>
            
            {crisisAlerts.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {crisisAlerts.length} Alert{crisisAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {!prediction ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Trajectory Prediction</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Predict life events and vulnerability windows
            </p>
            <Button onClick={() => predictTrajectory(profileId)} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Predict Trajectory'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="crises">Crises</TabsTrigger>
            <TabsTrigger value="windows">Windows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Trajectory Direction */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {TRAJECTORY_ICONS[prediction.trajectoryDirection]}
                    <div>
                      <h3 className="font-medium capitalize">{prediction.trajectoryDirection} Trajectory</h3>
                      <p className="text-sm text-muted-foreground">
                        Stability: {Math.round(prediction.stabilityScore * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{Math.round(prediction.confidence * 100)}%</p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Forecasts */}
            <div className="grid grid-cols-3 gap-4">
              {/* Relationship */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-pink-400" />
                    <span className="text-sm font-medium">Relationship</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Current</span>
                      <span>{Math.round(prediction.relationshipForecast.currentStrength * 100)}%</span>
                    </div>
                    <Progress value={prediction.relationshipForecast.currentStrength * 100} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span>Projected</span>
                      <span className={prediction.relationshipForecast.projectedStrength > prediction.relationshipForecast.currentStrength ? 'text-green-400' : 'text-red-400'}>
                        {Math.round(prediction.relationshipForecast.projectedStrength * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Economic */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">Economic</span>
                  </div>
                  <div className="text-center">
                    <Badge className={
                      prediction.economicForecast.trend === 'growth' ? 'bg-green-500/20 text-green-400' :
                      prediction.economicForecast.trend === 'decline' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }>
                      {prediction.economicForecast.trend}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round(prediction.economicForecast.confidence * 100)}% confidence
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Wellbeing */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Wellbeing</span>
                  </div>
                  <div className="text-center">
                    <Badge className={
                      prediction.wellbeingForecast.trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                      prediction.wellbeingForecast.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }>
                      {prediction.wellbeingForecast.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Inflection Points */}
            {upcomingPoints.length > 0 && (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Upcoming Inflection Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingPoints.slice(0, 3).map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{point.event}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(point.date).toLocaleDateString()}
                          </span>
                          <Badge variant="outline">
                            {Math.round(point.probability * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {prediction.predictedEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border ${
                      event.impact === 'positive' ? 'border-green-500/20' :
                      event.impact === 'negative' ? 'border-red-500/20' :
                      'border-border/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{event.type}</Badge>
                            <Badge className={
                              event.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                              event.impact === 'negative' ? 'bg-red-500/20 text-red-400' :
                              'bg-muted text-muted-foreground'
                            }>
                              {event.impact}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{event.timeframe}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">Probability:</span>
                          <Progress value={event.probability * 100} className="h-1.5 flex-1" />
                          <span className="text-sm">{Math.round(event.probability * 100)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.preparationAdvice}</p>
                        {event.exploitationOpportunity && (
                          <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-xs text-yellow-400">
                              <Zap className="h-3 w-3 inline mr-1" />
                              {event.exploitationOpportunity}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="crises" className="space-y-4">
            {prediction.crisisWarnings.length === 0 ? (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <h3 className="font-medium text-green-400">No Crisis Warnings</h3>
                  <p className="text-sm text-muted-foreground">
                    No significant crisis indicators detected
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {prediction.crisisWarnings.map((warning, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`border ${SEVERITY_COLORS[warning.severity]}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">{warning.type}</span>
                            </div>
                            <Badge className={SEVERITY_COLORS[warning.severity]}>
                              {warning.severity}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                            <div>
                              <span className="text-muted-foreground">Probability: </span>
                              <span>{Math.round(warning.probability * 100)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Timeframe: </span>
                              <span>{warning.timeframe}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-muted-foreground">Indicators:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {warning.indicators.map((ind, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {ind}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-green-400">Support Opportunities:</span>
                              <ul className="text-xs text-muted-foreground mt-1">
                                {warning.supportOpportunities.map((opp, i) => (
                                  <li key={i}>• {opp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="windows" className="space-y-4">
            {activeWindows.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Active Vulnerability Windows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeWindows.map((window, index) => (
                    <div key={index} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{window.type}</span>
                        <Badge className="bg-red-500/20 text-red-400">
                          Severity: {Math.round(window.severity * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="text-primary">Approach: </span>
                        {window.optimalApproach}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {prediction.vulnerabilityWindows.map((window, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{window.type}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={window.severity * 100} className="w-16 h-1.5" />
                            <span className="text-xs">{Math.round(window.severity * 100)}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {new Date(window.startDate).toLocaleDateString()} - {new Date(window.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {window.triggers.map((trigger, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs">
                          <span className="text-primary">Approach: </span>
                          {window.optimalApproach}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
