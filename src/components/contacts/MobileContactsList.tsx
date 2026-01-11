/**
 * Phonebook-style Mobile Contacts List
 * Features: Alphabetical sections, quick actions, swipe gestures, voice search
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Mail, Star, MessageSquare, Search, Mic, 
  MicOff, Plus, ChevronRight, User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  relationship_type: string | null;
  tags: string[] | null;
}

interface MobileContactsListProps {
  contacts: Contact[];
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onAddContact?: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function MobileContactsList({
  contacts,
  onToggleFavorite,
  isLoading,
  hasNextPage,
  onLoadMore,
  onAddContact,
}: MobileContactsListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const filtered = contacts.filter(c => {
      if (!searchQuery) return true;
      const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
      const org = c.organization?.toLowerCase() || '';
      return fullName.includes(searchQuery.toLowerCase()) || org.includes(searchQuery.toLowerCase());
    });

    const groups: Record<string, Contact[]> = {};
    
    // Favorites first
    const favorites = filtered.filter(c => c.is_favorite);
    if (favorites.length > 0) {
      groups['★'] = favorites;
    }

    // Then alphabetical
    filtered.forEach(contact => {
      const letter = (contact.first_name?.[0] || '#').toUpperCase();
      const key = ALPHABET.includes(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      if (!contact.is_favorite) {
        groups[key].push(contact);
      }
    });

    return groups;
  }, [contacts, searchQuery]);

  // Available letters for sidebar
  const availableLetters = useMemo(() => {
    const letters = new Set(Object.keys(groupedContacts));
    return ['★', ...ALPHABET, '#'].filter(l => letters.has(l));
  }, [groupedContacts]);

  // Voice search
  const startVoiceSearch = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({ title: 'Voice search not supported', variant: 'destructive' });
      return;
    }

    await hapticFeedback('medium');
    setIsListening(true);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: 'Voice search failed', variant: 'destructive' });
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [toast]);

  // Jump to letter
  const jumpToLetter = useCallback(async (letter: string) => {
    await hapticFeedback('light');
    setActiveLetter(letter);
    
    const sectionEl = sectionRefs.current.get(letter);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => setActiveLetter(null), 500);
  }, []);

  // Quick actions
  const handleCall = useCallback(async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    await hapticFeedback('light');
    // Would integrate with contact methods
    toast({ title: `Calling ${contact.first_name}...` });
  }, [toast]);

  const handleMessage = useCallback(async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    await hapticFeedback('light');
    navigate(`/contacts/${contact.id}?section=conversations`);
  }, [navigate]);

  const handleFavorite = useCallback(async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    await hapticFeedback('medium');
    onToggleFavorite(contact.id, contact.is_favorite);
  }, [onToggleFavorite]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b p-3 safe-area-pt">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8",
                isListening && "text-primary animate-pulse"
              )}
              onClick={startVoiceSearch}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button size="icon" className="h-11 w-11 shrink-0" onClick={onAddContact}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Contact List */}
      <div ref={listRef} className="flex-1 overflow-y-auto relative">
        {Object.keys(groupedContacts).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start building your network by adding contacts'}
            </p>
            {!searchQuery && (
              <Button onClick={onAddContact}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="pb-20">
            {Object.entries(groupedContacts).map(([letter, letterContacts]) => (
              <div 
                key={letter}
                ref={el => { if (el) sectionRefs.current.set(letter, el); }}
              >
                {/* Section Header */}
                <div className="sticky top-0 z-10 px-4 py-2 bg-muted/80 backdrop-blur-sm">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {letter === '★' ? 'Favorites' : letter}
                  </span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {letterContacts.length}
                  </Badge>
                </div>

                {/* Contacts in Section */}
                {letterContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      "border-b border-border/50",
                      "active:bg-muted/50 transition-colors"
                    )}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.is_favorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      {contact.organization && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.organization}
                        </p>
                      )}
                      {contact.relationship_type && (
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {contact.relationship_type}
                        </Badge>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => handleCall(e, contact)}
                      >
                        <Phone className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => handleMessage(e, contact)}
                      >
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}

            {/* Load More */}
            {hasNextPage && (
              <div className="p-4 flex justify-center">
                <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alphabetical Sidebar (Right Edge) */}
      <AnimatePresence>
        {availableLetters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-1 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center py-1 bg-background/80 backdrop-blur-sm rounded-full"
          >
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => jumpToLetter(letter)}
                className={cn(
                  "w-6 h-5 flex items-center justify-center text-[10px] font-semibold",
                  "transition-all duration-150",
                  activeLetter === letter 
                    ? "text-primary scale-150" 
                    : "text-muted-foreground"
                )}
              >
                {letter}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Preview Bubble */}
      <AnimatePresence>
        {activeLetter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground text-5xl font-bold w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
          >
            {activeLetter}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
