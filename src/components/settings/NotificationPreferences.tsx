import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, Clock, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';

const ALERT_TYPES = [
  { id: 'relationship_decay', label: 'Relationship Decay', description: 'Contact frequency declining' },
  { id: 'anomaly_detected', label: 'Anomaly Detected', description: 'Unusual behavior patterns' },
  { id: 'action_required', label: 'Action Required', description: 'Pending follow-ups and tasks' },
  { id: 'opportunity_identified', label: 'Opportunity Identified', description: 'Growth opportunities' },
  { id: 'trust_change', label: 'Trust Changes', description: 'Significant trust score changes' },
  { id: 'birthday_reminder', label: 'Birthdays', description: 'Upcoming birthdays' },
];

interface NotificationPreferencesForm {
  push_enabled?: boolean | null;
  email_enabled?: boolean | null;
  alert_types_enabled?: string[] | null;
  min_severity?: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  digest_frequency?: string | null;
  [key: string]: unknown;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async (): Promise<NotificationPreferencesForm> => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (data as NotificationPreferencesForm | null) || {
        push_enabled: false,
        email_enabled: true,
        alert_types_enabled: ['relationship_decay', 'anomaly_detected', 'action_required', 'opportunity_identified'],
        min_severity: 'medium',
        quiet_hours_start: null,
        quiet_hours_end: null,
        digest_frequency: 'daily',
      };
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState<NotificationPreferencesForm | undefined>(preferences);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user!.id,
          ...data,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences saved');
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err as Error).message);
    },
  });

  // Update form data when preferences load
  if (preferences && !formData) {
    setFormData(preferences);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleAlertTypeToggle = (alertType: string) => {
    const current = formData?.alert_types_enabled || [];
    const updated = current.includes(alertType)
      ? current.filter((t: string) => t !== alertType)
      : [...current, alertType];
    setFormData({ ...formData, alert_types_enabled: updated });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Configure how and when you receive intelligence alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="font-medium">Notification Channels</h4>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-toggle">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts via email</p>
              </div>
            </div>
            <Switch
              id="email-toggle"
              checked={formData?.email_enabled || false}
              onCheckedChange={(checked) => setFormData({ ...formData, email_enabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-toggle">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
            </div>
            <Switch
              id="push-toggle"
              checked={formData?.push_enabled || false}
              onCheckedChange={(checked) => setFormData({ ...formData, push_enabled: checked })}
            />
          </div>
        </div>

        {/* Alert Types */}
        <div className="space-y-4">
          <h4 className="font-medium">Alert Types</h4>
          <div className="grid gap-3">
            {ALERT_TYPES.map((type) => (
              <div
                key={type.id}
                className="flex items-center space-x-3 p-3 rounded-lg border"
              >
                <Checkbox
                  id={type.id}
                  checked={formData?.alert_types_enabled?.includes(type.id) || false}
                  onCheckedChange={() => handleAlertTypeToggle(type.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={type.id} className="cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Threshold */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Minimum Severity
          </h4>
          <Select
            value={formData?.min_severity || 'medium'}
            onValueChange={(value) => setFormData({ ...formData, min_severity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - All alerts</SelectItem>
              <SelectItem value="medium">Medium - Important alerts only</SelectItem>
              <SelectItem value="high">High - Critical alerts only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Quiet Hours
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={formData?.quiet_hours_start || ''}
                onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={formData?.quiet_hours_end || ''}
                onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value || null })}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            No notifications will be sent during quiet hours
          </p>
        </div>

        {/* Digest Frequency */}
        <div className="space-y-4">
          <h4 className="font-medium">Digest Frequency</h4>
          <Select
            value={formData?.digest_frequency || 'daily'}
            onValueChange={(value) => setFormData({ ...formData, digest_frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time (immediate)</SelectItem>
              <SelectItem value="hourly">Hourly digest</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => saveMutation.mutate(formData)} 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}