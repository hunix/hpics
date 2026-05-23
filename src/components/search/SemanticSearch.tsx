import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Eye, 
  User,
  Loader2,
  ExternalLink,
  Quote
} from "lucide-react";
import { Link } from "react-router-dom";
import { invokeFunction } from '@/lib/api';

interface SearchResult {
  type: 'contact' | 'document' | 'message' | 'observation' | 'analysis';
  id: string;
  title: string;
  snippet: string;
  relevance: number;
  profileId?: string;
  profileName?: string;
  source?: string;
  date?: string;
}

interface RAGResponse {
  answer: string;
  citations: Array<{
    source: string;
    sourceType: string;
    content: string;
    relevance?: number;
  }>;
  results?: SearchResult[];
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  contact: { icon: User, color: "bg-blue-500/10 text-blue-500", label: "Contact" },
  document: { icon: FileText, color: "bg-green-500/10 text-green-500", label: "Document" },
  message: { icon: MessageSquare, color: "bg-purple-500/10 text-purple-500", label: "Message" },
  observation: { icon: Eye, color: "bg-orange-500/10 text-orange-500", label: "Observation" },
  analysis: { icon: Sparkles, color: "bg-cyan-500/10 text-cyan-500", label: "Analysis" }
};

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const { data, error } = await invokeFunction('rag-query', { 
          query: searchQuery,
          mode: 'search',
          maxCitations: 10
        });
      if (error) throw error;
      return data as RAGResponse;
    },
    onSuccess: () => {
      setHasSearched(true);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI-Powered Search
        </CardTitle>
        <CardDescription>
          Ask questions in natural language to find contacts, messages, and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find contacts who work in tech... or Ask about recent conversations..."
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={searchMutation.isPending || !query.trim()}>
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Example queries */}
        {!hasSearched && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {[
              "Who mentioned funding recently?",
              "Contacts at tech companies",
              "What did John say about the project?",
              "People I should reconnect with"
            ].map((example) => (
              <Badge 
                key={example}
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => {
                  setQuery(example);
                  searchMutation.mutate(example);
                }}
              >
                {example}
              </Badge>
            ))}
          </div>
        )}

        {/* Loading state */}
        {searchMutation.isPending && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        )}

        {/* AI Answer */}
        {searchMutation.data?.answer && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm">{searchMutation.data.answer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Citations */}
        {searchMutation.data?.citations && searchMutation.data.citations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Sources ({searchMutation.data.citations.length})
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {searchMutation.data.citations.map((citation, idx) => {
                  const config = typeConfig[citation.sourceType] || typeConfig.document;
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            {citation.relevance && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(citation.relevance * 100)}% relevant
                              </span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2">{citation.content}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Source: {citation.source}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No results */}
        {hasSearched && !searchMutation.isPending && 
         !searchMutation.data?.answer && 
         (!searchMutation.data?.citations || searchMutation.data.citations.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No results found for "{query}"</p>
            <p className="text-xs mt-1">Try a different query or add more data to your contacts</p>
          </div>
        )}

        {/* Error state */}
        {searchMutation.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <p className="text-sm">Search failed: {searchMutation.error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
