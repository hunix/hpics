/**
 * @fileoverview EmptyState Component
 * Consistent empty state display with optional action
 */

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface EmptyStateActionObject {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Action can be a config object or custom ReactNode */
  action?: EmptyStateActionObject | React.ReactNode;
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
  children,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'w-8 h-8',
      iconBg: 'w-14 h-14',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      container: 'py-10',
      icon: 'w-10 h-10',
      iconBg: 'w-16 h-16',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-12 h-12',
      iconBg: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizes.container,
      className
    )}>
      <div className={cn(
        'rounded-full bg-muted flex items-center justify-center mb-4',
        sizes.iconBg
      )}>
        <Icon className={cn('text-muted-foreground', sizes.icon)} />
      </div>
      
      <h3 className={cn('font-semibold text-foreground', sizes.title)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-muted-foreground mt-1 max-w-sm',
          sizes.description
        )}>
          {description}
        </p>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            // Check if action is an object with 'label' property (EmptyStateActionObject)
            typeof action === 'object' && action !== null && 'label' in action ? (
              <Button
                onClick={(action as EmptyStateActionObject).onClick}
                asChild={!!(action as EmptyStateActionObject).href}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {(action as EmptyStateActionObject).href ? (
                  <a href={(action as EmptyStateActionObject).href}>
                    {(action as EmptyStateActionObject).icon && (
                      <span className="mr-2">
                        {React.createElement((action as EmptyStateActionObject).icon!, { className: 'w-4 h-4' })}
                      </span>
                    )}
                    {(action as EmptyStateActionObject).label}
                  </a>
                ) : (
                  <>
                    {(action as EmptyStateActionObject).icon && (
                      <span className="mr-2">
                        {React.createElement((action as EmptyStateActionObject).icon!, { className: 'w-4 h-4' })}
                      </span>
                    )}
                    {(action as EmptyStateActionObject).label}
                  </>
                )}
              </Button>
            ) : (
              // Render as custom ReactNode - wrap in fragment to satisfy type
              <>{action as React.ReactNode}</>
            )
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
