/**
 * @fileoverview Data Integrity Guard for AI Intelligence Operations
 * Ensures data quality, validates AI responses, and maintains integrity.
 */

// ============= SCHEMA VALIDATION =============
export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
  received: unknown;
  expected: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export function validateAgainstSchema(
  data: unknown,
  schema: ValidationSchema,
  path = ''
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (data === null || data === undefined) {
    errors.push({
      path: path || 'root',
      message: 'Data is null or undefined',
      received: data,
      expected: schema.type,
    });
    return { valid: false, errors, warnings };
  }

  const actualType = Array.isArray(data) ? 'array' : typeof data;

  if (actualType !== schema.type) {
    errors.push({
      path: path || 'root',
      message: `Type mismatch`,
      received: actualType,
      expected: schema.type,
    });
    return { valid: false, errors, warnings };
  }

  if (schema.type === 'object' && schema.properties) {
    const obj = data as Record<string, unknown>;

    // Check required fields
    for (const requiredField of schema.required || []) {
      if (!(requiredField in obj) || obj[requiredField] === undefined) {
        errors.push({
          path: `${path}.${requiredField}`,
          message: 'Required field missing',
          received: undefined,
          expected: 'defined value',
        });
      }
    }

    // Validate each property
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in obj) {
        const result = validateAgainstSchema(obj[key], propSchema, `${path}.${key}`);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }
  }

  if (schema.type === 'array' && schema.items) {
    const arr = data as unknown[];
    arr.forEach((item, index) => {
      const result = validateAgainstSchema(item, schema.items!, `${path}[${index}]`);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
  }

  if (schema.type === 'number') {
    const num = data as number;
    if (schema.minimum !== undefined && num < schema.minimum) {
      errors.push({
        path,
        message: `Value below minimum`,
        received: num,
        expected: `>= ${schema.minimum}`,
      });
    }
    if (schema.maximum !== undefined && num > schema.maximum) {
      errors.push({
        path,
        message: `Value above maximum`,
        received: num,
        expected: `<= ${schema.maximum}`,
      });
    }
  }

  if (schema.type === 'string') {
    const str = data as string;
    if (schema.minLength !== undefined && str.length < schema.minLength) {
      warnings.push({
        path,
        message: `String shorter than expected`,
        suggestion: `Minimum length is ${schema.minLength}`,
      });
    }
    if (schema.enum && !schema.enum.includes(str)) {
      errors.push({
        path,
        message: `Value not in allowed values`,
        received: str,
        expected: schema.enum.join(' | '),
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

// ============= AI RESPONSE SCHEMAS =============
export const AI_RESPONSE_SCHEMAS: Record<string, ValidationSchema> = {
  behavioralAnalysis: {
    type: 'object',
    required: ['personality_traits', 'communication_style', 'confidence_score'],
    properties: {
      personality_traits: {
        type: 'array',
        items: {
          type: 'object',
          required: ['trait', 'strength'],
          properties: {
            trait: { type: 'string' },
            strength: { type: 'number', minimum: 0, maximum: 100 },
            evidence: { type: 'string' },
          },
        },
      },
      communication_style: {
        type: 'object',
        required: ['primary_style', 'formality_level'],
        properties: {
          primary_style: { type: 'string', enum: ['analytical', 'driver', 'expressive', 'amiable'] },
          formality_level: { type: 'string', enum: ['very_formal', 'formal', 'neutral', 'informal', 'very_informal'] },
        },
      },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  romanticIntelligence: {
    type: 'object',
    required: ['attachment_style', 'love_languages', 'compatibility_markers'],
    properties: {
      attachment_style: {
        type: 'object',
        required: ['primary', 'secondary'],
        properties: {
          primary: { type: 'string', enum: ['secure', 'anxious', 'avoidant', 'disorganized'] },
          secondary: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      love_languages: {
        type: 'array',
        items: {
          type: 'object',
          required: ['language', 'priority'],
          properties: {
            language: { type: 'string' },
            priority: { type: 'number', minimum: 1, maximum: 5 },
            intensity: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
      },
      compatibility_markers: { type: 'array' },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  communityClass: {
    type: 'object',
    required: ['stratum', 'cultural_capital', 'network_capital'],
    properties: {
      stratum: { type: 'number', minimum: 1, maximum: 9 },
      cultural_capital: {
        type: 'object',
        properties: {
          education_tier: { type: 'string' },
          refinement_score: { type: 'number', minimum: 0, maximum: 100 },
          taste_markers: { type: 'array' },
        },
      },
      network_capital: {
        type: 'object',
        properties: {
          reach_score: { type: 'number', minimum: 0, maximum: 100 },
          leverage_potential: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
        },
      },
      mobility_trajectory: { type: 'string', enum: ['ascending', 'stable', 'descending'] },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  deceptionAnalysis: {
    type: 'object',
    required: ['overall_deception_score', 'indicators', 'confidence_score'],
    properties: {
      overall_deception_score: { type: 'number', minimum: 0, maximum: 100 },
      indicators: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'severity', 'description'],
          properties: {
            type: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            description: { type: 'string' },
            evidence: { type: 'string' },
          },
        },
      },
      cross_modal_conflicts: { type: 'array' },
      baseline_deviation: { type: 'number' },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
};

// ============= CONFIDENCE THRESHOLDS =============
export interface ConfidenceThresholds {
  minimum: number;
  warning: number;
  acceptable: number;
  high: number;
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  minimum: 0.3,
  warning: 0.5,
  acceptable: 0.7,
  high: 0.85,
};

export function evaluateConfidence(
  score: number,
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS
): { level: 'rejected' | 'low' | 'acceptable' | 'high'; canUse: boolean; warning?: string } {
  if (score < thresholds.minimum) {
    return { level: 'rejected', canUse: false, warning: 'Confidence too low to use' };
  }
  if (score < thresholds.warning) {
    return { level: 'low', canUse: true, warning: 'Low confidence - verify manually' };
  }
  if (score < thresholds.acceptable) {
    return { level: 'acceptable', canUse: true };
  }
  return { level: 'high', canUse: true };
}

// ============= DATA FRESHNESS =============
export interface FreshnessConfig {
  staleAfterHours: number;
  expiredAfterHours: number;
  criticalDataMaxAge: number;
}

export const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  staleAfterHours: 24,
  expiredAfterHours: 168, // 1 week
  criticalDataMaxAge: 4,
};

export function evaluateFreshness(
  lastUpdated: Date | string,
  config: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG
): { status: 'fresh' | 'stale' | 'expired'; ageHours: number; refreshRecommended: boolean } {
  const lastUpdate = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const ageMs = Date.now() - lastUpdate.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours > config.expiredAfterHours) {
    return { status: 'expired', ageHours, refreshRecommended: true };
  }
  if (ageHours > config.staleAfterHours) {
    return { status: 'stale', ageHours, refreshRecommended: true };
  }
  return { status: 'fresh', ageHours, refreshRecommended: false };
}

// ============= DATA QUALITY SCORING =============
export interface DataQualityScore {
  overall: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
}

export interface DataQualityInput {
  hasRequiredFields: boolean;
  filledFieldsRatio: number;
  confidenceScore?: number;
  lastUpdated?: Date | string;
  validationResult?: ValidationResult;
  crossReferenceMatch?: number;
}

export function calculateDataQualityScore(input: DataQualityInput): DataQualityScore {
  const completeness = input.filledFieldsRatio * 100;
  
  const accuracy = input.confidenceScore 
    ? input.confidenceScore * 100 
    : 50;

  const consistency = input.crossReferenceMatch !== undefined
    ? input.crossReferenceMatch * 100
    : 70;

  const timeliness = input.lastUpdated
    ? Math.max(0, 100 - evaluateFreshness(input.lastUpdated).ageHours * 2)
    : 50;

  const validity = input.validationResult
    ? input.validationResult.valid 
      ? 100 - input.validationResult.warnings.length * 5
      : 100 - input.validationResult.errors.length * 20
    : 70;

  const overall = (
    completeness * 0.25 +
    accuracy * 0.25 +
    consistency * 0.2 +
    timeliness * 0.15 +
    validity * 0.15
  );

  return {
    overall: Math.round(Math.max(0, Math.min(100, overall))),
    completeness: Math.round(completeness),
    accuracy: Math.round(accuracy),
    consistency: Math.round(consistency),
    timeliness: Math.round(timeliness),
    validity: Math.round(validity),
  };
}

// ============= DUPLICATE DETECTION =============
export interface DuplicateCandidate {
  id: string;
  matchScore: number;
  matchedFields: string[];
  suggestedAction: 'merge' | 'review' | 'ignore';
}

export function detectDuplicates(
  newData: Record<string, unknown>,
  existingRecords: Array<{ id: string; data: Record<string, unknown> }>,
  matchFields: string[],
  threshold = 0.7
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const record of existingRecords) {
    const matchedFields: string[] = [];
    let totalWeight = 0;
    let matchWeight = 0;

    for (const field of matchFields) {
      const newValue = String(newData[field] || '').toLowerCase().trim();
      const existingValue = String(record.data[field] || '').toLowerCase().trim();

      if (!newValue || !existingValue) continue;

      totalWeight += 1;

      if (newValue === existingValue) {
        matchWeight += 1;
        matchedFields.push(field);
      } else if (similarity(newValue, existingValue) > 0.8) {
        matchWeight += 0.8;
        matchedFields.push(field);
      }
    }

    const matchScore = totalWeight > 0 ? matchWeight / totalWeight : 0;

    if (matchScore >= threshold) {
      candidates.push({
        id: record.id,
        matchScore,
        matchedFields,
        suggestedAction: matchScore > 0.9 ? 'merge' : matchScore > 0.8 ? 'review' : 'ignore',
      });
    }
  }

  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

// Simple Levenshtein-based similarity
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ============= AUTO REPAIR SUGGESTIONS =============
export interface RepairSuggestion {
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  confidence: number;
  source: string;
  action: 'replace' | 'append' | 'merge';
}

export function generateRepairSuggestions(
  data: Record<string, unknown>,
  referenceData: Array<{ source: string; data: Record<string, unknown> }>
): RepairSuggestion[] {
  const suggestions: RepairSuggestion[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') {
      // Look for this field in reference data
      for (const ref of referenceData) {
        const refValue = ref.data[field];
        if (refValue !== null && refValue !== undefined && refValue !== '') {
          suggestions.push({
            field,
            currentValue: value,
            suggestedValue: refValue,
            confidence: 0.7,
            source: ref.source,
            action: 'replace',
          });
          break;
        }
      }
    }
  }

  return suggestions;
}

// ============= CROSS-REFERENCE VERIFICATION =============
export interface CrossReferenceResult {
  field: string;
  sources: Array<{ source: string; value: unknown }>;
  consensus: unknown | null;
  consensusStrength: number;
  conflicts: boolean;
}

export function verifyCrossReferences(
  field: string,
  sources: Array<{ source: string; data: Record<string, unknown> }>
): CrossReferenceResult {
  const values = sources
    .map(s => ({ source: s.source, value: s.data[field] }))
    .filter(v => v.value !== null && v.value !== undefined);

  if (values.length === 0) {
    return { field, sources: [], consensus: null, consensusStrength: 0, conflicts: false };
  }

  // Count occurrences
  const valueCounts = new Map<string, number>();
  for (const v of values) {
    const key = JSON.stringify(v.value);
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  }

  // Find consensus
  let maxCount = 0;
  let consensusValue: unknown = null;
  for (const [key, count] of valueCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      consensusValue = JSON.parse(key);
    }
  }

  const consensusStrength = values.length > 0 ? maxCount / values.length : 0;
  const conflicts = valueCounts.size > 1;

  return {
    field,
    sources: values,
    consensus: consensusValue,
    consensusStrength,
    conflicts,
  };
}
