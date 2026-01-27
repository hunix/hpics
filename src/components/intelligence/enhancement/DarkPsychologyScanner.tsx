/**
 * Dark Psychology Scanner (v9.0)
 * 
 * Dark Tetrad profiling and coercive control detection dashboard.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Skull, 
  Crown, 
  Ghost, 
  Flame,
  AlertTriangle,
  Shield,
  Loader2,
  Eye,
  Target
} from 'lucide-react';
import { useDarkPsychology } from '@/hooks/intelligence/useDarkPsychology';

interface DarkPsychologyScannerProps {
  profileId?: string;
}

export function DarkPsychologyScanner({ profileId }: DarkPsychologyScannerProps) {
  const {
    tetradProfiles,
    coerciveControls,
    highRiskProfiles,
    activeCoerciveRisks,
    isLoading,
    analyzeDarkTetrad,
    detectCoerciveControl,
    isAnalyzingTetrad,
    isDetectingCoercion
  } = useDarkPsychology(profileId);

  const getTraitIcon = (trait: string) => {
    switch (trait) {
      case 'machiavellianism': return <Crown className="h-4 w-4" />;
      case 'narcissism': return <Eye className="h-4 w-4" />;
      case 'psychopathy': return <Ghost className="h-4 w-4" />;
      case 'sadism': return <Flame className="h-4 w-4" />;
      default: return <Skull className="h-4 w-4" />;
    }
  };

  const getTraitColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'severe': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'elevated': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'moderate': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  const latestProfile = tetradProfiles?.[0];

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Skull className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle>Dark Psychology Scanner</CardTitle>
              <CardDescription>Dark Tetrad profiling & coercive control detection</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              variant="outline"
              disabled={!profileId || isAnalyzingTetrad}
              onClick={() => profileId && analyzeDarkTetrad({ profileId })}
            >
              {isAnalyzingTetrad ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4 mr-1" />}
              Analyze
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Indicator */}
        {highRiskProfiles.length > 0 && (
          <div className="p-4 rounded-lg border border-red-500/30 bg-red-950/20">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{highRiskProfiles.length} High-Risk Profile(s) Detected</span>
            </div>
          </div>
        )}

        {/* Dark Tetrad Traits */}
        {latestProfile && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              Dark Tetrad Profile
              <Badge className={getRiskBadge(latestProfile.riskLevel)}>
                {latestProfile.riskLevel}
              </Badge>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'machiavellianism', label: 'Machiavellianism', score: latestProfile.machiavellianism },
                { key: 'narcissism', label: 'Narcissism', score: latestProfile.narcissism },
                { key: 'psychopathy', label: 'Psychopathy', score: latestProfile.psychopathy },
                { key: 'sadism', label: 'Sadism', score: latestProfile.sadism }
              ].map(trait => (
                <Card key={trait.key} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded bg-purple-500/20">
                        {getTraitIcon(trait.key)}
                      </div>
                      <span className="text-sm font-medium">{trait.label}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-2xl font-bold ${getTraitColor(trait.score)}`}>
                        {Math.round(trait.score)}
                      </span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                    <Progress value={trait.score} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Darkness Score</span>
                <span className={`text-xl font-bold ${getTraitColor(latestProfile.overallDarknessScore)}`}>
                  {Math.round(latestProfile.overallDarknessScore)}%
                </span>
              </div>
              <Progress value={latestProfile.overallDarknessScore} className="h-2 mt-2" />
            </div>
          </div>
        )}

        {/* Coercive Control Risks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Coercive Control Detection</h3>
            <Button 
              size="sm"
              variant="ghost"
              disabled={!profileId || isDetectingCoercion}
              onClick={() => profileId && detectCoerciveControl({ profileId })}
            >
              {isDetectingCoercion ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan'}
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {coerciveControls?.map(control => (
                <div 
                  key={control.id}
                  className="p-3 rounded-lg border border-border/50 bg-card/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{control.phase} Phase</p>
                      <p className="text-xs text-muted-foreground">
                        {control.tactics.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${control.escalationRisk > 0.6 ? 'text-red-500' : 'text-yellow-500'}`}>
                        {Math.round(control.escalationRisk * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Escalation Risk</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!coerciveControls || coerciveControls.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Shield className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No coercive patterns detected</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
