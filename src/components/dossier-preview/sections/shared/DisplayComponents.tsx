/**
 * Shared Display Components for Dossier Preview (v3.9.34)
 * Reusable UI elements for rendering section content
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Metric Card
interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({ label, value, subtitle, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-muted/50',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    danger: 'bg-rose-500/10 border-rose-500/20',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn('rounded-lg border p-3', variantStyles[variant])}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && <TrendIcon className={cn(
          'h-4 w-4',
          trend === 'up' ? 'text-emerald-500' :
          trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'
        )} />}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// Metric Grid
interface MetricGridProps {
  metrics: Array<{ label: string; value: string | number; variant?: MetricCardProps['variant'] }>;
  columns?: 2 | 3 | 4;
}

export function MetricGrid({ metrics, columns = 4 }: MetricGridProps) {
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4';
  
  return (
    <div className={cn('grid gap-3', colClass)}>
      {metrics.map((m, i) => (
        <MetricCard key={i} label={m.label} value={m.value} variant={m.variant} />
      ))}
    </div>
  );
}

// Insight List
interface InsightListProps {
  items: string[];
  variant?: 'default' | 'success' | 'warning' | 'danger';
  maxItems?: number;
}

export function InsightList({ items, variant = 'default', maxItems }: InsightListProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  
  const iconColor = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
  };
  
  const Icon = variant === 'success' ? CheckCircle2 :
               variant === 'warning' ? AlertTriangle :
               variant === 'danger' ? AlertTriangle : Info;

  return (
    <ul className="space-y-2">
      {displayItems.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor[variant])} />
          <span>{item}</span>
        </li>
      ))}
      {maxItems && items.length > maxItems && (
        <li className="text-xs text-muted-foreground pl-6">
          +{items.length - maxItems} more items
        </li>
      )}
    </ul>
  );
}

// Key-Value Row
interface KeyValueRowProps {
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'bold';
}

export function KeyValueRow({ label, value, variant = 'default' }: KeyValueRowProps) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-dashed border-muted last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm', variant === 'bold' && 'font-semibold')}>
        {value ?? 'N/A'}
      </span>
    </div>
  );
}

// Data Box
interface DataBoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'danger' | 'success' | 'muted';
  title?: string;
}

export function DataBox({ children, variant = 'default', title }: DataBoxProps) {
  const variantStyles = {
    default: 'bg-card border',
    info: 'bg-blue-500/10 border-blue-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    danger: 'bg-rose-500/10 border-rose-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    muted: 'bg-muted/50 border-transparent',
  };

  return (
    <div className={cn('rounded-lg border p-4', variantStyles[variant])}>
      {title && <h4 className="font-medium text-sm mb-2">{title}</h4>}
      {children}
    </div>
  );
}

// Section Subheader
export function SectionSubheader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </h4>
  );
}

// Score Bar
interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function ScoreBar({ label, value, max = 100, variant = 'default' }: ScoreBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}{max === 100 ? '%' : `/${max}`}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', colors[variant])} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

// Tag List
export function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
