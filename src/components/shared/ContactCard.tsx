import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/design-system/utils';
import { HealthBadge } from './HealthBadge';

export function ContactCard({ name, avatarUrl, subtitle, healthScore, onClick, className }: { name: string; avatarUrl?: string; subtitle?: string; healthScore?: number; onClick?: () => void; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <Avatar className="h-10 w-10"><AvatarImage src={avatarUrl} /><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {healthScore !== undefined && <HealthBadge score={healthScore} size="sm" />}
    </div>
  );
}

export function ContactCardCompact({ name, avatarUrl, onClick }: { name: string; avatarUrl?: string; onClick?: () => void }) {
  return (
    <div className={cn('flex items-center gap-2 p-2 rounded hover:bg-muted/50', onClick && 'cursor-pointer')} onClick={onClick}>
      <Avatar className="h-6 w-6"><AvatarImage src={avatarUrl} /><AvatarFallback className="text-xs">{getInitials(name, 1)}</AvatarFallback></Avatar>
      <span className="text-sm truncate">{name}</span>
    </div>
  );
}
