/**
 * @fileoverview MetricDisplay Component
 * Focused metric display for dashboards and data views
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { formatCompactNumber } from '@/lib/design-system/utils';

export interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendLabel,
  description,
  size = 'md',
  align = 'left',
  className,
}: MetricDisplayProps) {
  const displayValue = typeof value === 'number' ? formatCompactNumber(value) : value;

  const sizeClasses = {
    sm: {
      label: 'text-xs',
      value: 'text-xl font-semibold',
      unit: 'text-sm',
      description: 'text-[10px]',
      icon: 'w-4 h-4',
    },
    md: {
      label: 'text-sm',
      value: 'text-2xl font-semibold',
      unit: 'text-base',
      description: 'text-xs',
      icon: 'w-5 h-5',
    },
    lg: {
      label: 'text-base',
      value: 'text-3xl font-bold',
      unit: 'text-lg',
      description: 'text-sm',
      icon: 'w-6 h-6',
    },
    xl: {
      label: 'text-lg',
      value: 'text-4xl font-bold tracking-tight',
      unit: 'text-xl',
      description: 'text-base',
      icon: 'w-7 h-7',
    },
  };

  const sizes = sizeClasses[size];

  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <div className={cn('flex flex-col gap-1', alignClasses[align], className)}>
      {/* Label with optional icon */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className={sizes.icon} />}
        <span className={sizes.label}>{label}</span>
      </div>

      {/* Value with optional unit */}
      <div className="flex items-baseline gap-1">
        <span className={cn(sizes.value, 'tabular-nums tracking-tight')}>
          {displayValue}
        </span>
        {unit && (
          <span className={cn(sizes.unit, 'text-muted-foreground font-normal')}>
            {unit}
          </span>
        )}
      </div>

      {/* Trend or description */}
      {trend !== undefined ? (
        <TrendIndicator 
          value={trend} 
          label={trendLabel}
          size={size === 'xl' ? 'md' : size === 'lg' ? 'sm' : 'xs'}
        />
      ) : description ? (
        <span className={cn(sizes.description, 'text-muted-foreground')}>
          {description}
        </span>
      ) : null}
    </div>
  );
}
