import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Eye, Shield, Target, AlertTriangle, 
  Lightbulb, Users, Zap, Activity, TrendingUp
} from 'lucide-react';
import { 
  assessDarkTriad, 
  detectManipulation, 
  assessBiasSusceptibility,
  generateExploitationPlaybook,
  calculateInfluenceResistance,
  INFLUENCE_PRINCIPLES,
  COGNITIVE_BIASES,
  type DarkTriadAssessment,
  type CognitiveBias,
  type ManipulationTechnique,
  type InfluenceResistance
} from '@/lib/psychology/darkPsychologyEngine';

interface DarkPsychologyDashboardProps {
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
  onAnalysisComplete?: (analysis: DarkPsychologyAnalysis) => void;
}

interface DarkPsychologyAnalysis {
  darkTriad: DarkTriadAssessment;
  manipulationIndicators: ManipulationTechnique[];
  biasSusceptibility: CognitiveBias[];
  influenceResistance: InfluenceResistance;
  exploitationPlaybook: ReturnType<typeof generateExploitationPlaybook>;
}

export function DarkPsychologyDashboard({ 
  profileId, 
  profileName,
  behavioralData,
  onAnalysisComplete 
}: DarkPsychologyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const analysis = useMemo(() => {
    if (!behavioralData) return null;
    
    const darkTriad = assessDarkTriad(behavioralData);
    const manipulationIndicators = detectManipulation([
      behavioralData.communicationStyle || '',
      ...(behavioralData.decisionPatterns || []),
      behavioralData.socialBehavior || ''
    ]);
    const biasSusceptibility = assessBiasSusceptibility(behavioralData);
    const influenceResistance = calculateInfluenceResistance(behavioralData);
    const exploitationPlaybook = generateExploitationPlaybook(darkTriad, biasSusceptibility);
    
    const result = {
      darkTriad,
      manipulationIndicators,
      biasSusceptibility,
      influenceResistance,
      exploitationPlaybook
    };
    
    onAnalysisComplete?.(result);
    return result;
  }, [behavioralData, onAnalysisComplete]);

  const getTraitColor = (score: number) => {
    if (score >= 0.7) return 'text-red-500';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-green-500';
  };

  const getTraitBadge = (score: number) => {
    if (score >= 0.7) return 'destructive';
    if (score >= 0.4) return 'secondary';
    return 'outline';
  };

  if (!behavioralData || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Dark Psychology Analysis
          </CardTitle>
          <CardDescription>
            Behavioral data required for psychological profiling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No behavioral data available for {profileName}. Conduct interviews or analyze communications to gather data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Dark Psychology Analysis
            </CardTitle>
            <CardDescription>
              Deep psychological profiling for {profileName}
            </CardDescription>
          </div>
          <Badge variant={analysis.darkTriad.overallRisk === 'high' ? 'destructive' : 'secondary'}>
            {analysis.darkTriad.overallRisk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="darktriad">Dark Triad</TabsTrigger>
            <TabsTrigger value="biases">Biases</TabsTrigger>
            <TabsTrigger value="influence">Influence</TabsTrigger>
            <TabsTrigger value="playbook">Playbook</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Dark Triad Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Narcissism</p>
                  <p className={`text-2xl font-bold ${getTraitColor(analysis.darkTriad.narcissism.score)}`}>
                    {(analysis.darkTriad.narcissism.score * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Machiavellianism</p>
                  <p className={`text-2xl font-bold ${getTraitColor(analysis.darkTriad.machiavellianism.score)}`}>
                    {(analysis.darkTriad.machiavellianism.score * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-muted-foreground">Psychopathy</p>
                  <p className={`text-2xl font-bold ${getTraitColor(analysis.darkTriad.psychopathy.score)}`}>
                    {(analysis.darkTriad.psychopathy.score * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Influence Resistance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Influence Resistance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress 
                    value={analysis.influenceResistance.overallScore * 100} 
                    className="flex-1"
                  />
                  <span className="font-bold text-lg">
                    {(analysis.influenceResistance.overallScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(analysis.influenceResistance.principleScores).slice(0, 6).map(([principle, score]) => (
                    <div key={principle} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground capitalize">{principle}</span>
                      <span className="font-mono">{(score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Vulnerabilities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Top Cognitive Vulnerabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.biasSusceptibility.slice(0, 3).map((bias, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium">{bias.name}</p>
                        <p className="text-xs text-muted-foreground">{bias.description}</p>
                      </div>
                      <Badge variant={getTraitBadge(bias.susceptibility)}>
                        {(bias.susceptibility * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="darktriad" className="space-y-4 mt-4">
            {/* Detailed Dark Triad Analysis */}
            {(['narcissism', 'machiavellianism', 'psychopathy'] as const).map(trait => {
              const data = analysis.darkTriad[trait];
              return (
                <Card key={trait}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{trait}</CardTitle>
                      <Badge variant={getTraitBadge(data.score)}>
                        {(data.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={data.score * 100} className="mb-3" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Indicators:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.indicators.map((indicator, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm font-medium mt-3">Behavioral Patterns:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {data.behavioralPatterns.map((pattern, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="biases" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {analysis.biasSusceptibility.map((bias, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <p className="font-medium">{bias.name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{bias.description}</p>
                          <p className="text-sm mt-2">
                            <span className="font-medium">Exploitation:</span>{' '}
                            <span className="text-muted-foreground">{bias.exploitationMethod}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getTraitBadge(bias.susceptibility)}>
                            {(bias.susceptibility * 100).toFixed(0)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">susceptibility</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="influence" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cialdini's Influence Principles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {INFLUENCE_PRINCIPLES.map(principle => {
                      const score = analysis.influenceResistance.principleScores[principle.key] || 0.5;
                      const vulnerability = 1 - score;
                      return (
                        <div key={principle.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{principle.name}</span>
                              <p className="text-xs text-muted-foreground">{principle.description}</p>
                            </div>
                            <Badge variant={vulnerability > 0.6 ? 'destructive' : vulnerability > 0.3 ? 'secondary' : 'outline'}>
                              {(vulnerability * 100).toFixed(0)}% vulnerable
                            </Badge>
                          </div>
                          <Progress value={vulnerability * 100} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recommended Influence Approaches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.influenceResistance.recommendedApproaches.map((approach, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{approach}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="playbook" className="mt-4">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This playbook is for educational and defensive purposes. Understanding these techniques helps protect against manipulation.
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[350px]">
              <div className="space-y-4">
                {analysis.exploitationPlaybook.strategies.map((strategy, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{strategy.name}</CardTitle>
                        <Badge variant="outline">
                          {(strategy.effectiveness * 100).toFixed(0)}% effective
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Approach:</p>
                        <p className="text-sm bg-muted/30 p-2 rounded">{strategy.approach}</p>
                        <p className="text-sm font-medium">Triggers:</p>
                        <div className="flex flex-wrap gap-1">
                          {strategy.triggers.map((trigger, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
