import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, 
  Mic, 
  Upload, 
  Image as ImageIcon, 
  Music,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  useExtractFacialBiometrics,
  useExtractVoiceBiometrics 
} from '@/hooks/useBiometricMatching';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface MediaCardProps {
  id: string;
  fileName: string;
  storagePath: string | null;
  isProcessing: boolean;
  disabled: boolean;
  onSelect: () => void;
  type: 'image' | 'audio';
}

function MediaCard({ id, fileName, storagePath, isProcessing, disabled, onSelect, type }: MediaCardProps) {
  const { signedUrl } = useSignedUrl({ bucket: 'media', path: storagePath });

  return (
    <Card 
      className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${isProcessing ? 'ring-2 ring-primary opacity-50' : ''} ${disabled && !isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-0 aspect-square relative overflow-hidden rounded-lg">
        {type === 'image' && signedUrl ? (
          <img 
            src={signedUrl}
            alt={fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-xs text-white truncate">{fileName}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface BiometricEnrollmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  enrollmentType: 'face' | 'voice';
}

interface MediaItem {
  id: string;
  file_url: string | null;
  mime_type: string | null;
  storage_path: string | null;
  created_at: string;
}

interface VoiceNoteItem {
  id: string;
  title: string | null;
  storage_path: string | null;
  transcription: string | null;
  created_at: string;
}

export function BiometricEnrollment({
  open,
  onOpenChange,
  profileId,
  profileName,
  enrollmentType
}: BiometricEnrollmentProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'existing' | 'upload'>('existing');
  const [uploadUrl, setUploadUrl] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const extractFacial = useExtractFacialBiometrics();
  const extractVoice = useExtractVoiceBiometrics();

  const isProcessing = extractFacial.isPending || extractVoice.isPending;

  // Fetch existing media for the contact
  const { data: existingMedia = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['contact-media-for-biometrics', profileId, enrollmentType, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const mimeFilter = enrollmentType === 'face' 
        ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        : ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];

      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, mime_type, storage_path, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .in('mime_type', mimeFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as MediaItem[];
    },
    enabled: !!user && !!profileId && open
  });

  // Fetch voice notes for voice enrollment
  const { data: voiceNotes = [], isLoading: loadingVoiceNotes } = useQuery({
    queryKey: ['contact-voice-notes-for-biometrics', profileId, user?.id],
    queryFn: async () => {
      if (!user || enrollmentType !== 'voice') return [];

      const { data, error } = await supabase
        .from('voice_notes')
        .select('id, title, storage_path, transcription, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as VoiceNoteItem[];
    },
    enabled: !!user && !!profileId && open && enrollmentType === 'voice'
  });

  const handleEnrollFromMedia = async (mediaId: string, storagePath: string | null) => {
    if (!storagePath) return;
    setProcessingId(mediaId);
    
    try {
      // Get signed URL
      const { data: signedData } = await supabase.storage
        .from('media')
        .createSignedUrl(storagePath, 3600);

      if (!signedData?.signedUrl) {
        throw new Error('Failed to get media URL');
      }

      if (enrollmentType === 'face') {
        await extractFacial.mutateAsync({
          imageUrl: signedData.signedUrl,
          profileId,
          sourceType: 'media',
          sourceId: mediaId
        });
      } else {
        await extractVoice.mutateAsync({
          audioUrl: signedData.signedUrl,
          profileId,
          sourceType: 'media',
          sourceId: mediaId
        });
      }

      onOpenChange(false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEnrollFromVoiceNote = async (voiceNoteId: string, storagePath: string | null, transcription?: string | null) => {
    if (!storagePath) return;
    setProcessingId(voiceNoteId);
    
    try {
      const { data: signedData } = await supabase.storage
        .from('recordings')
        .createSignedUrl(storagePath, 3600);

      if (!signedData?.signedUrl) {
        throw new Error('Failed to get audio URL');
      }

      await extractVoice.mutateAsync({
        audioUrl: signedData.signedUrl,
        profileId,
        sourceType: 'voice_note',
        sourceId: voiceNoteId,
        transcription: transcription || undefined
      });

      onOpenChange(false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEnrollFromUrl = async () => {
    if (!uploadUrl.trim()) return;

    setProcessingId('url');
    
    try {
      if (enrollmentType === 'face') {
        await extractFacial.mutateAsync({
          imageUrl: uploadUrl,
          profileId,
          sourceType: 'external_url'
        });
      } else {
        await extractVoice.mutateAsync({
          audioUrl: uploadUrl,
          profileId,
          sourceType: 'external_url'
        });
      }

      setUploadUrl('');
      onOpenChange(false);
    } finally {
      setProcessingId(null);
    }
  };

  const getFileName = (media: MediaItem) => {
    if (media.file_url) {
      try {
        const url = new URL(media.file_url);
        return url.pathname.split('/').pop() || 'Unknown file';
      } catch {
        return media.file_url.split('/').pop() || 'Unknown file';
      }
    }
    return 'Unknown file';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {enrollmentType === 'face' ? (
              <Camera className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            Enroll {enrollmentType === 'face' ? 'Facial' : 'Voice'} Biometrics
          </DialogTitle>
          <DialogDescription>
            Select or upload a {enrollmentType === 'face' ? 'photo' : 'audio file'} to enroll 
            biometric data for {profileName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existing' | 'upload')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">
              {enrollmentType === 'face' ? 'Existing Photos' : 'Existing Audio'}
            </TabsTrigger>
            <TabsTrigger value="upload">
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px]">
              {enrollmentType === 'face' ? (
                loadingMedia ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : existingMedia.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No photos found for this contact</p>
                    <p className="text-sm">Upload photos in the Media tab first</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 p-1">
                    {existingMedia.map(media => (
                      <MediaCard
                        key={media.id}
                        id={media.id}
                        fileName={getFileName(media)}
                        storagePath={media.storage_path}
                        isProcessing={processingId === media.id}
                        disabled={isProcessing}
                        onSelect={() => handleEnrollFromMedia(media.id, media.storage_path)}
                        type="image"
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {/* Voice Notes */}
                  <div>
                    <h4 className="font-medium mb-2">Voice Notes</h4>
                    {loadingVoiceNotes ? (
                      <div className="flex items-center justify-center h-16">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : voiceNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No voice notes found</p>
                    ) : (
                      <div className="space-y-2">
                        {voiceNotes.map(note => (
                          <Card 
                            key={note.id}
                            className={`cursor-pointer transition-colors hover:bg-accent ${processingId === note.id ? 'opacity-50' : ''}`}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Mic className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{note.title || 'Untitled'}</p>
                                  {note.transcription && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                      {note.transcription}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleEnrollFromVoiceNote(note.id, note.storage_path, note.transcription)}
                                disabled={isProcessing || !note.storage_path}
                              >
                                {processingId === note.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Enroll'
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio Media */}
                  <div>
                    <h4 className="font-medium mb-2">Audio Files</h4>
                    {loadingMedia ? (
                      <div className="flex items-center justify-center h-16">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : existingMedia.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No audio files found</p>
                    ) : (
                      <div className="space-y-2">
                        {existingMedia.map(media => (
                          <Card 
                            key={media.id}
                            className={`cursor-pointer transition-colors hover:bg-accent ${processingId === media.id ? 'opacity-50' : ''}`}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Music className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium text-sm">{getFileName(media)}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleEnrollFromMedia(media.id, media.storage_path)}
                                disabled={isProcessing || !media.storage_path}
                              >
                                {processingId === media.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Enroll'
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="media-url">
                {enrollmentType === 'face' ? 'Image URL' : 'Audio URL'}
              </Label>
              <Input
                id="media-url"
                placeholder={enrollmentType === 'face' 
                  ? 'https://example.com/photo.jpg' 
                  : 'https://example.com/audio.mp3'
                }
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct URL to a {enrollmentType === 'face' ? 'photo' : 'audio file'}
              </p>
            </div>

            <Button 
              onClick={handleEnrollFromUrl}
              disabled={!uploadUrl.trim() || isProcessing}
              className="w-full"
            >
              {processingId === 'url' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enroll from URL
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
