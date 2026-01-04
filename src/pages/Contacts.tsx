import { useState, useMemo, useEffect } from 'react';
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
import { BulkDeleteDialog } from '@/components/contacts/BulkDeleteDialog';
import { toast } from 'sonner';
import { getSubtypesForRelationship } from '@/lib/relationshipSubtypes';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & { relationship_subtype?: string; hierarchy_level?: string };

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });

  // Derive available filters from data
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

  // Get available subtypes based on selected relationship type
  const availableSubtypes = useMemo(() => {
    if (!relationshipFilter) return [];
    return getSubtypesForRelationship(relationshipFilter);
  }, [relationshipFilter]);

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    if (!contacts) return [];
    
    let result = [...contacts];
    
    // Apply search - now includes relationship_type and relationship_subtype
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.first_name?.toLowerCase().includes(query) ||
        c.last_name?.toLowerCase().includes(query) ||
        c.organization?.toLowerCase().includes(query) ||
        c.job_title?.toLowerCase().includes(query) ||
        c.relationship_type?.toLowerCase().includes(query) ||
        c.relationship_subtype?.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (relationshipFilter) {
      result = result.filter(c => c.relationship_type === relationshipFilter);
    }
    if (subtypeFilter) {
      result = result.filter(c => c.relationship_subtype === subtypeFilter);
    }
    if (tagFilter) {
      result = result.filter(c => c.tags?.includes(tagFilter));
    }
    if (favoriteFilter) {
      result = result.filter(c => c.is_favorite);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          return aName.localeCompare(bName);
        });
        break;
      case 'name-desc':
        result.sort((a, b) => {
          const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
          const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
          return bName.localeCompare(aName);
        });
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'organization':
        result.sort((a, b) => (a.organization || '').localeCompare(b.organization || ''));
        break;
      case 'relationship':
        result.sort((a, b) => (a.relationship_type || '').localeCompare(b.relationship_type || ''));
        break;
    }
    
    // Favorites always on top for some sort options
    if (['name-asc', 'name-desc'].includes(sortOption)) {
      result.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
    }
    
    return result;
  }, [contacts, searchQuery, relationshipFilter, subtypeFilter, tagFilter, favoriteFilter, sortOption]);

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
      // Delete all related data for each contact
      // The order matters due to foreign key constraints
      
      // Delete from each related table
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

      // Finally delete the profiles themselves
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', ids);
      
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

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredAndSortedContacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

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
