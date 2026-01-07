-- Intelligence Methodology Library - Proven psychological techniques
CREATE TABLE public.intelligence_methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'persuasion', 'rapport', 'influence', 'elicitation', 'profiling', 'conflict', 'trust'
  subcategory TEXT,
  description TEXT NOT NULL,
  psychological_basis TEXT, -- Academic foundation
  technique_steps JSONB NOT NULL DEFAULT '[]',
  best_for TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',
  success_indicators TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'intermediate', -- 'basic', 'intermediate', 'advanced', 'expert'
  ethical_considerations TEXT,
  ai_prompt_template TEXT,
  example_scripts JSONB DEFAULT '[]',
  effectiveness_stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contact Influence Profiles - Per-contact susceptibility mapping
CREATE TABLE public.contact_influence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Cialdini's Principles Susceptibility (0-100)
  reciprocity_susceptibility NUMERIC DEFAULT 50,
  commitment_consistency_susceptibility NUMERIC DEFAULT 50,
  social_proof_susceptibility NUMERIC DEFAULT 50,
  authority_susceptibility NUMERIC DEFAULT 50,
  liking_susceptibility NUMERIC DEFAULT 50,
  scarcity_susceptibility NUMERIC DEFAULT 50,
  unity_susceptibility NUMERIC DEFAULT 50,
  
  -- Decision-Making Style
  decision_style TEXT, -- 'analytical', 'intuitive', 'spontaneous', 'dependent', 'avoidant'
  information_preference TEXT, -- 'detailed', 'summary', 'visual', 'examples', 'data'
  risk_appetite TEXT, -- 'conservative', 'moderate', 'aggressive'
  time_pressure_response TEXT, -- 'panics', 'focuses', 'stalls', 'avoids'
  
  -- Communication Triggers
  positive_triggers JSONB DEFAULT '[]',
  negative_triggers JSONB DEFAULT '[]',
  power_words TEXT[] DEFAULT '{}',
  avoid_words TEXT[] DEFAULT '{}',
  
  -- Emotional Patterns
  emotional_buying_triggers JSONB DEFAULT '{}',
  fear_motivators TEXT[] DEFAULT '{}',
  desire_motivators TEXT[] DEFAULT '{}',
  ego_sensitivities TEXT[] DEFAULT '{}',
  validation_needs JSONB DEFAULT '{}',
  
  -- Cognitive Style
  thinking_style TEXT, -- 'logical', 'emotional', 'pragmatic', 'creative'
  attention_span TEXT, -- 'short', 'medium', 'long'
  memory_anchors JSONB DEFAULT '[]', -- What they remember/reference
  
  -- Best Approaches
  recommended_methodologies TEXT[] DEFAULT '{}',
  approach_sequence JSONB DEFAULT '[]',
  timing_preferences JSONB DEFAULT '{}',
  channel_preferences JSONB DEFAULT '{}',
  
  -- Meta
  overall_influence_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  evidence_sources JSONB DEFAULT '[]',
  ai_model_used TEXT,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, profile_id)
);

-- Influence Strategies - AI-generated goal-based strategies
CREATE TABLE public.influence_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Goal-based strategies
  goal_type TEXT NOT NULL, -- 'deepen_relationship', 'ask_favor', 'resolve_conflict', 'close_deal', 'gain_trust', 'gather_info', 'change_opinion'
  goal_description TEXT,
  context TEXT,
  
  -- Strategy details
  strategy_name TEXT NOT NULL,
  strategy_summary TEXT,
  preparation_steps JSONB DEFAULT '[]',
  execution_steps JSONB DEFAULT '[]',
  follow_up_steps JSONB DEFAULT '[]',
  
  -- Conversation scripts
  opening_scripts TEXT[] DEFAULT '{}',
  transition_phrases TEXT[] DEFAULT '{}',
  closing_scripts TEXT[] DEFAULT '{}',
  objection_handlers JSONB DEFAULT '{}',
  recovery_phrases TEXT[] DEFAULT '{}',
  
  -- Personalization
  things_to_mention TEXT[] DEFAULT '{}',
  things_to_avoid TEXT[] DEFAULT '{}',
  emotional_hooks TEXT[] DEFAULT '{}',
  
  -- Timing
  optimal_timing JSONB DEFAULT '{}',
  duration_estimate TEXT,
  urgency_level TEXT DEFAULT 'medium',
  
  -- Risk assessment
  success_probability NUMERIC,
  risks JSONB DEFAULT '[]',
  fallback_strategy TEXT,
  abort_signals TEXT[] DEFAULT '{}',
  
  -- Methodologies used
  methodologies_applied TEXT[] DEFAULT '{}',
  
  -- Tracking
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'executed', 'successful', 'failed', 'archived'
  executed_at TIMESTAMPTZ,
  outcome TEXT,
  outcome_rating INTEGER, -- 1-5
  lessons_learned JSONB DEFAULT '[]',
  
  ai_model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Influence Actions - Scheduled touchpoints and nudges
