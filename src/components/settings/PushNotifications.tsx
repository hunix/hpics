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
import { Bell, BellOff, Smartphone, Calendar, UserCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushNotificationsProps {
  vapidPublicKey?: string;
}

export function PushNotifications({ vapidPublicKey }: PushNotificationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [followUpReminders, setFollowUpReminders] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [decayAlerts, setDecayAlerts] = useState(true);

  const isProductionMode = !!vapidPublicKey && vapidPublicKey.length > 60;

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
      
      let sub: PushSubscription | null = null;
      let endpoint: string;
      let p256dh: string;
      let auth: string;

      if (isProductionMode) {
        // Production mode: Use real VAPID key
        const existingSubscription = await (registration as any).pushManager.getSubscription();
        
        if (existingSubscription) {
          // Unsubscribe old subscription to get new one with correct VAPID key
          await existingSubscription.unsubscribe();
        }

        const appServerKey = urlBase64ToUint8Array(vapidPublicKey!);
        sub = await (registration as any).pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer
        });

        if (!sub) throw new Error('push subscription failed');
        endpoint = sub.endpoint;
        const p256dhKey = sub.getKey('p256dh');
        const authKey = sub.getKey('auth');
        
        p256dh = p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : '';
        auth = authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : '';
      } else {
        // Demo mode: Create simulated subscription
        endpoint = `https://push.example.com/demo/${crypto.randomUUID()}`;
        p256dh = btoa(String.fromCharCode(...new Uint8Array(65)));
        auth = btoa(String.fromCharCode(...new Uint8Array(16)));
      }

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
      return isProductionMode;
    },
    onSuccess: (isProd) => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription'] });
      toast({ 
        title: 'Push notifications enabled', 
        description: isProd 
          ? 'Production mode: You will receive real push notifications.'
          : 'Demo mode: Configure VAPID keys for production notifications.'
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
      const sub = await (registration as any).pushManager.getSubscription();
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
        body: isProductionMode 
          ? 'Production push notifications are working!' 
          : 'Demo mode notification. Configure VAPID keys for production.',
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
          {subscription && (
            <Badge variant={isProductionMode ? "default" : "secondary"} className="ml-2">
              {isProductionMode ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Production
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Demo Mode
                </span>
              )}
            </Badge>
          )}
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
            {!isProductionMode && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600 dark:text-amber-400">
                Running in demo mode. Configure VAPID keys below for production push notifications.
              </div>
            )}

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
              {!isProductionMode && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Demo mode active. Configure VAPID keys for production notifications.
                </p>
              )}
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
