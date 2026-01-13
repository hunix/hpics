// Health Status Badge - Compact system health indicator
import { useState } from 'react';
import { Activity, Check, AlertTriangle, XCircle, Wifi, Database, Shield, HardDrive, Cloud, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useHealthCheck, type HealthStatus, type ComponentHealth } from "@/hooks/reliability/useHealthCheck";

interface HealthStatusBadgeProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

const statusConfig: Record<HealthStatus, { 
  icon: typeof Check; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  healthy: { 
    icon: Check, 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/10',
    label: 'All Systems Operational'
  },
  degraded: { 
    icon: AlertTriangle, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10',
    label: 'Degraded Performance'
  },
  unhealthy: { 
    icon: XCircle, 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    label: 'System Issues Detected'
  },
  unknown: { 
    icon: Activity, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    label: 'Checking Status...'
  },
};

const serviceIcons: Record<string, typeof Wifi> = {
  network: Wifi,
  database: Database,
  auth: Shield,
  storage: HardDrive,
  edgeFunctions: Cloud,
};

function ServiceRow({ 
  name, 
  health 
}: { 
  name: string; 
  health: ComponentHealth;
}) {
  const Icon = serviceIcons[name] || Activity;
  const config = statusConfig[health.status];
  const StatusIcon = config.icon;
  
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{health.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {health.latency !== undefined && (
          <span className="text-xs text-muted-foreground">
            {health.latency}ms
          </span>
        )}
        <StatusIcon className={cn("h-4 w-4", config.color)} />
      </div>
    </div>
  );
}

export function HealthStatusBadge({ 
  compact = false, 
  showDetails = true,
  className 
}: HealthStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { health, isChecking, runHealthCheck } = useHealthCheck({
    autoCheck: true,
    intervalMs: 60000, // Check every minute
  });
  
  const status = health.overall;
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        "cursor-pointer transition-colors",
        config.bgColor,
        config.color,
        "border-transparent hover:border-current/20",
        className
      )}
    >
      <StatusIcon className={cn(
        "h-3.5 w-3.5",
        isChecking && "animate-pulse"
      )} />
      {!compact && (
        <>
          <span className="ml-1.5 text-xs font-medium">
            {status === 'healthy' ? 'Healthy' : status === 'degraded' ? 'Degraded' : status === 'unhealthy' ? 'Issues' : 'Checking'}
          </span>
          {showDetails && <ChevronDown className="h-3 w-3 ml-1" />}
        </>
      )}
    </Badge>
  );
  
  if (!showDetails) {
    return badge;
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">System Health</h4>
            <button 
              onClick={() => runHealthCheck()}
              disabled={isChecking}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isChecking ? 'Checking...' : 'Refresh'}
            </button>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-md",
            config.bgColor
          )}>
            <StatusIcon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-sm font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          
          <div className="divide-y">
            {Object.entries(health.components).map(([name, componentHealth]) => (
              <ServiceRow 
                key={name} 
                name={name} 
                health={componentHealth} 
              />
            ))}
          </div>
          
          {health.lastFullCheck && (
            <p className="text-xs text-muted-foreground text-center">
              Last checked: {health.lastFullCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}