/**
 * Capture Recovery Hook
 * 
 * Handles recovery of interrupted captures:
 * - Detects incomplete captures on app start
 * - Provides UI for recovery options
 * - Auto-repairs when possible
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getIncompleteCaptures,
  getPendingCaptures,
  getAllCaptures,
  type OfflineCapture,
} from '@/lib/offlineCaptureStore';
import {
  checkCaptureIntegrity,
  repairCapture,
  autoRepairAll,
  getCaptureHealthSummary,
  type IntegrityResult,
  type RepairResult,
} from '@/lib/captureIntegrityChecker';

export interface RecoveryState {
  incompleteCaptures: OfflineCapture[];
  pendingCaptures: OfflineCapture[];
  failedCaptures: OfflineCapture[];
  healthSummary: {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
    critical: number;
    canRecover: number;
  } | null;
  isChecking: boolean;
  isRepairing: boolean;
}

export interface UseCaptureRecoveryReturn extends RecoveryState {
  checkHealth: () => Promise<void>;
  repairAll: () => Promise<{ repaired: number; failed: number; deleted: number }>;
  repairSingle: (captureId: string) => Promise<RepairResult>;
  dismissIncomplete: (captureId: string) => Promise<void>;
  retryFailed: (captureId: string) => Promise<boolean>;
  hasIssues: boolean;
  showRecoveryBanner: boolean;
}

export function useCaptureRecovery(): UseCaptureRecoveryReturn {
  const [state, setState] = useState<RecoveryState>({
    incompleteCaptures: [],
    pendingCaptures: [],
    failedCaptures: [],
    healthSummary: null,
    isChecking: false,
    isRepairing: false,
  });

  // Check for issues on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const [incomplete, pending, allCaptures, summary] = await Promise.all([
        getIncompleteCaptures(),
        getPendingCaptures(),
        getAllCaptures(),
        getCaptureHealthSummary(),
      ]);

      const failed = allCaptures.filter(c => c.status === 'failed');

      setState({
        incompleteCaptures: incomplete,
        pendingCaptures: pending,
        failedCaptures: failed,
        healthSummary: summary,
        isChecking: false,
        isRepairing: false,
      });

      // Show toast if there are issues
      if (incomplete.length > 0) {
        toast.warning(`${incomplete.length} incomplete capture(s) found`, {
          description: 'These were interrupted and may be recoverable',
        });
      }

      if (failed.length > 0 && pending.length === 0) {
        toast.error(`${failed.length} capture(s) failed to upload`, {
          description: 'Tap to retry',
        });
      }
    } catch (error) {
      console.error('Failed to check capture health:', error);
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  const repairAll = useCallback(async () => {
    setState(prev => ({ ...prev, isRepairing: true }));

    try {
      const result = await autoRepairAll();

      if (result.repaired > 0) {
        toast.success(`Recovered ${result.repaired} capture(s)`);
      }
      if (result.deleted > 0) {
        toast.info(`Removed ${result.deleted} unrecoverable capture(s)`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} capture(s) could not be repaired`);
      }

      // Refresh state
      await checkHealth();

      return result;
    } catch (error) {
      console.error('Failed to repair captures:', error);
      toast.error('Repair failed');
      setState(prev => ({ ...prev, isRepairing: false }));
      throw error;
    }
  }, [checkHealth]);

  const repairSingle = useCallback(async (captureId: string): Promise<RepairResult> => {
    try {
      const result = await repairCapture(captureId);

      if (result.repaired) {
        toast.success('Capture repaired');
      } else if (result.action === 'deleted') {
        toast.info('Capture was unrecoverable and deleted');
      } else {
        toast.warning('Could not fully repair capture');
      }

      await checkHealth();
      return result;
    } catch (error) {
      console.error('Failed to repair capture:', error);
      toast.error('Repair failed');
      throw error;
    }
  }, [checkHealth]);

  const dismissIncomplete = useCallback(async (captureId: string) => {
    const { deleteCapture } = await import('@/lib/offlineCaptureStore');
    await deleteCapture(captureId);
    toast.info('Incomplete capture removed');
    await checkHealth();
  }, [checkHealth]);

  const retryFailed = useCallback(async (captureId: string): Promise<boolean> => {
    const { uploadManager } = await import('@/lib/resumableUploadManager');
    
    try {
      const result = await uploadManager.retryUpload(captureId);
      
      if (result) {
        toast.success('Upload successful');
      } else {
        toast.error('Upload failed - will retry later');
      }

      await checkHealth();
      return result;
    } catch (error) {
      console.error('Retry failed:', error);
      toast.error('Upload failed');
      return false;
    }
  }, [checkHealth]);

  const hasIssues = 
    state.incompleteCaptures.length > 0 ||
    state.failedCaptures.length > 0 ||
    (state.healthSummary?.critical || 0) > 0;

  const showRecoveryBanner = 
    state.incompleteCaptures.length > 0 ||
    state.pendingCaptures.length > 0 ||
    state.failedCaptures.length > 0;

  return {
    ...state,
    checkHealth,
    repairAll,
    repairSingle,
    dismissIncomplete,
    retryFailed,
    hasIssues,
    showRecoveryBanner,
  };
}
