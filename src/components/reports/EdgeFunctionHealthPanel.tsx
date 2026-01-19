import { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Zap,
  Shield,
  Brain,
  Network,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  useEdgeFunctionHealthCheck, 
  type FunctionHealth,
  type HealthSummary 
} from '@/hooks/useEdgeFunctionHealthCheck';
import { formatDistanceToNow } from 'date-fns';

interface EdgeFunctionHealthPanelProps {
  onReadyChange?: (isReady: boolean) => void;
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  core: { label: 'Core Intelligence', icon: Zap, color: 'text-amber-500' },
  psychological: { label: 'Psychological Ops', icon: Brain, color: 'text-purple-500' },
  warfare: { label: 'Advanced Warfare', icon: Shield, color: 'text-red-500' },
  network: { label: 'Network Intel', icon: Network, color: 'text-blue-500' },
  temporal: { label: 'Temporal & Quantum', icon: Clock, color: 'text-cyan-500' },
  fusion: { label: 'Fusion Intelligence', icon: Layers, color: 'text-green-500' },
};

function StatusIcon({ status }: { status: FunctionHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case 'unhealthy':
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case 'checking':
      return <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />;
    default:
      return <div className="h-3.5 w-3.5 rounded-full bg-muted" />;
  }
}

function OverallStatusBadge({ summary, isChecking }: { summary: HealthSummary; isChecking: boolean }) {
  if (isChecking) {
    return (
      <Badge variant="outline" className="bg-muted/50">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (summary.unhealthy === 0 && summary.checking === 0) {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        All Systems Ready
      </Badge>
    );
  }

  if (summary.unhealthy > 0 && summary.unhealthy <= 5) {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Degraded ({summary.unhealthy} unavailable)
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Not Ready ({summary.unhealthy} unavailable)
    </Badge>
  );
}

function CategorySection({ 
  category, 
  functions,
  isExpanded,
  onToggle,
}: { 
  category: string; 
  functions: FunctionHealth[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = CATEGORY_CONFIG[category] || { label: category, icon: Zap, color: 'text-muted-foreground' };
  const Icon = config.icon;
  
  const healthyCount = functions.filter(f => f.status === 'healthy').length;
  const allHealthy = healthyCount === functions.length;
  const checkingCount = functions.filter(f => f.status === 'checking').length;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          "flex items-center justify-between w-full p-2 rounded-md text-left transition-colors",
          "hover:bg-muted/50",
          !allHealthy && "bg-destructive/5"
        )}>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {checkingCount > 0 ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : allHealthy ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <span className="text-xs text-muted-foreground">
                {healthyCount}/{functions.length}
              </span>
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-2 pb-2 space-y-1">
          {functions.map((fn) => (
            <TooltipProvider key={fn.edgeFunction}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center justify-between py-1 px-2 rounded text-xs",
                    fn.status === 'unhealthy' && "bg-destructive/10"
                  )}>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={fn.status} />
                      <span className={cn(
                        fn.status === 'unhealthy' && "text-destructive"
                      )}>
                        {fn.name}
                      </span>
                    </div>
                    {fn.latency && fn.status === 'healthy' && (
                      <span className="text-[10px] text-muted-foreground">
                        {fn.latency}ms
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <div className="space-y-1">
                    <p className="font-medium">{fn.edgeFunction}</p>
                    {fn.error && (
                      <p className="text-destructive text-xs">{fn.error}</p>
                    )}
                    {fn.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Checked {formatDistanceToNow(fn.lastChecked, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EdgeFunctionHealthPanel({ onReadyChange, compact = false }: EdgeFunctionHealthPanelProps) {
  const { 
    byCategory, 
    summary, 
    isReady, 
    isChecking, 
    lastFullCheck, 
    runHealthCheck,
    getCriticalMissing,
  } = useEdgeFunctionHealthCheck();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Notify parent of ready state changes
  if (onReadyChange) {
    onReadyChange(isReady);
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const criticalMissing = getCriticalMissing();
  const categoryOrder = ['core', 'psychological', 'warfare', 'network', 'temporal', 'fusion'];

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
        <OverallStatusBadge summary={summary} isChecking={isChecking} />
        <span className="text-xs text-muted-foreground">
          {summary.healthy}/{summary.total} functions
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2"
          onClick={() => runHealthCheck()}
          disabled={isChecking}
        >
          <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <OverallStatusBadge summary={summary} isChecking={isChecking} />
          <span className="text-xs text-muted-foreground">
            {summary.healthy}/{summary.total} Edge Functions
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastFullCheck && (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(lastFullCheck, { addSuffix: true })}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => runHealthCheck()}
            disabled={isChecking}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isChecking && "animate-spin")} />
            Check
          </Button>
        </div>
      </div>

      {/* Critical Missing Warning */}
      {criticalMissing.length > 0 && (
        <div className="p-3 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-destructive">
                Critical functions unavailable
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {criticalMissing.map(f => f.name).join(', ')} must be deployed before generation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {categoryOrder.map(category => {
          const functions = byCategory[category];
          if (!functions?.length) return null;
          
          return (
            <CategorySection
              key={category}
              category={category}
              functions={functions}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            />
          );
        })}
      </div>
    </div>
  );
}
