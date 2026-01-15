/**
 * Gottman Four Horsemen Visualization Panel
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBetrayalPrediction } from '@/hooks/intelligence/useBetrayalPrediction';
import { AlertTriangle, Shield, Swords, MessageSquareOff, Frown, TrendingUp, TrendingDown, Minus, RefreshCw, Heart } from 'lucide-react';

interface GottmanHorsemenPanelProps {
  profileId?: string;
}

const HORSEMEN = {
  criticism: { name: 'Criticism', icon: Swords, color: 'text-red-500', bgColor: 'bg-red-500/10', description: 'Attacking character rather than behavior', antidote: 'Use "I" statements, express needs positively', indicators: ['Generalizations', 'Character attacks', '"You always/never" statements'] },
  contempt: { name: 'Contempt', icon: Frown, color: 'text-purple-500', bgColor: 'bg-purple-500/10', description: 'Disgust and superiority signals', antidote: 'Build culture of appreciation', indicators: ['Eye-rolling', 'Mockery', 'Hostile humor'] },
  defensiveness: { name: 'Defensiveness', icon: Shield, color: 'text-orange-500', bgColor: 'bg-orange-500/10', description: 'Self-protection through victimhood', antidote: 'Take responsibility, accept perspective', indicators: ['Counter-complaints', 'Excuses', 'Yes-but statements'] },
  stonewalling: { name: 'Stonewalling', icon: MessageSquareOff, color: 'text-blue-500', bgColor: 'bg-blue-500/10', description: 'Emotional withdrawal and shutdown', antidote: 'Practice self-soothing, take breaks', indicators: ['Silent treatment', 'Disengagement'] },
};

export function GottmanHorsemenPanel({ profileId }: GottmanHorsemenPanelProps) {
  const { prediction, analyze, isAnalyzing } = useBetrayalPrediction(profileId);
  
  const gottmanScores = (prediction?.gottman_horsemen as Record<string, number>) || { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 };
  const getTrend = (score: number) => {
    if (score > 0.6) return { icon: TrendingUp, color: 'text-red-500', label: 'Increasing' };
    if (score < 0.3) return { icon: TrendingDown, color: 'text-green-500', label: 'Decreasing' };
    return { icon: Minus, color: 'text-muted-foreground', label: 'Stable' };
  };

  const totalScore = Object.values(gottmanScores).reduce((a, b) => a + b, 0);
  const getHealthLevel = (total: number) => {
    if (total < 1) return { label: 'Healthy', color: 'bg-green-500', textColor: 'text-green-500' };
    if (total < 2) return { label: 'Warning', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500' };
  };
  const healthLevel = getHealthLevel(totalScore);

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" /><CardTitle className="text-lg">Gottman Four Horsemen</CardTitle></div>
          <Button variant="outline" size="sm" onClick={() => profileId && analyze(profileId)} disabled={isAnalyzing || !profileId}><RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />Analyze</Button>
        </div>
        <CardDescription>Relationship deterioration predictors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${healthLevel.color}`} /><span className="font-medium">Health:</span><Badge variant="outline" className={healthLevel.textColor}>{healthLevel.label}</Badge></div>
          <span className="text-sm text-muted-foreground">Score: {totalScore.toFixed(2)} / 4.00</span>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="antidotes">Antidotes</TabsTrigger></TabsList>
          <TabsContent value="overview" className="space-y-3 mt-4">
            {Object.entries(HORSEMEN).map(([key, horseman]) => {
              const score = gottmanScores[key] || 0;
              const trend = getTrend(score);
              const TrendIcon = trend.icon;
              const HorsemanIcon = horseman.icon;
              return (
                <div key={key} className={`p-3 rounded-lg ${horseman.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><HorsemanIcon className={`h-4 w-4 ${horseman.color}`} /><span className="font-medium">{horseman.name}</span></div>
                    <div className="flex items-center gap-2"><TrendIcon className={`h-4 w-4 ${trend.color}`} /><span className={`text-sm ${trend.color}`}>{trend.label}</span></div>
                  </div>
                  <Progress value={score * 100} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{horseman.description}</span><span>{(score * 100).toFixed(0)}%</span></div>
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="antidotes" className="space-y-3 mt-4">
            {Object.entries(HORSEMEN).map(([key, horseman]) => {
              const score = gottmanScores[key] || 0;
              const HorsemanIcon = horseman.icon;
              return (
                <div key={key} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2"><HorsemanIcon className={`h-4 w-4 ${horseman.color}`} /><span className="font-medium">{horseman.name}</span>{score > 0.5 && <Badge variant="destructive" className="ml-auto"><AlertTriangle className="h-3 w-3 mr-1" />Action Needed</Badge>}</div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-2"><strong>Antidote:</strong> {horseman.antidote}</p>
                  <div className="flex flex-wrap gap-1">{horseman.indicators.map((ind, idx) => <Badge key={idx} variant="outline" className="text-xs">{ind}</Badge>)}</div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {prediction && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Betrayal Risk:</span><Badge variant={prediction.defection_probability > 0.5 ? 'destructive' : 'secondary'}>{((prediction.defection_probability || 0) * 100).toFixed(0)}%</Badge></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
