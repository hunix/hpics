/**
 * Bulk File Processor
 * Handles file categorization, validation, path generation, and duplicate detection
 */

import { getFileCategory, getStorageBucket, getMaxFileSize, type FileCategory } from './fileTypeMapping';

export interface ProcessedFile {
  id: string;
  file: File;
  filename: string;
  originalPath?: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  bucket: string;
  storagePath: string;
  contentHash?: string;
  sortOrder: number;
  isValid: boolean;
  validationError?: string;
}

export interface ProcessingOptions {
  userId: string;
  profileId?: string;
  preserveFolderStructure?: boolean;
  generateHashes?: boolean;
}

/**
 * Generate a unique ID for tracking
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate storage path for a file
 */
export function generateStoragePath(
  userId: string,
  filename: string,
  category: FileCategory,
  profileId?: string,
  originalPath?: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  
  // Sanitize filename
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  
  // Create unique filename with timestamp
  const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
  
  // Build path based on whether linked to a contact
  if (profileId) {
    return `${userId}/${profileId}/${year}/${month}/${uniqueFilename}`;
  }
  
  // Default path without contact
  return `${userId}/${category}/${year}/${month}/${uniqueFilename}`;
}

/**
 * Validate a single file
 */
export function validateFile(
  file: File,
  category: FileCategory
): { isValid: boolean; error?: string } {
  const maxSize = getMaxFileSize(category);
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum ${maxSizeMB}MB for ${category} files`,
    };
  }
  
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }
  
  return { isValid: true };
}

/**
 * Calculate content hash for duplicate detection
 */
export async function calculateContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Process a single file for upload
 */
export async function processFile(
  file: File,
  options: ProcessingOptions,
  sortOrder: number,
  originalPath?: string
): Promise<ProcessedFile> {
  const category = getFileCategory(file.name, file.type);
  const bucket = getStorageBucket(category);
  const storagePath = generateStoragePath(
    options.userId,
    file.name,
    category,
    options.profileId,
    originalPath
  );
  
  const validation = validateFile(file, category);
  
  let contentHash: string | undefined;
  if (options.generateHashes && validation.isValid) {
    try {
      contentHash = await calculateContentHash(file);
    } catch (e) {
      console.warn('Failed to calculate hash for', file.name, e);
    }
  }
  
  return {
    id: generateId(),
    file,
    filename: file.name,
    originalPath,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    category,
    bucket,
    storagePath,
    contentHash,
    sortOrder,
    isValid: validation.isValid,
    validationError: validation.error,
  };
}

/**
 * Process multiple files for upload
 */
export async function processFiles(
  files: File[],
  options: ProcessingOptions,
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const processed = await processFile(files[i], options, i);
    results.push(processed);
    onProgress?.(i + 1, files.length);
  }
  
  return results;
}

/**
 * Detect duplicates within a batch using content hash
 */
export function detectDuplicatesInBatch(
  files: ProcessedFile[]
): Map<string, ProcessedFile[]> {
  const hashGroups = new Map<string, ProcessedFile[]>();
  
  for (const file of files) {
    if (file.contentHash) {
      const existing = hashGroups.get(file.contentHash) || [];
      existing.push(file);
      hashGroups.set(file.contentHash, existing);
    }
  }
  
  // Return only groups with duplicates
  const duplicates = new Map<string, ProcessedFile[]>();
  for (const [hash, group] of hashGroups) {
    if (group.length > 1) {
      duplicates.set(hash, group);
    }
  }
  
  return duplicates;
}

/**
 * Check against existing files in database
 */
export async function checkExistingDuplicates(
  hashes: string[],
  userId: string,
  supabase: any
): Promise<Set<string>> {
  if (hashes.length === 0) return new Set();
  
  const { data } = await supabase
    .from('bulk_upload_items')
    .select('content_hash')
    .eq('user_id', userId)
    .eq('status', 'uploaded')
    .in('content_hash', hashes);
  
  return new Set((data || []).map((item: any) => item.content_hash));
}

/**
 * Sort files by size (smaller first) for optimal upload order
 */
export function sortBySize(files: ProcessedFile[]): ProcessedFile[] {
  return [...files].sort((a, b) => a.fileSize - b.fileSize);
}

/**
 * Sort files by type priority
 */
export function sortByTypePriority(files: ProcessedFile[]): ProcessedFile[] {
  const priority: Record<FileCategory, number> = {
    image: 1,
    document: 2,
    audio: 3,
    video: 4,
    other: 5,
  };
  
  return [...files].sort((a, b) => priority[a.category] - priority[b.category]);
}

/**
 * Get summary statistics for a batch of files
 */
export function getBatchStats(files: ProcessedFile[]): {
  totalFiles: number;
  totalBytes: number;
  byCategory: Record<FileCategory, { count: number; bytes: number }>;
  validFiles: number;
  invalidFiles: number;
} {
  const byCategory: Record<FileCategory, { count: number; bytes: number }> = {
    image: { count: 0, bytes: 0 },
    video: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    document: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 },
  };
  
  let validFiles = 0;
  let invalidFiles = 0;
  let totalBytes = 0;
  
  for (const file of files) {
    byCategory[file.category].count++;
    byCategory[file.category].bytes += file.fileSize;
    totalBytes += file.fileSize;
    
    if (file.isValid) {
      validFiles++;
    } else {
      invalidFiles++;
    }
  }
  
  return {
    totalFiles: files.length,
    totalBytes,
    byCategory,
    validFiles,
    invalidFiles,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
