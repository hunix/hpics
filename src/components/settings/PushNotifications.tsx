import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Smartphone, Calendar, UserCheck, Loader2 } from 'lucide-react';

export function PushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [followUpReminders, setFollowUpReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [decayAlerts, setDecayAlerts] = useState(true);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['push-subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker and get push subscription
      const registration = await navigator.serviceWorker.ready;
      
      // In production, use your VAPID public key
      // For demo, we'll create a simulated subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      let sub = existingSubscription;
      if (!sub) {
        // Create demo subscription record (in production, use real VAPID keys)
        sub = {
          endpoint: `https://push.example.com/${crypto.randomUUID()}`,
          getKey: (name: string) => new Uint8Array(32),
        } as unknown as PushSubscription;
      }

      const endpoint = sub.endpoint;
      // Demo keys - in production, these come from the actual subscription
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(32)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(16)));

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user!.id,
        endpoint,
        p256dh,
        auth,
        is_active: true,
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription'] });
      toast({ 
        title: 'Push notifications enabled', 
        description: 'You will receive notifications for reminders and alerts.' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error enabling notifications', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user!.id);
      if (error) throw error;

      // Unregister from push manager
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription'] });
      toast({ title: 'Push notifications disabled' });
    },
  });

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('PICS Notification Test', {
        body: 'Push notifications are working correctly!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Push notifications are not supported in this browser. 
            Try using Chrome, Firefox, or Edge for the best experience.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
          {subscription && <Badge variant="secondary" className="ml-2">Active</Badge>}
        </CardTitle>
        <CardDescription>
          Get notified about follow-up reminders, upcoming events, and relationship alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscription ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Follow-up Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to reach out to contacts
                    </p>
                  </div>
                </div>
                <Switch
                  checked={followUpReminders}
                  onCheckedChange={setFollowUpReminders}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Event Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Birthdays, anniversaries, and milestones
                    </p>
                  </div>
                </div>
                <Switch
                  checked={eventReminders}
                  onCheckedChange={setEventReminders}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Relationship Decay Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts when relationships need attention
                    </p>
                  </div>
                </div>
                <Switch
                  checked={decayAlerts}
                  onCheckedChange={setDecayAlerts}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={testNotification}>
                Test Notification
              </Button>
              <Button
                variant="destructive"
                onClick={() => unsubscribeMutation.mutate()}
                disabled={unsubscribeMutation.isPending}
              >
                {unsubscribeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Disable Notifications
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <Smartphone className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Enable Push Notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Stay on top of your relationships with timely reminders and alerts.
              </p>
            </div>
            <Button
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable Notifications
            </Button>
            {permission === 'denied' && (
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
