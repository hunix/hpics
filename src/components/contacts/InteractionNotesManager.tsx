import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, StickyNote, Phone, Video, Coffee, Mail, MessageSquare, Users, Trash2, Edit, Calendar, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface InteractionNotesManagerProps {
  profileId: string;
  contactName: string;
}

const interactionTypes = [
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'meeting', label: 'Meeting', icon: Coffee },
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'message', label: 'Message', icon: MessageSquare },
  { value: 'social', label: 'Social Event', icon: Users },
  { value: 'chance_encounter', label: 'Chance Encounter', icon: Users },
];

const moodOptions = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500' },
  { value: 'excited', label: 'Excited', icon: Smile, color: 'text-yellow-500' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500' },
  { value: 'stressed', label: 'Stressed', icon: Frown, color: 'text-orange-500' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-500' },
  { value: 'anxious', label: 'Anxious', icon: AlertCircle, color: 'text-red-500' },
];

const temperatureOptions = ['warm', 'neutral', 'cool', 'strained'];

export function InteractionNotesManager({ profileId, contactName }: InteractionNotesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [formData, setFormData] = useState({
    interaction_type: 'meeting',
    interaction_date: new Date().toISOString().slice(0, 16),
    duration_minutes: '',
    location: '',
    note_text: '',
    mood_observed: '',
    topics_discussed: [] as string[],
    action_items: [] as string[],
    relationship_temperature: '',
    notable_changes: '',
    follow_up_needed: false,
    follow_up_date: '',
    follow_up_reason: '',
  });
  const [newTopic, setNewTopic] = useState('');
  const [newActionItem, setNewActionItem] = useState('');

  const { data: notes, isLoading } = useQuery({
    queryKey: ['interaction-notes', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('interaction_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingNote) {
        const { error } = await supabase
          .from('contact_interaction_notes')
          .update(data)
          .eq('id', editingNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_interaction_notes')
          .insert({ ...data, user_id: user!.id, profile_id: profileId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interaction-notes', profileId] });
      toast({ title: editingNote ? 'Note updated' : 'Note added' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_interaction_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interaction-notes', profileId] });
      toast({ title: 'Note deleted' });
    },
  });

  const resetForm = () => {
    setFormData({
      interaction_type: 'meeting',
      interaction_date: new Date().toISOString().slice(0, 16),
      duration_minutes: '',
      location: '',
      note_text: '',
      mood_observed: '',
      topics_discussed: [],
      action_items: [],
      relationship_temperature: '',
      notable_changes: '',
      follow_up_needed: false,
      follow_up_date: '',
      follow_up_reason: '',
    });
    setEditingNote(null);
    setIsDialogOpen(false);
    setNewTopic('');
    setNewActionItem('');
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      interaction_type: note.interaction_type,
      interaction_date: note.interaction_date?.slice(0, 16) || '',
      duration_minutes: note.duration_minutes?.toString() || '',
      location: note.location || '',
      note_text: note.note_text,
      mood_observed: note.mood_observed || '',
      topics_discussed: note.topics_discussed || [],
      action_items: note.action_items || [],
      relationship_temperature: note.relationship_temperature || '',
      notable_changes: note.notable_changes || '',
      follow_up_needed: note.follow_up_needed || false,
      follow_up_date: note.follow_up_date || '',
      follow_up_reason: note.follow_up_reason || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.note_text.trim()) {
      toast({ title: 'Note text required', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      follow_up_date: formData.follow_up_date || null,
    });
  };

  const addTopic = () => {
    if (newTopic.trim() && !formData.topics_discussed.includes(newTopic.trim())) {
      setFormData(prev => ({ ...prev, topics_discussed: [...prev.topics_discussed, newTopic.trim()] }));
      setNewTopic('');
    }
  };

  const addActionItem = () => {
    if (newActionItem.trim() && !formData.action_items.includes(newActionItem.trim())) {
      setFormData(prev => ({ ...prev, action_items: [...prev.action_items, newActionItem.trim()] }));
      setNewActionItem('');
    }
  };

  const getTypeConfig = (type: string) => interactionTypes.find(t => t.value === type) || interactionTypes[0];
  const getMoodConfig = (mood: string) => moodOptions.find(m => m.value === mood);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Interaction Notes
            </CardTitle>
            <CardDescription>
              Quick notes after meetings and conversations with {contactName}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'Edit' : 'Add'} Interaction Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.interaction_type} onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {interactionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>When</Label>
                    <Input 
                      type="datetime-local" 
                      value={formData.interaction_date}
                      onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input 
                      type="number" 
                      placeholder="30"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    placeholder="Where did this happen?"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes *</Label>
                  <Textarea 
                    placeholder="What happened? What did you talk about? Key takeaways..."
                    className="min-h-[100px]"
                    value={formData.note_text}
                    onChange={(e) => setFormData({ ...formData, note_text: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Their Mood</Label>
                    <Select value={formData.mood_observed} onValueChange={(v) => setFormData({ ...formData, mood_observed: v })}>
                      <SelectTrigger><SelectValue placeholder="How did they seem?" /></SelectTrigger>
                      <SelectContent>
                        {moodOptions.map(mood => (
                          <SelectItem key={mood.value} value={mood.value}>
                            <div className="flex items-center gap-2">
                              <mood.icon className={`h-4 w-4 ${mood.color}`} />
                              {mood.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship Temperature</Label>
                    <Select value={formData.relationship_temperature} onValueChange={(v) => setFormData({ ...formData, relationship_temperature: v })}>
                      <SelectTrigger><SelectValue placeholder="How's the relationship?" /></SelectTrigger>
                      <SelectContent>
                        {temperatureOptions.map(temp => (
                          <SelectItem key={temp} value={temp} className="capitalize">{temp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Topics Discussed</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a topic..."
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    />
                    <Button type="button" onClick={addTopic}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.topics_discussed.map(topic => (
                      <Badge key={topic} variant="secondary" className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, topics_discussed: prev.topics_discussed.filter(t => t !== topic) }))}>
                        {topic} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Action Items</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add an action item..."
                      value={newActionItem}
                      onChange={(e) => setNewActionItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                    />
                    <Button type="button" onClick={addActionItem}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.action_items.map(item => (
                      <Badge key={item} variant="outline" className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, action_items: prev.action_items.filter(i => i !== item) }))}>
                        {item} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notable Changes</Label>
                  <Textarea 
                    placeholder="Any changes you noticed in them?"
                    value={formData.notable_changes}
                    onChange={(e) => setFormData({ ...formData, notable_changes: e.target.value })}
                  />
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="follow_up"
                      checked={formData.follow_up_needed}
                      onCheckedChange={(checked) => setFormData({ ...formData, follow_up_needed: !!checked })}
                    />
                    <Label htmlFor="follow_up">Follow-up needed</Label>
                  </div>
                  {formData.follow_up_needed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Follow-up Date</Label>
                        <Input 
                          type="date"
                          value={formData.follow_up_date}
                          onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input 
                          placeholder="Why follow up?"
                          value={formData.follow_up_reason}
                          onChange={(e) => setFormData({ ...formData, follow_up_reason: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !notes?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No interaction notes yet</p>
            <p className="text-sm">Start logging your interactions with {contactName}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {notes.map((note: any) => {
                const typeConfig = getTypeConfig(note.interaction_type);
                const moodConfig = getMoodConfig(note.mood_observed);
                return (
                  <div key={note.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <typeConfig.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{typeConfig.label}</span>
                            {note.location && <span className="text-sm text-muted-foreground">at {note.location}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(note.interaction_date), 'MMM d, yyyy h:mm a')}
                            {note.duration_minutes && ` • ${note.duration_minutes} min`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {moodConfig && (
                          <Badge variant="outline" className="gap-1">
                            <moodConfig.icon className={`h-3 w-3 ${moodConfig.color}`} />
                            {moodConfig.label}
                          </Badge>
                        )}
                        {note.relationship_temperature && (
                          <Badge variant={note.relationship_temperature === 'warm' ? 'default' : note.relationship_temperature === 'strained' ? 'destructive' : 'secondary'}>
                            {note.relationship_temperature}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(note.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm">{note.note_text}</p>
                    {note.topics_discussed?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.topics_discussed.map((topic: string) => (
                          <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                        ))}
                      </div>
                    )}
                    {note.action_items?.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Action items: </span>
                        {note.action_items.join(', ')}
                      </div>
                    )}
                    {note.follow_up_needed && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                        <Calendar className="h-4 w-4" />
                        Follow up {note.follow_up_date ? `by ${format(new Date(note.follow_up_date), 'MMM d')}` : 'needed'}
                        {note.follow_up_reason && `: ${note.follow_up_reason}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
