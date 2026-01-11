/**
 * UploadSourceSelector - Choose upload source (files, folder, ZIP)
 */

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Files, 
  FolderOpen, 
  FileArchive,
  Upload,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadSourceType = 'files' | 'folder' | 'zip';

interface UploadSourceSelectorProps {
  onFilesSelected: (files: File[], sourceType: UploadSourceType) => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function UploadSourceSelector({
  onFilesSelected,
  disabled = false,
  isProcessing = false
}: UploadSourceSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, sourceType: UploadSourceType) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files), sourceType);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isProcessing) return;

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Check if it's a folder or files
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      // Check if any file is a ZIP
      const hasZip = files.some(f => 
        f.name.toLowerCase().endsWith('.zip') || 
        f.type === 'application/zip'
      );
      
      onFilesSelected(files, hasZip ? 'zip' : 'files');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const sourceOptions = [
    {
      type: 'files' as UploadSourceType,
      icon: Files,
      title: 'Select Files',
      description: 'Choose multiple files',
      inputRef: fileInputRef,
      accept: '*/*',
      multiple: true,
      webkitdirectory: false
    },
    {
      type: 'folder' as UploadSourceType,
      icon: FolderOpen,
      title: 'Select Folder',
      description: 'Upload entire folder',
      inputRef: folderInputRef,
      accept: undefined,
      multiple: true,
      webkitdirectory: true
    },
    {
      type: 'zip' as UploadSourceType,
      icon: FileArchive,
      title: 'Upload ZIP',
      description: 'Extract and upload',
      inputRef: zipInputRef,
      accept: '.zip,application/zip,application/x-zip-compressed',
      multiple: false,
      webkitdirectory: false
    }
  ];

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          "hover:border-primary/50 hover:bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed",
          isProcessing && "pointer-events-none"
        )}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Processing files...</p>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or use the options below to select files
            </p>
          </>
        )}
      </div>

      {/* Source Options */}
      <div className="grid grid-cols-3 gap-3">
        {sourceOptions.map((option) => (
          <Card
            key={option.type}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && !isProcessing && option.inputRef.current?.click()}
          >
            <CardContent className="p-4 text-center">
              <option.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{option.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'files')}
        disabled={disabled}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-ignore - webkitdirectory is not in React types
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'folder')}
        disabled={disabled}
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'zip')}
        disabled={disabled}
      />
    </div>
  );
}
