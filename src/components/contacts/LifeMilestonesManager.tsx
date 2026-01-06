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
import { Plus, Calendar, Briefcase, Heart, Award, AlertTriangle, Users, Trash2, Edit, Milestone } from 'lucide-react';
import { format } from 'date-fns';

interface LifeMilestonesManagerProps {
  profileId: string;
  contactName: string;
}

const milestoneTypes = [
  { value: 'career', label: 'Career', icon: Briefcase, color: 'bg-blue-500' },
  { value: 'personal', label: 'Personal', icon: Heart, color: 'bg-pink-500' },
  { value: 'family', label: 'Family', icon: Users, color: 'bg-green-500' },
  { value: 'achievement', label: 'Achievement', icon: Award, color: 'bg-yellow-500' },
  { value: 'health', label: 'Health', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'loss', label: 'Loss/Challenge', icon: AlertTriangle, color: 'bg-gray-500' },
  { value: 'other', label: 'Other', icon: Milestone, color: 'bg-purple-500' },
];

const impactLevels = ['major', 'significant', 'medium', 'minor'];
const emotionalValences = ['positive', 'negative', 'neutral', 'mixed'];

export function LifeMilestonesManager({ profileId, contactName }: LifeMilestonesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [formData, setFormData] = useState({
    milestone_type: 'career',
    title: '',
    description: '',
    event_date: '',
    approximate_date: '',
    impact_level: 'medium',
    emotional_valence: 'positive',
    your_involvement: '',
    source: 'conversation',
  });

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['life-milestones', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_life_milestones')
        .select('*')
        .eq('profile_id', profileId)
        .order('event_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingMilestone) {
        const { error } = await supabase
          .from('contact_life_milestones')
          .update(data)
          .eq('id', editingMilestone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_life_milestones')
          .insert({ ...data, user_id: user!.id, profile_id: profileId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-milestones', profileId] });
      toast({ title: editingMilestone ? 'Milestone updated' : 'Milestone added' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_life_milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-milestones', profileId] });
      toast({ title: 'Milestone deleted' });
    },
  });

  const resetForm = () => {
    setFormData({
      milestone_type: 'career',
      title: '',
      description: '',
      event_date: '',
      approximate_date: '',
      impact_level: 'medium',
      emotional_valence: 'positive',
      your_involvement: '',
      source: 'conversation',
    });
    setEditingMilestone(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (milestone: any) => {
    setEditingMilestone(milestone);
    setFormData({
      milestone_type: milestone.milestone_type,
      title: milestone.title,
      description: milestone.description || '',
      event_date: milestone.event_date || '',
      approximate_date: milestone.approximate_date || '',
      impact_level: milestone.impact_level || 'medium',
      emotional_valence: milestone.emotional_valence || 'positive',
      your_involvement: milestone.your_involvement || '',
      source: milestone.source || 'conversation',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({
      ...formData,
      event_date: formData.event_date || null,
    });
  };

  const getTypeConfig = (type: string) => milestoneTypes.find(t => t.value === type) || milestoneTypes[6];

  const groupedMilestones = milestones?.reduce((acc, milestone) => {
    const year = milestone.event_date 
      ? new Date(milestone.event_date).getFullYear().toString()
      : milestone.approximate_date || 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(milestone);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Milestone className="h-5 w-5" />
              Life Milestones
            </CardTitle>
            <CardDescription>
              Track {contactName}'s major life events over time
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingMilestone ? 'Edit' : 'Add'} Life Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.milestone_type} onValueChange={(v) => setFormData({ ...formData, milestone_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {milestoneTypes.map(type => (
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
                    <Label>Impact Level</Label>
                    <Select value={formData.impact_level} onValueChange={(v) => setFormData({ ...formData, impact_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {impactLevels.map(level => (
                          <SelectItem key={level} value={level} className="capitalize">{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input 
                    placeholder="e.g., Got promoted to VP" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Details about this milestone..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date (if known)</Label>
                    <Input 
                      type="date" 
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Or Approximate</Label>
                    <Input 
                      placeholder="e.g., Early 2020"
                      value={formData.approximate_date}
                      onChange={(e) => setFormData({ ...formData, approximate_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emotional Impact</Label>
                    <Select value={formData.emotional_valence} onValueChange={(v) => setFormData({ ...formData, emotional_valence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {emotionalValences.map(v => (
                          <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversation">Conversation</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="shared_experience">Shared Experience</SelectItem>
                        <SelectItem value="observation">Observation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your Involvement</Label>
                  <Textarea 
                    placeholder="How were you involved in this milestone?"
                    value={formData.your_involvement}
                    onChange={(e) => setFormData({ ...formData, your_involvement: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !milestones?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Milestone className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No milestones recorded yet</p>
            <p className="text-sm">Start documenting {contactName}'s life journey</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedMilestones || {})
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([year, yearMilestones]) => (
                  <div key={year}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">{year}</h3>
                    <div className="space-y-3">
                      {yearMilestones.map((milestone: any) => {
                        const config = getTypeConfig(milestone.milestone_type);
                        return (
                          <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <div className={`p-2 rounded-full ${config.color} text-white shrink-0`}>
                              <config.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{milestone.title}</span>
                                <Badge variant={milestone.emotional_valence === 'positive' ? 'default' : milestone.emotional_valence === 'negative' ? 'destructive' : 'secondary'} className="text-xs">
                                  {milestone.impact_level}
                                </Badge>
                              </div>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                              {milestone.your_involvement && (
                                <p className="text-xs text-muted-foreground mt-1 italic">Your role: {milestone.your_involvement}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                {milestone.event_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(milestone.event_date), 'MMM d, yyyy')}
                                  </span>
                                )}
                                <span>via {milestone.source}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(milestone)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(milestone.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
