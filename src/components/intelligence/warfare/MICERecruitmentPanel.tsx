import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, Heart, Shield, Star, AlertTriangle, Play } from 'lucide-react';
import { useMICEAnalysis } from '@/hooks/intelligence/useMICEAnalysis';

interface MICERecruitmentPanelProps {
  profileId?: string;
}

export function MICERecruitmentPanel({ profileId }: MICERecruitmentPanelProps) {
  const { 
    assessment,
    allAssessments,
    topVulnerableProfiles,
    isLoading,
    analyze,
    isAnalyzing,
    calculateVulnerability,
    getOptimalApproach
  } = useMICEAnalysis(profileId);

  const miceFactors = [
    { key: 'money', label: 'Money', icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { key: 'ideology', label: 'Ideology', icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
    { key: 'compromise', label: 'Compromise', icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { key: 'ego', label: 'Ego', icon: Star, color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
  ];

  const getVulnerabilityLevel = (score: number) => {
    if (score >= 0.7) return { label: 'Critical', color: 'bg-red-500/20 text-red-400' };
    if (score >= 0.5) return { label: 'High', color: 'bg-amber-500/20 text-amber-400' };
    if (score >= 0.3) return { label: 'Moderate', color: 'bg-blue-500/20 text-blue-400' };
    return { label: 'Low', color: 'bg-emerald-500/20 text-emerald-400' };
  };

  return (
    <Card className="border-amber-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            <CardTitle>MICE Recruitment Analyzer</CardTitle>
          </div>
          {profileId && (
            <Button 
              size="sm" 
              onClick={() => analyze(profileId)}
              disabled={isAnalyzing}
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          )}
        </div>
        <CardDescription>
          Money • Ideology • Compromise • Ego vulnerability assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Target</TabsTrigger>
            <TabsTrigger value="all">All Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading assessment...</div>
            ) : !assessment ? (
              <div className="text-center py-8 text-muted-foreground">
                {profileId ? 'No assessment yet. Run analysis to begin.' : 'Select a profile to analyze.'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {miceFactors.map((factor) => {
                    const score = (assessment as Record<string, unknown>)[`${factor.key}_score`] as number || 0;
                    return (
                      <Card key={factor.key} className="bg-background/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${factor.bgColor}`}>
                              <factor.icon className={`h-4 w-4 ${factor.color}`} />
                            </div>
                            <span className="font-medium">{factor.label}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Vulnerability</span>
                              <span className="font-medium">{Math.round(score * 100)}%</span>
                            </div>
                            <Progress value={score * 100} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {assessment.money_vulnerability !== null && (
                  <Card className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Composite Vulnerability</h4>
                        <Badge className={getVulnerabilityLevel(assessment.money_vulnerability || 0).color}>
                          {getVulnerabilityLevel(assessment.money_vulnerability || 0).label}
                        </Badge>
                      </div>
                      <Progress value={(assessment.money_vulnerability || 0) * 100} className="h-3" />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allAssessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assessments yet. Analyze profiles to build your database.
              </div>
            ) : (
              <div className="space-y-3">
                {topVulnerableProfiles.map((a) => (
                  <Card key={a.id} className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Profile</h4>
                          <p className="text-xs text-muted-foreground">
                            Money: {Math.round((a.money_vulnerability || 0) * 100)}%
                          </p>
                        </div>
                        <Badge className={getVulnerabilityLevel(a.money_vulnerability || 0).color}>
                          {Math.round((a.money_vulnerability || 0) * 100)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
