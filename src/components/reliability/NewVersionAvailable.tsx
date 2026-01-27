// New Version Available Banner
import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, X, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forceAppUpdate } from '@/lib/appVersion';

interface NewVersionAvailableProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'toast' | 'inline';
  className?: string;
  currentVersion?: string;
  newVersion?: string;
}

export function NewVersionAvailable({
  onRefresh,
  onDismiss,
  variant = 'banner',
  className,
  currentVersion,
  newVersion,
}: NewVersionAvailableProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleRefresh = async () => {
    setIsUpdating(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await forceAppUpdate();
      }
    } catch (error) {
      console.error('[NewVersionAvailable] Update failed:', error);
      setIsUpdating(false);
    }
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };
  
  if (!isVisible) return null;

  const versionText = newVersion 
    ? `Version ${newVersion} is available`
    : 'A new version is available';
  
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
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{versionText}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Refresh to get the latest features and improvements.
              {currentVersion && (
                <span className="block mt-1 opacity-70">
                  Current: v{currentVersion}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleRefresh} 
                className="h-7 text-xs"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Update Now
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-7 text-xs"
                disabled={isUpdating}
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
            disabled={isUpdating}
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
          <span className="text-sm">{versionText}</span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh} 
          className="h-7"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          {isUpdating ? 'Updating...' : 'Update'}
        </Button>
      </div>
    );
  }
  
  // Default banner variant - prominent top banner
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[60]",
      "bg-gradient-to-r from-primary to-primary/90",
      "text-primary-foreground py-2.5 px-4",
      "animate-in slide-in-from-top duration-300",
      "shadow-lg",
      className
    )}>
      <div className="container mx-auto flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-primary-foreground/20">
            <Download className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">
            {versionText}
          </span>
          {currentVersion && (
            <span className="text-xs opacity-75 hidden sm:inline">
              (current: v{currentVersion})
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          className="h-7 text-xs font-medium"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Update Now
            </>
          )}
        </Button>
        <button
          onClick={handleDismiss}
          className="absolute right-4 hover:opacity-80 transition-opacity"
          aria-label="Dismiss"
          disabled={isUpdating}
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
  const { onNewVersion } = options;
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const onNewVersionRef = useRef(onNewVersion);
  
  // Keep callback ref up to date
  useEffect(() => {
    onNewVersionRef.current = onNewVersion;
  }, [onNewVersion]);
  
  // Listen for service worker updates with proper cleanup
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    let registration: ServiceWorkerRegistration | null = null;
    let newWorker: ServiceWorker | null = null;
    
    const handleUpdateFound = () => {
      newWorker = registration?.installing || null;
      if (newWorker) {
        newWorker.addEventListener('statechange', handleStateChange);
      }
    };
    
    const handleStateChange = () => {
      if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        setHasNewVersion(true);
        onNewVersionRef.current?.();
      }
    };
    
    navigator.serviceWorker.ready
      .then((reg) => {
        registration = reg;
        registration.addEventListener('updatefound', handleUpdateFound);
      })
      .catch((error) => {
        console.error('[useVersionCheck] Service worker ready failed:', error);
      });
    
    // Cleanup function
    return () => {
      if (registration) {
        registration.removeEventListener('updatefound', handleUpdateFound);
      }
      if (newWorker) {
        newWorker.removeEventListener('statechange', handleStateChange);
      }
    };
  }, []);
  
  const checkForUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.update();
        })
        .catch((error) => {
          console.error('[useVersionCheck] Service worker update check failed:', error);
        });
    }
  }, []);
  
  return {
    hasNewVersion,
    checkForUpdate,
    refresh: () => forceAppUpdate(),
  };
}
