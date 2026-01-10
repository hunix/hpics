-- Voice Analysis Jobs with full state persistence
CREATE TABLE IF NOT EXISTS voice_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paused', 'completed', 'failed', 'cancelled')),
  
  -- Configuration
  options JSONB DEFAULT '{}'::jsonb NOT NULL,
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  
  -- Progress tracking
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_item_id UUID,
  last_processed_index INTEGER DEFAULT 0,
  
  -- Results summary
  total_duration_seconds INTEGER DEFAULT 0,
  contacts_identified INTEGER DEFAULT 0,
  keywords_detected INTEGER DEFAULT 0,
  patterns_found INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_cents INTEGER DEFAULT 0,
  actual_cost_cents INTEGER DEFAULT 0,
  
  -- Error handling
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Voice Insights extracted from audio
CREATE TABLE IF NOT EXISTS voice_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('voice_note', 'meeting_recording', 'media', 'whatsapp_audio')),
  source_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES voice_analysis_jobs(id) ON DELETE SET NULL,
  
  -- Transcription data
  full_transcription TEXT,
  transcription_with_timestamps JSONB,
  speakers JSONB,
  audio_events JSONB,
  duration_seconds INTEGER,
  language_detected TEXT,
  
  -- Content intelligence
  topics_discussed JSONB,
  named_entities JSONB,
  action_items JSONB,
  commitments JSONB,
  questions_asked JSONB,
  decisions_made JSONB,
  
  -- Psychological analysis
  sentiment_timeline JSONB,
  stress_points JSONB,
  deception_indicators JSONB,
  mood_patterns JSONB,
  emotional_markers JSONB,
  confidence_indicators JSONB,
  
  -- Keyword detection
  detected_keywords JSONB,
  flagged_content JSONB,
  
  -- Contact identification
  identified_contacts JSONB,
  mentioned_contacts JSONB,
  
  -- Voice biometrics
  voice_signatures JSONB,
  speaker_profiles JSONB,
  
  confidence_score NUMERIC,
  ai_model_used TEXT,
  processing_time_ms INTEGER,
  cost_cents INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Analysis Jobs
CREATE TABLE IF NOT EXISTS document_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paused', 'completed', 'failed', 'cancelled')),
  
  -- Configuration
  options JSONB DEFAULT '{}'::jsonb NOT NULL,
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  
  -- Progress
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_item_id UUID,
  last_processed_index INTEGER DEFAULT 0,
  
  -- Results
  documents_extracted INTEGER DEFAULT 0,
  contacts_linked INTEGER DEFAULT 0,
  patterns_found INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_cents INTEGER DEFAULT 0,
  actual_cost_cents INTEGER DEFAULT 0,
  
  -- Error handling
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Insights extracted from documents/images
CREATE TABLE IF NOT EXISTS document_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES document_analysis_jobs(id) ON DELETE SET NULL,
  document_id UUID REFERENCES extracted_documents(id) ON DELETE SET NULL,
  
  -- OCR data
  raw_text TEXT,
  text_blocks JSONB,
  language_detected TEXT,
  
  -- Document classification
  document_type TEXT,
  document_subtype TEXT,
  classification_confidence NUMERIC,
  
  -- Structured extraction
  structured_data JSONB,
  key_value_pairs JSONB,
  tables_extracted JSONB,
  form_fields JSONB,
  
  -- Contact information
  contact_info_extracted JSONB,
  suggested_contacts JSONB,
  
  -- Pattern analysis
  patterns_detected JSONB,
  anomalies JSONB,
  
  -- Dates and reminders
  dates_found JSONB,
  suggested_reminders JSONB,
  
  -- Financial data
  financial_data JSONB,
  amounts_found JSONB,
  
  -- Security analysis
  sensitive_data JSONB,
  authenticity_score NUMERIC,
  
  ai_model_used TEXT,
  processing_time_ms INTEGER,
  cost_cents INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Keyword Watchlists for automatic detection
