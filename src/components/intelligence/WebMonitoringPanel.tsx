import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Globe, ExternalLink, RefreshCw, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { invokeFunction } from '@/lib/api';

interface WebMention {
  id: string;
  profileId: string;
  profileName: string;
  url: string;
  title: string;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isNew: boolean;
  detectedAt: Date;
}

export function WebMonitoringPanel() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: mentionsData, isLoading } = useQuery({
    queryKey: ['web-mentions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { mentions: [], stats: { total: 0, positive: 0, negative: 0, newToday: 0 } };

      const { data: results } = await supabase
        .from('web_monitoring_results')
        .select('*, profiles(first_name, last_name)')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .limit(50);

      const mentions = (results || []).map((r: any) => ({
        id: r.id,
        profileId: r.profile_id,
        profileName: r.profiles ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() : 'Unknown',
        url: r.url,
        title: r.title || 'No title',
        snippet: r.snippet || '',
        sentiment: r.sentiment || 'neutral',
        isNew: r.is_new,
        detectedAt: new Date(r.detected_at)
      }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        total: mentions.length,
        positive: mentions.filter(m => m.sentiment === 'positive').length,
        negative: mentions.filter(m => m.sentiment === 'negative').length,
        newToday: mentions.filter(m => m.detectedAt >= today).length
      };

      return { mentions, stats };
    },
    refetchInterval: 60000
  });

  const refreshMentions = useMutation({
    mutationFn: async () => {
      setRefreshing(true);
      const { error } = await invokeFunction('monitor-web-mentions', { action: 'check_all' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Web mentions refreshed');
      queryClient.invalidateQueries({ queryKey: ['web-mentions'] });
      setRefreshing(false);
    },
    onError: () => {
      toast.error('Failed to refresh mentions');
      setRefreshing(false);
    }
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'default';
      case 'negative': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { mentions, stats } = mentionsData || { mentions: [], stats: { total: 0, positive: 0, negative: 0, newToday: 0 } };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web Monitoring
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refreshMentions.mutate()}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded">
            <div className="text-lg font-bold text-blue-500">{stats.newToday}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded">
            <div className="text-lg font-bold text-green-500">{stats.positive}</div>
            <div className="text-xs text-muted-foreground">Positive</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded">
            <div className="text-lg font-bold text-red-500">{stats.negative}</div>
            <div className="text-xs text-muted-foreground">Negative</div>
          </div>
        </div>

        {/* Mentions List */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {mentions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No web mentions tracked yet</p>
                <p className="text-xs mt-1">Enable monitoring for contacts to track mentions</p>
              </div>
            ) : (
              mentions.map(mention => (
                <div
                  key={mention.id}
                  className={`p-3 rounded-lg border ${mention.isNew ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'}`}
                >
                  <div className="flex items-start gap-2">
                    {getSentimentIcon(mention.sentiment)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{mention.profileName}</span>
                        <Badge variant={getSentimentBadge(mention.sentiment) as any} className="text-xs">
                          {mention.sentiment}
                        </Badge>
                        {mention.isNew && (
                          <Badge variant="outline" className="text-xs bg-primary/10">New</Badge>
                        )}
                      </div>
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {mention.title.slice(0, 60)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {mention.snippet}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(mention.detectedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
