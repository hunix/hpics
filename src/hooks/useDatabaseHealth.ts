/**
 * Database Health Hook
 * Provides health metrics and cleanup operations for database maintenance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseHealthMetrics {
  duplicateGroups: number;
  staleBulkItems: number;
  totalProfiles: number;
  lonelyProfiles: number;
  totalMedia: number;
  orphanedMedia: number;
}

export interface DuplicateGroup {
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

export function useDatabaseHealth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch health metrics
  const healthQuery = useQuery({
    queryKey: ['database-health', user?.id],
    queryFn: async (): Promise<DatabaseHealthMetrics> => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase.rpc('get_database_health_metrics', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const row = (data as unknown as Array<Record<string, unknown>>)?.[0] || {};
      return {
        duplicateGroups: Number(row.duplicate_groups) || 0,
        staleBulkItems: Number(row.stale_bulk_items) || 0,
        totalProfiles: Number(row.total_profiles) || 0,
        lonelyProfiles: Number(row.lonely_profiles) || 0,
        totalMedia: Number(row.total_media) || 0,
        orphanedMedia: Number(row.orphaned_media) || 0,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch duplicate groups with details
  const duplicatesQuery = useQuery({
    queryKey: ['duplicate-profiles-detailed', user?.id],
    queryFn: async (): Promise<DuplicateGroup[]> => {
      if (!user) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, relationship_type, created_at')
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;

      // Group by normalized name
      const groups = new Map<string, typeof profiles>();
      for (const profile of profiles || []) {
        const key = `${profile.first_name?.toLowerCase() || ''} ${profile.last_name?.toLowerCase() || ''}`.trim();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(profile);
      }

      // Filter to duplicates and enrich
      const duplicateGroups: DuplicateGroup[] = [];
      for (const [name, profileList] of groups) {
        if (profileList.length >= 2) {
          const enrichedProfiles = await Promise.all(
            profileList.map(async (profile) => {
              const [relResult, mediaResult, docResult] = await Promise.all([
                supabase.from('contact_relationships').select('id', { count: 'exact', head: true })
                  .or(`from_profile_id.eq.${profile.id},to_profile_id.eq.${profile.id}`).eq('user_id', user.id),
                supabase.from('media').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
                supabase.from('documents').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
              ]);
              return {
                ...profile,
                relationshipCount: relResult.count || 0,
                mediaCount: mediaResult.count || 0,
                documentCount: docResult.count || 0,
              };
            })
          );
          duplicateGroups.push({ name: name || 'Unknown', profiles: enrichedProfiles });
        }
      }
      return duplicateGroups;
    },
    enabled: !!user,
  });

  // Cleanup stale bulk items
  const cleanupStaleMutation = useMutation({
    mutationFn: async (daysOld: number = 3) => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase.rpc('cleanup_stale_bulk_items', {
        p_user_id: user.id,
        p_days_old: daysOld,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast({ title: 'Cleanup complete', description: `Removed ${count} stale items` });
      queryClient.invalidateQueries({ queryKey: ['database-health'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-analysis'] });
    },
    onError: (error) => {
      toast({ title: 'Cleanup failed', description: error.message, variant: 'destructive' });
    },
  });

  // Batch merge all duplicates
  const batchMergeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase.rpc('batch_merge_duplicates', {
        p_user_id: user.id,
      });
      if (error) throw error;
      return data?.[0] as { merged_count: number; groups_processed: number };
    },
    onSuccess: (result) => {
      toast({
        title: 'Batch merge complete',
        description: `Merged ${result?.merged_count || 0} profiles from ${result?.groups_processed || 0} groups`,
      });
      queryClient.invalidateQueries({ queryKey: ['database-health'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast({ title: 'Batch merge failed', description: error.message, variant: 'destructive' });
    },
  });

  // Merge single duplicate group
  const mergeGroupMutation = useMutation({
    mutationFn: async ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) => {
      if (!user) throw new Error('No user');
      for (const dupId of duplicateIds) {
        const { error } = await supabase.rpc('merge_duplicate_profiles', {
          p_primary_id: primaryId,
          p_duplicate_id: dupId,
          p_user_id: user.id,
        });
        if (error) throw error;
      }
      return duplicateIds.length;
    },
    onSuccess: (count) => {
      toast({ title: 'Group merged', description: `Merged ${count} duplicate profiles` });
      queryClient.invalidateQueries({ queryKey: ['database-health'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      toast({ title: 'Merge failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    health: healthQuery.data,
    isLoading: healthQuery.isLoading,
    refetch: healthQuery.refetch,
    duplicates: duplicatesQuery.data,
    duplicatesLoading: duplicatesQuery.isLoading,
    cleanupStale: cleanupStaleMutation,
    batchMerge: batchMergeMutation,
    mergeGroup: mergeGroupMutation,
  };
}
