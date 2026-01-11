import React, { useState, useEffect, useMemo } from 'react';
import { Link2, Plus, Search, User, Check, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  organization?: string;
  avatar_url?: string;
  bio?: string;
}

interface CaptureContactLinkerProps {
  captureId: string;
  extractedData: any;
  onLink: (profileId: string) => Promise<void>;
  isLinking?: boolean;
}

export function CaptureContactLinker({
  captureId,
  extractedData,
  onLink,
  isLinking,
}: CaptureContactLinkerProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load initial contacts (favorites + recent)
  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open]);

  // Server-side search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchContacts(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // Load favorites first
      const { data: favorites } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, avatar_url, bio')
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false })
        .limit(50);

      // Load recent contacts
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, avatar_url, bio')
        .order('updated_at', { ascending: false })
        .limit(50);

      // Merge and dedupe
      const merged = [...(favorites || [])];
      recent?.forEach(c => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });

      setContacts(merged.slice(0, 100));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchContacts = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, organization, avatar_url, bio')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,organization.ilike.%${query}%`)
        .order('first_name')
        .limit(30);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Failed to search contacts:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Use search results if searching, otherwise filter local contacts
  const filteredContacts = useMemo(() => {
    if (debouncedQuery.length >= 2) return searchResults;
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.first_name?.toLowerCase().includes(query) ||
      c.last_name?.toLowerCase().includes(query) ||
      c.organization?.toLowerCase().includes(query)
    );
  }, [contacts, searchResults, searchQuery, debouncedQuery]);

  // Suggest contacts based on extracted data
  const suggestedContacts = useMemo(() => {
    if (!extractedData) return [];
    
    const displayName = (extractedData.displayName || extractedData.fullName || '').toLowerCase();
    const username = (extractedData.username || '').toLowerCase();
    
    if (!displayName && !username) return [];

    return contacts.filter(c => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      
      // Check for name match
      if (displayName && fullName.includes(displayName)) return true;
      if (displayName && displayName.includes(fullName.split(' ')[0])) return true;
      
      // Check for username in name
      if (username && fullName.includes(username)) return true;
      
      return false;
    }).slice(0, 3);
  }, [contacts, extractedData]);

  const handleSelect = async (contactId: string) => {
    setSelectedId(contactId);
    await onLink(contactId);
    setOpen(false);
    setSelectedId(null);
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const displayName = extractedData?.displayName || extractedData?.fullName || extractedData?.username || 'New Contact';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: newContact, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: extractedData?.email,
          organization: extractedData?.company,
          avatar_url: extractedData?.profileImageUrl,
          bio: extractedData?.bio,
          website: extractedData?.website,
        })
        .select()
        .single();

      if (error) throw error;
      
      await onLink(newContact.id);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create contact:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-xs"
          disabled={isLinking}
        >
          {isLinking ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Link2 className="h-3 w-3 mr-1" />
          )}
          Link to Contact
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type 2+ chars to search all..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <ScrollArea className="max-h-64">
          {/* Suggested Contacts */}
          {suggestedContacts.length > 0 && !searchQuery && (
            <div className="p-2 border-b">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Suggested Matches
              </p>
              {suggestedContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedId === contact.id}
                  onSelect={() => handleSelect(contact.id)}
                  highlighted
                />
              ))}
            </div>
          )}

          {/* All Contacts */}
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No contacts found
              </p>
            ) : (
              <>
                {!searchQuery && suggestedContacts.length > 0 && (
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    All Contacts
                  </p>
                )}
                {filteredContacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedId === contact.id}
                    onSelect={() => handleSelect(contact.id)}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Create New */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={handleCreateNew}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Plus className="h-3 w-3 mr-2" />
            )}
            Create new contact from capture
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ContactItem({ 
  contact, 
  isSelected, 
  onSelect,
  highlighted 
}: { 
  contact: Contact; 
  isSelected: boolean;
  onSelect: () => void;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isSelected}
      className={cn(
        "w-full flex items-center gap-2 p-1.5 rounded text-left hover:bg-muted/50 transition-colors",
        highlighted && "bg-primary/5",
        isSelected && "opacity-50 cursor-not-allowed"
      )}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage src={contact.avatar_url} />
        <AvatarFallback className="text-[10px]">
          {contact.first_name?.[0]}{contact.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {contact.first_name} {contact.last_name}
        </p>
        {contact.organization && (
          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
            <Building2 className="h-2.5 w-2.5" />
            {contact.organization}
          </p>
        )}
      </div>
      {isSelected && (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      )}
      {highlighted && !isSelected && (
        <Badge variant="secondary" className="text-[9px] px-1 py-0">
          Match
        </Badge>
      )}
    </button>
  );
}

export default CaptureContactLinker;
