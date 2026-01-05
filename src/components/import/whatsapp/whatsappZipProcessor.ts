import JSZip from 'jszip';
import { getMediaType, type MediaReference } from './whatsappMediaParser';

export interface ExtractedFile {
  name: string;
  blob: Blob;
  type: MediaReference['type'] | null;
  size: number;
}

export interface ZipContents {
  chatText: string;
  chatFileName: string;
  mediaFiles: ExtractedFile[];
  totalSize: number;
}

export interface MediaStats {
  images: number;
  videos: number;
  audio: number;
  documents: number;
  stickers: number;
  total: number;
  totalSize: number;
}

export async function processWhatsAppZip(file: File): Promise<ZipContents> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  let chatText = '';
  let chatFileName = '';
  const mediaFiles: ExtractedFile[] = [];
  let totalSize = 0;

  // Process all files in the ZIP
  const filePromises: Promise<void>[] = [];

  contents.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    
    const fileName = relativePath.split('/').pop() || relativePath;
    
    // Check if it's the chat file
    if (fileName.endsWith('.txt') && (fileName.includes('_chat') || fileName.includes('WhatsApp Chat'))) {
      filePromises.push(
        zipEntry.async('string').then(text => {
          chatText = text;
          chatFileName = fileName;
        })
      );
    } else if (fileName.endsWith('.txt') && !chatText) {
      // Fallback: use first .txt file found
      filePromises.push(
        zipEntry.async('string').then(text => {
          if (!chatText) {
            chatText = text;
            chatFileName = fileName;
          }
        })
      );
    } else {
      // Media file
      const mediaType = getMediaType(fileName);
      if (mediaType) {
        filePromises.push(
          zipEntry.async('blob').then(blob => {
            mediaFiles.push({
              name: fileName,
              blob,
              type: mediaType,
              size: blob.size,
            });
            totalSize += blob.size;
          })
        );
      }
    }
  });

  await Promise.all(filePromises);

  // Sort media files by name for consistent ordering
  mediaFiles.sort((a, b) => a.name.localeCompare(b.name));

  return {
    chatText,
    chatFileName,
    mediaFiles,
    totalSize,
  };
}

export function getMediaStats(mediaFiles: ExtractedFile[]): MediaStats {
  const stats: MediaStats = {
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    stickers: 0,
    total: mediaFiles.length,
    totalSize: 0,
  };

  for (const file of mediaFiles) {
    stats.totalSize += file.size;
    switch (file.type) {
      case 'image':
        stats.images++;
        break;
      case 'video':
        stats.videos++;
        break;
      case 'audio':
        stats.audio++;
        break;
      case 'document':
        stats.documents++;
        break;
      case 'sticker':
        stats.stickers++;
        break;
    }
  }

  return stats;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function createMediaLookup(mediaFiles: ExtractedFile[]): Map<string, ExtractedFile> {
  const lookup = new Map<string, ExtractedFile>();
  for (const file of mediaFiles) {
    lookup.set(file.name.toLowerCase(), file);
  }
  return lookup;
}
