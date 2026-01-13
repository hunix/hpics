-- Add social media columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS linkedin_handle text,
ADD COLUMN IF NOT EXISTS tiktok_handle text,
ADD COLUMN IF NOT EXISTS instagram_followers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS twitter_followers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS linkedin_connections integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiktok_followers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_enriched_at timestamp with time zone;

-- Add indexes for social handles
CREATE INDEX IF NOT EXISTS idx_profiles_instagram_handle ON public.profiles(instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_twitter_handle ON public.profiles(twitter_handle) WHERE twitter_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_handle ON public.profiles(linkedin_handle) WHERE linkedin_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok_handle ON public.profiles(tiktok_handle) WHERE tiktok_handle IS NOT NULL;