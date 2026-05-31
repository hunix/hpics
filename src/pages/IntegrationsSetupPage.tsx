import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { WhatsAppPersonalBridge } from '@/components/whatsapp/WhatsAppPersonalBridge';
import { SmsBridge } from '@/components/android/SmsBridge';
import { DataExportImporter } from '@/components/integrations/DataExportImporter';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Mail,
  Share2,
  Briefcase,
  Smartphone,
  Send,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IntegrationStatus = 'connected' | 'not_setup' | 'action_required';

type TabId = 'overview' | 'whatsapp' | 'email' | 'social' | 'mobile' | 'advanced';

interface GmailConfig {
  id: string;
  email: string | null;
  sync_enabled: boolean | null;
  sync_status: string | null;
  last_sync_at: string | null;
  token_expires_at: string | null;
}

interface OutlookConfig {
  id: string;
  client_id: string;
  sync_enabled: boolean | null;
  last_sync_at: string | null;
}

interface TelegramChannel {
  id: string;
  channel_name?: string;
  channel_id?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: IntegrationStatus) {
  if (status === 'connected') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    );
  }
  if (status === 'action_required') {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        Action Required
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <XCircle className="h-3 w-3 mr-1" />
      Not Set Up
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Overview card
// ---------------------------------------------------------------------------

interface OverviewCardProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  status: IntegrationStatus;
  onSetUp: () => void;
}

