import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Image, Video, FileAudio, FileText, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { MediaType } from "@/lib/analysisTypes";

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: number | null;
  mime_type: string | null;
  created_at: string;
  type: MediaType;
  isDocument?: boolean;
}

interface MediaTypeBrowserMultiSelectProps {
  profileId: string;
  mediaType: MediaType;
  selectedIds: string[];
  onSelectionChange: (items: MediaItem[]) => void;
  maxSelection?: number;
}

const mediaTypeIcons = {
  image: Image,
  audio: FileAudio,
  video: Video,
  document: FileText,
};

export function MediaTypeBrowserMultiSelect({
  profileId,
  mediaType,
  selectedIds,
  onSelectionChange,
  maxSelection = 100,
}: MediaTypeBrowserMultiSelectProps) {
  const [search, setSearch] = useState("");
  const Icon = mediaTypeIcons[mediaType];

  // Fetch media files
  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ['media-browser-multi', profileId, mediaType],
    queryFn: async () => {
      if (mediaType === 'document') {
        const { data, error } = await supabase
          .from('documents')
          .select('id, file_url, title, file_size, mime_type, created_at, storage_path')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data?.map(d => ({
          id: d.id,
          url: d.file_url || '',
          storagePath: d.storage_path,
          name: d.title || 'Untitled document',
          size: d.file_size,
          mime_type: d.mime_type,
          created_at: d.created_at,
          type: 'document' as const,
          isDocument: true,
        })) || [];
      } else {
        const mimeFilter = mediaType === 'image' 
          ? 'image' 
          : mediaType === 'video' 
            ? 'video' 
            : 'audio';
        
        const { data, error } = await supabase
          .from('media')
          .select('id, file_url, caption, file_size, mime_type, created_at, storage_path')
          .eq('profile_id', profileId)
          .ilike('mime_type', `${mimeFilter}%`)
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data?.map(m => ({
          id: m.id,
          url: m.file_url || '',
          storagePath: m.storage_path,
          name: m.caption || `${mediaType} file`,
          size: m.file_size,
          mime_type: m.mime_type,
          created_at: m.created_at,
          type: mediaType,
          isDocument: false,
        })) || [];
      }
    },
    enabled: !!profileId,
  });

  const filteredFiles = useMemo(() => {
    if (!mediaFiles) return [];
    if (!search.trim()) return mediaFiles;
    const term = search.toLowerCase();
    return mediaFiles.filter(f => f.name.toLowerCase().includes(term));
  }, [mediaFiles, search]);

  const selectedItems = useMemo(() => {
    return mediaFiles?.filter(f => selectedIds.includes(f.id)) || [];
  }, [mediaFiles, selectedIds]);

  const handleToggle = async (item: any) => {
    const isSelected = selectedIds.includes(item.id);
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter(i => i.id !== item.id));
    } else {
      if (selectedIds.length >= maxSelection) {
        return; // Max selection reached
      }
      
      // Get signed URL
      const bucket = item.isDocument ? 'documents' : 'media';
      let signedUrl = item.url;
      
      if (item.storagePath) {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(item.storagePath, 3600);
        signedUrl = data?.signedUrl || item.url;
      }
      
      onSelectionChange([...selectedItems, { ...item, url: signedUrl }]);
    }
  };

  const selectAll = async () => {
    const toSelect = filteredFiles.slice(0, maxSelection);
    const bucket = mediaType === 'document' ? 'documents' : 'media';
    
    const withUrls = await Promise.all(toSelect.map(async (item) => {
      if (item.storagePath) {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(item.storagePath, 3600);
        return { ...item, url: data?.signedUrl || item.url };
      }
      return item;
    }));
    
    onSelectionChange(withUrls);
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
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!mediaFiles || mediaFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Icon className="h-12 w-12 mb-2 opacity-50" />
        <p>No {mediaType} files found for this contact</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and controls */}
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
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
        <Badge variant="secondary">
          {selectedIds.length} / {maxSelection} selected
        </Badge>
      </div>

      {/* File list */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-1 pr-4">
          {filteredFiles.map((item) => {
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
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
