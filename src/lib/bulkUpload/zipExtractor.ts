/**
 * ZIP File Extractor
 * Handles extraction of ZIP files with progress tracking and file filtering
 */

import JSZip from 'jszip';
import { getFileCategory, isFileTypeSupported, type FileCategory } from './fileTypeMapping';

export interface ExtractedZipFile {
  name: string;
  originalPath: string;
  blob: Blob;
  size: number;
  category: FileCategory;
  mimeType: string;
}

export interface ZipExtractionResult {
  files: ExtractedZipFile[];
  totalSize: number;
  skippedFiles: string[];
  folderStructure: Map<string, string[]>;
}

export interface ExtractionOptions {
  maxFiles?: number;
  maxTotalSize?: number;
  allowedCategories?: FileCategory[];
  skipHiddenFiles?: boolean;
  skipMacOSFiles?: boolean;
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  maxFiles: 1000,
  maxTotalSize: 5 * 1024 * 1024 * 1024, // 5GB
  skipHiddenFiles: true,
  skipMacOSFiles: true,
};

/**
 * Get MIME type from filename
 */
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    
    // Videos
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    md: 'text/markdown',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Check if file should be skipped
 */
function shouldSkipFile(
  relativePath: string,
  fileName: string,
  options: ExtractionOptions
): boolean {
  // Skip directories
  if (relativePath.endsWith('/')) {
    return true;
  }
  
  // Skip hidden files
  if (options.skipHiddenFiles && fileName.startsWith('.')) {
    return true;
  }
  
  // Skip macOS metadata files
  if (options.skipMacOSFiles) {
    if (relativePath.includes('__MACOSX/') || fileName === '.DS_Store') {
      return true;
    }
  }
  
  // Skip unsupported file types
  if (!isFileTypeSupported(fileName)) {
    return true;
  }
  
  return false;
}

/**
 * Extract files from a ZIP archive
 */
export async function extractZipFile(
  zipFile: File,
  options: ExtractionOptions = {},
  onProgress?: (progress: number, currentFile: string) => void
): Promise<ZipExtractionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const zip = new JSZip();
  
  // Load ZIP file
  const contents = await zip.loadAsync(zipFile);
  
  const files: ExtractedZipFile[] = [];
  const skippedFiles: string[] = [];
  const folderStructure = new Map<string, string[]>();
  let totalSize = 0;
  
  // Get all file entries
  const entries: [string, JSZip.JSZipObject][] = [];
  contents.forEach((relativePath, zipEntry) => {
    entries.push([relativePath, zipEntry]);
  });
  
  // Process files
  for (let i = 0; i < entries.length; i++) {
    const [relativePath, zipEntry] = entries[i];
    const fileName = relativePath.split('/').pop() || relativePath;
    
    // Report progress
    onProgress?.(((i + 1) / entries.length) * 100, fileName);
    
    // Check if directory
    if (zipEntry.dir) {
      continue;
    }
    
    // Check if should skip
    if (shouldSkipFile(relativePath, fileName, opts)) {
      skippedFiles.push(relativePath);
      continue;
    }
    
    // Check max files limit
    if (opts.maxFiles && files.length >= opts.maxFiles) {
      skippedFiles.push(relativePath);
      continue;
    }
    
    // Extract file
    const blob = await zipEntry.async('blob');
    const mimeType = getMimeTypeFromFilename(fileName);
    const category = getFileCategory(fileName, mimeType);
    
    // Check category filter
    if (opts.allowedCategories && !opts.allowedCategories.includes(category)) {
      skippedFiles.push(relativePath);
      continue;
    }
    
    // Check total size limit
    if (opts.maxTotalSize && totalSize + blob.size > opts.maxTotalSize) {
      skippedFiles.push(relativePath);
      continue;
    }
    
    totalSize += blob.size;
    
    // Track folder structure
    const folder = relativePath.substring(0, relativePath.lastIndexOf('/')) || '/';
    const folderFiles = folderStructure.get(folder) || [];
    folderFiles.push(fileName);
    folderStructure.set(folder, folderFiles);
    
    files.push({
      name: fileName,
      originalPath: relativePath,
      blob,
      size: blob.size,
      category,
      mimeType,
    });
  }
  
  return {
    files,
    totalSize,
    skippedFiles,
    folderStructure,
  };
}

/**
 * Preview ZIP contents without extracting
 */
export async function previewZipContents(
  zipFile: File,
  options: ExtractionOptions = {}
): Promise<{
  totalFiles: number;
  supportedFiles: number;
  totalSize: number;
  byCategory: Record<FileCategory, number>;
  folders: string[];
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const zip = new JSZip();
  
  const contents = await zip.loadAsync(zipFile);
  
  let totalFiles = 0;
  let supportedFiles = 0;
  const totalSize = 0;
  const byCategory: Record<FileCategory, number> = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    other: 0,
  };
  const folders = new Set<string>();
  
  contents.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) {
      folders.add(relativePath);
      return;
    }
    
    const fileName = relativePath.split('/').pop() || relativePath;
    
    if (shouldSkipFile(relativePath, fileName, opts)) {
      return;
    }
    
    totalFiles++;
    
    const category = getFileCategory(fileName);
    if (opts.allowedCategories && !opts.allowedCategories.includes(category)) {
      return;
    }
    
    supportedFiles++;
    byCategory[category]++;
  });
  
  return {
    totalFiles,
    supportedFiles,
    totalSize,
    byCategory,
    folders: Array.from(folders),
  };
}

/**
 * Convert extracted ZIP files to File objects for processing
 */
export function extractedFilesToFiles(extracted: ExtractedZipFile[]): File[] {
  return extracted.map(ef => 
    new File([ef.blob], ef.name, { type: ef.mimeType })
  );
}

/**
 * Get original paths for extracted files (for folder structure preservation)
 */
export function getOriginalPaths(extracted: ExtractedZipFile[]): Map<string, string> {
  const paths = new Map<string, string>();
  for (const file of extracted) {
    paths.set(file.name, file.originalPath);
  }
  return paths;
}
