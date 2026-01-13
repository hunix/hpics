/**
 * @fileoverview StatCard Component
 * Premium stat display card with trend indicators
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  cardVariants, 
  statVariants, 
  statValueVariants, 
  statLabelVariants,
  iconContainerVariants,
  trendVariants,
  type CardVariants,
  type StatVariants,
} from '@/lib/design-system/variants';
import { formatCompactNumber, formatPercentageChange, getTrendDirection } from '@/lib/design-system/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface StatCardProps extends CardVariants, StatVariants {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  change?: number;
  changeLabel?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'primary',
  change,
  changeLabel,
  description,
  className,
  onClick,
  compact = false,
  variant = 'default',
  padding = compact ? 'sm' : 'md',
  status,
  size = compact ? 'sm' : 'md',
  align = 'left',
}: StatCardProps) {
  const trend = change !== undefined ? getTrendDirection(change) : undefined;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const displayValue = typeof value === 'number' ? formatCompactNumber(value) : value;

  return (
    <div
      className={cn(
        cardVariants({ variant: onClick ? 'interactive' : variant, padding, status }),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={cn(statVariants({ size, align }), 'h-full')}>
        {/* Header with icon */}
        <div className="flex items-center justify-between w-full">
          <span className={cn(statLabelVariants({ size }), 'font-medium')}>
            {title}
          </span>
          {Icon && (
            <div className={cn(
              iconContainerVariants({ 
                variant: iconColor as any, 
                size: compact ? 'xs' : 'sm' 
              })
            )}>
              <Icon />
            </div>
          )}
        </div>

        {/* Value */}
        <span className={cn(statValueVariants({ size }), 'tabular-nums')}>
          {displayValue}
        </span>

        {/* Trend and description */}
        {(change !== undefined || description) && (
          <div className="flex items-center gap-2">
            {change !== undefined && trend && (
              <span className={cn(trendVariants({ trend }), 'flex items-center gap-0.5')}>
                <TrendIcon className="w-3 h-3" />
                <span>{formatPercentageChange(change)}</span>
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">{changeLabel}</span>
                )}
              </span>
            )}
            {description && !change && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid layout for multiple stat cards
export interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function StatCardGrid({ 
  children, 
  columns = 4, 
  className 
}: StatCardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Skeleton loading state
export function StatCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn(cardVariants({ padding: compact ? 'sm' : 'md' }))}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
