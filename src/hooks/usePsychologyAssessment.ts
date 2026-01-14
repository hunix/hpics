import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PsychologyAssessment {
  id: string;
  profile_id: string;
  user_id: string;
  assessment_type: string;
  dark_triad_scores: {
    narcissism: number;
    machiavellianism: number;
    psychopathy: number;
    overall: number;
  } | null;
  cognitive_biases: any;
  influence_susceptibility: any;
  vulnerability_profile: any;
  influence_resistance: any;
  exploitation_playbook: any;
  risk_level: string | null;
  confidence_score: number | null;
  source_data: any;
  created_at: string;
  updated_at: string;
}

export function usePsychologyAssessments(profileId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['psychology-assessments', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('psychology_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PsychologyAssessment[];
    },
    enabled: !!user
  });
}

export function useLatestPsychologyAssessment(profileId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['psychology-assessment-latest', profileId, user?.id],
    queryFn: async () => {
      if (!user || !profileId) return null;

      const { data, error } = await supabase
        .from('psychology_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as PsychologyAssessment | null;
    },
    enabled: !!user && !!profileId
  });
}

export function useCreatePsychologyAssessment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (assessment: {
      profile_id: string;
      assessment_type: string;
      dark_triad_scores?: any;
      cognitive_biases?: any;
      influence_susceptibility?: any;
      vulnerability_profile?: any;
      influence_resistance?: any;
      exploitation_playbook?: any;
      risk_level?: string;
      confidence_score?: number;
      source_data?: any;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('psychology_assessments')
        .insert({
          ...assessment,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['psychology-assessments', variables.profile_id] });
      queryClient.invalidateQueries({ queryKey: ['psychology-assessment-latest', variables.profile_id] });
      toast.success('Psychology assessment saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save assessment: ${error.message}`);
    }
  });
}

export function useUpdatePsychologyAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      profileId,
      updates 
    }: { 
      id: string; 
      profileId: string;
      updates: Partial<PsychologyAssessment>;
    }) => {
      const { data, error } = await supabase
        .from('psychology_assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['psychology-assessments', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['psychology-assessment-latest', variables.profileId] });
      toast.success('Assessment updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update assessment: ${error.message}`);
    }
  });
}

export function useDarkTriadScore(profileId: string) {
  const { data: assessment } = useLatestPsychologyAssessment(profileId);
  
  return {
    scores: assessment?.dark_triad_scores ?? null,
    confidence: assessment?.confidence_score ?? null,
    riskLevel: assessment?.risk_level ?? null,
    updatedAt: assessment?.updated_at ?? null
  };
}

export function useInfluenceProfile(profileId: string) {
  const { data: assessment } = useLatestPsychologyAssessment(profileId);
  
  return {
    susceptibility: assessment?.influence_susceptibility ?? null,
    resistance: assessment?.influence_resistance ?? null,
    vulnerabilities: assessment?.vulnerability_profile ?? null,
    exploitationPlaybook: assessment?.exploitation_playbook ?? null
  };
}

export function useDeletePsychologyAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileId }: { id: string; profileId: string }) => {
      const { error } = await supabase
        .from('psychology_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['psychology-assessments', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['psychology-assessment-latest', variables.profileId] });
      toast.success('Assessment deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete assessment: ${error.message}`);
    }
  });
}
