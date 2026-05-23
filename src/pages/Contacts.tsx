import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { useBulkDeleteContacts } from '@/hooks/contacts/useBulkDeleteContacts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ContactDialog } from '@/components/contacts/ContactDialog';
import { ContactsToolbar, ViewMode, SortOption } from '@/components/contacts/ContactsToolbar';
import { VirtualizedContactsList } from '@/components/contacts/VirtualizedContactsList';
import { VirtualizedContactsGrid } from '@/components/contacts/VirtualizedContactsGrid';
import { AlphabeticalSidebar } from '@/components/contacts/AlphabeticalSidebar';
import { BulkDeleteDialog } from '@/components/contacts/BulkDeleteDialog';
import { MobileContactsList } from '@/components/contacts/MobileContactsList';
import { toast } from 'sonner';
import { getSubtypesForRelationship } from '@/lib/relationshipSubtypes';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { 
  useContactsInfinite, 
  useLetterCounts, 
  useFilterOptions,
  useContactCounts,
  useToggleFavoriteById,
  profileKeys,
  type EnhancedContactRow,
} from '@/domains/profile';
import type { Profile as BaseProfile } from '@/types/database-helpers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookUser } from 'lucide-react';

type Profile = BaseProfile & { 
  relationship_subtype?: string; 
  hierarchy_level?: string;
  country?: string | null;
};

type SortBy = 'name' | 'recent' | 'oldest' | 'organization' | 'relationship' | 'engagement';

