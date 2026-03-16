import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Bell, Mail, Loader2, Smartphone, RefreshCw, Trash2 } from 'lucide-react';
import { APP_VERSION, BUILD_TIMESTAMP, forceAppUpdate, clearAllCaches } from '@/lib/appVersion';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { AnalyticsExport } from '@/components/analytics/AnalyticsExport';
import { PushNotifications } from '@/components/settings/PushNotifications';
import { LocalAIEndpoints } from '@/components/settings/LocalAIEndpoints';
import { AIModelPreferences } from '@/components/settings/AIModelPreferences';
import { AIBudgetSettings } from '@/components/settings/AIBudgetSettings';
import { AICostDashboard } from '@/components/ai/AICostDashboard';
import { VAPIDConfiguration } from '@/components/settings/VAPIDConfiguration';
import { StorageAnalytics } from '@/components/analytics/StorageAnalytics';
import { DuplicateProfileMerger } from '@/components/contacts/DuplicateProfileMerger';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { WorkspaceSettings } from '@/components/settings/WorkspaceSettings';
import { BiometricSettings } from '@/components/settings/BiometricSettings';
import { BiometricBatchScan } from '@/components/settings/BiometricBatchScan';
import { BiometricAnalyticsDashboard } from '@/components/settings/BiometricAnalyticsDashboard';
import { PromptVersionManager } from '@/components/settings/PromptVersionManager';
import { UnifiedIntegrationSettings } from '@/components/settings/UnifiedIntegrationSettings';
import { OfflineSyncPanel } from '@/components/mobile/OfflineSyncPanel';
import { CostProjectionWidget } from '@/components/ai/CostProjectionWidget';
import { CostOptimizationPanel } from '@/components/ai/CostOptimizationPanel';
import { ContactCostAnalysis } from '@/components/ai/ContactCostAnalysis';
import { PromptABTestPanel } from '@/components/ai/PromptABTestPanel';
import { DataValidationDashboard } from '@/components/testing/DataValidationDashboard';
import { BudgetAlertPanel } from '@/components/ai/BudgetAlertPanel';
import { PerContactSpendAnalysis } from '@/components/ai/PerContactSpendAnalysis';
import { ModelEfficiencyComparison } from '@/components/ai/ModelEfficiencyComparison';
import { AccountStorageConsumption } from '@/components/analytics/AccountStorageConsumption';
import { IntegrationHealthDashboard } from '@/components/settings/IntegrationHealthDashboard';
import { RealTimeSecurityDashboard } from '@/components/security/RealTimeSecurityDashboard';
import { PlatformConfigSettings } from '@/components/settings/PlatformConfigSettings';
import { lazy, Suspense } from 'react';

