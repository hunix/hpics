import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Printer, Share2, 
  Brain, Shield, Target, AlertTriangle, Heart,
  TrendingUp, TrendingDown, Network, Sparkles,
  Calendar, Clock, User, CheckCircle, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DesktopIntelligenceReportProps {
  profileId: string;
  profileName: string;
  className?: string;
}

export function DesktopIntelligenceReport({
  profileId,
  profileName,
  className,
}: DesktopIntelligenceReportProps) {
  // Fetch comprehensive intelligence data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['desktop-intelligence-report', profileId],
    queryFn: async () => {
      const [
        profile,
        psychProfile,
        trustData,
        influenceProfile,
        preferences,
        relationshipScore,
        predictions,
        scanSession,
        observations,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single(),
        supabase
          .from('ai_analyses')
          .select('result, generated_at')
          .eq('profile_id', profileId)
          .eq('analysis_type', 'psychological')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('trust_assessments')
          .select('*')
          .eq('profile_id', profileId)
          .order('assessed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('contact_influence_profiles')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle(),
        supabase
          .from('contact_predicted_preferences')
          .select('*')
          .eq('profile_id', profileId)
          .order('confidence_score', { ascending: false }),
        supabase
          .from('relationship_scores')
          .select('*')
          .eq('profile_id', profileId)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('behavioral_predictions')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('comprehensive_scan_sessions')
          .select('*')
          .eq('profile_id', profileId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ai_analyses')
          .select('result, generated_at')
          .eq('profile_id', profileId)
          .eq('analysis_type', 'behavioral')
          .order('generated_at', { ascending: false })
          .limit(5),
      ]);

      return {
        profile: profile.data,
        psychological: psychProfile.data,
        trust: trustData.data,
        influence: influenceProfile.data,
        preferences: preferences.data || [],
        relationship: relationshipScore.data,
        predictions: predictions.data || [],
        lastScan: scanSession.data,
        behavioralAnalyses: observations.data || [],
      };
    },
    enabled: !!profileId,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    // Simple JSON export for now
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence-report-${profileName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const trustScore = reportData?.trust?.overall_trust_score || 0;
  const relationshipScore = reportData?.relationship?.overall_score || 0;
  const psychData = reportData?.psychological?.result as any;

  // Group preferences by category
  const preferencesByCategory = reportData?.preferences.reduce((acc: any, pref: any) => {
    if (!acc[pref.preference_category]) {
      acc[pref.preference_category] = [];
    }
    acc[pref.preference_category].push(pref);
    return acc;
  }, {}) || {};

  return (
    <div className={cn("space-y-6 print:space-y-4", className)}>
      {/* Header */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Intelligence Report
              </CardTitle>
              <CardDescription className="text-base">
                Comprehensive analysis for <strong>{profileName}</strong>
              </CardDescription>
              {reportData?.lastScan && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(reportData.lastScan.completed_at as string), 'PPP')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(reportData.lastScan.completed_at as string), 'p')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <div className="grid grid-cols-4 gap-4">
        <ScoreCard
          title="Trust Score"
          value={trustScore}
          icon={Shield}
        />
        <ScoreCard
          title="Relationship"
          value={relationshipScore}
          icon={Heart}
        />
        <ScoreCard
          title="Influence Index"
          value={calculateInfluenceIndex(reportData?.influence)}
          icon={Target}
        />
        <ScoreCard
          title="Predictions"
          value={reportData?.preferences?.length || 0}
          icon={Sparkles}
          suffix=" found"
          maxValue={null}
        />
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-3 gap-6 print:grid-cols-1">
        {/* Column 1: Personality & Trust */}
        <div className="space-y-6">
          {/* Psychological Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Psychological Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {psychData ? (
                <>
                  {psychData.personality_type && (
                    <Badge className="text-sm">{psychData.personality_type}</Badge>
                  )}
                  {psychData.key_traits && (
                    <div className="flex flex-wrap gap-1">
                      {psychData.key_traits.slice(0, 8).map((trait: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {psychData.summary && (
                    <p className="text-sm text-muted-foreground">{psychData.summary}</p>
                  )}
                  {psychData.communication_style && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Communication Style
                      </p>
                      <p className="text-sm">{psychData.communication_style}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No psychological analysis available. Run a complete scan to generate.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Trust Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Trust Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportData?.trust ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Trust</span>
                      <span className="font-mono font-bold">{trustScore}%</span>
                    </div>
                    <Progress value={trustScore} className="h-2" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <TrustMetric label="Authenticity" value={reportData.trust.authenticity_score} />
                    <TrustMetric label="Consistency" value={reportData.trust.consistency_score} />
                    <TrustMetric label="Confidence" value={reportData.trust.confidence_level} />
                    <TrustMetric label="Overall Trust" value={reportData.trust.overall_trust_score} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No trust assessment available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Influence & Preferences */}
        <div className="space-y-6">
          {/* Influence Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Influence Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData?.influence ? (
                <div className="space-y-3">
                  <InfluenceBar label="Authority" value={reportData.influence.authority_susceptibility} />
                  <InfluenceBar label="Social Proof" value={reportData.influence.social_proof_susceptibility} />
                  <InfluenceBar label="Liking" value={reportData.influence.liking_susceptibility} />
                  <InfluenceBar label="Scarcity" value={reportData.influence.scarcity_susceptibility} />
                  <InfluenceBar label="Commitment" value={reportData.influence.commitment_consistency_susceptibility} />
                  <InfluenceBar label="Reciprocity" value={reportData.influence.reciprocity_susceptibility} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No influence profile available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Top Predicted Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(reportData?.preferences?.length ?? 0) > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {reportData!.preferences!.slice(0, 10).map((pref: any) => (
                      <div
                        key={pref.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{pref.preference_key}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {pref.predicted_value}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs flex-shrink-0",
                            pref.confidence_score >= 0.8 && "text-green-500 border-green-500/30",
                            pref.confidence_score >= 0.6 && pref.confidence_score < 0.8 && "text-yellow-500 border-yellow-500/30",
                            pref.confidence_score < 0.6 && "text-orange-500 border-orange-500/30"
                          )}
                        >
                          {Math.round(pref.confidence_score * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No preferences predicted yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Relationship & Risks */}
        <div className="space-y-6">
          {/* Relationship Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Relationship Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData?.relationship ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold">{Math.round(relationshipScore * 100)}%</div>
                    <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
                    <Badge variant="secondary" className="mt-2">
                      Stable
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold">{Math.round((reportData.relationship.frequency_score || 0) * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Frequency</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold">{Math.round((reportData.relationship.sentiment_score || 0) * 100)}%</div>
                      <div className="text-xs text-muted-foreground">Sentiment</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No relationship data available</p>
              )}
            </CardContent>
          </Card>

          {/* Risks & Predictions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Risks & Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(reportData?.predictions?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {reportData!.predictions!.slice(0, 5).map((pred: any) => (
                    <div
                      key={pred.id}
                      className={cn(
                        "p-2 rounded-lg",
                        pred.confidence_score >= 0.7 ? "bg-destructive/10" : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {pred.prediction_type?.replace(/_/g, ' ')}
                        </span>
                        <Badge
                          variant={pred.confidence_score >= 0.7 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {Math.round((pred.confidence_score || 0) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  No significant risks detected
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Observations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Behavioral Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(reportData?.behavioralAnalyses?.length ?? 0) > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {reportData!.behavioralAnalyses!.slice(0, 5).map((analysis: any, idx: number) => (
                      <div key={idx} className="text-sm border-l-2 border-primary/30 pl-2">
                        <p className="line-clamp-2">{analysis.result?.summary || 'Behavioral analysis'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(analysis.generated_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No behavioral analyses recorded</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preferences by Category - Full Width */}
      {Object.keys(preferencesByCategory).length > 0 && (
        <Card className="print:break-before-page">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Complete Preference Analysis
            </CardTitle>
            <CardDescription>
              AI-predicted preferences organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 print:grid-cols-2">
              {Object.entries(preferencesByCategory).map(([category, prefs]: [string, any]) => (
                <div key={category}>
                  <h4 className="font-medium capitalize mb-2 text-sm">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {prefs.slice(0, 5).map((pref: any) => (
                      <div
                        key={pref.id}
                        className="text-sm p-2 bg-muted/30 rounded flex justify-between"
                      >
                        <span className="truncate flex-1">{pref.preference_key}</span>
                        <span className="text-muted-foreground ml-2">
                          {Math.round(pref.confidence_score * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  suffix = '%',
  maxValue = 100
}: { 
  title: string; 
  value: number; 
  icon: any;
  trend?: string;
  suffix?: string;
  maxValue?: number | null;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-primary" />
          {trend && (
            <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            </Badge>
          )}
        </div>
        <div className="text-3xl font-bold">{value}{suffix}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
        {maxValue && <Progress value={value} className="h-1.5 mt-2" />}
      </CardContent>
    </Card>
  );
}

function TrustMetric({ label, value }: { label: string; value?: number | null }) {
  return (
    <div>
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{value || 0}%</span>
      </div>
      <Progress value={value || 0} className="h-1 mt-1" />
    </div>
  );
}

function InfluenceBar({ label, value }: { label: string; value?: number | null }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{value || 0}%</span>
      </div>
      <Progress value={value || 0} className="h-2" />
    </div>
  );
}

function calculateInfluenceIndex(influence: any): number {
  if (!influence) return 0;
  const values = [
    influence.authority_susceptibility || 0,
    influence.social_proof_susceptibility || 0,
    influence.liking_susceptibility || 0,
    influence.scarcity_susceptibility || 0,
    influence.commitment_consistency_susceptibility || 0,
    influence.reciprocity_susceptibility || 0,
  ];
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
