/**
 * @fileoverview Dashboard Empty State
 * Premium empty state for when no widgets are visible
 */

import React from 'react';
import { LayoutGrid, Settings2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { DashboardCustomizer } from './DashboardCustomizer';

export function DashboardEmptyState() {
  return (
    <EmptyState
      icon={LayoutGrid}
      title="No Widgets Visible"
      description="Your dashboard is empty. Add widgets to see your data at a glance."
    >
      <DashboardCustomizer />
    </EmptyState>
  );
}
