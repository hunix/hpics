import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, FileText, User, Sparkles, CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { invokeFunction } from '@/lib/api';

interface SearchResult {
  id: string;
  source_type: string;
  source_id: string;
  profile_id: string | null;
  summary: string;
  metadata: Record<string, any>;
  document?: {
    document_type: string;
    document_number: string;
    expiry_date: string;
    issue_date: string;
    issuing_country: string;
    file_url: string;
    holder_name: string;
  };
}

interface DocumentRAGSearchProps {
  profileId?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function DocumentRAGSearch({ profileId, onResultClick }: DocumentRAGSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await invokeFunction('search-documents', {
          query: searchQuery,
          profileId: profileId || null,
          limit: 10,
        },);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      setAnswer(data.answer || null);
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    searchMutation.mutate(query);
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'identity_document':
        return <CreditCard className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Document Search
        </CardTitle>
        <CardDescription>
          Search across all documents using AI. Ask questions like "When does my passport expire?" or "Show me all insurance documents"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searchMutation.isPending}>
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {answer && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Answer
            </p>
            <p className="text-sm">{answer}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {results.length} relevant document{results.length !== 1 ? 's' : ''}
            </p>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer"
                    onClick={() => onResultClick?.(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-background rounded">
                        {getSourceIcon(result.source_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {result.document?.document_type || result.summary}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {result.source_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {result.document && (
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {result.document.holder_name && (
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {result.document.holder_name}
                              </p>
                            )}
                            {result.document.document_number && (
                              <p>#{result.document.document_number}</p>
                            )}
                            {result.document.expiry_date && (
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires: {format(new Date(result.document.expiry_date), 'PP')}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {!result.document && result.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {searchMutation.isSuccess && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm mt-1">Try a different search query</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
