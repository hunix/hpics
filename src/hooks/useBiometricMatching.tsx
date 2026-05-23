import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { handleAIError } from '@/lib/aiErrorHandler';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface BiometricProfile {
  id: string;
  profile_id: string;
  facial_features: any;
  facial_landmarks: any;
  facial_sample_count: number;
  facial_confidence: number | null;
  facial_last_updated: string | null;
  voice_characteristics: any;
  voice_sample_count: number;
  voice_confidence: number | null;
  voice_last_updated: string | null;
  identity_confidence: number | null;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface BiometricSample {
  id: string;
  profile_id: string;
  biometric_type: 'face' | 'voice';
  source_type: string;
  source_url: string | null;
  quality_score: number | null;
  status: string;
  created_at: string;
}

interface BiometricMatch {
  id: string;
  source_type: string;
  source_id: string | null;
  match_type: 'face' | 'voice';
  matched_profile_id: string | null;
  confidence_score: number | null;
  alternative_matches: any;
  user_confirmed: boolean | null;
  auto_tagged: boolean;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useBiometricProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['biometric-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('contact_biometrics')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as unknown as BiometricProfile[];
    },
    enabled: !!user
  });
}

export function useBiometricSamples(profileId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['biometric-samples', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('biometric_samples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BiometricSample[];
    },
    enabled: !!user
  });
}

export function usePendingMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-biometric-matches', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('biometric_matches')
        .select(`
          *,
          profiles:matched_profile_id (id, first_name, last_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .is('user_confirmed', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as BiometricMatch[];
    },
    enabled: !!user
  });
}

export function useExtractFacialBiometrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      imageUrl, 
      profileId, 
      sourceType = 'media', 
      sourceId 
    }: { 
      imageUrl: string; 
      profileId: string; 
      sourceType?: string; 
      sourceId?: string; 
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-facial-biometrics', { imageUrl, profileId, sourceType, sourceId });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-samples', variables.profileId] });
      toast.success('Facial biometrics extracted successfully');
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(`Failed to extract facial biometrics: ${error.message}`);
      }
    }
  });
}

export function useExtractVoiceBiometrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      audioUrl, 
      profileId, 
      sourceType = 'voice_note', 
      sourceId,
      transcription
    }: { 
      audioUrl: string; 
      profileId: string; 
      sourceType?: string; 
      sourceId?: string;
      transcription?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-voice-biometrics', { audioUrl, profileId, sourceType, sourceId, transcription });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-samples', variables.profileId] });
      toast.success('Voice biometrics extracted successfully');
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(`Failed to extract voice biometrics: ${error.message}`);
      }
    }
  });
}

export function useMatchBiometrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mediaUrl, 
      matchType, 
      sourceType, 
      sourceId,
      autoTag = false,
      autoTagThreshold = 0.85
    }: { 
      mediaUrl: string; 
      matchType: 'face' | 'voice'; 
      sourceType?: string; 
      sourceId?: string;
      autoTag?: boolean;
      autoTagThreshold?: number;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('match-biometrics', { mediaUrl, matchType, sourceType, sourceId, autoTag, autoTagThreshold });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Matching failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-biometric-matches'] });
    }
  });
}

export function useConfirmMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      matchId, 
      confirmed, 
      correctedProfileId 
    }: { 
      matchId: string; 
      confirmed: boolean; 
      correctedProfileId?: string; 
    }) => {
      const { error } = await supabase
        .from('biometric_matches')
        .update({
          user_confirmed: confirmed,
          user_corrected_profile_id: correctedProfileId || null
        })
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-biometric-matches'] });
      toast.success('Match updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update match: ${error.message}`);
    }
  });
}

