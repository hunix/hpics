-- Add AI model tier and provider preference columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS ai_model_tier text DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS preferred_ai_provider text DEFAULT 'google';

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.ai_model_tier IS 'User preferred AI model tier: speed, balanced, quality, or nextgen';
COMMENT ON COLUMN public.user_preferences.preferred_ai_provider IS 'User preferred AI provider: google or openai';