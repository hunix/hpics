import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IntegrationSetupBannerProps {
  title: string;
  description: string;
  linkTo: string;
  linkLabel: string;
  icon?: React.ElementType;
  storageKey: string;
  variant?: 'info' | 'warning';
}

export function IntegrationSetupBanner({
  title,
  description,
  linkTo,
  linkLabel,
  icon: Icon,
  storageKey,
  variant = 'info',
}: IntegrationSetupBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(storageKey) === 'dismissed'
  );
  const navigate = useNavigate();

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'dismissed');
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3',
        variant === 'info' &&
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40',
        variant === 'warning' &&
          'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            variant === 'info' && 'text-blue-600 dark:text-blue-400',
            variant === 'warning' && 'text-amber-600 dark:text-amber-400'
          )}
        />
      )}

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            'font-medium text-sm',
            variant === 'info' && 'text-blue-900 dark:text-blue-100',
            variant === 'warning' && 'text-amber-900 dark:text-amber-100'
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'ml-2 text-sm',
            variant === 'info' && 'text-blue-700 dark:text-blue-300',
            variant === 'warning' && 'text-amber-700 dark:text-amber-300'
          )}
        >
          {description}
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className={cn(
          'shrink-0 h-7 text-xs',
          variant === 'info' &&
            'border-blue-300 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-900/50',
          variant === 'warning' &&
            'border-amber-300 bg-white text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-900/50'
        )}
        onClick={() => navigate(linkTo)}
      >
        {linkLabel}
      </Button>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className={cn(
          'shrink-0 rounded p-0.5 transition-colors',
          variant === 'info' &&
            'text-blue-500 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-200',
          variant === 'warning' &&
            'text-amber-500 hover:bg-amber-100 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/50 dark:hover:text-amber-200'
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