export function useDeleteBiometricSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sampleId: string) => {
      const { error } = await supabase
        .from('biometric_samples')
        .delete()
        .eq('id', sampleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-samples'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      toast.success('Sample deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete sample: ${error.message}`);
    }
  });
}

export function useBiometricStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['biometric-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [profilesResult, samplesResult, matchesResult, pendingResult] = await Promise.all([
        supabase
          .from('contact_biometrics')
          .select('id, facial_sample_count, voice_sample_count', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('biometric_samples')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'enrolled'),
        supabase
          .from('biometric_matches')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('biometric_matches')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .is('user_confirmed', null)
      ]);

      return {
        profilesWithBiometrics: profilesResult.count || 0,
        totalSamples: samplesResult.count || 0,
        totalMatches: matchesResult.count || 0,
        pendingReview: pendingResult.count || 0
      };
    },
    enabled: !!user
  });
}

/**
 * Hook to generate facial embeddings for a profile
 * This enables local vector matching without AI for high-confidence cases
 */
export function useGenerateFacialEmbedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      imageUrls,
      regenerate = false 
    }: { 
      profileId: string; 
      imageUrls?: string[];
      regenerate?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('generate-facial-embedding', { profileId, imageUrls, regenerate });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Embedding generation failed');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics', variables.profileId] });
      toast.success('Facial embedding generated');
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(`Failed to generate embedding: ${error.message}`);
      }
    }
  });
}

/**
 * Hook for LOCAL biometric matching (minimal AI cost)
 * 
 * Uses vector similarity for matching when embeddings exist.
 * Falls back to cheapest AI model only when needed.
 * 
 * Confidence levels:
 * - HIGH (≥0.85): Auto-tags if enabled
 * - MEDIUM (0.60-0.84): Returns for user confirmation
 * - LOW (<0.60): Manual review recommended
 */
export function useLocalBiometricMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      imageUrl,
      sourceType = 'media',
      sourceId,
      autoTagHighConfidence = true,
      highConfidenceThreshold = 0.85,
      mediumConfidenceThreshold = 0.60
    }: { 
      imageUrl: string;
      sourceType?: string;
      sourceId?: string;
      autoTagHighConfidence?: boolean;
      highConfidenceThreshold?: number;
      mediumConfidenceThreshold?: number;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('local-biometric-match', { 
          imageUrl, 
          sourceType, 
          sourceId,
          autoTagHighConfidence,
          highConfidenceThreshold,
          mediumConfidenceThreshold
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Matching failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-biometric-matches'] });
      queryClient.invalidateQueries({ queryKey: ['media-contact-tags'] });
      
      if (data.autoTagged) {
        toast.success(`Auto-tagged: ${data.bestMatch?.profileName} (${Math.round(data.bestMatch?.confidence * 100)}% confidence)`);
      } else if (data.requiresConfirmation && data.bestMatch) {
        toast.info(`Possible match: ${data.bestMatch?.profileName} - please confirm`);
      }
    },
    onError: (error: any) => {
      if (!handleAIError(error).handled) {
        toast.error(`Matching failed: ${error.message}`);
      }
    }
  });
}

/**
 * Hook to batch scan media for faces and match against enrolled profiles
 */
export function useBatchBiometricScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mediaIds,
      autoTagHighConfidence = true 
    }: { 
      mediaIds: string[];
      autoTagHighConfidence?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get signed URLs for all media
      const { data: mediaItems, error: mediaError } = await supabase
        .from('media')
        .select('id, storage_path')
        .in('id', mediaIds);

      if (mediaError) throw mediaError;

      const results = [];
      for (const media of mediaItems || []) {
        try {
          // Get signed URL
          const { data: signedData } = await supabase.storage
            .from('contact-media')
            .createSignedUrl(media.storage_path, 300);

          if (!signedData?.signedUrl) continue;

          // Call local matching
          const { data, error } = await invokeFunction('local-biometric-match', { 
              imageUrl: signedData.signedUrl, 
              sourceType: 'media', 
              sourceId: media.id,
              autoTagHighConfidence
            });

          if (!error && data?.success) {
            results.push({
              mediaId: media.id,
              ...data
            });
          }
        } catch (e) {
          console.error(`Failed to scan media ${media.id}:`, e);
        }
      }

      return { 
        scanned: mediaIds.length, 
        results,
        autoTagged: results.filter(r => r.autoTagged).length,
        requiresReview: results.filter(r => r.requiresConfirmation).length
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-biometric-matches'] });
      queryClient.invalidateQueries({ queryKey: ['media-contact-tags'] });
      toast.success(`Scanned ${data.scanned} items: ${data.autoTagged} auto-tagged, ${data.requiresReview} need review`);
    },
    onError: (error: any) => {
      toast.error(`Batch scan failed: ${error.message}`);
    }
  });
}
