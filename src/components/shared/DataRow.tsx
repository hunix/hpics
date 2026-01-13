/**
 * @fileoverview DataRow Component
 * Consistent row layout for list items and data displays
 */

import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dataRowVariants, type DataRowVariants } from '@/lib/design-system/variants';

export interface DataRowProps extends DataRowVariants {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  showChevron?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  disabled?: boolean;
}

export function DataRow({
  children,
  className,
  onClick,
  href,
  showChevron = false,
  leftSlot,
  rightSlot,
  disabled = false,
  variant = onClick || href ? 'interactive' : 'default',
  size = 'md',
  divider = 'bottom',
}: DataRowProps) {
  const Component = href ? 'a' : 'div';
  const interactiveProps = onClick ? { 
    onClick: disabled ? undefined : onClick,
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
  } : {};

  return (
    <Component
      href={href}
      className={cn(
        dataRowVariants({ variant, size, divider }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...interactiveProps}
    >
      {leftSlot && (
        <div className="flex-shrink-0">
          {leftSlot}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {rightSlot && (
        <div className="flex-shrink-0">
          {rightSlot}
        </div>
      )}

      {showChevron && (onClick || href) && (
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </Component>
  );
}

// Group wrapper for data rows
export interface DataRowGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DataRowGroup({
  children,
  title,
  description,
  className,
}: DataRowGroupProps) {
  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      {(title || description) && (
        <div className="px-4 py-3 bg-muted/30 border-b">
          {title && (
            <h4 className="font-medium text-sm">{title}</h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="divide-y">
        {children}
      </div>
    </div>
  );
}
