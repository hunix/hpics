import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, FileText, MessageSquare, Brain, ChevronDown, Loader2, ExternalLink, Quote } from 'lucide-react';
import { toast } from 'sonner';

interface RAGResult {
  source: string;
  sourceType: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

interface SearchState {
  query: string;
  results: RAGResult[];
  answer: string;
  citations: string[];
  isSearching: boolean;
}

const SOURCE_TYPES = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'analyses', label: 'AI Analyses', icon: Brain },
];

export function RAGQueryInterface() {
  const { user } = useAuth();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    answer: '',
    citations: [],
    isSearching: false,
  });
  const [selectedSources, setSelectedSources] = useState<string[]>(['documents', 'messages', 'analyses']);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    if (!searchState.query.trim() || !user) return;

    setSearchState(prev => ({ ...prev, isSearching: true, results: [], answer: '' }));

    try {
      const { data, error } = await supabase.functions.invoke('rag-query', {
        body: {
          query: searchState.query,
          sourceTypes: selectedSources,
          maxResults: 10,
          includeAnswer: true,
        },
      });

      if (error) throw error;

      setSearchState(prev => ({
        ...prev,
        results: data.results || [],
        answer: data.answer || '',
        citations: data.citations || [],
        isSearching: false,
      }));
    } catch (error) {
      console.error('RAG search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchState(prev => ({ ...prev, isSearching: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const getSourceIcon = (sourceType: string) => {
    const source = SOURCE_TYPES.find(s => s.id === sourceType);
    if (source) {
      const Icon = source.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Intelligent Search (RAG)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask anything about your contacts, documents, or communications..."
              value={searchState.query}
              onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            {searchState.isSearching && (
              <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>
          <Button onClick={handleSearch} disabled={searchState.isSearching || !searchState.query.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              Filters
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Search in:</span>
              {SOURCE_TYPES.map(source => (
                <div key={source.id} className="flex items-center gap-2">
                  <Checkbox
                    id={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                  />
                  <Label htmlFor={source.id} className="flex items-center gap-1 text-sm cursor-pointer">
                    <source.icon className="h-3 w-3" />
                    {source.label}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* AI Answer */}
        {searchState.answer && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="font-medium">AI Answer</span>
            </div>
            <p className="text-sm leading-relaxed">{searchState.answer}</p>
            {searchState.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <span className="text-xs text-muted-foreground">Sources: </span>
                {searchState.citations.map((citation, i) => (
                  <Badge key={i} variant="outline" className="text-xs mr-1">
                    {citation}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchState.results.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              {searchState.results.length} relevant sources found
            </h4>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {searchState.results.map((result, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getSourceIcon(result.sourceType)}
                          <span className="text-sm font-medium truncate">{result.source}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(result.relevanceScore * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          <Quote className="h-3 w-3 inline mr-1 opacity-50" />
                          {result.content}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty State */}
        {!searchState.isSearching && searchState.query && searchState.results.length === 0 && !searchState.answer && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No results found for "{searchState.query}"</p>
            <p className="text-sm">Try different keywords or expand your search sources</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
