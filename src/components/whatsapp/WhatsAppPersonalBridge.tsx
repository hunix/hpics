import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import {
  QrCode,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  RefreshCw,
  Unlink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BridgeStatus = 'disconnected' | 'waiting_qr' | 'connected' | 'unreachable';

interface PersonalConfig {
  bridge_url: string;
  bridge_secret: string;
  status: BridgeStatus;
  linked_phone: string;
  message_count: number | null;
  last_seen_at: string | null;
}

interface QrPollResponse {
  status: 'waiting_qr' | 'connected';
  qrCode?: string;
}

const DEFAULT_BRIDGE_URL = 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhatsAppPersonalBridge() {
  const { user } = useAuth();

  // persisted config
  const [config, setConfig] = useState<PersonalConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // form
  const [phone, setPhone] = useState('');
  const [bridgeUrl, setBridgeUrl] = useState(DEFAULT_BRIDGE_URL);
  const [bridgeSecret, setBridgeSecret] = useState('');

  // runtime state
  const [status, setStatus] = useState<BridgeStatus>('disconnected');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Load config on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    supabase
      .from('whatsapp_personal_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[WA Bridge] load config:', error);
        if (data) {
          const c = data as PersonalConfig & { user_id: string };
          setConfig(c);
          setBridgeUrl(c.bridge_url ?? DEFAULT_BRIDGE_URL);
          setBridgeSecret((data as Record<string, string>).bridge_secret ?? '');
          setPhone(c.linked_phone ?? '');
          setStatus(c.status as BridgeStatus);
          if (c.status === 'waiting_qr') {
            startPolling(c.bridge_url ?? DEFAULT_BRIDGE_URL, (data as Record<string, string>).bridge_secret ?? '');
          }
        }
        setLoadingConfig(false);
      });

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(url: string, secret: string) {
    stopPolling();
    // immediate first tick
    pollOnce(url, secret);
    pollRef.current = setInterval(() => pollOnce(url, secret), 4000);
  }

  async function pollOnce(url: string, secret: string) {
    try {
      const headers: HeadersInit = secret ? { Authorization: `Bearer ${secret}` } : {};
      const res = await fetch(`${url}/qr`, { headers, signal: AbortSignal.timeout(5000) });

      if (!res.ok) {
        setStatus('unreachable');
        setQrDataUrl(null);
        stopPolling();
        return;
      }

      const json = (await res.json()) as QrPollResponse;

      if (json.status === 'connected') {
        stopPolling();
        setStatus('connected');
        setQrDataUrl(null);
        if (user) {
          await supabase
            .from('whatsapp_personal_config')
            .upsert({ user_id: user.id, status: 'connected' }, { onConflict: 'user_id' });
        }
        setConfig(prev => prev ? { ...prev, status: 'connected' } : prev);
        return;
      }

      if (json.status === 'waiting_qr') {
        setStatus('waiting_qr');
        if (json.qrCode) setQrDataUrl(json.qrCode);
        return;
      }
    } catch {
      setStatus('unreachable');
      setQrDataUrl(null);
      stopPolling();
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleLink() {
    if (!user) return;
    setLinking(true);
    setErrorMsg(null);

    try {
      // Verify bridge is reachable first
      try {
        const headers: HeadersInit = bridgeSecret ? { Authorization: `Bearer ${bridgeSecret}` } : {};
        const probe = await fetch(`${bridgeUrl}/qr`, { headers, signal: AbortSignal.timeout(5000) });
        if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
      } catch {
        setStatus('unreachable');
        setLinking(false);
        return;
      }

      // Save to Supabase
      const row = {
        user_id: user.id,
        bridge_url: bridgeUrl,
        bridge_secret: bridgeSecret || null,
        status: 'waiting_qr',
        linked_phone: phone,
      };

      const { error } = await supabase
        .from('whatsapp_personal_config')
        .upsert(row, { onConflict: 'user_id' });

      if (error) throw new Error(error.message);

      setStatus('waiting_qr');
      setConfig({
        bridge_url: bridgeUrl,
        bridge_secret: bridgeSecret,
        status: 'waiting_qr',
        linked_phone: phone,
        message_count: null,
        last_seen_at: null,
      });

      startPolling(bridgeUrl, bridgeSecret);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start pairing.');
    } finally {
      setLinking(false);
    }
  }

  async function handleCancel() {
    stopPolling();
    setStatus('disconnected');
    setQrDataUrl(null);
    if (user) {
      await supabase
        .from('whatsapp_personal_config')
        .upsert({ user_id: user.id, status: 'disconnected' }, { onConflict: 'user_id' });
    }
    setConfig(prev => prev ? { ...prev, status: 'disconnected' } : prev);
  }

  async function handleDisconnect() {
    if (!user) return;
    setDisconnecting(true);
    stopPolling();
    await supabase
      .from('whatsapp_personal_config')
      .upsert({ user_id: user.id, status: 'disconnected' }, { onConflict: 'user_id' });
    setStatus('disconnected');
    setConfig(prev => prev ? { ...prev, status: 'disconnected' } : prev);
    setQrDataUrl(null);
    setDisconnecting(false);
  }

  function handleRetryAfterUnreachable() {
    setStatus('disconnected');
    setErrorMsg(null);
    setQrDataUrl(null);
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loadingConfig) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: "Bridge not reachable" state
  // ---------------------------------------------------------------------------

  if (status === 'unreachable') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Personal Bridge
          </CardTitle>
          <CardDescription>Your WhatsApp bridge is not reachable at {bridgeUrl}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle>Your WhatsApp bridge isn't running yet</AlertTitle>
            <AlertDescription className="space-y-3 mt-2 text-sm">
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
                  <span>
                    On your Mac, open Terminal and run:
                    <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                      cd ~/path/to/hpics/services/whatsapp-bridge && npm install && npm run dev
                    </code>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
                  <span>The bridge starts at <strong>http://localhost:3001</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
                  <span>Come back here and click "Link Device"</span>
                </li>
              </ol>
              <p className="text-muted-foreground">
                OR run with Docker:
                <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  docker run --env-file .env -p 3001:3001 wa-bridge
                </code>
              </p>
            </AlertDescription>
          </Alert>

          <Button variant="outline" onClick={handleRetryAfterUnreachable}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Connected state
  // ---------------------------------------------------------------------------

  if (status === 'connected') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Personal Bridge
            </CardTitle>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1.5 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(config?.linked_phone) && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{config.linked_phone}</span>
              </div>
            )}
            {(config?.message_count != null) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{config.message_count.toLocaleString()} messages synced</span>
              </div>
            )}
            {config?.last_seen_at && (
              <p className="text-xs text-muted-foreground">
                Last seen: {new Date(config.last_seen_at).toLocaleString()}
              </p>
            )}
          </div>

          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Unlink className="h-4 w-4 mr-2" />
            }
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Waiting for QR scan
  // ---------------------------------------------------------------------------

  if (status === 'waiting_qr') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-500" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Open WhatsApp on your phone → Linked Devices → Link a Device, then scan below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-[220px] h-[220px] rounded-lg border flex items-center justify-center bg-white">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="WhatsApp pairing QR code"
                  className="w-[210px] h-[210px] object-contain"
                />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for scan...</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleCancel} className="w-full">
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Disconnected — link form
  // ---------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          Link WhatsApp
        </CardTitle>
        <CardDescription>
          Connect your personal WhatsApp by pairing with your phone. Works just like WhatsApp Web.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMsg && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="wa-phone">
            <Phone className="h-3.5 w-3.5 inline mr-1 mb-0.5" />
            Your phone number (for display)
          </Label>
          <Input
            id="wa-phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Used for display only — the bridge handles authentication.
          </p>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border rounded-md px-3">
            <AccordionTrigger className="text-sm text-muted-foreground py-3 hover:no-underline">
              Advanced settings
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="space-y-2">
                <Label htmlFor="wa-bridge-url">Bridge URL</Label>
                <Input
                  id="wa-bridge-url"
                  type="url"
                  placeholder="http://localhost:3001"
                  value={bridgeUrl}
                  onChange={e => setBridgeUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Default: http://localhost:3001 — only change if running the bridge on a different host or port.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa-bridge-secret">Bridge secret (optional)</Label>
                <Input
                  id="wa-bridge-secret"
                  type="password"
                  placeholder="Leave blank if none"
                  value={bridgeSecret}
                  onChange={e => setBridgeSecret(e.target.value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          className="w-full"
          onClick={handleLink}
          disabled={linking}
        >
          {linking
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <QrCode className="h-4 w-4 mr-2" />
          }
          {linking ? 'Starting…' : 'Link Device'}
        </Button>
      </CardContent>
    </Card>
  );
}
