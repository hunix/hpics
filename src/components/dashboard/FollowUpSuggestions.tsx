import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLogFollowup } from '@/hooks/communications/useLogFollowup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, Mail, Phone, MessageSquare, Calendar, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { invokeFunction } from '@/lib/api';

type FollowUpSuggestion = {
  contactId: string;
  contactName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  daysSinceContact: number;
};

const priorityColors = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

const actionIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
};

export function FollowUpSuggestions() {
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const { data: suggestions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['follow-up-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('suggest-followups');
      
      if (error) {
        console.error('Error fetching suggestions:', error);
        throw error;
      }
      
      return (data?.suggestions ?? []) as FollowUpSuggestion[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const logFollowup = useLogFollowup();
  const logCommunicationMutation = {
    mutate: (input: { contactId: string; channel: string }) =>
      logFollowup.mutate(input, {
        onSuccess: () => toast.success('Interaction logged!'),
        onError: () => toast.error('Failed to log interaction'),
      }),
  };

  const handleDismiss = (contactId: string) => {
    setDismissedIds(prev => [...prev, contactId]);
    toast.success('Suggestion dismissed');
  };

  const handleQuickAction = (contactId: string, action: string) => {
    const channelMap: Record<string, string> = {
      email: 'email',
      call: 'phone',
      message: 'message',
      meeting: 'in_person',
    };
    
    logCommunicationMutation.mutate({
      contactId,
      channel: channelMap[action] || 'other',
    });
  };

  const filteredSuggestions = suggestions?.filter(s => !dismissedIds.includes(s.contactId)) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Follow-up Suggestions
          </CardTitle>
          <CardDescription>
            Smart recommendations based on your communication patterns
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredSuggestions.length > 0 ? (
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.contactId}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{suggestion.contactName}</span>
                      <Badge className={priorityColors[suggestion.priority]}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.reason}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Suggested:</span> {suggestion.suggestedAction}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last contact: {suggestion.daysSinceContact} days ago
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      {['email', 'call', 'message'].map(action => (
                        <Button
                          key={action}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuickAction(suggestion.contactId, action)}
                          title={`Log ${action}`}
                        >
                          {actionIcons[action]}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(suggestion.contactId)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No follow-up suggestions at the moment.</p>
            <p className="text-sm">Great job staying in touch!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
