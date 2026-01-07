import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface EntityLink {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  confidence_score: number;
  evidence: Record<string, any> | null;
  is_confirmed: boolean;
  discovered_at: string;
  verified_at: string | null;
}

interface CrossReference {
  id: string;
  profile_id: string;
  reference_type: string;
  reference_value: string;
  normalized_value: string;
  source: string;
  confidence: number;
  metadata: Record<string, any> | null;
}

export function useCrossReference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch entity links for a profile
  const useProfileLinks = (profileId: string) => {
    return useQuery({
      queryKey: ['entity-links', profileId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('entity_links')
          .select('*')
          .or(`source_id.eq.${profileId},target_id.eq.${profileId}`)
          .eq('user_id', user!.id);

        if (error) throw error;
        return data as EntityLink[];
      },
      enabled: !!user && !!profileId,
    });
  };

  // Fetch cross references for a profile
  const useProfileCrossRefs = (profileId: string) => {
    return useQuery({
      queryKey: ['cross-references', profileId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('cross_references')
          .select('*')
          .eq('profile_id', profileId)
          .eq('user_id', user!.id);

        if (error) throw error;
        return data as CrossReference[];
      },
      enabled: !!user && !!profileId,
    });
  };

  // Run cross-reference analysis
  const runAnalysis = useCallback(
    async (profileId?: string, fullScan?: boolean) => {
      if (!user) return null;

      setIsAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          'cross-reference-analysis',
          {
            body: {
              profile_id: profileId,
              full_scan: fullScan,
            },
          }
        );

        if (error) throw error;

        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['entity-links'] });
        queryClient.invalidateQueries({ queryKey: ['cross-references'] });

        toast.success(
          `Analyzed ${data.profiles_analyzed} profiles, found ${data.entity_links_created} connections`
        );

        return data;
      } catch (error) {
        console.error('Cross-reference analysis failed:', error);
        toast.error('Analysis failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [user, queryClient]
  );

  // Confirm an entity link
  const confirmLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('entity_links')
        .update({
          is_confirmed: true,
          verified_by: user!.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-links'] });
      toast.success('Link confirmed');
    },
  });

  // Reject an entity link
  const rejectLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('entity_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-links'] });
      toast.success('Link removed');
    },
  });

  // Find matching profiles by reference
  const findMatches = useCallback(
    async (
      referenceType: string,
      value: string
    ): Promise<{ profile_id: string; confidence: number; source: string }[]> => {
      if (!user) return [];

      // Normalize the value based on type
      let normalizedValue = value;
      if (referenceType === 'phone') {
        normalizedValue = value.replace(/\D/g, '').slice(-10);
      } else if (referenceType === 'email') {
        normalizedValue = value.toLowerCase().trim();
      }

      const { data, error } = await supabase
        .from('cross_references')
        .select('profile_id, confidence, source')
        .eq('reference_type', referenceType)
        .eq('normalized_value', normalizedValue)
        .eq('user_id', user.id);

      if (error) {
        console.error('Match lookup failed:', error);
        return [];
      }

      return data || [];
    },
    [user]
  );

  // Get network graph data
  const getNetworkGraph = useCallback(
    async (profileId: string) => {
      if (!user) return { nodes: [], edges: [] };

      // Get all links involving this profile
      const { data: links } = await supabase
        .from('entity_links')
        .select('*')
        .or(`source_id.eq.${profileId},target_id.eq.${profileId}`)
        .eq('user_id', user.id);

      if (!links) return { nodes: [], edges: [] };

      // Collect unique profile IDs
      const profileIds = new Set<string>();
      profileIds.add(profileId);
      for (const link of links) {
        if (link.source_type === 'profile') profileIds.add(link.source_id);
        if (link.target_type === 'profile') profileIds.add(link.target_id);
      }

      // Fetch profile details
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(profileIds));

      const nodes = (profiles || []).map((p) => ({
        id: p.id,
        label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
        avatar: p.avatar_url,
        isCenter: p.id === profileId,
      }));

      const edges = links
        .filter((l) => l.source_type === 'profile' && l.target_type === 'profile')
        .map((l) => ({
          source: l.source_id,
          target: l.target_id,
          type: l.link_type,
          confidence: l.confidence_score,
          confirmed: l.is_confirmed,
        }));

      return { nodes, edges };
    },
    [user]
  );

  return {
    useProfileLinks,
    useProfileCrossRefs,
    runAnalysis,
    confirmLink: confirmLinkMutation.mutate,
    rejectLink: rejectLinkMutation.mutate,
    findMatches,
    getNetworkGraph,
    isAnalyzing,
  };
}
