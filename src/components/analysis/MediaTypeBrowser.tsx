import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Video, FileAudio, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MediaTypeBrowserProps {
  profileId: string;
  mediaType: 'image' | 'audio' | 'video' | 'document';
  selectedId: string | null;
  onSelect: (item: { id: string; url: string; name: string }) => void;
}

const mediaTypeIcons = {
  image: Image,
  audio: FileAudio,
  video: Video,
  document: FileText,
};

export function MediaTypeBrowser({
  profileId,
  mediaType,
  selectedId,
  onSelect,
}: MediaTypeBrowserProps) {
  const Icon = mediaTypeIcons[mediaType];

  // Fetch media files
  const { data: mediaFiles, isLoading: loadingMedia } = useQuery({
    queryKey: ['media-browser', profileId, mediaType],
    queryFn: async () => {
      if (mediaType === 'document') {
        const { data, error } = await supabase
          .from('documents')
          .select('id, file_url, title, file_size, mime_type, created_at')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data?.map(d => ({
          id: d.id,
          url: d.file_url,
          name: d.title || 'Untitled document',
          size: d.file_size,
          mime_type: d.mime_type,
          created_at: d.created_at,
          type: 'document' as const,
        })) || [];
      } else {
        const mimeFilter = mediaType === 'image' 
          ? 'image' 
          : mediaType === 'video' 
            ? 'video' 
            : 'audio';
        
        const { data, error } = await supabase
          .from('media')
          .select('id, file_url, caption, file_size, mime_type, created_at')
          .eq('profile_id', profileId)
          .ilike('mime_type', `${mimeFilter}%`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data?.map(m => ({
          id: m.id,
          url: m.file_url,
          name: m.caption || `${mediaType} file`,
          size: m.file_size,
          mime_type: m.mime_type,
          created_at: m.created_at,
          type: mediaType,
        })) || [];
      }
    },
    enabled: !!profileId,
  });

  // Get signed URLs for selected items
  const getSignedUrl = async (url: string, bucket: string) => {
    if (!url) return null;
    const path = url.split(`${bucket}/`)[1];
    if (!path) return url;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    return data?.signedUrl || url;
  };

  const handleSelect = async (item: any) => {
    const bucket = item.type === 'document' ? 'documents' : 'media';
    const signedUrl = await getSignedUrl(item.url, bucket);
    onSelect({ id: item.id, url: signedUrl || item.url, name: item.name });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loadingMedia) {
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
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 pr-4">
        {mediaFiles.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "cursor-pointer transition-all hover:bg-accent",
              selectedId === item.id && "ring-2 ring-primary"
            )}
            onClick={() => handleSelect(item)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-muted rounded flex items-center justify-center">
                {mediaType === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('hidden');
                    }}
                  />
                ) : (
                  <Icon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.size && <span>{formatFileSize(item.size)}</span>}
                  {item.created_at && (
                    <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
              {selectedId === item.id && (
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
