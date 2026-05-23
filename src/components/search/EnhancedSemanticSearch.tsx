import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  User, 
  Calendar,
  Filter,
  History,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { invokeFunction } from '@/lib/api';

interface SearchResult {
  id: string;
  profileId: string | null;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  createdAt: string;
  searchType: 'semantic' | 'keyword';
}

interface RAGResponse {
  success: boolean;
  query: string;
  expandedQueries: string[];
  results: SearchResult[];
  answer: string | null;
  citations: { sourceId: string; content: string }[];
  metadata: {
    totalResults: number;
    searchMode: string;
    responseTimeMs: number;
    semanticCount: number;
    keywordCount: number;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query_text: string;
  filters: Record<string, unknown>;
  is_pinned: boolean;
  use_count: number;
  last_used_at: string | null;
}

const SOURCE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  message: { icon: <MessageSquare className="h-4 w-4" />, label: 'Message', color: 'bg-blue-500/10 text-blue-700' },
  document: { icon: <FileText className="h-4 w-4" />, label: 'Document', color: 'bg-green-500/10 text-green-700' },
  observation: { icon: <User className="h-4 w-4" />, label: 'Observation', color: 'bg-purple-500/10 text-purple-700' },
  communication: { icon: <MessageSquare className="h-4 w-4" />, label: 'Communication', color: 'bg-amber-500/10 text-amber-700' },
  analysis: { icon: <Sparkles className="h-4 w-4" />, label: 'AI Analysis', color: 'bg-pink-500/10 text-pink-700' },
};

export function EnhancedSemanticSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'semantic' | 'keyword'>('hybrid');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Fetch saved searches
  const { data: savedSearches } = useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('use_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!user,
  });

  // Fetch query suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['query-suggestions', user?.id, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('query_suggestions')
        .select('suggestion_text, suggestion_type, use_count')
        .ilike('suggestion_text', `%${query}%`)
        .order('use_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && query.length >= 2,
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await invokeFunction('rag-query-v2', {
          query: searchQuery,
          searchMode,
          sourceTypes: sourceTypeFilter.length > 0 ? sourceTypeFilter : undefined,
          maxResults: 15,
          includeAnswer: true,
          rerank: true,
        },);

      if (error) throw error;
      return data as RAGResponse;
    },
    onError: (error) => {
      toast.error('Search failed', { description: error.message });
    },
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async ({ queryId, feedback }: { queryId: string; feedback: 'helpful' | 'not_helpful' }) => {
      const { error } = await supabase
        .from('rag_query_logs')
        .update({ user_feedback: feedback })
        .eq('id', queryId);
      
      if (error) throw error;
    },
    onSuccess: (_, { feedback }) => {
      toast.success(feedback === 'helpful' ? 'Thanks for the feedback!' : 'We\'ll improve our results');
    },
  });

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    searchMutation.mutate(query);
  }, [query, searchMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    searchMutation.mutate(suggestion);
  };

  const getSourceConfig = (sourceType: string) => {
    return SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.document;
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enhanced Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask anything about your contacts, documents, or communications..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
              
              {/* Suggestions Dropdown */}
              {suggestions && suggestions.length > 0 && query.length >= 2 && !searchMutation.isPending && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                      onClick={() => handleSuggestionClick(s.suggestion_text)}
                    >
                      <History className="h-3 w-3 text-muted-foreground" />
                      {s.suggestion_text}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Select value={searchMode} onValueChange={(v) => setSearchMode(v as typeof searchMode)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  <span className="flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Hybrid
                  </span>
                </SelectItem>
                <SelectItem value="semantic">Semantic</SelectItem>
                <SelectItem value="keyword">Keyword</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              disabled={!query.trim() || searchMutation.isPending}
            >
              {searchMutation.isPending ? 'Searching...' : 'Search'}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Filter by type:</span>
              {Object.entries(SOURCE_TYPE_CONFIG).map(([type, config]) => (
                <Badge
                  key={type}
                  variant={sourceTypeFilter.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setSourceTypeFilter(prev =>
                      prev.includes(type) 
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Saved Searches */}
          {savedSearches && savedSearches.length > 0 && !searchMutation.data && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Recent:</span>
              {savedSearches.slice(0, 5).map((search) => (
                <Badge
                  key={search.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleSuggestionClick(search.query_text || search.name)}
                >
                  {search.is_pinned && <Star className="h-3 w-3 mr-1 fill-current" />}
                  {search.name || search.query_text?.slice(0, 30)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {searchMutation.isPending && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchMutation.data && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* AI Answer Panel */}
          <div className="lg:col-span-2 space-y-4">
            {searchMutation.data.answer && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Answer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {searchMutation.data.answer}
                  </p>
                  
                  {/* Citations */}
                  {searchMutation.data.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Sources cited:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchMutation.data.citations.map((cite, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            [{i + 1}] {cite.sourceId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Feedback */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Was this helpful?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => feedbackMutation.mutate({ 
                        queryId: searchMutation.data!.query, 
                        feedback: 'helpful' 
                      })}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => feedbackMutation.mutate({ 
                        queryId: searchMutation.data!.query, 
                        feedback: 'not_helpful' 
                      })}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Search Results ({searchMutation.data.metadata.totalResults})
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {searchMutation.data.metadata.responseTimeMs}ms
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {searchMutation.data.results.map((result, index) => {
                      const config = getSourceConfig(result.sourceType);
                      return (
                        <div
                          key={result.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedResult?.id === result.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedResult(result)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={config.color}>
                                {config.icon}
                                <span className="ml-1">{config.label}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Score: {(result.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              #{index + 1}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-3">{result.content}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(result.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      );
                    })}
                    
                    {searchMutation.data.results.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No results found for "{searchMutation.data.query}"</p>
                        <p className="text-sm">Try different keywords or broaden your search</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Metadata & Details Panel */}
          <div className="space-y-4">
            {/* Search Metadata */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Search Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mode</span>
                  <Badge variant="outline">{searchMutation.data.metadata.searchMode}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Semantic matches</span>
                  <span>{searchMutation.data.metadata.semanticCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Keyword matches</span>
                  <span>{searchMutation.data.metadata.keywordCount}</span>
                </div>
                
                {searchMutation.data.expandedQueries.length > 1 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Query expansions:</p>
                    {searchMutation.data.expandedQueries.slice(1).map((q, i) => (
                      <p key={i} className="text-xs italic">"{q}"</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Result Details */}
            {selectedResult && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Result Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Source Type</p>
                    <p className="text-sm font-medium capitalize">{selectedResult.sourceType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source ID</p>
                    <p className="text-sm font-mono text-xs">{selectedResult.sourceId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Relevance Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${selectedResult.score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {(selectedResult.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Full Content</p>
                    <ScrollArea className="h-[200px] mt-1">
                      <p className="text-sm whitespace-pre-wrap">{selectedResult.content}</p>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
