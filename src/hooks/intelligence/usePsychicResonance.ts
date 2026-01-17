import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ResonanceConnection {
  id: string;
  userId: string;
  sourceProfileId?: string;
  targetProfileId?: string;
  resonanceType: string;
  resonanceStrength: number;
  bidirectional: boolean;
  dominantFrequency: string;
  vulnerabilityExposure: number;
  createdAt: string;
}

export interface EmpathicVulnerability {
  id: string;
  userId: string;
  profileId?: string;
  vulnerabilityType: string;
  description: string;
  severity: number;
  triggers: string[];
  exploitationVectors: string[];
  healingPotential: number;
  createdAt: string;
}

export interface EmotionalCascade {
  id: string;
  userId: string;
  profileId?: string;
  cascadeType: string;
  originPoint: string;
  propagationPath: string[];
  amplitude: number;
  estimatedDuration: string;
  interventionPoints: string[];
  createdAt: string;
}

export function usePsychicResonance(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['resonance-connections', profileId],
    queryFn: async () => {
      let query = supabase
        .from('resonance_connections')
        .select('*')
        .order('connection_strength', { ascending: false });

      if (profileId) {
        query = query.or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        sourceProfileId: row.source_profile_id as string,
        targetProfileId: row.target_profile_id as string,
        resonanceType: (row.resonance_type || '') as string,
        resonanceStrength: (row.connection_strength || 0) as number,
        bidirectional: (row.bidirectional || false) as boolean,
        dominantFrequency: '' as string,
        vulnerabilityExposure: 0 as number,
        createdAt: row.created_at as string
      })) as ResonanceConnection[];
    },
    enabled: !!user,
  });

  const { data: vulnerabilities, isLoading: vulnerabilitiesLoading } = useQuery({
    queryKey: ['empathic-vulnerabilities', profileId],
    queryFn: async () => {
      let query = supabase
        .from('empathic_vulnerabilities')
        .select('*')
        .order('overwhelm_threshold', { ascending: true });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        vulnerabilityType: (row.vulnerability_type || '') as string,
        description: '' as string,
        severity: (row.absorption_rate || 0) as number,
        triggers: [] as string[],
        exploitationVectors: [] as string[],
        healingPotential: (row.protective_capacity || 0) as number,
        createdAt: row.created_at as string
      })) as EmpathicVulnerability[];
    },
    enabled: !!user,
  });

  const { data: cascades, isLoading: cascadesLoading } = useQuery({
    queryKey: ['emotional-cascades', profileId],
    queryFn: async () => {
      let query = supabase
        .from('emotional_cascades')
        .select('*')
        .order('amplification_factor', { ascending: false });

      if (profileId) {
        query = query.eq('origin_profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.origin_profile_id as string,
        cascadeType: (row.emotion_type || '') as string,
        originPoint: (row.origin_profile_id || '') as string,
        propagationPath: (row.cascade_path || []) as string[],
        amplitude: (row.amplification_factor || 0) as number,
        estimatedDuration: '' as string,
        interventionPoints: [] as string[],
        createdAt: row.initiated_at as string
      })) as EmotionalCascade[];
    },
    enabled: !!user,
  });

  const mapResonance = useMutation({
    mutationFn: async (input: { profileId: string; mappingDepth?: 'surface' | 'deep' | 'abyssal' }) => {
      const { data, error } = await supabase.functions.invoke('psychic-resonance-mapper', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          mappingDepth: input.mappingDepth || 'deep'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resonance-connections'] });
      queryClient.invalidateQueries({ queryKey: ['empathic-vulnerabilities'] });
      queryClient.invalidateQueries({ queryKey: ['emotional-cascades'] });
    }
  });

  return {
    connections,
    vulnerabilities,
    cascades,
    isLoading: connectionsLoading || vulnerabilitiesLoading || cascadesLoading,
    mapResonance: mapResonance.mutateAsync,
    isMapping: mapResonance.isPending,
    strongConnections: connections?.filter(c => c.resonanceStrength > 0.7) || [],
    severeVulnerabilities: vulnerabilities?.filter(v => v.severity > 0.7) || [],
    highAmplitudeCascades: cascades?.filter(c => c.amplitude > 0.7) || []
  };
}
