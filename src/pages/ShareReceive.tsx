import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Share2, Link2, Image, FileText, User, Search, 
  Check, Loader2, X, ExternalLink, Instagram, Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/nativeFeatures';

interface SharedContent {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  organization: string | null;
}

// Detect platform from URL
function detectPlatform(url: string): { platform: string; icon: typeof Instagram } | null {
  if (url.includes('linkedin.com')) {
    return { platform: 'LinkedIn', icon: Linkedin };
  }
  if (url.includes('instagram.com')) {
    return { platform: 'Instagram', icon: Instagram };
  }
  if (url.includes('threads.net')) {
    return { platform: 'Threads', icon: Share2 };
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return { platform: 'X/Twitter', icon: Share2 };
  }
  if (url.includes('facebook.com')) {
    return { platform: 'Facebook', icon: Share2 };
  }
  return null;
}

export default function ShareReceive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [sharedContent, setSharedContent] = useState<SharedContent>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get shared content from URL params or service worker cache
  useEffect(() => {
    const title = searchParams.get('title');
    const text = searchParams.get('text');
    const url = searchParams.get('url');
    
    if (title || text || url) {
      setSharedContent({
        title: title || undefined,
        text: text || undefined,
        url: url || undefined,
      });
    }
    
    // Also check for cached share data from service worker
    if ('caches' in window) {
      caches.open('share-cache').then(cache => {
        cache.match('/share-data').then(response => {
          if (response) {
            response.json().then(data => {
              setSharedContent(prev => ({ ...prev, ...data }));
              cache.delete('/share-data');
            });
          }
        });
      });
    }
  }, [searchParams]);
  
  // Fetch contacts
  useEffect(() => {
    if (!user) return;
    
    const fetchContacts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization')
        .eq('user_id', user.id)
        .order('first_name');
      
      if (error) {
        console.error('Error fetching contacts:', error);
      } else {
        setContacts(data || []);
        setFilteredContacts(data || []);
      }
      setIsLoading(false);
    };
    
    fetchContacts();
  }, [user]);
  
  // Filter contacts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = contacts.filter(contact => {
      const fullName = `${contact.first_name} ${contact.last_name || ''}`.toLowerCase();
      const org = contact.organization?.toLowerCase() || '';
      return fullName.includes(query) || org.includes(query);
    });
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const handleSelectContact = async (contact: Contact) => {
    await hapticFeedback('light');
    setSelectedContact(contact);
  };
  
  const handleSave = async () => {
    if (!selectedContact || !user) return;
    
    await hapticFeedback('medium');
    setIsSaving(true);
    
    try {
      // Detect platform and content type
      const platform = sharedContent.url ? detectPlatform(sharedContent.url) : null;
      
      // Save to device_captures table
      const { error } = await supabase.from('device_captures').insert({
        user_id: user.id,
        profile_id: selectedContact.id,
        capture_type: sharedContent.url ? 'url' : 'text',
        source_app: platform?.platform || 'share_intent',
        raw_content: JSON.stringify({
          title: sharedContent.title,
          text: sharedContent.text,
          url: sharedContent.url,
        }),
        status: 'pending',
        metadata: {
          platform: platform?.platform,
          shared_at: new Date().toISOString(),
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Content saved!',
        description: `Added to ${selectedContact.first_name}'s profile for processing.`,
      });
      
      // Navigate to contact's profile
      navigate(`/contacts/${selectedContact.id}`);
    } catch (error) {
      console.error('Error saving shared content:', error);
      toast({
        title: 'Error saving content',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = async () => {
    await hapticFeedback('light');
    navigate(-1);
  };
  
  const platformInfo = sharedContent.url ? detectPlatform(sharedContent.url) : null;
  
  return (
    <div className="min-h-screen-mobile bg-background safe-area-inset">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b safe-area-pt">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">Import to HPICS</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSave}
          disabled={!selectedContact || isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
        </Button>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Shared Content Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Shared Content
              {platformInfo && (
                <Badge variant="secondary" className="ml-auto">
                  <platformInfo.icon className="h-3 w-3 mr-1" />
                  {platformInfo.platform}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sharedContent.title && (
              <p className="font-medium text-sm">{sharedContent.title}</p>
            )}
            {sharedContent.text && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sharedContent.text}
              </p>
            )}
            {sharedContent.url && (
              <a 
                href={sharedContent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{sharedContent.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
            {!sharedContent.title && !sharedContent.text && !sharedContent.url && (
              <p className="text-sm text-muted-foreground">No content detected</p>
            )}
          </CardContent>
        </Card>
        
        {/* Contact Selection */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Link to Contact
          </h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Selected Contact */}
          {selectedContact && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact.avatar_url || undefined} />
                <AvatarFallback>
                  {selectedContact.first_name[0]}{selectedContact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {selectedContact.first_name} {selectedContact.last_name}
                </p>
                {selectedContact.organization && (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedContact.organization}
                  </p>
                )}
              </div>
              <Check className="h-5 w-5 text-primary shrink-0" />
            </motion.div>
          )}
          
          {/* Contact List */}
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl',
                      'hover:bg-muted active:scale-[0.98]',
                      'transition-all duration-200 touch-target',
                      selectedContact?.id === contact.id && 'bg-muted'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback>
                        {contact.first_name[0]}{contact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.organization && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.organization}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Save Button */}
        <Button
          className="w-full h-12 text-base"
          onClick={handleSave}
          disabled={!selectedContact || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Save to Contact
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
