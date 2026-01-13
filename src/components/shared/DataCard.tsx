/**
 * @fileoverview DataCard Component
 * Flexible card component for displaying data with header, content, and footer
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardVariants, type CardVariants } from '@/lib/design-system/variants';
import { Button } from '@/components/ui/button';

export interface DataCardProps extends CardVariants {
  children: React.ReactNode;
  className?: string;
}

export function DataCard({
  children,
  className,
  variant = 'default',
  padding = 'none',
  status,
}: DataCardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding, status }), className)}>
      {children}
    </div>
  );
}

export interface DataCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function DataCardHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  action,
  badge,
  className,
}: DataCardHeaderProps) {
  return (
    <div className={cn(
      'flex items-start justify-between gap-4 px-4 py-3 border-b',
      className
    )}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={cn(
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
            'bg-primary/10',
            iconColor
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

export interface DataCardContentProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DataCardContent({
  children,
  className,
  noPadding = false,
}: DataCardContentProps) {
  return (
    <div className={cn(!noPadding && 'p-4', className)}>
      {children}
    </div>
  );
}

export interface DataCardFooterProps {
  children?: React.ReactNode;
  className?: string;
  actions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'ghost' | 'outline';
    icon?: LucideIcon;
  }>;
}

export function DataCardFooter({
  children,
  className,
  actions,
}: DataCardFooterProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-4 py-3 border-t bg-muted/30',
      className
    )}>
      {children}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 ml-auto">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href}>
                  {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                  {action.label}
                </a>
              ) : (
                <>
                  {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                  {action.label}
                </>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
