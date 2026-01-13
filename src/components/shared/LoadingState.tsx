import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({ message = 'Loading...', size = 'md', className }: { message?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
