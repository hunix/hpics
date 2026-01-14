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
  type InfluenceResistance
} from '@/lib/psychology/darkPsychologyEngine';

interface InfluencePlaybookPanelProps {
  profileId: string;
  profileName: string;
  behavioralData?: {
    communicationStyle?: string;
    decisionPatterns?: string[];
    socialBehavior?: string;
    emotionalResponses?: string[];
    riskTolerance?: number;
    competitiveness?: number;
    empathyIndicators?: number;
  };
}

export function InfluencePlaybookPanel({ 
  profileId, 
  profileName,
  behavioralData 
}: InfluencePlaybookPanelProps) {
  const analysis = useMemo(() => {
    if (!behavioralData) return null;

    const darkTriad = assessDarkTriad(behavioralData);
    const biases = assessBiasSusceptibility(behavioralData);
    const resistance = calculateInfluenceResistance(behavioralData);
    const playbook = generateExploitationPlaybook(darkTriad, biases);

    return { darkTriad, biases, resistance, playbook };
  }, [behavioralData]);

  if (!behavioralData || !analysis) {
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
              Behavioral data required to generate influence playbook for {profileName}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const overallVulnerability = 1 - analysis.resistance.overallScore;

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
            {INFLUENCE_PRINCIPLES.map(principle => {
              const resistance = analysis.resistance.principleScores[principle.key] || 0.5;
              const vulnerability = 1 - resistance;
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
                      variant={bias.susceptibility > 0.7 ? 'destructive' : 'outline'}
                      className="ml-2"
                    >
                      {(bias.susceptibility * 100).toFixed(0)}%
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
              {analysis.playbook.strategies.map((strategy, idx) => (
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
                    <p className="text-sm text-muted-foreground mb-3">
                      {strategy.description}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">APPROACH</p>
                        <p className="text-sm bg-muted/50 p-2 rounded mt-1">{strategy.approach}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">KEY TRIGGERS</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {strategy.triggers.map((trigger, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Recommended Approaches Summary */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Quick Reference - Best Approaches
          </h3>
          <div className="space-y-2">
            {analysis.resistance.recommendedApproaches.map((approach, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{approach}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Risk Profile */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overall Influence Profile</p>
                <p className="text-xs text-muted-foreground">
                  Based on Dark Triad assessment and bias susceptibility
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
