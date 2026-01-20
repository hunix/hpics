/**
 * Bulk Upload System
 * Enterprise-grade bulk upload with pause/resume, retry, and AI analysis queuing
 * 
 * IMPORTANT: Uses explicit named exports for IDE performance optimization.
 */

// File Type Mapping
export {
  type FileCategory,
  type FileTypeConfig,
  FILE_TYPE_CONFIG,
  getFileCategory,
  getStorageBucket,
  getDatabaseTable,
  getMaxFileSize,
  isFileTypeSupported,
  getFileIcon,
  getMediaType,
} from './fileTypeMapping';

// Bulk File Processor
export {
  type ProcessedFile,
  type ProcessingOptions,
  generateStoragePath,
  validateFile,
  calculateContentHash,
  processFile,
  processFiles,
  detectDuplicatesInBatch,
  checkExistingDuplicates,
  sortBySize,
  sortByTypePriority,
  getBatchStats,
  formatFileSize,
} from './bulkFileProcessor';

// ZIP Extractor
export {
  type ExtractedZipFile,
  type ZipExtractionResult,
  type ExtractionOptions,
  extractZipFile,
  previewZipContents,
  extractedFilesToFiles,
  getOriginalPaths,
} from './zipExtractor';

// Upload Queue
export {
  type UploadStatus,
  type UploadItem,
  type SpeedStats,
  type QueueConfig,
  type QueueStatus,
  BulkUploadQueue,
} from './uploadQueue';
