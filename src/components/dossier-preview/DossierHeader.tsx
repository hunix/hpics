/**
 * Dossier Header Component (v3.9.34)
 * Displays profile name, organization, and intelligence completeness
 */

import { User, Building2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DossierHeaderProps {
  contactName: string;
  organization?: string;
  intelligenceCompleteness: number;
}

export function DossierHeader({
  contactName,
  organization,
  intelligenceCompleteness,
}: DossierHeaderProps) {
  const completenessColor = 
    intelligenceCompleteness >= 80 ? 'text-emerald-500' :
    intelligenceCompleteness >= 50 ? 'text-amber-500' :
    'text-rose-500';

  return (
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="h-6 w-6 text-primary" />
      </div>
      
      <div className="flex-1">
        <h1 className="text-xl font-bold">{contactName}</h1>
        {organization && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Building2 className="h-3.5 w-3.5" />
            {organization}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Intelligence Completeness</p>
          <p className={cn('text-lg font-bold', completenessColor)}>
            {intelligenceCompleteness}%
          </p>
        </div>
        <div className="w-24">
          <Progress 
            value={intelligenceCompleteness} 
            className="h-2"
          />
        </div>
        <Badge variant={intelligenceCompleteness >= 80 ? 'default' : 'secondary'}>
          {intelligenceCompleteness >= 80 ? 'Complete' : 
           intelligenceCompleteness >= 50 ? 'Partial' : 'Limited'}
        </Badge>
      </div>
    </div>
  );
}
