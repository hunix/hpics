// Centralized Error Management Service
import { supabase } from '@/integrations/supabase/client';
import { ERROR_CODES, ErrorCodeDefinition, ErrorSeverity, getErrorDefinition } from './errorCodes';

export interface AppError {
  code: string;
  referenceId: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  recoveryAction?: string;
  category: string;
  timestamp: string;
  context?: ErrorContext;
  originalError?: Error;
}

export interface ErrorContext {
  component?: string;
  function?: string;
  action?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorBuffer {
  errors: AppError[];
  maxSize: number;
}

// In-memory buffer for offline resilience
const errorBuffer: ErrorBuffer = {
  errors: [],
  maxSize: 100,
};

// Generate unique reference ID
function generateReferenceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ERR-${part1}-${part2}`;
}

// Determine error code from error
function determineErrorCode(error: Error | unknown): ErrorCodeDefinition {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
      return ERROR_CODES.NET_OFFLINE_001;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ERROR_CODES.NET_TIMEOUT_002;
    }
    if (message.includes('500') || message.includes('server error')) {
      return ERROR_CODES.NET_SERVER_003;
    }
    
    // Auth errors
    if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
      return ERROR_CODES.AUTH_EXPIRED_001;
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return ERROR_CODES.AUTH_INVALID_002;
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return ERROR_CODES.AUTH_FORBIDDEN_003;
    }
    
    // Database errors
    if (message.includes('connection') && message.includes('database')) {
      return ERROR_CODES.DB_CONNECTION_001;
    }
    if (message.includes('constraint') || message.includes('foreign key') || message.includes('unique')) {
      return ERROR_CODES.DB_CONSTRAINT_003;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_CODES.DB_NOTFOUND_004;
    }
    
    // AI errors
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return ERROR_CODES.AI_RATELIMIT_003;
    }
    if (message.includes('context') && (message.includes('limit') || message.includes('length'))) {
      return ERROR_CODES.AI_CONTEXT_005;
    }
    if (message.includes('model') && message.includes('unavailable')) {
      return ERROR_CODES.AI_MODEL_004;
    }
    
    // Document errors
    if (message.includes('file') && message.includes('size')) {
      return ERROR_CODES.DOC_SIZE_002;
    }
    if (message.includes('file type') || message.includes('unsupported format')) {
      return ERROR_CODES.DOC_TYPE_003;
    }
  }
  
  // Default to unknown system error
  return ERROR_CODES.SYS_UNKNOWN_001;
}

// Capture and process error
async function capture(
  error: Error | unknown,
  context?: ErrorContext
): Promise<AppError> {
  const errorDef = determineErrorCode(error);
  const referenceId = generateReferenceId();
  const timestamp = new Date().toISOString();
  
  const appError: AppError = {
    code: errorDef.code,
    referenceId,
    message: error instanceof Error ? error.message : String(error),
    userMessage: errorDef.message,
    severity: errorDef.severity,
    recoveryAction: errorDef.recoveryAction,
    category: errorDef.category,
    timestamp,
    context,
    originalError: error instanceof Error ? error : undefined,
  };
  
  // Add to buffer
  addToBuffer(appError);
  
  // Try to persist to database
  await persistError(appError);
  
  // Log for debugging
  console.error(`[${appError.code}] ${appError.referenceId}:`, {
    message: appError.message,
    context: appError.context,
    severity: appError.severity,
  });
  
  return appError;
}

// Add error to in-memory buffer
function addToBuffer(error: AppError): void {
  errorBuffer.errors.push(error);
  
  // Trim if over max size
  if (errorBuffer.errors.length > errorBuffer.maxSize) {
    errorBuffer.errors = errorBuffer.errors.slice(-errorBuffer.maxSize);
  }
}

// Persist error to database
async function persistError(_error: AppError): Promise<void> {
  // Note: Error persistence is handled in-memory only
  // To persist to database, create a dedicated error_logs table
  // For now, errors are stored in the errorBuffer
}

// Get user-friendly message
function getUserMessage(error: AppError): string {
  return `${error.userMessage} (Ref: ${error.referenceId})`;
}

// Get recovery action
function getRecoveryAction(error: AppError): string | undefined {
  return error.recoveryAction;
}

// Clear error buffer
function clearBuffer(): void {
  errorBuffer.errors = [];
}

// Get recent errors from buffer
function getRecentErrors(count: number = 10): AppError[] {
  return errorBuffer.errors.slice(-count);
}

// Get errors by severity
function getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
  return errorBuffer.errors.filter(e => e.severity === severity);
}

// Get errors by category
function getErrorsByCategory(category: string): AppError[] {
  return errorBuffer.errors.filter(e => e.category === category);
}

// Flush buffered errors to database
async function flushBuffer(): Promise<number> {
  const errors = [...errorBuffer.errors];
  let flushed = 0;
  
  for (const error of errors) {
    try {
      await persistError(error);
      flushed++;
    } catch {
      // Continue with other errors
    }
  }
  
  return flushed;
}

// Create error from code
function fromCode(
  code: string,
  context?: ErrorContext,
  customMessage?: string
): AppError {
  const errorDef = getErrorDefinition(code) || ERROR_CODES.SYS_UNKNOWN_001;
  const referenceId = generateReferenceId();
  
  return {
    code: errorDef.code,
    referenceId,
    message: customMessage || errorDef.message,
    userMessage: errorDef.message,
    severity: errorDef.severity,
    recoveryAction: errorDef.recoveryAction,
    category: errorDef.category,
    timestamp: new Date().toISOString(),
    context,
  };
}

// Check if error is retryable
function isRetryable(error: AppError): boolean {
  const retryableCategories = ['network', 'database', 'ai'];
  const nonRetryableCodes = ['AUTH_FORBIDDEN_003', 'VAL_REQUIRED_001', 'DOC_SIZE_002'];
  
  if (nonRetryableCodes.includes(error.code)) {
    return false;
  }
  
  return retryableCategories.includes(error.category) || error.severity !== 'critical';
}

// Get suggested wait time before retry (in ms)
function getRetryDelay(error: AppError, attemptNumber: number): number {
  const baseDelays: Record<string, number> = {
    'AI_RATELIMIT_003': 30000, // 30 seconds for rate limit
    'NET_TIMEOUT_002': 5000,
    'NET_SERVER_003': 10000,
    'SYS_OVERLOAD_003': 15000,
  };
  
  const baseDelay = baseDelays[error.code] || 2000;
  return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 60000); // Max 60 seconds
}

export const ErrorService = {
  capture,
  fromCode,
  getUserMessage,
  getRecoveryAction,
  clearBuffer,
  getRecentErrors,
  getErrorsBySeverity,
  getErrorsByCategory,
  flushBuffer,
  isRetryable,
  getRetryDelay,
  generateReferenceId,
};
