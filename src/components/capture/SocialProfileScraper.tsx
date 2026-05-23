import React, { useState } from 'react';
import { 
  Globe, Loader2, Check, AlertCircle, Instagram, Twitter, Linkedin, 
  Facebook, ExternalLink, Youtube, Github, BookOpen, Camera, Hash,
  Users, Sparkles, Zap, ChevronDown
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SocialProfileScraperProps {
  profileId?: string;
  onComplete?: (captureId: string, data: any) => void;
}

interface ScrapeResult {
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  isBusiness?: boolean;
  isCreator?: boolean;
  website?: string;
  location?: string;
  category?: string;
  recentPosts?: Array<{
    content?: string;
    likes?: number;
    comments?: number;
    views?: number;
  }>;
  intelligence?: {
    topics?: string[];
    engagementRate?: number;
    contentTypes?: Record<string, number>;
  };
  autoTags?: string[];
  confidence: number;
}

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Reddit icon component
const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
  </svg>
);

// Pinterest icon component  
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

type PlatformIconComponent = React.ElementType;

const PLATFORM_ICONS: Record<string, PlatformIconComponent> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  threads: Globe,
  tiktok: TikTokIcon,
  youtube: Youtube,
  github: Github,
  medium: BookOpen,
  pinterest: PinterestIcon,
  reddit: RedditIcon,
  snapchat: Camera,
  bluesky: Globe,
  mastodon: Hash,
  discord: Users,
  unknown: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-500',
  twitter: 'text-sky-500',
  linkedin: 'text-blue-600',
  facebook: 'text-blue-500',
  threads: 'text-gray-600',
  tiktok: 'text-black dark:text-white',
  youtube: 'text-red-500',
  github: 'text-gray-700 dark:text-gray-300',
  medium: 'text-green-600',
  pinterest: 'text-red-600',
  reddit: 'text-orange-500',
  snapchat: 'text-yellow-400',
  bluesky: 'text-blue-400',
  mastodon: 'text-purple-500',
  discord: 'text-indigo-500',
  unknown: 'text-gray-500',
};

const PLATFORM_EXAMPLES: Record<string, string> = {
  instagram: 'instagram.com/username',
  threads: 'threads.net/@username',
  twitter: 'x.com/username',
  linkedin: 'linkedin.com/in/username',
  tiktok: 'tiktok.com/@username',
  youtube: 'youtube.com/@channel',
  github: 'github.com/username',
  reddit: 'reddit.com/user/username',
  medium: 'medium.com/@username',
  pinterest: 'pinterest.com/username',
};

const SCRAPE_DEPTHS = [
  { value: 'quick', label: 'Quick', description: 'Profile info only', icon: Zap },
  { value: 'standard', label: 'Standard', description: 'Profile + recent posts', icon: Globe },
  { value: 'deep', label: 'Deep', description: 'Full analysis + AI insights', icon: Sparkles },
];

