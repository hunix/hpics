// Auto-Save Indicator Component
import { Check, Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type AutoSaveStatus = 
  | 'idle'
  | 'saving'
  | 'saved'
  | 'draft-available'
  | 'error'
  | 'offline';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date;
  errorMessage?: string;
  onRestoreDraft?: () => void;
  className?: string;
}

const statusConfig: Record<AutoSaveStatus, {
  icon: typeof Check;
  label: string;
  color: string;
  animate?: boolean;
}> = {
  idle: {
    icon: Cloud,
    label: 'Ready',
    color: 'text-muted-foreground',
  },
  saving: {
    icon: Loader2,
    label: 'Saving...',
    color: 'text-muted-foreground',
    animate: true,
  },
  saved: {
    icon: Check,
    label: 'Saved',
    color: 'text-emerald-500',
  },
  'draft-available': {
    icon: Cloud,
    label: 'Draft available',
    color: 'text-blue-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Save failed',
    color: 'text-destructive',
  },
  offline: {
    icon: CloudOff,
    label: 'Offline - saved locally',
    color: 'text-amber-500',
  },
};

export function AutoSaveIndicator({
  status,
  lastSaved,
  errorMessage,
  onRestoreDraft,
  className,
}: AutoSaveIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };
  
  const tooltipContent = () => {
    if (status === 'error' && errorMessage) {
      return errorMessage;
    }
    if (status === 'saved' && lastSaved) {
      return `Last saved: ${formatLastSaved(lastSaved)}`;
    }
    if (status === 'draft-available') {
      return 'A previous draft is available. Click to restore.';
    }
    if (status === 'offline') {
      return 'Changes are being saved locally until you reconnect.';
    }
    return config.label;
  };
  
  const handleClick = () => {
    if (status === 'draft-available' && onRestoreDraft) {
      onRestoreDraft();
    }
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "inline-flex items-center gap-1.5 text-xs transition-colors",
            config.color,
            status === 'draft-available' && onRestoreDraft && "cursor-pointer hover:underline",
            className
          )}
          onClick={handleClick}
          role={status === 'draft-available' ? 'button' : undefined}
        >
          <Icon className={cn(
            "h-3.5 w-3.5",
            config.animate && "animate-spin"
          )} />
          <span>{config.label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}

// Hook helper for easy integration with useFormDraft
export function useAutoSaveStatus(
  isDirty: boolean,
  isSaving: boolean,
  hasDraft: boolean,
  isOnline: boolean,
  error?: Error | null,
  lastSaved?: Date
): { status: AutoSaveStatus; lastSaved?: Date; errorMessage?: string } {
  if (error) {
    return { status: 'error', errorMessage: error.message };
  }
  if (!isOnline) {
    return { status: 'offline', lastSaved };
  }
  if (isSaving) {
    return { status: 'saving' };
  }
  if (hasDraft && !isDirty) {
    return { status: 'draft-available' };
  }
  if (lastSaved && !isDirty) {
    return { status: 'saved', lastSaved };
  }
  return { status: 'idle' };
}