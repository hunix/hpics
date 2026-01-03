import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Plus, MapPin, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Experience {
  id: string;
  experience_type: string;
  title: string;
  description: string | null;
  experience_date: string | null;
  location: string | null;
  tags: string[] | null;
  sentiment: string | null;
  created_at: string;
}

interface SharedExperiencesProps {
  profileId: string;
  contactName: string;
}

const experienceTypes = [
  { value: 'trip', label: 'Trip', emoji: '✈️' },
  { value: 'event', label: 'Event', emoji: '🎉' },
  { value: 'project', label: 'Project', emoji: '💼' },
  { value: 'celebration', label: 'Celebration', emoji: '🎊' },
  { value: 'meal', label: 'Meal', emoji: '🍽️' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

const sentiments = [
  { value: 'positive', label: 'Positive', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'negative', label: 'Negative', emoji: '😔' },
];

export function SharedExperiences({ profileId, contactName }: SharedExperiencesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    type: 'event',
    title: '',
    description: '',
    date: '',
    location: '',
    sentiment: 'positive',
    tags: '',
  });

  // Fetch experiences
  const { data: experiences, isLoading } = useQuery<Experience[]>({
    queryKey: ['shared-experiences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_experiences')
        .select('*')
        .eq('profile_id', profileId)
        .order('experience_date', { ascending: false });
      if (error) throw error;
      return data as Experience[];
    },
    enabled: !!user,
  });

  // Add experience mutation
  const addExperienceMutation = useMutation({
    mutationFn: async () => {
      if (!newExp.title.trim()) throw new Error('Title is required');
      const { error } = await supabase.from('shared_experiences').insert({
        user_id: user!.id,
        profile_id: profileId,
        experience_type: newExp.type,
        title: newExp.title.trim(),
        description: newExp.description.trim() || null,
        experience_date: newExp.date || null,
        location: newExp.location.trim() || null,
        sentiment: newExp.sentiment,
        tags: newExp.tags ? newExp.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-experiences', profileId] });
      setNewExp({
        type: 'event',
        title: '',
        description: '',
        date: '',
        location: '',
        sentiment: 'positive',
        tags: '',
      });
      setIsOpen(false);
      toast.success('Experience added!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add experience');
    },
  });

  // Delete experience mutation
  const deleteExperienceMutation = useMutation({
    mutationFn: async (expId: string) => {
      const { error } = await supabase
        .from('shared_experiences')
        .delete()
        .eq('id', expId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-experiences', profileId] });
      toast.success('Experience removed');
    },
  });

  const getTypeEmoji = (type: string) => {
    return experienceTypes.find(t => t.value === type)?.emoji || '📌';
  };

  const getSentimentEmoji = (sentiment: string | null) => {
    if (!sentiment) return '';
    return sentiments.find(s => s.value === sentiment)?.emoji || '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Shared Experiences
            </CardTitle>
            <CardDescription>
              Memorable moments with {contactName}
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shared Experience</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <Select value={newExp.type} onValueChange={(v) => setNewExp(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Title"
                    value={newExp.title}
                    onChange={(e) => setNewExp(prev => ({ ...prev, title: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <Textarea
                  placeholder="Description (optional)"
                  value={newExp.description}
                  onChange={(e) => setNewExp(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={newExp.date}
                    onChange={(e) => setNewExp(prev => ({ ...prev, date: e.target.value }))}
                    className="w-40"
                  />
                  <Input
                    placeholder="Location"
                    value={newExp.location}
                    onChange={(e) => setNewExp(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={newExp.sentiment} onValueChange={(v) => setNewExp(prev => ({ ...prev, sentiment: v }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sentiments.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.emoji} {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newExp.tags}
                    onChange={(e) => setNewExp(prev => ({ ...prev, tags: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <Button onClick={() => addExperienceMutation.mutate()} disabled={addExperienceMutation.isPending || !newExp.title.trim()} className="w-full">
                  Add Experience
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : experiences && experiences.length > 0 ? (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="p-3 border rounded-lg group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getTypeEmoji(exp.experience_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{exp.title}</h4>
                          <span>{getSentimentEmoji(exp.sentiment)}</span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{exp.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {exp.experience_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(exp.experience_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {exp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {exp.location}
                            </span>
                          )}
                        </div>
                        {exp.tags && exp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exp.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteExperienceMutation.mutate(exp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No shared experiences yet.</p>
            <p className="text-sm">Add memorable moments you've shared!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
