import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ActionItem } from '@/lib/design-system/types';

export function ActionBar({ actions, className }: { actions: ActionItem[]; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 p-2 bg-muted/50 rounded-lg', className)}>
      {actions.map((action) => (
        <Button key={action.id} variant={action.variant || 'ghost'} size="sm" onClick={action.onClick} disabled={action.disabled}>
          {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
