import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Clock, Shield, AlertTriangle,
  CheckCircle, RefreshCw, Eye, ChevronDown, ChevronRight,
  Briefcase, Brain, Users, MapPin, Bell
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { invokeFunction } from '@/lib/api';

interface DossierGeneratorProps {
  profileId: string;
  profileName: string;
}

interface Dossier {
  id: string;
  dossier_type: string;
  title: string;
  classification: string;
  sections: Record<string, any>;
  summary: string;
  key_findings: any[];
  risk_assessment: any;
  recommendations: any[];
  generated_at: string;
}

const sectionIcons: Record<string, any> = {
  executive_summary: Briefcase,
  personal_information: Users,
  network: Users,
  professional: Briefcase,
  psychological: Brain,
  trust_assessment: Shield,
  communication_analysis: FileText,
  geographic: MapPin,
  alerts: Bell,
  key_findings: AlertTriangle,
  risk_assessment: Shield,
  recommendations: CheckCircle,
};

const classificationColors: Record<string, string> = {
  public: 'bg-green-500/10 text-green-600 border-green-500/50',
  internal: 'bg-blue-500/10 text-blue-600 border-blue-500/50',
  confidential: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/50',
  restricted: 'bg-red-500/10 text-red-600 border-red-500/50',
};

export function DossierGenerator({ profileId, profileName }: DossierGeneratorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dossierType, setDossierType] = useState('full');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive_summary']));

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Dossier[];
    },
    enabled: !!user && !!profileId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('generate-dossier', { profile_id: profileId, dossier_type: dossierType },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers', profileId] });
      toast.success('Dossier generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate dossier: ' + error.message);
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

  const latestDossier = dossiers?.[0];

  const renderSectionContent = (key: string, content: any) => {
    if (!content) return <p className="text-muted-foreground text-sm">No data available</p>;
    
    if (typeof content === 'string') {
      return <p className="text-sm">{content}</p>;
    }
    
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-1 text-sm">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    return (
      <div className="space-y-2 text-sm">
        {Object.entries(content).map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-2">
            <span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span>
            <span className="text-muted-foreground">
              {v === null || v === undefined ? 'N/A' : 
               typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Intelligence Dossier
            </CardTitle>
            <CardDescription>
              Comprehensive intelligence reports for {profileName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dossierType} onValueChange={setDossierType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Dossier</SelectItem>
                <SelectItem value="executive_brief">Executive Brief</SelectItem>
                <SelectItem value="threat_assessment">Threat Assessment</SelectItem>
                <SelectItem value="background_check">Background Check</SelectItem>
                <SelectItem value="relationship_summary">Relationship Summary</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              Generate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {latestDossier ? (
          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Latest Dossier</TabsTrigger>
              <TabsTrigger value="history">
                History ({dossiers?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div>
                    <h3 className="font-semibold">{latestDossier.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(latestDossier.generated_at), 'PPpp')}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={classificationColors[latestDossier.classification]}
                      >
                        {latestDossier.classification.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF
                  </Button>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg border">
                  <p className="text-sm">{latestDossier.summary}</p>
                </div>

                {/* Key Findings */}
                {latestDossier.key_findings && latestDossier.key_findings.length > 0 && (
                  <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">Key Findings</span>
                    </div>
                    <div className="space-y-2">
                      {latestDossier.key_findings.map((finding: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant={
                            finding.importance === 'high' ? 'destructive' : 
                            finding.importance === 'medium' ? 'default' : 'secondary'
                          } className="shrink-0">
                            {finding.importance}
                          </Badge>
                          <div>
                            <span className="font-medium">{finding.finding}</span>
                            {finding.evidence && (
                              <p className="text-muted-foreground text-xs mt-0.5">
                                Evidence: {finding.evidence}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {latestDossier.risk_assessment && (
                  <div className={`p-4 rounded-lg border ${
                    latestDossier.risk_assessment.overall_risk === 'critical' ? 'border-red-500/50 bg-red-500/5' :
                    latestDossier.risk_assessment.overall_risk === 'high' ? 'border-orange-500/50 bg-orange-500/5' :
                    latestDossier.risk_assessment.overall_risk === 'medium' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-green-500/50 bg-green-500/5'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold">Risk Assessment</span>
                      <Badge variant={
                        latestDossier.risk_assessment.overall_risk === 'critical' ? 'destructive' :
                        latestDossier.risk_assessment.overall_risk === 'high' ? 'default' : 'secondary'
                      }>
                        {latestDossier.risk_assessment.overall_risk?.toUpperCase()} RISK
                      </Badge>
                    </div>
                    {latestDossier.risk_assessment.specific_risks?.map((risk: any, i: number) => (
                      <div key={i} className="text-sm mb-1">
                        <span className="font-medium">{risk.risk}</span>
                        <span className="text-muted-foreground"> - Likelihood: {risk.likelihood}, Impact: {risk.impact}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {latestDossier.recommendations && latestDossier.recommendations.length > 0 && (
                  <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Strategic Recommendations</span>
                    </div>
                    <div className="space-y-2">
                      {latestDossier.recommendations.map((rec: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="shrink-0">
                            {rec.priority}
                          </Badge>
                          <div>
                            <span className="font-medium">{rec.action}</span>
                            {rec.rationale && (
                              <p className="text-muted-foreground text-xs mt-0.5">
                                {rec.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible Sections */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {Object.entries(latestDossier.sections).map(([key, content]) => {
                      if (['key_findings', 'risk_assessment', 'recommendations'].includes(key)) return null;
                      const Icon = sectionIcons[key] || FileText;
                      const isExpanded = expandedSections.has(key);
                      
                      return (
                        <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start p-4 h-auto">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2" />
                              )}
                              <Icon className="h-4 w-4 mr-2" />
                              <span className="capitalize font-medium">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="p-4 rounded-lg border bg-muted/30">
                              {renderSectionContent(key, content)}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {dossiers?.map(dossier => (
                    <div
                      key={dossier.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{dossier.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{dossier.dossier_type}</Badge>
                            <Badge 
                              variant="outline" 
                              className={classificationColors[dossier.classification]}
                            >
                              {dossier.classification}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(dossier.generated_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No dossiers generated yet</p>
            <p className="text-sm mb-4">Generate a comprehensive intelligence report</p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              Generate First Dossier
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
