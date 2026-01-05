import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Image, Trash2, ExternalLink, Video, Music, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MediaItem {
  id: string;
  caption: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  storage_path: string | null;
  file_url: string;
}

interface MediaListViewProps {
  items: MediaItem[];
  getMediaUrl: (item: MediaItem) => string | null;
  onView: (id: string, url: string, mimeType: string | null) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function getMediaIcon(mimeType: string | null) {
  if (!mimeType) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
  return <Image className="h-4 w-4" />;
}

function getMediaTypeLabel(mimeType: string | null): string {
  if (!mimeType) return 'Unknown';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  return 'File';
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaListView({ items, getMediaUrl, onView, onDelete }: MediaListViewProps) {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No media found</p>
      </div>
    );
  }

  const handleAudioToggle = (itemId: string, audioElement: HTMLAudioElement | null) => {
    if (playingAudioId === itemId) {
      audioElement?.pause();
      setPlayingAudioId(null);
    } else {
      // Pause any other playing audio
      document.querySelectorAll('audio').forEach(a => a.pause());
      audioElement?.play();
      setPlayingAudioId(itemId);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Preview</TableHead>
          <TableHead>Caption</TableHead>
          <TableHead className="w-24">Type</TableHead>
          <TableHead className="w-24">Size</TableHead>
          <TableHead className="w-32">Added</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const url = getMediaUrl(item);
          const isAudio = item.mime_type?.startsWith('audio/');
          const isVideo = item.mime_type?.startsWith('video/');
          const isImage = item.mime_type?.startsWith('image/');
          
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div 
                  className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer relative"
                  onClick={() => url && onView(item.id, url, item.mime_type)}
                >
                  {url && isImage ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : url && isVideo ? (
                    <>
                      <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </>
                  ) : (
                    getMediaIcon(item.mime_type)
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {item.caption || <span className="text-muted-foreground italic">No caption</span>}
                  </span>
                  {/* Inline audio player */}
                  {isAudio && url && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement;
                          handleAudioToggle(item.id, audio);
                        }}
                      >
                        {playingAudioId === item.id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <audio 
                        id={`audio-${item.id}`}
                        src={url} 
                        className="h-6 flex-1"
                        onEnded={() => setPlayingAudioId(null)}
                        controls
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {getMediaTypeLabel(item.mime_type)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatFileSize(item.file_size)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => url && onView(item.id, url, item.mime_type)}
                    disabled={!url}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm('Delete this media?')) {
                        onDelete(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
