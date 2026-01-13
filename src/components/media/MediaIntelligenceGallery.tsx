/**
 * Media Intelligence Gallery
 * Desktop-optimized gallery for analyzing media with face detection, clustering, and bulk tagging
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Image, 
  User, 
  Users, 
  Tag, 
  Grid3X3, 
  LayoutList,
  Scan,
  Check,
  Eye,
  Brain,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  file_url: string;
  storage_path: string | null;
  mime_type: string | null;
  ai_metadata?: {
    faces_detected?: number;
    objects?: string[];
    scene?: string;
  } | null;
  profile_id?: string | null;
  created_at: string;
}

interface FaceRegion {
  id: string;
  media_id: string;
  profile_id: string | null;
  cropped_thumbnail_url: string | null;
  status: string | null;
}

interface FaceCluster {
  id: string;
  representativeFaceUrl?: string;
  mediaIds: string[];
  count: number;
  matchedProfileId?: string;
  matchedProfileName?: string;
}

export function MediaIntelligenceGallery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'untagged' | 'faces' | 'pending'>('all');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [selectedMediaForPreview, setSelectedMediaForPreview] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState('gallery');

  // Fetch media
  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['media-intelligence-gallery'],
    queryFn: async () => {
      const { data } = await supabase
        .from('media')
        .select('id, file_url, storage_path, mime_type, ai_metadata, profile_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(200);
      
      // Filter for images by mime_type
      const filtered = (data || []).filter(m => 
        m.mime_type?.startsWith('image/') || !m.mime_type
      );
      
      return filtered as MediaItem[];
    },
    enabled: !!user,
  });

  // Fetch face regions for clustering
  const { data: faceRegions } = useQuery({
    queryKey: ['face-regions-for-clustering'],
    queryFn: async () => {
      const { data } = await supabase
        .from('face_regions')
        .select('id, media_id, profile_id, cropped_thumbnail_url, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      return (data || []) as FaceRegion[];
    },
    enabled: !!user,
  });

  // Fetch contacts for bulk tagging (active only)
  const { data: contacts } = useQuery({
    queryKey: ['contacts-for-tagging'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('first_name');
      
      return data || [];
    },
    enabled: !!user,
  });

  // Compute face clusters
  const faceClusters = useMemo(() => {
    if (!faceRegions) return [];
    
    const taggedClusters = new Map<string, FaceCluster>();
    const untaggedFaces: FaceRegion[] = [];
    
    faceRegions.forEach(face => {
      if (face.profile_id) {
        const existing = taggedClusters.get(face.profile_id);
        if (existing) {
          existing.mediaIds.push(face.media_id);
          existing.count++;
        } else {
          const contact = contacts?.find(c => c.id === face.profile_id);
          taggedClusters.set(face.profile_id, {
            id: face.profile_id,
            representativeFaceUrl: face.cropped_thumbnail_url ?? undefined,
            mediaIds: [face.media_id],
            count: 1,
            matchedProfileId: face.profile_id,
            matchedProfileName: contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : 'Unknown',
          });
        }
      } else {
        untaggedFaces.push(face);
      }
    });

    const clusters: FaceCluster[] = Array.from(taggedClusters.values());
    
    if (untaggedFaces.length > 0) {
      clusters.push({
        id: 'unknown',
        representativeFaceUrl: untaggedFaces[0]?.cropped_thumbnail_url ?? undefined,
        mediaIds: untaggedFaces.map(f => f.media_id),
        count: untaggedFaces.length,
      });
    }

    return clusters.sort((a, b) => b.count - a.count);
  }, [faceRegions, contacts]);

  // Filter media based on selection
  const filteredMedia = useMemo(() => {
    if (!media) return [];
    
    switch (filter) {
      case 'untagged':
        return media.filter(m => !m.profile_id);
      case 'faces':
        return media.filter(m => (m.ai_metadata?.faces_detected || 0) > 0);
      case 'pending':
        return media.filter(m => !m.ai_metadata);
      default:
        return media;
    }
  }, [media, filter]);

  // Stats
  const stats = useMemo(() => ({
    total: media?.length || 0,
    untagged: media?.filter(m => !m.profile_id).length || 0,
    withFaces: media?.filter(m => (m.ai_metadata?.faces_detected || 0) > 0).length || 0,
    pending: media?.filter(m => !m.ai_metadata).length || 0,
  }), [media]);

  // Bulk tag mutation
  const bulkTagMutation = useMutation({
    mutationFn: async ({ mediaIds, profileId }: { mediaIds: string[]; profileId: string }) => {
      const { error } = await supabase
        .from('media')
        .update({ profile_id: profileId })
        .in('id', mediaIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-intelligence-gallery'] });
      setSelectedMedia(new Set());
      setShowBulkTag(false);
      toast({ title: 'Media tagged successfully' });
    },
  });

  const handleSelectAll = () => {
    if (selectedMedia.size === filteredMedia.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(filteredMedia.map(m => m.id)));
    }
  };

  const toggleMediaSelection = (id: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMedia(newSelection);
  };

  const getMediaUrl = (item: MediaItem) => {
    return item.file_url || item.storage_path || '';
  };

  if (mediaLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Media Intelligence Gallery</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Media Intelligence Gallery
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {selectedMedia.size > 0 && (
              <Button size="sm" onClick={() => setShowBulkTag(true)}>
                <Tag className="h-4 w-4 mr-2" />
                Tag {selectedMedia.size} Selected
              </Button>
            )}
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {(['all', 'untagged', 'faces', 'pending'] as const).map(f => (
            <Badge key={f} variant={filter === f ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter(f)}>
              {f === 'all' && `All (${stats.total})`}
              {f === 'untagged' && <><User className="h-3 w-3 mr-1" />Untagged ({stats.untagged})</>}
              {f === 'faces' && <><Scan className="h-3 w-3 mr-1" />Faces ({stats.withFaces})</>}
              {f === 'pending' && <><AlertTriangle className="h-3 w-3 mr-1" />Pending ({stats.pending})</>}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="gallery"><Image className="h-4 w-4 mr-2" />Gallery</TabsTrigger>
            <TabsTrigger value="clusters"><Users className="h-4 w-4 mr-2" />Clusters ({faceClusters.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox checked={selectedMedia.size === filteredMedia.length && filteredMedia.length > 0} onCheckedChange={handleSelectAll} />
              <span className="text-sm text-muted-foreground">{selectedMedia.size > 0 ? `${selectedMedia.size} selected` : 'Select all'}</span>
            </div>

            <ScrollArea className="h-[600px]">
              <div className={cn(view === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" : "flex flex-col gap-2")}>
                {filteredMedia.map(item => (
                  <MediaCard key={item.id} item={item} view={view} selected={selectedMedia.has(item.id)} onSelect={() => toggleMediaSelection(item.id)} onPreview={() => setSelectedMediaForPreview(item)} getMediaUrl={getMediaUrl} />
                ))}
              </div>
              {filteredMedia.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mb-4 opacity-50" />
                  <p>No media found</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="clusters">
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {faceClusters.map(cluster => (
                  <Card key={cluster.id} className={cn("cursor-pointer transition-all hover:shadow-lg", cluster.matchedProfileId ? "border-green-500/30" : "border-orange-500/30")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={cluster.representativeFaceUrl} />
                          <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cluster.matchedProfileName || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{cluster.count} photo{cluster.count > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {!cluster.matchedProfileId && (
                        <Button size="sm" variant="outline" className="w-full"><Tag className="h-4 w-4 mr-2" />Tag All</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={showBulkTag} onOpenChange={setShowBulkTag}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tag {selectedMedia.size} Media Items</DialogTitle></DialogHeader>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {contacts?.map(contact => (
                <Button key={contact.id} variant="outline" className="w-full justify-start" onClick={() => bulkTagMutation.mutate({ mediaIds: Array.from(selectedMedia), profileId: contact.id })} disabled={bulkTagMutation.isPending}>
                  <Avatar className="h-8 w-8 mr-3"><AvatarImage src={contact.avatar_url ?? undefined} /><AvatarFallback>{contact.first_name?.[0]}</AvatarFallback></Avatar>
                  {contact.first_name} {contact.last_name || ''}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedMediaForPreview && (
        <Dialog open onOpenChange={() => setSelectedMediaForPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Media Preview</DialogTitle></DialogHeader>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <img src={getMediaUrl(selectedMediaForPreview)} alt="" className="w-full h-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function MediaCard({ item, view, selected, onSelect, onPreview, getMediaUrl }: { 
  item: MediaItem; 
  view: 'grid' | 'list'; 
  selected: boolean; 
  onSelect: () => void; 
  onPreview: () => void;
  getMediaUrl: (item: MediaItem) => string;
}) {
  const mediaUrl = getMediaUrl(item);
  
  if (view === 'grid') {
    return (
      <div className={cn("relative group aspect-square rounded-lg overflow-hidden cursor-pointer ring-2 ring-transparent transition-all", selected && "ring-primary")}>
        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
          <div className={cn("absolute top-2 left-2 transition-opacity", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100")} onClick={e => { e.stopPropagation(); onSelect(); }}>
            <div className={cn("h-6 w-6 rounded border-2 flex items-center justify-center", selected ? "bg-primary border-primary" : "bg-white/80 border-white")}>
              {selected && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/40" onClick={e => { e.stopPropagation(); onPreview(); }}>
            <Eye className="h-4 w-4 text-white" />
          </Button>
          {(item.ai_metadata?.faces_detected || 0) > 0 && <Badge className="absolute bottom-2 right-2 bg-blue-500/80"><User className="h-3 w-3 mr-1" />{item.ai_metadata?.faces_detected}</Badge>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-4 p-3 rounded-lg border transition-all", selected && "bg-primary/5 border-primary")}>
      <Checkbox checked={selected} onCheckedChange={onSelect} />
      <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0"><img src={mediaUrl} alt="" className="w-full h-full object-cover" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{new Date(item.created_at).toLocaleDateString()}</p>
        <p className="text-xs text-muted-foreground">{item.ai_metadata?.scene || 'Unanalyzed'}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={onPreview}><Eye className="h-4 w-4" /></Button>
    </div>
  );
}
