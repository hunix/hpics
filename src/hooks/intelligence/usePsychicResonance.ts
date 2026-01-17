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
        .order('resonance_strength', { ascending: false });

      if (profileId) {
        query = query.or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        sourceProfileId: row.source_profile_id,
        targetProfileId: row.target_profile_id,
        resonanceType: row.resonance_type,
        resonanceStrength: row.resonance_strength || 0,
        bidirectional: row.bidirectional || false,
        dominantFrequency: row.dominant_frequency || '',
        vulnerabilityExposure: row.vulnerability_exposure || 0,
        createdAt: row.created_at
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
        .order('severity', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        vulnerabilityType: row.vulnerability_type,
        description: row.description || '',
        severity: row.severity || 0,
        triggers: row.triggers || [],
        exploitationVectors: row.exploitation_vectors || [],
        healingPotential: row.healing_potential || 0,
        createdAt: row.created_at
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
        .order('amplitude', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        cascadeType: row.cascade_type,
        originPoint: row.origin_point || '',
        propagationPath: row.propagation_path || [],
        amplitude: row.amplitude || 0,
        estimatedDuration: row.estimated_duration || '',
        interventionPoints: row.intervention_points || [],
        createdAt: row.created_at
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
