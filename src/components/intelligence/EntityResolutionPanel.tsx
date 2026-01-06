import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Users, Search, Link2, AlertTriangle, CheckCircle, 
  Merge, Mail, Phone, Building, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface PotentialMatch {
  id: string;
  profile_a: { id: string; first_name: string; last_name: string | null; organization: string | null };
  profile_b: { id: string; first_name: string; last_name: string | null; organization: string | null };
  match_type: 'name' | 'email' | 'phone' | 'organization';
  confidence: number;
  details: string;
}

export function EntityResolutionPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['entity-resolution', user?.id],
    queryFn: async () => {
      // Fetch all profiles with contact methods
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization')
        .eq('user_id', user!.id);

      const { data: contactMethods } = await supabase
        .from('contact_methods')
        .select('profile_id, contact_type, value')
        .in('profile_id', profiles?.map(p => p.id) || []);

      const matches: PotentialMatch[] = [];
      const profileList = profiles || [];

      // Check for similar names (fuzzy matching)
      for (let i = 0; i < profileList.length; i++) {
        for (let j = i + 1; j < profileList.length; j++) {
          const a = profileList[i];
          const b = profileList[j];

          // Name similarity
          const nameA = `${a.first_name} ${a.last_name || ''}`.toLowerCase().trim();
          const nameB = `${b.first_name} ${b.last_name || ''}`.toLowerCase().trim();
          
          if (nameA && nameB) {
            const similarity = calculateSimilarity(nameA, nameB);
            if (similarity > 0.8 && nameA !== nameB) {
              matches.push({
                id: `name-${a.id}-${b.id}`,
                profile_a: a,
                profile_b: b,
                match_type: 'name',
                confidence: Math.round(similarity * 100),
                details: `Names are ${Math.round(similarity * 100)}% similar`,
              });
            }
          }

          // Same organization
          if (a.organization && b.organization && 
              a.organization.toLowerCase() === b.organization.toLowerCase()) {
            matches.push({
              id: `org-${a.id}-${b.id}`,
              profile_a: a,
              profile_b: b,
              match_type: 'organization',
              confidence: 60,
              details: `Both work at ${a.organization}`,
            });
          }
        }
      }

      // Check for matching emails/phones
      const methodMap = new Map<string, string[]>();
      contactMethods?.forEach(cm => {
        const key = `${cm.contact_type}:${cm.value.toLowerCase()}`;
        const existing = methodMap.get(key) || [];
        existing.push(cm.profile_id);
        methodMap.set(key, existing);
      });

      methodMap.forEach((profileIds, key) => {
        if (profileIds.length > 1) {
          const [type, value] = key.split(':');
          for (let i = 0; i < profileIds.length; i++) {
            for (let j = i + 1; j < profileIds.length; j++) {
              const a = profileList.find(p => p.id === profileIds[i]);
              const b = profileList.find(p => p.id === profileIds[j]);
              if (a && b) {
                matches.push({
                  id: `${type}-${a.id}-${b.id}`,
                  profile_a: a,
                  profile_b: b,
                  match_type: type as 'email' | 'phone',
                  confidence: 95,
                  details: `Share ${type}: ${value}`,
                });
              }
            }
          }
        }
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      return {
        matches: matches.slice(0, 50),
        totalProfiles: profileList.length,
        potentialDuplicates: new Set(matches.flatMap(m => [m.profile_a.id, m.profile_b.id])).size,
      };
    },
    enabled: !!user,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ profileAId, profileBId }: { profileAId: string; profileBId: string }) => {
      // Create a connection between profiles instead of merging
      const { error } = await supabase
        .from('connection_intelligence')
        .insert({
          user_id: user!.id,
          profile_a_id: profileAId,
          profile_b_id: profileBId,
          connection_type: 'entity_resolution',
          connection_strength: 100,
          confidence_score: 95,
          inferred_relationship: 'same_person_or_duplicate',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profiles linked successfully');
      queryClient.invalidateQueries({ queryKey: ['entity-resolution'] });
      setShowMergeDialog(false);
      setSelectedMatch(null);
    },
    onError: (error) => {
      toast.error('Failed to link profiles: ' + error.message);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ matchId }: { matchId: string }) => {
      // Store dismissed matches in local storage for now
      const dismissed = JSON.parse(localStorage.getItem('dismissed-matches') || '[]');
      dismissed.push(matchId);
      localStorage.setItem('dismissed-matches', JSON.stringify(dismissed));
    },
    onSuccess: () => {
      refetch();
      toast.success('Match dismissed');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const dismissedMatches = JSON.parse(localStorage.getItem('dismissed-matches') || '[]');
  const activeMatches = data?.matches.filter(m => !dismissedMatches.includes(m.id)) || [];

  const getMatchIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'organization': return <Building className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Entity Resolution
              </CardTitle>
              <CardDescription>
                Identify and resolve duplicate or related profiles
              </CardDescription>
            </div>
            <Badge variant="outline">
              {data?.totalProfiles || 0} profiles scanned
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activeMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-semibold">No duplicates detected</h3>
              <p className="text-sm text-muted-foreground">
                Your contact database appears clean
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm">
                  Found {activeMatches.length} potential matches across {data?.potentialDuplicates || 0} profiles
                </span>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {activeMatches.map(match => (
                    <div
                      key={match.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getMatchIcon(match.match_type)}
                          <Badge variant="outline" className="capitalize">
                            {match.match_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {match.details}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{match.confidence}%</span>
                          <Progress value={match.confidence} className="w-16 h-2" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1 p-2 rounded bg-muted/30">
                          <div className="font-medium">
                            {match.profile_a.first_name} {match.profile_a.last_name}
                          </div>
                          {match.profile_a.organization && (
                            <div className="text-xs text-muted-foreground">
                              {match.profile_a.organization}
                            </div>
                          )}
                        </div>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 p-2 rounded bg-muted/30">
                          <div className="font-medium">
                            {match.profile_b.first_name} {match.profile_b.last_name}
                          </div>
                          {match.profile_b.organization && (
                            <div className="text-xs text-muted-foreground">
                              {match.profile_b.organization}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMatch(match);
                            setShowMergeDialog(true);
                          }}
                        >
                          <Merge className="h-4 w-4 mr-1" />
                          Link Profiles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissMutation.mutate({ matchId: match.id })}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link Profiles</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a connection between these profiles, indicating they may be the same person or closely related.
              {selectedMatch && (
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-medium">
                      {selectedMatch.profile_a.first_name} {selectedMatch.profile_a.last_name}
                    </span>
                    <Link2 className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedMatch.profile_b.first_name} {selectedMatch.profile_b.last_name}
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMatch) {
                  linkMutation.mutate({
                    profileAId: selectedMatch.profile_a.id,
                    profileBId: selectedMatch.profile_b.id,
                  });
                }
              }}
              disabled={linkMutation.isPending}
            >
              {linkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Profiles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Levenshtein distance-based similarity
function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
