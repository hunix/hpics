import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, X, Users, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaContactTaggerProps {
  mediaId: string;
  currentProfileId?: string;
  onTagsChange?: () => void;
}

interface TaggedContact {
  id: string;
  profile_id: string;
  confidence: number | null;
  tagged_by: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function MediaContactTagger({ mediaId, currentProfileId, onTagsChange }: MediaContactTaggerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch existing tags for this media
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['media-contact-tags', mediaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_contact_tags')
        .select(`
          id,
          profile_id,
          confidence,
          tagged_by,
          profile:profiles!media_contact_tags_profile_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('media_id', mediaId);
      
      if (error) throw error;
      return data as unknown as TaggedContact[];
    },
    enabled: !!user && !!mediaId,
  });

  // Fetch all contacts for tagging with pagination to handle 3000+ contacts
  const { data: allContacts } = useQuery({
    queryKey: ['contacts-for-tagging', user?.id],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      const allData: Array<{ id: string; first_name: string; last_name: string | null; avatar_url: string | null }> = [];
      let from = 0;
      
      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('user_id', user!.id)
          .order('first_name')
          .range(from, from + PAGE_SIZE - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData.push(...data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      
      return allData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Filter out already tagged contacts
  const availableContacts = useMemo(() => {
    if (!allContacts || !tags) return [];
    const taggedIds = new Set(tags.map(t => t.profile_id));
    return allContacts.filter(c => !taggedIds.has(c.id));
  }, [allContacts, tags]);

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('media_contact_tags')
        .insert({
          media_id: mediaId,
          profile_id: profileId,
          user_id: user!.id,
          tagged_by: 'user',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-contact-tags', mediaId] });
      onTagsChange?.();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to tag contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('media_contact_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-contact-tags', mediaId] });
      onTagsChange?.();
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (tagsLoading) {
    return <div className="h-8 w-20 bg-muted animate-pulse rounded" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tagged contacts */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={tag.tagged_by === 'ai' ? 'secondary' : 'outline'}
              className="flex items-center gap-1.5 pr-1"
            >
              <Avatar className="h-4 w-4">
                {tag.profile.avatar_url && (
                  <AvatarImage src={tag.profile.avatar_url} />
                )}
                <AvatarFallback className="text-[8px]">
                  {getInitials(tag.profile.first_name, tag.profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {tag.profile.first_name}
                {tag.profile.id === currentProfileId && ' (owner)'}
              </span>
              {tag.tagged_by === 'ai' && (
                <Sparkles className="h-3 w-3 text-yellow-500" />
              )}
              {tag.confidence && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(tag.confidence * 100)}%
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive/20"
                onClick={() => removeTagMutation.mutate(tag.id)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add contact button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="text-xs">Tag</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search contacts..." />
            <CommandList>
              <CommandEmpty>No contacts found.</CommandEmpty>
              <CommandGroup>
                {availableContacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.first_name} ${contact.last_name || ''}`}
                    onSelect={() => addTagMutation.mutate(contact.id)}
                    className="cursor-pointer"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      {contact.avatar_url && (
                        <AvatarImage src={contact.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(contact.first_name, contact.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {contact.first_name} {contact.last_name || ''}
                    </span>
                    <Check className={cn(
                      "ml-auto h-4 w-4",
                      tags?.some(t => t.profile_id === contact.id) ? "opacity-100" : "opacity-0"
                    )} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Empty state */}
      {(!tags || tags.length === 0) && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          No one tagged
        </span>
      )}
    </div>
  );
}
