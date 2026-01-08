import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX,
  AlertTriangle, RefreshCw, CheckCircle, XCircle, Fingerprint,
  Eye, Target, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ThreatAssessmentTabProps {
  profileId: string;
  contactName: string;
}

interface ThreatAssessment {
  id: string;
  assessment_type: string;
  threat_level: string;
  threat_score: number | null;
  identity_confidence: number | null;
  indicators: any[];
  contradictions: any[];
  recommendations: string[];
  evidence: any;
  created_at: string;
}

const threatLevelConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  low: { icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-500/10 border-green-500/30' },
  medium: { icon: Shield, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  high: { icon: ShieldAlert, color: 'text-orange-600', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  critical: { icon: ShieldX, color: 'text-red-600', bgColor: 'bg-red-500/10 border-red-500/30' },
};

export function ThreatAssessmentTab({ profileId, contactName }: ThreatAssessmentTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['threat-assessments', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threat_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ThreatAssessment[];
    },
    enabled: !!user && !!profileId,
  });

  const assessMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('assess-threat', {
        body: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['threat-assessments', profileId] });
      toast.success(`Threat assessment complete: ${data.threat_assessment.level} risk`);
    },
    onError: (error) => {
      toast.error('Threat assessment failed: ' + error.message);
    },
  });

  const latestAssessment = assessments?.[0];
  const config = threatLevelConfig[latestAssessment?.threat_level || 'low'] || threatLevelConfig.low;
  const ThreatIcon = config.icon;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
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
              <Shield className="h-5 w-5" />
              Counter-Intelligence Assessment
            </CardTitle>
            <CardDescription>
              Threat analysis and identity verification for {contactName}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => assessMutation.mutate()}
            disabled={assessMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${assessMutation.isPending ? 'animate-spin' : ''}`} />
            {latestAssessment ? 'Reassess' : 'Assess Threat'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestAssessment ? (
          <>
            {/* Threat Level Banner */}
            <div className={`p-4 rounded-lg border ${config.bgColor}`}>
              <div className="flex items-center gap-4">
                <ThreatIcon className={`h-10 w-10 ${config.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold capitalize ${config.color}`}>
                      {latestAssessment.threat_level} Threat Level
                    </span>
                    {latestAssessment.threat_score !== null && (
                      <Badge variant="outline">
                        Score: {Math.round(latestAssessment.threat_score * 100)}
                      </Badge>
                    )}
                  </div>
                  {latestAssessment.evidence?.summary && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {latestAssessment.evidence.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Confidence */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="h-5 w-5" />
                <span className="font-semibold">Identity Confidence</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress 
                  value={(latestAssessment.identity_confidence || 0) * 100} 
                  className="flex-1 h-3"
                />
                <span className="text-lg font-bold min-w-[60px] text-right">
                  {Math.round((latestAssessment.identity_confidence || 0) * 100)}%
                </span>
              </div>
              {latestAssessment.evidence?.identity_indicators && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {latestAssessment.evidence.identity_indicators.map((ind: any, i: number) => (
                    <Badge 
                      key={i} 
                      variant={ind.status === 'verified' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ind.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {ind.type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Key Concerns */}
            {latestAssessment.evidence?.key_concerns?.length > 0 && (
              <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-600">Key Concerns</span>
                </div>
                <ul className="space-y-2">
                  {latestAssessment.evidence.key_concerns.map((concern: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threat Indicators */}
            {latestAssessment.indicators?.length > 0 && (
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-600">Threat Indicators</span>
                </div>
                <div className="space-y-2">
                  {latestAssessment.indicators.map((ind: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium">{ind.type}</span>
                        <span className="text-muted-foreground"> - {ind.description}</span>
                        <Badge variant="outline" className="ml-2 text-xs capitalize">
                          {ind.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {latestAssessment.recommendations?.length > 0 && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-5 w-5" />
                  <span className="font-semibold">Recommendations</span>
                </div>
                <ul className="space-y-2">
                  {latestAssessment.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assessment History */}
            {assessments && assessments.length > 1 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Assessment History
                </h4>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {assessments.slice(1).map((assessment) => {
                      const histConfig = threatLevelConfig[assessment.threat_level] || threatLevelConfig.low;
                      const HistIcon = histConfig.icon;
                      return (
                        <div 
                          key={assessment.id}
                          className="flex items-center gap-3 p-2 rounded border text-sm"
                        >
                          <HistIcon className={`h-4 w-4 ${histConfig.color}`} />
                          <span className="capitalize">{assessment.threat_level}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round((assessment.identity_confidence || 0) * 100)}% ID
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(assessment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last assessed {formatDistanceToNow(new Date(latestAssessment.created_at), { addSuffix: true })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No threat assessment available</p>
            <p className="text-sm mb-4">
              Run an assessment to analyze identity confidence and potential threats
            </p>
            <Button 
              onClick={() => assessMutation.mutate()} 
              disabled={assessMutation.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Threat Assessment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
