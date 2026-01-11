/**
 * Reusable Clickable Contact Component
 * Provides consistent contact navigation across all dashlets
 */

import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';

interface ClickableContactChipProps {
  contactId: string;
  name: string;
  avatarUrl?: string | null;
  subtitle?: string;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ClickableContactChip({
  contactId,
  name,
  avatarUrl,
  subtitle,
  showAvatar = true,
  size = 'md',
  className,
  children,
}: ClickableContactChipProps) {
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await hapticFeedback('light');
    navigate(`/contacts/${contactId}`);
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeStyles = {
    sm: {
      container: 'gap-2 p-1.5',
      avatar: 'h-6 w-6',
      avatarText: 'text-[10px]',
      name: 'text-xs',
      subtitle: 'text-[10px]',
    },
    md: {
      container: 'gap-2.5 p-2',
      avatar: 'h-8 w-8',
      avatarText: 'text-xs',
      name: 'text-sm',
      subtitle: 'text-xs',
    },
    lg: {
      container: 'gap-3 p-2.5',
      avatar: 'h-10 w-10',
      avatarText: 'text-sm',
      name: 'text-base',
      subtitle: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center rounded-lg transition-all duration-150',
        'hover:bg-muted/70 active:scale-[0.98] cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        styles.container,
        className
      )}
    >
      {showAvatar && (
        <Avatar className={styles.avatar}>
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', styles.avatarText)}>
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 text-left min-w-0">
        <p className={cn('font-medium truncate', styles.name)}>{name}</p>
        {subtitle && (
          <p className={cn('text-muted-foreground truncate', styles.subtitle)}>{subtitle}</p>
        )}
      </div>
      {children}
    </button>
  );
}

/**
 * Inline clickable name - for use in text contexts
 */
interface ClickableContactNameProps {
  contactId: string;
  name: string;
  className?: string;
}

export function ClickableContactName({ contactId, name, className }: ClickableContactNameProps) {
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await hapticFeedback('light');
    navigate(`/contacts/${contactId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'font-medium hover:text-primary hover:underline underline-offset-2',
        'transition-colors cursor-pointer',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded',
        className
      )}
    >
      {name}
    </button>
  );
}
