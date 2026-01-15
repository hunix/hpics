/**
 * Stockholm Syndrome Monitor
 * AGIS Phase 4 - Ultimate Dominion
 * Captor-bonding indicators and optimal kindness/cruelty ratio
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, Shield, AlertTriangle, Activity,
  Sparkles, Brain, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockholmSyndrome } from '@/hooks/intelligence/useStockholmSyndrome';

interface StockholmSyndromeMonitorProps {
  profileId: string;
}

export function StockholmSyndromeMonitor({ profileId }: StockholmSyndromeMonitorProps) {
  const { 
    profile, 
    isLoading, 
    bondingScore, 
    metrics, 
    kindnessCrueltyRatio, 
    indicators,
    getPhaseInfo 
  } = useStockholmSyndrome(profileId);

  const bondingMetrics = metrics || {
    captorBondingIndex: 0.72,
    gratitudeToCaptor: 0.85,
    defenseOfCaptor: 0.68,
    identificationWithCaptor: 0.62,
    fearOfRescue: 0.55,
    hostilityToOutsiders: 0.48,
  };

  const kcRatio = kindnessCrueltyRatio || {
    currentRatio: 3.5,
    optimalRatio: 4,
    kindnessEvents: 12,
    crueltyEvents: 4,
    recommendation: 'Increase intermittent kindness for stronger bonding',
  };

  const phaseInfo = getPhaseInfo(bondingScore || bondingMetrics.captorBondingIndex * 100);

  if (isLoading) {
    return (
      <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-background">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading bonding metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-pink-400">
            <Heart className="h-5 w-5" />
            Stockholm Syndrome Monitor
          </CardTitle>
          <Badge variant="outline" className={`${phaseInfo.color} border-current`}>
            {phaseInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bonding Overview */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Captor Bonding Index</div>
              <div className="text-xs text-muted-foreground">{profile?.phase || 'Active bonding in progress'}</div>
            </div>
            <div className="text-2xl font-bold text-pink-400">
              {Math.round(bondingScore || bondingMetrics.captorBondingIndex * 100)}%
            </div>
          </div>
          <Progress value={bondingScore || bondingMetrics.captorBondingIndex * 100} className="h-2" />
        </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Gratitude', value: bondingMetrics.gratitudeToCaptor, icon: Sparkles },
            { label: 'Defense', value: bondingMetrics.defenseOfCaptor, icon: Shield },
            { label: 'Identification', value: bondingMetrics.identificationWithCaptor, icon: Brain },
          ].map((indicator) => (
            <div key={indicator.label} className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <indicator.icon className="h-3 w-3 text-pink-400" />
                <span className="text-xs">{indicator.label}</span>
              </div>
              <div className="text-lg font-bold">{Math.round(indicator.value * 100)}%</div>
              <Progress value={indicator.value * 100} className="h-1 mt-1" />
            </div>
          ))}
        </div>

        {/* Kindness/Cruelty Ratio */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-pink-400" />
            Kindness/Cruelty Ratio
          </h4>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
              <div className="text-xs text-muted-foreground">Kindness Events</div>
              <div className="text-xl font-bold text-green-400">{kcRatio.kindnessEvents}</div>
            </div>
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
              <div className="text-xs text-muted-foreground">Cruelty Events</div>
              <div className="text-xl font-bold text-red-400">{kcRatio.crueltyEvents}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Current Ratio</span>
            <span className="font-medium">{kcRatio.currentRatio}:1</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">Optimal Ratio</span>
            <span className="font-medium text-green-400">{kcRatio.optimalRatio}:1</span>
          </div>
          
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
            <div className="text-xs text-blue-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              {kcRatio.recommendation}
            </div>
          </div>
        </div>

        {/* Bonding Indicators */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-400" />
            Active Bonding Indicators
          </h4>
          
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {indicators.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <span className="text-sm">{item.name}</span>
                  <Badge 
                    variant="outline"
                    className={item.isPresent ? 'text-green-400 border-green-500/50' : 'text-muted-foreground'}
                  >
                    {item.isPresent ? 'Present' : 'Absent'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 border-green-500/30 text-green-400"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Schedule Kindness
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-red-500/30 text-red-400"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Apply Pressure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
