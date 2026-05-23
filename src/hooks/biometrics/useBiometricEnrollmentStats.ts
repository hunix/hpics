import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BiometricEnrollmentStats {
  [modalityId: string]: { total: number; completed: number };
}

export function useBiometricEnrollmentStats(modalityIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['biometric-enrollment-stats', user?.id, modalityIds.join(',')],
    enabled: !!user?.id,
    queryFn: async (): Promise<BiometricEnrollmentStats | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('biometric_enrollment_sessions')
        .select('session_type, status')
        .eq('user_id', user.id);
      if (error) throw error;

      const stats: BiometricEnrollmentStats = {};
      modalityIds.forEach((id) => { stats[id] = { total: 0, completed: 0 }; });

      (data ?? []).forEach((session) => {
        const type = (session.session_type as string | null | undefined)?.toLowerCase() || '';
        modalityIds.forEach((id) => {
          if (type.includes(id)) {
            stats[id].total++;
            if (session.status === 'completed') {
              stats[id].completed++;
            }
          }
        });
      });
      return stats;
    },
  });
}
