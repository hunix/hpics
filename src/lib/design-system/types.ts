/**
 * @fileoverview Design System Types
 * Type definitions for the Premium Data Platform Design System
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// SIZE & DENSITY TYPES
// ============================================================================

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Density = 'compact' | 'comfortable' | 'spacious';

// ============================================================================
// STATUS & STATE TYPES
// ============================================================================

export type StatusLevel = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface InteractiveProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface DataComponentProps<T> extends BaseComponentProps {
  data?: T;
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

// ============================================================================
// STAT CARD TYPES
// ============================================================================

export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  color?: string;
  description?: string;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export interface ActionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

export interface ActionGroup {
  id: string;
  label?: string;
  actions: ActionItem[];
}

// ============================================================================
// DATA TABLE TYPES
// ============================================================================

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface TableSorting {
  column: string;
  direction: 'asc' | 'desc';
  onSort: (column: string, direction: 'asc' | 'desc') => void;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: NavItem[];
  isNew?: boolean;
  disabled?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  color?: string;
}

// ============================================================================
// WIDGET / DASHLET TYPES
// ============================================================================

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  visible: boolean;
  order: number;
  size?: 'sm' | 'md' | 'lg' | 'full';
  refreshInterval?: number;
}

export interface WidgetProps extends BaseComponentProps {
  config: WidgetConfig;
  onRefresh?: () => void;
  onRemove?: () => void;
  onConfigure?: () => void;
  isEditing?: boolean;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================================================
// ALERT / NOTIFICATION TYPES
// ============================================================================

export interface AlertConfig {
  id: string;
  title: string;
  message: string;
  level: StatusLevel;
  timestamp: Date;
  read?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

// ============================================================================
// CHART / DATA VIS TYPES
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
  title?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

// ============================================================================
// CONTACT / PROFILE TYPES (Domain-specific)
// ============================================================================

export interface ContactSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  relationshipType?: string;
  healthScore?: number;
  lastContact?: Date;
  isFavorite?: boolean;
}

export interface ProfileBadge {
  type: 'verified' | 'vip' | 'new' | 'inactive' | 'warning';
  label?: string;
}

// ============================================================================
// INTELLIGENCE TYPES (Domain-specific)
// ============================================================================

export interface IntelligenceInsight {
  id: string;
  type: 'anomaly' | 'recommendation' | 'alert' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  priority: Priority;
  timestamp: Date;
  relatedProfiles?: string[];
  actionable?: boolean;
}
