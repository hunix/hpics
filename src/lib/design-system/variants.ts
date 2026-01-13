/**
 * @fileoverview Component Variants
 * Centralized variant definitions using class-variance-authority (CVA)
 * 
 * This module provides consistent component variants that can be reused
 * across multiple components for visual consistency.
 */

import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// CARD VARIANTS
// ============================================================================

export const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md hover:shadow-lg',
        outline: 'border-2',
        ghost: 'border-transparent shadow-none bg-transparent',
        glass: 'bg-card/80 backdrop-blur-sm border-white/10',
        gradient: 'bg-gradient-to-br from-card to-card/80 border-0',
        interactive: 'shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      status: {
        default: '',
        success: 'border-l-4 border-l-emerald-500',
        warning: 'border-l-4 border-l-amber-500',
        error: 'border-l-4 border-l-rose-500',
        info: 'border-l-4 border-l-blue-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      status: 'default',
    },
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;

// ============================================================================
// STAT DISPLAY VARIANTS
// ============================================================================

export const statVariants = cva(
  'flex flex-col',
  {
    variants: {
      size: {
        xs: 'gap-0.5',
        sm: 'gap-1',
        md: 'gap-1.5',
        lg: 'gap-2',
        xl: 'gap-3',
      },
      align: {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
      },
    },
    defaultVariants: {
      size: 'md',
      align: 'left',
    },
  }
);

export const statValueVariants = cva(
  'font-semibold tracking-tight',
  {
    variants: {
      size: {
        xs: 'text-lg',
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-3xl',
        xl: 'text-4xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export const statLabelVariants = cva(
  'text-muted-foreground',
  {
    variants: {
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type StatVariants = VariantProps<typeof statVariants>;

// ============================================================================
// BADGE VARIANTS (Extended)
// ============================================================================

export const extendedBadgeVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border border-input bg-background hover:bg-accent',
        success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20',
        error: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20',
        info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
        purple: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/20',
        gradient: 'bg-gradient-to-r from-primary to-primary/60 text-primary-foreground',
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5 rounded',
        sm: 'text-xs px-2 py-0.5 rounded-md',
        md: 'text-sm px-2.5 py-1 rounded-md',
        lg: 'text-base px-3 py-1.5 rounded-lg',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-105',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      interactive: false,
    },
  }
);

export type ExtendedBadgeVariants = VariantProps<typeof extendedBadgeVariants>;

// ============================================================================
// HEALTH INDICATOR VARIANTS
// ============================================================================

export const healthIndicatorVariants = cva(
  'rounded-full flex items-center justify-center font-semibold',
  {
    variants: {
      level: {
        excellent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20',
        good: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20',
        fair: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20',
        poor: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/20',
        critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20',
      },
      size: {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
      },
    },
    defaultVariants: {
      level: 'good',
      size: 'md',
    },
  }
);

export type HealthIndicatorVariants = VariantProps<typeof healthIndicatorVariants>;

// ============================================================================
// SECTION HEADER VARIANTS
// ============================================================================

export const sectionHeaderVariants = cva(
  'flex items-center justify-between',
  {
    variants: {
      size: {
        sm: 'py-2',
        md: 'py-3',
        lg: 'py-4',
      },
      border: {
        none: '',
        bottom: 'border-b pb-3',
        top: 'border-t pt-3',
      },
    },
    defaultVariants: {
      size: 'md',
      border: 'none',
    },
  }
);

export const sectionTitleVariants = cva(
  'font-semibold tracking-tight',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type SectionHeaderVariants = VariantProps<typeof sectionHeaderVariants>;

// ============================================================================
// ICON CONTAINER VARIANTS
// ============================================================================

export const iconContainerVariants = cva(
  'inline-flex items-center justify-center rounded-lg transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        ghost: 'bg-transparent',
      },
      size: {
        xs: 'w-6 h-6 [&>svg]:w-3 [&>svg]:h-3',
        sm: 'w-8 h-8 [&>svg]:w-4 [&>svg]:h-4',
        md: 'w-10 h-10 [&>svg]:w-5 [&>svg]:h-5',
        lg: 'w-12 h-12 [&>svg]:w-6 [&>svg]:h-6',
        xl: 'w-14 h-14 [&>svg]:w-7 [&>svg]:h-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type IconContainerVariants = VariantProps<typeof iconContainerVariants>;

// ============================================================================
// DATA ROW VARIANTS
// ============================================================================

export const dataRowVariants = cva(
  'flex items-center gap-3 px-3 transition-colors',
  {
    variants: {
      variant: {
        default: 'hover:bg-muted/50',
        interactive: 'hover:bg-muted/50 cursor-pointer active:bg-muted',
        selected: 'bg-primary/5 hover:bg-primary/10',
        highlighted: 'bg-amber-500/5 hover:bg-amber-500/10',
      },
      size: {
        sm: 'py-2 min-h-[40px]',
        md: 'py-3 min-h-[52px]',
        lg: 'py-4 min-h-[64px]',
      },
      divider: {
        none: '',
        bottom: 'border-b',
        dashed: 'border-b border-dashed',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      divider: 'bottom',
    },
  }
);

export type DataRowVariants = VariantProps<typeof dataRowVariants>;

// ============================================================================
// PANEL VARIANTS
// ============================================================================

export const panelVariants = cva(
  'rounded-lg bg-card',
  {
    variants: {
      variant: {
        default: 'border shadow-sm',
        elevated: 'shadow-lg',
        inset: 'bg-muted/50 border-0',
        outline: 'border-2 border-dashed',
        glass: 'bg-card/60 backdrop-blur-md border border-white/10',
      },
      spacing: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'md',
    },
  }
);

export type PanelVariants = VariantProps<typeof panelVariants>;

// ============================================================================
// TREND INDICATOR VARIANTS
// ============================================================================

export const trendVariants = cva(
  'inline-flex items-center gap-1 text-xs font-medium',
  {
    variants: {
      trend: {
        up: 'text-emerald-600 dark:text-emerald-400',
        down: 'text-rose-600 dark:text-rose-400',
        neutral: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      trend: 'neutral',
    },
  }
);

export type TrendVariants = VariantProps<typeof trendVariants>;

// ============================================================================
// LOADING STATE VARIANTS
// ============================================================================

export const skeletonVariants = cva(
  'animate-pulse bg-muted rounded',
  {
    variants: {
      shape: {
        line: 'h-4 w-full',
        circle: 'rounded-full',
        rect: '',
      },
    },
    defaultVariants: {
      shape: 'line',
    },
  }
);

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
