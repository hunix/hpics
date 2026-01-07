import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ContactDialog } from '@/components/contacts/ContactDialog';
import { ContactsToolbar, ViewMode, SortOption } from '@/components/contacts/ContactsToolbar';
import { ContactsCardsView } from '@/components/contacts/ContactsCardsView';
import { ContactsTableView } from '@/components/contacts/ContactsTableView';
import { ContactsListView } from '@/components/contacts/ContactsListView';
import { ContactsAvatarsView } from '@/components/contacts/ContactsAvatarsView';
import { VirtualizedContactsList } from '@/components/contacts/VirtualizedContactsList';
import { VirtualizedContactsGrid } from '@/components/contacts/VirtualizedContactsGrid';
import { AlphabeticalSidebar } from '@/components/contacts/AlphabeticalSidebar';
import { BulkDeleteDialog } from '@/components/contacts/BulkDeleteDialog';
import { toast } from 'sonner';
import { getSubtypesForRelationship } from '@/lib/relationshipSubtypes';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { 
  useEnhancedContacts, 
  useContactLetterCounts, 
  useContactFilterOptions,
  type SortBy 
} from '@/hooks/useEnhancedContacts';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { 
  relationship_subtype?: string; 
  hierarchy_level?: string;
  country?: string | null;
};

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

  // Server-side data fetching
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEnhancedContacts({
    searchQuery: debouncedSearch || undefined,
    relationshipFilter,
    subtypeFilter,
    tagFilter,
    favoriteFilter: favoriteFilter || undefined,
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

  // Letter counts for sidebar
  const { data: letterCounts = [] } = useContactLetterCounts();

  // Filter options
  const { data: filterOptions } = useContactFilterOptions();
  const availableRelationships = filterOptions?.relationships ?? [];
  const availableTags = filterOptions?.tags ?? [];

  const availableSubtypes = useMemo(() => {
    if (!relationshipFilter) return [];
    return getSubtypesForRelationship(relationshipFilter);
  }, [relationshipFilter]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      trackBulkOperation('bulk_delete_contacts', ids.length);
      
      // Delete all related data for each contact
      await supabase.from('ai_analyses').delete().in('profile_id', ids);
      await supabase.from('behavioral_analyses').delete().in('profile_id', ids);
      await supabase.from('body_language_analyses').delete().in('profile_id', ids);
      await supabase.from('facial_analyses').delete().in('profile_id', ids);
      await supabase.from('certifications').delete().in('profile_id', ids);
      await supabase.from('communications').delete().in('profile_id', ids);
      await supabase.from('contact_bank_accounts').delete().in('profile_id', ids);
      await supabase.from('contact_devices').delete().in('profile_id', ids);
      await supabase.from('contact_financial_history').delete().in('profile_id', ids);
      await supabase.from('contact_graduations').delete().in('profile_id', ids);
      await supabase.from('contact_group_members').delete().in('profile_id', ids);
      await supabase.from('contact_identity_documents').delete().in('profile_id', ids);
      await supabase.from('contact_interests').delete().in('profile_id', ids);
      await supabase.from('contact_languages').delete().in('profile_id', ids);
      await supabase.from('contact_methods').delete().in('profile_id', ids);
      await supabase.from('contact_observations').delete().in('profile_id', ids);
      await supabase.from('contact_payment_accounts').delete().in('profile_id', ids);
      await supabase.from('contact_personal_info').delete().in('profile_id', ids);
      await supabase.from('contact_properties').delete().in('profile_id', ids);
      await supabase.from('contact_residences').delete().in('profile_id', ids);
      await supabase.from('contact_skills').delete().in('profile_id', ids);
      await supabase.from('contact_travel_history').delete().in('profile_id', ids);
      await supabase.from('contact_vehicles').delete().in('profile_id', ids);
      await supabase.from('conversations').delete().in('profile_id', ids);
      await supabase.from('documents').delete().in('profile_id', ids);
      await supabase.from('education').delete().in('profile_id', ids);
      await supabase.from('events').delete().in('profile_id', ids);
      await supabase.from('gift_ideas').delete().in('profile_id', ids);
      await supabase.from('media').delete().in('profile_id', ids);
      await supabase.from('meeting_recordings').delete().in('profile_id', ids);
      await supabase.from('relationship_goals').delete().in('profile_id', ids);
      await supabase.from('analysis_sessions').delete().in('profile_id', ids);
      await supabase.from('contact_kids_schools').delete().in('profile_id', ids);
      await supabase.from('contact_relationships').delete().in('from_profile_id', ids);
      await supabase.from('contact_relationships').delete().in('to_profile_id', ids);

      const { error } = await supabase.from('profiles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} contact${ids.length > 1 ? 's' : ''} successfully`);
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-letter-counts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      toast.error('Failed to delete contacts: ' + (error as Error).message);
    },
  });

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

    // Always use virtualized views for server-side pagination
    const viewContent = (() => {
      switch (viewMode) {
        case 'table':
        case 'list':
          return (
            <VirtualizedContactsList
              contacts={contacts as unknown as Profile[]}
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
              contacts={contacts as unknown as Profile[]}
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

  return (
    <AppLayout title="Contacts">
      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 space-y-6">
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
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['enhanced-contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contact-letter-counts'] });
            queryClient.invalidateQueries({ queryKey: ['contact-filter-options'] });
          }
        }}
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
