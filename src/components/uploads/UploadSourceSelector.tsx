/**
 * UploadSourceSelector - Enhanced with recursive folder scanning
 */

import { useRef, useState } from 'react';
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

export interface FolderEntry {
  file: File;
  path: string;
}

interface UploadSourceSelectorProps {
  onFilesSelected: (files: File[], sourceType: UploadSourceType, folderStructure?: FolderEntry[]) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  acceptFilter?: string;
}

/**
 * Recursively read directory entries using webkitGetAsEntry
 */
async function readDirectoryEntries(entry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = entry.createReader();
  const entries: FileSystemEntry[] = [];
  
  const readBatch = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };
  
  // Keep reading until no more entries
  let batch = await readBatch();
  while (batch.length > 0) {
    entries.push(...batch);
    batch = await readBatch();
  }
  
  return entries;
}

/**
 * Get file from FileSystemFileEntry
 */
async function getFileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

/**
 * Recursively scan folder and return all files with paths
 */
async function scanFolder(entry: FileSystemDirectoryEntry, basePath = ''): Promise<FolderEntry[]> {
  const results: FolderEntry[] = [];
  const entries = await readDirectoryEntries(entry);
  
  for (const subEntry of entries) {
    const fullPath = basePath ? `${basePath}/${subEntry.name}` : subEntry.name;
    
    if (subEntry.isFile) {
      try {
        const file = await getFileFromEntry(subEntry as FileSystemFileEntry);
        results.push({ file, path: fullPath });
      } catch (e) {
        console.error('Error reading file:', fullPath, e);
      }
    } else if (subEntry.isDirectory) {
      const subResults = await scanFolder(subEntry as FileSystemDirectoryEntry, fullPath);
      results.push(...subResults);
    }
  }
  
  return results;
}

export function UploadSourceSelector({
  onFilesSelected,
  disabled = false,
  isProcessing = false,
  acceptFilter
}: UploadSourceSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, sourceType: UploadSourceType) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files), sourceType);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || isProcessing) return;

    const items = e.dataTransfer.items;
    const files: File[] = [];
    const folderEntries: FolderEntry[] = [];
    let hasFolder = false;

    // Check for folder entries using webkitGetAsEntry
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== 'file') continue;
      
      const entry = item.webkitGetAsEntry?.();
      
      if (entry?.isDirectory) {
        hasFolder = true;
        try {
          const scanned = await scanFolder(entry as FileSystemDirectoryEntry, entry.name);
          folderEntries.push(...scanned);
        } catch (e) {
          console.error('Error scanning folder:', e);
        }
      } else if (entry?.isFile) {
        try {
          const file = await getFileFromEntry(entry as FileSystemFileEntry);
          files.push(file);
          folderEntries.push({ file, path: file.name });
        } catch (e) {
          console.error('Error reading file:', e);
        }
      } else {
        // Fallback for browsers without webkitGetAsEntry
        const file = item.getAsFile();
        if (file) {
          files.push(file);
          folderEntries.push({ file, path: file.name });
        }
      }
    }

    if (hasFolder && folderEntries.length > 0) {
      // Return with folder structure
      const allFiles = folderEntries.map(e => e.file);
      onFilesSelected(allFiles, 'folder', folderEntries);
    } else if (files.length > 0) {
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
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const sourceOptions = [
    {
      type: 'files' as UploadSourceType,
      icon: Files,
      title: 'Select Files',
      description: 'Choose multiple files',
      inputRef: fileInputRef,
      accept: acceptFilter || '*/*',
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
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-primary/5",
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
            <Upload className={cn(
              "h-10 w-10 mx-auto mb-3 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files or folders here' : 'Drag and drop files or folders here'}
            </p>
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
        accept={acceptFilter}
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'files')}
        disabled={disabled}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error - webkitdirectory is not in React types
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
