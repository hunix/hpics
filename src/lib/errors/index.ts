// Error Handling System - Main Export
export { ErrorService } from './ErrorService';
export type { AppError, ErrorContext } from './ErrorService';
export { 
  ERROR_CODES, 
  getErrorDefinition, 
  getCategoryErrors,
  type ErrorCodeDefinition,
  type ErrorSeverity,
} from './errorCodes';
