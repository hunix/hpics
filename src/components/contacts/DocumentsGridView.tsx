import { formatDistanceToNow } from 'date-fns';
import { FileText, Trash2, ExternalLink, Loader2, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentItem {
  id: string;
  title: string;
  document_type: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  storage_path: string | null;
  file_url: string;
  description: string | null;
}

interface DocumentsGridViewProps {
  items: DocumentItem[];
  onOpen: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
  downloadingId: string | null;
  typeColors: Record<string, string>;
}

function getDocIcon(mimeType: string | null) {
  if (!mimeType) return <FileText className="h-8 w-8" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-8 w-8" />;
  if (mimeType.startsWith('image/')) return <FileImage className="h-8 w-8" />;
  if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsGridView({ items, onOpen, onDelete, downloadingId, typeColors }: DocumentsGridViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No documents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((doc) => (
        <Card key={doc.id} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                {getDocIcon(doc.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" title={doc.title}>{doc.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={typeColors[doc.document_type] || typeColors.other}>
                    {doc.document_type}
                  </Badge>
                  {doc.file_size && (
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                disabled={downloadingId === doc.id}
                onClick={() => onOpen(doc)}
              >
                {downloadingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-1" />
                )}
                Open
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this document?')) {
                    onDelete(doc.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
