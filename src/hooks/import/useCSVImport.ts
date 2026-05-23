import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CSVRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  relationship_type?: string;
  notes?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
}

export function useCSVContactImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<ImportResult, Error, CSVRow[]>({
    mutationFn: async (rows) => {
      if (!user?.id) throw new Error('Not authenticated');
      const userId = user.id;

      let success = 0;
      let failed = 0;

      for (const row of rows) {
        if (!row.first_name) {
          failed++;
          continue;
        }
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              first_name: row.first_name,
              last_name: row.last_name ?? null,
              organization: row.organization ?? null,
              job_title: row.job_title ?? null,
              relationship_type: (row.relationship_type as string | undefined) ?? 'other',
              notes: row.notes ?? null,
            } as never)
            .select()
            .single();
          if (profileError || !profile) throw profileError ?? new Error('Insert failed');

          if (row.email) {
            await supabase.from('contact_methods').insert({
              profile_id: profile.id,
              contact_type: 'email',
              value: row.email,
              is_primary: true,
            } as never);
          }
          if (row.phone) {
            await supabase.from('contact_methods').insert({
              profile_id: profile.id,
              contact_type: 'phone',
              value: row.phone,
            } as never);
          }

          success++;
        } catch {
          failed++;
        }
      }

      return { success, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
