import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pingDatabase } from '@/hooks/system/useSystemMetrics';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

type HealthStatus = 'healthy' | 'degraded' | 'error' | 'checking';

interface SystemHealthIndicatorProps {
  compact?: boolean;
}

export function SystemHealthIndicator({ compact = false }: SystemHealthIndicatorProps) {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { ok, latencyMs } = await pingDatabase();
        if (!ok) setStatus('error');
        else if (latencyMs > 2000) setStatus('degraded');
        else setStatus('healthy');
        setLastCheck(new Date());
      } catch {
        setStatus('error');
        setLastCheck(new Date());
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const statusConfig = {
    checking: {
      icon: Loader2,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Checking...',
      pulse: false,
      spin: true,
    },
    healthy: {
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      label: 'All systems operational',
      pulse: false,
      spin: false,
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      label: 'System degraded',
      pulse: true,
      spin: false,
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'System error',
      pulse: true,
      spin: false,
    },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'w-2 h-2 rounded-full',
            status === 'healthy' && 'bg-emerald-500',
            status === 'degraded' && 'bg-amber-500',
            status === 'error' && 'bg-red-500',
            status === 'checking' && 'bg-muted-foreground',
            config.pulse && 'animate-pulse'
          )} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {config.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
            config.bgColor
          )}
        >
          <Icon className={cn(
            'h-3.5 w-3.5',
            config.color,
            config.spin && 'animate-spin'
          )} />
          <span className={cn('text-xs font-medium', config.color)}>
            {status === 'healthy' ? 'Operational' : status === 'checking' ? '...' : status}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="font-medium">{config.label}</p>
        {lastCheck && (
          <p className="text-xs text-muted-foreground mt-1">
            Last check: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
