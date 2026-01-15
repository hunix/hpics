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
  Heart, Shield, AlertTriangle, TrendingUp, Activity,
  Sparkles, Brain, Target, ChevronRight, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StockholmSyndromeMonitorProps {
  profileId: string;
}

export function StockholmSyndromeMonitor({ profileId }: StockholmSyndromeMonitorProps) {
  // Simulated metrics - would come from database in production
  const bondingMetrics = {
    captorBondingScore: 0.72,
    gratitudeForKindness: 0.85,
    defenseOfController: 0.68,
    fearToLoyaltyConversion: 0.75,
    identificationWithCaptor: 0.62,
    rationalizedCruelty: 0.70,
  };

  const kindnessCrueltyRatio = {
    currentRatio: '3:1',
    optimalRatio: '4:1',
    kindnessEvents: 12,
    crueltyEvents: 4,
    recommendation: 'Increase intermittent kindness for stronger bonding',
  };

  const getBondingPhase = (score: number) => {
    if (score >= 0.8) return { phase: 'Full Stockholm', color: 'text-green-500', description: 'Complete captor identification achieved' };
    if (score >= 0.6) return { phase: 'Strong Bonding', color: 'text-blue-500', description: 'Active defense of controller behaviors' };
    if (score >= 0.4) return { phase: 'Emerging Bond', color: 'text-yellow-500', description: 'Gratitude patterns forming' };
    if (score >= 0.2) return { phase: 'Initial Attachment', color: 'text-orange-500', description: 'Fear beginning to convert' };
    return { phase: 'Pre-Bonding', color: 'text-red-500', description: 'No captor attachment detected' };
  };

  const phaseInfo = getBondingPhase(bondingMetrics.captorBondingScore);

  return (
    <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-pink-400">
            <Heart className="h-5 w-5" />
            Stockholm Syndrome Monitor
          </CardTitle>
          <Badge variant="outline" className={`${phaseInfo.color} border-current`}>
            {phaseInfo.phase}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bonding Overview */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Captor Bonding Index</div>
              <div className="text-xs text-muted-foreground">{phaseInfo.description}</div>
            </div>
            <div className="text-2xl font-bold text-pink-400">
              {Math.round(bondingMetrics.captorBondingScore * 100)}%
            </div>
          </div>
          <Progress value={bondingMetrics.captorBondingScore * 100} className="h-2" />
        </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Gratitude', value: bondingMetrics.gratitudeForKindness, icon: Sparkles },
            { label: 'Defense', value: bondingMetrics.defenseOfController, icon: Shield },
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
              <div className="text-xl font-bold text-green-400">{kindnessCrueltyRatio.kindnessEvents}</div>
            </div>
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
              <div className="text-xs text-muted-foreground">Cruelty Events</div>
              <div className="text-xl font-bold text-red-400">{kindnessCrueltyRatio.crueltyEvents}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Current Ratio</span>
            <span className="font-medium">{kindnessCrueltyRatio.currentRatio}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">Optimal Ratio</span>
            <span className="font-medium text-green-400">{kindnessCrueltyRatio.optimalRatio}</span>
          </div>
          
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
            <div className="text-xs text-blue-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              {kindnessCrueltyRatio.recommendation}
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
              {[
                { indicator: 'Expresses gratitude for basic treatment', present: true },
                { indicator: 'Defends controller to outsiders', present: true },
                { indicator: 'Minimizes severity of mistreatment', present: true },
                { indicator: 'Adopts controller\'s worldview', present: true },
                { indicator: 'Fears rescue/intervention', present: false },
                { indicator: 'Believes controller cares about them', present: true },
                { indicator: 'Refuses opportunities to leave', present: false },
              ].map((item, index) => (
                <motion.div
                  key={item.indicator}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded bg-background/50"
                >
                  <span className="text-sm">{item.indicator}</span>
                  <Badge 
                    variant="outline"
                    className={item.present ? 'text-green-400 border-green-500/50' : 'text-muted-foreground'}
                  >
                    {item.present ? 'Present' : 'Absent'}
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
