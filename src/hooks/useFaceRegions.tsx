import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FaceRegion {
  id: string;
  user_id: string;
  media_id: string;
  profile_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'circle' | 'square';
  cropped_storage_path: string | null;
  cropped_thumbnail_url: string | null;
  detection_method: 'manual' | 'local_ai' | 'cloud_ai' | 'mosaic';
  confidence: number | null;
  verified: boolean;
  embedding: string | null;
  descriptor: string | null;
  features: Record<string, unknown> | null;
  status: 'pending' | 'cropped' | 'analyzed' | 'matched' | 'failed';
  error_message: string | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateFaceRegionInput {
  media_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'circle' | 'square';
  profile_id?: string;
  detection_method?: 'manual' | 'local_ai' | 'cloud_ai' | 'mosaic';
  confidence?: number;
  descriptor?: string;
  features?: Record<string, unknown>;
}

export function useFaceRegions(mediaId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch face regions for a specific media item
  const { data: regions, isLoading, error, refetch } = useQuery({
    queryKey: ['face-regions', mediaId],
    queryFn: async () => {
      if (!mediaId || !user) return [];

      const { data, error } = await supabase
        .from('face_regions')
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `)
        .eq('media_id', mediaId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as FaceRegion[];
    },
    enabled: !!mediaId && !!user,
  });

  // Create a new face region
  const createRegion = useMutation({
    mutationFn: async (input: CreateFaceRegionInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_regions')
        .insert({
          user_id: user.id,
          media_id: input.media_id,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          shape: input.shape,
          profile_id: input.profile_id || null,
          detection_method: input.detection_method || 'manual',
          confidence: input.confidence || null,
          descriptor: input.descriptor || null,
          features: input.features || null,
          status: 'pending',
          verified: input.detection_method === 'manual',
        })
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as FaceRegion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['face-regions', data.media_id] });
      toast.success('Face region saved');
    },
    onError: (error) => {
      console.error('Failed to create face region:', error);
      toast.error('Failed to save face region');
    },
  });

  // Create multiple face regions (batch)
  const createRegions = useMutation({
    mutationFn: async (inputs: CreateFaceRegionInput[]) => {
      if (!user) throw new Error('Not authenticated');

      const regionsToInsert = inputs.map(input => ({
        user_id: user.id,
        media_id: input.media_id,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        shape: input.shape,
        profile_id: input.profile_id || null,
        detection_method: input.detection_method || 'manual',
        confidence: input.confidence || null,
        descriptor: input.descriptor || null,
        features: input.features || null,
        status: 'pending',
        verified: input.detection_method === 'manual',
      }));

      const { data, error } = await supabase
        .from('face_regions')
        .insert(regionsToInsert)
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `);

      if (error) throw error;
      return (data || []) as FaceRegion[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['face-regions', data[0].media_id] });
      }
      toast.success(`${data.length} face regions saved`);
    },
    onError: (error) => {
      console.error('Failed to create face regions:', error);
      toast.error('Failed to save face regions');
    },
  });

  // Update a face region
  const updateRegion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FaceRegion> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_regions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as FaceRegion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['face-regions', data.media_id] });
    },
    onError: (error) => {
      console.error('Failed to update face region:', error);
      toast.error('Failed to update face region');
    },
  });

  // Delete a face region
  const deleteRegion = useMutation({
    mutationFn: async (regionId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('face_regions')
        .delete()
        .eq('id', regionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return regionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-regions', mediaId] });
      toast.success('Face region deleted');
    },
    onError: (error) => {
      console.error('Failed to delete face region:', error);
      toast.error('Failed to delete face region');
    },
  });

  // Assign a profile to a face region
  const assignProfile = useMutation({
    mutationFn: async ({ regionId, profileId }: { regionId: string; profileId: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_regions')
        .update({ 
          profile_id: profileId,
          verified: true,
        })
        .eq('id', regionId)
        .eq('user_id', user.id)
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as FaceRegion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['face-regions', data.media_id] });
      toast.success(data.profile_id ? 'Profile assigned' : 'Profile unassigned');
    },
    onError: (error) => {
      console.error('Failed to assign profile:', error);
      toast.error('Failed to assign profile');
    },
  });

  // Verify a face region (confirm auto-detection is correct)
  const verifyRegion = useMutation({
    mutationFn: async (regionId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_regions')
        .update({ verified: true })
        .eq('id', regionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as FaceRegion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-regions', mediaId] });
      toast.success('Face region verified');
    },
  });

  return {
    regions: regions || [],
    isLoading,
    error,
    refetch,
    createRegion,
    createRegions,
    updateRegion,
    deleteRegion,
    assignProfile,
    verifyRegion,
  };
}

// Hook for fetching all face regions for a user (across all media)
export function useAllFaceRegions(options?: { 
  status?: string; 
  profileId?: string;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-face-regions', options],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('face_regions')
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url),
          media:media(id, storage_path, thumbnail_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.profileId) {
        query = query.eq('profile_id', options.profileId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Hook for face regions statistics
export function useFaceRegionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['face-region-stats'],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('face_regions')
        .select('status, detection_method, verified, profile_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byStatus: {} as Record<string, number>,
        byMethod: {} as Record<string, number>,
        verified: 0,
        unverified: 0,
        matched: 0,
        unmatched: 0,
      };

      data?.forEach(region => {
        stats.byStatus[region.status] = (stats.byStatus[region.status] || 0) + 1;
        stats.byMethod[region.detection_method] = (stats.byMethod[region.detection_method] || 0) + 1;
        if (region.verified) stats.verified++;
        else stats.unverified++;
        if (region.profile_id) stats.matched++;
        else stats.unmatched++;
      });

      return stats;
    },
    enabled: !!user,
  });
}
