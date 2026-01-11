import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, Zap, Users, TrendingUp, 
  ExternalLink, Network, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  detectClusters,
  detectStructuralHoles,
  calculateNetworkDensity,
  getClusterColor,
  type StructuralHole
} from '@/lib/network';

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  relationship_type: string | null;
  avatar_url: string | null;
}

export function StructuralHolesPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch profiles and relationships for network analysis
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network-structural-analysis', user?.id],
    queryFn: async () => {
      const [profilesRes, relationshipsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, relationship_type, avatar_url')
          .eq('user_id', user!.id),
        supabase
          .from('contact_relationships')
          .select('from_profile_id, to_profile_id, relationship_type')
          .eq('user_id', user!.id),
      ]);

      return {
        profiles: (profilesRes.data || []) as ProfileData[],
        relationships: (relationshipsRes.data || []).map(r => ({
          from_profile_id: r.from_profile_id,
          to_profile_id: r.to_profile_id,
          strength: 1,
        })),
      };
    },
    enabled: !!user,
  });

  // Calculate network metrics
  const analysisResults = useMemo(() => {
    if (!networkData?.profiles.length) return null;

    const nodes = networkData.profiles.map(p => ({ id: p.id, ...p }));
    const links = networkData.relationships.map(r => ({
      source: r.from_profile_id,
      target: r.to_profile_id,
      weight: r.strength || 1,
    }));

    if (links.length === 0) return null;

    const clusters = detectClusters(nodes, links);
    const structuralHoles = detectStructuralHoles(nodes, links, clusters);
    const density = calculateNetworkDensity(nodes, links);
    const clusterCount = new Set(clusters.values()).size;

    // Enrich structural holes with profile data
    const enrichedHoles = structuralHoles.slice(0, 10).map(hole => {
      const profile = networkData.profiles.find(p => p.id === hole.bridgeNode);
      const communityProfiles = hole.communities.map(clusterId => {
        const members = networkData.profiles.filter(
          p => clusters.get(p.id) === clusterId
        );
        return {
          clusterId,
          memberCount: members.length,
          sampleMembers: members.slice(0, 3),
        };
      });

      return {
        ...hole,
        profile,
        communityProfiles,
      };
    });

    return {
      density,
      clusterCount,
      totalNodes: nodes.length,
      totalLinks: links.length,
      structuralHoles: enrichedHoles,
      clusters,
    };
  }, [networkData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Structural Bridges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!analysisResults || analysisResults.structuralHoles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Structural Bridges
          </CardTitle>
          <CardDescription>
            Key connectors between different communities in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Not enough relationship data to detect structural bridges.</p>
            <p className="text-sm mt-2">Add relationships between contacts to see network analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Contacts</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analysisResults.totalNodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Connections</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analysisResults.totalLinks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Network Density</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {(analysisResults.density * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Communities</span>
            </div>
            <div className="text-2xl font-bold mt-1">{analysisResults.clusterCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Structural Bridges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Key Network Bridges
          </CardTitle>
          <CardDescription>
            Contacts who connect different communities - valuable for introductions and information flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {analysisResults.structuralHoles.map((hole, idx) => (
                <Card key={hole.bridgeNode} className="border bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                        #{idx + 1}
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">
                            {hole.profile?.first_name} {hole.profile?.last_name}
                          </h4>
                          <Badge variant="outline" className="capitalize">
                            {hole.profile?.relationship_type?.replace('_', ' ') || 'contact'}
                          </Badge>
                        </div>

                        {/* Bridge Score */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Bridge Score</span>
                            <span className="font-medium">{(hole.bridgeScore * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={hole.bridgeScore * 100} className="h-2" />
                        </div>

                        {/* Communities Connected */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {hole.communityProfiles.map((community, cIdx) => (
                            <div
                              key={community.clusterId}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                              style={{
                                backgroundColor: `${getClusterColor(community.clusterId)}20`,
                                borderColor: getClusterColor(community.clusterId),
                                borderWidth: 1,
                              }}
                            >
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: getClusterColor(community.clusterId) }}
                              />
                              <span>{community.memberCount} members</span>
                            </div>
                          ))}
                        </div>

                        {/* Potential Value */}
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className={`h-4 w-4 ${
                            hole.potentialValue.startsWith('Very') ? 'text-yellow-500' :
                            hole.potentialValue.startsWith('High') ? 'text-green-500' :
                            'text-blue-500'
                          }`} />
                          <span className="text-muted-foreground">{hole.potentialValue}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/contacts/${hole.bridgeNode}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Community Sample Members */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Bridges between:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {hole.communityProfiles.map((community, cIdx) => (
                          <div key={community.clusterId} className="flex items-center gap-1">
                            {cIdx > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            <div className="flex -space-x-2">
                              {community.sampleMembers.slice(0, 2).map(member => (
                                <div
                                  key={member.id}
                                  className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium"
                                  title={`${member.first_name} ${member.last_name}`}
                                >
                                  {member.first_name?.[0]}{member.last_name?.[0]}
                                </div>
                              ))}
                              {community.memberCount > 2 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                                  +{community.memberCount - 2}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Network Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <GitBranch className="h-4 w-4 mt-0.5 text-primary" />
              <span>
                <strong>{analysisResults.structuralHoles.length}</strong> contacts serve as bridges between communities
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 text-yellow-500" />
              <span>
                Top bridges connect <strong>{analysisResults.structuralHoles[0]?.communities.length || 0}</strong> different communities
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                Network density of {(analysisResults.density * 100).toFixed(1)}% indicates a{' '}
                {analysisResults.density > 0.3 ? 'well-connected' : analysisResults.density > 0.1 ? 'moderately connected' : 'sparse'} network
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
