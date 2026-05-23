import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, AlertTriangle, CheckCircle, Flag, Target, 
  Zap, RefreshCw, TrendingUp, Shield, Heart,
  Loader2, Info, AlertCircle, Sparkles, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PersonalityRadarChart } from './PersonalityRadarChart';
import { FlagsWarningsPanel } from './FlagsWarningsPanel';
import { ActionPlansPanel } from './ActionPlansPanel';
import { PredictionsPanel } from './PredictionsPanel';
import { RelationshipDynamicsPanel } from './RelationshipDynamicsPanel';
import type { PsychologicalProfile } from '@/lib/psychologicalAnalysis';
import { getConfidenceLabel, getConfidenceColor } from '@/lib/psychologicalAnalysis';
import { invokeFunction } from '@/lib/api';

interface DeepIntelligencePanelProps {
  profileId: string;
  profileName: string;
}

export function DeepIntelligencePanel({ profileId, profileName }: DeepIntelligencePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch existing psychological profile
  const { data: psychProfile, isLoading } = useQuery({
    queryKey: ['psychological-profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychological_profiles')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as PsychologicalProfile | null;
    },
    enabled: !!user && !!profileId,
  });

  // Run deep analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await invokeFunction('deep-psychological-analysis', { 
          profile_id: profileId,
          analysis_depth: 'comprehensive',
        },);

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['psychological-profile', profileId] });
      toast({
        title: 'Analysis Complete',
        description: `Psychological profile ${data.is_new ? 'created' : 'updated'} with ${data.profile?.data_completeness}% data coverage.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not complete psychological analysis',
        variant: 'destructive',
      });
    },
  });

  // Count flags
  const flagCounts = {
    red: (psychProfile?.flags as any)?.red_flags?.length || 0,
    yellow: (psychProfile?.flags as any)?.yellow_flags?.length || 0,
    green: (psychProfile?.flags as any)?.green_flags?.length || 0,
  };

  const totalFlags = flagCounts.red + flagCounts.yellow + flagCounts.green;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // No profile yet - show generate button
  if (!psychProfile) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Deep Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No Psychological Profile Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Generate a comprehensive psychological analysis using all available data about {profileName}.
          </p>
          <Button 
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Deep Analysis
              </>
            )}
          </Button>
          {analyzeMutation.isPending && (
            <p className="text-xs text-muted-foreground mt-3">
              This may take 30-60 seconds...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Deep Intelligence
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            title="Refresh Analysis"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/dossier-preview/${profileId}`)}
            title="View Full Dossier"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{psychProfile.confidence_score || 0}%</div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold">{psychProfile.data_completeness || 0}%</div>
            <div className="text-xs text-muted-foreground">Data Coverage</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold flex items-center justify-center gap-1">
              {flagCounts.red > 0 && <span className="text-destructive">{flagCounts.red}</span>}
              {flagCounts.yellow > 0 && <span className="text-yellow-500">{flagCounts.yellow}</span>}
              {flagCounts.green > 0 && <span className="text-green-500">{flagCounts.green}</span>}
              {totalFlags === 0 && <span>0</span>}
            </div>
            <div className="text-xs text-muted-foreground">Flags</div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 shrink-0">
          <TabsList className="grid grid-cols-5 w-full h-auto">
            <TabsTrigger value="dashboard" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Predict</span>
            </TabsTrigger>
            <TabsTrigger value="flags" className="text-xs py-1.5 flex flex-col items-center gap-0.5 relative">
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Flags</span>
              {flagCounts.red > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {flagCounts.red}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs py-1.5 flex flex-col items-center gap-0.5">
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <DashboardOverview profile={psychProfile} profileName={profileName} />
          </TabsContent>

          <TabsContent value="personality" className="mt-4 space-y-4">
            <PersonalityRadarChart profile={psychProfile} />
          </TabsContent>

          <TabsContent value="predictions" className="mt-4 space-y-4">
            <PredictionsPanel profile={psychProfile} />
          </TabsContent>

          <TabsContent value="flags" className="mt-4 space-y-4">
            <FlagsWarningsPanel profile={psychProfile} />
          </TabsContent>

          <TabsContent value="actions" className="mt-4 space-y-4">
            <ActionPlansPanel profile={psychProfile} profileName={profileName} />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Last updated */}
      <div className="px-4 pb-3 pt-2 border-t text-xs text-muted-foreground shrink-0">
        Last analyzed: {psychProfile.last_analysis_at 
          ? new Date(psychProfile.last_analysis_at).toLocaleDateString()
          : 'Never'}
      </div>
    </Card>
  );
}

