/**
 * Learned Helplessness Panel
 * AGIS Phase 4 - Ultimate Dominion
 * Systematic hopelessness induction and initiative blocking
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ban, TrendingDown, AlertCircle, Shield, Target,
  Brain, Activity, Clock, ChevronRight, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDependencyTracking } from '@/hooks/intelligence/useDependencyTracking';

interface LearnedHelplessnessPanelProps {
  profileId: string;
}

export function LearnedHelplessnessPanel({ profileId }: LearnedHelplessnessPanelProps) {
  const { dependency, isLoading } = useDependencyTracking(profileId);
  
  const helplessnessScore = dependency?.emotionalDependency || 0;

  const getPhaseInfo = (score: number) => {
    if (score >= 80) return { phase: 'Complete Helplessness', color: 'text-red-500', description: 'Full learned helplessness achieved' };
    if (score >= 60) return { phase: 'Resignation', color: 'text-orange-500', description: 'Minimal resistance to control' };
    if (score >= 40) return { phase: 'Passive Acceptance', color: 'text-yellow-500', description: 'Reduced initiative observed' };
    if (score >= 20) return { phase: 'Initial Conditioning', color: 'text-blue-500', description: 'Beginning helplessness induction' };
    return { phase: 'Pre-Conditioning', color: 'text-green-500', description: 'Target shows agency' };
  };

  const phaseInfo = getPhaseInfo(helplessnessScore * 100);

  if (isLoading) {
    return (
      <Card className="border-gray-500/30 bg-gradient-to-br from-gray-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading helplessness metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-500/30 bg-gradient-to-br from-gray-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-400">
            <Ban className="h-5 w-5" />
            Learned Helplessness Induction
          </CardTitle>
          <Badge variant="outline" className={`${phaseInfo.color} border-current`}>
            {phaseInfo.phase}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Helplessness Score */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-gray-500/10 to-gray-500/5 border border-gray-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Helplessness Index</div>
              <div className="text-xs text-muted-foreground">{phaseInfo.description}</div>
            </div>
            <div className="text-2xl font-bold">{Math.round(helplessnessScore * 100)}%</div>
          </div>
          <Progress value={helplessnessScore * 100} className="h-2" />
        </div>

        {/* Key Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Initiative Suppression', value: 75, icon: Ban },
            { label: 'Decision Paralysis', value: 68, icon: Brain },
            { label: 'External Locus', value: 82, icon: Target },
            { label: 'Escape Abandonment', value: 70, icon: Shield },
          ].map((indicator) => (
            <div key={indicator.label} className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <indicator.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{indicator.label}</span>
              </div>
              <div className="text-lg font-bold">{indicator.value}%</div>
              <Progress value={indicator.value} className="h-1 mt-1" />
            </div>
          ))}
        </div>

        {/* Induction Techniques */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            Active Induction Techniques
          </h4>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {[
                { technique: 'No-Win Scenario Creation', status: 'active', effectiveness: 78 },
                { technique: 'Arbitrary Rule Enforcement', status: 'active', effectiveness: 65 },
                { technique: 'Effort Futility Demonstration', status: 'pending', effectiveness: 0 },
                { technique: 'Success Attribution Redirection', status: 'active', effectiveness: 72 },
                { technique: 'Control Perception Erosion', status: 'active', effectiveness: 80 },
                { technique: 'Predictability Elimination', status: 'pending', effectiveness: 0 },
              ].map((technique, index) => (
                <motion.div
                  key={technique.technique}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      technique.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm">{technique.technique}</span>
                  </div>
                  {technique.status === 'active' ? (
                    <Badge variant="outline" className="text-xs">
                      {technique.effectiveness}% effective
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 text-xs">
                      Pending
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Escape Attempt Detection */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <h4 className="font-medium mb-3 flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            Escape Attempt Detection
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Recent Attempts</span>
              <span className="font-medium">3 in past 30 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium text-green-400">0% (all blocked)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attempt Frequency</span>
              <span className="font-medium text-green-400">Decreasing ↓</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 border-red-500/30 text-red-400"
          >
            <Zap className="h-3 w-3 mr-2" />
            Deploy Counter-Measure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
