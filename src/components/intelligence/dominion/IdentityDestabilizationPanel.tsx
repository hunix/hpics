/**
 * Identity Destabilization Panel
 * AGIS Phase 4 - Ultimate Dominion
 * Gaslighting, reality disruption, and identity erosion
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Eye, AlertTriangle, Target, Sparkles,
  RefreshCw, Layers, MessageSquare, Clock, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface IdentityDestabilizationPanelProps {
  profileId: string;
}

export function IdentityDestabilizationPanel({ profileId }: IdentityDestabilizationPanelProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);

  // Simulated data - would come from hook in production
  const destabilizationMetrics = {
    realityTestingStrength: 0.35,
    selfConceptStability: 0.42,
    memoryConfidence: 0.38,
    perceptionReliability: 0.45,
    identityCoherence: 0.40,
  };

  const gaslightingTechniques = [
    { id: 1, name: 'Memory Contradiction', status: 'active', effectiveness: 78, description: 'Contradicting stated memories with false alternatives' },
    { id: 2, name: 'Reality Reframing', status: 'active', effectiveness: 65, description: 'Reinterpreting events to question perception' },
    { id: 3, name: 'Perception Invalidation', status: 'active', effectiveness: 72, description: 'Dismissing sensory experiences as imagination' },
    { id: 4, name: 'Emotional Minimization', status: 'pending', effectiveness: 0, description: 'Reducing significance of emotional responses' },
    { id: 5, name: 'Consensus Manufacturing', status: 'active', effectiveness: 80, description: 'Creating false social agreement against target' },
  ];

  const getStabilityLevel = (score: number) => {
    if (score <= 0.2) return { label: 'Destabilized', color: 'text-red-500' };
    if (score <= 0.4) return { label: 'Fragile', color: 'text-orange-500' };
    if (score <= 0.6) return { label: 'Weakening', color: 'text-yellow-500' };
    return { label: 'Stable', color: 'text-green-500' };
  };

  const overallStability = Object.values(destabilizationMetrics).reduce((a, b) => a + b, 0) / 5;
  const stabilityLevel = getStabilityLevel(overallStability);

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Brain className="h-5 w-5" />
            Identity Destabilization
          </CardTitle>
          <Badge variant="outline" className={`${stabilityLevel.color} border-current`}>
            {stabilityLevel.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Destabilization Overview */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Identity Stability</div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(overallStability * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Target: &lt;25% for full destabilization
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Reality Testing</div>
              <div className="text-2xl font-bold text-pink-400">
                {Math.round(destabilizationMetrics.realityTestingStrength * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Impaired perception threshold reached
              </div>
            </div>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="space-y-2">
          {Object.entries(destabilizationMetrics).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            const level = getStabilityLevel(value);
            
            return (
              <div key={key} className="flex items-center gap-4">
                <span className="text-sm w-40">{label}</span>
                <div className="flex-1">
                  <Progress value={value * 100} className="h-2" />
                </div>
                <span className={`text-sm font-medium w-16 text-right ${level.color}`}>
                  {Math.round(value * 100)}%
                </span>
              </div>
            );
          })}
        </div>

        <Tabs defaultValue="techniques" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-muted/30">
            <TabsTrigger value="techniques">Techniques</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="techniques" className="mt-4">
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {gaslightingTechniques.map((technique, index) => (
                  <motion.div
                    key={technique.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${
                      technique.status === 'active' 
                        ? 'border-purple-500/30 bg-purple-500/5' 
                        : 'border-border/30 bg-muted/20'
                    } cursor-pointer hover:bg-purple-500/10 transition-all`}
                    onClick={() => setSelectedTechnique(technique.id.toString())}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{technique.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {technique.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {technique.status === 'active' && (
                          <Badge variant="outline" className="text-xs">
                            {technique.effectiveness}%
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={
                            technique.status === 'active' 
                              ? 'text-green-400 border-green-500/50' 
                              : 'text-yellow-400 border-yellow-500/50'
                          }
                        >
                          {technique.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="scripts" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  Gaslighting Script Generator
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Memory Contradiction</div>
                    <div className="italic text-muted-foreground">
                      "That's not what happened. I remember it clearly - you were the one who said..."
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Reality Reframing</div>
                    <div className="italic text-muted-foreground">
                      "I think you're reading too much into this. It wasn't as serious as you're making it..."
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Perception Invalidation</div>
                    <div className="italic text-muted-foreground">
                      "You're being too sensitive. No one else noticed anything wrong..."
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-3 border-purple-500/30 text-purple-400"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Custom Script
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Destabilization Timeline
              </h4>
              
              <div className="space-y-4">
                {[
                  { phase: 'Confusion', duration: 'Week 1-2', status: 'completed', description: 'Initial reality questioning' },
                  { phase: 'Self-Doubt', duration: 'Week 3-4', status: 'completed', description: 'Memory/perception uncertainty' },
                  { phase: 'Dependency', duration: 'Week 5-6', status: 'active', description: 'Reliance on controller for reality' },
                  { phase: 'Identity Erosion', duration: 'Week 7-8', status: 'pending', description: 'Core self-concept breakdown' },
                  { phase: 'Reconstruction', duration: 'Week 9+', status: 'pending', description: 'New identity formation under control' },
                ].map((phase, index) => (
                  <div key={phase.phase} className="flex items-start gap-3">
                    <div className={`mt-1 w-3 h-3 rounded-full ${
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'active' ? 'bg-purple-500 animate-pulse' :
                      'bg-muted'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{phase.phase}</span>
                        <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
