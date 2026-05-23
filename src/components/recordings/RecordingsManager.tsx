import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RecordingUpload } from './RecordingUpload';
import { 
  Mic, Upload, Play, Pause, Trash2, FileText, Clock, 
  ChevronDown, Loader2, Users, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { invokeFunction } from '@/lib/api';

interface RecordingsManagerProps {
  profileId?: string;
  profileName?: string;
}

export function RecordingsManager({ profileId, profileName }: RecordingsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['contact-recordings', profileId],
    queryFn: async () => {
      let query = supabase
        .from('meeting_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meeting_recordings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] });
      toast({ title: 'Recording deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const retryTranscription = useMutation({
    mutationFn: async (recording: any) => {
      await supabase
        .from('meeting_recordings')
        .update({ status: 'processing' })
        .eq('id', recording.id);

      const { error } = await invokeFunction('transcribe-audio', { recordingId: recording.id, fileUrl: recording.file_url },);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] });
      toast({ title: 'Transcription started' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Transcribed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Recordings
          </CardTitle>
          <CardDescription>
            {profileName ? `Meeting recordings with ${profileName}` : 'All meeting recordings'}
          </CardDescription>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        {!recordings?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recordings yet</p>
            <p className="text-sm">Upload audio files from your DJI Mic 2</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {recordings.map((recording) => (
                <Collapsible
                  key={recording.id}
                  open={expandedId === recording.id}
                  onOpenChange={(open) => setExpandedId(open ? recording.id : null)}
                >
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{recording.title}</h4>
                          {getStatusBadge(recording.status || 'pending')}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(recording.duration_seconds)}
                          </span>
                          <span>{format(new Date(recording.created_at), 'MMM d, yyyy')}</span>
                          {recording.folder && (
                            <Badge variant="outline" className="text-xs">
                              {recording.folder}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {recording.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => retryTranscription.mutate(recording)}
                            disabled={retryTranscription.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (playingId === recording.id) {
                              setPlayingId(null);
                            } else {
                              setPlayingId(recording.id);
                            }
                          }}
                        >
                          {playingId === recording.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === recording.id ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this recording?')) {
                              deleteMutation.mutate(recording.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {playingId === recording.id && (
                      <audio
                        src={recording.file_url}
                        controls
                        autoPlay
                        className="w-full"
                        onEnded={() => setPlayingId(null)}
                      />
                    )}

                    <CollapsibleContent>
                      <div className="pt-3 border-t space-y-4">
                        {recording.description && (
                          <p className="text-sm text-muted-foreground">{recording.description}</p>
                        )}
                        
                        {recording.transcription ? (
                          <div className="space-y-2">
                            <h5 className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Transcription
                            </h5>
                            <ScrollArea className="h-[200px] border rounded p-3">
                              <p className="text-sm whitespace-pre-wrap">{recording.transcription}</p>
                            </ScrollArea>
                            
                            {/* Speaker Info */}
                            {recording.transcription_with_speakers && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {[...new Set((recording.transcription_with_speakers as any[]).map(w => w.speaker).filter(Boolean))].length} speakers detected
                                </span>
                              </div>
                            )}
                          </div>
                        ) : recording.status === 'processing' ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Transcription in progress...
                          </div>
                        ) : null}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}

        <RecordingUpload
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          profileId={profileId}
          profileName={profileName}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contact-recordings', profileId] })}
        />
      </CardContent>
    </Card>
  );
}
