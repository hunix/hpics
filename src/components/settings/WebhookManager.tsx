import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { invokeFunction } from '@/lib/api';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Play,
  Eye,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const WEBHOOK_EVENTS = [
  { id: 'contact.created', label: 'Contact Created' },
  { id: 'contact.updated', label: 'Contact Updated' },
  { id: 'contact.deleted', label: 'Contact Deleted' },
  { id: 'communication.logged', label: 'Communication Logged' },
  { id: 'event.created', label: 'Event Created' },
  { id: 'event.reminder', label: 'Event Reminder' },
  { id: 'relationship.decay_warning', label: 'Relationship Decay Warning' },
  { id: 'analysis.completed', label: 'AI Analysis Completed' },
];

export function WebhookManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate a random secret
      const secret = crypto.randomUUID();

      const { error } = await supabase
        .from('webhooks')
        .insert({
          user_id: user.id,
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook created');
      setIsDialogOpen(false);
      setFormData({ name: '', url: '', events: [] });
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook deleted');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await invokeFunction('trigger-webhook', { webhookId, eventType: 'test', data: { test: true, timestamp: new Date().toISOString() } });
      
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.results?.[0]?.success) {
        toast.success('Test webhook sent successfully');
      } else {
        toast.error(`Webhook test failed: ${data.results?.[0]?.error || 'Unknown error'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Webhook className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Receive real-time notifications when events occur</CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook to receive notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="My Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://example.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map(event => (
                      <div key={event.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.events.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                        />
                        <span className="text-sm">{event.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !formData.name || !formData.url || formData.events.length === 0}
                  className="w-full"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Webhook'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {webhooks.map((webhook: any) => (
                <div key={webhook.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {webhook.last_status && (
                          <Badge variant={webhook.last_status < 300 ? 'secondary' : 'destructive'}>
                            {webhook.last_status < 300 ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {webhook.last_status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground break-all">{webhook.url}</p>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event: string) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: webhook.id, isActive: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testMutation.mutate(webhook.id)}
                      disabled={testMutation.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copySecret(webhook.secret)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Secret
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {webhook.last_triggered_at && (
                    <p className="text-xs text-muted-foreground">
                      Last triggered: {format(new Date(webhook.last_triggered_at), 'MMM d, yyyy HH:mm')}
                      {webhook.failure_count > 0 && ` • ${webhook.failure_count} failures`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No webhooks configured</p>
            <p className="text-sm">Add a webhook to receive real-time notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
