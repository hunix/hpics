import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoSocialSync, type SyncSchedule } from '@/hooks/useAutoSocialSync';
import { getAllSyncCursors, getSyncStatusDisplay, type SyncCursor } from '@/lib/sync/differentialSync';
import { cn } from '@/lib/utils';

// Platform icons mapping
const platformIcons: Record<string, string> = {
  instagram: '📸',
  linkedin: '💼',
  threads: '🧵',
  twitter: '🐦',
  whatsapp: '💬',
  gmail: '📧',
  outlook: '📨',
  location: '📍',
  biometrics: '❤️',
};

interface SyncDashboardProps {
  className?: string;
}

export function SyncDashboard({ className }: SyncDashboardProps) {
  const [cursors, setCursors] = useState<SyncCursor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    schedules,
    isRunning,
    currentSync,
    lastError,
    startAutoSync,
    stopAutoSync,
    syncNow,
    loadSchedules,
  } = useAutoSocialSync();

  // Load cursors
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await getAllSyncCursors();
      setCursors(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadSchedules();
    const data = await getAllSyncCursors();
    setCursors(data);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'syncing': return 'border-blue-500/30 bg-blue-500/10';
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-muted bg-muted/30';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant={isRunning ? "destructive" : "default"}
              size="sm"
              onClick={isRunning ? stopAutoSync : startAutoSync}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-sync status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2.5 w-2.5 rounded-full",
              isRunning ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-sm">
              Auto-sync {isRunning ? 'Active' : 'Paused'}
            </span>
          </div>
          {currentSync && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing {currentSync.split(':')[0]}
            </Badge>
          )}
        </div>

        {/* Error display */}
        {lastError && (
          <div className="p-3 bg-destructive/10 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{lastError}</p>
          </div>
        )}

        {/* Sync sources list */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {cursors.map((cursor) => {
                const displayStatus = getSyncStatusDisplay(cursor);
                
                return (
                  <motion.div
                    key={cursor.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      getStatusColor(displayStatus.status)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {platformIcons[cursor.source_type] || '📦'}
                        </span>
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {cursor.source_type}
                          </p>
                          {cursor.source_identifier && (
                            <p className="text-xs text-muted-foreground">
                              {cursor.source_identifier}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(displayStatus.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncNow(
                            cursor.source_type as any,
                            cursor.source_identifier || '',
                            cursor.profile_id || undefined
                          )}
                          disabled={cursor.sync_status === 'syncing'}
                          className="h-7 px-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {displayStatus.message}
                      </span>
                      {displayStatus.lastSync && (
                        <span className="text-muted-foreground">
                          Last: {displayStatus.lastSync}
                        </span>
                      )}
                    </div>

                    {cursor.items_synced_total > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          Total synced: {cursor.items_synced_total.toLocaleString()} items
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {cursors.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No sync sources configured yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Import data or connect social profiles to start syncing
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{cursors.length}</p>
            <p className="text-xs text-muted-foreground">Sources</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">
              {cursors.reduce((acc, c) => acc + (c.items_synced_total || 0), 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Items Synced</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">
              {cursors.filter(c => c.sync_status === 'error').length}
            </p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