CREATE TABLE IF NOT EXISTS keyword_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  category TEXT CHECK (category IN ('competitors', 'legal', 'personal', 'opportunities', 'red_flags', 'custom')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  notify_on_match BOOLEAN DEFAULT false,
  match_case_sensitive BOOLEAN DEFAULT false,
  match_whole_word BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Keyword Detections/Matches
CREATE TABLE IF NOT EXISTS keyword_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  watchlist_id UUID REFERENCES keyword_watchlists(id) ON DELETE CASCADE,
  keyword_matched TEXT NOT NULL,
  
  -- Source
  source_type TEXT NOT NULL CHECK (source_type IN ('voice_insight', 'document_insight', 'message', 'note', 'transcription')),
  source_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Context
  context_text TEXT,
  timestamp_in_source TEXT,
  occurrence_count INTEGER DEFAULT 1,
  
  -- Classification
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  
  reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  dismissed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Content Relationships discovered between contacts
CREATE TABLE IF NOT EXISTS content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Related contacts
  profile_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  profile_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Evidence
  source_type TEXT NOT NULL CHECK (source_type IN ('voice_mention', 'document_reference', 'same_recording', 'email_thread', 'meeting_together', 'photo_together')),
  source_id UUID NOT NULL,
  
  -- Relationship details
  relationship_type TEXT CHECK (relationship_type IN ('mentioned_together', 'discussed', 'referenced', 'present_together', 'introduced', 'recommended')),
  context TEXT,
  confidence NUMERIC,
  
  -- Aggregated strength
  occurrence_count INTEGER DEFAULT 1,
  first_occurrence TIMESTAMPTZ DEFAULT now(),
  last_occurrence TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure we don't create self-relationships and maintain uniqueness
  CONSTRAINT no_self_relationship CHECK (profile_id_1 <> profile_id_2),
  CONSTRAINT unique_content_relationship UNIQUE (user_id, profile_id_1, profile_id_2, source_type, source_id)
);

-- Enable RLS on all tables
ALTER TABLE voice_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_analysis_jobs
CREATE POLICY "Users can view their own voice analysis jobs" ON voice_analysis_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own voice analysis jobs" ON voice_analysis_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice analysis jobs" ON voice_analysis_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice analysis jobs" ON voice_analysis_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for voice_insights
CREATE POLICY "Users can view their own voice insights" ON voice_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own voice insights" ON voice_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice insights" ON voice_insights
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice insights" ON voice_insights
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_analysis_jobs
CREATE POLICY "Users can view their own document analysis jobs" ON document_analysis_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own document analysis jobs" ON document_analysis_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document analysis jobs" ON document_analysis_jobs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document analysis jobs" ON document_analysis_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_insights
CREATE POLICY "Users can view their own document insights" ON document_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own document insights" ON document_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document insights" ON document_insights
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document insights" ON document_insights
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for keyword_watchlists
CREATE POLICY "Users can view their own keyword watchlists" ON keyword_watchlists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own keyword watchlists" ON keyword_watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own keyword watchlists" ON keyword_watchlists
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own keyword watchlists" ON keyword_watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for keyword_detections
CREATE POLICY "Users can view their own keyword detections" ON keyword_detections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own keyword detections" ON keyword_detections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own keyword detections" ON keyword_detections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own keyword detections" ON keyword_detections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content_relationships
CREATE POLICY "Users can view their own content relationships" ON content_relationships
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own content relationships" ON content_relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own content relationships" ON content_relationships
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own content relationships" ON content_relationships
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_analysis_jobs_user_status ON voice_analysis_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_voice_analysis_jobs_profile ON voice_analysis_jobs(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_insights_user ON voice_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_insights_source ON voice_insights(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_voice_insights_profile ON voice_insights(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_insights_job ON voice_insights(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_analysis_jobs_user_status ON document_analysis_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_jobs_profile ON document_analysis_jobs(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_insights_user ON document_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_media ON document_insights(media_id) WHERE media_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_insights_profile ON document_insights(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_insights_job ON document_insights(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_keyword_watchlists_user_active ON keyword_watchlists(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_keyword_detections_user_reviewed ON keyword_detections(user_id, reviewed);
CREATE INDEX IF NOT EXISTS idx_keyword_detections_watchlist ON keyword_detections(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_keyword_detections_source ON keyword_detections(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_content_relationships_user ON content_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_content_relationships_profile1 ON content_relationships(profile_id_1);
CREATE INDEX IF NOT EXISTS idx_content_relationships_profile2 ON content_relationships(profile_id_2);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_voice_analysis_jobs_updated_at ON voice_analysis_jobs;
CREATE TRIGGER update_voice_analysis_jobs_updated_at
  BEFORE UPDATE ON voice_analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_insights_updated_at ON voice_insights;
CREATE TRIGGER update_voice_insights_updated_at
  BEFORE UPDATE ON voice_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_analysis_jobs_updated_at ON document_analysis_jobs;
CREATE TRIGGER update_document_analysis_jobs_updated_at
  BEFORE UPDATE ON document_analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_insights_updated_at ON document_insights;
CREATE TRIGGER update_document_insights_updated_at
  BEFORE UPDATE ON document_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_keyword_watchlists_updated_at ON keyword_watchlists;
CREATE TRIGGER update_keyword_watchlists_updated_at
  BEFORE UPDATE ON keyword_watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for job tracking
ALTER PUBLICATION supabase_realtime ADD TABLE voice_analysis_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE document_analysis_jobs;