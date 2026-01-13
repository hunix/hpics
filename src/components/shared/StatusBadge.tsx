import React from 'react';
import { cn } from '@/lib/utils';
import { extendedBadgeVariants } from '@/lib/design-system/variants';
import type { StatusLevel } from '@/lib/design-system/types';

const statusVariantMap: Record<StatusLevel, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  success: 'success', warning: 'warning', error: 'error', info: 'info', neutral: 'secondary',
};

export function StatusBadge({ status, label, size = 'sm', className }: { status: StatusLevel; label?: string; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  return <span className={cn(extendedBadgeVariants({ variant: statusVariantMap[status], size }), className)}>{label || status}</span>;
}
