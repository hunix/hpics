/**
 * @fileoverview Section Component
 * Consistent section layout with header
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sectionHeaderVariants, sectionTitleVariants, type SectionHeaderVariants } from '@/lib/design-system/variants';

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Section({ children, className }: SectionProps) {
  return <section className={cn('space-y-4', className)}>{children}</section>;
}

export interface SectionHeaderProps extends SectionHeaderVariants {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, action, size = 'md', border = 'none', className }: SectionHeaderProps) {
  return (
    <div className={cn(sectionHeaderVariants({ size, border }), className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
        <div>
          <h2 className={sectionTitleVariants({ size })}>{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
