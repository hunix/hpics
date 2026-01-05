import { format } from 'date-fns';
import { FileText, Trash2, Download, FileSpreadsheet, FileImage, File, Calendar, HardDrive, FileType, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

interface DocumentsDetailViewProps {
  items: DocumentItem[];
  onOpen: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
  downloadingId: string | null;
  typeColors: Record<string, string>;
}

function getDocIcon(mimeType: string | null) {
  if (!mimeType) return <FileText className="h-12 w-12" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-12 w-12 text-green-600" />;
  if (mimeType.startsWith('image/')) return <FileImage className="h-12 w-12 text-blue-500" />;
  if (mimeType.includes('pdf')) return <FileText className="h-12 w-12 text-red-500" />;
  if (mimeType.includes('word')) return <FileText className="h-12 w-12 text-blue-600" />;
  return <File className="h-12 w-12" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsDetailView({ items, onOpen, onDelete, downloadingId, typeColors }: DocumentsDetailViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted shrink-0">
                {getDocIcon(doc.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium">{doc.title}</h4>
                {doc.description && (
                  <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    <Badge variant="secondary" className={typeColors[doc.document_type] || typeColors.other}>
                      {doc.document_type}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileType className="h-4 w-4" />
                    {doc.mime_type || 'Unknown type'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4" />
                    {formatFileSize(doc.file_size)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(doc.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  disabled={downloadingId === doc.id}
                  onClick={() => onOpen(doc)}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Open
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Delete this document?')) {
                      onDelete(doc.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
