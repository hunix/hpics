import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/design-system/utils';

export function AvatarWithStatus({ name, avatarUrl, status, size = 'md' }: { name: string; avatarUrl?: string; status?: 'online' | 'offline' | 'busy'; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const statusColors = { online: 'bg-emerald-500', offline: 'bg-gray-400', busy: 'bg-rose-500' };
  
  return (
    <div className="relative">
      <Avatar className={sizes[size]}><AvatarImage src={avatarUrl} /><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar>
      {status && <span className={cn('absolute bottom-0 right-0 rounded-full ring-2 ring-background', dotSizes[size], statusColors[status])} />}
    </div>
  );
}
