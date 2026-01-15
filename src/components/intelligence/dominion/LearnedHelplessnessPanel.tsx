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
  Ban, AlertCircle, Shield, Target,
  Brain, Activity, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLearnedHelplessness } from '@/hooks/intelligence/useLearnedHelplessness';

interface LearnedHelplessnessPanelProps {
  profileId: string;
}

export function LearnedHelplessnessPanel({ profileId }: LearnedHelplessnessPanelProps) {
  const { 
    profile,
    isLoading, 
    helplessnessScore, 
    indicators, 
    activeTechniques,
    escapeAttempts,
    deployCountermeasure,
    getPhaseInfo 
  } = useLearnedHelplessness(profileId);

  const phaseInfo = getPhaseInfo(helplessnessScore);

  const displayIndicators = indicators || {
    initiativeSuppression: 75,
    decisionParalysis: 68,
    externalLocus: 82,
    passiveCompliance: 70,
    escapeAttemptFrequency: 25,
    escapeSuccessRate: 0,
  };

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
            {phaseInfo.phase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
            <div className="text-2xl font-bold">{Math.round(helplessnessScore)}%</div>
          </div>
          <Progress value={helplessnessScore} className="h-2" />
        </div>

        {/* Key Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Initiative Suppression', value: displayIndicators.initiativeSuppression, icon: Ban },
            { label: 'Decision Paralysis', value: displayIndicators.decisionParalysis, icon: Brain },
            { label: 'External Locus', value: displayIndicators.externalLocus, icon: Target },
            { label: 'Passive Compliance', value: displayIndicators.passiveCompliance, icon: Shield },
          ].map((indicator) => (
            <div key={indicator.label} className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <indicator.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{indicator.label}</span>
              </div>
              <div className="text-lg font-bold">{Math.round(indicator.value)}%</div>
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
              {activeTechniques.map((technique, index) => (
                <motion.div
                  key={technique.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      technique.isActive ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm">{technique.name}</span>
                  </div>
                  {technique.isActive ? (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(technique.effectiveness)}% effective
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
              <span className="font-medium">{escapeAttempts.length} in past 30 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium text-green-400">
                {Math.round(displayIndicators.escapeSuccessRate)}% (blocked)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attempt Frequency</span>
              <span className="font-medium text-green-400">
                {displayIndicators.escapeAttemptFrequency < 30 ? 'Decreasing ↓' : 'Stable →'}
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 border-red-500/30 text-red-400"
            onClick={() => deployCountermeasure?.('standard-suppression')}
          >
            <Zap className="h-3 w-3 mr-2" />
            Deploy Counter-Measure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
