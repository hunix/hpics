/**
 * Capture Recovery Banner
 * 
 * Displays a banner when there are:
 * - Pending captures waiting to upload
 * - Failed captures that need retry
 * - Incomplete captures that need recovery
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudOff, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  HardDrive,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCaptureRecovery } from '@/hooks/useCaptureRecovery';
import { useOfflineCapture } from '@/hooks/useOfflineCapture';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CaptureRecoveryBannerProps {
  className?: string;
  compact?: boolean;
}

export function CaptureRecoveryBanner({ className, compact = false }: CaptureRecoveryBannerProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const {
    incompleteCaptures,
    pendingCaptures,
    failedCaptures,
    healthSummary,
    isChecking,
    isRepairing,
    showRecoveryBanner,
    repairAll,
    dismissIncomplete,
    retryFailed,
  } = useCaptureRecovery();

  const {
    isOnline,
    uploadProgress,
    uploadAllPending,
    storageQuota,
  } = useOfflineCapture();

  // Calculate overall upload progress
  const overallProgress = React.useMemo(() => {
    if (uploadProgress.size === 0) return 0;
    let total = 0;
    uploadProgress.forEach(p => {
      total += p.percentComplete;
    });
    return total / uploadProgress.size;
  }, [uploadProgress]);

  if (!showRecoveryBanner) {
    return null;
  }

  const totalPending = pendingCaptures.length;
  const totalFailed = failedCaptures.length;
  const totalIncomplete = incompleteCaptures.length;
  const isUploading = uploadProgress.size > 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
          'bg-muted/50 border',
          className
        )}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Cloud className="h-4 w-4 text-primary" />
          ) : (
            <CloudOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {totalPending > 0 && `${totalPending} pending`}
            {totalFailed > 0 && ` · ${totalFailed} failed`}
            {totalIncomplete > 0 && ` · ${totalIncomplete} incomplete`}
          </span>
        </div>
        
        {isOnline && totalPending > 0 && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => uploadAllPending()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'overflow-hidden rounded-lg border',
          'bg-gradient-to-r from-muted/50 to-background',
          className
        )}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <div className="p-2 rounded-full bg-primary/10">
                    <Cloud className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-muted">
                    <CloudOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {isOnline ? 'Sync Status' : 'Offline Mode'}
                    </span>
                    {totalPending > 0 && (
                      <Badge variant="secondary">{totalPending} pending</Badge>
                    )}
                    {totalFailed > 0 && (
                      <Badge variant="destructive">{totalFailed} failed</Badge>
                    )}
                    {totalIncomplete > 0 && (
                      <Badge variant="outline">{totalIncomplete} incomplete</Badge>
                    )}
                  </div>
                  
                  {isUploading && (
                    <div className="mt-2 space-y-1">
                      <Progress value={overallProgress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        Uploading... {Math.round(overallProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOnline && totalPending > 0 && !isUploading && (
                  <Button 
                    size="sm" 
                    onClick={() => uploadAllPending()}
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                )}
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {/* Storage Info */}
              {storageQuota && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Local Storage</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(storageQuota.usage)} / {formatBytes(storageQuota.quota)}
                    </span>
                  </div>
                  <Progress 
                    value={storageQuota.percentUsed} 
                    className={cn(
                      'h-2',
                      storageQuota.percentUsed > 90 && 'bg-destructive/20'
                    )}
                  />
                  {!storageQuota.isPersisted && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Storage not persistent - browser may delete data
                    </p>
                  )}
                </div>
              )}

              {/* Failed Captures */}
              {failedCaptures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Failed Uploads
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    {failedCaptures.slice(0, 3).map(capture => (
                      <div 
                        key={capture.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-destructive/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {capture.type} • {formatBytes(capture.totalSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
                            {capture.retryCount > 0 && ` • ${capture.retryCount} retries`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => retryFailed(capture.id)}
                            disabled={!isOnline}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => dismissIncomplete(capture.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {failedCaptures.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{failedCaptures.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Incomplete Captures */}
              {incompleteCaptures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-warning" />
                      Incomplete Captures
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => repairAll()}
                      disabled={isRepairing}
                    >
                      {isRepairing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Wrench className="h-4 w-4 mr-2" />
                      )}
                      Repair All
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {incompleteCaptures.slice(0, 3).map(capture => (
                      <div 
                        key={capture.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {capture.type} • {capture.totalChunks} chunks
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Interrupted {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dismissIncomplete(capture.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Summary */}
              {healthSummary && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>
                    {healthSummary.healthy}/{healthSummary.total} captures healthy
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    Check Health
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    </AnimatePresence>
  );
}
