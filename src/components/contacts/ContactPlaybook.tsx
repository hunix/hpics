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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Save, Sparkles, Loader2, ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle, Heart, CheckCircle } from 'lucide-react';

interface ContactPlaybookProps {
  profileId: string;
  contactName: string;
}

export function ContactPlaybook({ profileId, contactName }: ContactPlaybookProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    personality_summary: '',
    working_with_them: '',
    dos: [] as string[],
    donts: [] as string[],
    how_to_ask_favor: '',
    how_to_give_feedback: '',
    how_to_deliver_bad_news: '',
    how_to_celebrate_with: '',
    how_to_comfort: '',
    ideal_contact_frequency: '',
    relationship_investment_tips: [] as string[],
    gift_giving_notes: '',
    signs_of_distance: [] as string[],
    signs_of_stress: [] as string[],
    signs_of_openness: [] as string[],
  });
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');
  const [newTip, setNewTip] = useState('');
  const [newDistanceSign, setNewDistanceSign] = useState('');
  const [newStressSign, setNewStressSign] = useState('');
  const [newOpennessSign, setNewOpennessSign] = useState('');

  const { data: playbook, isLoading } = useQuery({
    queryKey: ['contact-playbook', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_playbooks')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  useEffect(() => {
    if (playbook) {
      setFormData({
        personality_summary: playbook.personality_summary || '',
        working_with_them: playbook.working_with_them || '',
        dos: playbook.dos || [],
        donts: playbook.donts || [],
        how_to_ask_favor: playbook.how_to_ask_favor || '',
        how_to_give_feedback: playbook.how_to_give_feedback || '',
        how_to_deliver_bad_news: playbook.how_to_deliver_bad_news || '',
        how_to_celebrate_with: playbook.how_to_celebrate_with || '',
        how_to_comfort: playbook.how_to_comfort || '',
        ideal_contact_frequency: playbook.ideal_contact_frequency || '',
        relationship_investment_tips: playbook.relationship_investment_tips || [],
        gift_giving_notes: playbook.gift_giving_notes || '',
        signs_of_distance: playbook.signs_of_distance || [],
        signs_of_stress: playbook.signs_of_stress || [],
        signs_of_openness: playbook.signs_of_openness || [],
      });
    }
  }, [playbook]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (playbook?.id) {
        const { error } = await supabase
          .from('contact_playbooks')
          .update({ ...formData, human_verified: true })
          .eq('id', playbook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_playbooks')
          .insert({ ...formData, user_id: user!.id, profile_id: profileId, human_verified: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-playbook', profileId] });
      toast({ title: 'Playbook saved' });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-playbook', {
        body: { profile_id: profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-playbook', profileId] });
      toast({ title: 'Playbook generated', description: 'AI has created a personalized playbook based on available data.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const addArrayItem = (field: keyof typeof formData, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const arr = formData[field] as string[];
    if (!arr.includes(value.trim())) {
      updateField(field, [...arr, value.trim()]);
    }
    setter('');
  };

  const removeArrayItem = (field: keyof typeof formData, value: string) => {
    updateField(field, (formData[field] as string[]).filter(v => v !== value));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Interaction Playbook
            </CardTitle>
            <CardDescription>
              Your guide to interacting effectively with {contactName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              AI Generate
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-2">
                <Label>Personality Summary</Label>
                <Textarea 
                  placeholder="A one-paragraph summary of their personality..."
                  className="min-h-[100px]"
                  value={formData.personality_summary}
                  onChange={(e) => updateField('personality_summary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Working With Them</Label>
                <Textarea 
                  placeholder="How to effectively work or interact with them..."
                  className="min-h-[100px]"
                  value={formData.working_with_them}
                  onChange={(e) => updateField('working_with_them', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-500" /> Do's</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a 'do'..."
                      value={newDo}
                      onChange={(e) => setNewDo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addArrayItem('dos', newDo, setNewDo)}
                    />
                    <Button onClick={() => addArrayItem('dos', newDo, setNewDo)}>Add</Button>
                  </div>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {formData.dos.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="flex-1 text-sm">{item}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeArrayItem('dos', item)}>×</Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-500" /> Don'ts</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a 'don't'..."
                      value={newDont}
                      onChange={(e) => setNewDont(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addArrayItem('donts', newDont, setNewDont)}
                    />
                    <Button variant="outline" onClick={() => addArrayItem('donts', newDont, setNewDont)}>Add</Button>
                  </div>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {formData.donts.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="flex-1 text-sm">{item}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeArrayItem('donts', item)}>×</Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scripts" className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> How to Ask for a Favor</Label>
                <Textarea 
                  placeholder="The best way to approach them when you need something..."
                  value={formData.how_to_ask_favor}
                  onChange={(e) => updateField('how_to_ask_favor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>How to Give Feedback</Label>
                <Textarea 
                  placeholder="The best way to give them constructive feedback..."
                  value={formData.how_to_give_feedback}
                  onChange={(e) => updateField('how_to_give_feedback', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>How to Deliver Bad News</Label>
                <Textarea 
                  placeholder="The best way to share difficult news..."
                  value={formData.how_to_deliver_bad_news}
                  onChange={(e) => updateField('how_to_deliver_bad_news', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" /> How to Celebrate With Them</Label>
                  <Textarea 
                    placeholder="How to share good moments..."
                    value={formData.how_to_celebrate_with}
                    onChange={(e) => updateField('how_to_celebrate_with', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>How to Comfort Them</Label>
                  <Textarea 
                    placeholder="How to support them in difficult times..."
                    value={formData.how_to_comfort}
                    onChange={(e) => updateField('how_to_comfort', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ideal Contact Frequency</Label>
                  <Select value={formData.ideal_contact_frequency} onValueChange={(v) => updateField('ideal_contact_frequency', v)}>
                    <SelectTrigger><SelectValue placeholder="How often to reach out?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gift Giving Notes</Label>
                  <Textarea 
                    placeholder="What to consider when giving gifts..."
                    value={formData.gift_giving_notes}
                    onChange={(e) => updateField('gift_giving_notes', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Relationship Investment Tips</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a tip..."
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArrayItem('relationship_investment_tips', newTip, setNewTip)}
                  />
                  <Button onClick={() => addArrayItem('relationship_investment_tips', newTip, setNewTip)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.relationship_investment_tips.map((tip, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeArrayItem('relationship_investment_tips', tip)}>
                      {tip} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signals" className="space-y-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Signs of Distance</Label>
                <p className="text-xs text-muted-foreground">Warning signs that the relationship is cooling</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a sign..."
                    value={newDistanceSign}
                    onChange={(e) => setNewDistanceSign(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArrayItem('signs_of_distance', newDistanceSign, setNewDistanceSign)}
                  />
                  <Button variant="outline" onClick={() => addArrayItem('signs_of_distance', newDistanceSign, setNewDistanceSign)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.signs_of_distance.map((sign, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer border-yellow-500/50" onClick={() => removeArrayItem('signs_of_distance', sign)}>
                      {sign} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Signs of Stress</Label>
                <p className="text-xs text-muted-foreground">Signs that they're stressed or overwhelmed</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a sign..."
                    value={newStressSign}
                    onChange={(e) => setNewStressSign(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArrayItem('signs_of_stress', newStressSign, setNewStressSign)}
                  />
                  <Button variant="outline" onClick={() => addArrayItem('signs_of_stress', newStressSign, setNewStressSign)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.signs_of_stress.map((sign, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer border-red-500/50" onClick={() => removeArrayItem('signs_of_stress', sign)}>
                      {sign} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Signs of Openness</Label>
                <p className="text-xs text-muted-foreground">Signs that they're receptive to interaction</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a sign..."
                    value={newOpennessSign}
                    onChange={(e) => setNewOpennessSign(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArrayItem('signs_of_openness', newOpennessSign, setNewOpennessSign)}
                  />
                  <Button onClick={() => addArrayItem('signs_of_openness', newOpennessSign, setNewOpennessSign)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.signs_of_openness.map((sign, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer border-green-500/50" onClick={() => removeArrayItem('signs_of_openness', sign)}>
                      {sign} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