CREATE TABLE public.influence_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.influence_strategies(id) ON DELETE SET NULL,
  
  -- Action details
  action_type TEXT NOT NULL, -- 'message', 'call', 'email', 'gift', 'introduction', 'check_in', 'appreciation', 'congratulation', 'reminder', 'follow_up'
  action_title TEXT NOT NULL,
  action_description TEXT,
  
  -- Content suggestions
  suggested_message TEXT,
  suggested_channel TEXT,
  talking_points TEXT[] DEFAULT '{}',
  things_to_mention TEXT[] DEFAULT '{}',
  things_to_avoid TEXT[] DEFAULT '{}',
  
  -- Personalization context
  trigger_event TEXT,
  trigger_context JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  optimal_window_start TIME,
  optimal_window_end TIME,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  reminder_before_minutes INTEGER DEFAULT 30,
  
  -- Execution
  status TEXT DEFAULT 'pending', -- 'pending', 'reminded', 'in_progress', 'completed', 'skipped', 'rescheduled', 'failed'
  completed_at TIMESTAMPTZ,
  actual_channel TEXT,
  outcome TEXT,
  response_received TEXT,
  effectiveness_rating INTEGER, -- 1-5
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Methodology Outcomes - Track what works per contact
CREATE TABLE public.methodology_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  methodology_id UUID REFERENCES public.intelligence_methodologies(id) ON DELETE SET NULL,
  strategy_id UUID REFERENCES public.influence_strategies(id) ON DELETE SET NULL,
  action_id UUID REFERENCES public.influence_actions(id) ON DELETE SET NULL,
  
  methodology_name TEXT NOT NULL,
  context TEXT,
  approach_used TEXT,
  
  -- Outcome tracking
  outcome TEXT NOT NULL, -- 'very_effective', 'effective', 'neutral', 'ineffective', 'backfired'
  outcome_score INTEGER, -- 1-5
  response_observed TEXT,
  lessons TEXT,
  
  -- For AI learning
  before_state JSONB DEFAULT '{}',
  after_state JSONB DEFAULT '{}',
  relationship_delta NUMERIC,
  
  -- Tags for pattern analysis
  tags TEXT[] DEFAULT '{}',
  
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_influence_profiles_user_id ON public.contact_influence_profiles(user_id);
CREATE INDEX idx_influence_profiles_profile_id ON public.contact_influence_profiles(profile_id);
CREATE INDEX idx_influence_strategies_user_profile ON public.influence_strategies(user_id, profile_id);
CREATE INDEX idx_influence_strategies_status ON public.influence_strategies(status);
CREATE INDEX idx_influence_actions_user_id ON public.influence_actions(user_id);
CREATE INDEX idx_influence_actions_scheduled ON public.influence_actions(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_influence_actions_profile ON public.influence_actions(profile_id);
CREATE INDEX idx_methodology_outcomes_profile ON public.methodology_outcomes(profile_id);
CREATE INDEX idx_methodologies_category ON public.intelligence_methodologies(category);

-- Enable RLS
ALTER TABLE public.intelligence_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_influence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methodology_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_methodologies (public read, no write from client)
CREATE POLICY "Anyone can read methodologies"
  ON public.intelligence_methodologies FOR SELECT
  USING (true);

-- RLS Policies for contact_influence_profiles
CREATE POLICY "Users can view their own influence profiles"
  ON public.contact_influence_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own influence profiles"
  ON public.contact_influence_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own influence profiles"
  ON public.contact_influence_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own influence profiles"
  ON public.contact_influence_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for influence_strategies
CREATE POLICY "Users can view their own strategies"
  ON public.influence_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies"
  ON public.influence_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON public.influence_strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON public.influence_strategies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for influence_actions
CREATE POLICY "Users can view their own actions"
  ON public.influence_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
  ON public.influence_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions"
  ON public.influence_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions"
  ON public.influence_actions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for methodology_outcomes
CREATE POLICY "Users can view their own outcomes"
  ON public.methodology_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outcomes"
  ON public.methodology_outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outcomes"
  ON public.methodology_outcomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outcomes"
  ON public.methodology_outcomes FOR DELETE
  USING (auth.uid() = user_id);

-- Seed the methodology library with 50+ proven techniques
INSERT INTO public.intelligence_methodologies (name, category, subcategory, description, psychological_basis, technique_steps, best_for, contraindications, success_indicators, difficulty_level, ethical_considerations, ai_prompt_template) VALUES

-- PERSUASION TECHNIQUES
('Reciprocity Activation', 'persuasion', 'cialdini', 'Give something of value before making a request. People feel obligated to return favors.', 'Cialdini''s Principle of Reciprocity - Humans have a deep-seated need to repay kindness', 
'["Identify something valuable you can offer (information, connection, favor)", "Deliver the gift genuinely without mentioning future asks", "Allow time for the sense of obligation to develop", "Make your request naturally, framing it as an opportunity to reciprocate"]',
ARRAY['generous_personalities', 'relationship_focused', 'traditional_values'], 
ARRAY['transactional_thinkers', 'those_who_feel_manipulated_easily'],
ARRAY['They mention feeling grateful', 'They offer to help you unprompted', 'Quick agreement to requests'],
'basic', 'Ensure the initial gift is genuine and not purely manipulative', 'Generate a reciprocity-based approach for {contact_name} considering their values around {values} and recent interactions about {context}'),

('Commitment Ladder', 'persuasion', 'cialdini', 'Start with small commitments that lead to larger ones. People want to appear consistent.', 'Cialdini''s Commitment and Consistency - Once we commit, we align future behavior',
'["Identify the ultimate commitment you want", "Break it down into 3-5 smaller progressive steps", "Start with a tiny, easy-to-say-yes request", "Acknowledge each commitment explicitly", "Reference previous commitments when asking for the next"]',
ARRAY['analytical_types', 'reputation_conscious', 'public_figures'],
ARRAY['impulsive_deciders', 'commitment_phobic'],
ARRAY['They reference their previous agreements', 'They use phrases like \"I said I would...\"', 'Increasing engagement over time'],
'intermediate', 'Each step should be genuinely valuable, not just manipulation stepping stones', 'Create a commitment ladder for {contact_name} to achieve {goal}, starting from their current engagement level of {current_state}'),

('Social Proof Framing', 'persuasion', 'cialdini', 'Show that others similar to them have done what you''re asking. People follow the crowd.', 'Cialdini''s Social Proof - We look to others to determine correct behavior',
'["Identify people they respect or identify with", "Gather genuine examples of similar people taking the desired action", "Present these examples naturally in conversation", "Use specific names and details for credibility", "Frame it as \"people like you\" not \"everyone\""]',
ARRAY['social_conformists', 'risk_averse', 'status_conscious'],
ARRAY['contrarians', 'pioneers', 'anti_establishment'],
ARRAY['They ask \"who else has done this?\"', 'They seem relieved by examples', 'They mention the examples later'],
'basic', 'Only use genuine examples, never fabricate social proof', 'Generate social proof examples for {contact_name} regarding {topic} using references they would respect'),

('Authority Positioning', 'persuasion', 'cialdini', 'Establish credibility and expertise before making suggestions. People defer to experts.', 'Cialdini''s Authority Principle - We trust those with expertise and credentials',
'["Identify relevant expertise areas that matter to them", "Subtly demonstrate credentials early in interaction", "Share insights that only an expert would know", "Reference other authorities who support your position", "Maintain confident but not arrogant delivery"]',
ARRAY['analytical_types', 'hierarchical_thinkers', 'credential_focused'],
ARRAY['anti_authority', 'egalitarians', 'self_made_types'],
ARRAY['They ask for your opinion unprompted', 'They quote you to others', 'They defer to your judgment'],
'intermediate', 'Only claim genuine expertise, acknowledge limits', 'Position authority for {contact_name} on topic {topic} given their respect for {authority_types}'),

('Scarcity Signaling', 'persuasion', 'cialdini', 'Highlight limited availability or exclusive access. People want what''s rare.', 'Cialdini''s Scarcity Principle - We value things more when they''re rare',
'["Identify genuine scarcity elements (time, quantity, access)", "Communicate scarcity early but naturally", "Use loss framing: what they''ll miss, not what they''ll gain", "Create urgency without pressure", "Offer exclusive early access as a relationship benefit"]',
ARRAY['competitive_types', 'collectors', 'fomo_prone'],
ARRAY['skeptics', 'budget_conscious', 'analytical_slow_deciders'],
ARRAY['Quick decision-making', 'They ask \"how long do I have?\"', 'Increased engagement when limits mentioned'],
'basic', 'Only use genuine scarcity, fake urgency destroys trust', 'Create scarcity framing for {contact_name} around {opportunity} using their competitive nature regarding {competition_context}'),

('Liking Enhancement', 'persuasion', 'cialdini', 'Build genuine rapport and similarity. People say yes to those they like.', 'Cialdini''s Liking Principle - We prefer to say yes to people we know and like',
'["Research their interests, background, and values", "Find genuine commonalities to mention", "Give sincere, specific compliments", "Mirror their communication style", "Create shared experiences when possible"]',
ARRAY['relationship_oriented', 'emotional_deciders', 'extroverts'],
ARRAY['purely_transactional', 'time_pressed_executives'],
ARRAY['Increased personal disclosure', 'They initiate social conversation', 'Warm body language'],
'basic', 'Liking must be genuine - fake rapport is easily detected', 'Build liking with {contact_name} using their interests in {interests} and shared connection to {commonalities}'),

('Unity Building', 'persuasion', 'cialdini', 'Emphasize shared identity and belonging. \"We\" is more powerful than \"you and I\".', 'Cialdini''s Unity Principle (7th) - Shared identity creates automatic cooperation',
'["Identify shared group memberships", "Use inclusive language (we, us, our)", "Reference shared experiences or origins", "Create or highlight in-group membership", "Frame requests as \"for our group\""]',
ARRAY['family_oriented', 'tribal_thinkers', 'community_focused'],
ARRAY['strong_individualists', 'outsider_identifiers'],
ARRAY['They use \"we\" language back', 'References to shared identity', 'Protective behavior towards you'],
'intermediate', 'Only invoke genuine shared identities', 'Build unity with {contact_name} around shared identity of {shared_identity} for goal {goal}'),

('Foot-in-the-Door', 'persuasion', 'compliance', 'Get a small yes before asking for the big yes. Momentum builds compliance.', 'Freedman & Fraser (1966) - Small agreements lead to larger ones',
'["Prepare your ultimate request", "Identify a tiny, easy first request (5 minutes, simple opinion)", "Make the small request without mentioning the larger one", "After compliance, wait briefly", "Make the larger request, referencing their helpfulness"]',
ARRAY['helpful_types', 'yes_oriented', 'consistent_personalities'],
ARRAY['busy_people', 'suspicious_types'],
ARRAY['Easy agreement to small request', 'Positive self-labeling (\"I like to help\")', 'Agreement to larger request'],
'basic', 'Small request should be genuinely useful, not just a trick', 'Design foot-in-the-door sequence for {contact_name} leading to {ultimate_goal}'),

('Door-in-the-Face', 'persuasion', 'compliance', 'Start with a large request you expect to be refused, then ask for what you actually want.', 'Cialdini (1975) - Reciprocal concessions create obligation',
'["Determine your actual desired outcome", "Prepare a much larger initial request", "Make the large request seriously but not aggressively", "Accept the refusal gracefully", "Immediately offer the smaller (real) request as a compromise"]',
ARRAY['negotiators', 'reasonable_types', 'fair_minded'],
ARRAY['binary_thinkers', 'stubborn_types'],
ARRAY['Relief expression when smaller request made', 'Quick agreement to second request', 'They feel they \"won\" the negotiation'],
'intermediate', 'The large request must be plausible, not absurd', 'Create door-in-the-face approach for {contact_name} to achieve {goal}'),

('That''s-Not-All Technique', 'persuasion', 'compliance', 'Add bonuses or reduce the ask before they can say no. Creates sense of getting a deal.', 'Burger (1986) - Added value before decision increases compliance',
'["Present initial offer", "Before they respond, add a bonus", "\"And because it''s you, I''ll also include...\"", "Make them feel special for receiving extra", "Close while momentum is high"]',
ARRAY['deal_seekers', 'value_conscious', 'special_treatment_lovers'],
ARRAY['analytical_negotiators', 'suspicious_of_gifts'],
ARRAY['Surprise and delight expression', 'Quick acceptance', 'They mention the \"deal\" to others'],
'basic', 'Bonuses should be genuine value adds', 'Design that''s-not-all offer for {contact_name} with their value triggers around {value_triggers}'),

-- RAPPORT BUILDING
('Mirroring & Matching', 'rapport', 'body_language', 'Subtly match their body language, speech patterns, and energy level.', 'Chartrand & Bargh (1999) - Mimicry increases liking and rapport',
'["Observe their posture, gestures, and expressions", "Wait 2-3 seconds before mirroring", "Match energy level and pace", "Mirror speech patterns and vocabulary", "Be subtle - obvious mirroring backfires"]',
ARRAY['relationship_focused', 'emotional_communicators', 'intuitive_types'],
ARRAY['highly_observant', 'body_language_aware'],
ARRAY['They become more relaxed', 'Conversation flows easier', 'They lean in', 'Increased self-disclosure'],
'intermediate', 'Must be subtle and natural, not mimicry', 'Guide mirroring approach for {contact_name} based on their communication style of {comm_style}'),

('Active Listening Signals', 'rapport', 'communication', 'Demonstrate deep listening through verbal and non-verbal cues.', 'Rogers (1951) - Active listening is foundational to connection',
'["Maintain appropriate eye contact", "Use verbal acknowledgments (mm-hmm, I see)", "Paraphrase key points back to them", "Ask clarifying questions", "Reference earlier points later in conversation"]',
ARRAY['everyone', 'especially_those_feeling_unheard'],
ARRAY['none'],
ARRAY['Increased sharing', 'They say \"exactly\" often', 'Longer responses', 'Emotional opening'],
'basic', 'Genuine attention is required, not just techniques', 'Demonstrate active listening with {contact_name} focusing on their concerns about {concerns}'),

('Vulnerability Exchange', 'rapport', 'trust', 'Share appropriate personal vulnerability to invite reciprocal openness.', 'Aron et al. (1997) - Mutual vulnerability accelerates closeness',
'["Assess the current trust level", "Choose an appropriate vulnerability to share", "Share genuinely but briefly", "Don''t expect immediate reciprocation", "Create space for them to share when ready"]',
ARRAY['guarded_types', 'trust_issues', 'slow_to_open'],
ARRAY['overly_vulnerable_themselves', 'exploitation_risk'],
ARRAY['They share something personal back', 'Visible relief', 'Deeper conversation topics', 'Future personal references'],
'advanced', 'Never share vulnerabilities that could be used against you', 'Design vulnerability exchange for {contact_name} appropriate to trust level of {trust_level}'),

('Commonality Mining', 'rapport', 'connection', 'Systematically discover and highlight shared experiences, beliefs, and preferences.', 'Byrne (1971) - Similarity breeds attraction',
'["Research their background before meeting", "Ask open-ended questions about experiences", "Listen for connection points", "Share your related experiences naturally", "Build on discovered commonalities"]',
ARRAY['new_relationships', 'distant_contacts', 'networking'],
ARRAY['competitive_types_who_differentiate'],
ARRAY['\"Me too!\" responses', 'Extended conversations on shared topics', 'They bring up commonalities later'],
'basic', 'Only highlight genuine commonalities', 'Find commonalities with {contact_name} using their background of {background} and interests in {interests}'),

('Name Recognition', 'rapport', 'personal', 'Use their name strategically in conversation to create personal connection.', 'Carnegie (1936) - A person''s name is the sweetest sound to them',
'["Remember their name and use it correctly", "Use it at the beginning and end of conversations", "Use it when making important points", "Don''t overuse (3-4 times per conversation max)", "Remember preferred nicknames or formality preferences"]',
ARRAY['everyone'],
ARRAY['none'],
ARRAY['Warmer responses', 'They remember your name', 'More personal interaction style'],
'basic', 'Learn correct pronunciation and preferred form', 'Apply name recognition with {contact_name} considering their formality preference of {formality}'),

-- ELICITATION TECHNIQUES
('Provocative Statement', 'elicitation', 'information_gathering', 'Make a deliberately incorrect or provocative statement to prompt correction with true information.', 'Intelligence tradecraft - People instinctively correct false information',
'["Identify information you want to learn", "Prepare a plausible but incorrect statement", "Deliver it confidently as fact", "Let them correct you", "Show appreciation for the correction", "Ask follow-up questions naturally"]',
ARRAY['experts', 'know_it_alls', 'correctors'],
ARRAY['agreeable_types', 'non_confrontational'],
ARRAY['Immediate correction with details', 'They share more than asked', 'Visible satisfaction from correcting'],
'advanced', 'Use ethically - don''t use for harmful purposes', 'Create provocative statement for {contact_name} to learn about {topic}'),

('Deliberate Naivety', 'elicitation', 'information_gathering', 'Appear less knowledgeable than you are to encourage explanation and disclosure.', 'Intelligence tradecraft - People enjoy explaining and teaching',
'["Identify what you want to learn", "Prepare naive questions that invite explanation", "Express genuine interest and curiosity", "Let them be the expert", "Build on their explanations with deeper questions"]',
ARRAY['experts', 'teachers', 'proud_professionals'],
ARRAY['suspicious_types', 'those_who_know_your_expertise'],
ARRAY['Extended explanations', 'Visible enjoyment teaching', 'Offers to share more'],
'intermediate', 'Maintain integrity - don''t use against them later', 'Apply deliberate naivety with {contact_name} about {topic} to learn {specific_info}'),

('Flattery Elicitation', 'elicitation', 'information_gathering', 'Use genuine compliments to open them up and encourage sharing.', 'Psychology of reciprocity - Praise opens doors to disclosure',
'["Identify something genuinely praiseworthy", "Deliver specific, sincere compliment", "Ask how they achieved it", "Show genuine interest in details", "Let them elaborate freely"]',
ARRAY['achievement_oriented', 'ego_driven', 'proud_professionals'],
ARRAY['self_deprecating', 'flattery_suspicious'],
ARRAY['Extended stories', 'Visible pleasure', 'Offers to share secrets of success'],
'basic', 'Flattery must be genuine and specific', 'Use flattery elicitation with {contact_name} about their {achievement} to learn {desired_info}'),

('Quid Pro Quo', 'elicitation', 'information_gathering', 'Share information first to encourage reciprocal sharing.', 'Reciprocity norm - Sharing invites sharing',
'["Identify what you want to learn", "Prepare related information you can share first", "Share your information naturally", "Create conversational opening for them to share", "Don''t make it transactional"]',
ARRAY['fair_minded', 'relationship_oriented', 'reciprocators'],
ARRAY['takers', 'information_hoarders'],
ARRAY['\"Actually, in my case...\"', 'Matched level of detail', 'Continuation of sharing dynamic'],
'intermediate', 'Only share what you''re comfortable being known', 'Design quid pro quo exchange with {contact_name} to learn about {topic}'),

('Assumed Knowledge', 'elicitation', 'information_gathering', 'Speak as if you already know something to get confirmation and details.', 'Intelligence tradecraft - Confidence suggests knowledge',
'["Make educated guess about information", "State it confidently as if known", "Watch for confirmation or correction", "Ask for elaboration naturally", "Never reveal you were guessing"]',
ARRAY['confirmers', 'gossips', 'sharers'],
ARRAY['secretive_types', 'highly_skeptical'],
ARRAY['Confirmation with additional details', 'Elaboration on the topic', 'No suspicion raised'],
'advanced', 'High skill required - wrong guesses damage credibility', 'Apply assumed knowledge with {contact_name} about {suspected_info}'),

-- CONFLICT RESOLUTION
('Non-Violent Communication', 'conflict', 'resolution', 'Use observation, feeling, need, request framework to resolve conflicts constructively.', 'Rosenberg (1960s) - NVC removes blame and invites cooperation',
'["Describe the situation objectively (observation)", "State how it makes you feel (feeling)", "Explain the underlying need (need)", "Make a specific request (request)", "Listen to their response with same framework"]',
ARRAY['emotional_conflicts', 'recurring_issues', 'important_relationships'],
ARRAY['pure_logical_disputes', 'those_who_dismiss_feelings'],
ARRAY['Defensive posture drops', 'They express their own needs', 'Collaborative solution emerges'],
'intermediate', 'Requires genuine vulnerability', 'Guide NVC conversation with {contact_name} about conflict {conflict_description}'),

('Interest-Based Bargaining', 'conflict', 'negotiation', 'Focus on underlying interests rather than stated positions.', 'Fisher & Ury (1981) - Getting to Yes principles',
'["Identify their stated position", "Ask WHY they want that (find interests)", "Share your interests openly", "Brainstorm options that satisfy both interests", "Agree on objective criteria"]',
ARRAY['negotiators', 'reasonable_types', 'problem_solvers'],
ARRAY['position_entrenched', 'win_lose_mentality'],
ARRAY['Shift from demands to discussion', 'Creative solutions emerge', 'Both feel heard'],
'intermediate', 'Requires genuine interest in their needs', 'Apply interest-based approach with {contact_name} for negotiation about {topic}'),

('Face-Saving Exit', 'conflict', 'resolution', 'Provide ways for the other person to change position without losing dignity.', 'Goffman (1967) - Face and social identity must be preserved',
'["Understand their current position", "Identify why changing feels threatening", "Provide new information that justifies change", "Frame change as their idea or evolution", "Never reference their previous position"]',
ARRAY['prideful_types', 'public_positions', 'ego_invested'],
ARRAY['humble_types', 'those_who_admit_mistakes_easily'],
ARRAY['Position shift without argument', 'Grateful body language', 'Relationship preserved'],
'advanced', 'Sincere respect for their dignity required', 'Create face-saving path for {contact_name} to change position on {topic}'),

-- TRUST BUILDING
('Consistency Demonstration', 'trust', 'reliability', 'Build trust through reliable, predictable behavior over time.', 'Trust literature - Reliability is foundational to trust',
'["Make only promises you can keep", "Follow through consistently on all commitments", "Be predictable in your responses", "Acknowledge and apologize for any failures", "Maintain consistent behavior over time"]',
ARRAY['trust_damaged', 'new_relationships', 'skeptics'],
ARRAY['none'],
ARRAY['They stop checking up on you', 'Increased autonomy given', 'They vouch for you'],
'basic', 'Requires genuine commitment to reliability', 'Build consistency trust with {contact_name} focusing on {commitment_areas}'),

('Competence Display', 'trust', 'credibility', 'Subtly demonstrate your expertise and capability.', 'Trust literature - Competence trust enables risk-taking',
'["Identify competencies that matter to them", "Look for natural opportunities to demonstrate", "Share relevant successes naturally", "Offer helpful expertise", "Never brag - show don''t tell"]',
ARRAY['performance_oriented', 'outcome_focused', 'professional_contexts'],
ARRAY['egalitarians', 'those_who_feel_inferior'],
ARRAY['They seek your opinion', 'They reference your expertise', 'They recommend you to others'],
'intermediate', 'Only demonstrate genuine competence', 'Display competence to {contact_name} in areas of {relevant_competencies}'),

('Benevolence Proof', 'trust', 'care', 'Demonstrate that you genuinely care about their wellbeing.', 'Trust literature - Benevolence trust creates loyalty',
'["Learn what matters most to them", "Take actions that benefit them without benefit to you", "Remember and follow up on personal matters", "Be available during difficult times", "Celebrate their successes genuinely"]',
ARRAY['relationship_oriented', 'loyalty_focused', 'emotional_types'],
ARRAY['purely_transactional', 'suspicious_of_kindness'],
ARRAY['Increased personal sharing', 'Loyalty during conflicts', 'They go above and beyond for you'],
'intermediate', 'Must be genuine - fake care is detected', 'Demonstrate benevolence to {contact_name} through actions related to {their_priorities}'),

-- INFLUENCE TECHNIQUES
('Anchoring', 'influence', 'cognitive_bias', 'Set an initial reference point that shapes subsequent judgments.', 'Tversky & Kahneman - Anchoring and adjustment heuristic',
'["Identify the dimension to anchor", "Set your anchor strategically high or low", "Present anchor early and confidently", "Let them adjust from your anchor", "Use multiple anchors for reinforcement"]',
ARRAY['numerical_negotiators', 'comparison_shoppers', 'analytical_types'],
ARRAY['anchoring_aware', 'highly_analytical'],
ARRAY['Their counter is near your anchor', 'They reference your numbers', 'Negotiation stays in your range'],
'intermediate', 'Anchors should be justifiable, not absurd', 'Create anchoring strategy for {contact_name} in negotiation about {topic}'),

('Framing', 'influence', 'cognitive_bias', 'Present the same information in a way that emphasizes desired interpretation.', 'Tversky & Kahneman - Framing effects on choice',
'["Identify the decision you want influenced", "Determine which frame benefits your goal", "Choose gain frame, loss frame, or risk frame", "Present information consistently in that frame", "Reinforce frame throughout conversation"]',
ARRAY['everyone', 'especially_risk_averse', 'emotional_deciders'],
ARRAY['frame_aware', 'naturally_reframers'],
ARRAY['They use your framing language', 'Decision aligns with frame', 'No reframing attempts'],
'intermediate', 'Use ethically - framing should illuminate truth', 'Frame {topic} for {contact_name} using {frame_type} frame'),

('Strategic Timing', 'influence', 'context', 'Choose the optimal moment for requests and important conversations.', 'Decision fatigue and circadian research - Timing affects judgment',
'["Research their schedule and energy patterns", "Identify their peak decision-making times", "Avoid times of stress or fatigue", "Create positive context before important asks", "Use natural transition moments"]',
ARRAY['busy_executives', 'stressed_professionals', 'schedule_driven'],
ARRAY['always_available', 'no_pattern_types'],
ARRAY['Higher agreement rates', 'Better quality engagement', 'More thoughtful responses'],
'basic', 'Respect their time and energy', 'Determine optimal timing for approaching {contact_name} about {topic}'),

('Choice Architecture', 'influence', 'decision_design', 'Structure choices to make desired option most appealing.', 'Thaler & Sunstein - Nudge theory',
'["Identify the choice you want them to make", "Limit options to 2-4", "Make preferred option the default", "Order options strategically", "Use decoy options if appropriate"]',
ARRAY['decision_paralyzed', 'option_overwhelmed', 'preference_unclear'],
ARRAY['control_oriented', 'suspicious_of_structure'],
ARRAY['Quick decision', 'Choice of desired option', 'No resentment'],
'intermediate', 'All options should be genuinely acceptable', 'Design choice architecture for {contact_name} regarding {decision}'),

('Story-Based Persuasion', 'influence', 'narrative', 'Use stories instead of arguments to change minds and motivate action.', 'Narrative transportation theory - Stories bypass resistance',
'["Identify the belief or action you want to influence", "Find or create relevant story with similar elements", "Tell story with vivid details and emotion", "Let them draw the conclusion", "Never state the moral explicitly"]',
ARRAY['narrative_thinkers', 'emotional_types', 'resistant_to_logic'],
ARRAY['pure_analytical', 'story_impatient'],
ARRAY['They retell your story', 'Conclusions align with story message', 'Emotional engagement during story'],
'intermediate', 'Stories must be true or clearly labeled as hypothetical', 'Create persuasive story for {contact_name} to influence {belief_or_action}'),

-- PROFILING TECHNIQUES
('Behavioral Baseline', 'profiling', 'observation', 'Establish normal patterns to detect significant changes.', 'Behavioral analysis - Deviation detection requires baseline',
'["Observe behavior across multiple normal interactions", "Note patterns in speech, body language, topics", "Document baseline metrics", "Monitor for deviations", "Investigate significant changes"]',
ARRAY['all_important_relationships', 'deception_detection_needed'],
ARRAY['none'],
ARRAY['Accurate deviation detection', 'Early warning of problems', 'Better understanding of normal'],
'basic', 'Observation should be natural, not surveillance', 'Establish behavioral baseline for {contact_name} across dimensions of {dimensions}'),

('Values Elicitation', 'profiling', 'understanding', 'Discover their core values through conversation and observation.', 'Schwartz values theory - Values predict behavior',
'["Listen for value-laden language", "Ask about important decisions and why", "Note what they praise and criticize", "Observe where they spend time and money", "Identify value hierarchies"]',
ARRAY['everyone', 'especially_new_relationships'],
ARRAY['none'],
ARRAY['Accurate prediction of their reactions', 'Better gift/approach selection', 'Deeper relationship'],
'intermediate', 'Use understanding to help, not manipulate', 'Elicit core values of {contact_name} from their behavior and statements about {observations}'),

('Motivation Mapping', 'profiling', 'understanding', 'Identify what drives their behavior and decisions.', 'Self-Determination Theory - Autonomy, competence, relatedness',
'["Observe what energizes them", "Note what they avoid or resist", "Ask about dreams and frustrations", "Identify fears and desires", "Map intrinsic vs extrinsic motivations"]',
ARRAY['important_relationships', 'motivation_unclear', 'influence_needed'],
ARRAY['none'],
ARRAY['Better offers and asks', 'Accurate prediction', 'Deeper connection'],
'intermediate', 'Respect their motivations, don''t exploit', 'Map motivations of {contact_name} for context of {context}'),

-- INFORMATION FLOW
('Information Control', 'information', 'flow', 'Strategically manage what information you share and when.', 'Information economics - Information is power',
'["Identify your information assets", "Assess value to them vs cost to you", "Release information strategically", "Use information as relationship currency", "Maintain information advantages"]',
ARRAY['negotiation_contexts', 'competitive_situations'],
ARRAY['close_trusted_relationships'],
ARRAY['Information trades for value', 'Strategic advantage maintained', 'Trust not damaged'],
'advanced', 'Never lie - control is about timing and selection', 'Design information sharing strategy with {contact_name} for {context}'),

('Intelligence Gathering', 'information', 'collection', 'Systematically collect information about contact through ethical means.', 'OSINT principles - Open source intelligence gathering',
'["Search public sources thoroughly", "Analyze social media presence", "Map network connections", "Track public statements and changes", "Compile and analyze patterns"]',
ARRAY['new_important_contacts', 'preparation_for_meetings'],
ARRAY['none'],
ARRAY['Comprehensive understanding', 'Better prepared interactions', 'No gaps in knowledge'],
'basic', 'Only use ethical, public sources', 'Gather intelligence on {contact_name} focusing on {focus_areas}'),

('Network Leverage', 'information', 'influence', 'Use understanding of their network for strategic advantage.', 'Social network theory - Position determines influence',
'["Map their key relationships", "Identify influencers in their network", "Find connection paths through mutual contacts", "Use network effects strategically", "Build relationships with their influencers"]',
ARRAY['networking_contexts', 'influence_campaigns'],
ARRAY['isolated_individuals'],
ARRAY['Warm introductions received', 'Positive third-party references', 'Network effects working'],
'advanced', 'Genuine relationship with network, not manipulation', 'Leverage network for influence with {contact_name} through connections to {key_contacts}')

ON CONFLICT DO NOTHING;

-- Add more methodologies
INSERT INTO public.intelligence_methodologies (name, category, subcategory, description, psychological_basis, technique_steps, best_for, contraindications, success_indicators, difficulty_level, ethical_considerations) VALUES

('Emotional Labeling', 'rapport', 'emotional', 'Name the emotion they seem to be experiencing to build connection.', 'Lieberman (2007) - Labeling reduces emotional intensity and increases trust', 
'["Observe their emotional state", "Choose accurate emotion label", "Offer label tentatively: \"It sounds like you might be feeling...\"", "Let them confirm or correct", "Validate the emotion"]',
ARRAY['emotional_situations', 'conflict', 'stress'],
ARRAY['emotionally_dismissive'],
ARRAY['Visible relief', 'Agreement with label', 'Deeper sharing'],
'intermediate', 'Use with genuine empathy'),

('Future Pacing', 'influence', 'visualization', 'Help them visualize positive future with your desired outcome.', 'NLP/Ericksonian hypnosis - Future visualization motivates action',
'["Understand their goals and desires", "Paint vivid picture of future success", "Include sensory details", "Place your proposal within that future", "Let them feel the positive emotions"]',
ARRAY['visual_thinkers', 'goal_oriented', 'dreamers'],
ARRAY['pessimists', 'skeptics'],
ARRAY['Engaged visualization', 'Positive emotions visible', 'Commitment to path'],
'intermediate', 'Future must be genuinely possible'),

('Strategic Silence', 'influence', 'conversation', 'Use purposeful pauses to create space for reflection and disclosure.', 'Negotiation research - Silence is uncomfortable and prompts response',
'["Make your key point or question", "Resist urge to fill silence", "Maintain comfortable eye contact", "Wait for them to speak first", "Use silence as emphasis tool"]',
ARRAY['over_talkers', 'negotiation', 'sales'],
ARRAY['anxious_types_who_need_reassurance'],
ARRAY['They fill the silence', 'More information disclosed', 'Concessions made'],
'intermediate', 'Silence should feel natural, not aggressive'),

('Contrast Principle', 'persuasion', 'cognitive_bias', 'Present options in sequence that makes desired choice more appealing.', 'Cialdini - Contrast makes differences more pronounced',
'["Identify your desired option", "Present inferior option first", "Show the contrast clearly", "Or show much more expensive option first", "Let contrast work naturally"]',
ARRAY['price_sensitive', 'comparison_shoppers'],
ARRAY['analytical_types_who_see_through'],
ARRAY['Quick acceptance of contrasted option', 'Reference to comparison', 'Relief expression'],
'basic', 'All options should be genuine'),

('Ben Franklin Effect', 'rapport', 'psychology', 'Ask them for a small favor to increase their liking of you.', 'Cognitive dissonance - We like those we help',
'["Identify a small favor they can do", "Ask for it genuinely", "Accept with gratitude", "Follow up appropriately", "Their brain rationalizes they must like you"]',
ARRAY['initially_resistant', 'relationship_building'],
ARRAY['extremely_busy', 'favor_allergic'],
ARRAY['Warmer subsequent interactions', 'Unsolicited offers to help', 'Attitude shift visible'],
'basic', 'Favor must be reasonable and appreciated'),

('Pattern Interrupt', 'influence', 'attention', 'Break expected patterns to capture attention and bypass automatic responses.', 'Cognitive psychology - Unexpected stimuli get processed consciously',
'["Identify their automatic responses", "Prepare unexpected opening or action", "Deliver the interrupt", "Move quickly to new frame", "Establish new pattern"]',
ARRAY['automatic_rejectors', 'scripted_responders'],
ARRAY['anxious_types', 'need_for_predictability'],
ARRAY['Visible surprise', 'Engagement increases', 'Normal script abandoned'],
'advanced', 'Interrupt should be positive, not jarring'),

('Presupposition Usage', 'influence', 'language', 'Embed desired outcomes as assumptions in your language.', 'NLP/Linguistics - Presuppositions bypass critical evaluation',
'["Identify what you want them to accept", "Embed it as background assumption", "Use words like \"when\", \"which\", \"how\"", "Let them focus on surface question", "Assumption becomes accepted"]',
ARRAY['language_responsive', 'non_analytical'],
ARRAY['linguistically_aware', 'highly_analytical'],
ARRAY['No challenge to assumption', 'Discussion proceeds on your terms', 'Assumption referenced later'],
'advanced', 'Use ethically - presuppositions should be true'),

('Momentum Building', 'persuasion', 'sequence', 'Build series of agreements before the key ask.', 'Yes-set - Agreeing becomes pattern',
'["Prepare 3-5 statements they will agree with", "Get explicit agreement on each", "Build rhythm and momentum", "Move seamlessly to key request", "Maintain same tone and pace"]',
ARRAY['agreeable_types', 'positive_oriented'],
ARRAY['contrarians', 'disagreeable_types'],
ARRAY['Repeated \"yes\" responses', 'Agreement momentum visible', 'Key request accepted'],
'basic', 'All statements must be genuinely true'),

('Controlled Disclosure', 'rapport', 'trust', 'Share personal information strategically to build intimacy.', 'Social penetration theory - Gradual disclosure builds relationships',
'["Assess current intimacy level", "Choose appropriate disclosure level", "Share genuinely but strategically", "Match their disclosure level", "Gradually increase depth over time"]',
ARRAY['new_relationships', 'trust_building'],
ARRAY['exploitation_risk', 'gossips'],
ARRAY['Matched disclosure', 'Relationship deepening', 'Future references to shared info'],
'intermediate', 'Never share what could harm you'),

('Environmental Priming', 'influence', 'context', 'Set up the physical or contextual environment to influence behavior.', 'Priming research - Environment affects cognition and behavior',
'["Understand desired outcome", "Identify environmental factors that support it", "Control meeting location if possible", "Use props, seating, temperature strategically", "Create positive associations"]',
ARRAY['in_person_meetings', 'negotiation'],
ARRAY['remote_only', 'uncontrollable_contexts'],
ARRAY['Desired behaviors emerge', 'Positive associations formed', 'Better outcomes'],
'intermediate', 'Environment should feel natural')

ON CONFLICT DO NOTHING;