import React, { useState, useCallback, useEffect } from 'react';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from '@/components/ui/command';
import { 
  Brain, Search, Loader2, MessageSquare, Users, Network, 
  TrendingUp, AlertTriangle, Sparkles, ArrowRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const SUGGESTED_QUERIES = [
  { query: 'Who mentioned competitor X recently?', icon: Search },
  { query: 'Find contacts with declining engagement', icon: TrendingUp },
  { query: 'Show anomalies detected this week', icon: AlertTriangle },
  { query: 'Which relationships need attention?', icon: Users },
  { query: 'Find connections between contacts', icon: Network },
];

interface SearchResult {
  type: 'contact' | 'insight' | 'pattern' | 'answer';
  title: string;
  description: string;
  profileId?: string;
  metadata?: any;
}

export function GlobalAICommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Register keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setResults([]);
    setAiResponse('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-ai-agent-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: searchQuery,
            mode: 'global',
            conversationHistory: []
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited. Please try again.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted.');
        }
        throw new Error('Search failed');
      }

      const data = await response.json();
      setAiResponse(data.response || '');

      // Parse response for actionable items
      const parsedResults: SearchResult[] = [];

      // Extract contact mentions
      const contactPattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
      const mentionedNames: string[] = data.response?.match(contactPattern) || [];
      const uniqueNames = [...new Set(mentionedNames)] as string[];
      
      for (const name of uniqueNames.slice(0, 3)) {
        const { data: contacts } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('is_active', true)
          .ilike('first_name', `%${name.split(' ')[0]}%`)
          .limit(1);

        if (contacts && contacts.length > 0) {
          parsedResults.push({
            type: 'contact',
            title: `${contacts[0].first_name} ${contacts[0].last_name}`,
            description: 'Referenced in response',
            profileId: contacts[0].id
          });
        }
      }

      setResults(parsedResults);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleResultClick = (result: SearchResult) => {
    if (result.profileId) {
      navigate(`/contacts/${result.profileId}`);
      setOpen(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 px-3 border-b">
        <Brain className="h-4 w-4 text-primary shrink-0" />
        <CommandInput 
          placeholder="Ask anything across all contacts..." 
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              e.preventDefault();
              executeSearch(query);
            }
          }}
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      </div>
      
      <CommandList>
        <ScrollArea className="h-[400px]">
          {!query && !aiResponse && (
            <CommandGroup heading="Suggested Queries">
              {SUGGESTED_QUERIES.map((suggestion, i) => (
                <CommandItem 
                  key={i} 
                  onSelect={() => {
                    setQuery(suggestion.query);
                    executeSearch(suggestion.query);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion.query}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {aiResponse && (
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                </div>
              </div>

              {results.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Related Contacts
                  </p>
                  <div className="space-y-2">
                    {results.map((result, i) => (
                      <button
                        key={i}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {query && !aiResponse && !isLoading && (
            <CommandEmpty>
              Press Enter to search across all contacts
            </CommandEmpty>
          )}
        </ScrollArea>
      </CommandList>

      <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>⌘+Shift+I to open</span>
        <Badge variant="outline" className="text-[10px]">
          <Brain className="h-2.5 w-2.5 mr-1" />
          RAG Powered
        </Badge>
      </div>
    </CommandDialog>
  );
}

export default GlobalAICommand;
