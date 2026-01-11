import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ProfileFreshness {
  id: string;
  name: string;
  lastEnriched: Date | null;
  lastCommunication: Date | null;
  dataAge: number; // days
  freshnessScore: number; // 0-100
  needsRefresh: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function DataFreshnessPanel() {
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: freshnessData, isLoading } = useQuery({
    queryKey: ['data-freshness'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, updated_at, is_favorite,
          enrichment_jobs(created_at, status),
          communications(occurred_at)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (!profiles) return [];

      return profiles.map(p => {
        const enrichments = (p.enrichment_jobs as any[]) || [];
        const comms = (p.communications as any[]) || [];
        
        const lastEnriched = enrichments.length > 0 
          ? new Date(Math.max(...enrichments.map(e => new Date(e.created_at).getTime())))
          : null;
        
        const lastComm = comms.length > 0
          ? new Date(Math.max(...comms.map(c => new Date(c.occurred_at).getTime())))
          : null;

        const dataAge = lastEnriched 
          ? Math.floor((Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const freshnessScore = Math.max(0, 100 - (dataAge * 3));
        
        return {
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
          lastEnriched,
          lastCommunication: lastComm,
          dataAge,
          freshnessScore,
          needsRefresh: dataAge > 14,
          priority: p.is_favorite ? 'high' : dataAge > 30 ? 'high' : dataAge > 14 ? 'medium' : 'low'
        } as ProfileFreshness;
      }).sort((a, b) => a.freshnessScore - b.freshnessScore);
    },
    refetchInterval: 60000
  });

  const refreshMutation = useMutation({
    mutationFn: async (profileId: string) => {
      setRefreshingIds(prev => new Set(prev).add(profileId));
      
      const { error } = await supabase.functions.invoke('auto-enrich-contact', {
        body: { profileId, priority: 'high' }
      });
      
      if (error) throw error;
    },
    onSuccess: (_, profileId) => {
      toast.success("Enrichment started");
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['data-freshness'] });
    },
    onError: (error, profileId) => {
      toast.error("Failed to start enrichment");
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
    }
  });

  const batchRefreshMutation = useMutation({
    mutationFn: async () => {
      const staleProfiles = freshnessData?.filter(p => p.needsRefresh).slice(0, 10) || [];
      
      for (const profile of staleProfiles) {
        await supabase.functions.invoke('auto-enrich-contact', {
          body: { profileId: profile.id, priority: 'medium' }
        });
      }
      
      return staleProfiles.length;
    },
    onSuccess: (count) => {
      toast.success(`Started enrichment for ${count} contacts`);
      queryClient.invalidateQueries({ queryKey: ['data-freshness'] });
    }
  });

  const staleCount = freshnessData?.filter(p => p.needsRefresh).length || 0;
  const avgFreshness = freshnessData?.length 
    ? Math.round(freshnessData.reduce((sum, p) => sum + p.freshnessScore, 0) / freshnessData.length)
    : 0;

  const getFreshnessColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return variants[priority] || 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Data Freshness Monitor
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => batchRefreshMutation.mutate()}
          disabled={batchRefreshMutation.isPending || staleCount === 0}
        >
          <Zap className="h-4 w-4 mr-1" />
          Refresh Stale ({staleCount})
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${getFreshnessColor(avgFreshness)}`}>
              {avgFreshness}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Freshness</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{staleCount}</div>
            <div className="text-xs text-muted-foreground">Need Refresh</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {freshnessData?.filter(p => p.freshnessScore >= 70).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Up to Date</div>
          </div>
        </div>

        {/* Profile List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {freshnessData?.slice(0, 20).map(profile => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative">
                    {profile.freshnessScore >= 70 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : profile.freshnessScore >= 40 ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{profile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {profile.lastEnriched 
                        ? `Updated ${formatDistanceToNow(profile.lastEnriched, { addSuffix: true })}`
                        : 'Never enriched'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16">
                    <Progress value={profile.freshnessScore} className="h-2" />
                  </div>
                  <Badge variant={getPriorityBadge(profile.priority)} className="text-xs">
                    {profile.priority}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => refreshMutation.mutate(profile.id)}
                    disabled={refreshingIds.has(profile.id)}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingIds.has(profile.id) ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
