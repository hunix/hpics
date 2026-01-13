import { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationCenter } from '@/components/navigation/NotificationCenter';
import { cn } from '@/lib/utils';

interface EnhancedHeaderProps {
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function EnhancedHeader({ title, children, className }: EnhancedHeaderProps) {
  return (
    <header 
      className={cn(
        "flex h-14 shrink-0 items-center gap-2",
        "border-b border-border/50 bg-background/80 backdrop-blur-sm",
        "px-3 sm:px-4 safe-area-pt samsung-safe-top",
        "sticky top-0 z-40",
        className
      )}
    >
      {/* Sidebar trigger */}
      <SidebarTrigger className="-ml-1 touch-target-lg flex items-center justify-center" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
      
      {/* Title */}
      {title && (
        <h1 className="text-base sm:text-lg font-semibold truncate max-w-[160px] sm:max-w-none text-foreground">
          {title}
        </h1>
      )}
      
      {/* Custom content slot */}
      {children}
      
      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <GlobalSearch />
        <NotificationCenter />
      </div>
    </header>
  );
}
