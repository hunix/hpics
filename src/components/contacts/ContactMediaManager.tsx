import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Image, Trash2, Plus, X, Play, Music } from 'lucide-react';
import { MediaUpload } from '@/components/uploads/MediaUpload';
import { getSignedUrls } from '@/hooks/useSignedUrl';
import { FileManagerToolbar, type FilterOption } from './FileManagerToolbar';
import { MediaListView } from './MediaListView';
import { MediaDetailView } from './MediaDetailView';
import { FilePagination } from './FilePagination';
import { useFileViewPreferences, type ViewMode } from '@/hooks/useFileViewPreferences';

interface ContactMediaManagerProps {
  profileId: string;
  contactName: string;
}

const MEDIA_CATEGORIES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/mov'],
  audio: ['audio/mpeg', 'audio/opus', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'],
};

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'name', label: 'By caption' },
];

function getCategoryFromMime(mimeType: string | null): string {
  if (!mimeType) return 'other';
  for (const [category, types] of Object.entries(MEDIA_CATEGORIES)) {
    if (types.some(t => mimeType.startsWith(t.split('/')[0]))) return category;
  }
  return 'other';
}

export function ContactMediaManager({ profileId, contactName }: ContactMediaManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences, updateMediaViewMode, updateMediaItemsPerPage } = useFileViewPreferences();
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<{ url: string; mimeType: string | null } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(0);

  const viewMode = preferences.media_view_mode as ViewMode;
  const itemsPerPage = preferences.media_items_per_page;

  // Fetch all media for this contact (for counting and client-side filtering)
  const { data: allMedia, isLoading } = useQuery({
    queryKey: ['contact-media', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profileId,
  });

  // Calculate filter options with counts
  const filterOptions = useMemo<FilterOption[]>(() => {
    if (!allMedia) return [];
    const counts: Record<string, number> = { image: 0, video: 0, audio: 0 };
    allMedia.forEach(item => {
      const cat = getCategoryFromMime(item.mime_type);
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return [
      { value: 'image', label: 'Images', count: counts.image },
      { value: 'video', label: 'Videos', count: counts.video },
      { value: 'audio', label: 'Audio', count: counts.audio },
    ].filter(o => o.count > 0);
  }, [allMedia]);

  // Filter and sort media
  const filteredMedia = useMemo(() => {
    if (!allMedia) return [];
    
    let result = [...allMedia];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.caption?.toLowerCase().includes(q)
      );
    }
    
    // Type filter
    if (typeFilter) {
      result = result.filter(item => getCategoryFromMime(item.mime_type) === typeFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'size-desc':
          return (b.file_size || 0) - (a.file_size || 0);
        case 'size-asc':
          return (a.file_size || 0) - (b.file_size || 0);
        case 'name':
          return (a.caption || '').localeCompare(b.caption || '');
        case 'date-desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return result;
  }, [allMedia, searchQuery, typeFilter, sortOption]);

  // Paginate
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const paginatedMedia = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredMedia.slice(start, start + itemsPerPage);
  }, [filteredMedia, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, typeFilter, itemsPerPage]);

  // Fetch signed URLs for paginated items
  useEffect(() => {
    if (!paginatedMedia || paginatedMedia.length === 0) return;

    const fetchUrls = async () => {
      const paths = paginatedMedia
        .map(item => item.storage_path || item.file_url)
        .filter((path): path is string => !!path);
      
      if (paths.length === 0) return;
      
      const urls = await getSignedUrls('media', paths);
      setSignedUrls(prev => new Map([...prev, ...urls]));
    };

    fetchUrls();
  }, [paginatedMedia]);

  const getMediaUrl = (item: { storage_path?: string | null; file_url: string }) => {
    const path = item.storage_path || item.file_url;
    return signedUrls.get(path) || null;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-media', profileId] });
      toast({ title: 'Media deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting media', description: error.message, variant: 'destructive' });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleOpenLightbox = (url: string, mimeType: string | null) => {
    setLightboxItem({ url, mimeType });
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {paginatedMedia.map((item) => {
        const url = getMediaUrl(item);
        const isVideo = item.mime_type?.startsWith('video/');
        const isAudio = item.mime_type?.startsWith('audio/');
        
        return (
          <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border">
            {url ? (
              isAudio ? (
                // Audio: Dark background with music icon
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-muted cursor-pointer"
                  onClick={() => handleOpenLightbox(url, item.mime_type)}
                >
                  <Music className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Audio</span>
                </div>
              ) : isVideo ? (
                // Video: Thumbnail with play overlay
                <div className="relative w-full h-full">
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={() => handleOpenLightbox(url, item.mime_type)}
                  >
                    <div className="bg-black/50 rounded-full p-3">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                // Image
                <img
                  src={url}
                  alt={item.caption || 'Media'}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => handleOpenLightbox(url, item.mime_type)}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Image className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this media?')) {
                  handleDelete(item.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                <p className="text-xs text-white truncate">{item.caption}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Media
            </CardTitle>
            <CardDescription>Photos and images related to {contactName}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </CardHeader>
        <CardContent>
          {allMedia && allMedia.length > 0 ? (
            <>
              <FileManagerToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={updateMediaViewMode}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                sortOption={sortOption}
                onSortChange={setSortOption}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={updateMediaItemsPerPage}
                filterOptions={filterOptions}
                sortOptions={SORT_OPTIONS}
                totalItems={filteredMedia.length}
              />

              {filteredMedia.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No media matches your filters</p>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' && renderGridView()}
                  {viewMode === 'list' && (
                    <MediaListView
                      items={paginatedMedia}
                      getMediaUrl={getMediaUrl}
                      onView={(url, mimeType) => handleOpenLightbox(url, mimeType)}
                      onDelete={handleDelete}
                    />
                  )}
                  {viewMode === 'detail' && (
                    <MediaDetailView
                      items={paginatedMedia}
                      getMediaUrl={getMediaUrl}
                      onView={(url, mimeType) => handleOpenLightbox(url, mimeType)}
                      onDelete={handleDelete}
                    />
                  )}
                  <FilePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredMedia.length}
                    itemsPerPage={itemsPerPage}
                  />
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No media yet</p>
              <p className="text-sm">Upload photos and images for this contact</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MediaUpload
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        preselectedProfileId={profileId}
        preselectedProfileName={contactName}
      />

      {/* Lightbox */}
      <Dialog open={!!lightboxItem} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setLightboxItem(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {lightboxItem && (
            lightboxItem.mimeType?.startsWith('video/') ? (
              <video
                src={lightboxItem.url}
                controls
                autoPlay
                className="w-full h-auto max-h-[80vh]"
              />
            ) : lightboxItem.mimeType?.startsWith('audio/') ? (
              <div className="bg-muted p-12 flex flex-col items-center gap-6">
                <Music className="h-20 w-20 text-muted-foreground" />
                <audio src={lightboxItem.url} controls autoPlay className="w-full max-w-md" />
              </div>
            ) : (
              <img
                src={lightboxItem.url}
                alt="Full size"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
