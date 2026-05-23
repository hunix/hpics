import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, Upload, CheckCircle2, Loader2, Music,
  Volume2, Brain, HeartPulse, Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface VoiceAdvancedEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: {
    speakerProfile?: any;
    emotionalBaseline?: any;
    deceptionBaseline?: any;
  };
  sampleCount: number;
}

export function VoiceAdvancedEnrollment({ 
  profileId, 
  profileName,
  currentData,
  sampleCount
}: VoiceAdvancedEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAudio, setSelectedAudio] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState<'standard' | 'premium'>('standard');

  const { data: voiceNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['contact-voice-notes-for-advanced', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('voice_notes')
        .select('id, title, storage_path, transcription, duration_seconds, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const { data: audioMedia = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['contact-audio-for-voice', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, mime_type, storage_path, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .in('mime_type', ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const extractMutation = useMutation({
    mutationFn: async (audioUrls: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-voice-advanced', { 
          profileId, 
          audioUrls,
          model: model === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash'
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      queryClient.invalidateQueries({ queryKey: ['biometric-samples', profileId] });
      toast.success('Advanced voice profile built');
      setSelectedAudio([]);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleEnrollSelected = async () => {
    if (selectedAudio.length === 0) {
      toast.error('Select at least one audio file');
      return;
    }

    setProcessing(true);
    try {
      const urls: string[] = [];
      for (const id of selectedAudio) {
        // Check if it's a voice note or media
        const voiceNote = voiceNotes.find(v => v.id === id);
        if (voiceNote?.storage_path) {
          const { data } = await supabase.storage
            .from('recordings')
            .createSignedUrl(voiceNote.storage_path, 3600);
          if (data?.signedUrl) urls.push(data.signedUrl);
        } else {
          const media = audioMedia.find(m => m.id === id);
          if (media?.storage_path) {
            const { data } = await supabase.storage
              .from('media')
              .createSignedUrl(media.storage_path, 3600);
            if (data?.signedUrl) urls.push(data.signedUrl);
          }
        }
      }

      if (urls.length === 0) {
        toast.error('Could not get audio URLs');
        return;
      }

      await extractMutation.mutateAsync(urls);
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedAudio(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Current Voice Profile */}
      {currentData.speakerProfile && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Current Voice Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentData.speakerProfile.pitch_range && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{currentData.speakerProfile.pitch_range}</p>
                  <p className="text-xs text-muted-foreground">Pitch Range</p>
                </div>
              )}
              {currentData.speakerProfile.speaking_pace && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="font-medium">{currentData.speakerProfile.speaking_pace}</p>
                  <p className="text-xs text-muted-foreground">Speaking Pace</p>
                </div>
              )}
              {currentData.emotionalBaseline && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <HeartPulse className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Emotional Baseline</p>
                  <Badge variant="secondary" className="mt-1">Captured</Badge>
                </div>
              )}
              {currentData.deceptionBaseline && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Brain className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Deception Baseline</p>
                  <Badge variant="secondary" className="mt-1">Captured</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">For Best Voice Signature</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Select audio with ONLY this contact's voice</li>
            <li>• Longer recordings (5+ minutes total) give better results</li>
            <li>• Include various emotional states if available</li>
            <li>• Clear audio without background noise is best</li>
          </ul>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <div className="flex gap-2">
        <Button 
          variant={model === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('standard')}
        >
          Standard
        </Button>
        <Button 
          variant={model === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('premium')}
          className="gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Premium (Best)
        </Button>
      </div>

      {/* Voice Notes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Voice Notes ({voiceNotes.length})</h4>
        </div>
        
        {loadingNotes ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : voiceNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No voice notes found</p>
        ) : (
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {voiceNotes.map(note => (
                <Card 
                  key={note.id}
                  className={`cursor-pointer transition-colors ${selectedAudio.includes(note.id) ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                  onClick={() => toggleSelection(note.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedAudio.includes(note.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Mic className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{note.title || 'Untitled'}</p>
                        {note.duration_seconds && (
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(note.duration_seconds)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Audio Media */}
      <div>
        <h4 className="font-medium mb-3">Audio Files ({audioMedia.length})</h4>
        
        {loadingMedia ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : audioMedia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audio files found</p>
        ) : (
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {audioMedia.map(media => (
                <Card 
                  key={media.id}
                  className={`cursor-pointer transition-colors ${selectedAudio.includes(media.id) ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                  onClick={() => toggleSelection(media.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {selectedAudio.includes(media.id) ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Music className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="font-medium text-sm truncate">
                      {media.storage_path?.split('/').pop() || 'Audio file'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Analyze Button */}
      {selectedAudio.length > 0 && (
        <Button 
          onClick={handleEnrollSelected}
          disabled={processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Building Voice Profile...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Analyze {selectedAudio.length} Audio Files
            </>
          )}
        </Button>
      )}
    </div>
  );
}
