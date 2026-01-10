import React, { useState, useEffect } from 'react';
import { 
  Chrome, Download, CheckCircle2, XCircle, RefreshCw, 
  ExternalLink, Settings, Shield, Zap, Instagram, Linkedin,
  Twitter, MessageCircle, Globe, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ExtensionSession {
  id: string;
  platform: string;
  profile_url: string;
  pages_captured: number;
  posts_captured: number;
  comments_captured: number;
  status: string;
  created_at: string;
}

interface ChromeExtensionPanelProps {
  className?: string;
}

const SUPPORTED_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-sky-500' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'text-gray-500' },
];

export function ChromeExtensionPanel({ className }: ChromeExtensionPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [sessions, setSessions] = useState<ExtensionSession[]>([]);
  const [settings, setSettings] = useState({
    autoCapture: true,
    captureComments: true,
    captureLikes: false,
    deepScrape: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkExtensionStatus();
    loadSessions();
  }, []);

  const checkExtensionStatus = async () => {
    setIsChecking(true);
    try {
      // Check if extension is installed by looking for its message listener
      const isInstalled = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 1000);
        
        window.addEventListener('message', function handler(event) {
          if (event.data?.type === 'INTEL_CRM_EXTENSION_PONG') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(true);
          }
        });

        window.postMessage({ type: 'INTEL_CRM_EXTENSION_PING' }, '*');
      });

      setIsConnected(isInstalled);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('extension_scrape_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load extension sessions:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const found = SUPPORTED_PLATFORMS.find(p => p.id === platform.toLowerCase());
    return found?.icon || Globe;
  };

  const getPlatformColor = (platform: string) => {
    const found = SUPPORTED_PLATFORMS.find(p => p.id === platform.toLowerCase());
    return found?.color || 'text-gray-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-xs">Complete</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Chrome className="h-4 w-4 text-primary" />
          Chrome Extension
          {isChecking ? (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin text-muted-foreground" />
          ) : isConnected ? (
            <Badge variant="default" className="text-xs ml-auto bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs ml-auto">
              <XCircle className="h-3 w-3 mr-1" />
              Not Installed
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Capture private social profiles directly from your browser
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Install/Connect Section */}
        {!isConnected && !isChecking && (
          <div className="p-4 bg-muted/50 rounded-lg text-center space-y-3">
            <Chrome className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Install Chrome Extension</p>
              <p className="text-xs text-muted-foreground mt-1">
                Capture Instagram, LinkedIn, and Threads profiles with one click
              </p>
            </div>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Extension
            </Button>
          </div>
        )}

        {/* Supported Platforms */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Supported Platforms</p>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              return (
                <div
                  key={platform.id}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <Icon className={cn('h-4 w-4', platform.color)} />
                  <span className="text-sm">{platform.name}</span>
                  {isConnected && (
                    <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Extension Settings */}
        {isConnected && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Capture Settings
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-capture" className="text-xs">Auto-capture on profile visit</Label>
                <Switch
                  id="auto-capture"
                  checked={settings.autoCapture}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, autoCapture: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="capture-comments" className="text-xs">Capture comments</Label>
                <Switch
                  id="capture-comments"
                  checked={settings.captureComments}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, captureComments: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="deep-scrape" className="text-xs">Deep scrape (all posts)</Label>
                <Switch
                  id="deep-scrape"
                  checked={settings.deepScrape}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, deepScrape: checked }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Captures</p>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {sessions.map(session => {
                  const Icon = getPlatformIcon(session.platform);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-2 p-2 bg-background rounded border"
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', getPlatformColor(session.platform))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{session.profile_url}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {session.posts_captured} posts • {session.comments_captured} comments
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {getStatusBadge(session.status)}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Privacy Note */}
        <div className="p-2 bg-muted/30 rounded text-[10px] text-muted-foreground flex items-start gap-2">
          <Shield className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            Data is captured locally and synced securely. Only you have access to captured profiles.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChromeExtensionPanel;
