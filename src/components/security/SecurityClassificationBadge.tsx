import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DATA_CLASSIFICATION } from '@/hooks/useSensitiveDataAccess';

interface SecurityClassificationBadgeProps {
  level: keyof typeof DATA_CLASSIFICATION;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ICONS = {
  public: ShieldCheck,
  internal: Shield,
  confidential: ShieldAlert,
  restricted: ShieldX,
};

const COLORS = {
  public: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  confidential: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  restricted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const DESCRIPTIONS = {
  public: 'Public data - No restrictions',
  internal: 'Internal data - For authorized users only',
  confidential: 'Confidential data - Handle with care',
  restricted: 'Restricted data - Highest security level',
};

export function SecurityClassificationBadge({
  level,
  showLabel = true,
  size = 'md',
}: SecurityClassificationBadgeProps) {
  const Icon = ICONS[level];
  const classification = DATA_CLASSIFICATION[level];
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className={`${COLORS[level]} gap-1`}>
          <Icon className={sizeClasses[size]} />
          {showLabel && <span className="text-xs">{classification.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{DESCRIPTIONS[level]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