function OverviewCard({ name, icon, description, status, onSetUp }: OverviewCardProps) {
  return (
    <Card className="border-border/50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{name}</CardTitle>
          </div>
          {statusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <p className="text-sm text-muted-foreground flex-1">{description}</p>
        {status !== 'connected' && (
          <Button variant="outline" size="sm" onClick={onSetUp}>
            {status === 'action_required' ? 'Fix Now' : 'Set Up'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gmail Section
// ---------------------------------------------------------------------------

interface GmailSectionProps {
  userId: string;
}

function GmailSection({ userId }: GmailSectionProps) {
  const [config, setConfig] = useState<GmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('gmail_config')
      .select('id, email, sync_enabled, sync_status, last_sync_at, token_expires_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[GmailSection]', error);
        setConfig(data as GmailConfig | null);
        setLoading(false);
      });
  }, [userId]);

  async function handleEnablePush() {
    setEnablingPush(true);
    setPushError(null);
    try {
      const { error } = await supabase.functions.invoke('setup-gmail-push', {
        body: { userId },
      });
      if (error) throw new Error(error.message);
      setPushSuccess(true);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Failed to enable push notifications.');
    } finally {
      setEnablingPush(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading Gmail status…</span>
      </div>
    );
  }

  const isTokenValid = config?.token_expires_at
    ? new Date(config.token_expires_at) > new Date()
    : false;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-red-500" />
            Gmail (Personal)
          </CardTitle>
          {config ? statusBadge(isTokenValid ? 'connected' : 'action_required') : statusBadge('not_setup')}
        </div>
        {config?.email && (
          <CardDescription>{config.email}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {config ? (
          <>
            {isTokenValid ? (
              <>
                {pushSuccess ? (
                  <Alert className="border-emerald-500/30 bg-emerald-500/5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="text-emerald-700 dark:text-emerald-400">Push Enabled</AlertTitle>
                    <AlertDescription>Real-time push notifications are now active.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Push Notifications:</span>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Enabled
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enable real-time push so new emails arrive instantly instead of on the next scheduled sync.
                    </p>
                    {pushError && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{pushError}</AlertDescription>
                      </Alert>
                    )}
                    <Button size="sm" onClick={handleEnablePush} disabled={enablingPush}>
                      {enablingPush
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <RefreshCw className="h-4 w-4 mr-2" />
                      }
                      Enable Real-time Push
                    </Button>
                  </div>
                )}
                {config.last_sync_at && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(config.last_sync_at).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Token Expired</AlertTitle>
                <AlertDescription>Your Gmail access token has expired. Reconnect to restore access.</AlertDescription>
              </Alert>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Reconnect Gmail
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Connect your Gmail account for real-time email sync and push notifications.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Connect Gmail
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Outlook Section
// ---------------------------------------------------------------------------

interface OutlookSectionProps {
  userId: string;
}

function OutlookSection({ userId }: OutlookSectionProps) {
  const [config, setConfig] = useState<OutlookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewSuccess, setRenewSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('outlook_config')
      .select('id, client_id, sync_enabled, last_sync_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[OutlookSection]', error);
        setConfig(data as OutlookConfig | null);
        setLoading(false);
      });
  }, [userId]);

  async function handleRenew() {
    setRenewing(true);
    setRenewError(null);
    try {
      const { error } = await supabase.functions.invoke('renew-webhook-subscriptions', {
        body: { userId },
      });
      if (error) throw new Error(error.message);
      setRenewSuccess(true);
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : 'Failed to renew subscriptions.');
    } finally {
      setRenewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading Outlook status…</span>
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            Work Email (Outlook / MS365)
          </CardTitle>
          {statusBadge(config ? 'connected' : 'not_setup')}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {config ? (
          <>
            {config.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Last sync: {new Date(config.last_sync_at).toLocaleString()}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Renew the Microsoft Graph webhook subscription to keep real-time notifications active.
              </p>
              {renewError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{renewError}</AlertDescription>
                </Alert>
              )}
              {renewSuccess && (
                <Alert className="border-emerald-500/30 bg-emerald-500/5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertTitle className="text-emerald-700 dark:text-emerald-400">Renewed</AlertTitle>
                  <AlertDescription>Webhook subscription renewed successfully.</AlertDescription>
                </Alert>
              )}
              {!renewSuccess && (
                <Button size="sm" variant="outline" onClick={handleRenew} disabled={renewing}>
                  {renewing
                    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    : <RefreshCw className="h-4 w-4 mr-2" />
                  }
                  Renew Now
                </Button>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Reconnect Outlook
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Microsoft 365 account for work email, calendar, and Teams sync.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              Connect Outlook
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Advanced Tab
// ---------------------------------------------------------------------------

interface AdvancedTabProps {
  userId: string;
}

function AdvancedTab({ userId }: AdvancedTabProps) {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [breachEnabled, setBreachEnabled] = useState(false);
  const [breachLastCheck, setBreachLastCheck] = useState<string | null>(null);
  const [renewAllPending, setRenewAllPending] = useState(false);
  const [renewAllDone, setRenewAllDone] = useState(false);
  const [renewAllError, setRenewAllError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // Telegram channels — table may not exist yet; handle gracefully
      try {
        const { data } = await supabase
          .from('telegram_watch_channels' as Parameters<typeof supabase.from>[0])
          .select('id, channel_name, channel_id')
          .eq('user_id', userId);
        setChannels(((data as unknown) as TelegramChannel[] | null) ?? []);
      } catch {
        /* table not yet created */
      } finally {
        setChannelsLoading(false);
      }

      // Monitor preferences — also may not exist yet
      try {
        const { data } = await supabase
          .from('monitor_preferences' as Parameters<typeof supabase.from>[0])
          .select('breach_monitor_enabled, last_check_at')
          .eq('user_id', userId)
          .maybeSingle();
        if (data) {
          const row = data as unknown as Record<string, unknown>;
          setBreachEnabled(!!row.breach_monitor_enabled);
          setBreachLastCheck((row.last_check_at as string | null) ?? null);
        }
      } catch {
        /* table not yet created */
      }
    })();
  }, [userId]);

  async function handleToggleBreach() {
    const next = !breachEnabled;
    setBreachEnabled(next);
    try {
      await supabase
        .from('monitor_preferences' as Parameters<typeof supabase.from>[0])
        .upsert({ user_id: userId, breach_monitor_enabled: next }, { onConflict: 'user_id' });
    } catch {
      /* ignore if table missing */
    }
  }

  async function handleRenewAll() {
    setRenewAllPending(true);
    setRenewAllError(null);
    try {
      const { error } = await supabase.functions.invoke('renew-webhook-subscriptions', {
        body: { userId },
      });
      if (error) throw new Error(error.message);
      setRenewAllDone(true);
    } catch (err) {
      setRenewAllError(err instanceof Error ? err.message : 'Renewal failed.');
    } finally {
      setRenewAllPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Telegram */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-cyan-500" />
            Telegram Channel Monitoring
          </CardTitle>
          <CardDescription>Channels being watched for new messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {channelsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No channels configured yet.</p>
          ) : (
            <ul className="space-y-1">
              {channels.map(ch => (
                <li key={ch.id} className="text-sm flex items-center gap-2">
                  <Send className="h-3 w-3 text-cyan-500" />
                  {ch.channel_name ?? ch.channel_id ?? ch.id}
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/android-sync')}>
            Manage Channels
          </Button>
        </CardContent>
      </Card>

      {/* Breach Monitor */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            Breach Monitor
          </CardTitle>
          <CardDescription>HIBP + Dehashed monitoring for your email addresses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Status:{' '}
              {breachEnabled
                ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Enabled</Badge>
                : <Badge variant="secondary">Disabled</Badge>
              }
            </span>
            <Button variant="outline" size="sm" onClick={handleToggleBreach}>
              {breachEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
          {breachLastCheck && (
            <p className="text-xs text-muted-foreground">
              Last check: {new Date(breachLastCheck).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Webhook Subscription Health */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Webhook Subscription Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/30">
                <tr>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/30">
                  <td className="p-3">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-red-500" />
                      Gmail
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">Push Notification</td>
                  <td className="p-3">
                    <Badge variant="secondary">Check Settings</Badge>
                  </td>
                </tr>
                <tr className="border-t border-border/30">
                  <td className="p-3">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      Outlook / MS Graph
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">Webhook Subscription</td>
                  <td className="p-3">
                    <Badge variant="secondary">Check Settings</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {renewAllError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{renewAllError}</AlertDescription>
            </Alert>
          )}
          {renewAllDone && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-400">All Renewed</AlertTitle>
              <AlertDescription>All webhook subscriptions have been renewed.</AlertDescription>
            </Alert>
          )}
          {!renewAllDone && (
            <Button variant="outline" size="sm" onClick={handleRenewAll} disabled={renewAllPending}>
              {renewAllPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <RefreshCw className="h-4 w-4 mr-2" />
              }
              Force Renew All Subscriptions
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const VALID_TABS: TabId[] = ['overview', 'whatsapp', 'email', 'social', 'mobile', 'advanced'];

export default function IntegrationsSetupPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const rawTab = searchParams.get('tab') as TabId | null;
  const defaultTab: TabId = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  // Status state — starts all as not_setup; future: derive from Supabase queries
  const [integrationStatuses] = useState<Record<string, IntegrationStatus>>({
    whatsapp: 'not_setup',
    gmail: 'not_setup',
    outlook: 'not_setup',
    instagram: 'not_setup',
    linkedin: 'not_setup',
    android_sms: 'not_setup',
    telegram: 'not_setup',
    breach_monitor: 'not_setup',
  });

  const handleNavigateToTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const overviewItems = [
    {
      key: 'whatsapp',
      name: 'WhatsApp Personal',
      icon: <MessageCircle className="h-5 w-5 text-green-500" />,
      description: 'Personal chats via local bridge — works just like WhatsApp Web',
      tab: 'whatsapp' as TabId,
    },
    {
      key: 'gmail',
      name: 'Gmail',
      icon: <Mail className="h-5 w-5 text-red-500" />,
      description: 'Real-time push notifications and full inbox sync',
      tab: 'email' as TabId,
    },
    {
      key: 'outlook',
      name: 'Outlook / MS365',
      icon: <Mail className="h-5 w-5 text-blue-500" />,
      description: 'Work email, calendar, and Teams integration',
      tab: 'email' as TabId,
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: <Share2 className="h-5 w-5 text-pink-500" />,
      description: 'Messages and connections export',
      tab: 'social' as TabId,
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: <Briefcase className="h-5 w-5 text-blue-600" />,
      description: 'Connections and messages export',
      tab: 'social' as TabId,
    },
    {
      key: 'android_sms',
      name: 'Android SMS',
      icon: <Smartphone className="h-5 w-5 text-green-500" />,
      description: 'SMS history from your Galaxy S26 Ultra',
      tab: 'mobile' as TabId,
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: <Send className="h-5 w-5 text-cyan-500" />,
      description: 'Channel monitoring and message history',
      tab: 'advanced' as TabId,
    },
    {
      key: 'breach_monitor',
      name: 'Breach Monitor',
      icon: <Shield className="h-5 w-5 text-red-500" />,
      description: 'HIBP + Dehashed monitoring for your accounts',
      tab: 'advanced' as TabId,
    },
  ];

  return (
    <AppLayout title="Integrations & Setup">
      <div className="max-w-5xl space-y-6">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabId)}>
          <TabsList className="w-full h-auto p-1.5 grid grid-cols-3 sm:grid-cols-6 gap-1">
            <TabsTrigger value="overview" className="text-xs py-2">Overview</TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs py-2">WhatsApp</TabsTrigger>
            <TabsTrigger value="email" className="text-xs py-2">Email</TabsTrigger>
            <TabsTrigger value="social" className="text-xs py-2">Social</TabsTrigger>
            <TabsTrigger value="mobile" className="text-xs py-2">Mobile</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs py-2">Advanced</TabsTrigger>
          </TabsList>

          {/* ----------------------------------------------------------------
              Overview Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {overviewItems.map(item => (
                <OverviewCard
                  key={item.key}
                  name={item.name}
                  icon={item.icon}
                  description={item.description}
                  status={integrationStatuses[item.key]}
                  onSetUp={() => handleNavigateToTab(item.tab)}
                />
              ))}
            </div>
          </TabsContent>

          {/* ----------------------------------------------------------------
              WhatsApp Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="whatsapp" className="mt-6 space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Personal WhatsApp Bridge</AlertTitle>
              <AlertDescription className="text-sm">
                Connect your personal WhatsApp — all chats, contacts, and media metadata sync
                automatically. Uses your phone as a linked device, just like WhatsApp Web.
              </AlertDescription>
            </Alert>

            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertDescription className="text-sm">
                Keep the bridge running in the background on your Mac for continuous sync.
              </AlertDescription>
            </Alert>

            <WhatsAppPersonalBridge />
          </TabsContent>

          {/* ----------------------------------------------------------------
              Email Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="email" className="mt-6 space-y-6">
            {user && <GmailSection userId={user.id} />}
            {user && <OutlookSection userId={user.id} />}
          </TabsContent>

          {/* ----------------------------------------------------------------
              Social Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="social" className="mt-6 space-y-8">
            {/* Instagram */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-pink-500" />
                <h2 className="text-lg font-semibold">Instagram</h2>
              </div>
              <DataExportImporter
                platform="instagram"
                functionName="import-instagram-export"
                exportUrl="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                acceptedFormats=".zip"
                instructions={[
                  'Open Instagram → Settings → Account Center → Your information and permissions → Download your information',
                  'Select "Download or transfer information" → All Instagram accounts',
                  'Choose "Download to device" and select JSON format',
                  "You'll get an email when ready (usually a few hours)",
                  'Download the ZIP file and import below',
                ]}
                onComplete={result => console.log('Instagram import complete', result)}
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">LinkedIn</h2>
              </div>
              <DataExportImporter
                platform="linkedin"
                functionName="import-linkedin-export"
                exportUrl="https://www.linkedin.com/mypreferences/d/download-my-data"
                acceptedFormats=".zip"
                instructions={[
                  "Go to LinkedIn → Settings & Privacy → Data privacy → Get a copy of your data",
                  'Select "Want something in particular?" and choose: Connections, Messages, Profile',
                  "Click \"Request archive\" — you'll receive an email within 24 hours",
                  'Download the ZIP from the email link and upload it below',
                ]}
                onComplete={result => console.log('LinkedIn import complete', result)}
              />
            </div>
          </TabsContent>

          {/* ----------------------------------------------------------------
              Mobile Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="mobile" className="mt-6 space-y-6">
            <Alert className="border-primary/30 bg-primary/5">
              <Smartphone className="h-4 w-4 text-primary" />
              <AlertTitle>Samsung Galaxy S26 Ultra</AlertTitle>
              <AlertDescription className="text-sm">
                Your Samsung Galaxy S26 Ultra is your primary data source. Use these tools to
                continuously sync SMS and contacts.
              </AlertDescription>
            </Alert>

            <SmsBridge />
          </TabsContent>

          {/* ----------------------------------------------------------------
              Advanced Tab
          ---------------------------------------------------------------- */}
          <TabsContent value="advanced" className="mt-6">
            {user && <AdvancedTab userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
