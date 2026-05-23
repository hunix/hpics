import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Network, Users, Star, RefreshCw, ChevronRight,
  Building, Link2, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface NetworkAnalysis {
  total_profiles: number;
  total_connections: number;
  network_density: number;
  clusters: {
    id: string;
    type: string;
    size: number;
    members: { id: string; first_name: string; last_name: string | null }[];
  }[];
  influence_rankings: {
    profile_id: string;
    profile: { id: string; first_name: string; last_name: string | null };
    influence_score: number;
    connection_count: number;
  }[];
}

export function NetworkIntelligencePanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['network-intelligence', user?.id],
    queryFn: async () => {
      // First try to get cached analysis from connection_intelligence
      const { data: connections } = await supabase
        .from('connection_intelligence')
        .select('*')
        .eq('user_id', user!.id)
        .limit(1);

      // If we have recent connections, summarize them
      if (connections && connections.length > 0) {
        const { data: allConnections } = await supabase
          .from('connection_intelligence')
          .select(`
            *,
            profile_a:profiles!connection_intelligence_profile_a_id_fkey(id, first_name, last_name),
            profile_b:profiles!connection_intelligence_profile_b_id_fkey(id, first_name, last_name)
          `)
          .eq('user_id', user!.id);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, relationship_type, is_favorite')
          .eq('user_id', user!.id);

        // Build influence map
        const influenceMap = new Map<string, { count: number; strength: number }>();
        allConnections?.forEach(c => {
          const aInfo = influenceMap.get(c.profile_a_id) || { count: 0, strength: 0 };
          aInfo.count++;
          aInfo.strength += c.connection_strength || 0;
          influenceMap.set(c.profile_a_id, aInfo);

          const bInfo = influenceMap.get(c.profile_b_id) || { count: 0, strength: 0 };
          bInfo.count++;
          bInfo.strength += c.connection_strength || 0;
          influenceMap.set(c.profile_b_id, bInfo);
        });

        const rankings = Array.from(influenceMap.entries())
          .map(([id, info]) => ({
            profile_id: id,
            profile: profiles?.find(p => p.id === id),
            influence_score: Math.min(100, info.count * 10 + info.strength / 10),
            connection_count: info.count,
          }))
          .filter(r => r.profile)
          .sort((a, b) => b.influence_score - a.influence_score)
          .slice(0, 10);

        return {
          total_profiles: profiles?.length || 0,
          total_connections: allConnections?.length || 0,
          network_density: profiles?.length ? (allConnections?.length || 0) * 2 / (profiles.length * (profiles.length - 1)) : 0,
          clusters: [],
          influence_rankings: rankings,
        } as NetworkAnalysis;
      }

      return null;
    },
    enabled: !!user,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('analyze-network-intelligence');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['network-intelligence'] });
      toast.success(`Analyzed network: ${data.analysis.total_connections} connections found`);
    },
    onError: (error) => {
      toast.error('Analysis failed: ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
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
              <Network className="h-5 w-5" />
              Network Intelligence
            </CardTitle>
            <CardDescription>
              Connection analysis, influence mapping, and cluster detection
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            Analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis ? (
          <>
            {/* Network Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{analysis.total_profiles}</div>
                <div className="text-xs text-muted-foreground">Contacts</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <Link2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{analysis.total_connections}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{(analysis.network_density * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Density</div>
              </div>
            </div>

            {/* Influence Rankings */}
            {analysis.influence_rankings.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Top Influencers
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {analysis.influence_rankings.map((ranking, i) => (
                      <div
                        key={ranking.profile_id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/contacts/${ranking.profile_id}`)}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {ranking.profile?.first_name} {ranking.profile?.last_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ranking.connection_count} connections</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{ranking.influence_score.toFixed(0)}</div>
                          <Progress value={ranking.influence_score} className="w-16 h-1.5" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Clusters */}
            {analysis.clusters.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Detected Clusters
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {analysis.clusters.slice(0, 6).map(cluster => (
                    <div key={cluster.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {cluster.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {cluster.size} members
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {cluster.members.slice(0, 3).map(m => 
                          `${m.first_name} ${m.last_name || ''}`
                        ).join(', ')}
                        {cluster.members.length > 3 && ` +${cluster.members.length - 3} more`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/network')}
            >
              <Network className="h-4 w-4 mr-2" />
              View Full Network Graph
            </Button>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No network analysis available</p>
            <p className="text-sm mb-4">Run an analysis to discover connections and influence patterns</p>
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              Analyze Network
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
