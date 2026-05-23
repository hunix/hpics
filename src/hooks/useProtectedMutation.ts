// CSRF-Protected Mutation Hook
import { useCallback } from 'react';
import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useCSRFToken } from '@/hooks/security/useCSRFToken';
import { toast } from 'sonner';

interface ProtectedMutationOptions<TData, TError, TVariables, TContext> 
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables, csrfToken: string) => Promise<TData>;
  requireCsrf?: boolean;
  operationType?: 'delete' | 'update' | 'create' | 'export';
}

export function useProtectedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: ProtectedMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { token, validateToken, refreshToken } = useCSRFToken();
  const { mutationFn, requireCsrf = true, operationType, ...mutationOptions } = options;

  const protectedMutationFn = useCallback(async (variables: TVariables): Promise<TData> => {
    if (requireCsrf) {
      // Validate current token
      if (!token || !validateToken(token)) {
        // Token expired or invalid, refresh it
        const newToken = refreshToken();
        if (!newToken) {
          throw new Error('Unable to generate security token. Please try again.');
        }
        return mutationFn(variables, newToken);
      }
      
      return mutationFn(variables, token);
    }
    
    return mutationFn(variables, '');
  }, [token, validateToken, refreshToken, mutationFn, requireCsrf]);

  return useMutation({
    ...mutationOptions,
    mutationFn: protectedMutationFn,
    onError: (error, variables, context) => {
      // Log security-related errors
      if (error instanceof Error && error.message.includes('security token')) {
        console.error('[CSRF] Security token error:', error.message);
        toast.error('Security verification failed. Please refresh and try again.');
      }
      
      mutationOptions.onError?.(error, variables, context);
    },
  });
}

// Higher-order function for wrapping mutation functions with CSRF
export function withCsrfToken<TVariables, TResult>(
  fn: (variables: TVariables, headers: Record<string, string>) => Promise<TResult>
): (variables: TVariables, csrfToken: string) => Promise<TResult> {
  return (variables: TVariables, csrfToken: string) => {
    const headers: Record<string, string> = csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
    return fn(variables, headers);
  };
}

// Utility to create protected delete mutations
export function createProtectedDeleteMutation<TVariables = { id: string }>(
  deleteFn: (variables: TVariables, headers: Record<string, string>) => Promise<void>
) {
  return withCsrfToken(deleteFn);
}

// Utility to create protected export mutations  
export function createProtectedExportMutation<TVariables, TResult>(
  exportFn: (variables: TVariables, headers: Record<string, string>) => Promise<TResult>
) {
  return withCsrfToken(exportFn);
}
