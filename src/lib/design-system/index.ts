/**
 * @fileoverview Design System Entry Point
 * Premium Data Platform Design System
 * 
 * This module exports all design system utilities, tokens, and types
 * for consistent usage across the application.
 * 
 * IMPORTANT: Uses explicit named exports for IDE performance optimization.
 */

// Design Tokens
export {
  typography,
  spacing,
  colors,
  animation,
  elevation,
  radius,
  zIndex,
  breakpoints,
  componentSizes,
  density,
  designTokens,
  type DesignTokens,
} from './tokens';

// Component Variants
export {
  cardVariants,
  type CardVariants,
  statVariants,
  statValueVariants,
  statLabelVariants,
  type StatVariants,
  extendedBadgeVariants,
  type ExtendedBadgeVariants,
  healthIndicatorVariants,
  type HealthIndicatorVariants,
  sectionHeaderVariants,
  sectionTitleVariants,
  type SectionHeaderVariants,
  iconContainerVariants,
  type IconContainerVariants,
  dataRowVariants,
  type DataRowVariants,
  panelVariants,
  type PanelVariants,
  trendVariants,
  type TrendVariants,
  skeletonVariants,
  type SkeletonVariants,
} from './variants';

// Utility Functions
export {
  getHealthLevel,
  getHealthLabel,
  getHealthColor,
  getHealthBgColor,
  getStatusColor,
  getStatusBgColor,
  getPriorityColor,
  getPriorityBadgeVariant,
  formatCompactNumber,
  formatPercentageChange,
  formatPercentage,
  getTrendDirection,
  getTrendArrow,
  getRelativeTime,
  formatDisplayDate,
  truncate,
  getInitials,
  getStatAriaLabel,
  getContrastTextColor,
} from './utils';

// Types
export type {
  Size,
  Density,
  StatusLevel,
  HealthLevel,
  Priority,
  BaseComponentProps,
  InteractiveProps,
  DataComponentProps,
  StatCardData,
  ActionItem,
  ActionGroup,
  ColumnDef,
  TablePagination,
  TableSorting,
  NavItem,
  NavGroup,
  WidgetConfig,
  WidgetProps,
  FormFieldConfig,
  AlertConfig,
  ChartDataPoint,
  ChartConfig,
  ContactSummary,
  ProfileBadge,
  IntelligenceInsight,
} from './types';
