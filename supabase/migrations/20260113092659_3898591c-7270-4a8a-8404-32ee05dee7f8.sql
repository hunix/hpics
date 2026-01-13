-- Phase 3: Complete Social Data Schema

-- Table for individual posts/tweets/videos
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_id TEXT NOT NULL,
  post_url TEXT,
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  media_type TEXT, -- 'image', 'video', 'carousel', 'reel', 'story'
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  posted_at TIMESTAMPTZ,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  location TEXT,
  caption TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_sponsored BOOLEAN DEFAULT false,
  engagement_rate NUMERIC(5,2),
  sentiment_score NUMERIC(3,2),
  raw_data JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, post_id, user_id)
);

-- Table for comments on posts
CREATE TABLE IF NOT EXISTS public.social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  comment_id TEXT,
  author_username TEXT,
  author_display_name TEXT,
  author_profile_url TEXT,
  author_avatar_url TEXT,
  content TEXT,
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  replied_to_id UUID REFERENCES public.social_comments(id),
  is_verified BOOLEAN DEFAULT false,
  sentiment_score NUMERIC(3,2),
  commented_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for followers/following/connections
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- 'follower', 'following', 'mutual', 'friend'
  connected_username TEXT NOT NULL,
  connected_user_id TEXT,
  connected_profile_url TEXT,
  connected_display_name TEXT,
  connected_avatar_url TEXT,
  connected_bio TEXT,
  connected_followers_count INT,
  connected_verified BOOLEAN DEFAULT false,
  relationship_strength NUMERIC(3,2), -- calculated based on interactions
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, platform, connection_type, connected_username)
);

-- Table for who liked specific posts
CREATE TABLE IF NOT EXISTS public.social_likers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  liker_username TEXT NOT NULL,
  liker_user_id TEXT,
  liker_profile_url TEXT,
  liker_display_name TEXT,
  liker_avatar_url TEXT,
  liker_verified BOOLEAN DEFAULT false,
  liked_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, liker_username)
);

-- Table for scraping jobs and history
CREATE TABLE IF NOT EXISTS public.social_scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  scrape_type TEXT NOT NULL, -- 'full', 'posts', 'comments', 'followers', 'following', 'likers'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  provider TEXT, -- 'firecrawl', 'apify', 'rapidapi', 'extension'
  items_scraped INT DEFAULT 0,
  items_total INT,
  error_message TEXT,
  cost_cents INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT, -- 'hourly', 'daily', 'weekly'
  last_cursor TEXT, -- for pagination/differential sync
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scrape_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_posts
CREATE POLICY "Users can view their own social posts"
  ON public.social_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social posts"
  ON public.social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social posts"
  ON public.social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for social_comments
CREATE POLICY "Users can view their own social comments"
  ON public.social_comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social comments"
  ON public.social_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social comments"
  ON public.social_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social comments"
  ON public.social_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for social_connections
CREATE POLICY "Users can view their own social connections"
  ON public.social_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social connections"
  ON public.social_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social connections"
  ON public.social_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social connections"
  ON public.social_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for social_likers
CREATE POLICY "Users can view their own social likers"
  ON public.social_likers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social likers"
  ON public.social_likers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social likers"
  ON public.social_likers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social likers"
  ON public.social_likers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for social_scrape_jobs
CREATE POLICY "Users can view their own scrape jobs"
  ON public.social_scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scrape jobs"
  ON public.social_scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scrape jobs"
  ON public.social_scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scrape jobs"
  ON public.social_scrape_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_social_posts_profile ON public.social_posts(profile_id);
CREATE INDEX idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX idx_social_posts_posted_at ON public.social_posts(posted_at DESC);
CREATE INDEX idx_social_comments_post ON public.social_comments(post_id);
CREATE INDEX idx_social_connections_profile ON public.social_connections(profile_id);
CREATE INDEX idx_social_connections_platform ON public.social_connections(platform, connection_type);
CREATE INDEX idx_social_likers_post ON public.social_likers(post_id);
CREATE INDEX idx_social_scrape_jobs_profile ON public.social_scrape_jobs(profile_id);
CREATE INDEX idx_social_scrape_jobs_status ON public.social_scrape_jobs(status);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_scrape_jobs;