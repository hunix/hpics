import { useState, useMemo, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, FileAudio, FileText, Check, Search, Grid, List, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { MediaType } from "@/lib/analysisTypes";

export interface MediaItem {
  id: string;
  url: string;
  storagePath?: string;
  name: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
  type: MediaType;
  isDocument?: boolean;
  thumbnailUrl?: string;
  completedAnalysisModes?: string[];
  lastAnalysisAt?: string | null;
}

interface MediaTypeBrowserMultiSelectProps {
  profileId: string;
  mediaType: MediaType;
  selectedIds: string[];
  onSelectionChange: (items: MediaItem[]) => void;
  maxSelection?: number;
  requestedModes?: string[];  // Modes user wants to run - used to filter out fully analyzed items
  hideFullyAnalyzed?: boolean; // If true, hide items where all requestedModes are already completed
}

const mediaTypeIcons = {
  image: Image,
  audio: FileAudio,
  video: Video,
  document: FileText,
};

const PAGE_SIZE = 100;

export function MediaTypeBrowserMultiSelect({
  profileId,
  mediaType,
  selectedIds,
  onSelectionChange,
  maxSelection = 500,
  requestedModes = [],
  hideFullyAnalyzed = false,
}: MediaTypeBrowserMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAnalyzedFilter, setShowAnalyzedFilter] = useState<'all' | 'unanalyzed' | 'partial'>(hideFullyAnalyzed ? 'unanalyzed' : 'all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = mediaTypeIcons[mediaType];

  // Fetch media files with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['media-browser-multi-infinite', profileId, mediaType],
    queryFn: async ({ pageParam = 0 }): Promise<{ items: MediaItem[]; nextPage: number | undefined }> => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (mediaType === 'document') {
        const { data, error } = await supabase
          .from('documents')
          .select('id, file_url, title, file_size, mime_type, created_at, storage_path, completed_analysis_modes, last_analysis_at')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .range(from, to);
        if (error) throw error;
        const items: MediaItem[] = data?.map(d => ({
          id: d.id,
          url: d.file_url || '',
          storagePath: d.storage_path || undefined,
          name: d.title || 'Untitled document',
          size: d.file_size,
          mime_type: d.mime_type,
          created_at: d.created_at,
          type: 'document' as MediaType,
          isDocument: true,
          completedAnalysisModes: d.completed_analysis_modes || [],
          lastAnalysisAt: d.last_analysis_at,
        })) || [];
        return {
          items,
          nextPage: data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        };
      } else {
        const mimeFilter = mediaType === 'image' 
          ? 'image' 
          : mediaType === 'video' 
            ? 'video' 
            : 'audio';
        
        const { data, error } = await supabase
          .from('media')
          .select('id, file_url, caption, file_size, mime_type, created_at, storage_path, completed_analysis_modes, last_analysis_at')
          .eq('profile_id', profileId)
          .ilike('mime_type', `${mimeFilter}%`)
          .order('created_at', { ascending: false })
          .range(from, to);
        if (error) throw error;
        const items: MediaItem[] = data?.map(m => ({
          id: m.id,
          url: m.file_url || '',
          storagePath: m.storage_path || undefined,
          name: m.caption || `${mediaType} file`,
          size: m.file_size,
          mime_type: m.mime_type,
          created_at: m.created_at,
          type: mediaType,
          isDocument: false,
          completedAnalysisModes: m.completed_analysis_modes || [],
          lastAnalysisAt: m.last_analysis_at,
        })) || [];
        return {
          items,
          nextPage: data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!profileId,
  });

  // Flatten all pages
  const mediaFiles = useMemo((): MediaItem[] => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  const totalLoaded = mediaFiles.length;

  // Helper to check if item is fully analyzed for requested modes
  const isFullyAnalyzed = useCallback((item: MediaItem): boolean => {
    const completed = item.completedAnalysisModes || [];
    
    // If no specific modes requested, consider "fully analyzed" if ANY modes are completed
    if (requestedModes.length === 0) {
      return completed.length > 0;
    }
    
    // Otherwise, check if all requested modes are completed
    return requestedModes.every(mode => completed.includes(mode));
  }, [requestedModes]);
  
  // Computed counts for UI feedback
  const analyzedCount = useMemo(() => 
    mediaFiles.filter(f => (f.completedAnalysisModes || []).length > 0).length
  , [mediaFiles]);

  const unanalyzedCount = useMemo(() => 
    mediaFiles.filter(f => (f.completedAnalysisModes || []).length === 0).length
  , [mediaFiles]);

  // Helper to get remaining modes for an item
  const getRemainingModes = useCallback((item: MediaItem): string[] => {
    if (requestedModes.length === 0) return [];
    const completed = item.completedAnalysisModes || [];
    return requestedModes.filter(mode => !completed.includes(mode));
  }, [requestedModes]);

  const filteredFiles = useMemo((): MediaItem[] => {
    if (!mediaFiles) return [];
    let result = mediaFiles;
    
    // Filter by search term
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(term));
    }
    
    // Filter by analysis status
    if (showAnalyzedFilter === 'unanalyzed') {
      // Show only items that have at least one remaining mode to analyze
      result = result.filter(f => !isFullyAnalyzed(f));
    } else if (showAnalyzedFilter === 'partial') {
      // Show only items with some but not all modes completed
      result = result.filter(f => {
        const completed = f.completedAnalysisModes || [];
        return completed.length > 0 && !isFullyAnalyzed(f);
      });
    }
    
    return result;
  }, [mediaFiles, search, showAnalyzedFilter, isFullyAnalyzed]);

  const selectedItems = useMemo((): MediaItem[] => {
    return mediaFiles?.filter(f => selectedIds.includes(f.id)) || [];
  }, [mediaFiles, selectedIds]);

  // Instant toggle - no URL fetching, deferred to analysis time
  const handleToggle = useCallback((item: MediaItem) => {
    const isSelected = selectedIds.includes(item.id);
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter(i => i.id !== item.id));
    } else {
      if (selectedIds.length >= maxSelection) {
        return; // Max selection reached
      }
      // Pass item with storagePath - URL will be resolved at analysis time
      onSelectionChange([...selectedItems, item]);
    }
  }, [selectedIds, selectedItems, maxSelection, onSelectionChange]);

  // Instant select all - no URL fetching
  const selectAll = () => {
    const toSelect = filteredFiles.slice(0, maxSelection);
    console.log('[MediaBrowser] selectAll:', toSelect.length, 'items');
    onSelectionChange(toSelect);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!mediaFiles || mediaFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Icon className="h-16 w-16 mb-3 opacity-40" />
        <p className="font-medium">No {mediaType} files found</p>
        <p className="text-sm">Upload files for this contact to analyze them</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and view controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {mediaType === 'image' && (
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All ({Math.min(filteredFiles.length, maxSelection)})
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          
          {/* Analysis Status Filter - Always visible */}
          <Select value={showAnalyzedFilter} onValueChange={(v) => setShowAnalyzedFilter(v as 'all' | 'unanalyzed' | 'partial')}>
            <SelectTrigger className="w-[170px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All files ({totalLoaded})</SelectItem>
              <SelectItem value="unanalyzed">Unanalyzed ({unanalyzedCount})</SelectItem>
              <SelectItem value="partial">Partially done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Showing {filteredFiles.length} of {totalLoaded}
            {analyzedCount > 0 && (
              <span className="text-green-600 ml-1">({analyzedCount} analyzed)</span>
            )}
          </span>
          <Badge variant={selectedIds.length >= maxSelection ? "destructive" : "secondary"}>
            {selectedIds.length} / {maxSelection}
          </Badge>
        </div>
      </div>

      {/* File list/grid */}
      <ScrollArea className="h-[420px]" ref={scrollRef}>
        {viewMode === 'grid' && mediaType === 'image' ? (
          <div className="grid grid-cols-4 gap-2 pr-4">
            {filteredFiles.map((item: MediaItem) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                  )}
                  onClick={() => handleToggle(item)}
                >
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className={cn(
                    "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity",
                    isSelected && "opacity-100"
                  )}>
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <Checkbox 
                    checked={isSelected}
                    className="absolute top-1 left-1 bg-background/80"
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => handleToggle(item)}
                  />
                  {/* Analysis status badge on grid */}
                  {item.completedAnalysisModes && item.completedAnalysisModes.length > 0 && (
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-green-500/90 text-white">
                        {item.completedAnalysisModes.length}✓
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1 pr-4">
            {filteredFiles.map((item: MediaItem) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "cursor-pointer transition-all hover:bg-accent",
                    isSelected && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleToggle(item)}
                >
                  <CardContent className="p-2 flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected} 
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => handleToggle(item)}
                    />
                    <div className="flex-shrink-0 w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.size && <span>{formatFileSize(item.size)}</span>}
                        {item.created_at && (
                          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    {/* Analysis status badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.completedAnalysisModes && item.completedAnalysisModes.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-700 border-green-500/30">
                          {item.completedAnalysisModes.length}✓
                        </Badge>
                      )}
                      {requestedModes.length > 0 && getRemainingModes(item).length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {getRemainingModes(item).length} pending
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Load more button */}
        {hasNextPage && (
          <div className="pt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>Loading...</>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Load More
                </>
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
