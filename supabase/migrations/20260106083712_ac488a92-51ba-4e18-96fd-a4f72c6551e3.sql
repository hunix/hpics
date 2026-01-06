-- Life Milestones: Track major life events over years of knowing someone
CREATE TABLE public.contact_life_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Event details
  milestone_type TEXT NOT NULL, -- 'career', 'personal', 'health', 'family', 'achievement', 'loss', 'other'
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  approximate_date TEXT, -- "Early 2020", "Around 2015" for older events
  
  -- Impact and context
  impact_level TEXT DEFAULT 'medium', -- 'major', 'significant', 'medium', 'minor'
  emotional_valence TEXT, -- 'positive', 'negative', 'neutral', 'mixed'
  your_involvement TEXT, -- How you were involved (attended wedding, helped with move, etc.)
  
  -- Source of information
  source TEXT, -- 'conversation', 'social_media', 'observation', 'shared_experience', 'email'
  verified BOOLEAN DEFAULT false,
  
  -- Related data
  related_contacts UUID[], -- Other contacts involved in this milestone
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Preferences: How to best interact with each person
CREATE TABLE public.contact_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Preferred channels and timing
  preferred_channels TEXT[], -- ['whatsapp', 'phone', 'email', 'in_person', 'text']
  avoid_channels TEXT[],
  best_contact_times JSONB, -- {"weekday_morning": true, "weekend_afternoon": true}
  response_speed TEXT, -- 'immediate', 'same_day', 'few_days', 'slow'
  
  -- Communication style
  communication_style TEXT, -- 'formal', 'casual', 'direct', 'diplomatic', 'warm'
  humor_receptivity TEXT, -- 'loves_humor', 'appreciates_wit', 'professional_only', 'avoid'
  preferred_greeting TEXT, -- How they like to be greeted
  
  -- Topics and sensitivities
  favorite_topics TEXT[],
  topics_to_avoid TEXT[], -- Sensitive subjects
  sensitivities TEXT, -- Notes on things they're sensitive about
  
  -- Decision making
  decision_style TEXT, -- 'analytical', 'emotional', 'quick', 'deliberate', 'collaborative'
  influence_factors TEXT[], -- What motivates them: 'data', 'relationships', 'recognition', 'money'
  
  -- Meeting preferences
  meeting_preference TEXT, -- 'in_person', 'video', 'phone', 'no_preference'
  ideal_meeting_duration TEXT, -- 'quick_15', 'standard_30', 'deep_60', 'flexible'
  small_talk_preference TEXT, -- 'enjoys', 'tolerates', 'skip_to_business'
  
  -- Relationship dynamics
  how_they_show_appreciation TEXT,
  how_to_apologize TEXT, -- Best way to apologize if needed
  conflict_resolution_style TEXT, -- 'direct', 'avoidant', 'collaborative', 'competitive'
  
  -- AI-generated insights
  ai_analysis JSONB,
  ai_analyzed_at TIMESTAMPTZ,
  confidence_score NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, profile_id)
);

-- Interaction Notes: Quick notes after meetings/calls
CREATE TABLE public.contact_interaction_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Interaction context
  interaction_type TEXT NOT NULL, -- 'call', 'meeting', 'email', 'message', 'social', 'chance_encounter'
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,
  location TEXT,
  
  -- Quick capture fields
  note_text TEXT NOT NULL,
  audio_url TEXT, -- For voice notes
  audio_transcription TEXT,
  
  -- Structured insights
  mood_observed TEXT, -- 'happy', 'stressed', 'neutral', 'sad', 'excited', 'anxious'
  topics_discussed TEXT[],
  action_items TEXT[], -- Things to follow up on
  promises_made TEXT[], -- Things you or they promised
  
  -- Relationship signals
  relationship_temperature TEXT, -- 'warm', 'neutral', 'cool', 'strained'
  notable_changes TEXT, -- Any changes noticed in them
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_reason TEXT,
  
  -- AI enrichment
  ai_extracted_insights JSONB,
  ai_processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-Guided Interviews: Sessions where AI asks questions to build profiles
CREATE TABLE public.ai_guided_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Interview session
  interview_type TEXT NOT NULL, -- 'initial_profile', 'deep_dive', 'recent_changes', 'specific_topic'
  topic_focus TEXT, -- Specific topic if applicable
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  
  -- Conversation
  conversation_history JSONB NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
  current_question TEXT,
  questions_asked INTEGER DEFAULT 0,
  questions_remaining INTEGER,
  
  -- Extracted data
  extracted_data JSONB, -- Structured data extracted from conversation
  data_applied BOOLEAN DEFAULT false, -- Whether extracted data was applied to profile
  
  -- Quality
  completeness_score NUMERIC,
  confidence_score NUMERIC,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personality Playbook: Do's and Don'ts for each person
CREATE TABLE public.contact_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Core insights
  personality_summary TEXT, -- One-paragraph summary of their personality
  working_with_them TEXT, -- How to effectively work/interact with them
  
  -- Do's and Don'ts
  dos TEXT[], -- Things to do when interacting
  donts TEXT[], -- Things to avoid
  
  -- Specific scripts
  how_to_ask_favor TEXT,
  how_to_give_feedback TEXT,
  how_to_deliver_bad_news TEXT,
  how_to_celebrate_with TEXT,
  how_to_comfort TEXT,
  
  -- Relationship maintenance
  ideal_contact_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly'
  relationship_investment_tips TEXT[],
  gift_giving_notes TEXT,
  
  -- Warning signs
  signs_of_distance TEXT[], -- Signs the relationship is cooling
  signs_of_stress TEXT[], -- Signs they're stressed
  signs_of_openness TEXT[], -- Signs they're receptive
  
  -- AI-generated
  ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_generated_at TIMESTAMPTZ,
  human_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, profile_id)
);

-- Enable RLS on all tables
ALTER TABLE public.contact_life_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interaction_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_guided_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_playbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_life_milestones
CREATE POLICY "Users can view their own milestones" ON public.contact_life_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own milestones" ON public.contact_life_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones" ON public.contact_life_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own milestones" ON public.contact_life_milestones FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_communication_preferences
CREATE POLICY "Users can view their own prefs" ON public.contact_communication_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prefs" ON public.contact_communication_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prefs" ON public.contact_communication_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prefs" ON public.contact_communication_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_interaction_notes
CREATE POLICY "Users can view their own notes" ON public.contact_interaction_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.contact_interaction_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.contact_interaction_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.contact_interaction_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_guided_interviews
CREATE POLICY "Users can view their own interviews" ON public.ai_guided_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interviews" ON public.ai_guided_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interviews" ON public.ai_guided_interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interviews" ON public.ai_guided_interviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_playbooks
CREATE POLICY "Users can view their own playbooks" ON public.contact_playbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own playbooks" ON public.contact_playbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own playbooks" ON public.contact_playbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own playbooks" ON public.contact_playbooks FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_milestones_profile ON public.contact_life_milestones(profile_id);
CREATE INDEX idx_milestones_date ON public.contact_life_milestones(event_date DESC);
CREATE INDEX idx_interaction_notes_profile ON public.contact_interaction_notes(profile_id);
CREATE INDEX idx_interaction_notes_date ON public.contact_interaction_notes(interaction_date DESC);
CREATE INDEX idx_interviews_profile ON public.ai_guided_interviews(profile_id, status);

-- Trigger for updated_at
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.contact_life_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comm_prefs_updated_at BEFORE UPDATE ON public.contact_communication_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interaction_notes_updated_at BEFORE UPDATE ON public.contact_interaction_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON public.contact_playbooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();