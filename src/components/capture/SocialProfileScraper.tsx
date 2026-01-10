import React, { useState } from 'react';
import { Globe, Loader2, Check, AlertCircle, Instagram, Twitter, Linkedin, Facebook, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  website?: string;
  location?: string;
  recentPosts?: Array<{
    content?: string;
    likes?: number;
    comments?: number;
  }>;
  confidence: number;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  threads: Globe,
  tiktok: Globe,
  youtube: Globe,
  github: Globe,
  unknown: Globe,
};

const PLATFORM_EXAMPLES: Record<string, string> = {
  instagram: 'https://instagram.com/username',
  threads: 'https://threads.net/@username',
  twitter: 'https://twitter.com/username',
  linkedin: 'https://linkedin.com/in/username',
};

export function SocialProfileScraper({ profileId, onComplete }: SocialProfileScraperProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const detectPlatform = (inputUrl: string): string => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('threads.net')) return 'threads';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('facebook.com')) return 'facebook';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('youtube.com')) return 'youtube';
    if (lower.includes('github.com')) return 'github';
    return 'unknown';
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a profile URL');
      return;
    }

    // Validate URL format
    let profileUrl = url.trim();
    if (!profileUrl.startsWith('http://') && !profileUrl.startsWith('https://')) {
      profileUrl = `https://${profileUrl}`;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-social-profile', {
        body: {
          profileUrl,
          profileId,
          includeRecentPosts: true,
          maxPosts: 5,
        },
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-url">Social Profile URL</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PlatformIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Button onClick={handleScrape} disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Scrape
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Works with Instagram, Threads, Twitter, LinkedIn, Facebook, TikTok, YouTube, GitHub
        </p>
      </div>

      {/* Quick Platform Links */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PLATFORM_EXAMPLES).map(([plat, example]) => {
          const Icon = PLATFORM_ICONS[plat];
          return (
            <Button
              key={plat}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setUrl(example)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {plat}
            </Button>
          );
        })}
      </div>

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
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <PlatformIcon className="h-8 w-8 text-muted-foreground" />
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
                </div>
                <p className="text-sm text-muted-foreground">
                  @{result.username || 'unknown'} · {result.platform}
                </p>
                {result.bio && (
                  <p className="text-sm mt-2 line-clamp-2">{result.bio}</p>
                )}
                
                <div className="flex gap-4 mt-3 text-sm">
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
                    href={result.website}
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
