import { useCallback } from 'react';
import { Upload, FileArchive, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppImportDropzoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  dragActive: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function WhatsAppImportDropzone({
  onFileSelected,
  isProcessing,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDrop,
}: WhatsAppImportDropzoneProps) {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-all",
        dragActive 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-primary/50",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".txt,.zip"
        onChange={handleFileChange}
        className="hidden"
        id="whatsapp-file-input"
        disabled={isProcessing}
      />
      <label 
        htmlFor="whatsapp-file-input" 
        className="cursor-pointer flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <FileArchive className="h-8 w-8 text-muted-foreground" />
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          <span>Drop WhatsApp export (.zip or .txt) or click to browse</span>
        </div>
        <p className="text-xs text-muted-foreground/70">
          ZIP files include media • TXT files contain messages only
        </p>
      </label>
    </div>
  );
}
