import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ExtractedContactInfo {
  names?: string[];
  phone_numbers?: string[];
  emails?: string[];
  urls?: string[];
  addresses?: string[];
}

export interface LinkedProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  full_name: string;
}

export interface ExtractedDocument {
  id: string;
  user_id: string;
  profile_id: string | null;
  suggested_profile_id: string | null;
  document_type: string;
  linked_status: 'pending' | 'auto_linked' | 'manually_linked' | 'ignored' | string;
  linked_at: string | null;
  raw_text: string | null;
  created_at: string;
  extracted_contact_info: unknown;
  extracted_contact: ExtractedContactInfo | null;
  linked_profile_data: LinkedProfile | null;
  suggested_profile: { id: string; full_name: string } | null;
  [key: string]: unknown;
}

const documentKeys = {
  all: ['extracted-documents'] as const,
  list: (profileId?: string, type?: string, status?: string, q?: string) =>
    [...documentKeys.all, profileId ?? null, type ?? 'all', status ?? 'all', q ?? ''] as const,
  counts: (profileId?: string) => [...documentKeys.all, 'counts', profileId ?? null] as const,
  profilesForLinking: (userId?: string) => ['profiles-for-doc-linking', userId] as const,
};

export interface UseExtractedDocumentsOptions {
  profileId?: string;
  type?: string;
  status?: string;
  search?: string;
}

export function useExtractedDocuments(opts: UseExtractedDocumentsOptions = {}) {
  const { user } = useAuth();
  const { profileId, type = 'all', status = 'all', search = '' } = opts;

  return useQuery<ExtractedDocument[]>({
    queryKey: documentKeys.list(profileId, type, status, search),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('extracted_documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (profileId) query = query.eq('profile_id', profileId);
      if (type !== 'all') query = query.eq('document_type', type);
      if (status !== 'all') query = query.eq('linked_status', status);
      if (search) query = query.ilike('raw_text', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      const profileIds = [...new Set(data?.map(d => d.profile_id).filter(Boolean) || [])];
      const suggestedProfileIds = [...new Set(data?.map(d => d.suggested_profile_id).filter(Boolean) || [])];
      const allProfileIds = [...new Set([...profileIds, ...suggestedProfileIds])] as string[];

      const profilesMap: Record<string, LinkedProfile> = {};
      if (allProfileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', allProfileIds);

        profilesData?.forEach(p => {
          profilesMap[p.id] = {
            ...p,
            full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          };
        });
      }

      return (data || []).map(doc => ({
        ...doc,
        extracted_contact: (doc.extracted_contact_info as ExtractedContactInfo | null) ?? null,
        linked_profile_data: doc.profile_id ? profilesMap[doc.profile_id] || null : null,
        suggested_profile: doc.suggested_profile_id && profilesMap[doc.suggested_profile_id]
          ? {
              id: profilesMap[doc.suggested_profile_id].id,
              full_name: profilesMap[doc.suggested_profile_id].full_name,
            }
          : null,
      })) as ExtractedDocument[];
    },
  });
}

export function useProfilesForDocumentLinking() {
  const { user } = useAuth();
  return useQuery({
    queryKey: documentKeys.profilesForLinking(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, is_favorite, updated_at')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('first_name')
        .limit(200);
      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      }));
    },
  });
}

export function useDocumentTypeCounts(profileId?: string) {
  const { user } = useAuth();
  return useQuery<Record<string, number>>({
    queryKey: documentKeys.counts(profileId),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('extracted_documents')
        .select('document_type')
        .eq('user_id', user!.id);
      if (profileId) query = query.eq('profile_id', profileId);

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(doc => {
        counts[doc.document_type] = (counts[doc.document_type] || 0) + 1;
      });
      return counts;
    },
  });
}

interface LinkArgs {
  docId: string;
  profileId: string;
}

function useDocumentStatusMutation(
  toastMessage: string,
  patch: (args: LinkArgs | string) => Record<string, unknown>,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (args: LinkArgs | string) => {
      const id = typeof args === 'string' ? args : args.docId;
      const { error } = await supabase
        .from('extracted_documents')
        .update(patch(args))
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toast({ title: toastMessage });
    },
  });
}

export function useLinkDocumentToProfile() {
  return useDocumentStatusMutation('Document linked to contact', args => {
    const { profileId } = args as LinkArgs;
    return {
      profile_id: profileId,
      linked_status: 'manually_linked',
      linked_at: new Date().toISOString(),
    };
  });
}

export function useAcceptDocumentSuggestion() {
  return useDocumentStatusMutation('Suggestion accepted', args => {
    const { profileId } = args as LinkArgs;
    return {
      profile_id: profileId,
      linked_status: 'auto_linked',
      linked_at: new Date().toISOString(),
    };
  });
}

export function useIgnoreDocument() {
  return useDocumentStatusMutation('Document ignored', () => ({ linked_status: 'ignored' }));
}
