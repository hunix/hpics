/**
 * Auto-Enrichment Pipeline Panel
 * Enhancement Roadmap Phase 5: Auto-Enrichment Pipeline
 * 
 * Automated data enrichment orchestration with scheduling,
 * source management, and quality tracking.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, Database, Globe, Linkedin, Twitter, RefreshCw,
  Loader2, CheckCircle, XCircle, Clock, Zap, Shield,
  TrendingUp, AlertTriangle, Play, Pause, Settings, Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface EnrichmentSource {
  id: string;
  name: string;
  type: 'osint' | 'api' | 'scraper' | 'manual';
  icon: React.ReactNode;
  enabled: boolean;
  lastRun: string | null;
  successRate: number;
  recordsEnriched: number;
  costPerRecord: number;
  priority: number;
}

interface EnrichmentJob {
  id: string;
  profileId: string;
  profileName: string;
  sources: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  fieldsUpdated: number;
  error: string | null;
}

interface EnrichmentSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
  targetProfiles: 'all' | 'stale' | 'priority' | 'new';
  sources: string[];
}

const DEFAULT_SOURCES: EnrichmentSource[] = [
  { id: 'pdl', name: 'People Data Labs', type: 'api', icon: <Database className="h-4 w-4" />, enabled: true, lastRun: null, successRate: 0.92, recordsEnriched: 0, costPerRecord: 0.10, priority: 1 },
  { id: 'linkedin', name: 'LinkedIn', type: 'scraper', icon: <Linkedin className="h-4 w-4" />, enabled: true, lastRun: null, successRate: 0.85, recordsEnriched: 0, costPerRecord: 0.05, priority: 2 },
  { id: 'diffbot', name: 'Diffbot', type: 'api', icon: <Globe className="h-4 w-4" />, enabled: false, lastRun: null, successRate: 0.88, recordsEnriched: 0, costPerRecord: 0.15, priority: 3 },
  { id: 'twitter', name: 'Twitter/X', type: 'api', icon: <Twitter className="h-4 w-4" />, enabled: false, lastRun: null, successRate: 0.78, recordsEnriched: 0, costPerRecord: 0.02, priority: 4 },
  { id: 'clearbit', name: 'Clearbit', type: 'api', icon: <Zap className="h-4 w-4" />, enabled: false, lastRun: null, successRate: 0.90, recordsEnriched: 0, costPerRecord: 0.12, priority: 5 },
];

export function AutoEnrichmentPipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sources, setSources] = useState<EnrichmentSource[]>(DEFAULT_SOURCES);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch enrichment jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['enrichment-jobs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrichment_queue')
        .select(`
          id,
          profile_id,
          sources,
          status,
          started_at,
          completed_at,
          fields_updated,
          error_message,
          profiles:profile_id (first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return (data || []).map((job: any): EnrichmentJob => ({
        id: job.id,
        profileId: job.profile_id,
        profileName: `${job.profiles?.first_name || ''} ${job.profiles?.last_name || ''}`.trim() || 'Unknown',
        sources: job.sources || [],
        status: job.status,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        fieldsUpdated: job.fields_updated || 0,
        error: job.error_message,
      }));
    },
    enabled: !!user,
    refetchInterval: isRunning ? 5000 : false,
  });

  // Fetch profiles needing enrichment
  const { data: staleProfiles } = useQuery({
    queryKey: ['stale-profiles', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, last_enriched_at, data_richness_score')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .or(`last_enriched_at.is.null,last_enriched_at.lt.${thirtyDaysAgo.toISOString()}`)
        .order('data_richness_score', { ascending: true, nullsFirst: true })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Run enrichment mutation
  const enrichMutation = useMutation({
    mutationFn: async (profileIds: string[]) => {
      setIsRunning(true);
      const enabledSources = sources.filter(s => s.enabled).map(s => s.id);
      
      const { data, error } = await supabase.functions.invoke('auto-enrichment-pipeline', {
        body: { 
          profileIds, 
          sources: enabledSources,
          userId: user!.id,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stale-profiles'] });
      toast({ title: 'Enrichment started', description: `Processing ${data.queued} profiles` });
    },
    onError: (error) => {
      toast({ title: 'Enrichment failed', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      setTimeout(() => setIsRunning(false), 5000);
    },
  });

  // Toggle source
  const toggleSource = (sourceId: string) => {
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  // Calculate metrics
  const queuedCount = jobs?.filter(j => j.status === 'queued').length || 0;
  const runningCount = jobs?.filter(j => j.status === 'running').length || 0;
  const completedCount = jobs?.filter(j => j.status === 'completed').length || 0;
  const failedCount = jobs?.filter(j => j.status === 'failed').length || 0;
  const totalFieldsUpdated = jobs?.reduce((sum, j) => sum + j.fieldsUpdated, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Auto-Enrichment Pipeline</h2>
            <p className="text-sm text-muted-foreground">
              Automated profile data enrichment and quality improvement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={isRunning ? 'border-green-500/50 text-green-400' : ''}>
            {isRunning ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Running
              </>
            ) : (
              'Idle'
            )}
          </Badge>
          <Button
            onClick={() => {
              const profileIds = staleProfiles?.map(p => p.id) || [];
              if (profileIds.length > 0) {
                enrichMutation.mutate(profileIds);
              } else {
                toast({ title: 'No profiles to enrich', description: 'All profiles are up to date' });
              }
            }}
            disabled={enrichMutation.isPending || !staleProfiles?.length}
          >
            {enrichMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Enrich {staleProfiles?.length || 0} Stale Profiles
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{queuedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Running</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{runningCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{failedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Fields Updated</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{totalFieldsUpdated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources" className="gap-2">
            <Database className="h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <Clock className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="stale" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stale Profiles
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrichment Sources</CardTitle>
              <CardDescription>Configure data sources for profile enrichment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sources.map((source) => (
                  <div 
                    key={source.id}
                    className={`p-4 rounded-lg border ${source.enabled ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${source.enabled ? 'bg-primary/20' : 'bg-muted'}`}>
                          {source.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{source.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">{source.type}</Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>Success: {(source.successRate * 100).toFixed(0)}%</span>
                            <span>Cost: ${source.costPerRecord.toFixed(2)}/record</span>
                            <span>Priority: #{source.priority}</span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(source.id)}
                      />
                    </div>
                    {source.enabled && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Success Rate</span>
                          <span>{(source.successRate * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={source.successRate * 100} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrichment Queue</CardTitle>
              <CardDescription>Recent and active enrichment jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !jobs?.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No enrichment jobs</p>
                    <p className="text-sm">Start enrichment to see jobs here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div 
                        key={job.id}
                        className="p-3 rounded-lg bg-muted/30 flex items-center gap-3"
                      >
                        {job.status === 'queued' && <Clock className="h-4 w-4 text-amber-400" />}
                        {job.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />}
                        {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                        {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{job.profileName}</span>
                            <Badge variant="outline" className="text-xs capitalize">{job.status}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.sources.join(', ')} • {job.fieldsUpdated} fields updated
                            {job.startedAt && (
                              <span> • {formatDistanceToNow(new Date(job.startedAt))} ago</span>
                            )}
                          </div>
                          {job.error && (
                            <p className="text-xs text-red-400 mt-1">{job.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stale">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stale Profiles</CardTitle>
              <CardDescription>Profiles that need data enrichment</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {!staleProfiles?.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>All profiles are up to date</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staleProfiles.map((profile) => (
                      <div 
                        key={profile.id}
                        className="p-3 rounded-lg bg-muted/30 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">
                            {profile.first_name} {profile.last_name}
                          </span>
                          <div className="text-xs text-muted-foreground mt-1">
                            {profile.last_enriched_at 
                              ? `Last enriched: ${formatDistanceToNow(new Date(profile.last_enriched_at))} ago`
                              : 'Never enriched'
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Data Quality</div>
                            <Progress 
                              value={(profile.data_richness_score || 0) * 100} 
                              className="h-1 w-20 mt-1"
                            />
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => enrichMutation.mutate([profile.id])}
                            disabled={enrichMutation.isPending}
                          >
                            Enrich
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrichment Schedules</CardTitle>
              <CardDescription>Automated enrichment job schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample schedules - in production these would be fetched from DB */}
                {[
                  { id: '1', name: 'Daily Stale Check', frequency: 'daily', enabled: true, targetProfiles: 'stale', nextRun: 'Tomorrow 2:00 AM' },
                  { id: '2', name: 'Weekly Full Scan', frequency: 'weekly', enabled: false, targetProfiles: 'all', nextRun: 'Sunday 3:00 AM' },
                  { id: '3', name: 'New Contact Enrichment', frequency: 'hourly', enabled: true, targetProfiles: 'new', nextRun: 'In 45 minutes' },
                ].map((schedule) => (
                  <div 
                    key={schedule.id}
                    className={`p-4 rounded-lg border ${schedule.enabled ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">{schedule.name}</span>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="capitalize">{schedule.frequency}</Badge>
                            <span>Target: {schedule.targetProfiles}</span>
                            <span>Next: {schedule.nextRun}</span>
                          </div>
                        </div>
                      </div>
                      <Switch checked={schedule.enabled} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
