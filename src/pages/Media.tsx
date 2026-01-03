import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Image as ImageIcon, Images, Trash2, Mic, Play, FileAudio, FolderOpen, Clock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MediaUpload } from '@/components/uploads/MediaUpload';
import { RecordingUpload } from '@/components/recordings/RecordingUpload';
import type { Tables } from '@/integrations/supabase/types';

type Media = Tables<'media'> & {
  profiles: { first_name: string; last_name: string | null } | null;
};

type Recording = Tables<'meeting_recordings'> & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export default function MediaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRecordingUploadOpen, setIsRecordingUploadOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['media', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });

  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_recordings')
        .select('*, profiles(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Recording[];
    },
    enabled: !!user,
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast({ title: 'Media deleted' });
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_recordings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast({ title: 'Recording deleted' });
    },
  });

  const folders = ['all', 'meetings', 'general', 'interviews', 'screenings'];
  
  const filteredRecordings = recordings?.filter(r => 
    selectedFolder === 'all' || r.folder === selectedFolder
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Transcribed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout title="Media & Recordings">
      <Tabs defaultValue="media" className="space-y-6">
        <TabsList>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media Gallery
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Recordings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Photos and images related to your contacts
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </div>

          {mediaLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : media && media.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {media.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-square bg-muted relative">
                    {item.thumbnail_url || item.file_url ? (
                      <img 
                        src={item.thumbnail_url || item.file_url} 
                        alt={item.caption || ''} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm('Delete this image?')) {
                          deleteMediaMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    {item.caption && (
                      <p className="text-sm font-medium truncate">{item.caption}</p>
                    )}
                    {item.profiles && (
                      <p className="text-xs text-muted-foreground">
                        {item.profiles.first_name} {item.profiles.last_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'PP')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Images className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No media yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload photos and images to build a visual memory of your relationships.
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Image
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recordings" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                Meeting recordings and transcriptions
              </p>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-40">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder.charAt(0).toUpperCase() + folder.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsRecordingUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Recording
            </Button>
          </div>

          {recordingsLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRecordings && filteredRecordings.length > 0 ? (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <Card key={recording.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                        <FileAudio className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{recording.title}</h4>
                          {getStatusBadge(recording.status)}
                          <Badge variant="outline" className="text-xs capitalize">
                            {recording.folder}
                          </Badge>
                        </div>
                        {recording.description && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {recording.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {recording.profiles && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {recording.profiles.first_name} {recording.profiles.last_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(recording.duration_seconds)}
                          </span>
                          <span>{format(new Date(recording.created_at), 'PP')}</span>
                        </div>
                        {recording.transcription && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                            "{recording.transcription.slice(0, 200)}..."
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={recording.file_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this recording?')) {
                              deleteRecordingMutation.mutate(recording.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload meeting recordings from your DJI Mic or other devices to have them transcribed.
                </p>
                <Button onClick={() => setIsRecordingUploadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Recording
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <MediaUpload open={isUploadOpen} onOpenChange={setIsUploadOpen} />
      <RecordingUpload open={isRecordingUploadOpen} onOpenChange={setIsRecordingUploadOpen} />
    </AppLayout>
  );
}
