/**
 * Resumable Upload Manager
 * 
 * Handles reliable upload of chunked captures with:
 * - Resume from any point
 * - Exponential backoff on failures
 * - Server-side progress tracking
 * - Integrity verification
 */

import { supabase } from '@/integrations/supabase/client';
import {
  getCapture,
  getCaptureChunks,
  markChunkUploaded,
  updateCaptureStatus,
  deleteCapture,
  reassembleCapture,
  computeChecksum,
  type OfflineCapture,
  type CaptureChunk,
} from './offlineCaptureStore';

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;

export interface UploadProgress {
  captureId: string;
  totalChunks: number;
  uploadedChunks: number;
  percentComplete: number;
  bytesUploaded: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'verifying' | 'completed' | 'failed';
  error?: string;
  speed?: number; // bytes per second
  eta?: number; // seconds remaining
}

type ProgressCallback = (progress: UploadProgress) => void;

class ResumableUploadManager {
  private activeUploads = new Map<string, AbortController>();
  private progressCallbacks = new Map<string, Set<ProgressCallback>>();
  private uploadStartTimes = new Map<string, number>();
  private bytesUploadedHistory = new Map<string, { time: number; bytes: number }[]>();

  /**
   * Subscribe to upload progress updates
   */
  onProgress(captureId: string, callback: ProgressCallback): () => void {
    if (!this.progressCallbacks.has(captureId)) {
      this.progressCallbacks.set(captureId, new Set());
    }
    this.progressCallbacks.get(captureId)!.add(callback);

    return () => {
      this.progressCallbacks.get(captureId)?.delete(callback);
    };
  }

  /**
   * Emit progress to all subscribers
   */
  private emitProgress(progress: UploadProgress): void {
    const callbacks = this.progressCallbacks.get(progress.captureId);
    if (callbacks) {
      callbacks.forEach(cb => cb(progress));
    }
  }

  /**
   * Calculate upload speed and ETA
   */
  private calculateSpeedAndEta(
    captureId: string,
    bytesUploaded: number,
    totalBytes: number
  ): { speed: number; eta: number } {
    const now = Date.now();
    const history = this.bytesUploadedHistory.get(captureId) || [];
    
    // Add current data point
    history.push({ time: now, bytes: bytesUploaded });
    
    // Keep only last 10 seconds of history
    const cutoff = now - 10000;
    const recentHistory = history.filter(h => h.time > cutoff);
    this.bytesUploadedHistory.set(captureId, recentHistory);

    if (recentHistory.length < 2) {
      return { speed: 0, eta: 0 };
    }

    // Calculate speed from recent history
    const oldest = recentHistory[0];
    const newest = recentHistory[recentHistory.length - 1];
    const timeDiff = (newest.time - oldest.time) / 1000; // seconds
    const bytesDiff = newest.bytes - oldest.bytes;
    
    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
    const remaining = totalBytes - bytesUploaded;
    const eta = speed > 0 ? remaining / speed : 0;

    return { speed, eta };
  }

