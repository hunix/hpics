import { useState, useMemo, useRef, useCallback } from 'react';
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
import { ChevronsUpDown, Check, Search, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
}

interface VirtualizedContactSelectProps {
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function VirtualizedContactSelect({
  selectedId,
  onSelect,
  placeholder = 'Select a contact',
  allowNone = false,
  noneLabel = 'No contact',
  disabled = false,
  className,
}: VirtualizedContactSelectProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch ALL contacts using recursive pagination
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['all-contacts-select', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const allContacts: Contact[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const start = page * pageSize;
        const end = start + pageSize - 1;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, organization')
          .eq('user_id', user.id)
          .order('first_name')
          .range(start, end);

        if (error) throw error;

        if (data && data.length > 0) {
          allContacts.push(...data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return allContacts;
    },
    enabled: !!user && open,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;

    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return contacts.filter((contact) => {
      const fullName = `${contact.first_name} ${contact.last_name || ''}`.toLowerCase();
      const org = contact.organization?.toLowerCase() || '';
      return terms.every(
        (term) => fullName.includes(term) || org.includes(term)
      );
    });
  }, [contacts, search]);

  // Virtualizer for efficient rendering
  const virtualizer = useVirtualizer({
    count: filteredContacts.length + (allowNone ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId),
    [contacts, selectedId]
  );

  const handleSelect = useCallback((id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch('');
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {selectedId && selectedContact ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedContact.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {selectedContact.first_name?.[0]}
                  {selectedContact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedContact.first_name} {selectedContact.last_name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContacts.length === 0 && !allowNone ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {search ? 'No contacts found' : 'No contacts available'}
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
                  : filteredContacts[virtualItem.index - (allowNone ? 1 : 0)];

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
                        onClick={() => handleSelect('')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                          !selectedId && 'bg-muted'
                        )}
                      >
                        <User className="h-5 w-5 text-muted-foreground" />
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
                      onClick={() => handleSelect(contact.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                        isSelected && 'bg-muted'
                      )}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {contact.first_name?.[0]}
                          {contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="truncate">
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.organization && (
                          <span className="text-xs text-muted-foreground truncate">
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

        {contacts.length > 0 && (
          <div className="p-2 border-t text-xs text-muted-foreground text-center">
            {filteredContacts.length.toLocaleString()} of {contacts.length.toLocaleString()} contacts
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
