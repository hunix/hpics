import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  FileText,
  Loader2,
  Brain,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Crosshair,
  Network,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelligenceDossierPanelProps {
  profileId: string;
  profileName?: string;
  className?: string;
}

interface Dossier {
  id: string;
  profile_name: string;
  dossier_type: string;
  generated_at: string;
  sections: Record<string, any>;
  key_findings: Array<{ finding: string; importance: string; evidence: string }>;
  risk_assessment: { overall_risk: string; risks: Array<{ risk: string; likelihood: string; impact: string }> } | null;
  actionable_intelligence: {
    approach_tactics: Array<any>;
    leverage_points: Array<any>;
    vulnerability_windows: Array<any>;
    influence_map: any;
  } | null;
  data_completeness: number;
}

export function IntelligenceDossierPanel({ profileId, profileName, className }: IntelligenceDossierPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive_summary']));

  // Fetch existing dossier
  const { data: existingDossier, isLoading: isLoadingDossier } = useQuery({
    queryKey: ['intelligence-dossier', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('result, generated_at')
        .eq('profile_id', profileId)
        .eq('user_id', user!.id)
        .eq('analysis_type', 'intelligence_dossier')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.result as unknown as Dossier | null;
    },
    enabled: !!user && !!profileId,
  });

  // Generate dossier mutation
  const generateDossier = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-intelligence-dossier`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId,
            dossierType: 'full_actionable',
            includeMediaIntelligence: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Dossier generation failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-dossier', profileId] });
      toast.success('Intelligence dossier generated');
    },
    onError: (error) => {
      toast.error('Failed to generate dossier', { description: error.message });
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const sectionIcons: Record<string, React.ElementType> = {
    executive_summary: Eye,
    media_intelligence: Brain,
    psychological_profile: Target,
    behavioral_patterns: Network,
    network_analysis: Users,
    predictions: Crosshair,
    preferences: Sparkles,
    alerts: AlertTriangle,
    geographic: MapPin,
    milestones: Clock,
  };

  const dossier = existingDossier;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Intelligence Dossier
            </CardTitle>
            <CardDescription>
              {dossier 
                ? `Last generated: ${new Date(dossier.generated_at).toLocaleDateString()}`
                : `Generate full dossier for ${profileName}`}
            </CardDescription>
          </div>
          <Button
            onClick={() => generateDossier.mutate()}
            disabled={generateDossier.isPending}
          >
            {generateDossier.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {dossier ? 'Regenerate' : 'Generate'} Dossier
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingDossier ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !dossier ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No dossier generated yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate a comprehensive intelligence dossier with actionable tactics, leverage points, and vulnerability windows.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="tactics">Tactics</TabsTrigger>
              <TabsTrigger value="leverage">Leverage</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Risk Assessment */}
              {dossier.risk_assessment && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Risk Assessment</span>
                    </div>
                    <Badge className={cn(getRiskColor(dossier.risk_assessment.overall_risk))}>
                      {dossier.risk_assessment.overall_risk?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {dossier.risk_assessment.risks?.slice(0, 3).map((risk, i) => (
                      <div key={i} className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">{risk.risk}</span>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Likelihood: {risk.likelihood}</span>
                          <span>Impact: {risk.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {dossier.key_findings?.length > 0 && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Key Findings</span>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {dossier.key_findings.map((finding, i) => (
                        <div key={i} className="text-sm p-2 bg-muted rounded">
                          <div className="flex items-start justify-between gap-2">
                            <span>{finding.finding}</span>
                            <Badge variant={finding.importance === 'high' ? 'destructive' : 'secondary'} className="shrink-0">
                              {finding.importance}
                            </Badge>
                          </div>
                          {finding.evidence && (
                            <p className="text-xs text-muted-foreground mt-1">{finding.evidence}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Data Completeness */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Completeness</span>
                  <span className="text-sm font-bold">{Math.round(dossier.data_completeness)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${dossier.data_completeness}%` }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {Object.entries(dossier.sections || {}).map(([key, section]) => {
                    const Icon = sectionIcons[key] || FileText;
                    const isExpanded = expandedSections.has(key);
                    return (
                      <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
                        <CollapsibleTrigger className="w-full p-3 rounded-lg border hover:bg-muted transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium capitalize">{section.title || key.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {section.confidence || 0}% conf
                              </Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-3 border-x border-b rounded-b-lg">
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(section.content, null, 2)}
                          </pre>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Sources: {section.sources?.join(', ')}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tactics Tab */}
            <TabsContent value="tactics" className="mt-4">
              <ScrollArea className="h-[400px]">
                {dossier.actionable_intelligence?.approach_tactics?.length ? (
                  <div className="space-y-4">
                    {dossier.actionable_intelligence.approach_tactics.map((tactic, i) => (
                      <div key={i} className="p-4 rounded-lg border">
                        <div className="font-medium mb-2">{tactic.scenario}</div>
                        <p className="text-sm text-muted-foreground mb-3">{tactic.recommended_approach}</p>
                        
                        {tactic.talking_points?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-green-600">Talking Points:</span>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {tactic.talking_points.map((point: string, j: number) => (
                                <li key={j}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {tactic.avoid?.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-red-600">Avoid:</span>
                            <ul className="list-disc list-inside text-sm mt-1">
                              {tactic.avoid.map((item: string, j: number) => (
                                <li key={j}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {tactic.timing_recommendation && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {tactic.timing_recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    No tactical recommendations available
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Leverage Tab */}
            <TabsContent value="tactics" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Leverage Points */}
                  {(dossier.actionable_intelligence?.leverage_points?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Leverage Points
                      </h4>
                      <div className="space-y-2">
                        {dossier.actionable_intelligence!.leverage_points!.map((lp, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{lp.type}</Badge>
                              <Badge className={cn(getRiskColor(lp.risk_level))}>
                                {lp.risk_level} risk
                              </Badge>
                            </div>
                            <p className="text-sm">{lp.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Trigger: {lp.activation_trigger}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vulnerability Windows */}
                  {(dossier.actionable_intelligence?.vulnerability_windows?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Crosshair className="h-4 w-4" />
                        Vulnerability Windows
                      </h4>
                      <div className="space-y-2">
                        {dossier.actionable_intelligence!.vulnerability_windows!.map((vw, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted">
                            <div className="font-medium text-sm">{vw.trigger}</div>
                            <p className="text-xs text-muted-foreground">{vw.predicted_timing}</p>
                            <p className="text-sm mt-1">{vw.recommended_action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Influence Map */}
                  {dossier.actionable_intelligence?.influence_map && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Influence Map
                      </h4>
                      <div className="p-3 rounded-lg bg-muted space-y-3">
                        <div>
                          <span className="text-xs font-medium text-green-600">Trust Builders:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dossier.actionable_intelligence.influence_map.trust_builders?.map((tb: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tb}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-red-600">Trust Breakers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dossier.actionable_intelligence.influence_map.trust_breakers?.map((tb: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">{tb}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Decision Style:</span>
                          <p className="text-sm">{dossier.actionable_intelligence.influence_map.decision_making_style}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
