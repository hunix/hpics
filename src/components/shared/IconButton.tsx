import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function IconButton({ icon: Icon, label, onClick, size = 'sm', variant = 'ghost', className }: { icon: LucideIcon; label: string; onClick?: () => void; size?: 'sm' | 'default'; variant?: 'ghost' | 'outline'; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" onClick={onClick} className={cn(size === 'sm' && 'h-8 w-8', className)}>
          <Icon className="w-4 h-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
