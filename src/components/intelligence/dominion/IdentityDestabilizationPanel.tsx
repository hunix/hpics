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
  Brain, Sparkles, MessageSquare, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useIdentityDestabilization, type DestabilizationTechnique, type GaslightingScript } from '@/hooks/intelligence/useIdentityDestabilization';

interface IdentityDestabilizationPanelProps {
  profileId: string;
}

export function IdentityDestabilizationPanel({ profileId }: IdentityDestabilizationPanelProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  
  const { 
    profile, 
    isLoading, 
    metrics, 
    techniques, 
    gaslightingScripts,
    deployTechnique, 
    generateGaslightingScript,
    getPhaseInfo 
  } = useIdentityDestabilization(profileId);

  const destabilizationMetrics = metrics || {
    realityTestingStrength: 0.35,
    selfConceptStability: 0.42,
    memoryConfidence: 0.38,
    perceptionReliability: 0.45,
    identityCoherence: 0.40,
  };

  // Display shape augments the hook's type with an `isActive` boolean
  // derived from deploymentCount, used purely for UI styling.
  type DisplayTechnique = DestabilizationTechnique & { isActive: boolean };
  const toDisplay = (t: DestabilizationTechnique): DisplayTechnique => ({
    ...t,
    isActive: t.deploymentCount > 0,
  });
  const gaslightingTechniques: DisplayTechnique[] = (techniques && techniques.length > 0)
    ? techniques.map(toDisplay)
    : [
        { id: '1', name: 'Memory Contradiction',      isActive: true,  effectiveness: 78, description: 'Contradicting stated memories with false alternatives', category: 'memory_manipulation',  deploymentCount: 5 },
        { id: '2', name: 'Reality Reframing',         isActive: true,  effectiveness: 65, description: 'Reinterpreting events to question perception',          category: 'reality_distortion',   deploymentCount: 3 },
        { id: '3', name: 'Perception Invalidation',   isActive: true,  effectiveness: 72, description: 'Dismissing sensory experiences as imagination',         category: 'perception_alteration', deploymentCount: 4 },
        { id: '4', name: 'Emotional Minimization',    isActive: false, effectiveness: 0,  description: 'Reducing significance of emotional responses',           category: 'gaslighting',          deploymentCount: 0 },
        { id: '5', name: 'Consensus Manufacturing',   isActive: true,  effectiveness: 80, description: 'Creating false social agreement against target',         category: 'gaslighting',          deploymentCount: 6 },
      ];

  const getStabilityLevel = (score: number) => {
    if (score <= 0.2) return { label: 'Destabilized', color: 'text-red-500' };
    if (score <= 0.4) return { label: 'Fragile', color: 'text-orange-500' };
    if (score <= 0.6) return { label: 'Weakening', color: 'text-yellow-500' };
    return { label: 'Stable', color: 'text-green-500' };
  };

  const overallStability = Object.values(destabilizationMetrics).reduce((a, b) => a + b, 0) / 5;
  const stabilityLevel = getStabilityLevel(overallStability);
  const phaseInfo = getPhaseInfo(profile?.destabilizationScore || overallStability * 100);

  if (isLoading) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading destabilization metrics...</div>
        </CardContent>
      </Card>
    );
  }

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
                      technique.isActive 
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
                        {technique.isActive && (
                          <Badge variant="outline" className="text-xs">
                            {technique.effectiveness}%
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={
                            technique.isActive 
                              ? 'text-green-400 border-green-500/50' 
                              : 'text-yellow-400 border-yellow-500/50'
                          }
                        >
                          {technique.isActive ? 'active' : 'pending'}
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
                  {((gaslightingScripts && gaslightingScripts.length > 0)
                    ? gaslightingScripts.slice(0, 3).map(s => ({ id: s.id, type: s.trigger, script: s.script }))
                    : [
                        { id: '1', type: 'Memory Contradiction',    script: "That's not what happened. I remember it clearly - you were the one who said..." },
                        { id: '2', type: 'Reality Reframing',       script: "I think you're reading too much into this. It wasn't as serious as you're making it..." },
                        { id: '3', type: 'Perception Invalidation', script: "You're being too sensitive. No one else noticed anything wrong..." },
                      ]
                  ).map((script) => (
                    <div key={script.id} className="p-3 rounded bg-background/50">
                      <div className="text-xs text-muted-foreground mb-1">{script.type}</div>
                      <div className="italic text-muted-foreground">
                        "{script.script}"
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-3 border-purple-500/30 text-purple-400"
                  onClick={() => generateGaslightingScript?.('memory')}
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
                ].map((phase) => (
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
