import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Brain, Zap, Target, AlertTriangle, Play, Eye, Shield,
  Activity, Users, Dna, Clock, TrendingDown, Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CognitiveWarfarePanelProps {
  profileId?: string;
  profileName?: string;
}

interface CognitiveVulnerability {
  level: 'biological' | 'psychological' | 'social';
  domain: string;
  vulnerability: string;
  exploitability: number;
  currentState: string;
  optimalTiming?: string;
}

const COGNITIVE_LEVELS = [
  {
    level: 'biological',
    label: 'Biological Level',
    icon: Dna,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Arousal states, decision fatigue, ego depletion windows',
    domains: ['Sleep Deprivation', 'Stress Response', 'Cognitive Load', 'Circadian Rhythm']
  },
  {
    level: 'psychological',
    label: 'Psychological Level',
    icon: Brain,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    description: 'Attentional gating, framing attacks, cognitive biases',
    domains: ['Attention Control', 'Emotional Regulation', 'Memory Manipulation', 'Belief Systems']
  },
  {
    level: 'social',
    label: 'Social Level',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Identity narratives, epistemic chaos, group dynamics',
    domains: ['Identity Attachment', 'Social Networks', 'Authority Deference', 'Group Conformity']
  }
];

export function CognitiveWarfarePanel({ profileId, profileName }: CognitiveWarfarePanelProps) {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'biological' | 'psychological' | 'social'>('all');

  // Fetch cognitive warfare analysis
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['cognitive-warfare', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'cognitive_warfare')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.result as unknown as {
        vulnerabilities: CognitiveVulnerability[];
        overallSusceptibility: number;
        optimalAttackWindows: string[];
        defenseRecommendations: string[];
      } | null;
    },
    enabled: !!profileId,
  });

  // Run analysis
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cognitive-warfare-engine', {
        body: {
          profileId,
          operationType: 'full_analysis',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cognitive warfare analysis complete');
      queryClient.invalidateQueries({ queryKey: ['cognitive-warfare', profileId] });
    },
    onError: (error) => {
      toast.error('Analysis failed', { description: error instanceof Error ? error.message : 'Unknown error' });
    },
  });

  // Detect vulnerability windows
  const windowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('vulnerability-window-detector', {
        body: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.windows?.length > 0) {
        toast.success(`${data.windows.length} vulnerability windows detected`);
      } else {
        toast.info('No active vulnerability windows detected');
      }
    },
  });

  const getExploitabilityColor = (score: number) => {
    if (score >= 0.7) return 'text-red-400';
    if (score >= 0.4) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Card className="border-violet-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            <CardTitle>Cognitive Warfare Engine</CardTitle>
            <Badge variant="outline" className="text-violet-400 border-violet-400/50">NATO CogWar</Badge>
          </div>
          {profileId && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => windowMutation.mutate()}
                disabled={windowMutation.isPending}
              >
                <Clock className="h-4 w-4 mr-1" />
                Detect Windows
              </Button>
              <Button 
                size="sm"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
              >
                <Play className="h-4 w-4 mr-1" />
                {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          )}
        </div>
        <CardDescription>
          Three-Level Attack Framework: Biological → Psychological → Social
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="defense">Defense</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Three-Level Framework */}
            <div className="grid grid-cols-3 gap-3">
              {COGNITIVE_LEVELS.map((level) => {
                const LevelIcon = level.icon;
                const levelVulns = analysis?.vulnerabilities?.filter(v => v.level === level.level) || [];
                const avgExploitability = levelVulns.length > 0 
                  ? levelVulns.reduce((sum, v) => sum + v.exploitability, 0) / levelVulns.length 
                  : 0;
                
                return (
                  <Card 
                    key={level.level} 
                    className={`${level.bgColor} border-none cursor-pointer transition-all hover:scale-105`}
                    onClick={() => setSelectedLevel(level.level as any)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LevelIcon className={`h-5 w-5 ${level.color}`} />
                        <span className={`font-medium ${level.color}`}>{level.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{level.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Exploitability</span>
                          <span className={getExploitabilityColor(avgExploitability)}>
                            {Math.round(avgExploitability * 100)}%
                          </span>
                        </div>
                        <Progress value={avgExploitability * 100} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Overall Susceptibility */}
            {analysis && (
              <Card className="bg-background/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-amber-400" />
                      <span className="font-medium">Overall Cognitive Susceptibility</span>
                    </div>
                    <Badge className={
                      analysis.overallSusceptibility >= 0.7 ? 'bg-red-500/20 text-red-400' :
                      analysis.overallSusceptibility >= 0.4 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }>
                      {Math.round(analysis.overallSusceptibility * 100)}%
                    </Badge>
                  </div>
                  <Progress value={analysis.overallSusceptibility * 100} className="h-2" />
                </CardContent>
              </Card>
            )}

            {/* Optimal Attack Windows */}
            {analysis?.optimalAttackWindows && analysis.optimalAttackWindows.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400" />
                  Optimal Influence Windows
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.optimalAttackWindows.map((window, idx) => (
                    <Badge key={idx} className="bg-red-500/20 text-red-400">
                      {window}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!analysis && !isLoading && profileId && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No cognitive warfare analysis yet</p>
                <p className="text-xs mt-1">Run analysis to map cognitive vulnerabilities</p>
              </div>
            )}

            {!profileId && (
              <div className="text-center py-8 text-muted-foreground">
                Select a profile to begin cognitive warfare analysis
              </div>
            )}
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            {/* Level Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={selectedLevel === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedLevel('all')}
              >
                All Levels
              </Button>
              {COGNITIVE_LEVELS.map((level) => (
                <Button
                  key={level.level}
                  variant={selectedLevel === level.level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel(level.level as any)}
                  className={selectedLevel === level.level ? '' : level.color}
                >
                  {level.label}
                </Button>
              ))}
            </div>

            {/* Vulnerability List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(analysis?.vulnerabilities || [])
                .filter(v => selectedLevel === 'all' || v.level === selectedLevel)
                .map((vuln, idx) => {
                  const levelConfig = COGNITIVE_LEVELS.find(l => l.level === vuln.level)!;
                  return (
                    <Card key={idx} className="bg-background/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={levelConfig.bgColor + ' ' + levelConfig.color}>
                              {levelConfig.label}
                            </Badge>
                            <span className="font-medium text-sm">{vuln.domain}</span>
                          </div>
                          <span className={`text-sm font-bold ${getExploitabilityColor(vuln.exploitability)}`}>
                            {Math.round(vuln.exploitability * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{vuln.vulnerability}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Current: {vuln.currentState}</span>
                          {vuln.optimalTiming && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {vuln.optimalTiming}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {(!analysis?.vulnerabilities || analysis.vulnerabilities.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No vulnerabilities mapped yet. Run analysis to begin.
              </div>
            )}
          </TabsContent>

          <TabsContent value="defense" className="space-y-4">
            <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Defense Recommendations</span>
              </div>
              {analysis?.defenseRecommendations ? (
                <div className="space-y-2">
                  {analysis.defenseRecommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-400">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run analysis to generate personalized defense recommendations
                </p>
              )}
            </div>

            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-amber-400">Defensive Application:</strong> This analysis is designed 
                  to identify vulnerabilities for protective purposes and to build cognitive resilience.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
