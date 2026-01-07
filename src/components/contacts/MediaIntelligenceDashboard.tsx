import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, Users, MapPin, Calendar, TrendingUp, AlertTriangle, 
  CheckCircle2, Sparkles, Loader2, Play, BarChart3, Eye,
  Image, Video, Music, Target, Shield, Flag, Zap
} from 'lucide-react';

interface MediaIntelligenceDashboardProps {
  profileId: string;
  contactName: string;
}

const ANALYSIS_TIERS = [
  { 
    value: 'quick', 
    label: 'Quick Scan', 
    description: 'Basic metadata, tags, description',
    costMultiplier: 0.3,
    icon: Zap
  },
  { 
    value: 'standard', 
    label: 'Standard', 
    description: 'Full schema analysis',
    costMultiplier: 1.0,
    icon: Eye
  },
  { 
    value: 'deep', 
    label: 'Deep Intelligence', 
    description: 'All modes + cross-reference',
    costMultiplier: 2.5,
    icon: Brain
  },
  { 
    value: 'maximum', 
    label: 'Maximum Intelligence', 
    description: 'Gemini 3 Pro + all modes + aggregation',
    costMultiplier: 4.0,
    icon: Target
  },
];

const MODEL_OPTIONS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'standard' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'deep' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', tier: 'maximum' },
];

