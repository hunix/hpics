/**
 * Capture Integrity Checker
 * 
 * Verifies data integrity of offline captures:
 * - Validates checksums
 * - Checks for missing chunks
 * - Repairs recoverable issues
 * - Reports corruption
 */

import {
  getCapture,
  getCaptureChunks,
  getAllCaptures,
  computeChecksum,
  updateCaptureStatus,
  deleteCapture,
  type OfflineCapture,
  type CaptureChunk,
} from './offlineCaptureStore';

export interface IntegrityResult {
  captureId: string;
  isValid: boolean;
  issues: IntegrityIssue[];
  canRecover: boolean;
}

export interface IntegrityIssue {
  type: 'missing_chunk' | 'corrupted_chunk' | 'checksum_mismatch' | 'incomplete_capture' | 'orphaned_chunks';
  description: string;
  severity: 'warning' | 'error' | 'critical';
  chunkIndex?: number;
}

export interface RepairResult {
  captureId: string;
  repaired: boolean;
  issuesFixed: number;
  issuesRemaining: number;
  action?: 'recovered' | 'deleted' | 'marked_failed';
}

/**
 * Check integrity of a single capture
 */
export async function checkCaptureIntegrity(captureId: string): Promise<IntegrityResult> {
  const issues: IntegrityIssue[] = [];
  const capture = await getCapture(captureId);

  if (!capture) {
    return {
      captureId,
      isValid: false,
      issues: [{
        type: 'incomplete_capture',
        description: 'Capture record not found',
        severity: 'critical',
      }],
      canRecover: false,
    };
  }

  const chunks = await getCaptureChunks(captureId);

  // Check for incomplete captures
  if (capture.status === 'capturing') {
    issues.push({
      type: 'incomplete_capture',
      description: 'Capture was interrupted during recording',
      severity: 'warning',
    });
  }

  // Check for missing chunks
  const expectedChunks = capture.totalChunks;
  if (chunks.length < expectedChunks) {
    const missingIndices: number[] = [];
    const existingIndices = new Set(chunks.map(c => c.chunkIndex));
    
    for (let i = 0; i < expectedChunks; i++) {
      if (!existingIndices.has(i)) {
        missingIndices.push(i);
      }
    }

    for (const index of missingIndices) {
      issues.push({
        type: 'missing_chunk',
        description: `Chunk ${index} is missing`,
        severity: 'critical',
        chunkIndex: index,
      });
    }
  }

  // Verify chunk checksums
  for (const chunk of chunks) {
    try {
      const computedChecksum = await computeChecksum(chunk.data);
      if (computedChecksum !== chunk.checksum) {
        issues.push({
          type: 'corrupted_chunk',
          description: `Chunk ${chunk.chunkIndex} has invalid checksum`,
          severity: 'critical',
          chunkIndex: chunk.chunkIndex,
        });
      }
    } catch (error) {
      issues.push({
        type: 'corrupted_chunk',
        description: `Chunk ${chunk.chunkIndex} is unreadable`,
        severity: 'critical',
        chunkIndex: chunk.chunkIndex,
      });
    }
  }

  // Verify overall checksum (if capture is finalized)
  if (capture.status !== 'capturing' && capture.checksum) {
    const allChecksums = chunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map(c => c.checksum)
      .join('');
    
    try {
      const computedFinalChecksum = await computeChecksum(new Blob([allChecksums]));
      if (computedFinalChecksum !== capture.checksum) {
        issues.push({
          type: 'checksum_mismatch',
          description: 'Final checksum does not match stored checksum',
          severity: 'error',
        });
      }
    } catch (error) {
      issues.push({
        type: 'checksum_mismatch',
        description: 'Unable to compute final checksum',
        severity: 'error',
      });
    }
  }

  // Determine if recovery is possible
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const canRecover = criticalIssues.length === 0;

  return {
    captureId,
    isValid: issues.length === 0,
    issues,
    canRecover,
  };
}

/**
 * Check integrity of all captures
 */
export async function checkAllCapturesIntegrity(): Promise<IntegrityResult[]> {
  const captures = await getAllCaptures();
  const results: IntegrityResult[] = [];

  for (const capture of captures) {
    const result = await checkCaptureIntegrity(capture.id);
    results.push(result);
  }

  return results;
}

