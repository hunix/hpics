/**
 * Label Formatting Utilities (v3.9.35)
 * Convert camelCase/snake_case system values to human-readable labels
 */

/**
 * Convert camelCase/snake_case to human-readable labels
 */
export function humanizeLabel(key: string): string {
  if (!key || typeof key !== 'string') return '';
  
  return key
    // Split camelCase: insert space before uppercase letters
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace underscores and hyphens with spaces
    .replace(/[-_]/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, c => c.toUpperCase())
    // Handle common acronyms
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bOpsec\b/g, 'OPSEC')
    .replace(/\bTscm\b/g, 'TSCM')
    .replace(/\bMice\b/g, 'MICE')
    .replace(/\bDna\b/g, 'DNA')
    .replace(/\bAi\b/g, 'AI')
    .trim();
}

/**
 * Common system value mappings for better human display
 */
const VALUE_MAPPINGS: Record<string, string> = {
  // Common status values
  'highly_resistant': 'Highly Resistant',
  'moderately_resistant': 'Moderately Resistant',
  'susceptible': 'Susceptible',
  'highly_susceptible': 'Highly Susceptible',
  
  // Risk levels
  'very_low': 'Very Low',
  'very-low': 'Very Low',
  'low': 'Low',
  'medium': 'Medium',
  'moderate': 'Moderate',
  'high': 'High',
  'very_high': 'Very High',
  'very-high': 'Very High',
  'critical': 'Critical',
  'extreme': 'Extreme',
  
  // Trajectory/trend values
  'stable': 'Stable',
  'improving': 'Improving',
  'declining': 'Declining',
  'volatile': 'Volatile',
  'ascending': 'Ascending',
  'descending': 'Descending',
  
  // Boolean-like
  'true': 'Yes',
  'false': 'No',
  'none': 'None',
  'n/a': 'N/A',
  'na': 'N/A',
  'unknown': 'Unknown',
  'null': 'Not Available',
  'undefined': 'Not Available',
};

/**
 * Humanize a value (handles both labels and known system values)
 */
export function humanizeValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not Available';
  
  const str = String(value).trim();
  if (!str || str === 'null' || str === 'undefined') return 'Not Available';
  
  // Check known mappings first
  const lower = str.toLowerCase();
  if (VALUE_MAPPINGS[lower]) return VALUE_MAPPINGS[lower];
  
  // Apply humanization
  return humanizeLabel(str);
}

/**
 * Smart value formatting based on field name and value
 */
export function smartFormatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  
  const keyLower = key.toLowerCase();
  
  // Handle numeric values
  if (typeof value === 'number') {
    // Percentage fields
    if (keyLower.includes('score') || keyLower.includes('percent') || keyLower.includes('probability') || keyLower.includes('likelihood') || keyLower.includes('susceptibility') || keyLower.includes('rate')) {
      // If value is 0-1, multiply by 100
      const normalized = value <= 1 && value > 0 ? value * 100 : value;
      return `${Math.round(normalized)}%`;
    }
    
    // Count fields
    if (keyLower.includes('count') || keyLower.includes('total') || keyLower.includes('number')) {
      return value.toLocaleString();
    }
    
    // Default number formatting
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }
  
  // Handle string values
  if (typeof value === 'string') {
    return humanizeValue(value);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return `${value.length} items`;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return '[Complex Data]';
  }
  
  return String(value);
}
