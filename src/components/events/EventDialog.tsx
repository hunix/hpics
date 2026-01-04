import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const eventTypes = ['birthday', 'anniversary', 'milestone', 'meeting', 'follow_up', 'other'] as const;
const reminderFrequencies = ['once', 'daily', 'weekly', 'monthly', 'yearly'] as const;

export function EventDialog({ open, onOpenChange }: EventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    profile_id: '',
    event_type: 'birthday' as typeof eventTypes[number],
    title: '',
    description: '',
    event_date: '',
    reminder_frequency: 'yearly' as typeof reminderFrequencies[number],
    reminder_days_before: '7',
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      return data ?? [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('events').insert({
        user_id: user!.id,
        profile_id: data.profile_id || null,
        event_type: data.event_type,
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        reminder_frequency: data.reminder_frequency,
        reminder_days_before: parseInt(data.reminder_days_before) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
      toast({
        title: 'Event created',
        description: 'Your event has been added.',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      profile_id: '',
      event_type: 'birthday',
      title: '',
      description: '',
      event_date: '',
      reminder_frequency: 'yearly',
      reminder_days_before: '7',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.event_date) {
      toast({
        title: 'Validation error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="John's Birthday, Annual Review..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_id">Related Contact</Label>
            <Select
              value={formData.profile_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, profile_id: value === "__no_contact__" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__no_contact__">No contact</SelectItem>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value as typeof eventTypes[number] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_frequency">Repeat</Label>
              <Select
                value={formData.reminder_frequency}
                onValueChange={(value) => setFormData({ ...formData, reminder_frequency: value as typeof reminderFrequencies[number] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderFrequencies.map((freq) => (
                    <SelectItem key={freq} value={freq} className="capitalize">
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_days_before">Remind (days before)</Label>
              <Input
                id="reminder_days_before"
                type="number"
                value={formData.reminder_days_before}
                onChange={(e) => setFormData({ ...formData, reminder_days_before: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
