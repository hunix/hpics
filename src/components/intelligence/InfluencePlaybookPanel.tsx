import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Target, Shield, Users, Lightbulb, 
  CheckCircle2, AlertTriangle, TrendingUp, Zap
} from 'lucide-react';
import {
  INFLUENCE_PRINCIPLES,
  calculateInfluenceResistance,
  generateExploitationPlaybook,
  assessDarkTriad,
  assessBiasSusceptibility,
  type InfluenceResistance,
  type CognitiveBias
} from '@/lib/psychology/darkPsychologyEngine';

interface InfluencePlaybookPanelProps {
  profileId: string;
  profileName: string;
  behavioralData?: {
    messages: Array<{ content: string; direction: 'sent' | 'received' }>;
    observations: Array<{ type: string; content: string }>;
    interactions: Array<{ outcome: string; pattern: string }>;
    personality?: {
      openness: number;
      conscientiousness: number;
      neuroticism: number;
      agreeableness: number;
      extraversion: number;
    };
    education?: string;
    criticalThinkingScore?: number;
  };
}

// Convert INFLUENCE_PRINCIPLES object to array for iteration
const influencePrinciplesArray = Object.entries(INFLUENCE_PRINCIPLES).map(([key, value]) => ({
  key,
  name: value.name,
  description: value.description,
  techniques: value.techniques,
  detection: value.detection
}));

export function InfluencePlaybookPanel({ 
  profileId, 
  profileName,
  behavioralData 
}: InfluencePlaybookPanelProps) {
  const analysis = useMemo(() => {
    if (!behavioralData || !behavioralData.personality) return null;

    const darkTriad = assessDarkTriad({
      messages: behavioralData.messages || [],
      observations: behavioralData.observations || [],
      interactions: behavioralData.interactions || []
    });
    
    const biasMap = assessBiasSusceptibility(
      behavioralData.personality,
      behavioralData.interactions.map(i => ({ decision: i.outcome, factors: [i.pattern] }))
    );
    const biases = Array.from(biasMap.values()).sort((a, b) => b.adjustedSusceptibility - a.adjustedSusceptibility);
    
    const resistance = calculateInfluenceResistance(
      behavioralData.personality,
      behavioralData.education || 'unknown',
      behavioralData.criticalThinkingScore || 50
    );
    
    const playbook = generateExploitationPlaybook(
      behavioralData.personality,
      darkTriad,
      biasMap
    );

    return { darkTriad, biases, resistance, playbook };
  }, [behavioralData]);

  if (!behavioralData || !behavioralData.personality || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Influence Playbook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Personality and behavioral data required to generate influence playbook for {profileName}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const overallVulnerability = 1 - (analysis.resistance.overall / 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Influence Playbook
            </CardTitle>
            <CardDescription>
              Strategic influence analysis for {profileName}
            </CardDescription>
          </div>
          <Badge variant={overallVulnerability > 0.6 ? 'destructive' : 'secondary'}>
            {(overallVulnerability * 100).toFixed(0)}% Influence Vulnerability
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ethical Disclaimer */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This analysis is for understanding influence dynamics and building defense awareness. 
            Use ethically and responsibly.
          </AlertDescription>
        </Alert>

        {/* Influence Principle Vulnerabilities */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cialdini's Principles - Vulnerability Map
          </h3>
          <div className="space-y-3">
            {influencePrinciplesArray.map(principle => {
              const resistanceScore = analysis.resistance.byPrinciple[principle.key] || 50;
              const vulnerability = 1 - (resistanceScore / 100);
              return (
                <div key={principle.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{principle.name}</span>
                        {vulnerability > 0.7 && (
                          <Badge variant="destructive" className="text-xs">HIGH</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{principle.description}</p>
                    </div>
                    <div className="w-32 flex items-center gap-2">
                      <Progress 
                        value={vulnerability * 100} 
                        className="h-2"
                      />
                      <span className="text-xs font-mono w-12 text-right">
                        {(vulnerability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Top Cognitive Biases to Leverage */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Cognitive Bias Vulnerabilities
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {analysis.biases.slice(0, 6).map((bias, idx) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{bias.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {bias.exploitationMethod}
                      </p>
                    </div>
                    <Badge 
                      variant={bias.adjustedSusceptibility > 70 ? 'destructive' : 'outline'}
                      className="ml-2"
                    >
                      {bias.adjustedSusceptibility.toFixed(0)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recommended Strategies */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recommended Influence Strategies
          </h3>
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {analysis.playbook.primaryStrategies.map((strategy, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="font-medium">{strategy.name}</span>
                      </div>
                      <Badge variant="outline">
                        {(strategy.effectiveness * 100).toFixed(0)}% effective
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {strategy.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Weak Points & Strengths Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Weak Points
            </h3>
            <div className="space-y-2">
              {analysis.resistance.weakPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-sm">
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Strength Points
            </h3>
            <div className="space-y-2">
              {analysis.resistance.strengthPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-sm">
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overall Risk Profile */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overall Influence Profile</p>
                <p className="text-xs text-muted-foreground">
                  Based on personality traits and bias susceptibility
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {(overallVulnerability * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">vulnerability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
