/**
 * ContactLinkSelector - Select a contact to link uploads to
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Search, X, ChevronDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface ContactLinkSelectorProps {
  selectedContactId?: string | null;
  onContactSelect: (contact: Contact | null) => void;
  disabled?: boolean;
}

export function ContactLinkSelector({
  selectedContactId,
  onContactSelect,
  disabled = false
}: ContactLinkSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts-for-upload-link', searchQuery],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Build query: show active contacts by default, sorted by favorites then recent
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, is_favorite, is_active, updated_at')
        .eq('user_id', user.id)
        .eq('is_active', true) // Only show active contacts by default
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('first_name', { ascending: true })
        .limit(50);

      // If user is searching, also search inactive contacts
      if (searchQuery) {
        query = supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, is_favorite, is_active, updated_at')
          .eq('user_id', user.id)
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .order('is_active', { ascending: false }) // Active first
          .order('is_favorite', { ascending: false })
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        full_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
        avatar_url: p.avatar_url
      })) as Contact[];
    },
    enabled: open,
    staleTime: 30000
  });

  const { data: selectedContact } = useQuery({
    queryKey: ['selected-contact-for-upload', selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', selectedContactId)
        .single();
      
      if (error) return null;
      
      return {
        id: data.id,
        full_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown',
        avatar_url: data.avatar_url
      } as Contact;
    },
    enabled: !!selectedContactId
  });

  const handleSelect = (contact: Contact) => {
    onContactSelect(contact);
    setOpen(false);
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Link to Contact (Optional)</Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between", !selectedContact && "text-muted-foreground")}
            disabled={disabled}
          >
            {selectedContact ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedContact.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{getInitials(selectedContact.full_name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedContact.full_name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Select a contact...</span>
              </div>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>

          <ScrollArea className="h-[200px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </div>
            ) : (
              <div className="p-1">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-accent transition-colors",
                      selectedContactId === contact.id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(contact.full_name)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium truncate">{contact.full_name}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-2">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" disabled>
              <UserPlus className="h-4 w-4 mr-2" />
              Create new contact (coming soon)
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selectedContact && (
        <Button variant="ghost" size="sm" onClick={() => onContactSelect(null)} className="text-xs text-muted-foreground" disabled={disabled}>
          <X className="h-3 w-3 mr-1" />
          Clear selection
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Files will be organized in the contact's folder and linked to their profile.
      </p>
    </div>
  );
}
