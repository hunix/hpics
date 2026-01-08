import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Edit2, 
  Lock, 
  Globe,
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
  id: string;
  profile_id: string;
  user_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactCommentsPanelProps {
  profileId: string;
  profileName?: string;
}

export function ContactCommentsPanel({ profileId, profileName }: ContactCommentsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['contact-comments', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_comments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!profileId && !!user,
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_comments',
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['contact-comments', profileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

  // Add comment mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newComment.trim()) throw new Error('Invalid input');

      const { error } = await supabase
        .from('contact_comments')
        .insert({
          profile_id: profileId,
          user_id: user.id,
          content: newComment.trim(),
          is_private: isPrivate,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['contact-comments', profileId] });
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('contact_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['contact-comments', profileId] });
      toast.success('Comment updated');
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_comments')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-comments', profileId] });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Team Notes
          {profileName && <span className="text-muted-foreground font-normal">for {profileName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a note about this contact..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="private-toggle"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private-toggle" className="text-sm flex items-center gap-1">
                {isPrivate ? (
                  <>
                    <Lock className="h-3 w-3" /> Private
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" /> Team visible
                  </>
                )}
              </Label>
            </div>
            <Button
              size="sm"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !newComment.trim()}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Add Note
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Be the first to add a note about this contact</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isOwn = comment.user_id === user?.id;
                const isEditing = editingId === comment.id;

                return (
                  <div key={comment.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.user_id.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">
                            {isOwn ? 'You' : 'Team member'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        {comment.is_private && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" /> Private
                          </Badge>
                        )}
                      </div>
                      {isOwn && !isEditing && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => startEdit(comment)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteMutation.mutate(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: comment.id, content: editContent })}
                            disabled={updateMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
