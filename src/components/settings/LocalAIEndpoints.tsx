import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Server, Plus, Trash2, RefreshCw, Loader2,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

export function LocalAIEndpoints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    endpoint_url: '',
    model_type: 'general',
    api_format: 'openai',
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: endpoints, isLoading } = useQuery({
    queryKey: ['local-ai-endpoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_ai_endpoints')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addEndpoint = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('local_ai_endpoints')
        .insert({
          ...newEndpoint,
          user_id: user!.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-ai-endpoints'] });
      toast({ title: 'Endpoint added' });
      setIsDialogOpen(false);
      setNewEndpoint({ name: '', endpoint_url: '', model_type: 'general', api_format: 'openai' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEndpoint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('local_ai_endpoints')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-ai-endpoints'] });
      toast({ title: 'Endpoint deleted' });
    },
  });

  const toggleEndpoint = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('local_ai_endpoints')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-ai-endpoints'] });
    },
  });

  const testEndpoint = async (endpoint: any) => {
    setTestingId(endpoint.id);
    try {
      const response = await fetch(`${endpoint.endpoint_url}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const status = response.ok ? 'healthy' : 'error';
      
      await supabase
        .from('local_ai_endpoints')
        .update({ 
          health_status: status,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      queryClient.invalidateQueries({ queryKey: ['local-ai-endpoints'] });
      toast({ 
        title: status === 'healthy' ? 'Connection successful' : 'Connection failed',
        variant: status === 'healthy' ? 'default' : 'destructive',
      });
    } catch (error) {
      await supabase
        .from('local_ai_endpoints')
        .update({ 
          health_status: 'error',
          last_health_check: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      queryClient.invalidateQueries({ queryKey: ['local-ai-endpoints'] });
      toast({ title: 'Connection failed', variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Local AI Endpoints
          </CardTitle>
          <CardDescription>
            Connect to your locally hosted AI models (llama.cpp, Ollama, etc.)
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Local AI Endpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Local Llama 3.3"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <Input
                  placeholder="http://localhost:8080 or http://192.168.1.100:11434"
                  value={newEndpoint.endpoint_url}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, endpoint_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Base URL for your local AI server (without /v1/chat/completions)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Model Type</Label>
                <Select 
                  value={newEndpoint.model_type} 
                  onValueChange={(v) => setNewEndpoint({ ...newEndpoint, model_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (Text)</SelectItem>
                    <SelectItem value="behavioral">Behavioral Analysis</SelectItem>
                    <SelectItem value="vision">Vision/Video</SelectItem>
                    <SelectItem value="facial">Facial Analysis</SelectItem>
                    <SelectItem value="body_language">Body Language</SelectItem>
                    <SelectItem value="audio">Audio/Vocal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API Format</Label>
                <Select 
                  value={newEndpoint.api_format} 
                  onValueChange={(v) => setNewEndpoint({ ...newEndpoint, api_format: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI Compatible</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addEndpoint.mutate()} disabled={!newEndpoint.name || !newEndpoint.endpoint_url} className="w-full">
                {addEndpoint.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Endpoint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !endpoints?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No local endpoints configured</p>
            <p className="text-sm">Add endpoints to use your fine-tuned models</p>
          </div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{endpoint.name}</h4>
                      {getStatusIcon(endpoint.health_status)}
                      <Badge variant="outline" className="text-xs">{endpoint.model_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                      {endpoint.endpoint_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={endpoint.is_active ?? false}
                      onCheckedChange={(checked) => toggleEndpoint.mutate({ id: endpoint.id, isActive: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => testEndpoint(endpoint)}
                      disabled={testingId === endpoint.id}
                    >
                      {testingId === endpoint.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this endpoint?')) {
                          deleteEndpoint.mutate(endpoint.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