export function MediaIntelligenceDashboard({ profileId, contactName }: MediaIntelligenceDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTier, setSelectedTier] = useState('standard');
  const [includeAggregation, setIncludeAggregation] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch media analysis status
  const { data: analysisStatus } = useQuery({
    queryKey: ['media-analysis-status', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contact_media_counts', {
        p_user_id: user!.id,
        p_profile_id: profileId,
        p_skip_analyzed: false
      });
      
      if (error) throw error;
      
      const counts = data?.[0] || { total_count: 0 };
      
      // Get analyzed count
      const { data: analyzedData } = await supabase.rpc('get_contact_media_counts', {
        p_user_id: user!.id,
        p_profile_id: profileId,
        p_skip_analyzed: true
      });
      
      const unanalyzedCounts = analyzedData?.[0] || { total_count: 0 };
      const totalCount = Number(counts.total_count);
      const unanalyzedCount = Number(unanalyzedCounts.total_count);
      
      return {
        total: totalCount,
        analyzed: totalCount - unanalyzedCount,
        pending: unanalyzedCount,
        percentage: totalCount > 0 ? Math.round(((totalCount - unanalyzedCount) / totalCount) * 100) : 0
      };
    },
    enabled: !!user && !!profileId,
  });

  // Fetch intelligence summary if available
  const { data: intelligenceSummary } = useQuery({
    queryKey: ['media-intelligence-summary', profileId],
    queryFn: async () => {
      // Check for aggregated intelligence from bulk analysis
      const { data, error } = await supabase
        .from('bulk_analysis_sessions')
        .select('aggregation_result')
        .contains('profile_ids', [profileId])
        .eq('status', 'completed')
        .not('aggregation_result', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data?.aggregation_result) return null;
      
      return data.aggregation_result as any;
    },
    enabled: !!user && !!profileId,
  });

  // Fetch people detected in media
  const { data: peopleDetected } = useQuery({
    queryKey: ['media-people-detected', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_contact_tags')
        .select(`
          contact_id,
          profiles:contact_id (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('profiles.user_id', user!.id)
        .limit(20);
      
      if (error) return [];
      
      // Get unique contacts with count
      const contactCounts = new Map<string, { contact: any; count: number }>();
      data?.forEach((tag: any) => {
        if (tag.profiles) {
          const existing = contactCounts.get(tag.contact_id);
          if (existing) {
            existing.count++;
          } else {
            contactCounts.set(tag.contact_id, { contact: tag.profiles, count: 1 });
          }
        }
      });
      
      return Array.from(contactCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!user && !!profileId,
  });

  const runAggregation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aggregate-media-intelligence`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId,
            tier: selectedTier,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Aggregation failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-intelligence-summary', profileId] });
      toast({ title: 'Intelligence aggregation complete' });
    },
    onError: (error) => {
      toast({ title: 'Aggregation failed', description: error.message, variant: 'destructive' });
    },
  });

  const currentTier = ANALYSIS_TIERS.find(t => t.value === selectedTier);
  const TierIcon = currentTier?.icon || Eye;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Media Intelligence Dashboard
        </CardTitle>
        <CardDescription>
          AI-powered analysis of {contactName}'s media files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Analysis Progress</span>
            <span className="text-sm text-muted-foreground">
              {analysisStatus?.analyzed || 0} / {analysisStatus?.total || 0} files
            </span>
          </div>
          <Progress value={analysisStatus?.percentage || 0} className="h-3" />
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {analysisStatus?.analyzed || 0} analyzed
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-4 w-4" />
              {analysisStatus?.pending || 0} pending
            </span>
          </div>
        </div>

        {/* Intelligence Tiers */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Analysis Depth</label>
          <div className="grid grid-cols-2 gap-2">
            {ANALYSIS_TIERS.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === tier.value;
              return (
                <button
                  key={tier.value}
                  onClick={() => setSelectedTier(tier.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">{tier.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => runAggregation.mutate()} 
            disabled={runAggregation.isPending || (analysisStatus?.analyzed || 0) < 10}
            className="flex-1"
          >
            {runAggregation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Intelligence Report
          </Button>
        </div>

        {/* Intelligence Summary */}
        {intelligenceSummary && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">People Detected</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {intelligenceSummary.people_network?.unique_people || peopleDetected?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Locations</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {intelligenceSummary.location_timeline?.unique_locations || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Activities</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {intelligenceSummary.activity_patterns?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Span</span>
                  </div>
                  <p className="text-sm font-bold">
                    {intelligenceSummary.temporal_analysis?.date_range || 'N/A'}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="people" className="mt-4">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {peopleDetected?.map(({ contact, count }) => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {contact.photo_url ? (
                          <img src={contact.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </span>
                      </div>
                      <Badge variant="secondary">{count} photos</Badge>
                    </div>
                  ))}
                  {(!peopleDetected || peopleDetected.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No people tagged yet. Run analysis to detect faces.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="locations" className="mt-4">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {intelligenceSummary.location_timeline?.locations?.map((loc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{loc.name || loc.city || 'Unknown Location'}</span>
                      </div>
                      <Badge variant="secondary">{loc.count || 1} media</Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Run analysis to detect locations from photos.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-4">
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {/* Red Flags */}
                  {intelligenceSummary.red_flags?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Red Flags</span>
                      </div>
                      {intelligenceSummary.red_flags.map((flag: string, i: number) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded-lg text-sm">
                          {flag}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Certainties */}
                  {intelligenceSummary.certainties?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">High-Confidence Facts</span>
                      </div>
                      {intelligenceSummary.certainties.map((fact: string, i: number) => (
                        <div key={i} className="p-2 bg-green-500/10 rounded-lg text-sm">
                          {fact}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Interests */}
                  {intelligenceSummary.interests?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Detected Interests</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {intelligenceSummary.interests.map((interest: string, i: number) => (
                          <Badge key={i} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!intelligenceSummary.red_flags?.length && 
                   !intelligenceSummary.certainties?.length && 
                   !intelligenceSummary.interests?.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Generate an intelligence report to see insights.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* No Intelligence Yet */}
        {!intelligenceSummary && (analysisStatus?.analyzed || 0) >= 10 && (
          <div className="text-center py-6 bg-muted/50 rounded-lg">
            <Brain className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              {analysisStatus?.analyzed} files analyzed. Ready to generate intelligence report.
            </p>
            <Button variant="outline" onClick={() => runAggregation.mutate()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
