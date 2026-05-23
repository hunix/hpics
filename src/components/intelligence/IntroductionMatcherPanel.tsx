import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, RefreshCw, Sparkles, ChevronDown, Link2, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface IntroductionSuggestion {
  contact1Id: string;
  contact1Name: string;
  contact2Id: string;
  contact2Name: string;
  reason: string;
  potentialValue: number;
  suggestedContext: string;
}

export function IntroductionMatcherPanel() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['introduction-suggestions', user?.id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('suggest-introductions', {}, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data as { introductions: IntroductionSuggestion[] };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Introduction suggestions updated');
    } catch (error) {
      toast.error('Failed to refresh suggestions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyIntroScript = (suggestion: IntroductionSuggestion) => {
    const script = `Hi ${suggestion.contact1Name},

I wanted to introduce you to ${suggestion.contact2Name}. ${suggestion.reason}

${suggestion.suggestedContext}

Let me know if you'd like me to connect you both!`;

    navigator.clipboard.writeText(script);
    setCopiedId(`${suggestion.contact1Id}-${suggestion.contact2Id}`);
    toast.success('Introduction script copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const introductions = data?.introductions || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Introduction Matcher
          </CardTitle>
          <CardDescription>High-value connections in your network</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {introductions.length > 0 ? (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {introductions.map((suggestion, index) => {
                const pairId = `${suggestion.contact1Id}-${suggestion.contact2Id}`;
                const isExpanded = expandedId === pairId;
                const isCopied = copiedId === pairId;

                return (
                  <Collapsible
                    key={index}
                    open={isExpanded}
                    onOpenChange={() => setExpandedId(isExpanded ? null : pairId)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">
                                {suggestion.contact1Name}
                              </span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium text-sm">
                                {suggestion.contact2Name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {suggestion.potentialValue}/10
                              </Badge>
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-left line-clamp-1">
                            {suggestion.reason}
                          </p>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-3 border-t bg-muted/30">
                          <div className="pt-3">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                              Why introduce them:
                            </h5>
                            <p className="text-sm">{suggestion.reason}</p>
                          </div>

                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                              Suggested context:
                            </h5>
                            <p className="text-sm italic">"{suggestion.suggestedContext}"</p>
                          </div>

                          <div className="flex gap-2">
                            <Link to={`/contacts/${suggestion.contact1Id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View {suggestion.contact1Name.split(' ')[0]}
                              </Button>
                            </Link>
                            <Link to={`/contacts/${suggestion.contact2Id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View {suggestion.contact2Name.split(' ')[0]}
                              </Button>
                            </Link>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyIntroScript(suggestion);
                            }}
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            {isCopied ? 'Copied!' : 'Copy Introduction Script'}
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No matches found</p>
            <p className="text-xs">Add more contacts with interests and skills to find connections</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
