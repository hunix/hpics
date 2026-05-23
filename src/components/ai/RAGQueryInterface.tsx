import { useState } from 'react';
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
import { Search, FileText, MessageSquare, Brain, ChevronDown, Loader2, ExternalLink, Quote, Eye, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface RAGResult {
  source_type: string;
  source_id: string;
  content: string;
  relevance_score: number;
  metadata?: Record<string, unknown>;
}

interface Citation {
  index: number;
  source: RAGResult;
}

interface SearchState {
  query: string;
  results: RAGResult[];
  answer: string;
  citations: Citation[];
  isSearching: boolean;
}

const SOURCE_TYPES = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'analyses', label: 'AI Analyses', icon: Brain },
  { id: 'observations', label: 'Observations', icon: Eye },
  { id: 'communications', label: 'Communications', icon: Mail },
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
  const [selectedSources, setSelectedSources] = useState<string[]>(['documents', 'messages', 'analyses', 'observations', 'communications']);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    if (!searchState.query.trim() || !user) return;

    setSearchState(prev => ({ ...prev, isSearching: true, results: [], answer: '', citations: [] }));

    try {
      const { data, error } = await invokeFunction('rag-query', {
          query: searchState.query,
          sourceTypes: selectedSources,
          maxResults: 10,
          includeAnswer: true,
        },);

      if (error) throw error;

      // Map backend response to frontend format
      const mappedResults: RAGResult[] = (data.results || []).map((r: any) => ({
        source_type: r.source_type,
        source_id: r.source_id,
        content: r.content,
        relevance_score: r.relevance_score,
        metadata: r.metadata,
      }));

      // Map citations
      const mappedCitations: Citation[] = (data.citations || []).map((c: any) => ({
        index: c.index,
        source: {
          source_type: c.source?.source_type,
          source_id: c.source?.source_id,
          content: c.source?.content,
          relevance_score: c.source?.relevance_score,
          metadata: c.source?.metadata,
        },
      }));

      setSearchState(prev => ({
        ...prev,
        results: mappedResults,
        answer: data.answer || '',
        citations: mappedCitations,
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
    const source = SOURCE_TYPES.find(s => s.id === sourceType || s.id === sourceType.replace('_', ''));
    if (source) {
      const Icon = source.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getSourceLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      message: 'Message',
      communication: 'Communication',
      analysis: 'AI Analysis',
      observation: 'Observation',
      document: 'Document',
    };
    return labels[sourceType] || sourceType;
  };

  const formatMetadata = (metadata: Record<string, unknown>) => {
    const parts: string[] = [];
    if (metadata.platform) parts.push(String(metadata.platform));
    if (metadata.channel) parts.push(String(metadata.channel));
    if (metadata.category) parts.push(String(metadata.category));
    if (metadata.analysis_type) parts.push(String(metadata.analysis_type).replace('_', ' '));
    if (metadata.profile_name) parts.push(String(metadata.profile_name));
    return parts.join(' • ');
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
              Filters ({selectedSources.length} sources)
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
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{searchState.answer}</p>
            {searchState.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <span className="text-xs text-muted-foreground">Sources: </span>
                {searchState.citations.map((citation) => (
                  <Badge key={citation.index} variant="outline" className="text-xs mr-1">
                    [{citation.index}] {getSourceLabel(citation.source.source_type)}
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
                    key={`${result.source_type}-${result.source_id}-${index}`}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getSourceIcon(result.source_type)}
                          <span className="text-sm font-medium">{getSourceLabel(result.source_type)}</span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(result.relevance_score * 100)}% match
                          </Badge>
                        </div>
                        {result.metadata && Object.keys(result.metadata).length > 0 && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatMetadata(result.metadata)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3">
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