const ApiKeysPage = lazy(() => import('@/pages/settings/ApiKeysPage'));

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeSection, setActiveSection] = useState('appearance');
  const [emailReminders, setEmailReminders] = useState(true);
  const [reminderEmail, setReminderEmail] = useState('');

  const { data: preferences } = useQuery({
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
        const { error } = await supabase.from('user_preferences').update(data).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_preferences').insert(data);
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

  const handleVapidSave = () => {
    queryClient.invalidateQueries({ queryKey: ['app-settings', 'vapid'] });
    toast({ title: 'VAPID public key saved' });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  Appearance
                </CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
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
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Email Reminders</Label><p className="text-sm text-muted-foreground">Receive email notifications</p></div>
                  <Switch checked={emailReminders} onCheckedChange={setEmailReminders} />
                </div>
                {emailReminders && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-email">Reminder Email</Label>
                    <Input id="reminder-email" type="email" value={reminderEmail} onChange={(e) => setReminderEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                )}
              </CardContent>
            </Card>
            <PushNotifications vapidPublicKey={vapidPublicKey} />
            <VAPIDConfiguration isConfigured={isVapidConfigured} currentPublicKey={vapidPublicKey} onSave={handleVapidSave} />
            <NotificationPreferences />
          </div>
        );
      case 'mobile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Install as App</CardTitle>
                <CardDescription>Install on your device for quick access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg"><h4 className="font-medium">iOS</h4><p className="text-sm text-muted-foreground">Tap Share → Add to Home Screen</p></div>
                <div className="p-4 bg-muted/50 rounded-lg"><h4 className="font-medium">Android</h4><p className="text-sm text-muted-foreground">Tap menu → Add to Home screen</p></div>
              </CardContent>
            </Card>
            
            {/* Cache Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />App Updates & Cache</CardTitle>
                <CardDescription>Manage app version and cached data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Version</p>
                    <p className="text-sm text-muted-foreground">v{APP_VERSION}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(BUILD_TIMESTAMP).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={async () => {
                      await clearAllCaches();
                      toast({ title: 'Cache cleared', description: 'All cached data has been removed.' });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={async () => {
                      toast({ title: 'Updating...', description: 'Checking for updates and reloading.' });
                      await forceAppUpdate();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Update
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Use "Force Update" if you're seeing an old UI or missing features
                </p>
              </CardContent>
            </Card>
            
            <OfflineSyncPanel />
            <PushNotifications vapidPublicKey={vapidPublicKey} />
          </div>
        );
      case 'cache':
        return (
          <div className="space-y-6">
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Clear Cache & Force Update
                </CardTitle>
                <CardDescription>
                  Use this if you're seeing old UI, missing features, or experiencing navigation issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Current Version</p>
                    <p className="text-lg text-primary font-mono">v{APP_VERSION}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Built: {new Date(BUILD_TIMESTAMP).toLocaleString()}
                  </p>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-16 flex-col gap-1"
                    onClick={async () => {
                      await clearAllCaches();
                      toast({ title: 'Cache cleared', description: 'All cached data has been removed.' });
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="text-sm">Clear Cache Only</span>
                  </Button>
                  <Button 
                    size="lg"
                    className="h-16 flex-col gap-1"
                    onClick={async () => {
                      toast({ title: 'Updating...', description: 'Clearing cache and reloading app.' });
                      await forceAppUpdate();
                    }}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span className="text-sm font-semibold">Force Update & Reload</span>
                  </Button>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">When to use Force Update:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Seeing an old navigation menu or missing pages</li>
                    <li>• Getting 404 errors on pages that should exist</li>
                    <li>• Features not working after an update</li>
                    <li>• UI looks different than expected</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'storage':
        return <div className="space-y-6"><AccountStorageConsumption /><StorageAnalytics /></div>;
      case 'cleanup':
        return <DuplicateProfileMerger />;
      case 'biometrics':
        return <div className="space-y-6"><BiometricSettings /><BiometricBatchScan /><BiometricAnalyticsDashboard /></div>;
      case 'integrations':
        return (
          <Tabs defaultValue="config" className="space-y-6">
            <TabsList>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="health">Health Dashboard</TabsTrigger>
            </TabsList>
            <TabsContent value="config">
              <UnifiedIntegrationSettings />
            </TabsContent>
            <TabsContent value="health">
              <IntegrationHealthDashboard />
            </TabsContent>
          </Tabs>
        );
      case 'teams':
        return <WorkspaceSettings />;
      case 'ai-models':
        return <div className="space-y-6"><AIModelPreferences /><AIBudgetSettings /><PromptVersionManager /><PromptABTestPanel /></div>;
      case 'ai-costs':
        return (
          <div className="space-y-6">
            <BudgetAlertPanel />
            <AICostDashboard />
            <CostProjectionWidget />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CostOptimizationPanel /><ContactCostAnalysis /></div>
            <PerContactSpendAnalysis />
            <ModelEfficiencyComparison />
          </div>
        );
      case 'local-ai':
        return <LocalAIEndpoints />;
      case 'security':
        return <RealTimeSecurityDashboard />;
      case 'platform-config':
        return <PlatformConfigSettings />;
      case 'system':
        return <DataValidationDashboard />;
      default:
        return null;
    }
  };

  return (
    <AppLayout title="Settings">
      <SettingsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        {renderContent()}
      </SettingsLayout>
    </AppLayout>
  );
}
