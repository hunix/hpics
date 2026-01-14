-- =============================================
-- ECONOMIC INTELLIGENCE CONTROL CENTER SCHEMA
-- Phase 1: Multi-Source News Intelligence & Investment Prediction
-- =============================================

-- 1. News Intelligence Items - Raw news from multiple sources
CREATE TABLE public.news_intelligence_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_name TEXT NOT NULL, -- NewsAPI, Tavily, Reuters, Bloomberg, etc.
  source_url TEXT,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Entities and classification
  entities JSONB DEFAULT '[]'::jsonb, -- companies, people, locations, etc.
  sectors TEXT[] DEFAULT '{}', -- affected sectors
  regions TEXT[] DEFAULT '{}', -- affected regions
  topics TEXT[] DEFAULT '{}', -- war, politics, economy, etc.
  tickers TEXT[] DEFAULT '{}', -- stock tickers mentioned
  
  -- Sentiment analysis
  sentiment_score NUMERIC(4,3), -- -1 to +1
  sentiment_label TEXT, -- positive, negative, neutral
  sentiment_confidence NUMERIC(4,3),
  
  -- Credibility and importance
  source_credibility_score NUMERIC(4,3), -- 0 to 1
  impact_score NUMERIC(4,3), -- 0 to 1 (market impact potential)
  urgency_level TEXT DEFAULT 'normal', -- critical, high, normal, low
  
  -- Processing metadata
  raw_response JSONB,
  processing_status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  embedding TEXT, -- for semantic search
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. News Correlations - Cross-source validation
CREATE TABLE public.news_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_hash TEXT NOT NULL, -- hash of normalized topic for grouping
  topic_summary TEXT NOT NULL,
  
  -- Correlated news items
  news_item_ids UUID[] NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 1,
  sources TEXT[] NOT NULL,
  
  -- Confidence scoring
  correlation_confidence NUMERIC(4,3) NOT NULL, -- higher with more sources
  narrative_consistency NUMERIC(4,3), -- do sources agree?
  conflicting_claims JSONB DEFAULT '[]'::jsonb,
  
  -- Derived intelligence
  consensus_sentiment NUMERIC(4,3),
  combined_impact_score NUMERIC(4,3),
  validated_facts JSONB DEFAULT '[]'::jsonb,
  disputed_claims JSONB DEFAULT '[]'::jsonb,
  
  first_reported_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. News Signals - Derived trading/investment signals
CREATE TABLE public.news_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  correlation_id UUID REFERENCES public.news_correlations(id),
  
  -- Signal details
  signal_type TEXT NOT NULL, -- buy, sell, hold, watch, avoid
  asset_class TEXT NOT NULL, -- stocks, crypto, commodities, forex, bonds
  asset_identifier TEXT, -- ticker, crypto symbol, commodity name
  sector TEXT,
  
  -- Strength and confidence
  signal_strength NUMERIC(4,3) NOT NULL, -- 0 to 1
  confidence_score NUMERIC(4,3) NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 1,
  
  -- Predictions
  expected_direction TEXT, -- up, down, volatile
  expected_magnitude TEXT, -- small, medium, large, extreme
  time_horizon TEXT, -- immediate, short, medium, long
  expected_roi_low NUMERIC(6,2),
  expected_roi_high NUMERIC(6,2),
  
  -- Risk assessment
  risk_level TEXT, -- low, medium, high, extreme
  risk_factors JSONB DEFAULT '[]'::jsonb,
  stop_loss_suggestion NUMERIC(6,2),
  
  -- Evidence
  supporting_news JSONB DEFAULT '[]'::jsonb,
  contrary_indicators JSONB DEFAULT '[]'::jsonb,
  historical_accuracy NUMERIC(4,3), -- for similar signals
  
  -- Status
  status TEXT DEFAULT 'active', -- active, expired, triggered, invalidated
  triggered_at TIMESTAMPTZ,
  outcome_recorded JSONB,
  
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Geopolitical Events - Tracked situations
CREATE TABLE public.geopolitical_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Event identification
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- war, election, sanctions, trade_dispute, coup, natural_disaster
  regions TEXT[] NOT NULL,
  countries TEXT[] NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'ongoing', -- developing, ongoing, escalating, de-escalating, resolved
  severity_level TEXT, -- critical, high, medium, low
  started_at TIMESTAMPTZ,
  last_escalation_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Intelligence
  summary TEXT,
  key_actors JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Market impact analysis
  affected_sectors JSONB DEFAULT '[]'::jsonb,
  affected_commodities JSONB DEFAULT '[]'::jsonb,
  affected_currencies JSONB DEFAULT '[]'::jsonb,
  affected_companies JSONB DEFAULT '[]'::jsonb,
  
  -- Investment implications
  investment_implications JSONB DEFAULT '[]'::jsonb,
  opportunity_score NUMERIC(4,3),
  risk_score NUMERIC(4,3),
  
  -- Tracking
  news_item_count INTEGER DEFAULT 0,
  last_news_at TIMESTAMPTZ,
  monitoring_priority TEXT DEFAULT 'normal',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Market Sentiment Snapshots - Aggregated sentiment over time