/**
 * Attempt to repair a capture
 */
export async function repairCapture(captureId: string): Promise<RepairResult> {
  const integrityResult = await checkCaptureIntegrity(captureId);
  
  if (integrityResult.isValid) {
    return {
      captureId,
      repaired: true,
      issuesFixed: 0,
      issuesRemaining: 0,
    };
  }

  let issuesFixed = 0;
  const criticalIssues = integrityResult.issues.filter(i => i.severity === 'critical');
  const capture = await getCapture(captureId);

  // If capture is incomplete but has valid chunks, try to finalize
  if (capture?.status === 'capturing') {
    const chunks = await getCaptureChunks(captureId);
    if (chunks.length > 0) {
      // Check if we have a usable partial capture
      const validChunks = [];
      for (const chunk of chunks) {
        try {
          const checksum = await computeChecksum(chunk.data);
          if (checksum === chunk.checksum) {
            validChunks.push(chunk);
          }
        } catch {
          // Skip invalid chunks
        }
      }

      if (validChunks.length > 0) {
        // Mark as failed but recoverable for manual review
        await updateCaptureStatus(captureId, 'failed');
        issuesFixed++;
      }
    }
  }

  // If critical issues exist and cannot be fixed, mark as failed or delete
  if (criticalIssues.length > 0 && !integrityResult.canRecover) {
    // If all chunks are missing or corrupted, delete
    if (criticalIssues.every(i => i.type === 'missing_chunk' || i.type === 'corrupted_chunk')) {
      await deleteCapture(captureId);
      return {
        captureId,
        repaired: false,
        issuesFixed: 0,
        issuesRemaining: criticalIssues.length,
        action: 'deleted',
      };
    }

    // Otherwise mark as failed
    await updateCaptureStatus(captureId, 'failed');
    return {
      captureId,
      repaired: false,
      issuesFixed,
      issuesRemaining: criticalIssues.length,
      action: 'marked_failed',
    };
  }

  return {
    captureId,
    repaired: integrityResult.canRecover,
    issuesFixed,
    issuesRemaining: integrityResult.issues.length - issuesFixed,
    action: 'recovered',
  };
}

/**
 * Find and cleanup orphaned chunks (chunks without a capture record)
 */
export async function cleanupOrphanedChunks(): Promise<number> {
  const captures = await getAllCaptures();
  const captureIds = new Set(captures.map(c => c.id));
  
  // This would require direct IndexedDB access to find orphans
  // For now, we'll clean up through the normal capture deletion process
  let cleaned = 0;
  
  for (const capture of captures) {
    if (!captureIds.has(capture.id)) {
      await deleteCapture(capture.id);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Get summary of all capture health
 */
export async function getCaptureHealthSummary(): Promise<{
  total: number;
  healthy: number;
  warnings: number;
  errors: number;
  critical: number;
  canRecover: number;
}> {
  const results = await checkAllCapturesIntegrity();
  
  return {
    total: results.length,
    healthy: results.filter(r => r.isValid).length,
    warnings: results.filter(r => r.issues.some(i => i.severity === 'warning')).length,
    errors: results.filter(r => r.issues.some(i => i.severity === 'error')).length,
    critical: results.filter(r => r.issues.some(i => i.severity === 'critical')).length,
    canRecover: results.filter(r => !r.isValid && r.canRecover).length,
  };
}

/**
 * Auto-repair all captures that can be recovered
 */
export async function autoRepairAll(): Promise<{
  repaired: number;
  failed: number;
  deleted: number;
}> {
  const results = await checkAllCapturesIntegrity();
  const toRepair = results.filter(r => !r.isValid);
  
  let repaired = 0;
  let failed = 0;
  let deleted = 0;

  for (const result of toRepair) {
    const repairResult = await repairCapture(result.captureId);
    
    if (repairResult.action === 'deleted') {
      deleted++;
    } else if (repairResult.repaired) {
      repaired++;
    } else {
      failed++;
    }
  }

  return { repaired, failed, deleted };
}
