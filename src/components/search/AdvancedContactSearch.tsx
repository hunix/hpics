import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { fuzzySearch, rankByRelevance } from '@/lib/fuzzySearch';
import { 
  Search, Filter, Save, Star, Trash2, Clock, Users, 
  Building2, MapPin, X, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  is_pinned: boolean;
  use_count: number;
}

interface SearchFilters {
  query: string;
  relationshipType: string;
  organization: string;
  location: string;
  groupId: string;
  sortBy: 'name' | 'score' | 'lastContact' | 'created';
  fuzzyEnabled: boolean;
}

const defaultFilters: SearchFilters = {
  query: '',
  relationshipType: '',
  organization: '',
  location: '',
  groupId: '',
  sortBy: 'name',
  fuzzyEnabled: true,
};

export function AdvancedContactSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch saved searches
  const { data: savedSearches } = useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_pinned', { ascending: false })
        .order('use_count', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        filters: d.filters as SearchFilters,
      })) as SavedSearch[];
    },
    enabled: !!user,
  });

  // Fetch groups for filter
  const { data: groups } = useQuery({
    queryKey: ['contact-groups-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_groups')
        .select('id, name')
        .eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Search contacts
  const { data: results, isLoading: isSearching } = useQuery({
    queryKey: ['advanced-search', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, organization, job_title, 
          address, country, relationship_type, relationship_score, 
          last_contacted_at, avatar_url, created_at
        `)
        .eq('user_id', user!.id);

      // Apply filters
      if (filters.relationshipType) {
        query = query.eq('relationship_type', filters.relationshipType);
      }

      if (filters.organization) {
        query = query.ilike('organization', `%${filters.organization}%`);
      }

      if (filters.location) {
        query = query.or(`address.ilike.%${filters.location}%,country.ilike.%${filters.location}%`);
      }

      const { data: contacts } = await query.limit(100);

      if (!contacts) return [];

      // Filter by group membership if needed
      let filteredContacts = contacts;
      if (filters.groupId) {
        const { data: members } = await supabase
          .from('contact_group_members')
          .select('profile_id')
          .eq('group_id', filters.groupId);

        const memberIds = new Set((members || []).map(m => m.profile_id));
        filteredContacts = contacts.filter(c => memberIds.has(c.id));
      }

      // Apply text search with fuzzy matching
      if (filters.query) {
        if (filters.fuzzyEnabled) {
          filteredContacts = fuzzySearch(filteredContacts, filters.query, {
            keys: ['first_name', 'last_name', 'organization', 'job_title'],
            threshold: 0.6,
          });
          filteredContacts = rankByRelevance(filteredContacts, filters.query, [
            'first_name', 'last_name', 'organization',
          ]);
        } else {
          const queryLower = filters.query.toLowerCase();
          filteredContacts = filteredContacts.filter(c => {
            const fullText = [c.first_name, c.last_name, c.organization, c.job_title]
              .filter(Boolean).join(' ').toLowerCase();
            return fullText.includes(queryLower);
          });
        }
      }

      // Sort results
      switch (filters.sortBy) {
        case 'score':
          filteredContacts.sort((a, b) => (b.relationship_score || 0) - (a.relationship_score || 0));
          break;
        case 'lastContact':
          filteredContacts.sort((a, b) => {
            const dateA = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
            const dateB = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
            return dateB - dateA;
          });
          break;
        case 'created':
          filteredContacts.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          break;
        default:
          filteredContacts.sort((a, b) => {
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
      }

      return filteredContacts;
    },
    enabled: !!user && open,
  });

  // Save search mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user!.id,
        name: searchName,
        filters: filters as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Search saved!');
      setShowSaveDialog(false);
      setSearchName('');
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete saved search
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  // Apply saved search
  const applySavedSearch = async (search: SavedSearch) => {
    setFilters(search.filters);
    
    // Increment use count
    await supabase
      .from('saved_searches')
      .update({ use_count: search.use_count + 1 })
      .eq('id', search.id);
  };

  const handleSelectContact = (contactId: string) => {
    setOpen(false);
    navigate(`/contacts/${contactId}`);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = filters.query || filters.relationshipType || 
    filters.organization || filters.location || filters.groupId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Advanced Search
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
            ⌘⇧F
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Contact Search
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {/* Saved Searches */}
          <div className="col-span-1 border-r pr-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Searches
            </h4>
            <ScrollArea className="h-[200px]">
              {savedSearches && savedSearches.length > 0 ? (
                <div className="space-y-1">
                  {savedSearches.map(search => (
                    <div 
                      key={search.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                      onClick={() => applySavedSearch(search)}
                    >
                      <div className="flex items-center gap-2">
                        {search.is_pinned && <Star className="h-3 w-3 text-yellow-500" />}
                        <span className="text-sm truncate max-w-[120px]">{search.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(search.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No saved searches
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Filters */}
          <div className="col-span-2 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search contacts..."
                  value={filters.query}
                  onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="fuzzy" className="text-xs whitespace-nowrap">Fuzzy</Label>
                  <Switch
                    id="fuzzy"
                    checked={filters.fuzzyEnabled}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, fuzzyEnabled: checked }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Relationship Type</Label>
                  <Select 
                    value={filters.relationshipType} 
                    onValueChange={(v) => setFilters(f => ({ ...f, relationshipType: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="acquaintance">Acquaintance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Group</Label>
                  <Select 
                    value={filters.groupId} 
                    onValueChange={(v) => setFilters(f => ({ ...f, groupId: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any group</SelectItem>
                      {groups?.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Organization</Label>
                  <Input
                    placeholder="Company name..."
                    value={filters.organization}
                    onChange={(e) => setFilters(f => ({ ...f, organization: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Location</Label>
                  <Input
                    placeholder="City or country..."
                    value={filters.location}
                    onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Sort by</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(v: any) => setFilters(f => ({ ...f, sortBy: v }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="score">Relationship Score</SelectItem>
                      <SelectItem value="lastContact">Last Contact</SelectItem>
                      <SelectItem value="created">Recently Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  
                  {showSaveDialog ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-32"
                      />
                      <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!searchName}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowSaveDialog(true)}
                      disabled={!hasActiveFilters}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Search
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 mt-4 border-t pt-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {isSearching ? 'Searching...' : `${results?.length || 0} results`}
            </span>
          </div>
          
          <ScrollArea className="h-[300px]">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-2">
                {results.map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback>
                        {`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {contact.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contact.organization}
                          </span>
                        )}
                        {contact.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {contact.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {contact.relationship_score && (
                      <Badge variant="secondary">
                        {contact.relationship_score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No contacts found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
