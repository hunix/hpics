// Error Codes Registry
// Pattern: CATEGORY_SUBCATEGORY_NUMBER

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorCodeDefinition {
  code: string;
  message: string;
  severity: ErrorSeverity;
  recoveryAction?: string;
  category: string;
}

// Network errors
export const NET_OFFLINE_001: ErrorCodeDefinition = {
  code: 'NET_OFFLINE_001',
  message: 'No internet connection available',
  severity: 'medium',
  recoveryAction: 'Check your internet connection and try again',
  category: 'network',
};

export const NET_TIMEOUT_002: ErrorCodeDefinition = {
  code: 'NET_TIMEOUT_002',
  message: 'Request timed out',
  severity: 'medium',
  recoveryAction: 'The server is taking too long to respond. Please try again',
  category: 'network',
};

export const NET_SERVER_003: ErrorCodeDefinition = {
  code: 'NET_SERVER_003',
  message: 'Server error occurred',
  severity: 'high',
  recoveryAction: 'Please try again later or contact support',
  category: 'network',
};

// Authentication errors
export const AUTH_EXPIRED_001: ErrorCodeDefinition = {
  code: 'AUTH_EXPIRED_001',
  message: 'Your session has expired',
  severity: 'medium',
  recoveryAction: 'Please sign in again to continue',
  category: 'auth',
};

export const AUTH_INVALID_002: ErrorCodeDefinition = {
  code: 'AUTH_INVALID_002',
  message: 'Invalid credentials provided',
  severity: 'medium',
  recoveryAction: 'Please check your email and password',
  category: 'auth',
};

export const AUTH_FORBIDDEN_003: ErrorCodeDefinition = {
  code: 'AUTH_FORBIDDEN_003',
  message: 'You do not have permission to perform this action',
  severity: 'medium',
  recoveryAction: 'Contact your administrator for access',
  category: 'auth',
};

export const AUTH_LOCKED_004: ErrorCodeDefinition = {
  code: 'AUTH_LOCKED_004',
  message: 'Account has been locked',
  severity: 'high',
  recoveryAction: 'Contact support to unlock your account',
  category: 'auth',
};

// Validation errors
export const VAL_REQUIRED_001: ErrorCodeDefinition = {
  code: 'VAL_REQUIRED_001',
  message: 'Required field is missing',
  severity: 'low',
  recoveryAction: 'Please fill in all required fields',
  category: 'validation',
};

export const VAL_FORMAT_002: ErrorCodeDefinition = {
  code: 'VAL_FORMAT_002',
  message: 'Invalid format',
  severity: 'low',
  recoveryAction: 'Please check the format of your input',
  category: 'validation',
};

export const VAL_RANGE_003: ErrorCodeDefinition = {
  code: 'VAL_RANGE_003',
  message: 'Value out of allowed range',
  severity: 'low',
  recoveryAction: 'Please enter a value within the allowed range',
  category: 'validation',
};

export const VAL_DUPLICATE_004: ErrorCodeDefinition = {
  code: 'VAL_DUPLICATE_004',
  message: 'Duplicate value detected',
  severity: 'low',
  recoveryAction: 'This value already exists. Please use a different one',
  category: 'validation',
};

// Database errors
export const DB_CONNECTION_001: ErrorCodeDefinition = {
  code: 'DB_CONNECTION_001',
  message: 'Unable to connect to database',
  severity: 'critical',
  recoveryAction: 'Please try again. If the problem persists, contact support',
  category: 'database',
};

export const DB_QUERY_002: ErrorCodeDefinition = {
  code: 'DB_QUERY_002',
  message: 'Database query failed',
  severity: 'high',
  recoveryAction: 'Please try again',
  category: 'database',
};

export const DB_CONSTRAINT_003: ErrorCodeDefinition = {
  code: 'DB_CONSTRAINT_003',
  message: 'Database constraint violation',
  severity: 'medium',
  recoveryAction: 'The data conflicts with existing records',
  category: 'database',
};