// Dashboard Overview Component
function DashboardOverview({ profile, profileName }: { profile: PsychologicalProfile; profileName: string }) {
  const attachmentStyle = profile.attachment_style as any;
  const emotionalIntelligence = profile.emotional_intelligence as any;
  const relationshipDynamics = profile.relationship_dynamics as any;
  const psychiatricIndicators = profile.psychiatric_indicators as any;
  const deceptionAnalysis = profile.deception_analysis as any;

  return (
    <div className="space-y-4">
      {/* Attachment Style */}
      {attachmentStyle && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attachment Style</span>
            <Badge variant={
              attachmentStyle.primary_style === 'secure' ? 'default' :
              attachmentStyle.primary_style === 'anxious' ? 'secondary' :
              'outline'
            }>
              {attachmentStyle.primary_style}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Security</div>
              <Progress value={attachmentStyle.security_score || 0} className="h-1.5 mt-1" />
            </div>
            <div>
              <div className="text-muted-foreground">Anxiety</div>
              <Progress value={attachmentStyle.anxiety_score || 0} className="h-1.5 mt-1" />
            </div>
            <div>
              <div className="text-muted-foreground">Avoidance</div>
              <Progress value={attachmentStyle.avoidance_score || 0} className="h-1.5 mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* Emotional Intelligence */}
      {emotionalIntelligence && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Emotional Intelligence</span>
            <Badge>{emotionalIntelligence.overall_eq || 0}/100</Badge>
          </div>
          <div className="space-y-1.5">
            {['self_awareness', 'self_regulation', 'motivation', 'empathy', 'social_skills'].map((dim) => {
              const score = emotionalIntelligence[dim]?.score || 0;
              return (
                <div key={dim} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-muted-foreground capitalize">{dim.replace('_', ' ')}</span>
                  <Progress value={score} className="flex-1 h-1.5" />
                  <span className="w-8 text-right">{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authenticity & Trust */}
      {(deceptionAnalysis || relationshipDynamics) && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium block mb-2">Trust & Authenticity</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {deceptionAnalysis && (
              <>
                <div>
                  <div className="text-muted-foreground">Authenticity</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={deceptionAnalysis.authenticity_score || 0} className="flex-1 h-1.5" />
                    <span>{deceptionAnalysis.authenticity_score || 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Consistency</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={deceptionAnalysis.consistency_score || 0} className="flex-1 h-1.5" />
                    <span>{deceptionAnalysis.consistency_score || 0}%</span>
                  </div>
                </div>
              </>
            )}
            {relationshipDynamics?.trust_level && (
              <div className="col-span-2">
                <div className="text-muted-foreground">Trust Level</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={relationshipDynamics.trust_level.score || 0} className="flex-1 h-1.5" />
                  <Badge variant="outline" className="text-[10px]">
                    {relationshipDynamics.trust_level.trajectory}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mental Wellness Indicators */}
      {psychiatricIndicators && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Mental Wellness Indicators
            </span>
            <Badge variant={
              (psychiatricIndicators.overall_mental_wellness || 0) >= 70 ? 'default' :
              (psychiatricIndicators.overall_mental_wellness || 0) >= 40 ? 'secondary' :
              'destructive'
            }>
              {psychiatricIndicators.overall_mental_wellness || 0}/100
            </Badge>
          </div>
          <div className="space-y-1.5">
            {['anxiety_markers', 'depression_indicators', 'stress_vulnerability'].map((indicator) => {
              const data = psychiatricIndicators[indicator];
              if (!data) return null;
              return (
                <div key={indicator} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{indicator.replace('_', ' ')}</span>
                  <Badge 
                    variant={
                      data.indicator_level === 'none' || data.indicator_level === 'minimal' ? 'outline' :
                      data.indicator_level === 'mild' ? 'secondary' :
                      'destructive'
                    }
                    className="text-[10px]"
                  >
                    {data.indicator_level}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            These are behavioral patterns, not clinical diagnoses.
          </p>
        </div>
      )}

      {/* Relationship Compatibility */}
      {relationshipDynamics?.compatibility_analysis && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              Compatibility
            </span>
            <Badge>{relationshipDynamics.compatibility_analysis.overall_score || 0}%</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(relationshipDynamics.compatibility_analysis)
              .filter(([key]) => key !== 'overall_score')
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground capitalize flex-1">{key.replace('_', ' ')}</span>
                  <span className="font-medium">{value as number}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
