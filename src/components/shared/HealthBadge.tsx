/**
 * @fileoverview HealthBadge Component
 * Visual indicator for relationship health levels
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  healthIndicatorVariants, 
  extendedBadgeVariants,
  type HealthIndicatorVariants 
} from '@/lib/design-system/variants';
import { getHealthLevel, getHealthLabel } from '@/lib/design-system/utils';
import type { HealthLevel } from '@/lib/design-system/types';

export interface HealthBadgeProps extends Omit<HealthIndicatorVariants, 'level'> {
  score?: number;
  level?: HealthLevel;
  showLabel?: boolean;
  showScore?: boolean;
  variant?: 'circle' | 'badge' | 'dot';
  className?: string;
}

export function HealthBadge({
  score,
  level: levelProp,
  showLabel = false,
  showScore = true,
  variant = 'circle',
  size = 'md',
  className,
}: HealthBadgeProps) {
  const level = levelProp || (score !== undefined ? getHealthLevel(score) : 'good');
  const label = getHealthLabel(level);
  const displayScore = score !== undefined ? Math.round(score) : undefined;

  // Dot variant - minimal indicator
  if (variant === 'dot') {
    const dotColors: Record<HealthLevel, string> = {
      excellent: 'bg-emerald-500',
      good: 'bg-blue-500',
      fair: 'bg-amber-500',
      poor: 'bg-orange-500',
      critical: 'bg-rose-500',
    };

    const dotSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn(
          'rounded-full',
          dotColors[level],
          dotSizes[size || 'md']
        )} />
        {showLabel && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    );
  }

  // Badge variant - pill-shaped
  if (variant === 'badge') {
    const badgeVariants: Record<HealthLevel, 'success' | 'info' | 'warning' | 'error'> = {
      excellent: 'success',
      good: 'info',
      fair: 'warning',
      poor: 'warning',
      critical: 'error',
    };

    return (
      <span className={cn(
        extendedBadgeVariants({ variant: badgeVariants[level], size: size as any }),
        className
      )}>
        {showScore && displayScore !== undefined ? displayScore : label}
      </span>
    );
  }

  // Circle variant - default
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(healthIndicatorVariants({ level, size }))}>
        {showScore && displayScore !== undefined ? displayScore : label[0]}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
