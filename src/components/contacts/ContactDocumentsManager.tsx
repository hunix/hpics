import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Trash2, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DocumentUpload } from '@/components/uploads/DocumentUpload';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import { FileManagerToolbar, type FilterOption } from './FileManagerToolbar';
import { DocumentsGridView } from './DocumentsGridView';
import { DocumentsDetailView } from './DocumentsDetailView';
import { FilePagination } from './FilePagination';
import { useFileViewPreferences, type ViewMode } from '@/hooks/useFileViewPreferences';

interface ContactDocumentsManagerProps {
  profileId: string;
  contactName: string;
}

const DOCUMENT_TYPES = ['resume', 'contract', 'presentation', 'notes', 'article', 'other'];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'name', label: 'By title' },
  { value: 'type', label: 'By type' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
];

const TYPE_COLORS: Record<string, string> = {
  resume: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contract: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  presentation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  notes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  article: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function ContactDocumentsManager({ profileId, contactName }: ContactDocumentsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences, updateDocumentsViewMode, updateDocumentsItemsPerPage } = useFileViewPreferences();
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(0);

  const viewMode = preferences.documents_view_mode as ViewMode;
  const itemsPerPage = preferences.documents_items_per_page;

  const { data: allDocuments, isLoading } = useQuery({
    queryKey: ['contact-documents', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
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
    if (!allDocuments) return [];
    const counts: Record<string, number> = {};
    DOCUMENT_TYPES.forEach(t => counts[t] = 0);
    allDocuments.forEach(doc => {
      if (counts[doc.document_type] !== undefined) {
        counts[doc.document_type]++;
      } else {
        counts.other++;
      }
    });
    return DOCUMENT_TYPES
      .map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1), count: counts[type] }))
      .filter(o => o.count > 0);
  }, [allDocuments]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    if (!allDocuments) return [];
    
    let result = [...allDocuments];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.title?.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q)
      );
    }
    
    // Type filter
    if (typeFilter) {
      result = result.filter(doc => doc.document_type === typeFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'type':
          return a.document_type.localeCompare(b.document_type);
        case 'size-desc':
          return (b.file_size || 0) - (a.file_size || 0);
        case 'size-asc':
          return (a.file_size || 0) - (b.file_size || 0);
        case 'date-desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return result;
  }, [allDocuments, searchQuery, typeFilter, sortOption]);

  // Paginate
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredDocuments.slice(start, start + itemsPerPage);
  }, [filteredDocuments, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, typeFilter, itemsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-documents', profileId] });
      toast({ title: 'Document deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting document', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpenDocument = async (doc: { id: string; storage_path?: string | null; file_url: string }) => {
    setDownloadingId(doc.id);
    try {
      const path = doc.storage_path || doc.file_url;
      const url = await getSignedUrl('documents', path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({ title: 'Failed to access document', variant: 'destructive' });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const renderListView = () => (
    <div className="space-y-3">
      {paginatedDocuments.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{doc.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className={TYPE_COLORS[doc.document_type] || TYPE_COLORS.other}>
                  {doc.document_type}
                </Badge>
                <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                {doc.file_size && (
                  <span>• {(doc.file_size / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={downloadingId === doc.id}
              onClick={() => handleOpenDocument(doc)}
            >
              {downloadingId === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm('Delete this document?')) {
                  handleDelete(doc.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>Files and documents related to {contactName}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </CardHeader>
        <CardContent>
          {allDocuments && allDocuments.length > 0 ? (
            <>
              <FileManagerToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={updateDocumentsViewMode}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                sortOption={sortOption}
                onSortChange={setSortOption}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={updateDocumentsItemsPerPage}
                filterOptions={filterOptions}
                sortOptions={SORT_OPTIONS}
                totalItems={filteredDocuments.length}
              />

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documents match your filters</p>
                </div>
              ) : (
                <>
                  {viewMode === 'list' && renderListView()}
                  {viewMode === 'grid' && (
                    <DocumentsGridView
                      items={paginatedDocuments}
                      onOpen={handleOpenDocument}
                      onDelete={handleDelete}
                      downloadingId={downloadingId}
                      typeColors={TYPE_COLORS}
                    />
                  )}
                  {viewMode === 'detail' && (
                    <DocumentsDetailView
                      items={paginatedDocuments}
                      onOpen={handleOpenDocument}
                      onDelete={handleDelete}
                      downloadingId={downloadingId}
                      typeColors={TYPE_COLORS}
                    />
                  )}
                  <FilePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredDocuments.length}
                    itemsPerPage={itemsPerPage}
                  />
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No documents yet</p>
              <p className="text-sm">Upload documents related to this contact</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUpload
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        preselectedProfileId={profileId}
        preselectedProfileName={contactName}
      />
    </>
  );
}
