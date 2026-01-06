import { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OfflineIndicatorProps {
  pendingChanges?: number;
  onSync?: () => void;
}

export function OfflineIndicator({ pendingChanges = 0, onSync }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show banner briefly when coming back online
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (onSync) {
      setIsSyncing(true);
      try {
        await onSync();
      } finally {
        setIsSyncing(false);
      }
    }
  };

  if (!showBanner && isOnline && pendingChanges === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-14 left-0 right-0 z-40 px-4 py-2 flex items-center justify-between gap-2 text-sm transition-all duration-300",
        isOnline 
          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-b border-green-500/20" 
          : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-b border-yellow-500/20"
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline</span>
            <CloudOff className="h-3 w-3 ml-1" />
          </>
        )}
        
        {pendingChanges > 0 && (
          <Badge variant="secondary" className="ml-2">
            {pendingChanges} pending {pendingChanges === 1 ? 'change' : 'changes'}
          </Badge>
        )}
      </div>

      {isOnline && pendingChanges > 0 && onSync && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-7 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isSyncing && "animate-spin")} />
          Sync now
        </Button>
      )}

      {!isOnline && (
        <span className="text-xs opacity-75">
          Changes will sync when you're back online
        </span>
      )}
    </div>
  );
}