export function SocialProfileScraper({ profileId, onComplete }: SocialProfileScraperProps) {
  const [url, setUrl] = useState('');
  const [scrapeDepth, setScrapeDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const detectPlatform = (inputUrl: string): string => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('threads.net')) return 'threads';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('facebook.com')) return 'facebook';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('github.com')) return 'github';
    if (lower.includes('reddit.com')) return 'reddit';
    if (lower.includes('medium.com')) return 'medium';
    if (lower.includes('pinterest.com')) return 'pinterest';
    if (lower.includes('snapchat.com')) return 'snapchat';
    if (lower.includes('bsky.app') || lower.includes('bluesky')) return 'bluesky';
    if (lower.includes('mastodon') || lower.includes('mstdn')) return 'mastodon';
    if (lower.includes('discord.com')) return 'discord';
    return 'unknown';
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a profile URL');
      return;
    }

    let profileUrl = url.trim();
    if (!profileUrl.startsWith('http://') && !profileUrl.startsWith('https://')) {
      profileUrl = `https://${profileUrl}`;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const detectedPlatform = detectPlatform(profileUrl);
      
      // Use deep scraping edge functions for Instagram and Threads in deep mode
      if (scrapeDepth === 'deep' && (detectedPlatform === 'instagram' || detectedPlatform === 'threads')) {
        const functionName = detectedPlatform === 'instagram' ? 'scrape-instagram-deep' : 'scrape-threads-deep';
        
        const { data, error: fnError } = await invokeFunction(functionName, {
          url: profileUrl,
          profileId,
          options: {
            useFirecrawl: true,
            includeScreenshot: false,
            maxPosts: 50,
            extractBranding: false,
          },
        });

        if (fnError) throw fnError;

        if (!data?.success) {
          throw new Error(data?.error || 'Deep scrape failed');
        }

        // Transform deep scrape result to standard format
        const profile = data?.profile || {};
        const transformedResult: ScrapeResult = {
          platform: detectedPlatform,
          username: profile.username || profile.handle || '',
          displayName: profile.displayName,
          bio: profile.bio,
          followersCount: profile.followersCount,
          followingCount: profile.followingCount,
          postsCount: profile.postsCount,
          isVerified: profile.isVerified,
          isPrivate: profile.isPrivate,
          isBusiness: profile.isBusiness,
          website: profile.externalUrl,
          category: profile.category,
          recentPosts: detectedPlatform === 'instagram' 
            ? (data.recentPosts || []).slice(0, 20).map((p: any) => ({
                content: p.caption || p.alt,
                likes: p.likes || p.likesHint,
                comments: p.comments || p.commentsHint,
                views: p.views,
              }))
            : (data.recentThreads || []).slice(0, 20).map((t: any) => ({
                content: t.content,
                likes: t.likes,
                comments: t.replies,
              })),
          intelligence: {
            topics: detectedPlatform === 'threads' && data.contentAnalysis 
              ? Object.keys(data.contentAnalysis.topHashtags || {}).slice(0, 10) 
              : undefined,
            engagementRate: data.contentAnalysis?.totalEngagement 
              ? (data.contentAnalysis.totalEngagement / Math.max(data.contentAnalysis.totalThreads, 1)) 
              : undefined,
            contentTypes: {
              posts: data.recentPosts?.length || data.recentThreads?.length || 0,
              reels: data.reels?.length || 0,
              highlights: data.highlights?.length || 0,
            },
          },
          autoTags: [
            ...(detectedPlatform === 'instagram' && data.highlights?.length ? ['Has Highlights'] : []),
            ...(detectedPlatform === 'instagram' && data.reels?.length ? ['Has Reels'] : []),
            ...(profile.isVerified ? ['Verified'] : []),
            ...(profile.isBusiness ? ['Business Account'] : []),
            `${data.recentPosts?.length || data.recentThreads?.length || 0} posts captured`,
          ],
          confidence: data.success ? 0.95 : 0.5,
        };

        setResult(transformedResult);
        toast({
          title: 'Deep Scrape Complete',
          description: `Captured ${data.recentPosts?.length || data.recentThreads?.length || 0} posts from ${transformedResult.username}`,
        });

        if (data.captureId) {
          onComplete?.(data.captureId, transformedResult);
        }
      } else {
        // Standard scraping for other platforms or non-deep modes
        const { data, error: fnError } = await invokeFunction('scrape-social-profile', {
            profileUrl,
            profileId,
            scrapeDepth,
            includeRecentPosts: scrapeDepth !== 'quick',
            maxPosts: scrapeDepth === 'deep' ? 20 : 5,
            runDeepAnalysis: scrapeDepth === 'deep',
          });

        if (fnError) throw fnError;

        if (data.error) {
          throw new Error(data.error);
        }

        setResult(data.data);
        toast({
          title: 'Profile Scraped',
          description: `Found ${data.data.username || 'profile'} on ${data.platform}`,
        });

        if (data.captureId) {
          onComplete?.(data.captureId, data.data);
        }
      }
    } catch (err) {
      console.error('Scrape error:', err);
      const message = err instanceof Error ? err.message : 'Failed to scrape profile';
      setError(message);
      toast({
        title: 'Scrape Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const platform = url ? detectPlatform(url) : 'unknown';
  const PlatformIcon = PLATFORM_ICONS[platform] || Globe;
  const platformColor = PLATFORM_COLORS[platform] || 'text-gray-500';

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="profile-url">Social Profile URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <PlatformIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4", platformColor)} />
              <Input
                id="profile-url"
                type="url"
                placeholder="https://instagram.com/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Select value={scrapeDepth} onValueChange={(v: 'quick' | 'standard' | 'deep') => setScrapeDepth(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRAPE_DEPTHS.map(depth => {
                  const Icon = depth.icon;
                  return (
                    <SelectItem key={depth.value} value={depth.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        <span>{depth.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {SCRAPE_DEPTHS.find(d => d.value === scrapeDepth)?.description}
          </p>
        </div>

        <Button onClick={handleScrape} disabled={isLoading || !url.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Scrape Profile
            </>
          )}
        </Button>
      </div>

      {/* Quick Platform Links */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", showAdvanced && "rotate-180")} />
            {showAdvanced ? 'Hide' : 'Show'} platform examples
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PLATFORM_EXAMPLES).map(([plat, example]) => {
              const Icon = PLATFORM_ICONS[plat];
              const color = PLATFORM_COLORS[plat];
              return (
                <Button
                  key={plat}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 px-2"
                  onClick={() => setUrl(example)}
                >
                  <Icon className={cn("h-3 w-3 mr-1", color)} />
                  {plat}
                </Button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "h-16 w-16 rounded-full bg-muted flex items-center justify-center",
                platformColor
              )}>
                <PlatformIcon className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">
                    {result.displayName || result.username || 'Unknown'}
                  </h3>
                  {result.isVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  {result.isPrivate && (
                    <Badge variant="outline">Private</Badge>
                  )}
                  {result.isBusiness && (
                    <Badge variant="outline" className="text-blue-500 border-blue-500">Business</Badge>
                  )}
                  {result.isCreator && (
                    <Badge variant="outline" className="text-purple-500 border-purple-500">Creator</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{result.username || 'unknown'} · {result.platform}
                  {result.category && ` · ${result.category}`}
                </p>
                {result.bio && (
                  <p className="text-sm mt-2 line-clamp-2">{result.bio}</p>
                )}
                
                <div className="flex gap-4 mt-3 text-sm flex-wrap">
                  {result.followersCount !== undefined && (
                    <span>
                      <strong>{formatCount(result.followersCount)}</strong> followers
                    </span>
                  )}
                  {result.followingCount !== undefined && (
                    <span>
                      <strong>{formatCount(result.followingCount)}</strong> following
                    </span>
                  )}
                  {result.postsCount !== undefined && (
                    <span>
                      <strong>{formatCount(result.postsCount)}</strong> posts
                    </span>
                  )}
                </div>

                {result.website && (
                  <a 
                    href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {result.website.replace(/^https?:\/\//, '').substring(0, 30)}
                  </a>
                )}
              </div>
            </div>

            {/* Auto Tags */}
            {result.autoTags && result.autoTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {result.autoTags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Intelligence Insights */}
            {result.intelligence && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  AI Insights
                </h4>
                
                {result.intelligence.engagementRate !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Engagement Rate: <strong>{result.intelligence.engagementRate.toFixed(2)}%</strong>
                  </p>
                )}
                
                {result.intelligence.topics && result.intelligence.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.intelligence.topics.slice(0, 8).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}

                {result.intelligence.contentTypes && (
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {Object.entries(result.intelligence.contentTypes).map(([type, count]) => (
                      count > 0 && (
                        <span key={type}>
                          {type}: <strong>{count}</strong>
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Posts */}
            {result.recentPosts && result.recentPosts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recent Posts ({result.recentPosts.length})</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {result.recentPosts.map((post, idx) => (
                      <div key={idx} className="text-xs bg-muted/50 p-2 rounded">
                        <p className="line-clamp-2">{post.content || '[No text content]'}</p>
                        <div className="flex gap-3 mt-1 text-muted-foreground">
                          {post.likes !== undefined && <span>❤️ {formatCount(post.likes)}</span>}
                          {post.comments !== undefined && <span>💬 {formatCount(post.comments)}</span>}
                          {post.views !== undefined && <span>👁 {formatCount(post.views)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Confidence Score */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Confidence: {Math.round((result.confidence || 0) * 100)}%
              </span>
              <Button size="sm" disabled>
                Apply to Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default SocialProfileScraper;