CREATE TABLE public.market_sentiment_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL,
  granularity TEXT NOT NULL, -- hourly, daily, weekly
  
  -- Overall market sentiment
  overall_sentiment NUMERIC(4,3),
  overall_fear_greed NUMERIC(4,3), -- 0 = extreme fear, 1 = extreme greed
  
  -- Sector sentiments
  sector_sentiments JSONB DEFAULT '{}'::jsonb,
  
  -- Regional sentiments
  regional_sentiments JSONB DEFAULT '{}'::jsonb,
  
  -- Asset class sentiments
  asset_class_sentiments JSONB DEFAULT '{}'::jsonb,
  
  -- Hot topics
  trending_topics JSONB DEFAULT '[]'::jsonb,
  emerging_risks JSONB DEFAULT '[]'::jsonb,
  emerging_opportunities JSONB DEFAULT '[]'::jsonb,
  
  -- Statistics
  news_volume INTEGER,
  positive_news_pct NUMERIC(5,2),
  negative_news_pct NUMERIC(5,2),
  source_count INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Investment Opportunities - AI-generated opportunities
CREATE TABLE public.investment_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Opportunity details
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type TEXT NOT NULL, -- trade, investment, hedge, arbitrage
  
  -- Asset details
  asset_class TEXT NOT NULL,
  asset_identifier TEXT,
  sector TEXT,
  
  -- Recommendation
  action TEXT NOT NULL, -- buy, sell, short, hedge, accumulate
  urgency TEXT, -- immediate, this_week, this_month, monitor
  conviction_level TEXT, -- high, medium, low
  
  -- Financial projections
  entry_price_suggestion NUMERIC(20,8),
  target_price NUMERIC(20,8),
  stop_loss NUMERIC(20,8),
  expected_roi_pct NUMERIC(6,2),
  time_horizon_days INTEGER,
  
  -- Risk assessment
  risk_level TEXT NOT NULL,
  max_drawdown_pct NUMERIC(6,2),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  
  -- Evidence and reasoning
  thesis TEXT,
  supporting_events UUID[], -- geopolitical_events
  supporting_signals UUID[], -- news_signals
  supporting_news UUID[], -- news_intelligence_items
  ai_reasoning JSONB,
  
  -- Confidence
  confidence_score NUMERIC(4,3) NOT NULL,
  source_agreement_score NUMERIC(4,3),
  historical_pattern_match NUMERIC(4,3),
  
  -- Tracking
  status TEXT DEFAULT 'pending', -- pending, active, executed, expired, cancelled
  viewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  outcome JSONB,
  
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Contact-News Correlations - Link contacts to news
CREATE TABLE public.contact_news_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  news_item_id UUID REFERENCES public.news_intelligence_items(id) ON DELETE CASCADE,
  
  -- Correlation type
  correlation_type TEXT NOT NULL, -- company_mention, industry_news, location_news, direct_mention
  correlation_strength NUMERIC(4,3) NOT NULL,
  
  -- Matched entities
  matched_entities JSONB DEFAULT '[]'::jsonb,
  
  -- Impact assessment
  impact_on_contact TEXT, -- positive, negative, neutral, uncertain
  predicted_behaviors JSONB DEFAULT '[]'::jsonb,
  
  -- Action recommendations
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  conversation_starters TEXT[],
  
  -- Status
  is_reviewed BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.news_intelligence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geopolitical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sentiment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_news_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own news items" ON public.news_intelligence_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own correlations" ON public.news_correlations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signals" ON public.news_signals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own geopolitical events" ON public.geopolitical_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sentiment snapshots" ON public.market_sentiment_snapshots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own opportunities" ON public.investment_opportunities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own contact correlations" ON public.contact_news_correlations
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_news_items_user_fetched ON public.news_intelligence_items(user_id, fetched_at DESC);
CREATE INDEX idx_news_items_topics ON public.news_intelligence_items USING GIN(topics);
CREATE INDEX idx_news_items_sectors ON public.news_intelligence_items USING GIN(sectors);
CREATE INDEX idx_news_items_tickers ON public.news_intelligence_items USING GIN(tickers);
CREATE INDEX idx_news_signals_user_status ON public.news_signals(user_id, status, created_at DESC);
CREATE INDEX idx_news_signals_asset ON public.news_signals(asset_class, asset_identifier);
CREATE INDEX idx_geopolitical_status ON public.geopolitical_events(user_id, status);
CREATE INDEX idx_opportunities_status ON public.investment_opportunities(user_id, status, created_at DESC);
CREATE INDEX idx_contact_news_profile ON public.contact_news_correlations(profile_id, created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_news_items_updated_at BEFORE UPDATE ON public.news_intelligence_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_signals_updated_at BEFORE UPDATE ON public.news_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geopolitical_updated_at BEFORE UPDATE ON public.geopolitical_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.investment_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();