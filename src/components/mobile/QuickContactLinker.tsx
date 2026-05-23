/**
 * Quick Contact Linker
 * Compact inline contact picker for linking captures to contacts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Check, X, Loader2, Star, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { motion, AnimatePresence } from 'framer-motion';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  is_favorite: boolean | null;
}

interface QuickContactLinkerProps {
  onSelect: (contact: Contact) => void;
  onCancel?: () => void;
  selectedContactId?: string | null;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function QuickContactLinker({
  onSelect,
  onCancel,
  selectedContactId,
  placeholder = 'Link to contact...',
  className,
  compact = false,
}: QuickContactLinkerProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch initial contacts (active only, favorites + recent first)
  useEffect(() => {
    if (!user) return;

    const fetchInitialContacts = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(10);
      
      setContacts(data || []);
      setIsLoading(false);
    };

    fetchInitialContacts();
  }, [user]);

  // Search contacts
  useEffect(() => {
    if (!user || debouncedQuery.length < 2) return;

    const searchContacts = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, is_favorite')
        .eq('user_id', user.id)
        .or(`first_name.ilike.%${debouncedQuery}%,last_name.ilike.%${debouncedQuery}%,organization.ilike.%${debouncedQuery}%`)
        .order('is_favorite', { ascending: false })
        .limit(10);
      
      setContacts(data || []);
      setIsLoading(false);
    };

    searchContacts();
  }, [user, debouncedQuery]);

  const handleSelectContact = useCallback(async (contact: Contact) => {
    await hapticFeedback('medium');
    setSelectedContact(contact);
    setIsExpanded(false);
    setSearchQuery('');
    onSelect(contact);
  }, [onSelect]);

  const handleClear = useCallback(async () => {
    await hapticFeedback('light');
    setSelectedContact(null);
    setSearchQuery('');
    onCancel?.();
  }, [onCancel]);

  // If a contact is already selected, show it
  if (selectedContact && !isExpanded) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30',
          className
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={selectedContact.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {selectedContact.first_name[0]}{selectedContact.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {selectedContact.first_name} {selectedContact.last_name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  if (compact && !isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={cn('gap-2', className)}
      >
        <User className="h-4 w-4" />
        Link to Contact
      </Button>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Contact List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ScrollArea className="h-[200px] rounded-lg border">
              {contacts.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                  <User className="h-8 w-8 mb-2 opacity-50" />
                  <p>{searchQuery ? 'No contacts found' : 'No contacts yet'}</p>
                </div>
              ) : (
                <div className="p-1">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg',
                        'hover:bg-muted active:scale-[0.98]',
                        'transition-all duration-150',
                        selectedContactId === contact.id && 'bg-primary/10'
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={contact.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {contact.first_name[0]}{contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          {contact.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                        </div>
                        {contact.organization && (
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.organization}
                          </p>
                        )}
                      </div>
                      {selectedContactId === contact.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Close button */}
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="w-full mt-1"
              >
                Cancel
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
