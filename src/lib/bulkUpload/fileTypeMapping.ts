/**
 * File Type Mapping Configuration
 * Maps file extensions and MIME types to storage buckets and database tables
 */

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface FileTypeConfig {
  extensions: string[];
  mimePatterns: string[];
  bucket: string;
  table: 'media' | 'documents' | 'meeting_recordings';
  maxSizeMB: number;
  icon: string;
}

export const FILE_TYPE_CONFIG: Record<FileCategory, FileTypeConfig> = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'svg'],
    mimePatterns: ['image/'],
    bucket: 'media',
    table: 'media',
    maxSizeMB: 50,
    icon: 'Image',
  },
  video: {
    extensions: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', 'wmv', 'flv', '3gp'],
    mimePatterns: ['video/'],
    bucket: 'media',
    table: 'media',
    maxSizeMB: 500,
    icon: 'Video',
  },
  audio: {
    extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma', 'opus', 'webm'],
    mimePatterns: ['audio/'],
    bucket: 'recordings',
    table: 'meeting_recordings',
    maxSizeMB: 200,
    icon: 'Music',
  },
  document: {
    extensions: [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'md',
      'json', 'xml', 'html', 'epub'
    ],
    mimePatterns: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats',
      'application/vnd.ms-',
      'application/vnd.oasis',
      'text/',
    ],
    bucket: 'documents',
    table: 'documents',
    maxSizeMB: 100,
    icon: 'FileText',
  },
  other: {
    extensions: [],
    mimePatterns: [],
    bucket: 'media',
    table: 'media',
    maxSizeMB: 50,
    icon: 'File',
  },
};

/**
 * Get file category from filename or MIME type
 */
export function getFileCategory(filename: string, mimeType?: string): FileCategory {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Check by extension first
  for (const [category, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(extension)) {
      return category as FileCategory;
    }
  }
  
  // Check by MIME type
  if (mimeType) {
    for (const [category, config] of Object.entries(FILE_TYPE_CONFIG)) {
      if (config.mimePatterns.some(pattern => mimeType.startsWith(pattern))) {
        return category as FileCategory;
      }
    }
  }
  
  return 'other';
}

/**
 * Get storage bucket for file
 */
export function getStorageBucket(category: FileCategory): string {
  return FILE_TYPE_CONFIG[category].bucket;
}

/**
 * Get database table for file
 */
export function getDatabaseTable(category: FileCategory): string {
  return FILE_TYPE_CONFIG[category].table;
}

/**
 * Get max file size in bytes
 */
export function getMaxFileSize(category: FileCategory): number {
  return FILE_TYPE_CONFIG[category].maxSizeMB * 1024 * 1024;
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(filename: string, mimeType?: string): boolean {
  const category = getFileCategory(filename, mimeType);
  return category !== 'other' || FILE_TYPE_CONFIG.other.extensions.length > 0;
}

/**
 * Get icon name for file category
 */
export function getFileIcon(category: FileCategory): string {
  return FILE_TYPE_CONFIG[category].icon;
}

/**
 * Get media type for database (image, video, audio)
 */
export function getMediaType(category: FileCategory): 'image' | 'video' | 'audio' | null {
  if (category === 'image' || category === 'video' || category === 'audio') {
    return category;
  }
  return null;
}
