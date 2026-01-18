import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  Image, 
  Mic, 
  FileText, 
  Shield, 
  Activity,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedIntelligencePanelProps {
  profileId: string;
  profileName?: string;
}

interface IntelligenceSource {
  type: string;
  count: number;
  latestAt: string | null;
  hasData: boolean;
}

export function UnifiedIntelligencePanel({ profileId, profileName }: UnifiedIntelligencePanelProps) {
  // Fetch all intelligence sources
  const { data: intelligenceSummary, isLoading } = useQuery({
    queryKey: ['unified-intelligence', profileId],
    queryFn: async () => {
      const [
        mediaAnalysesRes,
        voiceInsightsRes,
        aiAnalyses,
        behavioralAnalyses,
        psychProfile,
      ] = await Promise.all([
        supabase.from('media_analyses').select('id, created_at').eq('profile_id', profileId),
        supabase.from('voice_insights').select('id, created_at, source_type').eq('profile_id', profileId),
        supabase.from('ai_analyses').select('id, generated_at, analysis_type, result').eq('profile_id', profileId),
        supabase.from('behavioral_analyses').select('id, created_at').eq('profile_id', profileId),
        supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).single(),
      ]);

      // Get dossier if exists
      const dossier = aiAnalyses.data?.find(a => a.analysis_type === 'intelligence_dossier');
      const trustAssessment = aiAnalyses.data?.find(a => a.analysis_type === 'trust_assessment');
      const voiceAggregate = aiAnalyses.data?.find(a => a.analysis_type === 'voice_intelligence_aggregate');
      const mediaAggregate = aiAnalyses.data?.find(a => a.analysis_type === 'aggregated_media_intelligence');

      return {
        sources: {
          media: {
            count: mediaAnalysesRes.data?.length || 0,
            latestAt: (mediaAnalysesRes.data as any)?.[0]?.created_at || null,
            hasAggregate: !!mediaAggregate,
          },
          voice: {
            count: voiceInsightsRes.data?.length || 0,
            latestAt: (voiceInsightsRes.data as any)?.[0]?.created_at || null,
            hasAggregate: !!voiceAggregate,
          },
          behavioral: {
            count: behavioralAnalyses.data?.length || 0,
            latestAt: (behavioralAnalyses.data as any)?.[0]?.created_at || null,
          },
          trust: {
            hasAssessment: !!trustAssessment,
            result: trustAssessment?.result,
            generatedAt: trustAssessment?.generated_at,
          },
          dossier: {
            exists: !!dossier,
            result: dossier?.result,
            generatedAt: dossier?.generated_at,
          },
          psychological: {
            exists: !!psychProfile.data,
            data: psychProfile.data,
          },
        },
        totalAnalyses: (mediaAnalysesRes.data?.length || 0) + 
                       (voiceInsightsRes.data?.length || 0) + 
                       (behavioralAnalyses.data?.length || 0),
        hasDossier: !!dossier,
      };
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sources = intelligenceSummary?.sources;
  const completenessScore = calculateCompleteness(sources);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Intelligence Overview
              {profileName && <span className="text-muted-foreground font-normal">— {profileName}</span>}
            </CardTitle>
            <CardDescription>
              Consolidated intelligence from all analysis sources
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completenessScore}%</div>
            <div className="text-xs text-muted-foreground">Intelligence Coverage</div>
          </div>
        </div>
        <Progress value={completenessScore} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1.5">
              <Image className="h-4 w-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1.5">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="behavioral" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Behavioral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Media Intelligence */}
              <SourceCard
                icon={Image}
                label="Media Analysis"
                count={sources?.media.count || 0}
                latestAt={sources?.media.latestAt}
                hasAggregate={sources?.media.hasAggregate}
                color="text-blue-500"
              />
              
              {/* Voice Intelligence */}
              <SourceCard
                icon={Mic}
                label="Voice Insights"
                count={sources?.voice.count || 0}
                latestAt={sources?.voice.latestAt}
                hasAggregate={sources?.voice.hasAggregate}
                color="text-green-500"
              />
              
              {/* Behavioral */}
              <SourceCard
                icon={Activity}
                label="Behavioral"
                count={sources?.behavioral.count || 0}
                latestAt={sources?.behavioral.latestAt}
                color="text-purple-500"
              />
              
              {/* Trust Assessment */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Trust</span>
                </div>
                {sources?.trust.hasAssessment ? (
                  <>
                    <div className="text-2xl font-bold">
                      {(sources.trust.result as any)?.overallTrustScore || 
                       (sources.trust.result as any)?.trust_score || 'N/A'}%
                    </div>
                    {sources.trust.generatedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(sources.trust.generatedAt), { addSuffix: true })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Not assessed</div>
                )}
              </div>
            </div>

            {/* Dossier Status */}
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">Intelligence Dossier</span>
                </div>
                {sources?.dossier.exists ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Generated
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Not Generated
                  </Badge>
                )}
              </div>
              {sources?.dossier.generatedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated {formatDistanceToNow(new Date(sources.dossier.generatedAt), { addSuffix: true })}
                </p>
              )}
            </div>

            {/* Psychological Profile Summary */}
            {sources?.psychological.exists && sources.psychological.data && (
              <div className="mt-4 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">Psychological Profile</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {(sources.psychological.data as any).personality_type && (
                    <div>
                      <div className="text-muted-foreground">Personality</div>
                      <div className="font-medium">{(sources.psychological.data as any).personality_type}</div>
                    </div>
                  )}
                  {(sources.psychological.data as any).communication_style && (
                    <div>
                      <div className="text-muted-foreground">Communication</div>
                      <div className="font-medium capitalize">{(sources.psychological.data as any).communication_style}</div>
                    </div>
                  )}
                  {(sources.psychological.data as any).emotional_state && (
                    <div>
                      <div className="text-muted-foreground">Emotional State</div>
                      <div className="font-medium capitalize">{(sources.psychological.data as any).emotional_state}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <MediaIntelligenceTab profileId={profileId} />
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <VoiceIntelligenceTab profileId={profileId} />
          </TabsContent>

          <TabsContent value="behavioral" className="mt-4">
            <BehavioralIntelligenceTab profileId={profileId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper component for source cards
function SourceCard({ 
  icon: Icon, 
  label, 
  count, 
  latestAt, 
  hasAggregate,
  color 
}: { 
  icon: any; 
  label: string; 
  count: number; 
  latestAt: string | null;
  hasAggregate?: boolean;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{count}</div>
      {latestAt && (
        <div className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(latestAt), { addSuffix: true })}
        </div>
      )}
      {hasAggregate && (
        <Badge variant="secondary" className="mt-2 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          Aggregated
        </Badge>
      )}
    </div>
  );
}

// Calculate completeness score
function calculateCompleteness(sources: any): number {
  if (!sources) return 0;
  
  let score = 0;
  let maxScore = 0;

  // Media analysis (30 points)
  maxScore += 30;
  if (sources.media.count > 0) score += 15;
  if (sources.media.count > 5) score += 10;
  if (sources.media.hasAggregate) score += 5;

  // Voice analysis (25 points)
  maxScore += 25;
  if (sources.voice.count > 0) score += 12;
  if (sources.voice.count > 3) score += 8;
  if (sources.voice.hasAggregate) score += 5;

  // Behavioral (20 points)
  maxScore += 20;
  if (sources.behavioral.count > 0) score += 10;
  if (sources.behavioral.count > 3) score += 10;

  // Trust assessment (15 points)
  maxScore += 15;
  if (sources.trust.hasAssessment) score += 15;

  // Dossier (10 points)
  maxScore += 10;
  if (sources.dossier.exists) score += 10;

  return Math.round((score / maxScore) * 100);
}

// Sub-tabs for detailed views
function MediaIntelligenceTab({ profileId }: { profileId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['media-intelligence-detail', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('media_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (!data?.length) return <div className="text-center py-8 text-muted-foreground">No media analyses yet</div>;

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {data.map((analysis: any) => (
          <div key={analysis.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Media Analysis</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function VoiceIntelligenceTab({ profileId }: { profileId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['voice-intelligence-detail', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (!data?.length) return <div className="text-center py-8 text-muted-foreground">No voice insights yet</div>;

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {data.map((insight: any) => (
          <div key={insight.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">{insight.source_type}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function BehavioralIntelligenceTab({ profileId }: { profileId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['behavioral-intelligence-detail', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (!data?.length) return <div className="text-center py-8 text-muted-foreground">No behavioral analyses yet</div>;

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {data.map((analysis: any) => (
          <div key={analysis.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Behavioral Analysis</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
