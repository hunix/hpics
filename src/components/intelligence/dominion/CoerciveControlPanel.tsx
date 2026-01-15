/**
 * Coercive Control Panel
 * AGIS Phase 4 - Ultimate Dominion
 * 6-category control tactics with escalation pathways
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lock, Users, DollarSign, Clock, Eye, Brain,
  TrendingUp, AlertTriangle, Shield, Target, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCoerciveControl } from '@/hooks/intelligence/useCoerciveControl';

interface CoerciveControlPanelProps {
  profileId: string;
}

const CONTROL_CATEGORIES = [
  { id: 'isolation', label: 'Isolation', icon: Users, color: 'text-red-400', description: 'Social network restriction' },
  { id: 'financial', label: 'Financial', icon: DollarSign, color: 'text-green-400', description: 'Economic dependency' },
  { id: 'information', label: 'Information', icon: Eye, color: 'text-blue-400', description: 'Information asymmetry' },
  { id: 'time', label: 'Time', icon: Clock, color: 'text-orange-400', description: 'Schedule monopolization' },
  { id: 'emotional', label: 'Emotional', icon: Brain, color: 'text-purple-400', description: 'Emotional regulation' },
  { id: 'surveillance', label: 'Surveillance', icon: Eye, color: 'text-yellow-400', description: 'Monitoring & tracking' },
];

export function CoerciveControlPanel({ profileId }: CoerciveControlPanelProps) {
  const { 
    metrics, 
    tactics,
    recommendedTactics,
    isLoading,
    updateScores,
    recordCompliance 
  } = useCoerciveControl(profileId);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('isolation');
  
  const tacticsDeployed = tactics;
  const escalationRecommendations = recommendedTactics.map(t => ({
    tactic: t.name,
    rationale: t.description || '',
    expectedImpact: 15,
    riskLevel: 'medium',
    category: t.category,
    targetBehavior: t.targetBehavior || ''
  }));

  const getControlLevel = (score: number) => {
    if (score >= 80) return { label: 'Absolute', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    if (score >= 60) return { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    if (score >= 20) return { label: 'Developing', color: 'text-blue-500', bgColor: 'bg-blue-500/20' };
    return { label: 'Minimal', color: 'text-muted-foreground', bgColor: 'bg-muted/50' };
  };

  const overallScore = metrics 
    ? Math.round((
        (metrics.isolationScore || 0) + 
        (metrics.financialControlScore || 0) + 
        (metrics.informationControlScore || 0) + 
        (metrics.timeMonopolizationScore || 0)
      ) / 4)
    : 0;

  if (isLoading) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading control metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Lock className="h-5 w-5" />
            Coercive Control Framework
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${getControlLevel(overallScore).color} border-current`}
          >
            {getControlLevel(overallScore).label} Control
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Control Score */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Control Index</span>
            <span className="text-2xl font-bold text-red-400">{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-2">
          {CONTROL_CATEGORIES.map((category) => {
            const score = metrics?.[`${category.id}Score` as keyof typeof metrics] as number || 0;
            const level = getControlLevel(score);
            
            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCategory === category.id 
                    ? 'border-red-500/50 bg-red-500/10' 
                    : 'border-border/30 bg-muted/20 hover:bg-muted/30'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-xs font-medium">{category.label}</span>
                </div>
                <div className="text-lg font-bold">{Math.round(score)}%</div>
                <Progress value={score} className="h-1 mt-1" />
              </motion.div>
            );
          })}
        </div>

        <Tabs defaultValue="tactics" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="tactics">Active Tactics</TabsTrigger>
            <TabsTrigger value="escalation">Escalation</TabsTrigger>
            <TabsTrigger value="resistance">Resistance</TabsTrigger>
          </TabsList>

          <TabsContent value="tactics" className="mt-4">
            <ScrollArea className="h-[300px]">
              {tacticsDeployed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active control tactics deployed
                </div>
              ) : (
                <div className="space-y-2">
                  {tacticsDeployed.map((tactic, index) => (
                    <motion.div
                      key={tactic.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg border border-border/30 bg-muted/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{tactic.tacticName}</div>
                          <div className="text-xs text-muted-foreground">{tactic.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(tactic.effectivenessScore * 100)}% effective
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={tactic.status === 'active' ? 'text-green-400 border-green-500/50' : 'text-muted-foreground'}
                          >
                            {tactic.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {tactic.resistanceEncountered && (
                        <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                          <div className="text-xs text-yellow-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Resistance detected - adaptation required
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="escalation" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {escalationRecommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No escalation recommendations at this time
                  </div>
                ) : (
                  escalationRecommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-orange-500/20">
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{rec.tactic}</div>
                          <div className="text-xs text-muted-foreground mt-1">{rec.rationale}</div>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="text-orange-400">
                              Impact: +{rec.expectedImpact}%
                            </span>
                            <span className="text-muted-foreground">
                              Risk: {rec.riskLevel}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-orange-500/30 text-orange-400"
                          onClick={() => deployTactic({
                            category: rec.category,
                            tacticName: rec.tactic,
                            description: rec.rationale,
                            targetBehavior: rec.targetBehavior,
                            expectedOutcome: `+${rec.expectedImpact}% control`
                          })}
                        >
                          Deploy
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resistance" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  Resistance Patterns Detected
                </h4>
                
                <div className="space-y-3">
                  {[
                    { pattern: 'Social reconnection attempts', frequency: 'High', lastSeen: '2 days ago' },
                    { pattern: 'Financial independence seeking', frequency: 'Medium', lastSeen: '1 week ago' },
                    { pattern: 'Information verification', frequency: 'Low', lastSeen: '3 days ago' },
                  ].map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div>
                        <div className="text-sm">{pattern.pattern}</div>
                        <div className="text-xs text-muted-foreground">{pattern.lastSeen}</div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          pattern.frequency === 'High' ? 'text-red-400 border-red-500/50' :
                          pattern.frequency === 'Medium' ? 'text-yellow-400 border-yellow-500/50' :
                          'text-green-400 border-green-500/50'
                        }
                      >
                        {pattern.frequency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-400" />
                  Counter-Resistance Strategies
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    Increase intermittent validation to reduce escape motivation
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    Deploy guilt-based messaging around loyalty themes
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                    Accelerate financial interdependency mechanisms
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
