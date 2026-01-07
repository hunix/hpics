import { useClearance } from '@/hooks/useClearance';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClearanceBadgeProps {
  className?: string;
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CLEARANCE_ICONS = {
  uncleared: Eye,
  confidential: Shield,
  secret: Lock,
  top_secret: Star,
  sci: Crown,
};

const CLEARANCE_STYLES = {
  uncleared: 'bg-muted text-muted-foreground border-muted-foreground/20',
  confidential: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  secret: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400',
  top_secret: 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400',
  sci: 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400',
};

export function ClearanceBadge({ className, showRole = true, size = 'sm' }: ClearanceBadgeProps) {
  const { currentClearance, currentRole, CLEARANCE_LABELS, isLoading } = useClearance();

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="outline" className="animate-pulse bg-muted">
          Loading...
        </Badge>
      </div>
    );
  }

  const Icon = CLEARANCE_ICONS[currentClearance] || Eye;
  const style = CLEARANCE_STYLES[currentClearance] || CLEARANCE_STYLES.uncleared;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Badge 
        variant="outline" 
        className={cn(
          'flex items-center gap-1 border font-medium',
          style,
          sizeClasses[size]
        )}
      >
        <Icon className={cn(
          size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
        )} />
        {CLEARANCE_LABELS[currentClearance]}
      </Badge>
      {showRole && (
        <Badge variant="secondary" className={sizeClasses[size]}>
          {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
        </Badge>
      )}
    </div>
  );
}

// Compact inline version for use in headers/toolbars
export function ClearanceIndicator({ className }: { className?: string }) {
  const { currentClearance, CLEARANCE_LABELS } = useClearance();
  const Icon = CLEARANCE_ICONS[currentClearance] || Eye;
  const style = CLEARANCE_STYLES[currentClearance] || CLEARANCE_STYLES.uncleared;

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
        style,
        className
      )}
      title={`Clearance: ${CLEARANCE_LABELS[currentClearance]}`}
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{CLEARANCE_LABELS[currentClearance]}</span>
    </div>
  );
}
