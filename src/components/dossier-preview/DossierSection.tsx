/**
 * Dossier Section Wrapper (v3.9.34)
 * Provides consistent styling and scroll registration for each section
 */

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DossierSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  category: 'core' | 'intelligence' | 'warfare' | 'analysis';
  hasData: boolean;
  registerSection: (sectionId: string, element: HTMLElement | null) => void;
  children: React.ReactNode;
}

const categoryStyles: Record<string, { border: string; badge: string; icon: string }> = {
  core: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-500',
  },
  intelligence: {
    border: 'border-l-violet-500',
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    icon: 'text-violet-500',
  },
  warfare: {
    border: 'border-l-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    icon: 'text-rose-500',
  },
  analysis: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    icon: 'text-amber-500',
  },
};

export function DossierSection({
  id,
  title,
  icon: Icon,
  category,
  hasData,
  registerSection,
  children,
}: DossierSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const styles = categoryStyles[category] || categoryStyles.core;

  useEffect(() => {
    registerSection(id, sectionRef.current);
    return () => registerSection(id, null);
  }, [id, registerSection]);

  return (
    <Card
      ref={sectionRef}
      id={id}
      className={cn(
        'border-l-4 scroll-mt-20 print:break-inside-avoid',
        styles.border,
        !hasData && 'opacity-60'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={cn('h-5 w-5', styles.icon)} />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={styles.badge}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
            {!hasData && (
              <Badge variant="secondary" className="text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                No Data
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          children
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No intelligence data available for this section. Run analysis to populate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
