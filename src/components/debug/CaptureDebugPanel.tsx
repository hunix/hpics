/**
 * Capture Debug Panel
 * 
 * Debugging and monitoring tool for offline captures:
 * - IndexedDB storage stats
 * - Pending uploads list
 * - Integrity checks
 * - Manual recovery tools
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Database,
  HardDrive,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bug,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { useOfflineCapture } from '@/hooks/useOfflineCapture';
import { useCaptureRecovery } from '@/hooks/useCaptureRecovery';
import { 
  checkAllCapturesIntegrity, 
  autoRepairAll,
  type IntegrityResult 
} from '@/lib/captureIntegrityChecker';

interface CaptureDebugPanelProps {
  className?: string;
}

export function CaptureDebugPanel({ className }: CaptureDebugPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    storage: true,
    captures: true,
    integrity: false,
  });
  const [integrityResults, setIntegrityResults] = useState<IntegrityResult[]>([]);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const {
    isInitialized,
    captures,
    pendingCount,
    storageQuota,
    uploadProgress,
    isOnline,
    uploadCapture,
    uploadAllPending,
    deleteCapture,
    refreshCaptures,
    requestPersistence,
  } = useOfflineCapture();

  const {
    incompleteCaptures,
    failedCaptures,
    healthSummary,
  } = useCaptureRecovery();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const runIntegrityCheck = useCallback(async () => {
    setIsCheckingIntegrity(true);
    try {
      const results = await checkAllCapturesIntegrity();
      setIntegrityResults(results);
      
      const issues = results.filter(r => !r.isValid);
      if (issues.length === 0) {
        toast.success('All captures are healthy');
      } else {
        toast.warning(`Found ${issues.length} capture(s) with issues`);
      }
    } catch (error) {
      console.error('Integrity check failed:', error);
      toast.error('Integrity check failed');
    } finally {
      setIsCheckingIntegrity(false);
    }
  }, []);

  const runAutoRepair = useCallback(async () => {
    setIsRepairing(true);
    try {
      const result = await autoRepairAll();
      
      if (result.repaired > 0) {
        toast.success(`Repaired ${result.repaired} capture(s)`);
      }
      if (result.deleted > 0) {
        toast.info(`Removed ${result.deleted} unrecoverable capture(s)`);
      }
      
      await refreshCaptures();
      await runIntegrityCheck();
    } catch (error) {
      console.error('Auto-repair failed:', error);
      toast.error('Auto-repair failed');
    } finally {
      setIsRepairing(false);
    }
  }, [refreshCaptures, runIntegrityCheck]);

  const exportLogs = useCallback(() => {
    const logs = {
      timestamp: new Date().toISOString(),
      storageQuota,
      captures: captures.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        size: c.totalSize,
        chunks: c.totalChunks,
        uploadedChunks: c.uploadedChunks,
        createdAt: c.createdAt,
        retryCount: c.retryCount,
      })),
      integrityResults,
      healthSummary,
    };

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capture-debug-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Debug logs exported');
  }, [storageQuota, captures, integrityResults, healthSummary]);

  if (!isInitialized) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Capture Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Storage Section */}
        <Collapsible open={expandedSections.storage} onOpenChange={() => toggleSection('storage')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="font-medium">Storage</span>
              </div>
              {expandedSections.storage ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-2">
            {storageQuota && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>IndexedDB Usage</span>
                    <span className="text-muted-foreground">
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
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Available</span>
                  <span className="font-mono">{formatBytes(storageQuota.available)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Persistent Storage</span>
                  {storageQuota.isPersisted ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={requestPersistence}>
                      Request
                    </Button>
                  )}
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Captures Section */}
        <Collapsible open={expandedSections.captures} onOpenChange={() => toggleSection('captures')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Captures ({captures.length})</span>
                {pendingCount > 0 && (
                  <Badge variant="secondary">{pendingCount} pending</Badge>
                )}
              </div>
              {expandedSections.captures ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2">
            <div className="flex gap-2 mb-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshCaptures()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {pendingCount > 0 && isOnline && (
                <Button 
                  size="sm" 
                  onClick={() => uploadAllPending()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload All
                </Button>
              )}
            </div>

            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No captures stored
                      </TableCell>
                    </TableRow>
                  ) : (
                    captures.map((capture) => {
                      const progress = uploadProgress.get(capture.id);
                      return (
                        <TableRow key={capture.id}>
                          <TableCell className="capitalize">{capture.type}</TableCell>
                          <TableCell>
                            <Badge variant={
                              capture.status === 'uploaded' ? 'default' :
                              capture.status === 'failed' ? 'destructive' :
                              capture.status === 'uploading' ? 'secondary' :
                              'outline'
                            }>
                              {progress ? `${Math.round(progress.percentComplete)}%` : capture.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatBytes(capture.totalSize)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {capture.uploadedChunks}/{capture.totalChunks}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {capture.status === 'ready' && isOnline && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => uploadCapture(capture.id)}
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteCapture(capture.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Integrity Section */}
        <Collapsible open={expandedSections.integrity} onOpenChange={() => toggleSection('integrity')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Integrity Check</span>
              </div>
              {expandedSections.integrity ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2 space-y-3">
            {healthSummary && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <div className="font-bold text-green-600">{healthSummary.healthy}</div>
                  <div className="text-muted-foreground">Healthy</div>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <div className="font-bold text-yellow-600">{healthSummary.warnings}</div>
                  <div className="text-muted-foreground">Warnings</div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <div className="font-bold text-orange-600">{healthSummary.errors}</div>
                  <div className="text-muted-foreground">Errors</div>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <div className="font-bold text-red-600">{healthSummary.critical}</div>
                  <div className="text-muted-foreground">Critical</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runIntegrityCheck}
                disabled={isCheckingIntegrity}
              >
                {isCheckingIntegrity ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Check Integrity
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={runAutoRepair}
                disabled={isRepairing || integrityResults.every(r => r.isValid)}
              >
                {isRepairing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-1" />
                )}
                Auto-Repair
              </Button>
            </div>

            {/* Integrity results */}
            {integrityResults.length > 0 && (
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {integrityResults.map((result) => (
                    <div
                      key={result.captureId}
                      className={cn(
                        'p-2 rounded-lg text-xs',
                        result.isValid ? 'bg-green-500/10' : 'bg-red-500/10'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {result.isValid ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-mono">{result.captureId.slice(0, 8)}...</span>
                        {!result.isValid && (
                          <Badge variant="destructive" className="text-xs">
                            {result.issues.length} issue(s)
                          </Badge>
                        )}
                      </div>
                      {result.issues.length > 0 && (
                        <div className="mt-1 pl-5 text-muted-foreground">
                          {result.issues.map((issue, i) => (
                            <div key={i}>• {issue.description}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
