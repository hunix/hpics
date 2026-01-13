import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Shield, Eye, Brain, Network, Target,
  TrendingUp, AlertTriangle, Zap, ChevronRight,
  Lock, Unlock, Activity, Gauge, Radar, Crosshair
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  calculateSuperiorityScore, 
  INFLUENCE_PRINCIPLES,
  MANIPULATION_INDICATORS,
  COGNITIVE_BIASES
} from '@/lib/intelligence/superiority-engine';

interface SuperiorityDashboardProps {
  className?: string;
}

export function SuperiorityDashboard({ className }: SuperiorityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate superiority metrics
  const metrics = useMemo(() => {
    return calculateSuperiorityScore(100, 5, 0.72, 45);
  }, []);

  const dimensionLabels = {
    informationAdvantage: { label: 'Information Advantage', icon: Eye, color: 'text-blue-400' },
    networkPosition: { label: 'Network Position', icon: Network, color: 'text-violet-400' },
    psychologicalInsight: { label: 'Psychological Insight', icon: Brain, color: 'text-pink-400' },
    predictiveAccuracy: { label: 'Predictive Accuracy', icon: Target, color: 'text-amber-400' },
    influenceCapability: { label: 'Influence Capability', icon: Zap, color: 'text-emerald-400' },
    defensivePosture: { label: 'Defensive Posture', icon: Shield, color: 'text-red-400' }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Score */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-violet-500 to-amber-500 p-1">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-violet-400 to-amber-400 bg-clip-text text-transparent">
                  Superiority Index
                </h2>
                <p className="text-muted-foreground">Strategic advantage assessment</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-primary">
                  {Math.round(metrics.overallScore)}
                </span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "mt-1",
                  metrics.overallScore >= 70 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : metrics.overallScore >= 40
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                )}
              >
                {metrics.overallScore >= 70 ? 'Dominant' : metrics.overallScore >= 40 ? 'Competitive' : 'Vulnerable'}
              </Badge>
            </div>
          </div>
          
          {/* Dimension Bars */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Object.entries(metrics.dimensions).map(([key, value]) => {
              const config = dimensionLabels[key as keyof typeof dimensionLabels];
              const Icon = config.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="h-1.5 flex-1" />
                    <span className="text-sm font-bold">{Math.round(value)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="overview" className="gap-2">
            <Gauge className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="influence" className="gap-2">
            <Zap className="h-4 w-4" />
            Influence
          </TabsTrigger>
          <TabsTrigger value="defense" className="gap-2">
            <Shield className="h-4 w-4" />
            Defense
          </TabsTrigger>
          <TabsTrigger value="biases" className="gap-2">
            <Brain className="h-4 w-4" />
            Biases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Actions */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-primary" />
                  Strategic Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Generate Influence Strategy', icon: Target, color: 'violet' },
                  { label: 'Analyze Power Dynamics', icon: Network, color: 'blue' },
                  { label: 'Map Relationship Chessboard', icon: Crown, color: 'amber' },
                  { label: 'Detect Manipulation Patterns', icon: AlertTriangle, color: 'red' }
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    className="w-full justify-start hover:bg-muted/50"
                  >
                    <action.icon className={cn("h-4 w-4 mr-2", `text-${action.color}-400`)} />
                    {action.label}
                    <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Priority Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {[
                      { action: 'Complete psychological profiles for top 10 contacts', gain: 15, effort: 'medium' },
                      { action: 'Analyze communication patterns for manipulation detection', gain: 12, effort: 'low' },
                      { action: 'Map influence network for key business contacts', gain: 18, effort: 'high' },
                      { action: 'Review and update relationship strategies quarterly', gain: 8, effort: 'low' }
                    ].map((rec, i) => (
                      <div 
                        key={i}
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">{rec.action}</p>
                          <Badge variant="outline" className="shrink-0 bg-emerald-500/10 text-emerald-400">
                            +{rec.gain}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Effort:</span>
                          <Badge variant="secondary" className="text-xs">
                            {rec.effort}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="influence" className="mt-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                Cialdini's Principles of Influence
              </CardTitle>
              <CardDescription>
                Master these principles to ethically influence outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(INFLUENCE_PRINCIPLES).map(([key, principle]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all"
                  >
                    <h4 className="font-semibold text-primary">{principle.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{principle.description}</p>
                    <div className="mt-3">
                      <span className="text-xs font-medium text-muted-foreground">Tactics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {principle.tactics.slice(0, 3).map((tactic) => (
                          <Badge key={tactic} variant="secondary" className="text-xs">
                            {tactic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defense" className="mt-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Manipulation Detection Framework
              </CardTitle>
              <CardDescription>
                Recognize and defend against manipulation tactics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(MANIPULATION_INDICATORS).map(([key, indicator]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-all",
                      indicator.severity === 'high' 
                        ? "border-red-500/30" 
                        : "border-border/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{indicator.name}</h4>
                      <Badge 
                        variant="outline"
                        className={cn(
                          indicator.severity === 'high'
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {indicator.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{indicator.description}</p>
                    <div className="mt-3">
                      <span className="text-xs font-medium text-muted-foreground">Warning Signs:</span>
                      <ul className="mt-1 space-y-0.5">
                        {indicator.indicators.slice(0, 3).map((ind) => (
                          <li key={ind} className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biases" className="mt-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                Cognitive Biases for Strategic Advantage
              </CardTitle>
              <CardDescription>
                Understand and leverage cognitive biases ethically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(COGNITIVE_BIASES).map(([key, bias]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all"
                  >
                    <h4 className="font-semibold text-violet-400">{bias.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{bias.description}</p>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-emerald-400">Use:</span>
                        <p className="text-xs text-muted-foreground">{bias.exploitation}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-blue-400">Defend:</span>
                        <p className="text-xs text-muted-foreground">{bias.defense}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
