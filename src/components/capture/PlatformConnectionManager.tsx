import React, { useState, useEffect } from 'react';
import { 
  Globe, CheckCircle2, XCircle, Clock, RefreshCw,
  Instagram, Linkedin, Twitter, Youtube, Github, BookOpen,
  Camera, Hash, Users, MessageCircle, Link2, Unlink,
  Calendar, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Platform icons (reusing from other components)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

interface PlatformStatus {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  captureCount: number;
  lastCapture?: string;
  linkedProfiles: number;
  isActive: boolean;
}

interface IdentityLink {
  id: string;
  platforms: string[];
  usernames: Array<{ platform: string; username: string }>;
  confidence: number;
  profileId?: string;
  createdAt: string;
}

interface PlatformConnectionManagerProps {
  className?: string;
}

const ALL_PLATFORMS: Omit<PlatformStatus, 'captureCount' | 'lastCapture' | 'linkedProfiles' | 'isActive'>[] = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-sky-500' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'text-gray-500' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'text-black dark:text-white' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'facebook', name: 'Facebook', icon: Users, color: 'text-blue-500' },
  { id: 'reddit', name: 'Reddit', icon: RedditIcon, color: 'text-orange-500' },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestIcon, color: 'text-red-600' },
  { id: 'github', name: 'GitHub', icon: Github, color: 'text-gray-700 dark:text-gray-300' },
  { id: 'medium', name: 'Medium', icon: BookOpen, color: 'text-green-600' },
  { id: 'snapchat', name: 'Snapchat', icon: Camera, color: 'text-yellow-400' },
  { id: 'bluesky', name: 'Bluesky', icon: Globe, color: 'text-blue-400' },
  { id: 'mastodon', name: 'Mastodon', icon: Hash, color: 'text-purple-500' },
  { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-500' },
];

export function PlatformConnectionManager({ className }: PlatformConnectionManagerProps) {
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [identityLinks, setIdentityLinks] = useState<IdentityLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlatformStats();
    loadIdentityLinks();
  }, []);

  const loadPlatformStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get capture counts per platform
      const { data: captures } = await supabase
        .from('device_captures')
        .select('source_app, created_at, profile_id')
        .eq('user_id', user.id)
        .in('capture_type', ['social_profile', 'bulk_social_scrape']);

      const platformStats: Record<string, { count: number; lastCapture?: string; linkedProfiles: Set<string> }> = {};
      
      captures?.forEach(capture => {
        const platform = capture.source_app?.toLowerCase() || 'unknown';
        if (!platformStats[platform]) {
          platformStats[platform] = { count: 0, linkedProfiles: new Set() };
        }
        platformStats[platform].count++;
        if (!platformStats[platform].lastCapture || capture.created_at > platformStats[platform].lastCapture) {
          platformStats[platform].lastCapture = capture.created_at;
        }
        if (capture.profile_id) {
          platformStats[platform].linkedProfiles.add(capture.profile_id);
        }
      });

      const enrichedPlatforms: PlatformStatus[] = ALL_PLATFORMS.map(p => ({
        ...p,
        captureCount: platformStats[p.id]?.count || 0,
        lastCapture: platformStats[p.id]?.lastCapture,
        linkedProfiles: platformStats[p.id]?.linkedProfiles.size || 0,
        isActive: (platformStats[p.id]?.count || 0) > 0,
      }));

      // Sort by capture count (active first)
      enrichedPlatforms.sort((a, b) => b.captureCount - a.captureCount);
      
      setPlatforms(enrichedPlatforms);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIdentityLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_identity_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setIdentityLinks((data || []).map(link => ({
        id: link.id,
        platforms: link.platforms || [],
        usernames: (link.usernames as any) || [],
        confidence: link.confidence_score || 0,
        profileId: link.primary_profile_id,
        createdAt: link.created_at,
      })));
    } catch (error) {
      console.error('Failed to load identity links:', error);
    }
  };

  const runIdentityLinking = async () => {
    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('link-social-identities', {
        body: { runForAll: true },
      });

      if (error) throw error;

      toast({
        title: 'Identity Linking Complete',
        description: `Found ${data.confirmedMatches || 0} cross-platform matches`,
      });

      loadIdentityLinks();
    } catch (error) {
      toast({
        title: 'Linking Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const activePlatforms = platforms.filter(p => p.isActive);
  const inactivePlatforms = platforms.filter(p => !p.isActive);
  const totalCaptures = platforms.reduce((sum, p) => sum + p.captureCount, 0);
  const totalLinkedProfiles = new Set(platforms.flatMap(p => Array(p.linkedProfiles).fill(null))).size;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Platform Connections
        </CardTitle>
        <CardDescription className="text-xs">
          Manage social platform captures and cross-platform identity links
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{activePlatforms.length}</p>
            <p className="text-[10px] text-muted-foreground">Platforms</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{totalCaptures}</p>
            <p className="text-[10px] text-muted-foreground">Captures</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <p className="text-lg font-bold">{identityLinks.length}</p>
            <p className="text-[10px] text-muted-foreground">Linked IDs</p>
          </div>
        </div>

        {/* Active Platforms */}
        {activePlatforms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Active Platforms ({activePlatforms.length})
            </p>
            <ScrollArea className="h-[150px]">
              <div className="space-y-1.5">
                {activePlatforms.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <div
                      key={platform.id}
                      className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg"
                    >
                      <Icon className={cn('h-4 w-4', platform.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{platform.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {platform.captureCount} captures • {platform.linkedProfiles} linked
                        </p>
                      </div>
                      <div className="text-right">
                        {platform.lastCapture && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(platform.lastCapture), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Inactive Platforms */}
        {inactivePlatforms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3 w-3 text-gray-400" />
              Available Platforms ({inactivePlatforms.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {inactivePlatforms.slice(0, 8).map(platform => {
                const Icon = platform.icon;
                return (
                  <Badge key={platform.id} variant="outline" className="text-[10px] gap-1">
                    <Icon className={cn('h-2.5 w-2.5', platform.color)} />
                    {platform.name}
                  </Badge>
                );
              })}
              {inactivePlatforms.length > 8 && (
                <Badge variant="outline" className="text-[10px]">
                  +{inactivePlatforms.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Identity Links */}
        {identityLinks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3 text-blue-500" />
              Cross-Platform Identity Links
            </p>
            <ScrollArea className="h-[100px]">
              <div className="space-y-1.5">
                {identityLinks.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"
                  >
                    <div className="flex -space-x-1">
                      {link.platforms.slice(0, 3).map((platform, i) => {
                        const p = ALL_PLATFORMS.find(ap => ap.id === platform);
                        if (!p) return null;
                        const Icon = p.icon;
                        return (
                          <div key={i} className="h-5 w-5 rounded-full bg-background flex items-center justify-center border">
                            <Icon className={cn('h-3 w-3', p.color)} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1">
                        {link.usernames.slice(0, 2).map((u, i) => (
                          <span key={i} className="text-[10px]">@{u.username}</span>
                        ))}
                      </div>
                    </div>
                    <Badge 
                      variant={link.confidence >= 0.8 ? "default" : "secondary"} 
                      className="text-[9px]"
                    >
                      {Math.round(link.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={runIdentityLinking}
            disabled={isLinking}
          >
            {isLinking ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Link Identities
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              loadPlatformStats();
              loadIdentityLinks();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlatformConnectionManager;
