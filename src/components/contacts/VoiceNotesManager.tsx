import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VoiceNotesManagerProps {
  profileId: string;
}

export function VoiceNotesManager({ profileId }: VoiceNotesManagerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();

  const { data: voiceNotes = [], isLoading } = useQuery({
    queryKey: ['voice-notes', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
      
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error('No recording to save');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${profileId}/${Date.now()}.webm`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      // Create voice note record
      const { data: voiceNote, error: dbError } = await supabase
        .from('voice_notes')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          title: title || `Voice Note - ${format(new Date(), 'MMM d, yyyy HH:mm')}`,
          file_url: urlData.publicUrl,
          storage_path: fileName,
          duration_seconds: recordingTime,
          file_size: audioBlob.size,
          transcription_status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger transcription
      await supabase.functions.invoke('transcribe-voice-note', {
        body: { voiceNoteId: voiceNote.id, audioUrl: urlData.publicUrl },
      });

      return voiceNote;
    },
    onSuccess: () => {
      toast.success('Voice note saved and transcription started');
      setAudioBlob(null);
      setTitle('');
      setRecordingTime(0);
      queryClient.invalidateQueries({ queryKey: ['voice-notes', profileId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const note = voiceNotes.find(n => n.id === noteId);
      
      if (note?.storage_path) {
        await supabase.storage.from('recordings').remove([note.storage_path]);
      }
      
      const { error } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Voice note deleted');
      queryClient.invalidateQueries({ queryKey: ['voice-notes', profileId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const playAudio = (url: string, noteId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (playingId === noteId) {
      setPlayingId(null);
      return;
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(noteId);
    
    audio.onended = () => setPlayingId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Transcribed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Notes
        </CardTitle>
        <CardDescription>Record voice memos with automatic transcription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording controls */}
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          {!isRecording && !audioBlob ? (
            <Button onClick={startRecording} size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          ) : isRecording ? (
            <>
              <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                <Square className="h-5 w-5" />
                Stop
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              </div>
            </>
          ) : audioBlob ? (
            <div className="flex-1 flex items-center gap-4">
              <Input
                placeholder="Note title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">{formatTime(recordingTime)}</span>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => { setAudioBlob(null); setRecordingTime(0); }}>
                Discard
              </Button>
            </div>
          ) : null}
        </div>

        {/* Voice notes list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : voiceNotes.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {voiceNotes.map((note: any) => (
                <div key={note.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{note.title}</h4>
                        {getStatusBadge(note.transcription_status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')} • {formatTime(note.duration_seconds || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => playAudio(note.file_url, note.id)}
                      >
                        {playingId === note.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(note.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {note.transcription && (
                    <div className="p-3 bg-muted rounded text-sm">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <FileText className="h-3 w-3" />
                        Transcription
                      </div>
                      <p>{note.transcription}</p>
                    </div>
                  )}
                  
                  {note.transcription_status === 'failed' && note.transcription_error && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {note.transcription_error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No voice notes yet</p>
            <p className="text-sm">Record your first voice memo above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
