/**
 * @fileoverview Design System Utilities
 * Helper functions for working with the design system
 */

import { type HealthLevel, type StatusLevel, type Priority } from './types';

// ============================================================================
// HEALTH SCORE UTILITIES
// ============================================================================

/**
 * Convert a numeric health score (0-100) to a health level
 */
export function getHealthLevel(score: number): HealthLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Get display label for a health level
 */
export function getHealthLabel(level: HealthLevel): string {
  const labels: Record<HealthLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',
  };
  return labels[level];
}

/**
 * Get color class for a health level
 */
export function getHealthColor(level: HealthLevel): string {
  const colors: Record<HealthLevel, string> = {
    excellent: 'text-emerald-600 dark:text-emerald-400',
    good: 'text-blue-600 dark:text-blue-400',
    fair: 'text-amber-600 dark:text-amber-400',
    poor: 'text-orange-600 dark:text-orange-400',
    critical: 'text-rose-600 dark:text-rose-400',
  };
  return colors[level];
}

/**
 * Get background color class for a health level
 */
export function getHealthBgColor(level: HealthLevel): string {
  const colors: Record<HealthLevel, string> = {
    excellent: 'bg-emerald-500/10',
    good: 'bg-blue-500/10',
    fair: 'bg-amber-500/10',
    poor: 'bg-orange-500/10',
    critical: 'bg-rose-500/10',
  };
  return colors[level];
}

// ============================================================================
// STATUS UTILITIES
// ============================================================================

/**
 * Get color class for a status level
 */
export function getStatusColor(status: StatusLevel): string {
  const colors: Record<StatusLevel, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-rose-600 dark:text-rose-400',
    info: 'text-blue-600 dark:text-blue-400',
    neutral: 'text-muted-foreground',
  };
  return colors[status];
}

/**
 * Get background color class for a status level
 */
export function getStatusBgColor(status: StatusLevel): string {
  const colors: Record<StatusLevel, string> = {
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    error: 'bg-rose-500/10',
    info: 'bg-blue-500/10',
    neutral: 'bg-muted',
  };
  return colors[status];
}

// ============================================================================
// PRIORITY UTILITIES
// ============================================================================

/**
 * Get color class for a priority level
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: 'text-slate-500',
    medium: 'text-blue-600 dark:text-blue-400',
    high: 'text-amber-600 dark:text-amber-400',
    urgent: 'text-orange-600 dark:text-orange-400',
    critical: 'text-rose-600 dark:text-rose-400',
  };
  return colors[priority];
}

/**
 * Get badge variant for a priority level
 */
export function getPriorityBadgeVariant(priority: Priority): 'secondary' | 'info' | 'warning' | 'error' {
  const variants: Record<Priority, 'secondary' | 'info' | 'warning' | 'error'> = {
    low: 'secondary',
    medium: 'info',
    high: 'warning',
    urgent: 'warning',
    critical: 'error',
  };
  return variants[priority];
}

// ============================================================================
// NUMBER FORMATTING UTILITIES
// ============================================================================

/**
 * Format a large number with K/M/B suffix
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format a percentage with sign
 */
export function formatPercentageChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================================
// TREND UTILITIES
// ============================================================================

/**
 * Determine trend direction from a change value
 */
export function getTrendDirection(change: number): 'up' | 'down' | 'neutral' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

/**
 * Get trend arrow character
 */
export function getTrendArrow(trend: 'up' | 'down' | 'neutral'): string {
  const arrows = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };
  return arrows[trend];
}

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

/**
 * Get relative time description
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

/**
 * Format a date for display
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, maxLength)
    .join('')
    .toUpperCase();
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Get aria-label for a stat value
 */
export function getStatAriaLabel(title: string, value: string | number, change?: number): string {
  let label = `${title}: ${value}`;
  if (change !== undefined) {
    const direction = change >= 0 ? 'increased' : 'decreased';
    label += `, ${direction} by ${Math.abs(change)}%`;
  }
  return label;
}

/**
 * Get color contrast safe text color
 */
export function getContrastTextColor(bgColorHsl: string): 'text-white' | 'text-black' {
  // Simple heuristic based on lightness
  const lightness = parseInt(bgColorHsl.match(/(\d+)%\)$/)?.[1] || '50');
  return lightness > 50 ? 'text-black' : 'text-white';
}
