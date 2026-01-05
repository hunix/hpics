import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { BulkDeleteDialog } from '@/components/contacts/BulkDeleteDialog';
import { toast } from 'sonner';
import { getSubtypesForRelationship } from '@/lib/relationshipSubtypes';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { 
  relationship_subtype?: string; 
  hierarchy_level?: string;
  country?: string | null;
};

// Threshold for switching to virtualized view
const VIRTUALIZATION_THRESHOLD = 100;

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { trackBulkOperation } = useSecurityMonitor();
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
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

  // Clear subtype filter when relationship filter changes
  useEffect(() => {
    setSubtypeFilter(null);
  }, [relationshipFilter]);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      // Optimized query - fetch profiles and personal info in parallel
      const [profilesResult, personalInfoResult] = await Promise.all([
        // Fetch all profiles with pagination
        (async () => {
          let allProfiles: any[] = [];
          let page = 0;
          const pageSize = 1000;
          
          while (true) {
            const { data: profiles, error } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, organization, job_title, relationship_type, relationship_subtype, hierarchy_level, tags, avatar_url, is_favorite, created_at')
              .eq('user_id', user!.id)
              .order('first_name', { ascending: true })
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            if (!profiles || profiles.length === 0) break;
            
            allProfiles = [...allProfiles, ...profiles];
            if (profiles.length < pageSize) break;
            page++;
          }
          return allProfiles;
        })(),
        
        // Fetch personal info for countries
        supabase
          .from('contact_personal_info')
          .select('profile_id, main_residence_country')
          .eq('user_id', user!.id),
      ]);
      
      const countryMap = new Map(
        personalInfoResult.data?.map(p => [p.profile_id, p.main_residence_country]) || []
      );
      
      return profilesResult.map(p => ({
        ...p,
        country: countryMap.get(p.id) || null,
      })) as Profile[];
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Derive available filters from data - memoized
  const availableRelationships = useMemo(() => {
    if (!contacts) return [];
    const types = new Set(contacts.map(c => c.relationship_type).filter(Boolean));
    return Array.from(types) as string[];
  }, [contacts]);

  const availableTags = useMemo(() => {
    if (!contacts) return [];
    const tags = new Set(contacts.flatMap(c => c.tags || []));
    return Array.from(tags);
  }, [contacts]);

  const availableSubtypes = useMemo(() => {
    if (!relationshipFilter) return [];
    return getSubtypesForRelationship(relationshipFilter);
  }, [relationshipFilter]);

  // Optimized filter and sort with memoization
  const filteredAndSortedContacts = useMemo(() => {
    if (!contacts) return [];
    
    let result = contacts;
    
    // Apply filters (creates new array only when needed)
    if (searchQuery || relationshipFilter || subtypeFilter || tagFilter || favoriteFilter) {
      result = contacts.filter(c => {
        // Search filter - multi-word matching
        if (searchQuery) {
          const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
          const contactText = [
            c.first_name,
            c.last_name,
            c.organization,
            c.job_title,
            c.relationship_type,
            c.relationship_subtype
          ].filter(Boolean).join(' ').toLowerCase();
          
          const matches = searchTerms.every(term => contactText.includes(term));
          if (!matches) return false;
        }
        
        // Relationship filter
        if (relationshipFilter && c.relationship_type !== relationshipFilter) return false;
        
        // Subtype filter
        if (subtypeFilter && c.relationship_subtype !== subtypeFilter) return false;
        
        // Tag filter
        if (tagFilter && !c.tags?.includes(tagFilter)) return false;
        
        // Favorite filter
        if (favoriteFilter && !c.is_favorite) return false;
        
        return true;
      });
    }
    
    // Sort (only if needed)
    const sorted = [...result];
    
    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          return aName.localeCompare(bName);
        });
        break;
      case 'name-desc':
        sorted.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          return bName.localeCompare(aName);
        });
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'organization':
        sorted.sort((a, b) => (a.organization || '').localeCompare(b.organization || ''));
        break;
      case 'relationship':
        sorted.sort((a, b) => (a.relationship_type || '').localeCompare(b.relationship_type || ''));
        break;
    }
    
    // Favorites on top for name sorts
    if (['name-asc', 'name-desc'].includes(sortOption)) {
      sorted.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
    }
    
    return sorted;
  }, [contacts, searchQuery, relationshipFilter, subtypeFilter, tagFilter, favoriteFilter, sortOption]);

  // Check if we should use virtualization
  const useVirtualization = useMemo(() => {
    return filteredAndSortedContacts.length > VIRTUALIZATION_THRESHOLD;
  }, [filteredAndSortedContacts.length]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Security monitoring for bulk operations
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

      // Finally delete profiles
      const { error } = await supabase.from('profiles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} contact${ids.length > 1 ? 's' : ''} successfully`);
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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
      setSelectedIds(new Set(filteredAndSortedContacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredAndSortedContacts]);

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

    if (!filteredAndSortedContacts.length) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {contacts?.length ? 'No contacts match your filters' : 'No contacts yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {contacts?.length 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Start building your personal CRM by adding your first contact.'}
            </p>
            {!contacts?.length && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    // Use virtualized views for large datasets
    if (useVirtualization) {
      switch (viewMode) {
        case 'table':
        case 'list':
          return (
            <VirtualizedContactsList
              contacts={filteredAndSortedContacts}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
              relationshipColors={relationshipColors}
              viewMode={viewMode}
            />
          );
        case 'avatars':
        case 'cards':
        default:
          return (
            <VirtualizedContactsGrid
              contacts={filteredAndSortedContacts}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
              relationshipColors={relationshipColors}
              columns={viewMode === 'avatars' ? 6 : 3}
            />
          );
      }
    }

    // Standard views for smaller datasets
    switch (viewMode) {
      case 'table':
        return (
          <ContactsTableView
            contacts={filteredAndSortedContacts}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
            relationshipColors={relationshipColors}
          />
        );
      case 'list':
        return (
          <ContactsListView
            contacts={filteredAndSortedContacts}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
            relationshipColors={relationshipColors}
          />
        );
      case 'avatars':
        return (
          <ContactsAvatarsView
            contacts={filteredAndSortedContacts}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
            relationshipColors={relationshipColors}
          />
        );
      case 'cards':
      default:
        return (
          <ContactsCardsView
            contacts={filteredAndSortedContacts}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onToggleFavorite={(id, isFav) => toggleFavoriteMutation.mutate({ id, isFavorite: isFav })}
            relationshipColors={relationshipColors}
          />
        );
    }
  };

  return (
    <AppLayout title="Contacts">
      <div className="space-y-6">
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

      <ContactDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
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
