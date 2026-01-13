import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Users, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  BarChart3,
  Globe,
  Clock,
  Zap,
  Hash,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

export default function SocialIntelligenceDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Define profile type for social intelligence
  type SocialProfile = {
    id: string;
    avatar_url: string | null;
    instagram_handle: string | null;
    twitter_handle: string | null;
    linkedin_handle: string | null;
    tiktok_handle: string | null;
    instagram_followers: number | null;
    twitter_followers: number | null;
    tiktok_followers: number | null;
    last_enriched_at: string | null;
  };

  // Fetch all profiles with social handles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles-with-social'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, instagram_handle, twitter_handle, linkedin_handle, tiktok_handle, instagram_followers, twitter_followers, tiktok_followers, last_enriched_at')
        .order('last_enriched_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      // Filter profiles that have at least one social handle
      return (data as SocialProfile[] || []).filter(p => 
        p.instagram_handle || p.twitter_handle || p.linkedin_handle || p.tiktok_handle
      );
    },
  });

  // Fetch recent scrape jobs
  const { data: recentJobs } = useQuery({
    queryKey: ['recent-scrape-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_scrape_jobs')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch aggregate stats
  const { data: stats } = useQuery({
    queryKey: ['social-stats'],
    queryFn: async () => {
      const [postsResult, connectionsResult, jobsResult] = await Promise.all([
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
        supabase.from('social_connections').select('id', { count: 'exact', head: true }),
        supabase.from('social_scrape_jobs').select('cost_cents').eq('status', 'completed'),
      ]);

      const totalCost = (jobsResult.data || []).reduce((sum, j) => sum + (j.cost_cents || 0), 0);

      return {
        totalPosts: postsResult.count || 0,
        totalConnections: connectionsResult.count || 0,
        totalCost: totalCost / 100,
        totalJobs: jobsResult.data?.length || 0,
      };
    },
  });

  // Scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async ({ profileId, platform, username }: { profileId: string; platform: string; username: string }) => {
      const { data, error } = await supabase.functions.invoke('scrape-comprehensive-social', {
        body: {
          profileId,
          platform,
          username,
          scrapeType: 'full',
          maxItems: 100,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scraped ${data.itemsScraped} items`);
      queryClient.invalidateQueries({ queryKey: ['recent-scrape-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
    },
    onError: (error: Error) => {
      toast.error('Scrape failed', { description: error.message });
    },
  });

  // Bulk scrape mutation
  const bulkScrapeMutation = useMutation({
    mutationFn: async () => {
      const tasks: Promise<unknown>[] = [];
      
      for (const profile of profiles || []) {
        if (profile.instagram_handle) {
          tasks.push(
            supabase.functions.invoke('scrape-social-rapidapi', {
              body: { profileId: profile.id, platform: 'all' },
            })
          );
        }
      }

      return Promise.allSettled(tasks);
    },
    onSuccess: (results) => {
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      toast.success(`Bulk scrape completed: ${succeeded}/${results.length} profiles`);
      queryClient.invalidateQueries({ queryKey: ['profiles-with-social'] });
    },
  });

  const filteredProfiles = profiles?.filter(p => 
    !searchQuery || 
    p.instagram_handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.twitter_handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runningJobs = recentJobs?.filter(j => j.status === 'running') || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Social Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze social media presence across all contacts
          </p>
        </div>
        <Button
          onClick={() => bulkScrapeMutation.mutate()}
          disabled={bulkScrapeMutation.isPending}
          className="gap-2"
        >
          {bulkScrapeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Posts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalPosts?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Connections</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalConnections?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scrape Jobs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalJobs || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Cost</span>
            </div>
            <p className="text-2xl font-bold mt-1">${stats?.totalCost?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Running Jobs Banner */}
      {runningJobs.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium">{runningJobs.length} scrape job(s) running</span>
              <div className="flex-1" />
              {runningJobs.slice(0, 3).map(job => (
                <Badge key={job.id} variant="outline" className="gap-1">
                  {PLATFORM_ICONS[job.platform]}
                  {job.items_scraped} items
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles">
            <Users className="h-4 w-4 mr-1" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-1" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-1" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tracked Profiles</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredProfiles?.map(profile => (
                      <div
                        key={profile.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="h-10 w-10 object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">@{profile.instagram_handle || profile.twitter_handle}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {profile.instagram_handle && (
                                <Badge variant="outline" className={PLATFORM_COLORS.instagram}>
                                  <Instagram className="h-3 w-3 mr-1" />
                                  @{profile.instagram_handle}
                                  {profile.instagram_followers && (
                                    <span className="ml-1 opacity-75">
                                      ({(profile.instagram_followers / 1000).toFixed(1)}k)
                                    </span>
                                  )}
                                </Badge>
                              )}
                              {profile.twitter_handle && (
                                <Badge variant="outline" className={PLATFORM_COLORS.twitter}>
                                  <Twitter className="h-3 w-3 mr-1" />
                                  @{profile.twitter_handle}
                                </Badge>
                              )}
                              {profile.linkedin_handle && (
                                <Badge variant="outline" className={PLATFORM_COLORS.linkedin}>
                                  <Linkedin className="h-3 w-3 mr-1" />
                                  {profile.linkedin_handle}
                                </Badge>
                              )}
                              {profile.tiktok_handle && (
                                <Badge variant="outline" className={PLATFORM_COLORS.tiktok}>
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  @{profile.tiktok_handle}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.last_enriched_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(profile.last_enriched_at), { addSuffix: true })}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const platform = profile.instagram_handle ? 'instagram' : 
                                               profile.twitter_handle ? 'twitter' : 'tiktok';
                                const username = profile.instagram_handle || profile.twitter_handle || profile.tiktok_handle;
                                if (username) {
                                  scrapeMutation.mutate({
                                    profileId: profile.id,
                                    platform,
                                    username,
                                  });
                                }
                              }}
                              disabled={scrapeMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Scrape Activity</CardTitle>
              <CardDescription>History of social media data collection</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentJobs?.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div className={`p-2 rounded-full ${PLATFORM_COLORS[job.platform] || 'bg-muted'}`}>
                        {PLATFORM_ICONS[job.platform] || <Globe className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{job.platform}</p>
                          <Badge variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'running' ? 'secondary' :
                            job.status === 'failed' ? 'destructive' : 'outline'
                          } className="text-xs">
                            {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {job.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.scrape_type} • {job.items_scraped || 0} items
                          {job.cost_cents > 0 && ` • $${(job.cost_cents / 100).toFixed(3)}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Top Engaged Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Run scrapes to see engagement insights
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Most Followed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {profiles
                      ?.filter(p => p.instagram_followers || p.twitter_followers)
                      .sort((a, b) => 
                        (b.instagram_followers || 0) + (b.twitter_followers || 0) - 
                        (a.instagram_followers || 0) - (a.twitter_followers || 0)
                      )
                      .slice(0, 10)
                      .map(profile => (
                        <div key={profile.id} className="flex items-center gap-2">
                          <span className="font-medium truncate flex-1">@{profile.instagram_handle || profile.twitter_handle}</span>
                          <Badge variant="secondary">
                            {((profile.instagram_followers || 0) + (profile.twitter_followers || 0)).toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Platform Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {['instagram', 'twitter', 'linkedin', 'tiktok'].map(platform => {
                    const count = profiles?.filter(p => 
                      (platform === 'instagram' && p.instagram_handle) ||
                      (platform === 'twitter' && p.twitter_handle) ||
                      (platform === 'linkedin' && p.linkedin_handle) ||
                      (platform === 'tiktok' && p.tiktok_handle)
                    ).length || 0;

                    return (
                      <div key={platform} className={`flex items-center gap-2 p-3 rounded-lg border ${PLATFORM_COLORS[platform]}`}>
                        {PLATFORM_ICONS[platform]}
                        <span className="capitalize font-medium">{platform}</span>
                        <Badge variant="secondary">{count} profiles</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
