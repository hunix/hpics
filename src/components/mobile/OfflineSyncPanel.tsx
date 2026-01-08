import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOfflineData } from '@/hooks/useOfflineData';
import { getLastSyncTime } from '@/lib/offlineStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function OfflineSyncPanel() {
  const { isOnline, pendingCount, syncPendingChanges, isSyncing, cacheContacts } = useOfflineData();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isCaching, setIsCaching] = useState(false);

  useEffect(() => {
    const loadLastSync = async () => {
      const time = await getLastSyncTime();
      if (time) {
        setLastSync(new Date(time));
      }
    };
    loadLastSync();
  }, [isSyncing]);

  const handleCacheContacts = async () => {
    setIsCaching(true);
    try {
      await cacheContacts();
      const time = await getLastSyncTime();
      if (time) {
        setLastSync(new Date(time));
      }
    } finally {
      setIsCaching(false);
    }
  };

  const handleSync = async () => {
    await syncPendingChanges();
    const time = await getLastSyncTime();
    if (time) {
      setLastSync(new Date(time));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Offline Data
          </span>
          <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
            {isOnline ? (
              <>
                <Cloud className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <CloudOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pending changes</span>
            <Badge variant={pendingCount > 0 ? 'destructive' : 'outline'}>
              {pendingCount}
            </Badge>
          </div>
          
          {lastSync && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last synced</span>
              <span className="text-foreground">
                {formatDistanceToNow(lastSync, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing changes...
            </div>
            <Progress value={50} className="h-1" />
          </div>
        )}

        {/* Status Messages */}
        {!isOnline && pendingCount > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Changes pending</p>
              <p className="text-xs opacity-80">
                {pendingCount} change{pendingCount !== 1 ? 's' : ''} will sync when you're back online
              </p>
            </div>
          </div>
        )}

        {isOnline && pendingCount === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-sm">All changes synced</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCacheContacts}
            disabled={isCaching || !isOnline}
          >
            <Database className={cn("h-4 w-4 mr-2", isCaching && "animate-pulse")} />
            {isCaching ? 'Caching...' : 'Cache Data'}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleSync}
            disabled={isSyncing || pendingCount === 0 || !isOnline}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Offline Tips */}
        {!isOnline && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> You can still browse cached contacts and make changes while offline. 
              Everything will automatically sync when you reconnect.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
