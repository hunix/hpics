import React, { useState } from 'react';
import { 
  useSocialPosts, 
  useSocialConnections, 
  useEngagementMetrics,
  useComprehensiveScrape,
  useScrapeJobs,
} from '@/hooks/useSocialIntelligence';
import { detectPlatformFromUrl, extractUsernameFromUrl, type SocialPlatform } from '@/lib/api/comprehensive-social';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Users, 
  Heart, 
  MessageCircle, 
  Eye, 
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Hash,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SocialIntelligencePanelProps {
  profileId: string;
  socialUrls?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    threads?: string;
    tiktok?: string;
  };
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  threads: <Hash className="h-4 w-4" />,
  tiktok: <TrendingUp className="h-4 w-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  twitter: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  linkedin: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
  threads: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  tiktok: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export function SocialIntelligencePanel({ profileId, socialUrls }: SocialIntelligencePanelProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | undefined>();
  
  const { data: posts, isLoading: postsLoading } = useSocialPosts(profileId, selectedPlatform);
  const { data: followers } = useSocialConnections(profileId, 'follower');
  const { data: following } = useSocialConnections(profileId, 'following');
  const { data: metrics, isLoading: metricsLoading } = useEngagementMetrics(profileId);
  const { data: jobs } = useScrapeJobs(profileId);
  
  const scrape = useComprehensiveScrape();

  const handleScrape = (platform: SocialPlatform, scrapeType: 'full' | 'posts' | 'followers' | 'following') => {
    const url = socialUrls?.[platform];
    if (!url) return;
    
    const username = extractUsernameFromUrl(url);
    if (!username) return;

    scrape.mutate({
      profileId,
      platform,
      username,
      scrapeType,
      maxItems: 100,
    });
  };

  const availablePlatforms = Object.entries(socialUrls || {})
    .filter(([_, url]) => url)
    .map(([platform]) => platform as SocialPlatform);

  const runningJobs = jobs?.filter(j => j.status === 'running') || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Posts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.totalPosts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Total Likes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{(metrics?.totalLikes || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Comments</span>
            </div>
            <p className="text-2xl font-bold mt-1">{(metrics?.totalComments || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Views</span>
            </div>
            <p className="text-2xl font-bold mt-1">{(metrics?.totalViews || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick Scrape
          </CardTitle>
          <CardDescription>
            Fetch the latest data from connected social profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map(platform => (
              <div key={platform} className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScrape(platform, 'full')}
                  disabled={scrape.isPending}
                  className={PLATFORM_COLORS[platform]}
                >
                  {PLATFORM_ICONS[platform]}
                  <span className="ml-1 capitalize">{platform}</span>
                  {scrape.isPending && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                </Button>
              </div>
            ))}
            {availablePlatforms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No social profiles linked. Add social URLs to this contact to enable scraping.
              </p>
            )}
          </div>
          
          {runningJobs.length > 0 && (
            <div className="mt-4 space-y-2">
              {runningJobs.map(job => (
                <div key={job.id} className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Scraping {job.platform}...</span>
                  <span className="text-muted-foreground">
                    {job.items_scraped} items
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">
            <BarChart3 className="h-4 w-4 mr-1" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Users className="h-4 w-4 mr-1" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Posts</CardTitle>
                <div className="flex gap-1">
                  {availablePlatforms.map(platform => (
                    <Button
                      key={platform}
                      variant={selectedPlatform === platform ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedPlatform(
                        selectedPlatform === platform ? undefined : platform
                      )}
                      className="h-7 px-2"
                    >
                      {PLATFORM_ICONS[platform]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts && posts.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {posts.map(post => (
                      <div 
                        key={post.id} 
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={PLATFORM_COLORS[post.platform]}>
                                {PLATFORM_ICONS[post.platform]}
                                <span className="ml-1 capitalize">{post.platform}</span>
                              </Badge>
                              {post.posted_at && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">
                              {post.content || 'No caption'}
                            </p>
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {post.hashtags.slice(0, 5).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes_count?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments_count?.toLocaleString()}
                          </span>
                          {post.views_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views_count?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No posts scraped yet</p>
                  <p className="text-xs mt-1">Use Quick Scrape above to fetch posts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Followers ({followers?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {followers && followers.length > 0 ? (
                    <div className="space-y-2">
                      {followers.slice(0, 50).map(conn => (
                        <div key={conn.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {conn.connected_avatar_url ? (
                              <img 
                                src={conn.connected_avatar_url} 
                                alt="" 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conn.connected_display_name || conn.connected_username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{conn.connected_username}
                              {conn.connected_verified && ' ✓'}
                            </p>
                          </div>
                          {conn.connected_followers_count && (
                            <span className="text-xs text-muted-foreground">
                              {conn.connected_followers_count.toLocaleString()} followers
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No followers data</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Following ({following?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {following && following.length > 0 ? (
                    <div className="space-y-2">
                      {following.slice(0, 50).map(conn => (
                        <div key={conn.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {conn.connected_avatar_url ? (
                              <img 
                                src={conn.connected_avatar_url} 
                                alt="" 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {conn.connected_display_name || conn.connected_username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{conn.connected_username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No following data</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Hashtags</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.topHashtags && metrics.topHashtags.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.topHashtags.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="secondary">#{item.tag}</Badge>
                        <Progress value={(item.count / metrics.topHashtags[0].count) * 100} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hashtag data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Posting Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frequency</span>
                  <span className="font-medium">{metrics?.postingFrequency || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Engagement</span>
                  <span className="font-medium">{(metrics?.avgEngagementRate || 0).toFixed(2)}%</span>
                </div>
                {metrics?.bestPerformingPost && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Best Performing Post</p>
                    <p className="text-sm line-clamp-2">
                      {metrics.bestPerformingPost.content || 'No caption'}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>❤️ {metrics.bestPerformingPost.likes_count?.toLocaleString()}</span>
                      <span>💬 {metrics.bestPerformingPost.comments_count?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scrape History</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs && jobs.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {jobs.map(job => (
                      <div 
                        key={job.id} 
                        className="flex items-center gap-3 p-2 rounded border"
                      >
                        <div className={`p-1.5 rounded ${PLATFORM_COLORS[job.platform]}`}>
                          {PLATFORM_ICONS[job.platform]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{job.scrape_type}</span>
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'default' : 
                                job.status === 'failed' ? 'destructive' : 
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {job.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {job.items_scraped} items • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {job.cost_cents > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ${(job.cost_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scrape history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}