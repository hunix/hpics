import { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, Search, Calendar, X, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

interface Message {
  id: string;
  content: string;
  is_from_contact: boolean;
  sent_at: string;
  media_url?: string | null;
  media_type?: string | null;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  profileName: string;
  isLoading?: boolean;
}

export function VirtualizedMessageList({ 
  messages, 
  profileName,
  isLoading 
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(false);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 15,
  });

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
      if (msg.content.toLowerCase().includes(query)) {
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

  // Get date range for calendar
  const dateRange = {
    start: messages.length > 0 ? new Date(messages[0].sent_at) : new Date(),
    end: messages.length > 0 ? new Date(messages[messages.length - 1].sent_at) : new Date(),
  };

  // Group messages by date for headers
  const getDateHeader = (msgIdx: number) => {
    if (msgIdx === 0) return format(new Date(messages[0].sent_at), 'EEEE, MMMM d, yyyy');
    
    const currentDate = format(new Date(messages[msgIdx].sent_at), 'yyyy-MM-dd');
    const prevDate = format(new Date(messages[msgIdx - 1].sent_at), 'yyyy-MM-dd');
    
    if (currentDate !== prevDate) {
      return format(new Date(messages[msgIdx].sent_at), 'EEEE, MMMM d, yyyy');
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-3 border-b mb-2">
        <Badge variant="secondary" className="shrink-0">
          {messages.length.toLocaleString()} messages
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
        className="flex-1 overflow-auto"
        style={{ minHeight: '350px', maxHeight: '450px' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const msg = messages[virtualRow.index];
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
                    {msg.media_url && (
                      <div className="mb-2">
                        {msg.media_type?.startsWith('image') ? (
                          <img 
                            src={msg.media_url} 
                            alt="Media" 
                            className="max-w-full rounded max-h-48 object-cover"
                          />
                        ) : msg.media_type?.startsWith('video') ? (
                          <video 
                            src={msg.media_url} 
                            controls 
                            className="max-w-full rounded max-h-48"
                          />
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            📎 {msg.media_type || 'Attachment'}
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
      </div>
    </div>
  );
}
