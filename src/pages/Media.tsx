import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import {
  usePaginatedMedia,
  useMeetingRecordings,
  useDeleteMedia,
  useDeleteRecording,
  type MediaWithProfile,
  type RecordingWithProfile,
} from '@/hooks/media/useMediaPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Image as ImageIcon, Images, Trash2, Mic, Play, Pause, FileAudio, FolderOpen, Clock, User, Search, Grid3X3, List, FileText, Music, Video, X, LayoutGrid, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MediaUpload } from '@/components/uploads/MediaUpload';
import { RecordingUpload } from '@/components/recordings/RecordingUpload';
import { BulkUploadDialog } from '@/components/uploads/BulkUploadDialog';
import { getSignedUrls, getSignedUrl } from '@/hooks/useSignedUrl';
import { useMediaFolders } from '@/hooks/useMediaFolders';
import { useFileViewPreferences, type MainViewMode, type ViewMode } from '@/hooks/useFileViewPreferences';
import { ContactFolderCard } from '@/components/files/ContactFolderCard';
import { FolderBreadcrumb } from '@/components/files/FolderBreadcrumb';
import { FilePagination } from '@/components/contacts/FilePagination';
type Media = MediaWithProfile;
type Recording = RecordingWithProfile;

export default function MediaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRecordingUploadOpen, setIsRecordingUploadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  
  // Folder navigation state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string>('');
  
  // Search, filter, pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  
  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState<{ url: string; mimeType: string | null } | null>(null);
  
  const { preferences, updateMainMediaViewMode, updateMainMediaItemsPerPage } = useFileViewPreferences();
  const { data: folders, isLoading: foldersLoading } = useMediaFolders();
  
  const itemsPerPage = preferences.main_media_items_per_page;
  const viewMode = preferences.main_media_view_mode;

  // Filtered folders for search
  const filteredFolders = useMemo(() => {
    if (!folders) return [];
    if (!folderSearchQuery) return folders;
    const query = folderSearchQuery.toLowerCase();
    return folders.filter(f => 
      `${f.firstName} ${f.lastName || ''}`.toLowerCase().includes(query)
    );
  }, [folders, folderSearchQuery]);

  const { data: paginatedMedia, isLoading: mediaLoading } = usePaginatedMedia({
    selectedContactId,
    searchQuery,
    typeFilter,
    sortBy,
    currentPage,
    itemsPerPage,
    enabled: selectedContactId !== null || viewMode !== 'folders',
  });

  const { data: recordings, isLoading: recordingsLoading } = useMeetingRecordings();

  // Fetch signed URLs for visible media items
  useEffect(() => {
    if (!paginatedMedia?.items || paginatedMedia.items.length === 0) return;

    const fetchUrls = async () => {
      const paths = paginatedMedia.items
        .map(item => item.storage_path || item.file_url)
        .filter((path): path is string => !!path && !path.startsWith('http'));
      
      if (paths.length === 0) return;
      
      const urls = await getSignedUrls('media', paths);
      setSignedUrls(prev => new Map([...prev, ...urls]));
    };

    fetchUrls();
  }, [paginatedMedia?.items]);

  const getMediaUrl = (item: { storage_path?: string | null; file_url: string }) => {
    const path = item.storage_path || item.file_url;
    if (path.startsWith('http')) return path;
    return signedUrls.get(path) || null;
  };

  const deleteMedia = useDeleteMedia();
  const deleteMediaMutation = {
    mutate: (id: string) =>
      deleteMedia.mutate(id, { onSuccess: () => toast({ title: 'Media deleted' }) }),
  };

  const deleteRecording = useDeleteRecording();
  const deleteRecordingMutation = {
    mutate: (id: string) =>
      deleteRecording.mutate(id, { onSuccess: () => toast({ title: 'Recording deleted' }) }),
  };

  const handlePlayRecording = async (recording: Recording) => {
    const path = recording.file_url;
    if (path.startsWith('http')) {
      window.open(path, '_blank');
      return;
    }
    const url = await getSignedUrl('recordings', path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({ title: 'Failed to access recording', variant: 'destructive' });
    }
  };

  const handleOpenFolder = (folder: { profileId: string; firstName: string; lastName: string | null }) => {
    setSelectedContactId(folder.profileId);
    setSelectedContactName(`${folder.firstName} ${folder.lastName || ''}`.trim());
    setCurrentPage(1);
    setSearchQuery('');
    setTypeFilter('all');
  };

  const handleBackToFolders = () => {
    setSelectedContactId(null);
    setSelectedContactName('');
    setCurrentPage(1);
  };

  const handleOpenLightbox = async (item: Media) => {
    const url = getMediaUrl(item);
    if (url) {
      setLightboxItem({ url, mimeType: item.mime_type });
    }
  };

  const recordingFolders = ['all', 'meetings', 'general', 'interviews', 'screenings'];
  const filteredRecordings = recordings?.filter(r => 
    selectedFolder === 'all' || r.folder === selectedFolder
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Transcribed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPages = Math.ceil((paginatedMedia?.totalCount || 0) / itemsPerPage);

  const renderMediaGrid = () => {
    if (!paginatedMedia?.items) return null;
    
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {paginatedMedia.items.map((item) => {
          const url = getMediaUrl(item);
          const isAudio = item.mime_type?.startsWith('audio/');
          const isVideo = item.mime_type?.startsWith('video/');
          
          return (
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => handleOpenLightbox(item)}
            >
              <div className="aspect-square bg-muted relative">
                {isAudio ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
                    <Music className="h-12 w-12 text-primary mb-2" />
                    <span className="text-xs text-muted-foreground">Audio</span>
                  </div>
                ) : url ? (
                  <>
                    <img 
                      src={url} 
                      alt={item.caption || ''} 
                      className="w-full h-full object-cover"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-primary ml-1" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground animate-pulse" />
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this media?')) {
                      deleteMediaMutation.mutate(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                {item.caption && (
                  <p className="text-sm font-medium truncate">{item.caption}</p>
                )}
                {item.profiles && (
                  <p className="text-xs text-muted-foreground">
                    {item.profiles.first_name} {item.profiles.last_name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'PP')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMediaList = () => {
    if (!paginatedMedia?.items) return null;
    
    return (
      <div className="space-y-2">
        {paginatedMedia.items.map((item) => {
          const url = getMediaUrl(item);
          const isAudio = item.mime_type?.startsWith('audio/');
          const isVideo = item.mime_type?.startsWith('video/');
          
          return (
            <Card 
              key={item.id} 
              className="hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => handleOpenLightbox(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {isAudio ? (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                    ) : url ? (
                      <div className="relative h-full w-full">
                        <img src={url} alt={item.caption || ''} className="w-full h-full object-cover" />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.caption || 'Untitled'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.profiles && (
                        <span>{item.profiles.first_name} {item.profiles.last_name}</span>
                      )}
                      <span>•</span>
                      <span>{format(new Date(item.created_at), 'PP')}</span>
                      {item.mime_type && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {item.mime_type.split('/')[0]}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this media?')) {
                        deleteMediaMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout title="Media & Recordings" showQuickCapture>
      <Tabs defaultValue="media" className="space-y-6">
        <TabsList>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media Gallery
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Recordings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-6">
          {/* Folder View or Files View */}
          {selectedContactId === null && viewMode === 'folders' ? (
            <>
              {/* Folders Header */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={folderSearchQuery}
                      onChange={(e) => setFolderSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {folders?.length || 0} contacts with media
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                  </Button>
                  <Button onClick={() => setIsUploadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Media
                  </Button>
                </div>
              </div>

              {/* Folders Grid */}
              {foldersLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredFolders && filteredFolders.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredFolders.map((folder) => (
                    <ContactFolderCard
                      key={folder.profileId}
                      name={`${folder.firstName} ${folder.lastName || ''}`.trim()}
                      totalFiles={folder.totalFiles}
                      counts={{
                        images: folder.imageCount,
                        audio: folder.audioCount,
                        video: folder.videoCount,
                      }}
                      onClick={() => handleOpenFolder(folder)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Images className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No media yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Upload photos and images to build a visual memory of your relationships.
                    </p>
                    <Button onClick={() => setIsUploadOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Your First Image
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Breadcrumb */}
              {selectedContactId && (
                <FolderBreadcrumb
                  contactName={selectedContactName}
                  onBackToFolders={handleBackToFolders}
                />
              )}

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by caption..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={String(itemsPerPage)} onValueChange={(v) => { updateMainMediaItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="96">96</SelectItem>
                  </SelectContent>
                </Select>

                <ToggleGroup type="single" value={viewMode === 'folders' ? 'grid' : viewMode} onValueChange={(v) => v && updateMainMediaViewMode(v as MainViewMode)}>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>

                {selectedContactId && (
                  <Button variant="outline" size="sm" onClick={handleBackToFolders}>
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    All Folders
                  </Button>
                )}

                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>

              {/* Total count */}
              <p className="text-sm text-muted-foreground">
                {paginatedMedia?.totalCount || 0} items
              </p>

              {/* Media Content */}
              {mediaLoading ? (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(itemsPerPage > 12 ? 12 : itemsPerPage)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : paginatedMedia?.items && paginatedMedia.items.length > 0 ? (
                <>
                  {viewMode === 'list' ? renderMediaList() : renderMediaGrid()}
                  
                  <FilePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={paginatedMedia.totalCount}
                    itemsPerPage={itemsPerPage}
                  />
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Images className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No media found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchQuery || typeFilter !== 'all' 
                        ? 'Try adjusting your search or filters.'
                        : 'Upload photos and images to get started.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="recordings" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                Meeting recordings and transcriptions
              </p>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-40">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordingFolders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder.charAt(0).toUpperCase() + folder.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </Button>
              <Button onClick={() => setIsRecordingUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Recording
              </Button>
            </div>
          </div>

          {recordingsLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRecordings && filteredRecordings.length > 0 ? (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <Card key={recording.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                        <FileAudio className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{recording.title}</h4>
                          {getStatusBadge(recording.status)}
                          <Badge variant="outline" className="text-xs capitalize">
                            {recording.folder}
                          </Badge>
                        </div>
                        {recording.description && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {recording.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {recording.profiles && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {recording.profiles.first_name} {recording.profiles.last_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(recording.duration_seconds)}
                          </span>
                          <span>{format(new Date(recording.created_at), 'PP')}</span>
                        </div>
                        {recording.transcription && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                            "{recording.transcription.slice(0, 200)}..."
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handlePlayRecording(recording)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this recording?')) {
                              deleteRecordingMutation.mutate(recording.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload meeting recordings from your DJI Mic or other devices to have them transcribed.
                </p>
                <Button onClick={() => setIsRecordingUploadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Recording
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxItem} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80"
            onClick={() => setLightboxItem(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {lightboxItem?.mimeType?.startsWith('video/') ? (
            <video
              src={lightboxItem.url}
              controls
              autoPlay
              className="w-full max-h-[80vh]"
            />
          ) : lightboxItem?.mimeType?.startsWith('audio/') ? (
            <div className="bg-muted p-12 flex flex-col items-center gap-6">
              <Music className="h-24 w-24 text-primary" />
              <audio src={lightboxItem.url} controls autoPlay className="w-full max-w-md" />
            </div>
          ) : (
            <img
              src={lightboxItem?.url}
              alt=""
              className="w-full max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <MediaUpload open={isUploadOpen} onOpenChange={setIsUploadOpen} />
      <RecordingUpload open={isRecordingUploadOpen} onOpenChange={setIsRecordingUploadOpen} />
      <BulkUploadDialog 
        open={isBulkUploadOpen} 
        onOpenChange={setIsBulkUploadOpen}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['media-paginated'] });
          queryClient.invalidateQueries({ queryKey: ['media-folders'] });
          queryClient.invalidateQueries({ queryKey: ['recordings'] });
        }}
      />
    </AppLayout>
  );
}
