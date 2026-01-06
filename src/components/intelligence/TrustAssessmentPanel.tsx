import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldQuestion,
  AlertTriangle, Eye, RefreshCw, CheckCircle, XCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustAssessmentPanelProps {
  profileId: string;
}

interface TrustAssessment {
  id: string;
  overall_trust_score: number | null;
  authenticity_score: number | null;
  consistency_score: number | null;
  deception_indicators: any[];
  inconsistencies: any[];
  verification_status: string | null;
  evidence_summary: string | null;
  ai_assessment: string | null;
  confidence_level: number | null;
  data_sources_analyzed: string[];
  last_assessment_at: string;
}

const verificationIcons: Record<string, { icon: any; color: string; label: string }> = {
  verified: { icon: ShieldCheck, color: 'text-green-600', label: 'Verified' },
  partially_verified: { icon: Shield, color: 'text-blue-600', label: 'Partially Verified' },
  unverified: { icon: ShieldQuestion, color: 'text-gray-500', label: 'Unverified' },
  suspicious: { icon: ShieldAlert, color: 'text-red-600', label: 'Suspicious' },
};

export function TrustAssessmentPanel({ profileId }: TrustAssessmentPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['trust-assessment', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_assessments')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as TrustAssessment | null;
    },
    enabled: !!user && !!profileId,
  });

  const assessMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('assess-trust', {
        body: { profile_id: profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-assessment', profileId] });
      toast.success('Trust assessment completed');
    },
    onError: (error) => {
      toast.error('Assessment failed: ' + error.message);
    },
  });

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 80) return 'High';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

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

  const verificationInfo = verificationIcons[assessment?.verification_status || 'unverified'];
  const VerificationIcon = verificationInfo.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Trust & Authenticity Assessment
            </CardTitle>
            <CardDescription>
              Counter-intelligence analysis and verification status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => assessMutation.mutate()}
            disabled={assessMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${assessMutation.isPending ? 'animate-spin' : ''}`} />
            {assessment ? 'Reassess' : 'Assess'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {assessment ? (
          <>
            {/* Verification Status */}
            <div className={`p-4 rounded-lg border ${
              assessment.verification_status === 'suspicious' ? 'border-red-500/50 bg-red-500/5' :
              assessment.verification_status === 'verified' ? 'border-green-500/50 bg-green-500/5' :
              'bg-muted/50'
            }`}>
              <div className="flex items-center gap-3">
                <VerificationIcon className={`h-8 w-8 ${verificationInfo.color}`} />
                <div>
                  <div className="font-semibold text-lg">{verificationInfo.label}</div>
                  <p className="text-sm text-muted-foreground">
                    {assessment.evidence_summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-3 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Trust Score</span>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {assessment.overall_trust_score?.toFixed(0) || 'N/A'}
                      </div>
                      <Progress 
                        value={assessment.overall_trust_score || 0} 
                        className="mt-2 h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {getScoreLabel(assessment.overall_trust_score)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Overall trust based on all available data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Authenticity</span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {assessment.authenticity_score?.toFixed(0) || 'N/A'}
                      </div>
                      <Progress 
                        value={assessment.authenticity_score || 0} 
                        className="mt-2 h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {getScoreLabel(assessment.authenticity_score)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How genuine their communications appear</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Consistency</span>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">
                        {assessment.consistency_score?.toFixed(0) || 'N/A'}
                      </div>
                      <Progress 
                        value={assessment.consistency_score || 0} 
                        className="mt-2 h-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {getScoreLabel(assessment.consistency_score)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How consistent their data is across sources</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Deception Indicators */}
            {assessment.deception_indicators && assessment.deception_indicators.length > 0 && (
              <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-600">Deception Indicators</span>
                </div>
                <div className="space-y-2">
                  {assessment.deception_indicators.map((indicator: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium">{indicator.type}</span>
                        <span className="text-muted-foreground"> - {indicator.description}</span>
                        {indicator.confidence && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {Math.round(indicator.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inconsistencies */}
            {assessment.inconsistencies && assessment.inconsistencies.length > 0 && (
              <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-600">Data Inconsistencies</span>
                </div>
                <div className="space-y-2">
                  {assessment.inconsistencies.map((inc: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium">{inc.type}</span>
                        <span className="text-muted-foreground"> - {inc.description}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {inc.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Assessment */}
            {assessment.ai_assessment && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">AI Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assessment.ai_assessment}
                </p>
              </div>
            )}

            {/* Data Sources */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>Data sources:</span>
              {assessment.data_sources_analyzed?.map((source: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
              <span className="ml-2">
                • Confidence: {assessment.confidence_level?.toFixed(0)}%
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trust assessment available</p>
            <p className="text-sm mb-4">Run an assessment to analyze this contact's trustworthiness</p>
            <Button onClick={() => assessMutation.mutate()} disabled={assessMutation.isPending}>
              Run Trust Assessment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
