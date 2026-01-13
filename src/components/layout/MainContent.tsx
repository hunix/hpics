import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
  noPadding?: boolean;
}

export function MainContent({ 
  children, 
  showBreadcrumbs = true, 
  className,
  noPadding = false,
}: MainContentProps) {
  return (
    <main 
      className={cn(
        "flex-1 overflow-auto scroll-smooth-touch scrollbar-hide",
        !noPadding && "p-4 sm:p-6 pb-28 md:pb-6",
        "safe-area-pb samsung-safe-bottom",
        className
      )}
    >
      {showBreadcrumbs && <Breadcrumbs />}
      {children}
    </main>
  );
}