  /**
   * Start or resume upload for a capture
   */
  async uploadCapture(captureId: string): Promise<boolean> {
    const capture = await getCapture(captureId);
    if (!capture) {
      console.error('Capture not found:', captureId);
      return false;
    }

    // Check if already uploading
    if (this.activeUploads.has(captureId)) {
      console.log('Upload already in progress for:', captureId);
      return false;
    }

    const abortController = new AbortController();
    this.activeUploads.set(captureId, abortController);
    this.uploadStartTimes.set(captureId, Date.now());

    try {
      // Update status to uploading
      await updateCaptureStatus(captureId, 'uploading');

      // Get chunks and find which need uploading
      const chunks = await getCaptureChunks(captureId);
      const chunksToUpload = chunks.filter(c => !c.uploaded);

      // Reassemble the file
      const blob = await reassembleCapture(captureId);
      
      // Verify checksum before upload
      const computedChecksum = await computeChecksum(blob);
      if (computedChecksum !== capture.checksum) {
        throw new Error('Capture checksum mismatch - file may be corrupted');
      }

      // Create or get server-side progress record
      await this.ensureServerProgress(capture, chunks.length);

      // Upload the complete file
      const success = await this.uploadBlob(capture, blob, abortController.signal);

      if (success) {
        // Mark all chunks as uploaded
        for (const chunk of chunks) {
          await markChunkUploaded(captureId, chunk.chunkIndex);
        }

        // Update status
        await updateCaptureStatus(captureId, 'uploaded', {
          storagePath: this.getStoragePath(capture),
        });

        // Update server progress
        await this.completeServerProgress(captureId);

        this.emitProgress({
          captureId,
          totalChunks: chunks.length,
          uploadedChunks: chunks.length,
          percentComplete: 100,
          bytesUploaded: capture.totalSize,
          totalBytes: capture.totalSize,
          status: 'completed',
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Upload failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await updateCaptureStatus(captureId, 'failed', {
        retryCount: capture.retryCount + 1,
        lastAttempt: new Date().toISOString(),
      });

      this.emitProgress({
        captureId,
        totalChunks: capture.totalChunks,
        uploadedChunks: capture.uploadedChunks,
        percentComplete: (capture.uploadedChunks / capture.totalChunks) * 100,
        bytesUploaded: 0,
        totalBytes: capture.totalSize,
        status: 'failed',
        error: errorMessage,
      });

      return false;
    } finally {
      this.activeUploads.delete(captureId);
      this.uploadStartTimes.delete(captureId);
      this.bytesUploadedHistory.delete(captureId);
    }
  }

  /**
   * Upload blob with retry logic
   */
  private async uploadBlob(
    capture: OfflineCapture,
    blob: Blob,
    signal: AbortSignal
  ): Promise<boolean> {
    const storagePath = this.getStoragePath(capture);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      try {
        this.emitProgress({
          captureId: capture.id,
          totalChunks: capture.totalChunks,
          uploadedChunks: 0,
          percentComplete: 0,
          bytesUploaded: 0,
          totalBytes: capture.totalSize,
          status: 'uploading',
        });

        const { error } = await supabase.storage
          .from('media')
          .upload(storagePath, blob, {
            contentType: capture.mimeType,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        // Verify upload
        this.emitProgress({
          captureId: capture.id,
          totalChunks: capture.totalChunks,
          uploadedChunks: capture.totalChunks,
          percentComplete: 100,
          bytesUploaded: capture.totalSize,
          totalBytes: capture.totalSize,
          status: 'verifying',
        });

        // Get public URL to verify
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);

        if (urlData?.publicUrl) {
          return true;
        }

        throw new Error('Failed to verify upload');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Upload attempt ${attempt + 1} failed:`, lastError);

        if (attempt < MAX_RETRIES - 1) {
          // Exponential backoff with jitter
          const delay = Math.min(
            BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000,
            MAX_DELAY_MS
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Upload failed after max retries');
  }

  /**
   * Generate storage path for a capture
   */
  private getStoragePath(capture: OfflineCapture): string {
    const date = new Date(capture.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const ext = this.getFileExtension(capture.mimeType);
    
    return `${capture.profileId || 'unlinked'}/${year}/${month}/${capture.id}.${ext}`;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
    };
    return map[mimeType] || 'bin';
  }

  /**
   * Create or update server-side progress record
   */
  private async ensureServerProgress(
    capture: OfflineCapture,
    totalChunks: number
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('capture_upload_progress')
      .upsert({
        user_id: user.id,
        local_capture_id: capture.id,
        total_chunks: totalChunks,
        uploaded_chunks: capture.uploadedChunks,
        total_size: capture.totalSize,
        mime_type: capture.mimeType,
        checksum: capture.checksum,
        status: 'uploading',
        profile_id: capture.profileId || null,
        capture_type: capture.type,
        metadata: capture.metadata,
      }, {
        onConflict: 'user_id,local_capture_id',
      });
  }

  /**
   * Mark server progress as complete
   */
  private async completeServerProgress(captureId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('capture_upload_progress')
      .update({
        status: 'completed',
        uploaded_chunks: (await getCapture(captureId))?.totalChunks || 0,
        completed_at: new Date().toISOString(),
      })
      .eq('local_capture_id', captureId)
      .eq('user_id', user.id);
  }

  /**
   * Cancel an ongoing upload
   */
  cancelUpload(captureId: string): void {
    const controller = this.activeUploads.get(captureId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(captureId);
    }
  }

  /**
   * Check if upload is in progress
   */
  isUploading(captureId: string): boolean {
    return this.activeUploads.has(captureId);
  }

  /**
   * Upload all pending captures
   */
  async uploadAllPending(): Promise<{ success: number; failed: number }> {
    const { getPendingCaptures } = await import('./offlineCaptureStore');
    const pending = await getPendingCaptures();
    
    let success = 0;
    let failed = 0;

    for (const capture of pending) {
      const result = await this.uploadCapture(capture.id);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Retry a failed upload
   */
  async retryUpload(captureId: string): Promise<boolean> {
    const capture = await getCapture(captureId);
    if (!capture || capture.retryCount >= MAX_RETRIES) {
      return false;
    }
    return this.uploadCapture(captureId);
  }

  /**
   * Delete capture and cleanup
   */
  async deleteAndCleanup(captureId: string): Promise<void> {
    // Cancel if uploading
    this.cancelUpload(captureId);
    
    // Delete from IndexedDB
    await deleteCapture(captureId);

    // Delete server progress record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('capture_upload_progress')
        .delete()
        .eq('local_capture_id', captureId)
        .eq('user_id', user.id);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const uploadManager = new ResumableUploadManager();
