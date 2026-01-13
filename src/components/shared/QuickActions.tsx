import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ActionItem } from '@/lib/design-system/types';

export function QuickActions({ actions, orientation = 'horizontal', className }: { actions: ActionItem[]; orientation?: 'horizontal' | 'vertical'; className?: string }) {
  return (
    <div className={cn('flex gap-2', orientation === 'vertical' && 'flex-col', className)}>
      {actions.slice(0, 4).map((action) => (
        <Button key={action.id} variant="outline" size="sm" onClick={action.onClick} disabled={action.disabled} className="justify-start">
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