// Map toolbar sort options to server-side params
const sortOptionMap: Record<SortOption, { sortBy: SortBy; sortOrder: 'asc' | 'desc' }> = {
  'name-asc': { sortBy: 'name', sortOrder: 'asc' },
  'name-desc': { sortBy: 'name', sortOrder: 'desc' },
  'recent': { sortBy: 'recent', sortOrder: 'desc' },
  'oldest': { sortBy: 'oldest', sortOrder: 'asc' },
  'organization': { sortBy: 'organization', sortOrder: 'asc' },
  'relationship': { sortBy: 'relationship', sortOrder: 'asc' },
};

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { trackBulkOperation } = useSecurityMonitor();
  const { deviceType } = useDeviceDetection();
  const isMobile = deviceType === 'mobile';
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Filters
  const [relationshipFilter, setRelationshipFilter] = useState<string | null>(null);
  const [subtypeFilter, setSubtypeFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(true); // Default to active contacts only

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear subtype filter when relationship filter changes
  useEffect(() => {
    setSubtypeFilter(null);
  }, [relationshipFilter]);

  // Get sort params
  const { sortBy, sortOrder } = sortOptionMap[sortOption];

  // Server-side data fetching using domain hooks
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContactsInfinite({
    searchQuery: debouncedSearch || undefined,
    relationshipFilter,
    subtypeFilter,
    tagFilter,
    favoriteFilter: favoriteFilter || undefined,
    activeFilter,
    letterFilter,
    sortBy,
    sortOrder,
    pageSize: 50,
  });

  // Flatten paginated results
  const contacts = useMemo(() => {
    return data?.pages.flatMap((page) => page.contacts) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Letter counts for sidebar - using domain hook
  const { data: letterCounts = [] } = useLetterCounts();
  
  // Active contact counts - using domain hook
  const { data: activeCounts } = useContactCounts();

  // Filter options - using domain hook
  const { data: filterOptions } = useFilterOptions();
  const availableRelationships = filterOptions?.relationships ?? [];
  const availableTags = filterOptions?.tags ?? [];

  const availableSubtypes = useMemo(() => {
    if (!relationshipFilter) return [];
    return getSubtypesForRelationship(relationshipFilter);
  }, [relationshipFilter]);

  // Toggle favorite using domain hook
  const toggleFavoriteMutation = useToggleFavoriteById();

  const bulkDeleteHook = useBulkDeleteContacts();
  const bulkDeleteMutation = {
    isPending: bulkDeleteHook.isPending,
    mutate: (ids: string[]) => {
      trackBulkOperation('bulk_delete_contacts', ids.length);
      bulkDeleteHook.mutate(ids, {
        onSuccess: () => {
          toast.success(`Deleted ${ids.length} contact${ids.length > 1 ? 's' : ''} successfully`);
          setSelectedIds(new Set());
          setIsDeleteDialogOpen(false);
        },
        onError: (error: Error) => toast.error(`Delete failed: ${error.message}`),
      });
    },
  };
  // Suppress the old useMutation onSuccess inline tail — the hook handles invalidation.
  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [contacts]);

  const relationshipColors: Record<string, string> = {
    family: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    friend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    colleague: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    client: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    mentor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    mentee: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    acquaintance: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const renderContactsView = () => {
    if (isError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load contacts</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {(error as Error)?.message || 'An unexpected error occurred while loading your contacts.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!contacts.length) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {totalCount > 0 ? 'No contacts match your filters' : 'No contacts yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {totalCount > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Start building your personal CRM by adding your first contact.'}
            </p>
            {totalCount === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    // Map EnhancedContactRow to Profile type for virtualized views
    const mappedContacts = contacts.map((c: EnhancedContactRow) => ({
      ...c,
      user_id: user?.id || '',
    })) as unknown as Profile[];

    // Always use virtualized views for server-side pagination
    const viewContent = (() => {
      switch (viewMode) {
        case 'table':
        case 'list':
          return (
            <VirtualizedContactsList
              contacts={mappedContacts}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
              relationshipColors={relationshipColors}
              viewMode={viewMode}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              totalCount={totalCount}
            />
          );
        case 'avatars':
        case 'cards':
        default:
          return (
            <VirtualizedContactsGrid
              contacts={mappedContacts}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
              relationshipColors={relationshipColors}
              columns={viewMode === 'avatars' ? 6 : 3}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              totalCount={totalCount}
            />
          );
      }
    })();

    return viewContent;
  };

  // Invalidate handler for dialog close
  const handleDialogClose = useCallback((open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      // Use domain query keys for invalidation
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    }
  }, [queryClient]);

  // Mobile view
  if (isMobile) {
    return (
      <AppLayout title="Contacts" showQuickCapture>
        <MobileContactsList
          contacts={contacts.map(c => ({
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            organization: c.organization,
            avatar_url: c.avatar_url,
            is_favorite: c.is_favorite,
            relationship_type: c.relationship_type,
            tags: c.tags,
          }))}
          onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          onAddContact={() => setIsCreateDialogOpen(true)}
        />
        <ContactDialog
          open={isCreateDialogOpen}
          onOpenChange={handleDialogClose}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Contacts" showQuickCapture>
      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Active/Address Book Toggle */}
          <Tabs 
            value={activeFilter === true ? 'active' : activeFilter === false ? 'addressbook' : 'all'} 
            onValueChange={(v) => setActiveFilter(v === 'active' ? true : v === 'addressbook' ? false : null)}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Active ({activeCounts?.active ?? 0})
              </TabsTrigger>
              <TabsTrigger value="addressbook" className="flex items-center gap-2">
                <BookUser className="h-4 w-4" />
                Address Book ({activeCounts?.inactive ?? 0})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({activeCounts?.total ?? 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ContactsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortOption={sortOption}
            onSortChange={setSortOption}
            selectedCount={selectedIds.size}
            onBulkDelete={() => setIsDeleteDialogOpen(true)}
            onImport={() => navigate('/import')}
            onAddContact={() => setIsCreateDialogOpen(true)}
            relationshipFilter={relationshipFilter}
            onRelationshipFilterChange={setRelationshipFilter}
            subtypeFilter={subtypeFilter}
            onSubtypeFilterChange={setSubtypeFilter}
            availableSubtypes={availableSubtypes}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            favoriteFilter={favoriteFilter}
            onFavoriteFilterChange={setFavoriteFilter}
            availableRelationships={availableRelationships}
            availableTags={availableTags}
          />

          {renderContactsView()}
        </div>

        {/* Alphabetical sidebar - hidden on mobile */}
        <div className="hidden lg:block sticky top-20 h-fit">
          <AlphabeticalSidebar
            letterCounts={letterCounts}
            activeLetter={letterFilter}
            onLetterClick={setLetterFilter}
          />
        </div>
      </div>

      <ContactDialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <BulkDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        isDeleting={bulkDeleteMutation.isPending}
      />
    </AppLayout>
  );
}
