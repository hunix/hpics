/**
 * Dossier Data Formatting Utilities (v3.9.20)
 * Human-readable formatting for intelligence data display
 */

/**
 * Format a number as a percentage with proper handling of edge cases
 */
export function formatPercent(value: unknown, decimals = 0): string {
  if (value === null || value === undefined || value === '') return '—';
  
  const num = Number(value);
  if (isNaN(num)) return '—';
  
  // If value is already 0-100 range, just format
  if (num >= 0 && num <= 100) {
    return `${num.toFixed(decimals)}%`;
  }
  
  // If value is 0-1 range (decimal), multiply by 100
  if (num >= 0 && num <= 1) {
    return `${(num * 100).toFixed(decimals)}%`;
  }
  
  // Handle values > 100 (just show them)
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format a score value with proper scale detection
 */
export function formatScore(value: unknown, outOf = 100): string {
  if (value === null || value === undefined || value === '') return '—';
  
  const num = Number(value);
  if (isNaN(num)) return '—';
  
  // If 0-1 scale, convert to percentage
  if (outOf === 100 && num >= 0 && num <= 1) {
    return `${Math.round(num * 100)}/100`;
  }
  
  return `${Math.round(num)}/${outOf}`;
}

/**
 * Format a decimal number with thousands separators
 */
export function formatNumber(value: unknown, decimals = 0): string {
  if (value === null || value === undefined || value === '') return '—';
  
  const num = Number(value);
  if (isNaN(num)) return '—';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a count with "No X" for zero values
 */
export function formatCount(value: unknown, singular: string, plural?: string): string {
  if (value === null || value === undefined || value === '') return `No ${plural || singular + 's'}`;
  
  const num = Number(value);
  if (isNaN(num) || num === 0) return `No ${plural || singular + 's'}`;
  
  if (num === 1) return `1 ${singular}`;
  return `${num.toLocaleString()} ${plural || singular + 's'}`;
}

/**
 * Format a string value with fallback for empty/null
 */
export function formatText(value: unknown, fallback = 'Not available'): string {
  if (value === null || value === undefined || value === '') return fallback;
  
  const text = String(value).trim();
  if (!text || text === 'null' || text === 'undefined' || text === 'NaN') return fallback;
  
  return text;
}

/**
 * Format a date value
 */
export function formatDate(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  
  try {
    const date = new Date(String(value));
    if (isNaN(date.getTime())) return fallback;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  
  try {
    const date = new Date(String(value));
    if (isNaN(date.getTime())) return '—';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return '—';
  }
}

/**
 * Convert a level/status string to human-readable format
 */
export function formatLevel(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  
  const text = String(value);
  
  // Handle common system values
  const mappings: Record<string, string> = {
    'very_low': 'Very Low',
    'very-low': 'Very Low',
    'verylow': 'Very Low',
    'low': 'Low',
    'medium': 'Medium',
    'moderate': 'Moderate',
    'high': 'High',
    'very_high': 'Very High',
    'very-high': 'Very High',
    'veryhigh': 'Very High',
    'critical': 'Critical',
    'extreme': 'Extreme',
    'none': 'None',
    'n/a': 'N/A',
    'na': 'N/A',
    'unknown': 'Unknown',
    'stable': 'Stable',
    'improving': 'Improving',
    'declining': 'Declining',
    'volatile': 'Volatile',
    'ascending': 'Ascending',
    'descending': 'Descending',
  };
  
  const lower = text.toLowerCase().trim();
  if (mappings[lower]) return mappings[lower];
  
  // Convert snake_case or kebab-case to Title Case
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format boolean as human text
 */
export function formatBoolean(value: unknown, trueText = 'Yes', falseText = 'No'): string {
  if (value === null || value === undefined) return '—';
  return value ? trueText : falseText;
}

/**
 * Get variant for a score (for styling)
 */
export function getScoreVariant(value: unknown): 'default' | 'success' | 'warning' | 'danger' {
  if (value === null || value === undefined) return 'default';
  
  const num = Number(value);
  if (isNaN(num)) return 'default';
  
  // Normalize to 0-100 scale
  const normalized = num <= 1 ? num * 100 : num;
  
  if (normalized >= 70) return 'success';
  if (normalized >= 40) return 'warning';
  if (normalized > 0) return 'danger';
  return 'default';
}

/**
 * Get variant for a risk score (inverted - high = bad)
 */
export function getRiskVariant(value: unknown): 'default' | 'success' | 'warning' | 'danger' {
  if (value === null || value === undefined) return 'default';
  
  const num = Number(value);
  if (isNaN(num)) return 'default';
  
  // Normalize to 0-100 scale
  const normalized = num <= 1 ? num * 100 : num;
  
  if (normalized >= 70) return 'danger';
  if (normalized >= 40) return 'warning';
  if (normalized > 0) return 'success';
  return 'default';
}

/**
 * Check if a value is empty/null/undefined
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true;
  return false;
}

/**
 * Safely extract and format a nested value
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return (current as T) ?? defaultValue;
}
