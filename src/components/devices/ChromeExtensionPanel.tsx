import React, { useState, useEffect, useCallback } from 'react';
import { 
  Chrome, Download, CheckCircle2, XCircle, RefreshCw, 
  Settings, Shield, Instagram, Linkedin,
  Twitter, MessageCircle, Globe, Key, Clock,
  Youtube, Github, BookOpen, Camera, Hash,
  Users, Sparkles, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ExtensionTokenDialog } from './ExtensionTokenDialog';
import { invokeFunction } from '@/lib/api';

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

// Connection is considered active if last ping was within this threshold
const CONNECTION_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Reddit icon component
const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

// Pinterest icon component
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

const SUPPORTED_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500', tier: 'primary' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', tier: 'primary' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-sky-500', tier: 'primary' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'text-gray-500', tier: 'primary' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-black dark:text-white', tier: 'primary' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', tier: 'primary' },
  { id: 'facebook', name: 'Facebook', icon: Users, color: 'text-blue-500', tier: 'secondary' },
  { id: 'reddit', name: 'Reddit', icon: RedditIcon, color: 'text-orange-500', tier: 'secondary' },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestIcon, color: 'text-red-600', tier: 'secondary' },
  { id: 'github', name: 'GitHub', icon: Github, color: 'text-gray-700 dark:text-gray-300', tier: 'secondary' },
  { id: 'medium', name: 'Medium', icon: BookOpen, color: 'text-green-600', tier: 'secondary' },
  { id: 'snapchat', name: 'Snapchat', icon: Camera, color: 'text-yellow-400', tier: 'tertiary' },
  { id: 'bluesky', name: 'Bluesky', icon: Globe, color: 'text-blue-400', tier: 'tertiary' },
  { id: 'mastodon', name: 'Mastodon', icon: Hash, color: 'text-purple-500', tier: 'tertiary' },
  { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-500', tier: 'tertiary' },
];

export function ChromeExtensionPanel({ className }: ChromeExtensionPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<ExtensionSession[]>([]);
  const [activeTab, setActiveTab] = useState('platforms');
  const [settings, setSettings] = useState({
    autoCapture: true,
    captureComments: true,
    captureLikes: false,
    deepScrape: false,
    incrementalUpdates: true,
    autoLinkIdentities: true,
  });
  const { toast } = useToast();

  // Check extension connection status via device_presence table
  const checkExtensionStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsConnected(false);
        setLastSeen(null);
        return;
      }

      const { data, error } = await supabase
        .from('device_presence')
        .select('last_seen_at')
        .eq('user_id', user.id)
        .eq('device_type', 'chrome_extension')
        .maybeSingle();

      if (error) {
        console.error('Failed to check extension status:', error);
        setIsConnected(false);
        setLastSeen(null);
        return;
      }

      if (data?.last_seen_at) {
        const lastPingTime = new Date(data.last_seen_at);
        const now = new Date();
        const isActive = (now.getTime() - lastPingTime.getTime()) < CONNECTION_THRESHOLD_MS;
        
        setIsConnected(isActive);
        setLastSeen(lastPingTime);
      } else {
        setIsConnected(false);
        setLastSeen(null);
      }
    } catch (error) {
      console.error('Extension status check failed:', error);
      setIsConnected(false);
      setLastSeen(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkExtensionStatus();
    loadSessions();

    const interval = setInterval(checkExtensionStatus, 30000);
    return () => clearInterval(interval);
  }, [checkExtensionStatus]);

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

  const triggerIdentityLinking = async () => {
    try {
      const { error } = await invokeFunction('link-social-identities', { runForAll: true },);
      
      if (error) throw error;
      
      toast({
        title: 'Identity Linking Started',
        description: 'Analyzing captures for cross-platform matches...',
      });
    } catch (error) {
      toast({
        title: 'Linking Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
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

  const primaryPlatforms = SUPPORTED_PLATFORMS.filter(p => p.tier === 'primary');
  const secondaryPlatforms = SUPPORTED_PLATFORMS.filter(p => p.tier === 'secondary');
  const tertiaryPlatforms = SUPPORTED_PLATFORMS.filter(p => p.tier === 'tertiary');

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Chrome className="h-4 w-4 text-primary" />
          Chrome Extension
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={checkExtensionStatus}
              disabled={isChecking}
            >
              <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
            </Button>
            {isChecking ? (
              <Badge variant="secondary" className="text-xs">
                Checking...
              </Badge>
            ) : isConnected ? (
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-1">
          {lastSeen ? (
            <>
              <Clock className="h-3 w-3" />
              Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Capture 15+ social platforms with deep intelligence
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configure Extension Button */}
        <ExtensionTokenDialog>
          <Button variant="outline" size="sm" className="w-full">
            <Key className="h-4 w-4 mr-2" />
            Configure Extension
          </Button>
        </ExtensionTokenDialog>

        {/* Install/Connect Section */}
        {!isConnected && !isChecking && (
          <div className="p-4 bg-muted/50 rounded-lg text-center space-y-3">
            <Chrome className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Install Chrome Extension</p>
              <p className="text-xs text-muted-foreground mt-1">
                Capture profiles from 15+ platforms with one click
              </p>
            </div>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Extension
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms" className="text-xs">Platforms</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-3 mt-3">
            {/* Primary Platforms */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Primary Platforms
              </p>
              <div className="grid grid-cols-2 gap-2">
                {primaryPlatforms.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                    >
                      <Icon className={cn('h-4 w-4', platform.color)} />
                      <span className="text-xs font-medium">{platform.name}</span>
                      {isConnected && (
                        <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary Platforms */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Additional Platforms</p>
              <div className="grid grid-cols-3 gap-1.5">
                {secondaryPlatforms.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-1.5 p-1.5 bg-muted/20 rounded text-xs"
                    >
                      <Icon className={cn('h-3 w-3', platform.color)} />
                      <span className="truncate">{platform.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tertiary Platforms */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Emerging Platforms</p>
              <div className="flex flex-wrap gap-1.5">
                {tertiaryPlatforms.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <Badge key={platform.id} variant="outline" className="text-[10px] gap-1">
                      <Icon className={cn('h-2.5 w-2.5', platform.color)} />
                      {platform.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Identity Linking */}
            {isConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={triggerIdentityLinking}
              >
                <Users className="h-4 w-4 mr-2" />
                Link Cross-Platform Identities
              </Button>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-3 mt-3">
            {isConnected ? (
              <div className="space-y-3">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="incremental" className="text-xs">Incremental updates only</Label>
                  <Switch
                    id="incremental"
                    checked={settings.incrementalUpdates}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, incrementalUpdates: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-link" className="text-xs">Auto-link identities</Label>
                  <Switch
                    id="auto-link"
                    checked={settings.autoLinkIdentities}
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, autoLinkIdentities: checked }))}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                Connect extension to access settings
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            {sessions.length > 0 ? (
              <ScrollArea className="h-[180px]">
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
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No capture history yet
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Privacy Note */}
        <div className="p-2 bg-muted/30 rounded text-[10px] text-muted-foreground flex items-start gap-2">
          <Shield className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            Data is captured locally and synced securely. AI analysis runs on your captures for deeper insights.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChromeExtensionPanel;
