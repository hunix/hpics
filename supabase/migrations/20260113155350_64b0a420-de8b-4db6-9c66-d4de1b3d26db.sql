-- Create integration_guides table for storing detailed documentation
CREATE TABLE public.integration_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Registration Info
  registration_url TEXT,
  registration_steps JSONB DEFAULT '[]'::jsonb,
  
  -- API Key Generation
  api_key_location TEXT,
  api_key_steps JSONB DEFAULT '[]'::jsonb,
  api_key_format TEXT,
  
  -- Pricing Info
  pricing_model TEXT,
  free_tier_limits TEXT,
  pricing_url TEXT,
  
  -- Usage in System
  usage_description TEXT,
  features_enabled JSONB DEFAULT '[]'::jsonb,
  
  -- Testing
  test_endpoint TEXT,
  test_method TEXT DEFAULT 'GET',
  test_headers JSONB DEFAULT '{}'::jsonb,
  expected_response TEXT,
  
  -- Troubleshooting
  common_errors JSONB DEFAULT '[]'::jsonb,
  support_url TEXT,
  documentation_url TEXT,
  
  -- Metadata
  requires_oauth BOOLEAN DEFAULT false,
  has_connector BOOLEAN DEFAULT false,
  difficulty_level TEXT DEFAULT 'easy',
  estimated_setup_time TEXT DEFAULT '5 minutes',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_guides ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (guides are public documentation)
