import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Bell, Mail, Loader2, Smartphone, Link2, Bot, Cpu, MessageCircle, HardDrive, Trash2, Users, Fingerprint, DollarSign } from 'lucide-react';
import { AnalyticsExport } from '@/components/analytics/AnalyticsExport';
import { EmailIntegration } from '@/components/settings/EmailIntegration';
import { OutlookIntegration } from '@/components/settings/OutlookIntegration';
import { PushNotifications } from '@/components/settings/PushNotifications';
import { LocalAIEndpoints } from '@/components/settings/LocalAIEndpoints';
import { AIModelPreferences } from '@/components/settings/AIModelPreferences';
import { AIBudgetSettings } from '@/components/settings/AIBudgetSettings';
import { AICostDashboard } from '@/components/ai/AICostDashboard';
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup';
import { ResendIntegration } from '@/components/settings/ResendIntegration';
import { VAPIDConfiguration } from '@/components/settings/VAPIDConfiguration';
import { StorageAnalytics } from '@/components/analytics/StorageAnalytics';
import { DuplicateProfileMerger } from '@/components/contacts/DuplicateProfileMerger';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { CalendarSyncSettings } from '@/components/settings/CalendarSyncSettings';
import { WebhookManager } from '@/components/settings/WebhookManager';
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings';
import { CronJobManager } from '@/components/settings/CronJobManager';
import { BiometricSettings } from '@/components/settings/BiometricSettings';
import { BiometricBatchScan } from '@/components/settings/BiometricBatchScan';
import { BiometricAnalyticsDashboard } from '@/components/settings/BiometricAnalyticsDashboard';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [emailReminders, setEmailReminders] = useState(true);
  const [reminderEmail, setReminderEmail] = useState('');

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch VAPID configuration from app_settings
  const { data: vapidConfig } = useQuery({
    queryKey: ['app-settings', 'vapid', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('setting_key', 'vapid_public_key')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const vapidPublicKey = vapidConfig?.setting_value || '';
  const isVapidConfigured = vapidPublicKey.length > 60;

  useEffect(() => {
    if (preferences) {
      setEmailReminders(preferences.email_reminders ?? true);
      setReminderEmail(preferences.reminder_email || user?.email || '');
    } else if (user?.email) {
      setReminderEmail(user.email);
    }
  }, [preferences, user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        user_id: user!.id,
        email_reminders: emailReminders,
        reminder_email: reminderEmail || null,
        theme,
      };

      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update(data)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast({ title: 'Settings saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleVapidSave = (publicKey: string) => {
    queryClient.invalidateQueries({ queryKey: ['app-settings', 'vapid'] });
    toast({ 
      title: 'VAPID public key saved', 
      description: 'Add the private key as a secret named VAPID_PRIVATE_KEY to enable production push notifications.' 
    });
  };

  return (
    <AppLayout title="Settings">
      <Tabs defaultValue="general" className="max-w-5xl">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="general">
            <Sun className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="biometrics">
            <Fingerprint className="h-4 w-4 mr-2" />
            Biometrics
          </TabsTrigger>
          <TabsTrigger value="storage">
            <HardDrive className="h-4 w-4 mr-2" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="cleanup">
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="ai-models">
            <Cpu className="h-4 w-4 mr-2" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="ai-costs">
            <DollarSign className="h-4 w-4 mr-2" />
            AI Costs
          </TabsTrigger>
          <TabsTrigger value="local-ai">
            <Bot className="h-4 w-4 mr-2" />
            Local AI
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>Customize how PICS looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme across the application
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <AnalyticsExport />

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure email reminders for events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for upcoming events
                  </p>
                </div>
                <Switch
                  checked={emailReminders}
                  onCheckedChange={setEmailReminders}
                />
              </div>

              {emailReminders && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-email">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Reminder Email
                  </Label>
                  <Input
                    id="reminder-email"
                    type="email"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use your account email
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <PushNotifications vapidPublicKey={vapidPublicKey} />

          <VAPIDConfiguration 
            isConfigured={isVapidConfigured}
            currentPublicKey={vapidPublicKey}
            onSave={handleVapidSave} 
          />

          <NotificationPreferences />

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="biometrics" className="space-y-6 mt-6">
          <BiometricSettings />
          <BiometricBatchScan />
          <BiometricAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="storage" className="space-y-6 mt-6">
          <StorageAnalytics />
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-6 mt-6">
          <DuplicateProfileMerger />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 mt-6">
          <CalendarSyncSettings />
          <OutlookIntegration />
          <ResendIntegration 
            isConfigured={true} 
            onSave={() => {}} 
          />
          <WhatsAppSetup />
          <WebhookManager />
          <EmailIntegration />
          <CronJobManager />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6 mt-6">
          <WorkspaceSettings />
        </TabsContent>

        <TabsContent value="ai-models" className="space-y-6 mt-6">
          <AIModelPreferences />
          <AIBudgetSettings />
        </TabsContent>

        <TabsContent value="ai-costs" className="space-y-6 mt-6">
          <AICostDashboard />
        </TabsContent>

        <TabsContent value="local-ai" className="space-y-6 mt-6">
          <LocalAIEndpoints />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install as App
              </CardTitle>
              <CardDescription>
                Install PICS on your device for quick access and offline support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium">iOS (Safari)</h4>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Tap the Share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium">Android (Chrome)</h4>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Tap the menu (three dots) in Chrome</li>
                  <li>Tap "Add to Home screen" or "Install app"</li>
                  <li>Confirm by tapping "Add"</li>
                </ol>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-medium">Desktop (Chrome/Edge)</h4>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Click the install icon in the address bar</li>
                  <li>Or open the browser menu and select "Install PICS..."</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <PushNotifications vapidPublicKey={vapidPublicKey} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
