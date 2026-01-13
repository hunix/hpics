/**
 * @fileoverview Dashboard Header
 * Premium header with edit controls using design system
 */

import React from 'react';
import { Edit3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardPresets } from './DashboardPresets';
import { DashboardCustomizer } from './DashboardCustomizer';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function DashboardHeader({ isEditing, onToggleEdit }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-xl border">
      <div className="flex items-center gap-2">
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEdit}
          className={cn(
            'transition-all duration-200',
            isEditing && 'shadow-md'
          )}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          {isEditing ? 'Done Editing' : 'Edit Layout'}
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <DashboardPresets />
        <DashboardCustomizer />
      </div>
    </div>
  );
}

export function DashboardEditBanner({ isEditing }: { isEditing: boolean }) {
  if (!isEditing) return null;

  return (
    <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">Edit Mode Active</p>
          <p className="text-xs text-muted-foreground">
            Drag widgets to reorder • Click × to hide • Use Customize to restore hidden widgets
          </p>
        </div>
      </div>
    </div>
  );
}
