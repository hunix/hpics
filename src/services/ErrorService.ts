// Centralized Error Service with DB persistence
import { supabase } from '@/integrations/supabase/client';
import type { ErrorLogInsert } from '@/types/database-helpers';
type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}

interface CapturedError {
  id: string;
  referenceId: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  stackTrace?: string;
  timestamp: string;
}

// In-memory queue for offline errors
const errorQueue: CapturedError[] = [];
const MAX_QUEUE_SIZE = 100;

// Generate a user-friendly reference ID
function generateReferenceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ERR-${timestamp}-${random}`;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Determine error code from error type
function getErrorCode(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
  if (message.includes('auth') || message.includes('unauthorized')) return 'AUTH_ERROR';
  if (message.includes('permission') || message.includes('forbidden')) return 'PERMISSION_ERROR';
  if (message.includes('validation') || message.includes('invalid')) return 'VALIDATION_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT_ERROR';
  if (message.includes('rate limit')) return 'RATE_LIMIT_ERROR';
  if (message.includes('not found') || message.includes('404')) return 'NOT_FOUND_ERROR';
  if (error.name === 'ChunkLoadError') return 'CHUNK_LOAD_ERROR';
  
  return 'UNKNOWN_ERROR';
}

// Determine severity from error
function getSeverity(error: Error, context?: ErrorContext): ErrorSeverity {
  const code = getErrorCode(error);
  
  // Critical errors
  if (['AUTH_ERROR', 'PERMISSION_ERROR'].includes(code)) return 'critical';
  
  // Errors
  if (['NETWORK_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT_ERROR'].includes(code)) return 'error';
  
  // Warnings
  if (['VALIDATION_ERROR', 'NOT_FOUND_ERROR', 'CHUNK_LOAD_ERROR'].includes(code)) return 'warning';
  
  return 'error';
}

// Persist error to database
async function persistError(capturedError: CapturedError): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Queue for later if not authenticated
      queueError(capturedError);
      return false;
    }

    const insertData: ErrorLogInsert = {
      reference_id: capturedError.referenceId,
      code: capturedError.code,
      message: capturedError.message,
      severity: capturedError.severity,
      context: JSON.parse(JSON.stringify(capturedError.context)),
      stack_trace: capturedError.stackTrace,
      user_id: user.id,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    const { error } = await supabase
      .from('error_logs')
      .insert(insertData);

    if (error) {
      console.error('Failed to persist error to database:', error);
      queueError(capturedError);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error persisting to database:', e);
    queueError(capturedError);
    return false;
  }
}

// Queue error for later persistence
function queueError(error: CapturedError): void {
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    errorQueue.shift(); // Remove oldest
  }
  errorQueue.push(error);
  
  // Store in localStorage as backup
  try {
    localStorage.setItem('error_queue', JSON.stringify(errorQueue));
  } catch (e) {
    // Storage full or unavailable
  }
}

// Flush queued errors to database
async function flushErrorQueue(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || errorQueue.length === 0) return 0;

  let flushed = 0;
  const toFlush = [...errorQueue];
  errorQueue.length = 0;

  for (const error of toFlush) {
    const insertData: ErrorLogInsert = {
      reference_id: error.referenceId,
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: JSON.parse(JSON.stringify(error.context)),
      stack_trace: error.stackTrace,
      user_id: user.id,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    const { error: dbError } = await supabase
      .from('error_logs')
      .insert(insertData);

    if (!dbError) {
      flushed++;
    } else {
      // Re-queue failed ones
      queueError(error);
    }
  }

  // Clear localStorage queue
  try {
    localStorage.removeItem('error_queue');
  } catch (e) {
    // Ignore
  }

  return flushed;
}

// Load queued errors from localStorage on init
function loadQueuedErrors(): void {
  try {
    const stored = localStorage.getItem('error_queue');
    if (stored) {
      const parsed = JSON.parse(stored) as CapturedError[];
      errorQueue.push(...parsed);
    }
  } catch (e) {
    // Ignore
  }
}

// Initialize on load
loadQueuedErrors();

// Main ErrorService object
export const ErrorService = {
  /**
   * Capture and log an error with context
   */
  capture: async (
    error: Error,
    context?: ErrorContext
  ): Promise<CapturedError> => {
    const capturedError: CapturedError = {
      id: generateId(),
      referenceId: generateReferenceId(),
      code: getErrorCode(error),
      message: error.message,
      severity: getSeverity(error, context),
      context: context || {},
      stackTrace: error.stack,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Error Captured [${capturedError.referenceId}]`);
      console.error('Error:', error);
      console.log('Code:', capturedError.code);
      console.log('Severity:', capturedError.severity);
      console.log('Context:', context);
      console.groupEnd();
    }

    // Persist to database (async, don't block)
    persistError(capturedError);

    return capturedError;
  },

  /**
   * Log a warning (non-critical issue)
   */
  warn: async (
    message: string,
    context?: ErrorContext
  ): Promise<CapturedError> => {
    const warning: CapturedError = {
      id: generateId(),
      referenceId: generateReferenceId(),
      code: 'WARNING',
      message,
      severity: 'warning',
      context: context || {},
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Warning [${warning.referenceId}]:`, message);
    }

    persistError(warning);
    return warning;
  },

  /**
   * Log an info message
   */
  info: async (
    message: string,
    context?: ErrorContext
  ): Promise<CapturedError> => {
    const info: CapturedError = {
      id: generateId(),
      referenceId: generateReferenceId(),
      code: 'INFO',
      message,
      severity: 'info',
      context: context || {},
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.info(`ℹ️ Info [${info.referenceId}]:`, message);
    }

    persistError(info);
    return info;
  },

  /**
   * Get recovery suggestions based on error type
   */
  getRecoverySuggestions: (error: CapturedError): string[] => {
    const suggestions: string[] = [];
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        suggestions.push('Wait a moment and try again');
        break;
      case 'AUTH_ERROR':
        suggestions.push('Try signing in again');
        suggestions.push('Clear browser cache and cookies');
        suggestions.push('Contact support if issue persists');
        break;
      case 'PERMISSION_ERROR':
        suggestions.push('Verify you have access to this resource');
        suggestions.push('Contact your administrator');
        break;
      case 'VALIDATION_ERROR':
        suggestions.push('Check your input data');
        suggestions.push('Ensure all required fields are filled');
        break;
      case 'TIMEOUT_ERROR':
        suggestions.push('The operation took too long');
        suggestions.push('Try with smaller data sets');
        suggestions.push('Check your connection speed');
        break;
      case 'RATE_LIMIT_ERROR':
        suggestions.push('Too many requests');
        suggestions.push('Wait a few minutes before trying again');
        break;
      case 'CHUNK_LOAD_ERROR':
        suggestions.push('A new version may be available');
        suggestions.push('Refresh the page to load the latest version');
        break;
      default:
        suggestions.push('Try refreshing the page');
        suggestions.push('If the issue persists, contact support');
    }
    
    return suggestions;
  },

  /**
   * Flush any queued errors to the database
   */
  flushQueue: flushErrorQueue,

  /**
   * Get the count of queued errors
   */
  getQueueSize: (): number => errorQueue.length,

  /**
   * Format reference ID for display to user
   */
  formatReferenceId: (refId: string): string => refId,
};

export type { CapturedError, ErrorContext, ErrorSeverity };
