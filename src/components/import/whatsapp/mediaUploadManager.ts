import { supabase } from '@/integrations/supabase/client';
import type { MediaFileState } from './types';
import type { ExtractedFile } from './whatsappZipProcessor';
import { getMimeType } from './whatsappMediaParser';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_FILE_SIZE_MB = 50;
const BATCH_SIZE = 3;

export interface UploadResult {
  filename: string;
  success: boolean;
  mediaId?: string;
  error?: string;
}

export async function uploadMediaFile(
  file: ExtractedFile,
  userId: string,
  conversationId: string,
  profileId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      filename: file.name,
      success: false,
      error: `File too large (${fileSizeMB.toFixed(1)}MB > ${MAX_FILE_SIZE_MB}MB limit)`,
    };
  }

  const storagePath = `${userId}/whatsapp/${conversationId}/${file.name}`;
  const mimeType = getMimeType(file.name);

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file.blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      // Create media record
      const { data: mediaRecord, error: mediaError } = await supabase
        .from('media')
        .insert({
          user_id: userId,
          profile_id: profileId,
          file_url: urlData.publicUrl,
          storage_path: storagePath,
          media_type: file.type || 'document',
          file_size: file.size,
          caption: file.name,
        })
        .select('id')
        .single();

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      onProgress?.(100);
      
      return {
        filename: file.name,
        success: true,
        mediaId: mediaRecord.id,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Upload failed';
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1))
        );
        onProgress?.(Math.round((attempt / MAX_RETRIES) * 50));
      }
    }
  }

  return {
    filename: file.name,
    success: false,
    error: lastError || 'Upload failed after retries',
  };
}

export async function uploadMediaBatch(
  files: ExtractedFile[],
  userId: string,
  conversationId: string,
  profileId: string,
  onFileProgress?: (filename: string, progress: number) => void,
  onFileComplete?: (result: UploadResult) => void,
  shouldContinue?: () => boolean
): Promise<Map<string, string>> {
  const mediaIdMap = new Map<string, string>();
  
  // Process in batches
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    if (shouldContinue && !shouldContinue()) {
      break; // Paused or cancelled
    }

    const batch = files.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(
      batch.map(file =>
        uploadMediaFile(
          file,
          userId,
          conversationId,
          profileId,
          progress => onFileProgress?.(file.name, progress)
        )
      )
    );

    for (const result of results) {
      if (result.success && result.mediaId) {
        mediaIdMap.set(result.filename.toLowerCase(), result.mediaId);
      }
      onFileComplete?.(result);
    }
  }

  return mediaIdMap;
}

export function createInitialMediaState(files: ExtractedFile[]): MediaFileState[] {
  return files.map(file => ({
    filename: file.name,
    status: 'pending' as const,
    attempts: 0,
    size: file.size,
    type: file.type,
    blob: file.blob,
  }));
}

export function updateMediaState(
  state: MediaFileState[],
  filename: string,
  update: Partial<MediaFileState>
): MediaFileState[] {
  return state.map(file =>
    file.filename === filename ? { ...file, ...update } : file
  );
}
