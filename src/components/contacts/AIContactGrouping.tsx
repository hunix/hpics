import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Sparkles, Users, Check, X, RefreshCw, Brain, 
  ChevronRight, Loader2
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';

interface GroupSuggestion {
  id: string;
  group_name: string;
  description: string;
  reasoning: string;
  suggested_members: { id: string; name: string }[];
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export function AIContactGrouping() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['ai-group-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_group_suggestions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        suggested_members: d.suggested_members as { id: string; name: string }[],
      })) as GroupSuggestion[];
    },
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const { data, error } = await invokeFunction('suggest-contact-groups');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Group suggestions generated!');
      queryClient.invalidateQueries({ queryKey: ['ai-group-suggestions'] });
    },
    onError: (error) => {
      toast.error(`Failed to generate suggestions: ${error.message}`);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (suggestion: GroupSuggestion) => {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('contact_groups')
        .insert({
          user_id: user!.id,
          name: suggestion.group_name,
          description: suggestion.description,
          color: getRandomColor(),
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members to the group
      const memberInserts = suggestion.suggested_members.map(member => ({
        group_id: group.id,
        profile_id: member.id,
      }));

      const { error: membersError } = await supabase
        .from('contact_group_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      // Update suggestion status
      await supabase
        .from('ai_group_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion.id);

      return group;
    },
    onSuccess: () => {
      toast.success('Group created successfully!');
      queryClient.invalidateQueries({ queryKey: ['ai-group-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('ai_group_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Suggestion dismissed');
      queryClient.invalidateQueries({ queryKey: ['ai-group-suggestions'] });
    },
  });

  const pendingSuggestions = suggestions?.filter(s => s.status === 'pending') || [];

  const getRandomColor = () => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Contact Grouping
            </CardTitle>
            <CardDescription>
              Smart group suggestions based on your contacts
            </CardDescription>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Suggestions
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingSuggestions.length > 0 ? (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {suggestion.group_name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(suggestion.confidence_score)}>
                      {Math.round(suggestion.confidence_score * 100)}% match
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 my-3">
                    <span className="text-xs text-muted-foreground">Members:</span>
                    <div className="flex -space-x-2">
                      {suggestion.suggested_members.slice(0, 5).map((member, i) => (
                        <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[10px]">
                            {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {suggestion.suggested_members.length > 5 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                          +{suggestion.suggested_members.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {suggestion.suggested_members.length} contacts
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-3">
                    <strong>Why:</strong> {suggestion.reasoning}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(suggestion)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Create Group
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(suggestion.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No pending suggestions</p>
            <p className="text-sm">
              Click "Generate Suggestions" to get AI-powered group recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
