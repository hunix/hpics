/**
 * @fileoverview Dashboard Stats Grid
 * Premium stats display using design system components
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/shared/StatCard';
import { useNavigate } from 'react-router-dom';

export interface DashboardStat {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  change?: number;
  href?: string;
}

interface DashboardStatsGridProps {
  stats: DashboardStat[];
  isLoading?: boolean;
}

export function DashboardStatsGrid({ stats, isLoading }: DashboardStatsGridProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <StatCardGrid columns={4}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </StatCardGrid>
    );
  }

  return (
    <StatCardGrid columns={4}>
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.color.replace('text-', '')}
          change={stat.change}
          onClick={stat.href ? () => navigate(stat.href!) : undefined}
          variant="elevated"
        />
      ))}
    </StatCardGrid>
  );
}
