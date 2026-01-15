/**
 * Breaking Point Calculator
 * AGIS Phase 4 - Ultimate Dominion
 * Psychological limit forecasting with 15 pressure vectors
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, Brain, Activity, TrendingDown, Shield,
  Zap, Target, Clock, BarChart3, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakingPointPrediction, type PressureVector } from '@/hooks/intelligence/useBreakingPointPrediction';

interface BreakingPointCalculatorProps {
  profileId: string;
}

const VECTOR_ICONS: Record<string, React.ElementType> = {
  emotional: Brain,
  financial: BarChart3,
  social: Shield,
  professional: Target,
  health: Activity,
  relationship: AlertCircle,
  time: Clock,
  cognitive: Brain,
  identity: AlertTriangle,
  trust: Shield,
  autonomy: Zap,
  meaning: Target,
  control: AlertTriangle,
  security: Shield,
  belonging: AlertCircle,
};

export function BreakingPointCalculator({ profileId }: BreakingPointCalculatorProps) {
  const { 
    prediction, 
    pressureVectors: rawVectors,
    isLoading,
    applyPressure,
    initializePrediction 
  } = useBreakingPointPrediction(profileId);
  
  const [selectedVector, setSelectedVector] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  
  // Map pressure vectors to expected format
  const pressureVectors = rawVectors.map(v => ({
    type: v.vectorType,
    currentLevel: v.currentLevel,
    thresholdLevel: v.threshold,
    description: v.vectorType
  }));
  
  const criticalThresholds = pressureVectors
    .filter(v => v.currentLevel / v.thresholdLevel >= 0.7)
    .map(v => ({
      vector: v.type,
      level: v.thresholdLevel,
      status: v.currentLevel >= v.thresholdLevel ? 'exceeded' : 'approaching'
    }));

  const getVectorColor = (currentLevel: number, threshold: number) => {
    const ratio = currentLevel / threshold;
    if (ratio >= 0.9) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (ratio >= 0.7) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (ratio >= 0.5) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const getBreakingRisk = (probability: number) => {
    if (probability >= 0.8) return { label: 'Imminent', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    if (probability >= 0.6) return { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    if (probability >= 0.4) return { label: 'Elevated', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    if (probability >= 0.2) return { label: 'Moderate', color: 'text-blue-500', bgColor: 'bg-blue-500/20' };
    return { label: 'Low', color: 'text-green-500', bgColor: 'bg-green-500/20' };
  };

  if (isLoading) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Calculating psychological limits...</div>
        </CardContent>
      </Card>
    );
  }

  const breakingRisk = prediction ? getBreakingRisk(prediction.overallProbability || 0) : getBreakingRisk(0);

  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-400">
            <TrendingDown className="h-5 w-5" />
            Breaking Point Calculator
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${breakingRisk.color} border-current`}
          >
            {breakingRisk.label} Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Breaking Point Overview */}
        {prediction && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Breaking Probability</div>
                <div className="text-2xl font-bold text-red-400">
                  {Math.round((prediction.overallProbability || 0) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Current Resilience</div>
                <div className="text-2xl font-bold text-green-400">
                  {Math.round((prediction.resilienceEstimate || 0.5) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Est. Timeline</div>
                <div className="text-2xl font-bold text-orange-400">
                  {prediction.estimatedTimeline || 'Unknown'}
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Pressure Accumulation</span>
                <span>{Math.round((prediction.overallProbability || 0) * 100)}%</span>
              </div>
              <Progress value={(prediction.overallProbability || 0) * 100} className="h-2" />
            </div>
          </div>
        )}

        <Tabs defaultValue="vectors" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="vectors">
              Pressure Vectors ({pressureVectors.length})
            </TabsTrigger>
            <TabsTrigger value="thresholds">
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="simulation">
              Simulation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vectors" className="mt-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {pressureVectors.map((vector, index) => {
                  const Icon = VECTOR_ICONS[vector.type] || AlertTriangle;
                  const colorClass = getVectorColor(vector.currentLevel, vector.thresholdLevel);
                  const ratio = (vector.currentLevel / vector.thresholdLevel) * 100;
                  
                  return (
                    <motion.div
                      key={vector.type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-3 rounded-lg border ${colorClass} cursor-pointer transition-all`}
                      onClick={() => setSelectedVector(vector.type)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm capitalize">{vector.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {vector.description || 'Pressure vector analysis'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">
                            {Math.round(vector.currentLevel * 100)}/{Math.round(vector.thresholdLevel * 100)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(ratio)}% of threshold
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Progress value={ratio} className="h-1.5" />
                      </div>

                      {ratio >= 80 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Critical threshold approaching</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="thresholds" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Critical Thresholds
                </h4>
                
                <div className="space-y-3">
                  {criticalThresholds.map((threshold, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          threshold.status === 'exceeded' ? 'bg-red-500' :
                          threshold.status === 'approaching' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-sm capitalize">{threshold.vector}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Threshold: {Math.round(threshold.level * 100)}%
                        </span>
                        <Badge 
                          variant="outline"
                          className={
                            threshold.status === 'exceeded' ? 'text-red-400 border-red-500/50' :
                            threshold.status === 'approaching' ? 'text-orange-400 border-orange-500/50' :
                            'text-green-400 border-green-500/50'
                          }
                        >
                          {threshold.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Psychological Profile Factors
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Stress Tolerance', value: 65 },
                    { label: 'Emotional Regulation', value: 45 },
                    { label: 'Support Network', value: 30 },
                    { label: 'Coping Mechanisms', value: 55 },
                    { label: 'Recovery Capacity', value: 40 },
                    { label: 'Baseline Anxiety', value: 70 },
                  ].map((factor) => (
                    <div key={factor.label} className="p-2 rounded bg-background/50">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{factor.label}</span>
                        <span>{factor.value}%</span>
                      </div>
                      <Progress value={factor.value} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  Pressure Simulation
                </h4>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Simulate applying pressure across different vectors to predict breaking point timing.
                </p>

                <div className="space-y-3">
                  {['emotional', 'financial', 'social', 'professional'].map((vector) => (
                    <div key={vector} className="flex items-center gap-4">
                      <span className="text-sm capitalize w-24">{vector}</span>
                      <div className="flex-1">
                        <Progress value={50} className="h-2" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-orange-500/30 text-orange-400"
                        onClick={() => simulatePressure(vector, 0.1)}
                      >
                        +10%
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full mt-4 bg-red-600 hover:bg-red-700"
                  onClick={() => initializePrediction()}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Calculate Breaking Point
                </Button>
              </div>

              {prediction?.triggerEvents && prediction.triggerEvents.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-red-400">
                    <Zap className="h-4 w-4" />
                    Predicted Trigger Scenarios
                  </h4>
                  
                  <div className="space-y-2">
                    {prediction.triggerEvents.map((scenario: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3 text-red-400" />
                        <span className="text-muted-foreground">{scenario}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
