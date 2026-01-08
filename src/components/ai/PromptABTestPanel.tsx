import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FlaskConical, Play, Pause, Trophy, Plus, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

const PROMPT_CATEGORIES = [
  { key: 'personality_analysis', label: 'Personality Analysis' },
  { key: 'relationship_analysis', label: 'Relationship Analysis' },
  { key: 'executive_summary', label: 'Executive Summary' },
  { key: 'dossier_generation', label: 'Dossier Generation' },
  { key: 'communication_analysis', label: 'Communication Analysis' },
];

interface ABTest {
  id: string;
  name: string;
  prompt_key: string;
  test_status: string;
  traffic_split: { control: number; variant: number };
  start_date: string | null;
  end_date: string | null;
  statistical_significance: number | null;
  winner_version_id: string | null;
  created_at: string;
}

export function PromptABTestPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    prompt_key: '',
    trafficSplit: 50,
  });

  const { data: tests, isLoading } = useQuery({
    queryKey: ['ab-tests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        traffic_split: t.traffic_split as { control: number; variant: number },
      })) as ABTest[];
    },
    enabled: !!user,
  });

  const createTestMutation = useMutation({
    mutationFn: async (test: typeof newTest) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          user_id: user!.id,
          name: test.name,
          prompt_key: test.prompt_key,
          traffic_split: { control: test.trafficSplit, variant: 100 - test.trafficSplit },
          test_status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      setIsCreateOpen(false);
      setNewTest({ name: '', prompt_key: '', trafficSplit: 50 });
      toast.success('A/B test created');
    },
    onError: (error) => {
      toast.error('Failed to create test: ' + error.message);
    },
  });

  const updateTestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { test_status: status };
      if (status === 'running') {
        updates.start_date = new Date().toISOString();
      } else if (status === 'completed') {
        updates.end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Test status updated');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-700';
      case 'completed': return 'bg-blue-500/10 text-blue-700';
      case 'paused': return 'bg-amber-500/10 text-amber-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeTests = tests?.filter(t => t.test_status === 'running').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Prompt A/B Testing
            </CardTitle>
            <CardDescription>
              {activeTests} active test{activeTests !== 1 ? 's' : ''} running
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input
                    placeholder="e.g., Personality v2 vs v3"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prompt Category</Label>
                  <Select
                    value={newTest.prompt_key}
                    onValueChange={(v) => setNewTest(prev => ({ ...prev, prompt_key: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMPT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.key} value={cat.key}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Traffic Split (Control: {newTest.trafficSplit}% / Variant: {100 - newTest.trafficSplit}%)</Label>
                  <Slider
                    value={[newTest.trafficSplit]}
                    onValueChange={([v]) => setNewTest(prev => ({ ...prev, trafficSplit: v }))}
                    min={10}
                    max={90}
                    step={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createTestMutation.mutate(newTest)}
                  disabled={!newTest.name || !newTest.prompt_key}
                >
                  Create Test
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : tests && tests.length > 0 ? (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="p-3 rounded-lg border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{test.name}</span>
                      <Badge className={getStatusColor(test.test_status)}>
                        {test.test_status}
                      </Badge>
                      {test.winner_version_id && (
                        <Badge variant="outline" className="text-amber-600">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner found
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {PROMPT_CATEGORIES.find(c => c.key === test.prompt_key)?.label || test.prompt_key}
                      {' • '}
                      {(test.traffic_split as { control: number })?.control || 50}% / {100 - ((test.traffic_split as { control: number })?.control || 50)}%
                    </div>
                    {test.statistical_significance && (
                      <div className="text-sm mt-1">
                        <BarChart2 className="h-3 w-3 inline mr-1" />
                        Significance: {(test.statistical_significance * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {test.test_status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateTestStatus.mutate({ id: test.id, status: 'running' })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {test.test_status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTestStatus.mutate({ id: test.id, status: 'paused' })}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {test.test_status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateTestStatus.mutate({ id: test.id, status: 'running' })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created {format(new Date(test.created_at), 'MMM d, yyyy')}
                  {test.start_date && ` • Started ${format(new Date(test.start_date), 'MMM d')}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No A/B tests yet</p>
            <p className="text-sm">Create a test to compare prompt versions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
