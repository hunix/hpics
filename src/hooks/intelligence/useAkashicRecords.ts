import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface ImplicitKnowledge {
  id: string;
  userId: string;
  profileId?: string;
  knowledgeType: string;
  knowledgeContent: Record<string, unknown>;
  confidenceScore: number;
  sourcePatterns: string[];
  applicationDomains: string[];
  createdAt: string;
}

export interface AncestralPattern {
  id: string;
  userId: string;
  profileId?: string;
  patternType: string;
  patternDescription: string;
  manifestations: string[];
  strength: number;
  transformationPotential: number;
  createdAt: string;
}

export interface HiddenConnection {
  id: string;
  userId: string;
  profileId?: string;
  connectionType: string;
  connectedEntities: string[];
  connectionDescription: string;
  strength: number;
  exploitabilityScore: number;
  createdAt: string;
}

export function useAkashicRecords(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: implicitKnowledge, isLoading: knowledgeLoading } = useQuery({
    queryKey: ['implicit-knowledge', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implicit_knowledge')
        .select('*')
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        knowledgeType: (row.knowledge_type || row.knowledge_domain || '') as string,
        knowledgeContent: (row.knowledge_content || row.implicit_content || {}) as Record<string, unknown>,
        confidenceScore: (row.confidence_score || 0) as number,
        sourcePatterns: (row.source_patterns || row.source_fragments || []) as string[],
        applicationDomains: (row.application_domains || []) as string[],
        createdAt: row.created_at as string
      })) as ImplicitKnowledge[];
    },
    enabled: !!user,
  });

  const { data: ancestralPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['ancestral-patterns', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ancestral_patterns')
        .select('*')
        .order('inheritance_strength', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        patternType: (row.pattern_type || '') as string,
        patternDescription: (row.pattern_name || '') as string,
        manifestations: [] as string[],
        strength: (row.inheritance_strength || 0) as number,
        transformationPotential: (row.breaking_potential || 0) as number,
        createdAt: row.created_at as string
      })) as AncestralPattern[];
    },
    enabled: !!user,
  });

  const { data: hiddenConnections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['hidden-connections', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hidden_connections')
        .select('*')
        .order('significance_score', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: '' as string,
        connectionType: (row.connection_type || '') as string,
        connectedEntities: [row.entity_a_id, row.entity_b_id].filter(Boolean) as string[],
        connectionDescription: '' as string,
        strength: (row.significance_score || 0) as number,
        exploitabilityScore: (row.significance_score || 0) as number,
        createdAt: row.created_at as string
      })) as HiddenConnection[];
    },
    enabled: !!user,
  });

  const queryAkashic = useMutation({
    mutationFn: async (input: { profileId: string; queryType?: 'comprehensive' | 'focused'; queryFocus?: string }) => {
      const { data, error } = await invokeFunction('akashic-query-engine', {
          userId: user!.id,
          profileId: input.profileId,
          queryType: input.queryType || 'comprehensive',
          queryFocus: input.queryFocus
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implicit-knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['ancestral-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['hidden-connections'] });
    }
  });

  return {
    implicitKnowledge,
    ancestralPatterns,
    hiddenConnections,
    isLoading: knowledgeLoading || patternsLoading || connectionsLoading,
    queryAkashic: queryAkashic.mutateAsync,
    isQuerying: queryAkashic.isPending,
    highConfidenceKnowledge: implicitKnowledge?.filter(k => k.confidenceScore > 0.8) || [],
    exploitableConnections: hiddenConnections?.filter(c => c.exploitabilityScore > 0.7) || []
  };
}
