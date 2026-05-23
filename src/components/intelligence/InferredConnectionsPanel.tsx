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
  Network, RefreshCw, Users, Building, Link2, ChevronRight,
  Sparkles, GitBranch, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { invokeFunction } from '@/lib/api';

interface InferredConnectionsPanelProps {
  profileId: string;
  contactName: string;
}

interface RelationshipInference {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  inference_type: string;
  confidence_score: number | null;
  evidence: any;
  path_distance: number | null;
  shared_attributes?: any;
  created_at: string;
  profile_a?: { id: string; first_name: string; last_name: string | null };
  profile_b?: { id: string; first_name: string; last_name: string | null };
  [key: string]: any;
}

const inferenceTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  transitive_connection: { icon: GitBranch, label: 'Mutual Connection', color: 'text-blue-600' },
  shared_organization: { icon: Building, label: 'Same Organization', color: 'text-purple-600' },
  event_co_attendance: { icon: Users, label: 'Event Co-Attendance', color: 'text-green-600' },
  location_overlap: { icon: Link2, label: 'Location Overlap', color: 'text-orange-600' },
  structural_hole: { icon: Zap, label: 'Bridge Opportunity', color: 'text-yellow-600' },
};

export function InferredConnectionsPanel({ profileId, contactName }: InferredConnectionsPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: inferences, isLoading } = useQuery({
    queryKey: ['relationship-inferences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_inferences')
        .select(`
          *,
          profile_a:profiles!relationship_inferences_source_profile_id_fkey(id, first_name, last_name),
          profile_b:profiles!relationship_inferences_target_profile_id_fkey(id, first_name, last_name)
        `)
        .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data as RelationshipInference[];
    },
    enabled: !!user && !!profileId,
  });

  const inferMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('infer-relationships', { mode: 'contact', profileId },);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relationship-inferences', profileId] });
      toast.success(`Discovered ${data.new_inferences_count || 0} new connections`);
    },
    onError: (error) => {
      toast.error('Inference failed: ' + error.message);
    },
  });

  const getOtherProfile = (inference: RelationshipInference) => {
    if (inference.source_profile_id === profileId) {
      return inference.profile_b;
    }
    return inference.profile_a;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group inferences by type
  const groupedInferences = inferences?.reduce((acc, inf) => {
    const type = inf.inference_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(inf);
    return acc;
  }, {} as Record<string, RelationshipInference[]>) || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Inferred Connections
            </CardTitle>
            <CardDescription>
              AI-discovered relationships for {contactName}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inferMutation.mutate()}
            disabled={inferMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${inferMutation.isPending ? 'animate-spin' : ''}`} />
            Discover
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {inferences && inferences.length > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">{inferences.length}</div>
                <div className="text-xs text-muted-foreground">Connections Found</div>
              </div>
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">
                  {Object.keys(groupedInferences).length}
                </div>
                <div className="text-xs text-muted-foreground">Connection Types</div>
              </div>
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-2xl font-bold">
                  {Math.round((inferences.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / inferences.length) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
            </div>

            {/* Grouped Connections */}
            <ScrollArea className="h-[350px]">
              <div className="space-y-4">
                {Object.entries(groupedInferences).map(([type, items]) => {
                  const config = inferenceTypeConfig[type] || { 
                    icon: Link2, 
                    label: type.replace('_', ' '), 
                    color: 'text-muted-foreground' 
                  };
                  const TypeIcon = config.icon;

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TypeIcon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-6">
                        {items.map((inference) => {
                          const otherProfile = getOtherProfile(inference);
                          if (!otherProfile) return null;

                          return (
                            <div
                              key={inference.id}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => navigate(`/contacts/${otherProfile.id}`)}
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                {otherProfile.first_name[0]}
                                {otherProfile.last_name?.[0] || ''}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {otherProfile.first_name} {otherProfile.last_name}
                                </div>
                                {inference.evidence?.via_contact && (
                                  <div className="text-xs text-muted-foreground">
                                    via {inference.evidence.via_contact}
                                  </div>
                                )}
                                {inference.shared_attributes?.organization && (
                                  <div className="text-xs text-muted-foreground">
                                    @ {inference.shared_attributes.organization}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-medium">
                                  {Math.round((inference.confidence_score || 0) * 100)}%
                                </div>
                                <Progress
                                  value={(inference.confidence_score || 0) * 100} 
                                  className="w-12 h-1.5"
                                />
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Bridge Opportunities */}
            {groupedInferences.structural_hole?.length > 0 && (
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    Networking Opportunities
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {contactName} can bridge {groupedInferences.structural_hole.length} unconnected 
                  groups in your network, making them a valuable connector.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No inferred connections yet</p>
            <p className="text-sm mb-4">
              Discover hidden relationships through mutual contacts and shared attributes
            </p>
            <Button 
              onClick={() => inferMutation.mutate()} 
              disabled={inferMutation.isPending}
            >
              <Network className="h-4 w-4 mr-2" />
              Discover Connections
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
