import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlaskConical, Plus, Copy, TrendingUp, DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Prompt categories from the prompt library
const PROMPT_CATEGORIES = [
  { key: 'behavioral', label: 'Behavioral Analysis' },
  { key: 'gift', label: 'Gift Suggestions' },
  { key: 'network', label: 'Network Analysis' },
  { key: 'risk', label: 'Risk Assessment' },
  { key: 'milestone', label: 'Milestone Detection' },
  { key: 'dossier', label: 'Dossier Generation' },
  { key: 'influence', label: 'Influence Strategy' },
  { key: 'message', label: 'Message Templates' },
  { key: 'media', label: 'Media Analysis' },
  { key: 'psychological', label: 'Psychological Analysis' },
  { key: 'conversation', label: 'Conversation Analysis' },
  { key: 'enrichment', label: 'Contact Enrichment' },
  { key: 'trust', label: 'Trust Assessment' },
  { key: 'synthesis', label: 'Cross-Modal Synthesis' },
  { key: 'churn', label: 'Churn Prediction' },
  { key: 'timing', label: 'Outreach Timing' },
  { key: 'grouping', label: 'Contact Grouping' },
  { key: 'playbook', label: 'Playbook Generation' },
  { key: 'summary', label: 'Conversation Summary' },
  { key: 'validation', label: 'Observation Validation' },
];

