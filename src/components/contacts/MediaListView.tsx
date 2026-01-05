import { formatDistanceToNow } from 'date-fns';
import { Image, Trash2, ExternalLink, Video, Music } from 'lucide-react';
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
  onView: (url: string) => void;
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
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No media found</p>
      </div>
    );
  }

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
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div 
                  className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  onClick={() => url && onView(url)}
                >
                  {url && item.mime_type?.startsWith('image/') ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getMediaIcon(item.mime_type)
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {item.caption || <span className="text-muted-foreground italic">No caption</span>}
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
                    onClick={() => url && onView(url)}
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
