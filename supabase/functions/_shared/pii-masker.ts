// PII Masking Layer for Secure AI Processing
// Ensures no raw PII leaves the system when using AI

export interface PIIMapping {
  token: string;
  original: string;
  type: PIIType;
}

export type PIIType = 
  | 'name' 
  | 'email' 
  | 'phone' 
  | 'address' 
  | 'ssn' 
  | 'credit_card' 
  | 'account' 
  | 'dob' 
  | 'ip_address'
  | 'url'
  | 'custom';

interface MaskingResult {
  masked: string;
  mappings: PIIMapping[];
}

// Regex patterns for PII detection
const PII_PATTERNS: Record<PIIType, RegExp> = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  
  // Phone numbers (various formats)
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // SSN (US format)
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
  
  // Credit card numbers (13-19 digits, optionally separated)
  credit_card: /\b(?:\d{4}[-.\s]?){3,4}\d{1,4}\b/g,
  
  // Account numbers (8-20 digits)
  account: /\b\d{8,20}\b/g,
  
  // IP addresses
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // Dates of birth (various formats)
  dob: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  
  // URLs (might contain identifiers)
  url: /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
  
  // Street addresses (simplified)
  address: /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy)\b\.?(?:,?\s*(?:Apt|Suite|Unit|#)\s*\d+[A-Za-z]?)?\s*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi,
  
  // Names are handled separately with context-aware detection
  name: /(?:)/g, // Placeholder - names are detected contextually
  
  // Custom placeholder
  custom: /(?:)/g,
};

// Common name patterns (first names, titles, etc.)
const NAME_PREFIXES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Sir', 'Lady', 'Rev', 'Hon'];
const NAME_PATTERN = new RegExp(
  `(?:(?:${NAME_PREFIXES.join('|')})\\.?\\s+)?[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+`,
  'g'
);

/**
 * Masks PII in text and returns the masked text with mappings for unmasking
 */
export function maskPII(text: string, additionalPatterns?: Record<string, RegExp>): MaskingResult {
  if (!text || typeof text !== 'string') {
    return { masked: text || '', mappings: [] };
  }

  const mappings: PIIMapping[] = [];
  const counters: Record<PIIType, number> = {
    name: 0,
    email: 0,
    phone: 0,
    address: 0,
    ssn: 0,
    credit_card: 0,
    account: 0,
    dob: 0,
    ip_address: 0,
    url: 0,
    custom: 0,
  };

  let masked = text;

  // Helper to add mapping and replace
  const maskValue = (value: string, type: PIIType): string => {
    // Check if already masked
    if (value.match(/^\[[A-Z_]+_\d+\]$/)) {
      return value;
    }
    
    // Check if we've already seen this value
    const existing = mappings.find(m => m.original === value);
    if (existing) {
      return existing.token;
    }

    counters[type]++;
    const token = `[${type.toUpperCase()}_${counters[type]}]`;
    mappings.push({ token, original: value, type });
    return token;
  };

  // Process in order of specificity (most specific first)
  
  // 1. SSN (very specific pattern)
  masked = masked.replace(PII_PATTERNS.ssn, (match) => maskValue(match, 'ssn'));
  
  // 2. Credit cards
  masked = masked.replace(PII_PATTERNS.credit_card, (match) => {
    // Exclude phone numbers that might match
    if (match.length < 12) return match;
    return maskValue(match, 'credit_card');
  });
  
  // 3. Email addresses
  masked = masked.replace(PII_PATTERNS.email, (match) => maskValue(match, 'email'));
  
  // 4. Phone numbers
  masked = masked.replace(PII_PATTERNS.phone, (match) => maskValue(match, 'phone'));
  
  // 5. IP addresses
  masked = masked.replace(PII_PATTERNS.ip_address, (match) => maskValue(match, 'ip_address'));
  
  // 6. URLs (after emails to avoid conflicts)
  masked = masked.replace(PII_PATTERNS.url, (match) => maskValue(match, 'url'));
  
  // 7. Dates of birth
  masked = masked.replace(PII_PATTERNS.dob, (match) => maskValue(match, 'dob'));
  
  // 8. Street addresses
  masked = masked.replace(PII_PATTERNS.address, (match) => maskValue(match, 'address'));
  
  // 9. Names (context-aware)
  masked = masked.replace(NAME_PATTERN, (match) => {
    // Skip if it looks like a company name or common phrase
    const lowerMatch = match.toLowerCase();
    const skipPhrases = ['thank you', 'best regards', 'kind regards', 'sincerely', 'dear sir', 'dear madam'];
    if (skipPhrases.some(phrase => lowerMatch.includes(phrase))) {
      return match;
    }
    return maskValue(match, 'name');
  });
  
  // 10. Account numbers (last, as they're generic)
  masked = masked.replace(PII_PATTERNS.account, (match) => {
    // Skip if already masked or is a year
    if (match.length === 4 && parseInt(match) >= 1900 && parseInt(match) <= 2100) {
      return match;
    }
    return maskValue(match, 'account');
  });

  // 11. Apply any additional custom patterns
  if (additionalPatterns) {
    for (const [name, pattern] of Object.entries(additionalPatterns)) {
      masked = masked.replace(pattern, (match) => maskValue(match, 'custom'));
    }
  }

  return { masked, mappings };
}

/**
 * Unmasks text by replacing tokens with original values
 */
export function unmaskPII(text: string, mappings: PIIMapping[]): string {
  if (!text || !mappings || mappings.length === 0) {
    return text || '';
  }

  let unmasked = text;
  
  // Sort mappings by token length (longest first) to avoid partial replacements
  const sortedMappings = [...mappings].sort((a, b) => b.token.length - a.token.length);
  
  for (const mapping of sortedMappings) {
    // Use exact replacement to avoid regex special character issues
    const tokenRegex = new RegExp(escapeRegExp(mapping.token), 'g');
    unmasked = unmasked.replace(tokenRegex, mapping.original);
  }

  return unmasked;
}

/**
 * Masks PII in structured data (objects/arrays)
 */
export function maskPIIInObject<T>(data: T, additionalPatterns?: Record<string, RegExp>): { masked: T; mappings: PIIMapping[] } {
  const allMappings: PIIMapping[] = [];
  
  function processValue(value: unknown): unknown {
    if (typeof value === 'string') {
      const result = maskPII(value, additionalPatterns);
      allMappings.push(...result.mappings);
      return result.masked;
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (value && typeof value === 'object') {
      const processed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }
    return value;
  }

  const masked = processValue(data) as T;
  
  // Deduplicate mappings
  const uniqueMappings = Array.from(
    new Map(allMappings.map(m => [m.original, m])).values()
  );
  
  return { masked, mappings: uniqueMappings };
}

/**
 * Unmasks PII in structured data (objects/arrays)
 */
export function unmaskPIIInObject<T>(data: T, mappings: PIIMapping[]): T {
  function processValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return unmaskPII(value, mappings);
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (value && typeof value === 'object') {
      const processed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }
    return value;
  }

  return processValue(data) as T;
}

/**
 * Checks if text contains any PII
 */
export function containsPII(text: string): boolean {
  const result = maskPII(text);
  return result.mappings.length > 0;
}

/**
 * Gets a summary of PII types found in text
 */
export function getPIISummary(text: string): Record<PIIType, number> {
  const result = maskPII(text);
  const summary: Record<PIIType, number> = {
    name: 0,
    email: 0,
    phone: 0,
    address: 0,
    ssn: 0,
    credit_card: 0,
    account: 0,
    dob: 0,
    ip_address: 0,
    url: 0,
    custom: 0,
  };
  
  for (const mapping of result.mappings) {
    summary[mapping.type]++;
  }
  
  return summary;
}

// Helper to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a secure context for handling PII throughout a request lifecycle
 */
export class PIIMaskingContext {
  private mappings: PIIMapping[] = [];
  
  mask(text: string): string {
    const result = maskPII(text);
    this.mergeMappings(result.mappings);
    return result.masked;
  }
  
  maskObject<T>(data: T): T {
    const result = maskPIIInObject(data);
    this.mergeMappings(result.mappings);
    return result.masked;
  }
  
  unmask(text: string): string {
    return unmaskPII(text, this.mappings);
  }
  
  unmaskObject<T>(data: T): T {
    return unmaskPIIInObject(data, this.mappings);
  }
  
  getMappings(): PIIMapping[] {
    return [...this.mappings];
  }
  
  getMappingCount(): number {
    return this.mappings.length;
  }
  
  getPIITypes(): PIIType[] {
    return [...new Set(this.mappings.map(m => m.type))];
  }
  
  private mergeMappings(newMappings: PIIMapping[]): void {
    for (const mapping of newMappings) {
      const existing = this.mappings.find(m => m.original === mapping.original);
      if (!existing) {
        this.mappings.push(mapping);
      }
    }
  }
  
  clear(): void {
    this.mappings = [];
  }
}
