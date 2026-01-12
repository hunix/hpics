/**
 * ContextPanel - Dynamic panel that renders appropriate intelligence module
 * based on current detected context (Meeting, Commute, Social, Work, Rest)
 */

import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Car, 
  Users, 
  Briefcase, 
  Moon,
  Pin,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useContextEngine, ContextType } from '@/hooks/useContextEngine';

// Lazy load context-specific panels
const MeetingPanel = lazy(() => import('./panels/MeetingPanel'));
const CommutePanel = lazy(() => import('./panels/CommutePanel'));
const SocialPanel = lazy(() => import('./panels/SocialPanel'));
const WorkPanel = lazy(() => import('./panels/WorkPanel'));
const RestPanel = lazy(() => import('./panels/RestPanel'));

interface ContextPanelProps {
  className?: string;
  onContextChange?: (context: ContextType) => void;
}

const CONTEXT_CONFIG: Record<ContextType, {
  icon: typeof Video;
  label: string;
  color: string;
  bgColor: string;
}> = {
  commute: {
    icon: Car,
    label: 'Commute',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  social: {
    icon: Users,
    label: 'Social',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  work: {
    icon: Briefcase,
    label: 'Work',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  rest: {
    icon: Moon,
    label: 'Rest',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  unknown: {
    icon: RefreshCw,
    label: 'Unknown',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

function PanelLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function ContextPanelContent({ context }: { context: ContextType }) {
  switch (context) {
    case 'commute':
      return <CommutePanel />;
    case 'social':
      return <SocialPanel />;
    case 'work':
      return <WorkPanel />;
    case 'rest':
      return <RestPanel />;
    default:
      return <WorkPanel />; // Default to work panel
  }
}

export function ContextPanel({ className, onContextChange }: ContextPanelProps) {
  const { currentContext, confidence, isPinned, pinContext, unpinContext, recommendations } = useContextEngine();
  const [isManualOverride, setIsManualOverride] = React.useState(false);
  const [manualContext, setManualContext] = React.useState<ContextType | null>(null);

  const effectiveContext = manualContext || currentContext;
  const config = CONTEXT_CONFIG[effectiveContext];
  const Icon = config.icon;

  const handleContextOverride = (context: ContextType) => {
    setManualContext(context);
    setIsManualOverride(true);
    onContextChange?.(context);
  };

  const handleResetContext = () => {
    setManualContext(null);
    setIsManualOverride(false);
    onContextChange?.(currentContext);
  };

  const handlePinToggle = () => {
    if (isPinned) {
      unpinContext();
    } else {
      pinContext(effectiveContext);
    }
  };

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {config.label} Mode
                {isPinned && (
                  <Pin className="h-3 w-3 text-primary" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {Math.round(confidence * 100)}% confidence
                </Badge>
                {isManualOverride && (
                  <Badge variant="outline" className="text-xs">
                    Manual
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePinToggle}
            >
              <Pin className={cn('h-4 w-4', isPinned && 'text-primary fill-primary')} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  Switch
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(CONTEXT_CONFIG) as ContextType[]).filter(c => c !== 'unknown').map(ctx => {
                  const ctxConfig = CONTEXT_CONFIG[ctx];
                  const CtxIcon = ctxConfig.icon;
                  return (
                    <DropdownMenuItem
                      key={ctx}
                      onClick={() => handleContextOverride(ctx)}
                      className="gap-2"
                    >
                      <CtxIcon className={cn('h-4 w-4', ctxConfig.color)} />
                      {ctxConfig.label}
                      {ctx === effectiveContext && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
                {isManualOverride && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleResetContext}
                      className="text-muted-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset to Auto
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveContext}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Suspense fallback={<PanelLoader />}>
              <ContextPanelContent context={effectiveContext} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