CREATE POLICY "Integration guides are publicly readable"
ON public.integration_guides
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_integration_guides_updated_at
BEFORE UPDATE ON public.integration_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all integration guides
INSERT INTO public.integration_guides (
  integration_id, display_name, category, registration_url, registration_steps,
  api_key_location, api_key_steps, api_key_format, pricing_model, free_tier_limits,
  pricing_url, usage_description, features_enabled, test_endpoint, test_method,
  expected_response, common_errors, support_url, documentation_url,
  requires_oauth, has_connector, difficulty_level, estimated_setup_time
) VALUES
-- People Data Labs
(
  'peopledatalabs',
  'People Data Labs',
  'people-intelligence',
  'https://www.peopledatalabs.com/signup',
  '[
    {"step": 1, "title": "Go to People Data Labs", "description": "Visit peopledatalabs.com and click \"Start Free\" or \"Get API Key\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with your email or use Google SSO for faster registration"},
    {"step": 3, "title": "Verify Email", "description": "Check your inbox and click the verification link"},
    {"step": 4, "title": "Complete Profile", "description": "Fill out the company information form (required for API access)"},
    {"step": 5, "title": "Access Dashboard", "description": "Once verified, you''ll be redirected to your dashboard"}
  ]'::jsonb,
  'Dashboard → API Keys section in left sidebar',
  '[
    {"step": 1, "title": "Open Dashboard", "description": "Log into your PDL account and go to the main dashboard"},
    {"step": 2, "title": "Navigate to API Keys", "description": "Click \"API Keys\" in the left navigation menu"},
    {"step": 3, "title": "Copy Your Key", "description": "Your API key is displayed on this page. It starts with \"v5_...\""},
    {"step": 4, "title": "Keep It Safe", "description": "Store your key securely - treat it like a password"}
  ]'::jsonb,
  'v5_xxxxxxxxxxxxxxxxxxxxxxxx',
  'pay-as-you-go',
  '100 free API calls per month (no credit card required)',
  'https://www.peopledatalabs.com/pricing',
  'Enriches contact profiles with professional data, company info, social profiles, and employment history',
  '["Contact enrichment", "Company lookup", "Professional data", "Social profiles", "Employment history"]'::jsonb,
  'https://api.peopledatalabs.com/v5/person/enrich',
  'GET',
  'Returns person data or "no match found" - both indicate valid key',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Double-check your API key is copied correctly"},
    {"error": "402 Payment Required", "cause": "Free tier exhausted", "solution": "Upgrade to paid plan or wait for monthly reset"},
    {"error": "429 Rate Limited", "cause": "Too many requests", "solution": "Slow down requests or upgrade plan"}
  ]'::jsonb,
  'https://www.peopledatalabs.com/contact',
  'https://docs.peopledatalabs.com/',
  false,
  false,
  'easy',
  '5 minutes'
),
-- Proxycurl
(
  'proxycurl',
  'Proxycurl',
  'people-intelligence',
  'https://nubela.co/proxycurl/signup',
  '[
    {"step": 1, "title": "Go to Proxycurl", "description": "Visit nubela.co/proxycurl and click \"Sign Up\""},
    {"step": 2, "title": "Create Account", "description": "Enter your email and create a password"},
    {"step": 3, "title": "Verify Email", "description": "Check your inbox for the verification email"},
    {"step": 4, "title": "Get Free Credits", "description": "Upon verification, you automatically receive 10 free credits"}
  ]'::jsonb,
  'Dashboard main page',
  '[
    {"step": 1, "title": "Log In", "description": "Sign into your Proxycurl dashboard"},
    {"step": 2, "title": "Find API Key", "description": "Your API key is displayed on the main dashboard page"},
    {"step": 3, "title": "Copy Key", "description": "Click the copy button next to your API key"}
  ]'::jsonb,
  'Bearer token format',
  'credit-based',
  '10 free credits on signup (1 credit = 1 LinkedIn profile lookup)',
  'https://nubela.co/proxycurl/pricing',
  'Scrapes LinkedIn profiles for detailed professional information, work history, skills, and connections',
  '["LinkedIn profile scraping", "Company data", "Job listings", "Professional network analysis"]'::jsonb,
  'https://nubela.co/proxycurl/api/credit-balance',
  'GET',
  'Returns your current credit balance - confirms key is valid',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid or missing API key", "solution": "Add Bearer prefix: \"Authorization: Bearer YOUR_KEY\""},
    {"error": "403 Forbidden", "cause": "No credits remaining", "solution": "Purchase more credits at nubela.co/proxycurl"},
    {"error": "404 Not Found", "cause": "LinkedIn URL not found", "solution": "Verify the LinkedIn profile URL is correct and public"}
  ]'::jsonb,
  'https://nubela.co/proxycurl/support',
  'https://nubela.co/proxycurl/docs',
  false,
  false,
  'easy',
  '3 minutes'
),
-- Hunter.io
(
  'hunter',
  'Hunter.io',
  'people-intelligence',
  'https://hunter.io/users/sign_up',
  '[
    {"step": 1, "title": "Go to Hunter.io", "description": "Visit hunter.io and click \"Sign up free\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with email or connect via Google"},
    {"step": 3, "title": "Verify Email", "description": "Click the verification link sent to your email"},
    {"step": 4, "title": "Free Plan Active", "description": "Your free plan is immediately active with 25 monthly searches"}
  ]'::jsonb,
  'Click avatar → API',
  '[
    {"step": 1, "title": "Access Settings", "description": "Click your profile avatar in the top right corner"},
    {"step": 2, "title": "Go to API", "description": "Select \"API\" from the dropdown menu"},
    {"step": 3, "title": "Copy API Key", "description": "Your API key is displayed on this page - copy it"}
  ]'::jsonb,
  'Standard alphanumeric key',
  'freemium',
  '25 searches + 50 email verifications per month',
  'https://hunter.io/pricing',
  'Finds and verifies professional email addresses for contacts and companies',
  '["Email finder", "Email verification", "Domain search", "Company email patterns"]'::jsonb,
  'https://api.hunter.io/v2/account',
  'GET',
  'Returns account info including remaining quota',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Regenerate your API key from the dashboard"},
    {"error": "429 Too Many Requests", "cause": "Rate limit exceeded", "solution": "Wait a few seconds between requests"},
    {"error": "Usage Limit", "cause": "Monthly quota exhausted", "solution": "Upgrade plan or wait for monthly reset"}
  ]'::jsonb,
  'https://hunter.io/support',
  'https://hunter.io/api-documentation',
  false,
  false,
  'easy',
  '3 minutes'
),
-- RapidAPI
(
  'rapidapi',
  'RapidAPI Hub',
  'social-media',
  'https://rapidapi.com/auth/sign-up',
  '[
    {"step": 1, "title": "Go to RapidAPI", "description": "Visit rapidapi.com and click \"Sign Up\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with email, Google, or GitHub"},
    {"step": 3, "title": "Browse APIs", "description": "Search for APIs you need (Instagram, Twitter, TikTok, etc.)"},
    {"step": 4, "title": "Subscribe to APIs", "description": "Click \"Subscribe\" on each API you want to use (many have free tiers)"},
    {"step": 5, "title": "Test in Playground", "description": "Use the built-in playground to test API calls"}
  ]'::jsonb,
  'Any subscribed API page → Header Parameters section',
  '[
    {"step": 1, "title": "Go to Any API", "description": "Navigate to any API you''ve subscribed to"},
    {"step": 2, "title": "Find Headers Section", "description": "Look at the \"Header Parameters\" panel on the right"},
    {"step": 3, "title": "Copy X-RapidAPI-Key", "description": "Copy the value next to \"X-RapidAPI-Key\""},
    {"step": 4, "title": "One Key for All", "description": "This same key works for ALL your subscribed APIs"}
  ]'::jsonb,
  'Long alphanumeric string',
  'varies',
  'Varies by API - most have free tiers (100-1000 requests/month)',
  'https://rapidapi.com/hub',
  'Gateway to thousands of APIs including social media scrapers, data enrichment, and more',
  '["Instagram scraping", "Twitter/X data", "TikTok analytics", "Social media APIs", "Data enrichment"]'::jsonb,
  'https://rapidapi.com/api/status',
  'GET',
  'Returns 200 OK if key is valid',
  '[
    {"error": "403 Forbidden", "cause": "Not subscribed to this API", "solution": "Subscribe to the specific API on RapidAPI first"},
    {"error": "429 Rate Limited", "cause": "Exceeded rate limit", "solution": "Upgrade subscription tier"},
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Copy key from RapidAPI dashboard again"}
  ]'::jsonb,
  'https://rapidapi.com/support',
  'https://docs.rapidapi.com/',
  false,
  false,
  'medium',
  '10 minutes'
),
-- Tavily
(
  'tavily',
  'Tavily AI Search',
  'research',
  'https://tavily.com/#api',
  '[
    {"step": 1, "title": "Go to Tavily", "description": "Visit tavily.com and click \"Get API Key\" or \"Start Building\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with your email address"},
    {"step": 3, "title": "Verify Email", "description": "Click the verification link in your email"},
    {"step": 4, "title": "Access Dashboard", "description": "Log in to see your dashboard and API key"}
  ]'::jsonb,
  'Main dashboard page after login',
  '[
    {"step": 1, "title": "Log In", "description": "Sign into your Tavily account"},
    {"step": 2, "title": "View Dashboard", "description": "Your API key is displayed on the main dashboard"},
    {"step": 3, "title": "Copy Key", "description": "Click to copy your API key"}
  ]'::jsonb,
  'tvly-xxxxxxxxxxxxxxxx',
  'freemium',
  '1,000 free API calls per month',
  'https://tavily.com/pricing',
  'AI-powered web search optimized for LLM applications, returns clean structured data',
  '["AI web search", "Research automation", "Clean data extraction", "LLM-optimized results"]'::jsonb,
  'https://api.tavily.com/search',
  'POST',
  'Returns search results array - confirms key works',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Check your API key from the dashboard"},
    {"error": "429 Rate Limited", "cause": "Too many requests", "solution": "Implement request throttling"},
    {"error": "Quota Exceeded", "cause": "Monthly limit reached", "solution": "Upgrade to paid plan"}
  ]'::jsonb,
  'https://tavily.com/contact',
  'https://docs.tavily.com/',
  false,
  false,
  'easy',
  '3 minutes'
),
-- News API
(
  'newsapi',
  'News API',
  'research',
  'https://newsapi.org/register',
  '[
    {"step": 1, "title": "Go to News API", "description": "Visit newsapi.org and click \"Get API Key\""},
    {"step": 2, "title": "Fill Registration", "description": "Enter your name, email, and select \"Developer\" plan"},
    {"step": 3, "title": "Describe Use Case", "description": "Briefly describe how you''ll use the API"},
    {"step": 4, "title": "Get Key Instantly", "description": "Your API key is shown immediately and emailed to you"}
  ]'::jsonb,
  'Registration confirmation page and email',
  '[
    {"step": 1, "title": "Register", "description": "Complete the registration form"},
    {"step": 2, "title": "View Key", "description": "API key is displayed on confirmation page"},
    {"step": 3, "title": "Check Email", "description": "Key is also sent to your email for safekeeping"}
  ]'::jsonb,
  '32-character hexadecimal',
  'freemium',
  '100 requests per day (development/localhost only)',
  'https://newsapi.org/pricing',
  'Access to news articles from 150,000+ sources worldwide, searchable by topic, source, or date',
  '["News search", "Top headlines", "Source filtering", "Historical articles", "Topic monitoring"]'::jsonb,
  'https://newsapi.org/v2/top-headlines',
  'GET',
  'Returns array of articles - confirms key is valid',
  '[
    {"error": "401 Unauthorized", "cause": "Missing or invalid API key", "solution": "Add apiKey parameter to request"},
    {"error": "426 Upgrade Required", "cause": "Free tier only works on localhost", "solution": "Production requires paid Business/Enterprise plan"},
    {"error": "429 Rate Limited", "cause": "Daily limit exceeded", "solution": "Wait 24 hours or upgrade plan"}
  ]'::jsonb,
  'https://newsapi.org/support',
  'https://newsapi.org/docs',
  false,
  false,
  'easy',
  '2 minutes'
),
-- Google Custom Search
(
  'google-search',
  'Google Custom Search',
  'research',
  'https://console.cloud.google.com/',
  '[
    {"step": 1, "title": "Go to Google Cloud Console", "description": "Visit console.cloud.google.com and sign in with Google"},
    {"step": 2, "title": "Create Project", "description": "Click \"Select a project\" → \"New Project\" → Name it and create"},
    {"step": 3, "title": "Enable API", "description": "Go to \"APIs & Services\" → \"Library\" → Search \"Custom Search API\" → Enable"},
    {"step": 4, "title": "Create Credentials", "description": "Go to \"Credentials\" → \"Create Credentials\" → \"API Key\""},
    {"step": 5, "title": "Create Search Engine", "description": "Go to programmablesearchengine.google.com → Create engine → Get CX ID"}
  ]'::jsonb,
  'Google Cloud Console → Credentials',
  '[
    {"step": 1, "title": "Open Credentials", "description": "In Cloud Console, go to APIs & Services → Credentials"},
    {"step": 2, "title": "Create API Key", "description": "Click \"Create Credentials\" → \"API Key\""},
    {"step": 3, "title": "Copy Key", "description": "Copy the generated API key"},
    {"step": 4, "title": "Get CX ID", "description": "Go to Programmable Search Engine console, copy your Search Engine ID (cx)"}
  ]'::jsonb,
  'API Key: AIza... / CX: 017576662512468239146:...',
  'freemium',
  '100 search queries per day free',
  'https://developers.google.com/custom-search/v1/overview#pricing',
  'Official Google Search results with custom configuration, ideal for web research',
  '["Google search", "Web research", "Custom search engine", "Structured results"]'::jsonb,
  'https://www.googleapis.com/customsearch/v1',
  'GET',
  'Returns search results with items array',
  '[
    {"error": "403 Daily Limit Exceeded", "cause": "100 query daily limit reached", "solution": "Wait 24 hours or enable billing"},
    {"error": "400 Invalid Value", "cause": "CX ID is incorrect", "solution": "Verify Search Engine ID from programmablesearchengine.google.com"},
    {"error": "403 API Not Enabled", "cause": "Custom Search API not enabled", "solution": "Enable it in Cloud Console → APIs & Services → Library"}
  ]'::jsonb,
  'https://support.google.com/programmable-search/',
  'https://developers.google.com/custom-search/v1/introduction',
  false,
  false,
  'medium',
  '15 minutes'
),
-- Resend
(
  'resend',
  'Resend Email',
  'communication',
  'https://resend.com/signup',
  '[
    {"step": 1, "title": "Go to Resend", "description": "Visit resend.com and click \"Get Started\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with GitHub or email"},
    {"step": 3, "title": "Verify Domain (Optional)", "description": "Add and verify your domain for production emails, or use their test domain"},
    {"step": 4, "title": "Access Dashboard", "description": "You''re ready to create API keys"}
  ]'::jsonb,
  'Dashboard → API Keys',
  '[
    {"step": 1, "title": "Go to API Keys", "description": "In dashboard, click \"API Keys\" in the sidebar"},
    {"step": 2, "title": "Create New Key", "description": "Click \"Create API Key\""},
    {"step": 3, "title": "Name Your Key", "description": "Give it a descriptive name and set permissions"},
    {"step": 4, "title": "Copy Immediately", "description": "⚠️ Copy your key NOW - it''s only shown once!"}
  ]'::jsonb,
  're_xxxxxxxxxxxxxxxxxxxxxxxx',
  'freemium',
  '3,000 emails/month, 100 emails/day',
  'https://resend.com/pricing',
  'Modern email API for sending transactional emails with high deliverability',
  '["Email sending", "Transactional emails", "Email templates", "Delivery tracking"]'::jsonb,
  'https://api.resend.com/domains',
  'GET',
  'Returns list of domains - confirms key is valid',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Generate a new API key from dashboard"},
    {"error": "403 Forbidden", "cause": "Domain not verified", "solution": "Add and verify your sending domain"},
    {"error": "422 Validation Error", "cause": "Invalid email format", "solution": "Check recipient email address format"}
  ]'::jsonb,
  'https://resend.com/support',
  'https://resend.com/docs',
  false,
  false,
  'easy',
  '5 minutes'
),
-- Diffbot
(
  'diffbot',
  'Diffbot',
  'research',
  'https://app.diffbot.com/register',
  '[
    {"step": 1, "title": "Go to Diffbot", "description": "Visit diffbot.com and click \"Start Free Trial\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with your email address"},
    {"step": 3, "title": "Verify Email", "description": "Click verification link in your email"},
    {"step": 4, "title": "Start Trial", "description": "You get 14 days of free access to all features"}
  ]'::jsonb,
  'Dashboard main page',
  '[
    {"step": 1, "title": "Log In", "description": "Sign into your Diffbot dashboard"},
    {"step": 2, "title": "Find Token", "description": "Your API token is displayed on the main dashboard"},
    {"step": 3, "title": "Copy Token", "description": "Copy your token for use in the system"}
  ]'::jsonb,
  '32-character token',
  'trial-then-paid',
  '14-day free trial with full access',
  'https://www.diffbot.com/pricing/',
  'AI-powered web scraping that extracts structured data from any webpage',
  '["Web scraping", "Article extraction", "Product data", "Knowledge graph", "Entity extraction"]'::jsonb,
  'https://api.diffbot.com/v3/analyze',
  'GET',
  'Returns extracted data from URL',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid token", "solution": "Check token from dashboard"},
    {"error": "429 Rate Limited", "cause": "Too many requests", "solution": "Slow down request frequency"},
    {"error": "Trial Expired", "cause": "14-day trial ended", "solution": "Upgrade to paid plan"}
  ]'::jsonb,
  'https://www.diffbot.com/support/',
  'https://docs.diffbot.com/',
  false,
  false,
  'easy',
  '5 minutes'
),
-- Gmail OAuth
(
  'gmail-oauth',
  'Gmail OAuth',
  'communication',
  'https://console.cloud.google.com/',
  '[
    {"step": 1, "title": "Go to Google Cloud Console", "description": "Visit console.cloud.google.com and sign in"},
    {"step": 2, "title": "Create/Select Project", "description": "Create a new project or select existing one"},
    {"step": 3, "title": "Configure OAuth Consent", "description": "Go to \"OAuth consent screen\" → Configure for External or Internal users"},
    {"step": 4, "title": "Add Scopes", "description": "Add Gmail API scopes: gmail.readonly, gmail.send, gmail.modify"},
    {"step": 5, "title": "Enable Gmail API", "description": "Go to Library → Search \"Gmail API\" → Enable"},
    {"step": 6, "title": "Create OAuth Credentials", "description": "Credentials → Create → OAuth client ID → Web application"}
  ]'::jsonb,
  'Google Cloud Console → Credentials → OAuth 2.0 Client IDs',
  '[
    {"step": 1, "title": "Go to Credentials", "description": "In Cloud Console, navigate to APIs & Services → Credentials"},
    {"step": 2, "title": "Create OAuth Client", "description": "Click \"Create Credentials\" → \"OAuth client ID\""},
    {"step": 3, "title": "Configure Client", "description": "Select \"Web application\", add authorized redirect URIs"},
    {"step": 4, "title": "Copy Credentials", "description": "Copy both Client ID and Client Secret"}
  ]'::jsonb,
  'Client ID: xxxxx.apps.googleusercontent.com / Secret: GOCSPX-xxxxx',
  'free',
  'Free - OAuth is a protocol, no usage limits from Google for auth',
  'https://developers.google.com/gmail/api/guides',
  'Read and send emails through Gmail using OAuth authentication',
  '["Email reading", "Email sending", "Gmail integration", "Email automation"]'::jsonb,
  'https://www.googleapis.com/oauth2/v3/tokeninfo',
  'GET',
  'Returns token info if valid',
  '[
    {"error": "redirect_uri_mismatch", "cause": "Callback URL not registered", "solution": "Add your app''s callback URL to authorized redirect URIs"},
    {"error": "access_denied", "cause": "User denied permission", "solution": "Request only necessary scopes"},
    {"error": "invalid_client", "cause": "Wrong client ID/secret", "solution": "Double-check credentials from Cloud Console"}
  ]'::jsonb,
  'https://support.google.com/cloud/',
  'https://developers.google.com/gmail/api/reference/rest',
  true,
  false,
  'hard',
  '20 minutes'
),
-- Google Calendar OAuth
(
  'google-calendar-oauth',
  'Google Calendar OAuth',
  'communication',
  'https://console.cloud.google.com/',
  '[
    {"step": 1, "title": "Go to Google Cloud Console", "description": "Visit console.cloud.google.com and sign in"},
    {"step": 2, "title": "Use Existing or Create Project", "description": "Use same project as Gmail or create new"},
    {"step": 3, "title": "Enable Calendar API", "description": "Go to Library → Search \"Google Calendar API\" → Enable"},
    {"step": 4, "title": "Add Calendar Scopes", "description": "In OAuth consent, add calendar.readonly, calendar.events scopes"},
    {"step": 5, "title": "Use Existing OAuth Client", "description": "You can use the same OAuth client as Gmail"}
  ]'::jsonb,
  'Same as Gmail OAuth credentials',
  '[
    {"step": 1, "title": "Enable Calendar API", "description": "In your Google Cloud project, enable Calendar API"},
    {"step": 2, "title": "Add Scopes", "description": "Add Calendar scopes to your OAuth consent screen"},
    {"step": 3, "title": "Use Same Credentials", "description": "Use the same Client ID/Secret as Gmail OAuth"}
  ]'::jsonb,
  'Same as Gmail OAuth',
  'free',
  'Free - No usage limits for OAuth authentication',
  'https://developers.google.com/calendar/api/guides/overview',
  'Read and manage calendar events, sync meetings, and schedule interactions',
  '["Calendar sync", "Event management", "Meeting scheduling", "Availability checking"]'::jsonb,
  'https://www.googleapis.com/calendar/v3/users/me/calendarList',
  'GET',
  'Returns list of calendars if authenticated',
  '[
    {"error": "insufficient_scope", "cause": "Calendar scope not granted", "solution": "Re-authenticate with calendar scopes"},
    {"error": "notFound", "cause": "Calendar not accessible", "solution": "Check calendar permissions"}
  ]'::jsonb,
  'https://support.google.com/calendar/',
  'https://developers.google.com/calendar/api/reference/rest',
  true,
  false,
  'medium',
  '10 minutes'
),
-- VAPID Keys
(
  'vapid',
  'VAPID Push Notifications',
  'communication',
  'N/A - Generated locally',
  '[
    {"step": 1, "title": "Install web-push", "description": "Run: npm install web-push -g (or use online generator)"},
    {"step": 2, "title": "Generate Keys", "description": "Run: web-push generate-vapid-keys"},
    {"step": 3, "title": "Save Both Keys", "description": "You''ll get a Public Key and Private Key - save both"},
    {"step": 4, "title": "Alternative: Online Generator", "description": "Use web-push-codelab.glitch.me to generate keys"}
  ]'::jsonb,
  'Generated in terminal or online tool',
  '[
    {"step": 1, "title": "Open Terminal", "description": "Open your command line / terminal"},
    {"step": 2, "title": "Run Generator", "description": "npx web-push generate-vapid-keys"},
    {"step": 3, "title": "Copy Public Key", "description": "Copy the Public Key for VAPID_PUBLIC_KEY"},
    {"step": 4, "title": "Copy Private Key", "description": "Copy the Private Key for VAPID_PRIVATE_KEY"}
  ]'::jsonb,
  'Base64 encoded strings (65+ characters)',
  'free',
  'Free - VAPID is an open standard with no usage fees',
  'https://web.dev/push-notifications-overview/',
  'Enable browser push notifications to alert users of important updates',
  '["Push notifications", "Browser alerts", "User engagement", "Real-time updates"]'::jsonb,
  'N/A',
  'N/A',
  'Keys are validated during push subscription',
  '[
    {"error": "InvalidKey", "cause": "Malformed VAPID key", "solution": "Regenerate keys using web-push tool"},
    {"error": "Push failed", "cause": "Private key mismatch", "solution": "Ensure public/private keys are from same generation"}
  ]'::jsonb,
  'https://web.dev/push-notifications-overview/',
  'https://developers.google.com/web/fundamentals/push-notifications',
  false,
  false,
  'medium',
  '5 minutes'
),
-- Perplexity
(
  'perplexity',
  'Perplexity AI',
  'ai-research',
  'https://www.perplexity.ai/',
  '[
    {"step": 1, "title": "Go to Perplexity", "description": "Visit perplexity.ai and sign in or create account"},
    {"step": 2, "title": "Access API Settings", "description": "Click your profile → Settings → API"},
    {"step": 3, "title": "Generate API Key", "description": "Create a new API key for programmatic access"}
  ]'::jsonb,
  'Settings → API section',
  '[
    {"step": 1, "title": "Open Settings", "description": "Click your profile icon, then Settings"},
    {"step": 2, "title": "Go to API", "description": "Navigate to the API section"},
    {"step": 3, "title": "Create Key", "description": "Generate and copy your API key"}
  ]'::jsonb,
  'pplx-xxxxxxxxxxxxxxxx',
  'pay-as-you-go',
  'API access requires payment - no free tier for API',
  'https://www.perplexity.ai/settings/api',
  'AI-powered research assistant for deep web research and analysis',
  '["AI research", "Web analysis", "Question answering", "Source citations"]'::jsonb,
  'https://api.perplexity.ai/chat/completions',
  'POST',
  'Returns AI response with sources',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Check key in Perplexity settings"},
    {"error": "402 Payment Required", "cause": "No credits", "solution": "Add payment method to Perplexity account"},
    {"error": "429 Rate Limited", "cause": "Too many requests", "solution": "Implement request throttling"}
  ]'::jsonb,
  'https://www.perplexity.ai/support',
  'https://docs.perplexity.ai/',
  false,
  true,
  'easy',
  '5 minutes'
),
-- Firecrawl
(
  'firecrawl',
  'Firecrawl',
  'research',
  'https://www.firecrawl.dev/',
  '[
    {"step": 1, "title": "Go to Firecrawl", "description": "Visit firecrawl.dev and click \"Get Started\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with GitHub or email"},
    {"step": 3, "title": "Verify Email", "description": "Complete email verification"},
    {"step": 4, "title": "Access Dashboard", "description": "You get 500 free credits to start"}
  ]'::jsonb,
  'Dashboard → API Keys',
  '[
    {"step": 1, "title": "Go to Dashboard", "description": "Log into your Firecrawl dashboard"},
    {"step": 2, "title": "Find API Key", "description": "Your API key is displayed in the dashboard"},
    {"step": 3, "title": "Copy Key", "description": "Copy the API key for use"}
  ]'::jsonb,
  'fc-xxxxxxxxxxxxxxxx',
  'freemium',
  '500 free credits per month',
  'https://www.firecrawl.dev/pricing',
  'Converts websites to clean LLM-ready markdown for AI processing',
  '["Web scraping", "Markdown conversion", "LLM preprocessing", "Clean data extraction"]'::jsonb,
  'https://api.firecrawl.dev/v1/scrape',
  'POST',
  'Returns scraped content in markdown',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Check key from dashboard"},
    {"error": "402 Credits Exhausted", "cause": "No credits remaining", "solution": "Purchase more credits"},
    {"error": "500 Scrape Failed", "cause": "Website blocking", "solution": "Try different URL or contact support"}
  ]'::jsonb,
  'https://www.firecrawl.dev/support',
  'https://docs.firecrawl.dev/',
  false,
  true,
  'easy',
  '5 minutes'
),
-- ElevenLabs
(
  'elevenlabs',
  'ElevenLabs Voice AI',
  'ai-voice',
  'https://elevenlabs.io/',
  '[
    {"step": 1, "title": "Go to ElevenLabs", "description": "Visit elevenlabs.io and click \"Sign Up\""},
    {"step": 2, "title": "Create Account", "description": "Sign up with Google or email"},
    {"step": 3, "title": "Verify Email", "description": "Complete email verification"},
    {"step": 4, "title": "Free Tier Active", "description": "You get 10,000 characters per month free"}
  ]'::jsonb,
  'Profile → API Key',
  '[
    {"step": 1, "title": "Click Profile", "description": "Click your profile icon in the top right"},
    {"step": 2, "title": "Find API Key", "description": "Look for \"API Key\" section or \"Profile\" settings"},
    {"step": 3, "title": "Generate/Copy Key", "description": "Generate a new key or copy existing one"}
  ]'::jsonb,
  'sk_xxxxxxxxxxxxxxxxxxxxxxxx',
  'freemium',
  '10,000 characters per month free',
  'https://elevenlabs.io/pricing',
  'Ultra-realistic AI voice synthesis for audio content creation',
  '["Voice synthesis", "Text-to-speech", "Voice cloning", "Audio generation"]'::jsonb,
  'https://api.elevenlabs.io/v1/user',
  'GET',
  'Returns user info including character quota',
  '[
    {"error": "401 Unauthorized", "cause": "Invalid API key", "solution": "Regenerate key from profile settings"},
    {"error": "Character Limit", "cause": "Monthly quota exceeded", "solution": "Upgrade plan or wait for reset"}
  ]'::jsonb,
  'https://elevenlabs.io/contact',
  'https://docs.elevenlabs.io/',
  false,
  true,
  'easy',
  '5 minutes'
);