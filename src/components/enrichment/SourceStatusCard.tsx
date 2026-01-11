import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceStatusCardProps {
  source: {
    id: string;
    name: string;
    type: string;
    costCents: number;
    trustLevel: number;
    isAvailable: boolean;
    hasRequiredData?: boolean;
    isConfigured?: boolean;
  };
  isSelected: boolean;
  onToggle: () => void;
}

export function SourceStatusCard({ source, isSelected, onToggle }: SourceStatusCardProps) {
  const isDisabled = !source.isAvailable;
  
  const getStatusInfo = () => {
    if (!source.isConfigured && !source.isAvailable) {
      return { icon: <XCircle className="h-4 w-4" />, text: 'Not configured', color: 'text-muted-foreground' };
    }
    if (!source.hasRequiredData) {
      return { icon: <AlertCircle className="h-4 w-4" />, text: 'Missing data', color: 'text-yellow-500' };
    }
    return { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Ready', color: 'text-green-500' };
  };

  const status = getStatusInfo();
  const trustPercent = Math.round(source.trustLevel * 100);

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        isDisabled ? "opacity-50 bg-muted/30" : "hover:bg-muted/50",
        isSelected && !isDisabled && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Switch
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={isDisabled}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium text-sm", isDisabled && "text-muted-foreground")}>
              {source.name}
            </span>
            <Badge variant="outline" className="text-xs">
              {trustPercent}% trust
            </Badge>
          </div>
          <div className={cn("flex items-center gap-1 text-xs", status.color)}>
            {status.icon}
            <span>{status.text}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-sm font-medium">
          ${(source.costCents / 100).toFixed(2)}
        </span>
        <p className="text-xs text-muted-foreground capitalize">
          {source.type}
        </p>
      </div>
    </div>
  );
}
