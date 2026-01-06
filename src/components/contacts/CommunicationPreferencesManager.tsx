import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, MessageSquare, Clock, Brain, Heart, Save, Sparkles, Loader2 } from 'lucide-react';

interface CommunicationPreferencesManagerProps {
  profileId: string;
  contactName: string;
}

const channels = ['whatsapp', 'phone', 'email', 'in_person', 'text', 'video_call', 'linkedin'];
const communicationStyles = ['formal', 'casual', 'direct', 'diplomatic', 'warm', 'professional'];
const humorOptions = ['loves_humor', 'appreciates_wit', 'professional_only', 'avoid'];
const decisionStyles = ['analytical', 'emotional', 'quick', 'deliberate', 'collaborative'];
const influenceFactors = ['data', 'relationships', 'recognition', 'money', 'values', 'authority'];
const meetingPreferences = ['in_person', 'video', 'phone', 'no_preference'];
const smallTalkOptions = ['enjoys', 'tolerates', 'skip_to_business'];

export function CommunicationPreferencesManager({ profileId, contactName }: CommunicationPreferencesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    preferred_channels: [] as string[],
    avoid_channels: [] as string[],
    response_speed: '',
    communication_style: '',
    humor_receptivity: '',
    preferred_greeting: '',
    favorite_topics: [] as string[],
    topics_to_avoid: [] as string[],
    sensitivities: '',
    decision_style: '',
    influence_factors: [] as string[],
    meeting_preference: '',
    ideal_meeting_duration: '',
    small_talk_preference: '',
    how_they_show_appreciation: '',
    how_to_apologize: '',
    conflict_resolution_style: '',
  });
  const [newFavoriteTopic, setNewFavoriteTopic] = useState('');
  const [newAvoidTopic, setNewAvoidTopic] = useState('');

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['communication-preferences', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_communication_preferences')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        preferred_channels: preferences.preferred_channels || [],
        avoid_channels: preferences.avoid_channels || [],
        response_speed: preferences.response_speed || '',
        communication_style: preferences.communication_style || '',
        humor_receptivity: preferences.humor_receptivity || '',
        preferred_greeting: preferences.preferred_greeting || '',
        favorite_topics: preferences.favorite_topics || [],
        topics_to_avoid: preferences.topics_to_avoid || [],
        sensitivities: preferences.sensitivities || '',
        decision_style: preferences.decision_style || '',
        influence_factors: preferences.influence_factors || [],
        meeting_preference: preferences.meeting_preference || '',
        ideal_meeting_duration: preferences.ideal_meeting_duration || '',
        small_talk_preference: preferences.small_talk_preference || '',
        how_they_show_appreciation: preferences.how_they_show_appreciation || '',
        how_to_apologize: preferences.how_to_apologize || '',
        conflict_resolution_style: preferences.conflict_resolution_style || '',
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (preferences?.id) {
        const { error } = await supabase
          .from('contact_communication_preferences')
          .update(formData)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_communication_preferences')
          .insert({ ...formData, user_id: user!.id, profile_id: profileId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-preferences', profileId] });
      toast({ title: 'Preferences saved' });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    const arr = formData[field] as string[];
    const newArr = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
    updateField(field, newArr);
  };

  const addTopic = (field: 'favorite_topics' | 'topics_to_avoid', topic: string) => {
    if (!topic.trim()) return;
    const arr = formData[field];
    if (!arr.includes(topic.trim())) {
      updateField(field, [...arr, topic.trim()]);
    }
    if (field === 'favorite_topics') setNewFavoriteTopic('');
    else setNewAvoidTopic('');
  };

  const removeTopic = (field: 'favorite_topics' | 'topics_to_avoid', topic: string) => {
    updateField(field, (formData[field] as string[]).filter(t => t !== topic));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Communication Preferences
            </CardTitle>
            <CardDescription>
              How to best communicate with {contactName}
            </CardDescription>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="channels" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="channels"><MessageSquare className="h-4 w-4 mr-2" />Channels</TabsTrigger>
              <TabsTrigger value="style"><Brain className="h-4 w-4 mr-2" />Style</TabsTrigger>
              <TabsTrigger value="topics"><Heart className="h-4 w-4 mr-2" />Topics</TabsTrigger>
              <TabsTrigger value="meetings"><Clock className="h-4 w-4 mr-2" />Meetings</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <div className="space-y-3">
                <Label>Preferred Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {channels.map(channel => (
                    <Badge 
                      key={channel}
                      variant={formData.preferred_channels.includes(channel) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleArrayItem('preferred_channels', channel)}
                    >
                      {channel.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Channels to Avoid</Label>
                <div className="flex flex-wrap gap-2">
                  {channels.map(channel => (
                    <Badge 
                      key={channel}
                      variant={formData.avoid_channels.includes(channel) ? 'destructive' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleArrayItem('avoid_channels', channel)}
                    >
                      {channel.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Response Speed</Label>
                <Select value={formData.response_speed} onValueChange={(v) => updateField('response_speed', v)}>
                  <SelectTrigger><SelectValue placeholder="How fast do they respond?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (minutes)</SelectItem>
                    <SelectItem value="same_day">Same day</SelectItem>
                    <SelectItem value="few_days">Few days</SelectItem>
                    <SelectItem value="slow">Slow (week+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Communication Style</Label>
                  <Select value={formData.communication_style} onValueChange={(v) => updateField('communication_style', v)}>
                    <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                    <SelectContent>
                      {communicationStyles.map(style => (
                        <SelectItem key={style} value={style} className="capitalize">{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Humor Receptivity</Label>
                  <Select value={formData.humor_receptivity} onValueChange={(v) => updateField('humor_receptivity', v)}>
                    <SelectTrigger><SelectValue placeholder="How do they react to humor?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loves_humor">Loves humor</SelectItem>
                      <SelectItem value="appreciates_wit">Appreciates wit</SelectItem>
                      <SelectItem value="professional_only">Professional only</SelectItem>
                      <SelectItem value="avoid">Avoid jokes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Greeting</Label>
                <Input 
                  placeholder="How they like to be greeted..."
                  value={formData.preferred_greeting}
                  onChange={(e) => updateField('preferred_greeting', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Decision Style</Label>
                  <Select value={formData.decision_style} onValueChange={(v) => updateField('decision_style', v)}>
                    <SelectTrigger><SelectValue placeholder="How do they decide?" /></SelectTrigger>
                    <SelectContent>
                      {decisionStyles.map(style => (
                        <SelectItem key={style} value={style} className="capitalize">{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conflict Resolution</Label>
                  <Select value={formData.conflict_resolution_style} onValueChange={(v) => updateField('conflict_resolution_style', v)}>
                    <SelectTrigger><SelectValue placeholder="How do they handle conflict?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct confrontation</SelectItem>
                      <SelectItem value="avoidant">Avoidant</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="compromising">Compromising</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <Label>What Influences Them</Label>
                <div className="flex flex-wrap gap-2">
                  {influenceFactors.map(factor => (
                    <Badge 
                      key={factor}
                      variant={formData.influence_factors.includes(factor) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleArrayItem('influence_factors', factor)}
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="topics" className="space-y-4">
              <div className="space-y-3">
                <Label>Favorite Topics (they enjoy discussing)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a topic..."
                    value={newFavoriteTopic}
                    onChange={(e) => setNewFavoriteTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTopic('favorite_topics', newFavoriteTopic)}
                  />
                  <Button onClick={() => addTopic('favorite_topics', newFavoriteTopic)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.favorite_topics.map(topic => (
                    <Badge key={topic} variant="default" className="cursor-pointer" onClick={() => removeTopic('favorite_topics', topic)}>
                      {topic} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Topics to Avoid</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a topic to avoid..."
                    value={newAvoidTopic}
                    onChange={(e) => setNewAvoidTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTopic('topics_to_avoid', newAvoidTopic)}
                  />
                  <Button variant="outline" onClick={() => addTopic('topics_to_avoid', newAvoidTopic)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.topics_to_avoid.map(topic => (
                    <Badge key={topic} variant="destructive" className="cursor-pointer" onClick={() => removeTopic('topics_to_avoid', topic)}>
                      {topic} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sensitivities</Label>
                <Textarea 
                  placeholder="Things they're sensitive about..."
                  value={formData.sensitivities}
                  onChange={(e) => updateField('sensitivities', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="meetings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Preference</Label>
                  <Select value={formData.meeting_preference} onValueChange={(v) => updateField('meeting_preference', v)}>
                    <SelectTrigger><SelectValue placeholder="How do they prefer to meet?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In person</SelectItem>
                      <SelectItem value="video">Video call</SelectItem>
                      <SelectItem value="phone">Phone call</SelectItem>
                      <SelectItem value="no_preference">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ideal Meeting Duration</Label>
                  <Select value={formData.ideal_meeting_duration} onValueChange={(v) => updateField('ideal_meeting_duration', v)}>
                    <SelectTrigger><SelectValue placeholder="How long?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick_15">Quick (15 min)</SelectItem>
                      <SelectItem value="standard_30">Standard (30 min)</SelectItem>
                      <SelectItem value="deep_60">Deep (60 min)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Small Talk Preference</Label>
                <Select value={formData.small_talk_preference} onValueChange={(v) => updateField('small_talk_preference', v)}>
                  <SelectTrigger><SelectValue placeholder="How do they feel about small talk?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enjoys">Enjoys small talk</SelectItem>
                    <SelectItem value="tolerates">Tolerates it</SelectItem>
                    <SelectItem value="skip_to_business">Skip to business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>How They Show Appreciation</Label>
                <Textarea 
                  placeholder="How do they typically express gratitude?"
                  value={formData.how_they_show_appreciation}
                  onChange={(e) => updateField('how_they_show_appreciation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Best Way to Apologize</Label>
                <Textarea 
                  placeholder="If you need to apologize, how should you do it?"
                  value={formData.how_to_apologize}
                  onChange={(e) => updateField('how_to_apologize', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
