import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from '@/lib/api';

export interface UploadedRecording {
  recordingId: string;
  publicUrl: string;
  transcribeError: unknown;
}

export interface UploadRecordingInput {
  userId: string;
  profileId?: string;
  file: File;
  title: string;
  description: string;
  folder: string;
  onProgress?: (pct: number) => void;
}

export async function uploadRecording({
  userId,
  profileId,
  file,
  title,
  description,
  folder,
  onProgress,
}: UploadRecordingInput): Promise<UploadedRecording> {
  onProgress?.(10);
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  onProgress?.(30);

  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  onProgress?.(60);

  const { data: { publicUrl } } = supabase.storage
    .from('recordings')
    .getPublicUrl(fileName);

  const { data: recording, error: insertError } = await supabase
    .from('meeting_recordings')
    .insert({
      user_id: userId,
      profile_id: profileId ?? null,
      title: title || file.name,
      description,
      folder,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending',
    })
    .select()
    .single();
  if (insertError || !recording) throw insertError ?? new Error('Insert failed');

  onProgress?.(80);

  const { error: transcribeError } = await invokeFunction('transcribe-audio', {
    recordingId: recording.id,
    fileUrl: publicUrl,
  });

  if (!transcribeError) onProgress?.(100);

  return { recordingId: recording.id, publicUrl, transcribeError };
}
