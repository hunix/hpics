// New Version Available Banner
import { useState } from 'react';
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewVersionAvailableProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'toast' | 'inline';
  className?: string;
}

export function NewVersionAvailable({
  onRefresh,
  onDismiss,
  variant = 'banner',
  className,
}: NewVersionAvailableProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };
  
  if (!isVisible) return null;
  
  if (variant === 'toast') {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm",
        "bg-card border rounded-lg shadow-lg p-4",
        "animate-in slide-in-from-bottom-2",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">New Version Available</h4>
            <p className="text-xs text-muted-foreground mt-1">
              A new version is ready. Refresh to get the latest features.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleRefresh} className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Now
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-7 text-xs"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg",
        "bg-primary/5 border border-primary/20",
        className
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">New version available</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} className="h-7">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    );
  }
  
  // Default banner variant
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "bg-gradient-to-r from-primary/90 to-primary",
      "text-primary-foreground py-2 px-4",
      "animate-in slide-in-from-top",
      className
    )}>
      <div className="container mx-auto flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">
            A new version of the application is available
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          className="h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Now
        </Button>
        <button
          onClick={handleDismiss}
          className="absolute right-4 hover:opacity-80"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook to detect new versions via service worker or polling
export function useVersionCheck(options: {
  checkInterval?: number;
  onNewVersion?: () => void;
} = {}) {
  const { checkInterval = 300000, onNewVersion } = options; // 5 minutes default
  const [hasNewVersion, setHasNewVersion] = useState(false);
  
  // Listen for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasNewVersion(true);
              onNewVersion?.();
            }
          });
        }
      });
    });
  }
  
  return {
    hasNewVersion,
    checkForUpdate: () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }
    },
    refresh: () => window.location.reload(),
  };
}