import React from 'react';
import { cn } from '@/lib/utils';
import { extendedBadgeVariants } from '@/lib/design-system/variants';
import type { Priority } from '@/lib/design-system/types';

const priorityVariantMap: Record<Priority, 'secondary' | 'info' | 'warning' | 'error'> = {
  low: 'secondary', medium: 'info', high: 'warning', urgent: 'warning', critical: 'error',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn(extendedBadgeVariants({ variant: priorityVariantMap[priority], size: 'sm' }), className)}>{priority}</span>;
}
