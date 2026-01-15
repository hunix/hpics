/**
 * Chronotype Analysis Panel
 * Displays circadian patterns and optimal influence timing
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, Moon, Clock, Zap, Brain, Battery,
  TrendingUp, AlertCircle, Calendar, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChronotypeAnalysis, ChronotypeType } from '@/hooks/intelligence/useChronotypeAnalysis';

interface ChronotypePanelProps {
  profileId: string;
  profileName?: string;
}

const CHRONOTYPE_CONFIG: Record<ChronotypeType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  peak: string;
}> = {
  lion: {
    label: 'Lion',
    icon: <Sun className="h-5 w-5" />,
    color: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
    description: 'Early riser, peak performance in morning',
    peak: '6 AM - 12 PM'
  },
  bear: {
    label: 'Bear',
    icon: <Battery className="h-5 w-5" />,
    color: 'text-amber-400 border-amber-400/30 bg-amber-500/10',
    description: 'Follows solar cycle, steady energy',
    peak: '10 AM - 2 PM'
  },
  wolf: {
    label: 'Wolf',
    icon: <Moon className="h-5 w-5" />,
    color: 'text-indigo-400 border-indigo-400/30 bg-indigo-500/10',
    description: 'Night owl, peak creativity in evening',
    peak: '5 PM - 12 AM'
  },
  dolphin: {
    label: 'Dolphin',
    icon: <Brain className="h-5 w-5" />,
    color: 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10',
    description: 'Light sleeper, irregular patterns',
    peak: 'Variable'
  }
};

export function ChronotypePanel({ profileId, profileName }: ChronotypePanelProps) {
  const {
    isAnalyzing,
    profiles,
    analyzeChronotype,
    isVulnerableNow,
    loadProfile
  } = useChronotypeAnalysis();

  const profile = profiles.get(profileId);
  const vulnerabilityCheck = profile ? isVulnerableNow(profileId) : null;
  const chronoConfig = profile ? CHRONOTYPE_CONFIG[profile.chronotype] : null;

  useEffect(() => {
    loadProfile(profileId);
  }, [profileId, loadProfile]);

  const currentHour = new Date().getHours();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Clock className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Chronotype Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Circadian patterns for {profileName || 'contact'}
                </p>
              </div>
            </div>
            
            {vulnerabilityCheck?.isVulnerable && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                <Target className="h-3 w-3 mr-1" />
                Vulnerable Now
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {!profile ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Chronotype Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze circadian patterns to find optimal influence windows
            </p>
            <Button onClick={() => analyzeChronotype(profileId)} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Chronotype'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Chronotype Badge */}
          <Card className={`border ${chronoConfig?.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${chronoConfig?.color}`}>
                  {chronoConfig?.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{chronoConfig?.label}</h3>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(profile.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {chronoConfig?.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Peak: {chronoConfig?.peak}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Current Status ({currentHour}:00)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Current Energy */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Energy Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={profile.energyPattern.find(e => e.hour === currentHour)?.level || 50} 
                      className="h-2 flex-1" 
                    />
                    <span className="text-sm">
                      {Math.round(profile.energyPattern.find(e => e.hour === currentHour)?.level || 50)}%
                    </span>
                  </div>
                </div>

                {/* Compliance Score */}
                <div className={`p-3 rounded-lg ${
                  vulnerabilityCheck?.isVulnerable 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={`h-4 w-4 ${
                      vulnerabilityCheck?.isVulnerable ? 'text-green-400' : 'text-muted-foreground'
                    }`} />
                    <span className="text-sm font-medium">Susceptibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(vulnerabilityCheck?.score || 0) * 100} 
                      className="h-2 flex-1" 
                    />
                    <span className="text-sm">
                      {Math.round((vulnerabilityCheck?.score || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Windows */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Optimal Influence Windows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {profile.complianceWindows
                    .sort((a, b) => b.susceptibilityScore - a.susceptibilityScore)
                    .map((window, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border ${
                          window.susceptibilityScore > 0.7 
                            ? 'bg-green-500/10 border-green-500/20' 
                            : 'bg-muted/50 border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {window.startHour}:00 - {window.endHour}:00
                            </span>
                          </div>
                          <Badge variant={window.susceptibilityScore > 0.7 ? 'default' : 'outline'}>
                            {Math.round(window.susceptibilityScore * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{window.reason}</p>
                        <p className="text-xs">
                          <span className="text-primary">Approach: </span>
                          {window.optimalApproach}
                        </p>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Optimal Contact Times */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Purpose-Based Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.optimalContactTimes.map((timing, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{timing.purpose}</span>
                      <Badge variant="outline" className="text-green-400">
                        {timing.bestTime}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{timing.reasoning}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-blue-400">Alt: {timing.alternativeTime}</span>
                      <span className="text-red-400">Avoid: {timing.avoidTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sleep Pattern */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-400" />
                Sleep Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile.sleepPattern.typicalBedtime}</p>
                  <p className="text-xs text-muted-foreground">Bedtime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile.sleepPattern.typicalWakeTime}</p>
                  <p className="text-xs text-muted-foreground">Wake Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(profile.sleepPattern.sleepQuality * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
