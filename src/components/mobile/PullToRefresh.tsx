import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only activate if scrolled to top
    if (container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [disabled, state]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;
    if (startY.current === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = 0;
      setPullDistance(0);
      setState('idle');
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);
      
      if (distance >= threshold && state !== 'ready') {
        setState('ready');
        hapticFeedback('medium');
      } else if (distance < threshold && state === 'ready') {
        setState('pulling');
      } else if (distance > 0 && state === 'idle') {
        setState('pulling');
      }
    }
  }, [disabled, state, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;
    
    if (state === 'ready') {
      setState('refreshing');
      setPullDistance(threshold * 0.6);
      
      try {
        await onRefresh();
        hapticFeedback('light');
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    }
    
    setState('idle');
    setPullDistance(0);
    startY.current = 0;
  }, [disabled, state, threshold, onRefresh]);

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorScale = 0.5 + (indicatorOpacity * 0.5);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center",
          "transition-transform duration-200",
          state === 'refreshing' && "animate-bounce"
        )}
        style={{ 
          top: Math.max(pullDistance - 40, -40),
          opacity: indicatorOpacity,
          transform: `translateX(-50%) scale(${indicatorScale})`
        }}
      >
        <div className={cn(
          "p-2 rounded-full bg-background shadow-lg border",
          state === 'ready' && "bg-primary text-primary-foreground border-primary"
        )}>
          {state === 'refreshing' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown className={cn(
              "h-5 w-5 transition-transform duration-200",
              state === 'ready' && "rotate-180"
            )} />
          )}
        </div>
      </div>
      
      {/* Content with pull offset */}
      <div 
        style={{ 
          transform: `translateY(${state === 'refreshing' ? threshold * 0.4 : pullDistance * 0.6}px)`,
          transition: state === 'idle' ? 'transform 0.3s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}