export const DB_NOTFOUND_004: ErrorCodeDefinition = {
  code: 'DB_NOTFOUND_004',
  message: 'Record not found',
  severity: 'low',
  recoveryAction: 'The requested item does not exist or has been deleted',
  category: 'database',
};

// Transaction errors
export const TXN_FAILED_001: ErrorCodeDefinition = {
  code: 'TXN_FAILED_001',
  message: 'Transaction failed',
  severity: 'high',
  recoveryAction: 'The operation could not be completed. Please try again',
  category: 'transaction',
};

export const TXN_ROLLBACK_002: ErrorCodeDefinition = {
  code: 'TXN_ROLLBACK_002',
  message: 'Transaction rolled back',
  severity: 'medium',
  recoveryAction: 'Changes were reverted due to an error. Please try again',
  category: 'transaction',
};

export const TXN_CONFLICT_003: ErrorCodeDefinition = {
  code: 'TXN_CONFLICT_003',
  message: 'Transaction conflict detected',
  severity: 'medium',
  recoveryAction: 'Another operation modified this data. Please refresh and try again',
  category: 'transaction',
};

// Document errors
export const DOC_UPLOAD_001: ErrorCodeDefinition = {
  code: 'DOC_UPLOAD_001',
  message: 'Document upload failed',
  severity: 'medium',
  recoveryAction: 'Please try uploading the document again',
  category: 'document',
};

export const DOC_SIZE_002: ErrorCodeDefinition = {
  code: 'DOC_SIZE_002',
  message: 'Document exceeds size limit',
  severity: 'low',
  recoveryAction: 'Please reduce the file size or split into smaller files',
  category: 'document',
};

export const DOC_TYPE_003: ErrorCodeDefinition = {
  code: 'DOC_TYPE_003',
  message: 'Unsupported document type',
  severity: 'low',
  recoveryAction: 'Please upload a supported file format',
  category: 'document',
};

export const DOC_CORRUPT_004: ErrorCodeDefinition = {
  code: 'DOC_CORRUPT_004',
  message: 'Document appears to be corrupted',
  severity: 'medium',
  recoveryAction: 'Please upload a valid file',
  category: 'document',
};

export const DOC_INTEGRITY_005: ErrorCodeDefinition = {
  code: 'DOC_INTEGRITY_005',
  message: 'Document integrity check failed',
  severity: 'high',
  recoveryAction: 'The document may have been modified. Please verify and re-upload',
  category: 'document',
};

// AI errors
export const AI_PROCESSING_001: ErrorCodeDefinition = {
  code: 'AI_PROCESSING_001',
  message: 'AI processing failed',
  severity: 'medium',
  recoveryAction: 'The AI could not process your request. Please try again',
  category: 'ai',
};

export const AI_TIMEOUT_002: ErrorCodeDefinition = {
  code: 'AI_TIMEOUT_002',
  message: 'AI processing timed out',
  severity: 'medium',
  recoveryAction: 'The request took too long. Try with less data or simpler input',
  category: 'ai',
};

export const AI_RATELIMIT_003: ErrorCodeDefinition = {
  code: 'AI_RATELIMIT_003',
  message: 'AI rate limit exceeded',
  severity: 'medium',
  recoveryAction: 'Too many requests. Please wait a moment before trying again',
  category: 'ai',
};

export const AI_MODEL_004: ErrorCodeDefinition = {
  code: 'AI_MODEL_004',
  message: 'AI model unavailable',
  severity: 'high',
  recoveryAction: 'The AI service is temporarily unavailable. Please try again later',
  category: 'ai',
};

export const AI_CONTEXT_005: ErrorCodeDefinition = {
  code: 'AI_CONTEXT_005',
  message: 'Input exceeds context limit',
  severity: 'low',
  recoveryAction: 'Please reduce the amount of text or data being processed',
  category: 'ai',
};

// System errors
export const SYS_UNKNOWN_001: ErrorCodeDefinition = {
  code: 'SYS_UNKNOWN_001',
  message: 'An unexpected error occurred',
  severity: 'high',
  recoveryAction: 'Please try again. If the problem persists, contact support',
  category: 'system',
};

