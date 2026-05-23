import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { ConversationAnalysisPanel } from '@/components/conversations/ConversationAnalysisPanel';
import { 
  ArrowLeft, MessageCircle, Brain, Image, Send, User, 
  Search, Calendar, ChevronUp, ChevronDown, X, Loader2,
  Smartphone, MessageSquare, Linkedin, MessagesSquare,
  Play, FileText, Mic
} from 'lucide-react';

const INITIAL_LOAD = 30;
const BATCH_SIZE = 50;

const platformIcons: Record<string, any> = {
  sms: Smartphone,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  telegram: MessagesSquare,
  messenger: MessageSquare,
  imessage: MessageCircle,
  slack: MessageSquare,
  discord: MessageSquare,
  email_thread: MessageSquare,
  other: MessageCircle,
};

const platformColors: Record<string, string> = {
  sms: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  whatsapp: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  telegram: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  messenger: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  imessage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  slack: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  discord: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  email_thread: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

interface Message {
  id: string;
  content: string;
  is_from_contact: boolean;
  sent_at: string;
  media_id: string | null;
  media_filename: string | null;
  media_type: string | null;
  media?: {
    id: string;
    file_url: string;
    mime_type: string;
    storage_path: string | null;
  } | null;
}

interface MediaItem {
  id: string;
  file_url: string;
  mime_type: string;
  storage_path: string | null;
  sent_at: string;
  message_content: string;
  media_filename: string | null;
}

export default function ConversationDetail() {
  const { contactId, conversationId } = useParams<{ contactId: string; conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [isFromContact, setIsFromContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', contactId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  // Fetch conversation
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  // Infinite query for messages - latest first, paginated
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
  } = useInfiniteQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const limit = pageParam ? BATCH_SIZE : INITIAL_LOAD; // First page is smaller
      let query = supabase
        .from('messages')
        .select('id, content, is_from_contact, sent_at, media_id, media_filename, media_type, media:media_id(id, file_url, mime_type, storage_path)')
        .eq('conversation_id', conversationId!)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (pageParam) {
        query = query.lt('sent_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Message[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // Stop if we got less than expected (first page uses INITIAL_LOAD, rest use BATCH_SIZE)
      const expectedSize = allPages.length === 1 ? INITIAL_LOAD : BATCH_SIZE;
      if (lastPage.length < expectedSize) return undefined;
      return lastPage[lastPage.length - 1]?.sent_at;
    },
    initialPageParam: null as string | null,
    enabled: !!conversationId,
  });

  // Flatten and reverse messages for display (oldest at top for chat view)
  const messages = messagesData?.pages.flatMap(page => page).reverse() || [];

  // Fetch conversation media
  const { data: mediaItems } = useQuery({
    queryKey: ['conversation-media', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('sent_at, content, media_filename, media:media_id(id, file_url, mime_type, storage_path)')
        .eq('conversation_id', conversationId!)
        .not('media_id', 'is', null)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data
        .filter(m => m.media)
        .map(m => ({
          id: (m.media as any).id,
          file_url: (m.media as any).file_url,
          mime_type: (m.media as any).mime_type,
          storage_path: (m.media as any).storage_path,
          sent_at: m.sent_at,
          message_content: m.content,
          media_filename: m.media_filename,
        })) as MediaItem[];
    },
    enabled: !!conversationId,
  });

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  // Stable ref for scroll handler to prevent infinite loops
  const loadMoreRef = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage });
  loadMoreRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };

  // Handle scroll to load more - attached to scroll element, not virtualizer
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { hasNextPage, isFetchingNextPage, fetchNextPage } = loadMoreRef.current;
      
      // Load more when near the top (for older messages)
      if (scrollElement.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []); // Empty deps - uses refs for values

  // Search through messages
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results: number[] = [];
    messages.forEach((msg, idx) => {
      if (msg.content?.toLowerCase().includes(query)) {
        results.push(idx);
      }
    });
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      virtualizer.scrollToIndex(results[0], { align: 'center' });
    }
  }, [searchQuery, messages]);

  // Jump to date
  useEffect(() => {
    if (!selectedDate) return;
    
    const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
    const targetIdx = messages.findIndex(msg => {
      const msgDate = format(new Date(msg.sent_at), 'yyyy-MM-dd');
      return msgDate >= targetDateStr;
    });
    
    if (targetIdx >= 0) {
      virtualizer.scrollToIndex(targetIdx, { align: 'start' });
    }
  }, [selectedDate, messages]);

  const navigateSearch = useCallback((direction: 'prev' | 'next') => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentSearchIndex(newIndex);
    virtualizer.scrollToIndex(searchResults[newIndex], { align: 'center' });
  }, [searchResults, currentSearchIndex, virtualizer]);

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ content, isFromContact }: { content: string; isFromContact: boolean }) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId!,
        user_id: user!.id,
        content,
        is_from_contact: isFromContact,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          message_count: (conversation?.message_count || 0) + 1
        })
        .eq('id', conversationId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const profileName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Contact';
  const PlatformIcon = conversation ? platformIcons[conversation.platform] || MessageCircle : MessageCircle;

  // Date header helper
  const getDateHeader = (msgIdx: number) => {
    if (messages.length === 0) return null;
    if (msgIdx === 0) return format(new Date(messages[0].sent_at), 'EEEE, MMMM d, yyyy');
    
    const currentDate = format(new Date(messages[msgIdx].sent_at), 'yyyy-MM-dd');
    const prevDate = format(new Date(messages[msgIdx - 1].sent_at), 'yyyy-MM-dd');
    
    if (currentDate !== prevDate) {
      return format(new Date(messages[msgIdx].sent_at), 'EEEE, MMMM d, yyyy');
    }
    return null;
  };

  // Date range for calendar
  const dateRange = {
    start: messages.length > 0 ? new Date(messages[0].sent_at) : new Date(),
    end: messages.length > 0 ? new Date(messages[messages.length - 1].sent_at) : new Date(),
  };

  // Media type icon helper
  const getMediaIcon = (mediaType: string) => {
    if (mediaType?.startsWith('image')) return Image;
    if (mediaType?.startsWith('video')) return Play;
    if (mediaType?.startsWith('audio')) return Mic;
    return FileText;
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/contacts" className="hover:text-foreground">Contacts</Link>
            <span>/</span>
            <Link to={`/contacts/${contactId}`} className="hover:text-foreground">{profileName}</Link>
            <span>/</span>
            <span className="text-foreground">{conversation?.title || 'Conversation'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/contacts/${contactId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {conversation && (
                <Badge className={platformColors[conversation.platform] || platformColors.other}>
                  <PlatformIcon className="h-3 w-3 mr-1" />
                  {conversation.platform}
                </Badge>
              )}
              <div>
                <h1 className="text-xl font-semibold">{conversation?.title || 'Conversation'}</h1>
                <p className="text-sm text-muted-foreground">
                  with {profileName} · {conversation?.message_count?.toLocaleString() || 0} messages
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel - Media Gallery (collapsible on smaller screens) */}
          <div className="hidden lg:flex w-64 border-r flex-col bg-muted/30 shrink-0">
            <div className="p-4 border-b shrink-0">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Image className="h-4 w-4" />
                Media Gallery
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {mediaItems?.length || 0} items
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 grid grid-cols-2 gap-2">
                {mediaItems?.slice(0, 20).map((item) => {
                  const MediaIcon = getMediaIcon(item.mime_type);
                  return (
                    <div
                      key={item.id}
                      className="aspect-square rounded-md overflow-hidden bg-muted relative group cursor-pointer"
                    >
                      {item.mime_type?.startsWith('image') ? (
                        <img
                          src={item.file_url}
                          alt={item.media_filename || 'Image'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MediaIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                        <span className="text-white text-xs truncate">{item.media_filename || 'Media'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(mediaItems?.length || 0) > 20 && (
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('media')}>
                    View all {mediaItems?.length} items
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-hidden">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="messages" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Analysis
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2 lg:hidden">
                    <Image className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden">
                {/* Search/Jump Toolbar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
                  <Badge variant="secondary" className="shrink-0">
                    {messages.length.toLocaleString()} loaded
                  </Badge>
                  
                  <div className="flex-1" />
                  
                  {showSearch ? (
                    <div className="flex items-center gap-1 flex-1 max-w-sm">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search messages..."
                          className="pl-8 h-8"
                          autoFocus
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {currentSearchIndex + 1}/{searchResults.length}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch('prev')}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch('next')}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)}>
                      <Search className="h-4 w-4 mr-1" />
                      Search
                    </Button>
                  )}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Jump to date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < dateRange.start || date > dateRange.end}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Virtualized Message List */}
                <div 
                  ref={parentRef}
                  className="flex-1 overflow-auto px-4 relative"
                >
                  {/* Loading indicator - sticky at top */}
                  {isFetchingNextPage && (
                    <div className="sticky top-0 z-10 flex justify-center py-2 bg-background/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading older messages...</span>
                      </div>
                    </div>
                  )}
                  
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mb-2" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const msg = messages[virtualRow.index];
                        if (!msg) return null;

                        const dateHeader = getDateHeader(virtualRow.index);
                        const isHighlighted = searchResults[currentSearchIndex] === virtualRow.index;
                        
                        return (
                          <div
                            key={msg.id}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                          >
                            {dateHeader && (
                              <div className="flex justify-center my-2">
                                <Badge variant="outline" className="text-xs font-normal bg-background">
                                  {dateHeader}
                                </Badge>
                              </div>
                            )}
                            <div className={`flex ${msg.is_from_contact ? 'justify-start' : 'justify-end'} px-2`}>
                              <div 
                                className={`max-w-[75%] rounded-lg p-3 ${
                                  msg.is_from_contact 
                                    ? 'bg-muted text-foreground' 
                                    : 'bg-primary text-primary-foreground'
                                } ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
                              >
                                {msg.media && (
                                  <div className="mb-2">
                                    {(msg.media.mime_type || msg.media_type)?.startsWith('image') ? (
                                      <img 
                                        src={msg.media.file_url} 
                                        alt="Media" 
                                        className="max-w-full rounded max-h-48 object-cover"
                                      />
                                    ) : (msg.media.mime_type || msg.media_type)?.startsWith('video') ? (
                                      <video 
                                        src={msg.media.file_url} 
                                        controls 
                                        className="max-w-full rounded max-h-48"
                                      />
                                    ) : (msg.media.mime_type || msg.media_type)?.startsWith('audio') ? (
                                      <audio src={msg.media.file_url} controls className="max-w-full" />
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        📎 {msg.media_filename || 'Attachment'}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.is_from_contact ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                                  {format(new Date(msg.sent_at), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t px-4 py-4 space-y-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isFromContact ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsFromContact(true)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      From {profileName.split(' ')[0]}
                    </Button>
                    <Button
                      variant={!isFromContact ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsFromContact(false)}
                    >
                      From Me
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Paste or type message content..."
                      className="min-h-[60px]"
                    />
                    <Button 
                      onClick={() => addMessageMutation.mutate({ content: newMessage, isFromContact })}
                      disabled={!newMessage.trim() || addMessageMutation.isPending}
                      className="shrink-0"
                    >
                      {addMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="flex-1 overflow-auto px-4 pb-4 mt-0 data-[state=inactive]:hidden">
                {conversation && (
                  <ConversationAnalysisPanel
                    conversationId={conversation.id}
                    profileName={profileName}
                    messageCount={conversation.message_count || 0}
                  />
                )}
              </TabsContent>

              <TabsContent value="media" className="flex-1 overflow-auto px-4 pb-4 mt-0 lg:hidden data-[state=inactive]:hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaItems?.map((item) => {
                    const MediaIcon = getMediaIcon(item.mime_type);
                    return (
                      <div
                        key={item.id}
                        className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
                      >
                        {item.mime_type?.startsWith('image') ? (
                          <img
                            src={item.file_url}
                            alt={item.media_filename || 'Image'}
                            className="w-full h-full object-cover"
                          />
                        ) : item.mime_type?.startsWith('video') ? (
                          <div className="w-full h-full flex items-center justify-center relative">
                            <video src={item.file_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-10 w-10 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MediaIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-start justify-end p-2">
                          <span className="text-white text-xs truncate w-full">{item.media_filename || 'Media'}</span>
                          <span className="text-white/70 text-xs">{format(new Date(item.sent_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(!mediaItems || mediaItems.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Image className="h-12 w-12 mb-2" />
                    <p>No media in this conversation</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
