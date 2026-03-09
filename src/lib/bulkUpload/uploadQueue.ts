/**
 * Bulk Upload Queue Engine
 * Handles concurrent uploads with pause/resume, retry logic, rate limiting, and speed tracking
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProcessedFile } from './bulkFileProcessor';
import { getMediaType, getDatabaseTable } from './fileTypeMapping';

export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'skipped' | 'cancelled';

export interface UploadItem extends ProcessedFile {
  status: UploadStatus;
  progress: number;
  retryCount: number;
  error?: string;
  mediaId?: string;
  documentId?: string;
  recordingId?: string;
  dbItemId?: string;
}

export interface SpeedStats {
  bytesPerSecond: number;
  etaSeconds: number;
  lastSamples: { timestamp: number; bytes: number }[];
}

export interface QueueConfig {
  maxConcurrent: number;
  minDelayMs: number;
  maxRetries: number;
  retryDelayMs: number;
  onProgress?: (item: UploadItem) => void;
  onItemComplete?: (item: UploadItem) => void;
  onItemFailed?: (item: UploadItem) => void;
  onQueueComplete?: (items: UploadItem[]) => void;
  onStatusChange?: (status: QueueStatus) => void;
  onSpeedUpdate?: (stats: SpeedStats) => void;
}

export type QueueStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 3,
  minDelayMs: 200,
  maxRetries: 3,
  retryDelayMs: 1000,
};

export class BulkUploadQueue {
  private items: UploadItem[] = [];
  private config: QueueConfig;
  private status: QueueStatus = 'idle';
  private activeUploads = 0;
  private abortController: AbortController | null = null;
  private sessionId: string | null = null;
  private profileId: string | null = null;
  private userId: string | null = null;
  private autoAnalyze = false;
  
  // Speed tracking
  private speedSamples: { timestamp: number; bytes: number }[] = [];
  private totalUploadedBytes = 0;
  private totalBytes = 0;
  private speedUpdateInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Initialize queue with files
   */
  initialize(
    files: ProcessedFile[],
    sessionId: string,
    userId: string,
    profileId?: string,
    autoAnalyze = false
  ): void {
    this.items = files.map(f => ({
      ...f,
      status: f.isValid ? 'pending' : 'skipped',
      progress: 0,
      retryCount: 0,
      error: f.validationError,
    }));
    this.sessionId = sessionId;
    this.userId = userId;
    this.profileId = profileId || null;
    this.autoAnalyze = autoAnalyze;
    this.status = 'idle';
    
    // Calculate total bytes
    this.totalBytes = this.items.reduce((sum, item) => sum + (item.isValid ? item.fileSize : 0), 0);
    this.totalUploadedBytes = 0;
    this.speedSamples = [];
  }
  
  /**
   * Start processing the queue
   */
  async start(): Promise<UploadItem[]> {
    if (this.status === 'running') return this.items;
    
    this.status = 'running';
    this.abortController = new AbortController();
    this.config.onStatusChange?.(this.status);
    
    // Start speed tracking
    this.startSpeedTracking();
    
    await this.processQueue();
    
    return this.items;
  }
  
  /**
   * Pause the queue
   */
  pause(): void {
    if (this.status !== 'running') return;
    
    this.status = 'paused';
    this.stopSpeedTracking();
    this.config.onStatusChange?.(this.status);
  }
  
  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    if (this.status !== 'paused') return;
    
    this.status = 'running';
    this.startSpeedTracking();
    this.config.onStatusChange?.(this.status);
    
    await this.processQueue();
  }
  
  /**
   * Cancel all pending uploads
   */
  cancel(): void {
    this.status = 'cancelled';
    this.abortController?.abort();
    this.stopSpeedTracking();
    
    // Mark pending items as cancelled
    for (const item of this.items) {
      if (item.status === 'pending' || item.status === 'uploading') {
        item.status = 'cancelled';
      }
    }
    
    this.config.onStatusChange?.(this.status);
  }
  
  /**
   * Retry a specific failed item
   */
  async retryItem(itemId: string): Promise<void> {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.status !== 'failed') return;
    
    item.status = 'pending';
    item.retryCount = 0;
    item.error = undefined;
    item.progress = 0;
    
    if (this.status === 'completed' || this.status === 'paused') {
      this.status = 'running';
      this.startSpeedTracking();
      this.config.onStatusChange?.(this.status);
      await this.processQueue();
    }
  }
  
  /**
   * Skip a specific item
   */
  skipItem(itemId: string): void {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.status === 'pending' || item.status === 'failed') {
      item.status = 'skipped';
      this.updateDbItemStatus(item);
    }
  }
  
  /**
   * Retry all failed items
   */
  async retryAllFailed(): Promise<void> {
    for (const item of this.items) {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.retryCount = 0;
        item.error = undefined;
        item.progress = 0;
      }
    }
    
    if (this.status !== 'running') {
      this.status = 'running';
      this.startSpeedTracking();
      this.config.onStatusChange?.(this.status);
      await this.processQueue();
    }
  }
  
  /**
   * Get current queue status
   */
  getStatus(): {
    status: QueueStatus;
    total: number;
    completed: number;
    failed: number;
    pending: number;
    skipped: number;
    progress: number;
    items: UploadItem[];
    speedStats: SpeedStats;
    totalBytes: number;
    uploadedBytes: number;
  } {
    const completed = this.items.filter(i => i.status === 'uploaded').length;
    const failed = this.items.filter(i => i.status === 'failed').length;
    const pending = this.items.filter(i => i.status === 'pending' || i.status === 'uploading').length;
    const skipped = this.items.filter(i => i.status === 'skipped' || i.status === 'cancelled').length;
    const total = this.items.length;
    
    const progress = total > 0 ? ((completed + failed + skipped) / total) * 100 : 0;
    
    return {
      status: this.status,
      total,
      completed,
      failed,
      pending,
      skipped,
      progress,
      items: [...this.items],
      speedStats: this.calculateSpeed(),
      totalBytes: this.totalBytes,
      uploadedBytes: this.totalUploadedBytes,
    };
  }
  
  /**
   * Start speed tracking interval
   */
  private startSpeedTracking(): void {
    this.stopSpeedTracking();
    this.speedUpdateInterval = setInterval(() => {
      const stats = this.calculateSpeed();
      this.config.onSpeedUpdate?.(stats);
    }, 1000);
  }
  
  /**
   * Stop speed tracking interval
   */
  private stopSpeedTracking(): void {
    if (this.speedUpdateInterval) {
      clearInterval(this.speedUpdateInterval);
      this.speedUpdateInterval = null;
    }
  }
  
  /**
   * Calculate current upload speed and ETA
   */
  private calculateSpeed(): SpeedStats {
    const now = Date.now();
    const windowMs = 5000; // 5 second window for averaging
    
    // Remove old samples
    this.speedSamples = this.speedSamples.filter(s => now - s.timestamp < windowMs);
    
    if (this.speedSamples.length < 2) {
      return {
        bytesPerSecond: 0,
        etaSeconds: 0,
        lastSamples: this.speedSamples,
      };
    }
    
    // Calculate speed from samples
    const oldest = this.speedSamples[0];
    const newest = this.speedSamples[this.speedSamples.length - 1];
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000;
    const bytesDiff = newest.bytes - oldest.bytes;
    
    const bytesPerSecond = timeDiff > 0 ? bytesDiff / timeDiff : 0;
    const remainingBytes = this.totalBytes - this.totalUploadedBytes;
    const etaSeconds = bytesPerSecond > 0 ? remainingBytes / bytesPerSecond : 0;
    
    return {
      bytesPerSecond,
      etaSeconds,
      lastSamples: this.speedSamples,
    };
  }
  
  /**
   * Add speed sample
   */
  private addSpeedSample(): void {
    this.speedSamples.push({
      timestamp: Date.now(),
      bytes: this.totalUploadedBytes,
    });
  }
  
  /**
   * Process the upload queue
   */
  private async processQueue(): Promise<void> {
    while (this.status === 'running') {
      // Find next pending item
      const pendingItems = this.items.filter(i => i.status === 'pending');
      
      if (pendingItems.length === 0 && this.activeUploads === 0) {
        // Queue is complete
        this.status = 'completed';
        this.stopSpeedTracking();
        this.config.onStatusChange?.(this.status);
        this.config.onQueueComplete?.(this.items);
        
        // Update session status
        await this.updateSessionStatus('completed');
        return;
      }
      
      // Check if we can start more uploads
      if (this.activeUploads >= this.config.maxConcurrent || pendingItems.length === 0) {
        await this.delay(100);
        continue;
      }
      
      // Start next upload
      const item = pendingItems[0];
      this.uploadItem(item);
      
      // Apply minimum delay between starting uploads
      await this.delay(this.config.minDelayMs);
    }
  }
  
  /**
   * Upload a single item
   */
  private async uploadItem(item: UploadItem): Promise<void> {
    this.activeUploads++;
    item.status = 'uploading';
    
    try {
      // Update database item status
      await this.updateDbItemStatus(item);
      
      // Upload to storage
      const storagePath = await this.uploadToStorage(item);
      
      if (!storagePath) {
        throw new Error('Upload failed - no storage path returned');
      }
      
      // Create database record
      const recordId = await this.createDatabaseRecord(item, storagePath);
      
      // Update item
      item.status = 'uploaded';
      item.progress = 100;
      
      // Track uploaded bytes
      this.totalUploadedBytes += item.fileSize;
      this.addSpeedSample();
      
      if (item.category === 'document') {
        item.documentId = recordId;
      } else if (item.category === 'audio') {
        item.recordingId = recordId;
      } else {
        item.mediaId = recordId;
      }
      
      // Update database item
      await this.updateDbItemStatus(item);
      
      // Queue for analysis if enabled
      if (this.autoAnalyze && (item.category === 'image' || item.category === 'video')) {
        await this.queueForAnalysis(item);
      }
      
      this.config.onItemComplete?.(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      item.retryCount++;
      
      if (item.retryCount >= this.config.maxRetries) {
        item.status = 'failed';
        item.error = message;
        await this.updateDbItemStatus(item);
        this.config.onItemFailed?.(item);
      } else {
        // Retry with delay
        item.status = 'pending';
        item.error = `Retry ${item.retryCount}/${this.config.maxRetries}: ${message}`;
        await this.delay(this.config.retryDelayMs * item.retryCount);
      }
    } finally {
      this.activeUploads--;
      this.config.onProgress?.(item);
    }
  }
  
  /**
   * Upload file to Supabase storage
   */
  private async uploadToStorage(item: UploadItem): Promise<string> {
    const { data, error } = await supabase.storage
      .from(item.bucket)
      .upload(item.storagePath, item.file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw new Error(`Storage error: ${error.message}`);
    }
    
    return data.path;
  }
  
  /**
   * Create database record for uploaded file
   */
  private async createDatabaseRecord(item: UploadItem, storagePath: string): Promise<string> {
    const table = getDatabaseTable(item.category);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(item.bucket)
      .getPublicUrl(storagePath);
    
    if (table === 'media') {
      const mediaType = getMediaType(item.category);
      
       const { data, error } = await supabase
        .from('media')
        .insert({
          user_id: this.userId!,
          profile_id: this.profileId,
          file_url: urlData.publicUrl,
          storage_path: storagePath,
          file_size: item.fileSize,
          mime_type: item.mimeType,
          caption: item.filename,
        })
        .select('id')
        .single();
      
      if (error) throw new Error(`Database error: ${error.message}`);
      return data.id;
    }
    
    if (table === 'documents') {
       const { data, error } = await supabase
        .from('documents')
        .insert([{
          user_id: this.userId!,
          profile_id: this.profileId,
          title: item.filename,
          document_type: 'other',
          file_url: urlData.publicUrl,
          storage_path: storagePath,
          file_size: item.fileSize,
        }])
        .select('id')
        .single();
      
      if (error) throw new Error(`Database error: ${error.message}`);
      return data.id;
    }
    
    if (table === 'meeting_recordings') {
      const { data, error } = await supabase
        .from('meeting_recordings')
        .insert({
          user_id: this.userId!,
          profile_id: this.profileId,
          title: item.filename,
          file_url: urlData.publicUrl,
          file_size: item.fileSize,
        })
        .select('id')
        .single();
      
      if (error) throw new Error(`Database error: ${error.message}`);
      return data.id;
    }
    
    throw new Error(`Unknown table: ${table}`);
  }
  
  /**
   * Update database item status
   */
  private async updateDbItemStatus(item: UploadItem): Promise<void> {
    if (!item.dbItemId || !this.sessionId) return;
    
    await supabase
      .from('bulk_upload_items')
      .update({
        status: item.status,
        progress: item.progress,
        retry_count: item.retryCount,
        error_message: item.error,
        media_id: item.mediaId,
        document_id: item.documentId,
        recording_id: item.recordingId,
        storage_path: item.storagePath,
        storage_bucket: item.bucket,
        started_at: item.status === 'uploading' ? new Date().toISOString() : undefined,
        completed_at: item.status === 'uploaded' ? new Date().toISOString() : undefined,
      })
      .eq('id', item.dbItemId);
  }
  
  /**
   * Update session status
   */
  private async updateSessionStatus(status: string): Promise<void> {
    if (!this.sessionId) return;
    
    await supabase
      .from('bulk_upload_sessions')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      })
      .eq('id', this.sessionId);
  }
  
  /**
   * Queue item for AI analysis
   */
  private async queueForAnalysis(item: UploadItem): Promise<void> {
    if (!item.mediaId || !this.userId) return;
    
    await supabase
      .from('enrichment_queue')
      .insert({
        user_id: this.userId,
        profile_id: this.profileId,
        enrichment_type: 'media_analysis',
        source_type: 'media',
        source_id: item.mediaId,
        priority: 3, // Lower priority for bulk uploads
        status: 'pending',
      });
    
    // Update item as queued
    if (item.dbItemId) {
      await supabase
        .from('bulk_upload_items')
        .update({ queued_for_analysis: true })
        .eq('id', item.dbItemId);
    }
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a new upload queue instance
 */
export function createUploadQueue(config?: Partial<QueueConfig>): BulkUploadQueue {
  return new BulkUploadQueue(config);
}