interface PromptVersion {
  id: string;
  user_id: string;
  prompt_key: string;
  version: number;
  prompt_text: string;
  variables: string[];
  model_tier: string;
  is_active: boolean;
  success_rate: number | null;
  avg_cost_cents: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function PromptVersionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('behavioral');
  const [isCreating, setIsCreating] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ prompt_text: '', variables: '', model_tier: 'balanced' });

  const { data: versions, isLoading } = useQuery({
    queryKey: ['prompt-versions', user?.id, selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('user_id', user!.id)
        .like('prompt_key', `${selectedCategory}.%`)
        .order('prompt_key')
        .order('version', { ascending: false });
      
      if (error) throw error;
      return data as PromptVersion[];
    },
    enabled: !!user,
  });

  // Get aggregate stats
  const { data: stats } = useQuery({
    queryKey: ['prompt-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('prompt_key, is_active, success_rate, avg_cost_cents, usage_count')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      const totalVersions = data?.length || 0;
      const activeVersions = data?.filter(v => v.is_active).length || 0;
      const avgSuccessRate = data?.filter(v => v.success_rate != null).reduce((acc, v) => acc + (v.success_rate || 0), 0) / (data?.filter(v => v.success_rate != null).length || 1);
      const totalUsage = data?.reduce((acc, v) => acc + (v.usage_count || 0), 0) || 0;
      
      return { totalVersions, activeVersions, avgSuccessRate, totalUsage };
    },
    enabled: !!user,
  });

  const createVersionMutation = useMutation({
    mutationFn: async (data: { promptKey: string; promptText: string; variables: string[]; modelTier: string }) => {
      // Get current max version
      const { data: existing } = await supabase
        .from('prompt_versions')
        .select('version')
        .eq('user_id', user!.id)
        .eq('prompt_key', data.promptKey)
        .order('version', { ascending: false })
        .limit(1);
      
      const nextVersion = (existing?.[0]?.version || 0) + 1;

      const { error } = await supabase
        .from('prompt_versions')
        .insert({
          user_id: user!.id,
          prompt_key: data.promptKey,
          version: nextVersion,
          prompt_text: data.promptText,
          variables: data.variables,
          model_tier: data.modelTier,
          is_active: false,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-stats'] });
      setIsCreating(false);
      setNewPrompt({ prompt_text: '', variables: '', model_tier: 'balanced' });
      toast({ title: 'Prompt version created' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, promptKey, isActive }: { id: string; promptKey: string; isActive: boolean }) => {
      // If activating, deactivate other versions of same prompt_key first
      if (isActive) {
        await supabase
          .from('prompt_versions')
          .update({ is_active: false })
          .eq('user_id', user!.id)
          .eq('prompt_key', promptKey);
      }
      
      const { error } = await supabase
        .from('prompt_versions')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions'] });
      queryClient.invalidateQueries({ queryKey: ['prompt-stats'] });
      toast({ title: 'Prompt version updated' });
    },
  });

  // Group versions by prompt_key
  const groupedVersions = versions?.reduce((acc, v) => {
    if (!acc[v.prompt_key]) acc[v.prompt_key] = [];
    acc[v.prompt_key].push(v);
    return acc;
  }, {} as Record<string, PromptVersion[]>) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Prompt A/B Testing
        </CardTitle>
        <CardDescription>
          Manage and test different prompt versions for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats?.totalVersions || 0}</div>
            <div className="text-sm text-muted-foreground">Total Versions</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats?.activeVersions || 0}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {stats?.avgSuccessRate ? `${(stats.avgSuccessRate * 100).toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Avg Success Rate</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats?.totalUsage || 0}</div>
            <div className="text-sm text-muted-foreground">Total Usage</div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <ScrollArea className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              {PROMPT_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  {PROMPT_CATEGORIES.find(c => c.key === selectedCategory)?.label} Prompts
                </h4>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Prompt Version</DialogTitle>
                      <DialogDescription>
                        Create a new version to A/B test against existing prompts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Prompt Key</Label>
                        <Input 
                          placeholder={`${selectedCategory}.system`}
                          id="prompt-key"
                        />
                      </div>
                      <div>
                        <Label>Prompt Text</Label>
                        <Textarea 
                          value={newPrompt.prompt_text}
                          onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
                          placeholder="Enter the prompt template..."
                          rows={6}
                        />
                      </div>
                      <div>
                        <Label>Variables (comma-separated)</Label>
                        <Input 
                          value={newPrompt.variables}
                          onChange={(e) => setNewPrompt({ ...newPrompt, variables: e.target.value })}
                          placeholder="contactName, contextType, ..."
                        />
                      </div>
                      <div>
                        <Label>Model Tier</Label>
                        <Select 
                          value={newPrompt.model_tier} 
                          onValueChange={(v) => setNewPrompt({ ...newPrompt, model_tier: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="speed">Speed (Flash-Lite / Nano)</SelectItem>
                            <SelectItem value="balanced">Balanced (Flash / Mini)</SelectItem>
                            <SelectItem value="quality">Quality (Pro / GPT-5)</SelectItem>
                            <SelectItem value="nextgen">Next-Gen (Gemini 3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                      <Button 
                        onClick={() => {
                          const keyInput = document.getElementById('prompt-key') as HTMLInputElement;
                          createVersionMutation.mutate({
                            promptKey: keyInput?.value || `${selectedCategory}.custom`,
                            promptText: newPrompt.prompt_text,
                            variables: newPrompt.variables.split(',').map(v => v.trim()).filter(Boolean),
                            modelTier: newPrompt.model_tier,
                          });
                        }}
                        disabled={createVersionMutation.isPending}
                      >
                        {createVersionMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : Object.keys(groupedVersions).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No prompt versions configured for this category.
                  <br />
                  <span className="text-sm">Create a new version to start A/B testing.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedVersions).map(([promptKey, promptVersions]) => (
                    <div key={promptKey} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{promptKey}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {promptVersions.length} version{promptVersions.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Version</TableHead>
                            <TableHead className="w-24">Active</TableHead>
                            <TableHead>Model Tier</TableHead>
                            <TableHead>Success Rate</TableHead>
                            <TableHead>Avg Cost</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promptVersions.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell>
                                <Badge variant={v.is_active ? 'default' : 'secondary'}>
                                  v{v.version}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Switch 
                                  checked={v.is_active}
                                  onCheckedChange={(checked) => toggleActiveMutation.mutate({
                                    id: v.id,
                                    promptKey: v.prompt_key,
                                    isActive: checked,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{v.model_tier}</Badge>
                              </TableCell>
                              <TableCell>
                                {v.success_rate != null ? (
                                  <div className="flex items-center gap-1">
                                    {v.success_rate >= 0.7 ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-amber-500" />
                                    )}
                                    {(v.success_rate * 100).toFixed(1)}%
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {v.avg_cost_cents != null ? (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {(v.avg_cost_cents / 100).toFixed(3)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {v.usage_count}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
