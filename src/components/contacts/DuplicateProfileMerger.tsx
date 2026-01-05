import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Merge, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface DuplicateGroup {
  name: string;
  profiles: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    organization: string | null;
    relationship_type: string | null;
    created_at: string;
    relationshipCount: number;
    mediaCount: number;
    documentCount: number;
  }>;
}

export function DuplicateProfileMerger() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['duplicate-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, relationship_type, created_at')
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;

      // Group by normalized name (first + last, case-insensitive)
      const groups = new Map<string, typeof profiles>();
      
      for (const profile of profiles || []) {
        const key = `${profile.first_name?.toLowerCase() || ''} ${profile.last_name?.toLowerCase() || ''}`.trim();
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(profile);
      }

      // Filter to only groups with 2+ profiles (potential duplicates)
      const duplicateGroups: DuplicateGroup[] = [];
      
      for (const [name, profileList] of groups) {
        if (profileList.length >= 2) {
          // Fetch counts for each profile
          const enrichedProfiles = await Promise.all(
            profileList.map(async (profile) => {
              const [relResult, mediaResult, docResult] = await Promise.all([
                supabase
                  .from('contact_relationships')
                  .select('id', { count: 'exact', head: true })
                  .or(`from_profile_id.eq.${profile.id},to_profile_id.eq.${profile.id}`)
                  .eq('user_id', user.id),
                supabase
                  .from('media')
                  .select('id', { count: 'exact', head: true })
                  .eq('profile_id', profile.id),
                supabase
                  .from('documents')
                  .select('id', { count: 'exact', head: true })
                  .eq('profile_id', profile.id),
              ]);

              return {
                ...profile,
                relationshipCount: relResult.count || 0,
                mediaCount: mediaResult.count || 0,
                documentCount: docResult.count || 0,
              };
            })
          );

          duplicateGroups.push({
            name: name || 'Unknown',
            profiles: enrichedProfiles,
          });
        }
      }

      return duplicateGroups;
    },
    enabled: !!user,
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) => {
      const { data, error } = await supabase.rpc('merge_duplicate_profiles', {
        p_primary_id: primaryId,
        p_duplicate_id: duplicateId,
        p_user_id: user!.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Profiles merged successfully' });
      queryClient.invalidateQueries({ queryKey: ['duplicate-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
      setShowMergeDialog(false);
      setSelectedGroup(null);
      setPrimaryId(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Merge failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleMerge = () => {
    if (!selectedGroup || !primaryId) return;
    
    // Merge all other profiles into primary
    const duplicateIds = selectedGroup.profiles
      .filter(p => p.id !== primaryId)
      .map(p => p.id);

    // Merge one at a time
    const mergeNext = async (index: number) => {
      if (index >= duplicateIds.length) return;
      await mergeMutation.mutateAsync({ primaryId, duplicateId: duplicateIds[index] });
      if (index + 1 < duplicateIds.length) {
        mergeNext(index + 1);
      }
    };

    mergeNext(0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const duplicateCount = duplicates?.length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Profiles
            {duplicateCount > 0 && (
              <Badge variant="destructive">{duplicateCount} found</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Find and merge duplicate contacts to keep your data clean
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicateCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-semibold">No duplicates found</h3>
              <p className="text-sm text-muted-foreground">
                Your contact list is clean!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates?.map((group) => (
                <div 
                  key={group.name} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium capitalize">{group.name}</span>
                      <Badge variant="secondary">{group.profiles.length} profiles</Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        // Auto-select the profile with most data as primary
                        const sorted = [...group.profiles].sort((a, b) => {
                          const scoreA = a.relationshipCount + a.mediaCount + a.documentCount;
                          const scoreB = b.relationshipCount + b.mediaCount + b.documentCount;
                          return scoreB - scoreA;
                        });
                        setPrimaryId(sorted[0].id);
                        setShowMergeDialog(true);
                      }}
                    >
                      <Merge className="h-4 w-4 mr-1" />
                      Merge
                    </Button>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {group.profiles.map((profile) => (
                      <div 
                        key={profile.id}
                        className="flex items-center justify-between bg-muted/30 rounded px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{profile.first_name} {profile.last_name}</span>
                          {profile.organization && (
                            <span className="text-muted-foreground">@ {profile.organization}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{profile.relationshipCount} rel</span>
                          <span>{profile.mediaCount} media</span>
                          <span>{profile.documentCount} docs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Duplicate Profiles</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Select the primary profile to keep. All data from other profiles will be merged into it.
              </p>
              {selectedGroup && (
                <div className="space-y-2 mt-4">
                  {selectedGroup.profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setPrimaryId(profile.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        primaryId === profile.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{profile.first_name} {profile.last_name}</span>
                          {profile.organization && (
                            <span className="text-muted-foreground ml-2">@ {profile.organization}</span>
                          )}
                        </div>
                        {primaryId === profile.id && (
                          <Badge>Primary</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profile.relationshipCount} relationships • {profile.mediaCount} media • {profile.documentCount} documents
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMerge}
              disabled={!primaryId || mergeMutation.isPending}
            >
              {mergeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Merge Profiles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
