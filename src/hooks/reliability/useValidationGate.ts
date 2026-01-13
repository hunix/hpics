import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

type ValidationSeverity = 'error' | 'warning' | 'info';

interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
  code?: string;
}

interface ValidatorResult {
  valid: boolean;
  issues: ValidationIssue[];
}

interface Validator<T> {
  name: string;
  priority: number;
  severity: ValidationSeverity;
  validate: (data: T) => ValidatorResult | Promise<ValidatorResult>;
}

interface ValidationGateState {
  isValidating: boolean;
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  acknowledgedWarnings: string[];
  lastValidatedAt: string | null;
}

interface ValidationGateOptions<T> {
  schema?: z.ZodSchema<T>;
  validators?: Validator<T>[];
  requireWarningAck?: boolean;
  onValidationComplete?: (result: ValidatorResult) => void;
}

export function useValidationGate<T extends Record<string, unknown>>({
  schema,
  validators = [],
  requireWarningAck = false,
  onValidationComplete,
}: ValidationGateOptions<T>) {
  const [state, setState] = useState<ValidationGateState>({
    isValidating: false,
    isValid: true,
    errors: [],
    warnings: [],
    infos: [],
    acknowledgedWarnings: [],
    lastValidatedAt: null,
  });

  // Sort validators by priority
  const sortedValidators = useMemo(() => 
    [...validators].sort((a, b) => a.priority - b.priority),
    [validators]
  );

  // Validate data against schema and custom validators
  const validate = useCallback(async (data: T): Promise<ValidatorResult> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    const allIssues: ValidationIssue[] = [];

    // Schema validation first
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        for (const error of result.error.errors) {
          allIssues.push({
            field: error.path.join('.') || 'root',
            message: error.message,
            severity: 'error',
            code: error.code,
          });
        }
      }
    }

    // Run custom validators
    for (const validator of sortedValidators) {
      try {
        const result = await validator.validate(data);
        for (const issue of result.issues) {
          allIssues.push({
            ...issue,
            severity: issue.severity || validator.severity,
          });
        }
      } catch (error) {
        allIssues.push({
          field: 'validator',
          message: `Validator "${validator.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        });
      }
    }

    // Categorize issues
    const errors = allIssues.filter(i => i.severity === 'error');
    const warnings = allIssues.filter(i => i.severity === 'warning');
    const infos = allIssues.filter(i => i.severity === 'info');

    // Check if warnings need acknowledgment
    const hasUnacknowledgedWarnings = requireWarningAck && 
      warnings.some(w => !state.acknowledgedWarnings.includes(`${w.field}:${w.message}`));

    const isValid = errors.length === 0 && !hasUnacknowledgedWarnings;

    const newState: ValidationGateState = {
      isValidating: false,
      isValid,
      errors,
      warnings,
      infos,
      acknowledgedWarnings: state.acknowledgedWarnings,
      lastValidatedAt: new Date().toISOString(),
    };

    setState(newState);
    
    const result = { valid: isValid, issues: allIssues };
    onValidationComplete?.(result);
    
    return result;
  }, [schema, sortedValidators, requireWarningAck, state.acknowledgedWarnings, onValidationComplete]);

  // Acknowledge a warning
  const acknowledgeWarning = useCallback((field: string, message: string) => {
    const key = `${field}:${message}`;
    setState(prev => ({
      ...prev,
      acknowledgedWarnings: [...prev.acknowledgedWarnings, key],
    }));
  }, []);

  // Acknowledge all warnings
  const acknowledgeAllWarnings = useCallback(() => {
    setState(prev => ({
      ...prev,
      acknowledgedWarnings: prev.warnings.map(w => `${w.field}:${w.message}`),
    }));
  }, []);

  // Force pass (bypass warnings)
  const forcePass = useCallback(() => {
    setState(prev => ({
      ...prev,
      isValid: prev.errors.length === 0,
      acknowledgedWarnings: prev.warnings.map(w => `${w.field}:${w.message}`),
    }));
  }, []);

  // Reset validation state
  const reset = useCallback(() => {
    setState({
      isValidating: false,
      isValid: true,
      errors: [],
      warnings: [],
      infos: [],
      acknowledgedWarnings: [],
      lastValidatedAt: null,
    });
  }, []);

  // Check if can proceed (validation gate)
  const canProceed = useMemo(() => {
    if (state.errors.length > 0) return false;
    if (requireWarningAck) {
      return state.warnings.every(w => 
        state.acknowledgedWarnings.includes(`${w.field}:${w.message}`)
      );
    }
    return true;
  }, [state, requireWarningAck]);

  return {
    state,
    validate,
    acknowledgeWarning,
    acknowledgeAllWarnings,
    forcePass,
    reset,
    canProceed,
    hasErrors: state.errors.length > 0,
    hasWarnings: state.warnings.length > 0,
  };
}

// ============================================
// Pre-built Validators
// ============================================

export function createRequiredFieldsValidator<T>(
  fields: Array<keyof T>,
  options: { priority?: number; message?: string } = {}
): Validator<T> {
  return {
    name: 'required_fields',
    priority: options.priority ?? 1,
    severity: 'error',
    validate: (data: T) => {
      const issues: ValidationIssue[] = [];
      
      for (const field of fields) {
        const value = data[field];
        if (value === undefined || value === null || value === '') {
          issues.push({
            field: String(field),
            message: options.message ?? `${String(field)} is required`,
            severity: 'error',
          });
        }
      }

      return { valid: issues.length === 0, issues };
    },
  };
}

export function createEmailValidator<T>(
  field: keyof T,
  options: { priority?: number; allowEmpty?: boolean } = {}
): Validator<T> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return {
    name: 'email_validator',
    priority: options.priority ?? 2,
    severity: 'error',
    validate: (data: T) => {
      const value = data[field];
      
      if (!value && options.allowEmpty) {
        return { valid: true, issues: [] };
      }

      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return {
          valid: false,
          issues: [{
            field: String(field),
            message: 'Invalid email address',
            severity: 'error',
          }],
        };
      }

      return { valid: true, issues: [] };
    },
  };
}

export function createPhoneValidator<T>(
  field: keyof T,
  options: { priority?: number; allowEmpty?: boolean; pattern?: RegExp } = {}
): Validator<T> {
  const defaultPattern = /^\+?[\d\s-()]+$/;
  
  return {
    name: 'phone_validator',
    priority: options.priority ?? 2,
    severity: 'error',
    validate: (data: T) => {
      const value = data[field];
      
      if (!value && options.allowEmpty) {
        return { valid: true, issues: [] };
      }

      const pattern = options.pattern ?? defaultPattern;
      if (typeof value !== 'string' || !pattern.test(value)) {
        return {
          valid: false,
          issues: [{
            field: String(field),
            message: 'Invalid phone number',
            severity: 'error',
          }],
        };
      }

      return { valid: true, issues: [] };
    },
  };
}

export function createDateRangeValidator<T>(
  startField: keyof T,
  endField: keyof T,
  options: { priority?: number; allowEmpty?: boolean } = {}
): Validator<T> {
  return {
    name: 'date_range_validator',
    priority: options.priority ?? 3,
    severity: 'error',
    validate: (data: T) => {
      const startValue = data[startField];
      const endValue = data[endField];
      
      if ((!startValue || !endValue) && options.allowEmpty) {
        return { valid: true, issues: [] };
      }

      const startDate = new Date(String(startValue));
      const endDate = new Date(String(endValue));

      if (isNaN(startDate.getTime())) {
        return {
          valid: false,
          issues: [{
            field: String(startField),
            message: 'Invalid start date',
            severity: 'error',
          }],
        };
      }

      if (isNaN(endDate.getTime())) {
        return {
          valid: false,
          issues: [{
            field: String(endField),
            message: 'Invalid end date',
            severity: 'error',
          }],
        };
      }

      if (startDate > endDate) {
        return {
          valid: false,
          issues: [{
            field: String(endField),
            message: 'End date must be after start date',
            severity: 'error',
          }],
        };
      }

      return { valid: true, issues: [] };
    },
  };
}

export function createUniquenessValidator<T>(
  tableName: string,
  column: string,
  dataField: keyof T,
  options: { 
    priority?: number; 
    excludeId?: string;
    message?: string;
  } = {}
): Validator<T> {
  return {
    name: 'uniqueness_validator',
    priority: options.priority ?? 5,
    severity: 'error',
    validate: async (data: T) => {
      const value = data[dataField];
      
      if (!value) {
        return { valid: true, issues: [] };
      }

      // Use raw SQL query to avoid type issues with dynamic table names
      const { data: existing, error } = await supabase
        .rpc('check_uniqueness', { 
          p_table: tableName, 
          p_column: column, 
          p_value: String(value),
          p_exclude_id: options.excludeId || null 
        })
        .single();

      if (error) {
        return {
          valid: false,
          issues: [{
            field: String(dataField),
            message: 'Unable to verify uniqueness',
            severity: 'warning',
          }],
        };
      }

      if (existing && existing.length > 0) {
        return {
          valid: false,
          issues: [{
            field: String(dataField),
            message: options.message ?? `${String(dataField)} already exists`,
            severity: 'error',
          }],
        };
      }

      return { valid: true, issues: [] };
    },
  };
}

export function createLengthValidator<T>(
  field: keyof T,
  options: { 
    min?: number; 
    max?: number; 
    priority?: number;
    severity?: ValidationSeverity;
  } = {}
): Validator<T> {
  return {
    name: 'length_validator',
    priority: options.priority ?? 2,
    severity: options.severity ?? 'error',
    validate: (data: T) => {
      const value = data[field];
      
      if (value === undefined || value === null) {
        return { valid: true, issues: [] };
      }

      const length = typeof value === 'string' ? value.length : 
                     Array.isArray(value) ? value.length : 0;

      const issues: ValidationIssue[] = [];

      if (options.min !== undefined && length < options.min) {
        issues.push({
          field: String(field),
          message: `${String(field)} must be at least ${options.min} characters`,
          severity: options.severity ?? 'error',
        });
      }

      if (options.max !== undefined && length > options.max) {
        issues.push({
          field: String(field),
          message: `${String(field)} must be at most ${options.max} characters`,
          severity: options.severity ?? 'error',
        });
      }

      return { valid: issues.length === 0, issues };
    },
  };
}

export function createPatternValidator<T>(
  field: keyof T,
  pattern: RegExp,
  options: { 
    priority?: number; 
    message?: string;
    severity?: ValidationSeverity;
  } = {}
): Validator<T> {
  return {
    name: 'pattern_validator',
    priority: options.priority ?? 2,
    severity: options.severity ?? 'error',
    validate: (data: T) => {
      const value = data[field];
      
      if (!value) {
        return { valid: true, issues: [] };
      }

      if (typeof value !== 'string' || !pattern.test(value)) {
        return {
          valid: false,
          issues: [{
            field: String(field),
            message: options.message ?? `${String(field)} format is invalid`,
            severity: options.severity ?? 'error',
          }],
        };
      }

      return { valid: true, issues: [] };
    },
  };
}
