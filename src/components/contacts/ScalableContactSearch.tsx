import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronsUpDown, Check, Search, Loader2, User, Star, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  is_favorite?: boolean;
}

interface ScalableContactSearchProps {
  selectedId?: string | null;
  onSelect: (id: string | null, contact?: Contact) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  /** Minimum characters before server search triggers */
  minSearchChars?: number;
  /** Maximum results to fetch from server */
  maxResults?: number;
  /** Show compact trigger (icon only) */
  compact?: boolean;
}

// Storage key for recent contacts
const RECENT_CONTACTS_KEY = 'recent-contacts-v1';
const MAX_RECENT_CONTACTS = 10;

function getRecentContactIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_CONTACTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentContactId(id: string): void {
  try {
    const recent = getRecentContactIds().filter(r => r !== id);
    recent.unshift(id);
    localStorage.setItem(RECENT_CONTACTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_CONTACTS)));
  } catch {
    // Ignore localStorage errors
  }
}

export function ScalableContactSearch({
  selectedId,
  onSelect,
  placeholder = 'Search contacts...',
  allowNone = false,
  noneLabel = 'No contact',
  disabled = false,
  className,
  triggerClassName,
  minSearchChars = 3,
  maxResults = 30,
  compact = false,
}: ScalableContactSearchProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch favorites (always available, no search required)
  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites-for-search', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('first_name')
        .limit(50);
      if (error) throw error;
      return (data || []) as Contact[];
    },
    enabled: !!user && open,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent contacts
  const recentIds = useMemo(() => getRecentContactIds(), [open]);
  
  const { data: recentContacts = [] } = useQuery({
    queryKey: ['recent-contacts-for-search', user?.id, recentIds],
    queryFn: async () => {
      if (!user || recentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('user_id', user.id)
        .in('id', recentIds);
      if (error) throw error;
      // Sort by recency
      const contactMap = new Map((data || []).map(c => [c.id, c]));
      return recentIds.map(id => contactMap.get(id)).filter(Boolean) as Contact[];
    },
    enabled: !!user && open && recentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Server-side search (only when 3+ characters)
  const shouldSearch = debouncedSearch.trim().length >= minSearchChars;
  
  const { data: searchResults = [], isLoading: loadingSearch, isFetching: fetchingSearch } = useQuery({
    queryKey: ['contact-search', user?.id, debouncedSearch],
    queryFn: async () => {
      if (!user || !shouldSearch) return [];
      
      const searchTerm = `%${debouncedSearch.trim()}%`;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('user_id', user.id)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},organization.ilike.${searchTerm}`)
        .order('is_favorite', { ascending: false })
        .order('first_name')
        .limit(maxResults);
      
      if (error) throw error;
      return (data || []) as Contact[];
    },
    enabled: !!user && open && shouldSearch,
    staleTime: 30 * 1000, // Cache search results for 30 seconds
  });

  // Fetch selected contact if we have an ID but it's not in the lists
  const { data: selectedContact } = useQuery({
    queryKey: ['selected-contact-for-search', selectedId],
    queryFn: async () => {
      if (!selectedId || !user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('id', selectedId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Contact | null;
    },
    enabled: !!selectedId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Combine all contacts for display
  const displayContacts = useMemo(() => {
    if (shouldSearch) {
      return searchResults;
    }
    
    // Show favorites first, then recent (excluding duplicates)
    const favoriteIds = new Set(favorites.map(f => f.id));
    const uniqueRecent = recentContacts.filter(r => !favoriteIds.has(r.id));
    
    return [...favorites, ...uniqueRecent];
  }, [shouldSearch, searchResults, favorites, recentContacts]);

  // Virtualizer for efficient rendering
  const virtualizer = useVirtualizer({
    count: displayContacts.length + (allowNone ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5,
  });

  const handleSelect = useCallback((contact: Contact | null) => {
    if (contact) {
      addRecentContactId(contact.id);
      onSelect(contact.id, contact);
    } else {
      onSelect(null);
    }
    setOpen(false);
    setSearch('');
  }, [onSelect]);

  const isLoading = loadingFavorites || (shouldSearch && loadingSearch);
  const isSearching = fetchingSearch && shouldSearch;

  // Get display name for selected contact
  const displayName = useMemo(() => {
    if (!selectedId) return null;
    
    // Check in all our sources
    const allContacts = [...favorites, ...recentContacts, ...searchResults];
    const found = allContacts.find(c => c.id === selectedId) || selectedContact;
    
    if (found) {
      return `${found.first_name} ${found.last_name || ''}`.trim();
    }
    return 'Loading...';
  }, [selectedId, favorites, recentContacts, searchResults, selectedContact]);

  const currentContact = useMemo(() => {
    if (!selectedId) return null;
    const allContacts = [...favorites, ...recentContacts, ...searchResults];
    return allContacts.find(c => c.id === selectedId) || selectedContact;
  }, [selectedId, favorites, recentContacts, searchResults, selectedContact]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            compact ? 'w-auto px-2' : 'w-full justify-between',
            triggerClassName
          )}
        >
          {selectedId && currentContact ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-5 w-5">
                <AvatarImage src={currentContact.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {currentContact.first_name?.[0]}
                  {currentContact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!compact && (
                <span className="truncate">{displayName}</span>
              )}
            </div>
          ) : (
            <>
              <User className="h-4 w-4 text-muted-foreground" />
              {!compact && (
                <span className="text-muted-foreground ml-2">{placeholder}</span>
              )}
            </>
          )}
          {!compact && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0", className)} 
        style={{ width: compact ? '320px' : 'var(--radix-popover-trigger-width)' }}
        align="start"
      >
        {/* Search Header */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={`Type ${minSearchChars}+ characters to search...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {search.length > 0 && search.length < minSearchChars && (
            <p className="text-xs text-muted-foreground mt-1.5 px-1">
              Type {minSearchChars - search.length} more character{minSearchChars - search.length !== 1 ? 's' : ''} to search
            </p>
          )}
        </div>

        {/* Section Headers */}
        {!shouldSearch && displayContacts.length > 0 && (
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b flex items-center gap-2">
            {favorites.length > 0 ? (
              <>
                <Star className="h-3 w-3" />
                Favorites & Recent
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Recent Contacts
              </>
            )}
          </div>
        )}

        {shouldSearch && (
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-3 w-3" />
              Search Results
            </span>
            {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : displayContacts.length === 0 && !allowNone ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {shouldSearch 
                ? 'No contacts found' 
                : search.length > 0 
                  ? `Type ${minSearchChars - search.length} more to search`
                  : 'No favorites or recent contacts'
              }
            </p>
            {!shouldSearch && (
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to search all contacts
              </p>
            )}
          </div>
        ) : (
          <div
            ref={parentRef}
            className="max-h-[300px] overflow-auto"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const isNoneOption = allowNone && virtualItem.index === 0;
                const contact = isNoneOption
                  ? null
                  : displayContacts[virtualItem.index - (allowNone ? 1 : 0)];

                if (isNoneOption) {
                  return (
                    <div
                      key="__none__"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <button
                        onClick={() => handleSelect(null)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors',
                          !selectedId && 'bg-muted'
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground">{noneLabel}</span>
                        {!selectedId && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                }

                if (!contact) return null;

                const isSelected = contact.id === selectedId;

                return (
                  <div
                    key={contact.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <button
                      onClick={() => handleSelect(contact)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                        isSelected && 'bg-muted'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {contact.first_name?.[0]}
                          {contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                        </div>
                        {contact.organization && (
                          <span className="text-xs text-muted-foreground truncate w-full text-left">
                            {contact.organization}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          {shouldSearch ? (
            <>
              <Badge variant="outline" className="text-xs">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Badge>
              {searchResults.length >= maxResults && (
                <span>• Refine search for more</span>
              )}
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-xs">
                {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </Badge>
              <span>•</span>
              <span>Type to search all</span>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
