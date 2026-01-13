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
import { ChevronsUpDown, Check, Search, Loader2, User, Star, Clock, X, Sparkles, BookUser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  is_favorite?: boolean;
  is_active?: boolean;
  last_interaction_at?: string | null;
  selection_priority?: number;
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
  /** Show all contacts (including inactive address book) */
  showAddressBook?: boolean;
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
  showAddressBook = true,
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

  // Get recent contact IDs
  const recentIds = useMemo(() => getRecentContactIds(), [open]);

  // Use smart selection function for prioritized contacts
  const { data: prioritizedContacts = [], isLoading: loadingPrioritized } = useQuery({
    queryKey: ['contacts-for-selection', user?.id, debouncedSearch, recentIds],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.rpc('get_contacts_for_selection', {
        p_user_id: user.id,
        p_search_query: debouncedSearch || null,
        p_recent_ids: recentIds.length > 0 ? recentIds : null,
        p_limit: maxResults,
      });
      
      if (error) throw error;
      return (data || []) as Contact[];
    },
    enabled: !!user && open,
    staleTime: 30 * 1000,
  });

  // Fetch selected contact if we have an ID but it's not in the lists
  const { data: selectedContact } = useQuery({
    queryKey: ['selected-contact-for-search', selectedId],
    queryFn: async () => {
      if (!selectedId || !user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite, is_active')
        .eq('id', selectedId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Contact | null;
    },
    enabled: !!selectedId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Group contacts by priority
  const groupedContacts = useMemo(() => {
    const recent: Contact[] = [];
    const favorites: Contact[] = [];
    const active: Contact[] = [];
    const addressBook: Contact[] = [];

    const recentIdSet = new Set(recentIds);

    prioritizedContacts.forEach(contact => {
      if (recentIdSet.has(contact.id)) {
        recent.push(contact);
      } else if (contact.is_favorite) {
        favorites.push(contact);
      } else if (contact.is_active) {
        active.push(contact);
      } else if (showAddressBook) {
        addressBook.push(contact);
      }
    });

    // Sort recent by the order in recentIds
    recent.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));

    return { recent, favorites, active, addressBook };
  }, [prioritizedContacts, recentIds, showAddressBook]);

  // Flatten for display with section markers
  const displayItems = useMemo(() => {
    const items: { type: 'section' | 'contact'; data: Contact | string }[] = [];
    const hasSearch = debouncedSearch.trim().length >= minSearchChars;

    if (hasSearch) {
      // When searching, show flat list
      prioritizedContacts.forEach(c => items.push({ type: 'contact', data: c }));
    } else {
      // Show grouped with sections
      if (groupedContacts.recent.length > 0) {
        items.push({ type: 'section', data: 'Recent' });
        groupedContacts.recent.forEach(c => items.push({ type: 'contact', data: c }));
      }
      if (groupedContacts.favorites.length > 0) {
        items.push({ type: 'section', data: 'Favorites' });
        groupedContacts.favorites.forEach(c => items.push({ type: 'contact', data: c }));
      }
      if (groupedContacts.active.length > 0) {
        items.push({ type: 'section', data: 'Active Contacts' });
        groupedContacts.active.forEach(c => items.push({ type: 'contact', data: c }));
      }
      if (groupedContacts.addressBook.length > 0) {
        items.push({ type: 'section', data: 'Address Book' });
        groupedContacts.addressBook.forEach(c => items.push({ type: 'contact', data: c }));
      }
    }

    return items;
  }, [groupedContacts, prioritizedContacts, debouncedSearch, minSearchChars]);

  // Virtualizer for efficient rendering
  const virtualizer = useVirtualizer({
    count: displayItems.length + (allowNone ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (allowNone && index === 0) return 52;
      const item = displayItems[index - (allowNone ? 1 : 0)];
      return item?.type === 'section' ? 32 : 52;
    },
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

  const isLoading = loadingPrioritized;
  const shouldSearch = debouncedSearch.trim().length >= minSearchChars;

  // Get display name for selected contact
  const displayName = useMemo(() => {
    if (!selectedId) return null;
    
    const found = prioritizedContacts.find(c => c.id === selectedId) || selectedContact;
    
    if (found) {
      return `${found.first_name} ${found.last_name || ''}`.trim();
    }
    return 'Loading...';
  }, [selectedId, prioritizedContacts, selectedContact]);

  const currentContact = useMemo(() => {
    if (!selectedId) return null;
    return prioritizedContacts.find(c => c.id === selectedId) || selectedContact;
  }, [selectedId, prioritizedContacts, selectedContact]);

  const activeCount = prioritizedContacts.filter(c => c.is_active || c.is_favorite).length;
  const totalCount = prioritizedContacts.length;

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

        {/* Search Results Header */}
        {shouldSearch && (
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-3 w-3" />
              Search Results
            </span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : displayItems.length === 0 && !allowNone ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {shouldSearch 
                ? 'No contacts found' 
                : search.length > 0 
                  ? `Type ${minSearchChars - search.length} more to search`
                  : 'No contacts yet'
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
                const item = isNoneOption
                  ? null
                  : displayItems[virtualItem.index - (allowNone ? 1 : 0)];

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

                if (!item) return null;

                // Section header
                if (item.type === 'section') {
                  const sectionName = item.data as string;
                  const icon = sectionName === 'Recent' ? Clock :
                               sectionName === 'Favorites' ? Star :
                               sectionName === 'Active Contacts' ? Sparkles :
                               BookUser;
                  const Icon = icon;
                  
                  return (
                    <div
                      key={`section-${sectionName}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b flex items-center gap-2"
                    >
                      <Icon className="h-3 w-3" />
                      {sectionName}
                    </div>
                  );
                }

                const contact = item.data as Contact;
                const isSelected = contact.id === selectedId;
                const isInactive = !contact.is_active && !contact.is_favorite;

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
                        isSelected && 'bg-muted',
                        isInactive && 'opacity-60'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className={cn("text-xs", isInactive && "bg-muted")}>
                          {contact.first_name?.[0]}
                          {contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("truncate font-medium", isInactive && "text-muted-foreground")}>
                            {contact.first_name} {contact.last_name}
                          </span>
                          {contact.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          {contact.is_active && !contact.is_favorite && (
                            <Sparkles className="h-3 w-3 text-primary shrink-0" />
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
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </Badge>
              {totalCount >= maxResults && (
                <span>• Refine search for more</span>
              )}
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                {activeCount} active
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