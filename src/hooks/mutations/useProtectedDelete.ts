// Protected Delete Hook with CSRF Protection
import { useProtectedMutation } from '@/hooks/useProtectedMutation';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeleteOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  invalidateQueries?: string[][];
  successMessage?: string;
  errorMessage?: string;
}

type TableName = 'profiles' | 'documents' | 'media' | 'communications' | 'events' | 'messages' | 'contact_observations';

export function useProtectedDelete(tableName: TableName, options: DeleteOptions = {}) {
  const queryClient = useQueryClient();
  
  return useProtectedMutation({
    mutationFn: async ({ id }: { id: string }, csrfToken: string) => {
      console.log(`[CSRF] Protected delete on ${tableName} with token:`, csrfToken.substring(0, 8) + '...');
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    operationType: 'delete',
    onSuccess: () => {
      // Invalidate specified queries
      options.invalidateQueries?.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      
      options.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error(`[CSRF] Delete failed on ${tableName}:`, error);
      
      if (options.errorMessage) {
        toast.error(options.errorMessage);
      }
      
      options.onError?.(error);
    },
  });
}

// Specialized hooks for common delete operations
export function useProtectedContactDelete(options: DeleteOptions = {}) {
  return useProtectedDelete('profiles', {
    successMessage: 'Contact deleted successfully',
    errorMessage: 'Failed to delete contact',
    invalidateQueries: [['contacts'], ['dashboard-stats']],
    ...options,
  });
}

export function useProtectedDocumentDelete(profileId: string, options: DeleteOptions = {}) {
  return useProtectedDelete('documents', {
    successMessage: 'Document deleted',
    errorMessage: 'Error deleting document',
    invalidateQueries: [['contact-documents', profileId]],
    ...options,
  });
}

export function useProtectedMediaDelete(profileId: string, options: DeleteOptions = {}) {
  return useProtectedDelete('media', {
    successMessage: 'Media deleted',
    errorMessage: 'Error deleting media',
    invalidateQueries: [['contact-media', profileId]],
    ...options,
  });
}
