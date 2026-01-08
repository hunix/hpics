import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Route, 
  Search, 
  ArrowRight, 
  Users, 
  Sparkles,
  RefreshCw,
  ChevronRight,
  User
} from "lucide-react";
import { toast } from "sonner";

interface PathNode {
  profileId: string;
  name: string;
  avatarUrl?: string;
  relationship: string;
  connectionStrength: number;
}

interface InfluencePath {
  target: string;
  targetName: string;
  path: PathNode[];
  totalStrength: number;
  suggestedApproach?: string;
}

export function InfluencePathFinder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // Search contacts
  const { data: searchResults } = useQuery({
    queryKey: ['contact-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,organization.ilike.%${searchQuery}%`)
        .limit(10);
      
      return data || [];
    },
    enabled: searchQuery.length >= 2
  });

  // Find path to target
  const findPathMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all relationship inferences
      const { data: inferences } = await supabase
        .from('relationship_inferences')
        .select(`
          source_profile_id,
          target_profile_id,
          inference_type,
          confidence_score
        `)
        .eq('user_id', user.id);

      // Get all profiles for name lookup
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user.id);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Build adjacency graph
      const graph = new Map<string, Map<string, { strength: number; relationship: string }>>();
      
      for (const inf of inferences || []) {
        if (!graph.has(inf.source_profile_id)) graph.set(inf.source_profile_id, new Map());
        if (!graph.has(inf.target_profile_id)) graph.set(inf.target_profile_id, new Map());
        
        graph.get(inf.source_profile_id)!.set(inf.target_profile_id, {
          strength: inf.confidence_score || 0.5,
          relationship: inf.inference_type || 'connected'
        });
        graph.get(inf.target_profile_id)!.set(inf.source_profile_id, {
          strength: inf.confidence_score || 0.5,
          relationship: inf.inference_type || 'connected'
        });
      }

      // BFS to find shortest path
      const visited = new Set<string>();
      const queue: { id: string; path: PathNode[]; strength: number }[] = [];
      
      // Start from all directly connected contacts
      for (const [id, connections] of graph.entries()) {
        if (id === targetId) {
          const p = profileMap.get(id);
          return {
            target: targetId,
            targetName: p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown',
            path: [{
              profileId: id,
              name: p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown',
              avatarUrl: p?.avatar_url || undefined,
              relationship: 'direct',
              connectionStrength: 1.0
            }],
            totalStrength: 1.0,
            suggestedApproach: 'You have a direct connection. Reach out directly!'
          };
        }
        
        const p = profileMap.get(id);
        queue.push({
          id,
          path: [{
            profileId: id,
            name: p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown',
            avatarUrl: p?.avatar_url || undefined,
            relationship: 'contact',
            connectionStrength: 1.0
          }],
          strength: 1.0
        });
      }

      while (queue.length > 0) {
        const { id, path, strength } = queue.shift()!;
        
        if (visited.has(id)) continue;
        visited.add(id);

        const connections = graph.get(id);
        if (!connections) continue;

        for (const [nextId, conn] of connections.entries()) {
          if (visited.has(nextId)) continue;

          const nextProfile = profileMap.get(nextId);
          const newPath = [...path, {
            profileId: nextId,
            name: nextProfile ? `${nextProfile.first_name} ${nextProfile.last_name}`.trim() : 'Unknown',
            avatarUrl: nextProfile?.avatar_url || undefined,
            relationship: conn.relationship,
            connectionStrength: conn.strength
          }];
          const newStrength = strength * conn.strength;

          if (nextId === targetId) {
            return {
              target: targetId,
              targetName: nextProfile ? `${nextProfile.first_name} ${nextProfile.last_name}`.trim() : 'Unknown',
              path: newPath,
              totalStrength: newStrength,
              suggestedApproach: `Ask ${path[path.length - 1].name} for an introduction.`
            };
          }

          if (path.length < 4) { // Limit path depth
            queue.push({ id: nextId, path: newPath, strength: newStrength });
          }
        }
      }

      throw new Error('No path found to this contact');
    },
    onSuccess: (result) => {
      toast.success(`Found path with ${result.path.length} steps`);
    },
    onError: (error) => {
      toast.error((error as Error).message);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSelectTarget = (id: string) => {
    setSelectedTarget(id);
    findPathMutation.mutate(id);
    setSearchQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Influence Path Finder
        </CardTitle>
        <CardDescription>
          Find the shortest path to reach anyone through your network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for someone to reach..."
            className="pl-10"
          />
          
          {/* Search Results Dropdown */}
          {searchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left"
                  onClick={() => handleSelectTarget(contact.id)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={contact.avatar_url || undefined} />
                    <AvatarFallback>
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.organization && (
                      <p className="text-xs text-muted-foreground">{contact.organization}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Loading State */}
        {findPathMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Finding path...</span>
          </div>
        )}

        {/* Path Result */}
        {findPathMutation.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {findPathMutation.data.path.length} steps
              </Badge>
              <Badge variant="outline">
                {Math.round(findPathMutation.data.totalStrength * 100)}% confidence
              </Badge>
            </div>

            {/* Path Visualization */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 px-3 py-2 bg-primary/10 rounded-lg">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">You</span>
              </div>

              {findPathMutation.data.path.map((node, i) => (
                <div key={node.profileId} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={node.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {node.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{node.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({node.relationship})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Approach */}
            {findPathMutation.data.suggestedApproach && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Suggested Approach</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {findPathMutation.data.suggestedApproach}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!findPathMutation.data && !findPathMutation.isPending && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>Search for someone to find the path to reach them</p>
            <p className="text-sm">Uses your network connections to find introductions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
