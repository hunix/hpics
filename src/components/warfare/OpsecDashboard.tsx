import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Eye, Lock, Wifi, Smartphone, Globe, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

interface OpsecScore {
  overall: number;
  digitalHygiene: number;
  communicationSecurity: number;
  physicalSecurity: number;
  socialEngineeringResistance: number;
}

interface Vulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  description: string;
  remediation: string;
}

export function OpsecDashboard({ profileId }: { profileId?: string }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opsecScore, setOpsecScore] = useState<OpsecScore | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { toast } = useToast();

  const runOpsecAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeFunction('opsec-vulnerability-analyzer', { profileId });

      if (error) throw error;

      setOpsecScore(data.assessment.opsecScore);
      setVulnerabilities(data.assessment.vulnerabilities);
      setRecommendations(data.assessment.recommendations);

      toast({
        title: 'OPSEC Analysis Complete',
        description: `Overall score: ${Math.round(data.assessment.opsecScore.overall)}%`
      });
    } catch (error) {
      console.error('OPSEC analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not complete OPSEC analysis',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                OPSEC Vulnerability Assessment
              </CardTitle>
              <CardDescription>
                Analyze operational security posture and identify vulnerabilities
              </CardDescription>
            </div>
            <Button onClick={runOpsecAnalysis} disabled={isAnalyzing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {opsecScore ? (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="text-center py-6">
                  <div className={`text-6xl font-bold ${getScoreColor(opsecScore.overall)}`}>
                    {Math.round(opsecScore.overall)}
                  </div>
                  <div className="text-muted-foreground mt-2">Overall OPSEC Score</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard
                    icon={<Globe className="h-4 w-4" />}
                    label="Digital Hygiene"
                    score={opsecScore.digitalHygiene}
                  />
                  <ScoreCard
                    icon={<Lock className="h-4 w-4" />}
                    label="Comm Security"
                    score={opsecScore.communicationSecurity}
                  />
                  <ScoreCard
                    icon={<Smartphone className="h-4 w-4" />}
                    label="Physical Security"
                    score={opsecScore.physicalSecurity}
                  />
                  <ScoreCard
                    icon={<Eye className="h-4 w-4" />}
                    label="SE Resistance"
                    score={opsecScore.socialEngineeringResistance}
                  />
                </div>
              </TabsContent>

              <TabsContent value="vulnerabilities" className="space-y-3">
                {vulnerabilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vulnerabilities detected
                  </div>
                ) : (
                  vulnerabilities.map((vuln, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <div className="font-medium">{vuln.description}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {vuln.remediation}
                              </div>
                            </div>
                          </div>
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {idx + 1}
                      </div>
                      <div>{rec}</div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div>Run an analysis to assess your OPSEC posture</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const getProgressColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={score} className="flex-1" />
          <span className="font-medium">{Math.round(score)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