export const SYS_MAINTENANCE_002: ErrorCodeDefinition = {
  code: 'SYS_MAINTENANCE_002',
  message: 'System is under maintenance',
  severity: 'medium',
  recoveryAction: 'Please try again later',
  category: 'system',
};

export const SYS_OVERLOAD_003: ErrorCodeDefinition = {
  code: 'SYS_OVERLOAD_003',
  message: 'System is experiencing high load',
  severity: 'medium',
  recoveryAction: 'Please wait a moment and try again',
  category: 'system',
};

export const SYS_VERSION_004: ErrorCodeDefinition = {
  code: 'SYS_VERSION_004',
  message: 'Application version mismatch',
  severity: 'medium',
  recoveryAction: 'Please refresh the page to get the latest version',
  category: 'system',
};

// Integration errors
export const INT_CONNECTION_001: ErrorCodeDefinition = {
  code: 'INT_CONNECTION_001',
  message: 'External service connection failed',
  severity: 'high',
  recoveryAction: 'Unable to connect to external service. Please try again',
  category: 'integration',
};

export const INT_AUTH_002: ErrorCodeDefinition = {
  code: 'INT_AUTH_002',
  message: 'External service authentication failed',
  severity: 'high',
  recoveryAction: 'Please reconnect your external account',
  category: 'integration',
};

export const INT_RESPONSE_003: ErrorCodeDefinition = {
  code: 'INT_RESPONSE_003',
  message: 'Invalid response from external service',
  severity: 'medium',
  recoveryAction: 'The external service returned unexpected data. Please try again',
  category: 'integration',
};

// Compliance errors
export const CMP_POLICY_001: ErrorCodeDefinition = {
  code: 'CMP_POLICY_001',
  message: 'Policy violation detected',
  severity: 'high',
  recoveryAction: 'This action violates company policy. Please review and modify',
  category: 'compliance',
};

export const CMP_MISSING_002: ErrorCodeDefinition = {
  code: 'CMP_MISSING_002',
  message: 'Required compliance documentation missing',
  severity: 'medium',
  recoveryAction: 'Please provide the required documentation',
  category: 'compliance',
};

// Error code lookup
export const ERROR_CODES: Record<string, ErrorCodeDefinition> = {
  NET_OFFLINE_001,
  NET_TIMEOUT_002,
  NET_SERVER_003,
  AUTH_EXPIRED_001,
  AUTH_INVALID_002,
  AUTH_FORBIDDEN_003,
  AUTH_LOCKED_004,
  VAL_REQUIRED_001,
  VAL_FORMAT_002,
  VAL_RANGE_003,
  VAL_DUPLICATE_004,
  DB_CONNECTION_001,
  DB_QUERY_002,
  DB_CONSTRAINT_003,
  DB_NOTFOUND_004,
  TXN_FAILED_001,
  TXN_ROLLBACK_002,
  TXN_CONFLICT_003,
  DOC_UPLOAD_001,
  DOC_SIZE_002,
  DOC_TYPE_003,
  DOC_CORRUPT_004,
  DOC_INTEGRITY_005,
  AI_PROCESSING_001,
  AI_TIMEOUT_002,
  AI_RATELIMIT_003,
  AI_MODEL_004,
  AI_CONTEXT_005,
  SYS_UNKNOWN_001,
  SYS_MAINTENANCE_002,
  SYS_OVERLOAD_003,
  SYS_VERSION_004,
  INT_CONNECTION_001,
  INT_AUTH_002,
  INT_RESPONSE_003,
  CMP_POLICY_001,
  CMP_MISSING_002,
};

export function getErrorDefinition(code: string): ErrorCodeDefinition | null {
  return ERROR_CODES[code] || null;
}

export function getCategoryErrors(category: string): ErrorCodeDefinition[] {
  return Object.values(ERROR_CODES).filter(err => err.category === category);
}
