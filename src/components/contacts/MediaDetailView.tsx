import { formatDistanceToNow, format } from 'date-fns';
import { Image, Trash2, Download, Video, Music, Calendar, HardDrive, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MediaItem {
  id: string;
  caption: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  storage_path: string | null;
  file_url: string;
}

interface MediaDetailViewProps {
  items: MediaItem[];
  getMediaUrl: (item: MediaItem) => string | null;
  onView: (id: string, url: string, mimeType: string | null) => void;
  onDelete: (id: string) => void;
}

function getMediaTypeLabel(mimeType: string | null): string {
  if (!mimeType) return 'Unknown';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  return 'File';
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaPreview({ item, url, onView }: { item: MediaItem; url: string | null; onView: (id: string, url: string, mimeType: string | null) => void }) {
  if (!url) {
    return (
      <div className="w-full h-48 bg-muted flex items-center justify-center">
        <Image className="h-12 w-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (item.mime_type?.startsWith('video/')) {
    return (
      <video
        src={url}
        className="w-full h-48 object-cover cursor-pointer"
        onClick={() => onView(item.id, url, item.mime_type)}
      />
    );
  }

  if (item.mime_type?.startsWith('audio/')) {
    return (
      <div className="w-full h-48 bg-muted flex flex-col items-center justify-center gap-4">
        <Music className="h-12 w-12 text-muted-foreground" />
        <audio src={url} controls className="w-4/5" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={item.caption || 'Media'}
      className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => onView(item.id, url, item.mime_type)}
    />
  );
}

export function MediaDetailView({ items, getMediaUrl, onView, onDelete }: MediaDetailViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No media found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const url = getMediaUrl(item);
        return (
          <Card key={item.id} className="overflow-hidden">
            <MediaPreview item={item} url={url} onView={onView} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {item.caption || <span className="text-muted-foreground italic">No caption</span>}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileType className="h-3.5 w-3.5" />
                      <Badge variant="secondary" className="text-xs">
                        {getMediaTypeLabel(item.mime_type)}
                      </Badge>
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      {formatFileSize(item.file_size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {item.mime_type && (
                    <p className="text-xs text-muted-foreground mt-1">{item.mime_type}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Delete this media?')) {
                        onDelete(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
