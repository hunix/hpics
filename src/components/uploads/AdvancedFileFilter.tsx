/**
 * AdvancedFileFilter - Pre-upload filtering, sorting, and batch operations
 */

import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  CheckSquare,
  Square,
  ImageIcon,
  FileAudioIcon,
  FileVideoIcon,
  FileTextIcon,
  FileIcon,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatFileSize } from '@/lib/bulkUpload';
import { cn } from '@/lib/utils';
import type { ProcessedFile } from '@/lib/bulkUpload/bulkFileProcessor';

interface AdvancedFileFilterProps {
  files: ProcessedFile[];
  onFilesChange: (files: ProcessedFile[]) => void;
  onRemoveFiles: (fileIds: string[]) => void;
}

type SortField = 'name' | 'size' | 'type';
type SortDirection = 'asc' | 'desc';
type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

export function AdvancedFileFilter({
  files,
  onFilesChange,
  onRemoveFiles
}: AdvancedFileFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'all'>('all');
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, 100]);

  // Calculate size bounds
  const sizeBounds = useMemo(() => {
    if (files.length === 0) return { min: 0, max: 100 * 1024 * 1024 };
    const sizes = files.map(f => f.fileSize);
    return {
      min: Math.min(...sizes),
      max: Math.max(...sizes)
    };
  }, [files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.filename.toLowerCase().includes(query) ||
        f.originalPath?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(f => f.category === categoryFilter);
    }

    // Size filter
    const minSize = sizeBounds.min + (sizeRange[0] / 100) * (sizeBounds.max - sizeBounds.min);
    const maxSize = sizeBounds.min + (sizeRange[1] / 100) * (sizeBounds.max - sizeBounds.min);
    result = result.filter(f => f.fileSize >= minSize && f.fileSize <= maxSize);

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'type':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, categoryFilter, sizeRange, sizeBounds, sortField, sortDirection]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FileCategory, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0
    };
    files.forEach(f => {
      counts[f.category as FileCategory] = (counts[f.category as FileCategory] || 0) + 1;
    });
    return counts;
  }, [files]);

  const toggleSelection = (fileId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredFiles.map(f => f.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    onRemoveFiles(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const moveToTop = () => {
    if (selectedIds.size === 0) return;
    const selected = files.filter(f => selectedIds.has(f.id));
    const unselected = files.filter(f => !selectedIds.has(f.id));
    onFilesChange([...selected, ...unselected]);
  };

  const moveToBottom = () => {
    if (selectedIds.size === 0) return;
    const selected = files.filter(f => selectedIds.has(f.id));
    const unselected = files.filter(f => !selectedIds.has(f.id));
    onFilesChange([...unselected, ...selected]);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return ImageIcon;
      case 'audio': return FileAudioIcon;
      case 'video': return FileVideoIcon;
      case 'document': return FileTextIcon;
      default: return FileIcon;
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filter & Sort Files</h3>
        </div>
        <Badge variant="secondary">
          {filteredFiles.length} of {files.length} files
        </Badge>
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FileCategory | 'all')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types ({files.length})</SelectItem>
            <SelectItem value="image">Images ({categoryCounts.image})</SelectItem>
            <SelectItem value="video">Videos ({categoryCounts.video})</SelectItem>
            <SelectItem value="audio">Audio ({categoryCounts.audio})</SelectItem>
            <SelectItem value="document">Documents ({categoryCounts.document})</SelectItem>
            <SelectItem value="other">Other ({categoryCounts.other})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Size Range Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">File size range</span>
          <span className="text-muted-foreground">
            {formatFileSize(sizeBounds.min + (sizeRange[0] / 100) * (sizeBounds.max - sizeBounds.min))} - 
            {formatFileSize(sizeBounds.min + (sizeRange[1] / 100) * (sizeBounds.max - sizeBounds.min))}
          </span>
        </div>
        <Slider
          value={sizeRange}
          onValueChange={(v) => setSizeRange(v as [number, number])}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Selection Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={selectAll}>
          <CheckSquare className="h-3.5 w-3.5 mr-1" />
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={selectNone}>
          <Square className="h-3.5 w-3.5 mr-1" />
          Select None
        </Button>
        
        {selectedIds.size > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button variant="outline" size="sm" onClick={moveToTop}>
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              Move to Top
            </Button>
            <Button variant="outline" size="sm" onClick={moveToBottom}>
              <ArrowDown className="h-3.5 w-3.5 mr-1" />
              Move to Bottom
            </Button>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove
            </Button>
          </>
        )}
      </div>

      {/* Sort Headers */}
      <div className="flex items-center gap-4 px-3 py-2 bg-muted/50 rounded-lg text-sm">
        <div className="w-6" /> {/* Checkbox spacer */}
        <button
          className={cn(
            "flex items-center gap-1 flex-1 hover:text-primary",
            sortField === 'name' && "text-primary font-medium"
          )}
          onClick={() => toggleSort('name')}
        >
          Name
          {sortField === 'name' && (
            sortDirection === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          className={cn(
            "flex items-center gap-1 w-20 justify-end hover:text-primary",
            sortField === 'type' && "text-primary font-medium"
          )}
          onClick={() => toggleSort('type')}
        >
          Type
          {sortField === 'type' && (
            sortDirection === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          className={cn(
            "flex items-center gap-1 w-24 justify-end hover:text-primary",
            sortField === 'size' && "text-primary font-medium"
          )}
          onClick={() => toggleSort('size')}
        >
          Size
          {sortField === 'size' && (
            sortDirection === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="w-8" /> {/* Remove button spacer */}
      </div>

      {/* File List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-1 pr-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.category);
            const isSelected = selectedIds.has(file.id);

            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-muted/50",
                  isSelected && "bg-primary/10"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(file.id)}
                />
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.filename}</p>
                  {file.originalPath && file.originalPath !== file.filename && (
                    <p className="text-xs text-muted-foreground truncate">
                      {file.originalPath}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {file.category}
                </Badge>
                <span className="text-xs text-muted-foreground w-20 text-right">
                  {formatFileSize(file.fileSize)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRemoveFiles([file.id])}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            );
          })}

          {filteredFiles.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No files match your filters
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
