import React from 'react';
import { cn } from '@/lib/utils';
import { panelVariants, type PanelVariants } from '@/lib/design-system/variants';

export interface PanelProps extends PanelVariants {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className, variant = 'default', spacing = 'md' }: PanelProps) {
  return <div className={cn(panelVariants({ variant, spacing }), className)}>{children}</div>;
}
