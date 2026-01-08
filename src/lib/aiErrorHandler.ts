// Centralized AI Error Handler
// Handles rate limits (429) and budget errors (402) consistently across the app

import { toast } from "sonner";

interface AIErrorResult {
  handled: boolean;
  shouldRetry: boolean;
  retryAfterMs?: number;
}

/**
 * Handle AI-related errors consistently across the application
 * Returns true if the error was handled (no further action needed)
 */
export function handleAIError(error: unknown): AIErrorResult {
  // Handle Response objects (from fetch)
  if (error instanceof Response) {
    return handleResponseError(error);
  }

  // Handle error objects with status
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; message?: string; error?: string };
    
    if (err.status === 429) {
      toast.error("Rate limit exceeded", {
        description: "Too many AI requests. Please wait a moment and try again.",
        duration: 10000,
      });
      return { handled: true, shouldRetry: true, retryAfterMs: 60000 };
    }

    if (err.status === 402) {
      toast.error("AI budget limit reached", {
        description: "Your AI spending limit has been reached. Adjust in Settings.",
        action: {
          label: "Settings",
          onClick: () => window.location.href = '/settings?tab=ai-models'
        },
        duration: 15000,
      });
      return { handled: true, shouldRetry: false };
    }

    // Handle budget exceeded from backend
    const message = err.message || err.error || '';
    if (message.includes('budget') && message.includes('exceeded')) {
      toast.error("AI budget limit reached", {
        description: message,
        action: {
          label: "Settings",
          onClick: () => window.location.href = '/settings?tab=ai-models'
        },
        duration: 15000,
      });
      return { handled: true, shouldRetry: false };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('rate limit') || error.includes('429')) {
      toast.error("Rate limit exceeded", {
        description: "Too many AI requests. Please wait a moment and try again.",
        duration: 10000,
      });
      return { handled: true, shouldRetry: true, retryAfterMs: 60000 };
    }

    if (error.includes('budget') && error.includes('exceeded')) {
      toast.error("AI budget limit reached", {
        description: error,
        action: {
          label: "Settings",
          onClick: () => window.location.href = '/settings?tab=ai-models'
        },
        duration: 15000,
      });
      return { handled: true, shouldRetry: false };
    }
  }

  return { handled: false, shouldRetry: false };
}

function handleResponseError(response: Response): AIErrorResult {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    toast.error("Rate limit exceeded", {
      description: "Too many AI requests. Please wait a moment and try again.",
      duration: 10000,
    });
    return { handled: true, shouldRetry: true, retryAfterMs };
  }

  if (response.status === 402) {
    toast.error("AI credits exhausted", {
      description: "Please add credits to continue using AI features.",
      action: {
        label: "Settings",
        onClick: () => window.location.href = '/settings?tab=ai-models'
      },
      duration: 15000,
    });
    return { handled: true, shouldRetry: false };
  }

  return { handled: false, shouldRetry: false };
}

/**
 * Wrapper for supabase.functions.invoke that handles AI errors
 */
export async function invokeWithAIErrorHandling<T>(
  invoke: () => Promise<{ data: T | null; error: any }>,
  options?: { showGenericError?: boolean }
): Promise<{ data: T | null; error: any; handled: boolean }> {
  const result = await invoke();
  
  if (result.error) {
    const errorResult = handleAIError(result.error);
    if (errorResult.handled) {
      return { data: null, error: result.error, handled: true };
    }
    
    if (options?.showGenericError) {
      toast.error("AI request failed", {
        description: result.error.message || "An unexpected error occurred",
      });
    }
  }
  
  return { data: result.data, error: result.error, handled: false };
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Response && error.status === 429) return true;
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number };
    if (err.status === 429) return true;
  }
  if (typeof error === 'string' && (error.includes('rate limit') || error.includes('429'))) {
    return true;
  }
  return false;
}

/**
 * Check if an error is a budget exceeded error
 */
export function isBudgetExceededError(error: unknown): boolean {
  if (error instanceof Response && error.status === 402) return true;
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; message?: string; error?: string };
    if (err.status === 402) return true;
    const message = err.message || err.error || '';
    if (message.includes('budget') && message.includes('exceeded')) return true;
  }
  if (typeof error === 'string' && error.includes('budget') && error.includes('exceeded')) {
    return true;
  }
  return false;
}
