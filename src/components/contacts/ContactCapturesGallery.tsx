/**
 * Contact Captures Gallery
 * 
 * Displays all captured media linked to a contact:
 * - Photos, videos, voice recordings
 * - Timeline and grid views
 * - Playback and management
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Video, 
  Mic, 
  Calendar, 
  Grid3X3, 
  List,
  Play,
  Download,
  Trash2,
  Link2,
  Link2Off,
  MoreVertical,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ContactCapturesGalleryProps {
  profileId: string;
  profileName?: string;
  className?: string;
}

interface CapturedMedia {
  id: string;
  type: 'photo' | 'video' | 'voice';
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    fileName?: string;
  };
  source?: string;
}

type ViewMode = 'grid' | 'timeline';
type FilterType = 'all' | 'photo' | 'video' | 'voice';

export function ContactCapturesGallery({
  profileId,
  profileName,
  className,
}: ContactCapturesGalleryProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedMedia, setSelectedMedia] = useState<CapturedMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch media linked to this profile
  const { data: captures = [], isLoading } = useQuery({
    queryKey: ['contact-captures', profileId],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch from multiple sources
      const [mediaResult, voiceNotesResult] = await Promise.all([
        // Photos and videos from media table
        supabase
          .from('media')
          .select('id, file_url, mime_type, created_at, ai_metadata')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false }),
        
        // Voice recordings
        supabase
          .from('voice_notes')
          .select('id, file_url, duration_seconds, created_at')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false }),
      ]);

      const results: CapturedMedia[] = [];

      // Process media
      if (mediaResult.data) {
        for (const item of mediaResult.data) {
          const type = (item.mime_type as string)?.startsWith('video') ? 'video' : 'photo';
          results.push({
            id: item.id,
            type,
            url: item.file_url || '',
            createdAt: item.created_at,
            metadata: item.ai_metadata as CapturedMedia['metadata'],
            source: 'media',
          });
        }
      }

      // Process voice notes
      if (voiceNotesResult.data) {
        for (const item of voiceNotesResult.data) {
          results.push({
            id: item.id,
            type: 'voice',
            url: item.file_url || '',
            createdAt: item.created_at,
            metadata: { duration: item.duration_seconds || 0 },
            source: 'voice_notes',
          });
        }
      }

      // Sort by date
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return results;
    },
    enabled: !!user?.id && !!profileId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (media: CapturedMedia) => {
      if (media.source === 'media') {
        const { error } = await supabase
          .from('media')
          .delete()
          .eq('id', media.id)
          .eq('user_id', user?.id ?? '');
        if (error) throw error;
      } else if (media.source === 'voice_notes') {
        const { error } = await supabase
          .from('voice_notes')
          .delete()
          .eq('id', media.id)
          .eq('user_id', user?.id ?? '');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-captures', profileId] });
      toast.success('Media deleted');
    },
    onError: () => {
      toast.error('Failed to delete media');
    },
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (media: CapturedMedia) => {
      if (media.source === 'media') {
        const { error } = await supabase
          .from('media')
          .update({ profile_id: null })
          .eq('id', media.id)
          .eq('user_id', user?.id ?? '');
        if (error) throw error;
      } else if (media.source === 'voice_notes') {
        const { error } = await supabase
          .from('voice_notes')
          .update({ profile_id: null })
          .eq('id', media.id)
          .eq('user_id', user?.id ?? '');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-captures', profileId] });
      toast.success('Media unlinked from contact');
    },
    onError: () => {
      toast.error('Failed to unlink media');
    },
  });

  // Filter captures
  const filteredCaptures = useMemo(() => {
    if (filterType === 'all') return captures;
    return captures.filter(c => c.type === filterType);
  }, [captures, filterType]);

  // Group by date for timeline view
  const groupedCaptures = useMemo(() => {
    const groups: Record<string, CapturedMedia[]> = {};
    
    for (const capture of filteredCaptures) {
      const dateKey = format(new Date(capture.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(capture);
    }
    
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredCaptures]);

  const handleDelete = useCallback(async (media: CapturedMedia) => {
    setIsDeleting(media.id);
    await deleteMutation.mutateAsync(media);
    setIsDeleting(null);
    setSelectedMedia(null);
  }, [deleteMutation]);

  const handleUnlink = useCallback(async (media: CapturedMedia) => {
    await unlinkMutation.mutateAsync(media);
    setSelectedMedia(null);
  }, [unlinkMutation]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: CapturedMedia['type']) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
    }
  };

  const stats = useMemo(() => ({
    total: captures.length,
    photos: captures.filter(c => c.type === 'photo').length,
    videos: captures.filter(c => c.type === 'video').length,
    voice: captures.filter(c => c.type === 'voice').length,
  }), [captures]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (captures.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No captures yet</h3>
        <p className="text-sm text-muted-foreground">
          Media linked to {profileName || 'this contact'} will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stats.total} total</Badge>
          {stats.photos > 0 && (
            <Badge variant="outline" className="gap-1">
              <Image className="h-3 w-3" /> {stats.photos}
            </Badge>
          )}
          {stats.videos > 0 && (
            <Badge variant="outline" className="gap-1">
              <Video className="h-3 w-3" /> {stats.videos}
            </Badge>
          )}
          {stats.voice > 0 && (
            <Badge variant="outline" className="gap-1">
              <Mic className="h-3 w-3" /> {stats.voice}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('timeline')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="photo">Photos</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <ScrollArea className="h-[400px]">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredCaptures.map((media) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                onClick={() => setSelectedMedia(media)}
              >
                {media.type === 'photo' && (
                  <img 
                    src={media.url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
                {media.type === 'video' && (
                  <>
                    <video 
                      src={media.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-2 rounded-full bg-black/50">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </>
                )}
                {media.type === 'voice' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10">
                    <Mic className="h-8 w-8 text-primary mb-2" />
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(media.metadata?.duration)}
                    </span>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white">
                    {formatDistanceToNow(new Date(media.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCaptures.map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 pl-6">
                  {items.map((media) => (
                    <div
                      key={media.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedMedia(media)}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {media.type === 'photo' && (
                          <img src={media.url} alt="" className="w-full h-full object-cover" />
                        )}
                        {media.type === 'video' && (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Video className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        {media.type === 'voice' && (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(media.type)}
                          <span className="text-sm font-medium capitalize">{media.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(media.createdAt), 'h:mm a')}
                          {media.metadata?.duration && ` • ${formatDuration(media.metadata.duration)}`}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUnlink(media); }}>
                            <Link2Off className="h-4 w-4 mr-2" />
                            Unlink
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(media); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Media preview dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMedia && getTypeIcon(selectedMedia.type)}
              <span className="capitalize">{selectedMedia?.type}</span>
              <span className="text-muted-foreground font-normal">
                • {selectedMedia && formatDistanceToNow(new Date(selectedMedia.createdAt), { addSuffix: true })}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Media content */}
            <div className="rounded-lg overflow-hidden bg-black">
              {selectedMedia?.type === 'photo' && (
                <img 
                  src={selectedMedia.url} 
                  alt="" 
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
              {selectedMedia?.type === 'video' && (
                <video 
                  src={selectedMedia.url}
                  controls
                  className="w-full max-h-[60vh]"
                />
              )}
              {selectedMedia?.type === 'voice' && (
                <div className="p-8 flex flex-col items-center justify-center">
                  <Mic className="h-16 w-16 text-primary mb-4" />
                  <audio src={selectedMedia.url} controls className="w-full" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleUnlink(selectedMedia!)}>
                <Link2Off className="h-4 w-4 mr-2" />
                Unlink
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDelete(selectedMedia!)}
                disabled={isDeleting === selectedMedia?.id}
              >
                {isDeleting === selectedMedia?.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
