/**
 * @fileoverview TrendIndicator Component
 * Displays trend direction with percentage change
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trendVariants } from '@/lib/design-system/variants';
import { formatPercentageChange, getTrendDirection } from '@/lib/design-system/utils';

export interface TrendIndicatorProps {
  value: number;
  label?: string;
  showIcon?: boolean;
  showValue?: boolean;
  iconVariant?: 'trending' | 'arrow';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  invertColors?: boolean; // For metrics where down is good
  className?: string;
}

export function TrendIndicator({
  value,
  label,
  showIcon = true,
  showValue = true,
  iconVariant = 'trending',
  size = 'sm',
  invertColors = false,
  className,
}: TrendIndicatorProps) {
  const rawTrend = getTrendDirection(value);
  const trend = invertColors 
    ? (rawTrend === 'up' ? 'down' : rawTrend === 'down' ? 'up' : 'neutral')
    : rawTrend;

  const icons = {
    trending: {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus,
    },
    arrow: {
      up: ArrowUp,
      down: ArrowDown,
      neutral: Minus,
    },
  };

  const Icon = icons[iconVariant][rawTrend];

  const sizeClasses = {
    xs: 'text-[10px] gap-0.5 [&>svg]:w-2.5 [&>svg]:h-2.5',
    sm: 'text-xs gap-0.5 [&>svg]:w-3 [&>svg]:h-3',
    md: 'text-sm gap-1 [&>svg]:w-4 [&>svg]:h-4',
    lg: 'text-base gap-1 [&>svg]:w-5 [&>svg]:h-5',
  };

  return (
    <span className={cn(
      trendVariants({ trend }),
      'inline-flex items-center',
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon />}
      {showValue && <span>{formatPercentageChange(value)}</span>}
      {label && (
        <span className="text-muted-foreground ml-0.5">{label}</span>
      )}
    </span>
  );
}
