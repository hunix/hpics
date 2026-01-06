// Analysis types with their default models and descriptions
export interface AnalysisTypeConfig {
  key: string;
  name: string;
  description: string;
  defaultModel: string;
  category: 'profile' | 'behavioral' | 'communication' | 'suggestion';
}

// Media format-specific analysis modes
export interface MediaAnalysisMode {
  key: string;
  name: string;
  description: string;
  icon: string;
  defaultModel: string;
}

export type MediaType = 'image' | 'audio' | 'video' | 'document';

export const MEDIA_ANALYSIS_MODES: Record<MediaType, MediaAnalysisMode[]> = {
  image: [
    { key: 'face_intelligence', name: 'Face Intelligence', description: 'Deep facial analysis, emotion, identity, age estimation', icon: 'User', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'scene_intelligence', name: 'Scene Intelligence', description: 'Location, context, event detection, environment analysis', icon: 'MapPin', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'document_extraction', name: 'Document Extraction', description: 'OCR, form data, handwriting, text extraction', icon: 'FileText', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'lifestyle_profiling', name: 'Lifestyle Profiling', description: 'Interests, wealth indicators, habits, preferences', icon: 'Sparkles', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'relationship_mapping', name: 'Relationship Mapping', description: 'People identification, group dynamics, social context', icon: 'Users', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'security_scan', name: 'Security Scan', description: 'Sensitive content detection, privacy risks, anomalies', icon: 'Shield', defaultModel: 'google/gemini-2.5-flash' },
  ],
  audio: [
    { key: 'transcription_plus', name: 'Smart Transcription', description: 'Full transcription with speaker labels and timestamps', icon: 'FileAudio', defaultModel: 'elevenlabs/scribe' },
    { key: 'vocal_psychology', name: 'Vocal Psychology', description: 'Stress patterns, deception indicators, emotional state', icon: 'Brain', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'content_intelligence', name: 'Content Intelligence', description: 'Topics, entities, action items, commitments', icon: 'Lightbulb', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'conversation_dynamics', name: 'Conversation Dynamics', description: 'Power balance, rapport, turn-taking analysis', icon: 'MessageSquare', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'sentiment_timeline', name: 'Sentiment Timeline', description: 'Emotional journey over time, mood shifts', icon: 'TrendingUp', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'speaker_profiling', name: 'Speaker Profiling', description: 'Voice characteristics, speaking style per speaker', icon: 'UserCheck', defaultModel: 'google/gemini-2.5-pro' },
  ],
  video: [
    { key: 'behavioral_full', name: 'Full Behavioral', description: 'Body language + facial + vocal combined analysis', icon: 'Video', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'interaction_analysis', name: 'Interaction Analysis', description: 'Multi-person dynamics, influence patterns', icon: 'Users', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'temporal_emotions', name: 'Temporal Emotions', description: 'Emotional timeline across video duration', icon: 'Clock', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'micro_expression_scan', name: 'Micro-Expression Scan', description: 'Hidden emotions, deception tells, stress signals', icon: 'Eye', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'engagement_metrics', name: 'Engagement Metrics', description: 'Attention tracking, interest levels, disengagement', icon: 'Activity', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'scene_narrative', name: 'Scene Narrative', description: 'Story arc, key moments, context transitions', icon: 'Film', defaultModel: 'google/gemini-2.5-flash' },
  ],
  document: [
    { key: 'entity_extraction', name: 'Entity Extraction', description: 'People, organizations, amounts, dates, locations', icon: 'Database', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'relationship_intelligence', name: 'Relationship Intel', description: 'Connections, power dynamics, hierarchies', icon: 'Network', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'legal_analysis', name: 'Legal Analysis', description: 'Clauses, obligations, risks, compliance', icon: 'Scale', defaultModel: 'google/gemini-2.5-pro' },
    { key: 'financial_analysis', name: 'Financial Analysis', description: 'Amounts, terms, commitments, patterns', icon: 'DollarSign', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'action_extraction', name: 'Action Extraction', description: 'Deadlines, follow-ups, decisions needed', icon: 'CheckSquare', defaultModel: 'google/gemini-2.5-flash' },
    { key: 'sentiment_tone', name: 'Sentiment & Tone', description: 'Document tone, urgency, formality level', icon: 'MessageCircle', defaultModel: 'google/gemini-2.5-flash' },
  ],
};

// Analysis context options
export interface AnalysisContext {
  purpose: 'personal' | 'business' | 'legal' | 'security' | 'social';
  relationship: 'direct_contact' | 'family_member' | 'colleague' | 'client' | 'unknown';
  expected_content?: 'meeting' | 'event' | 'document' | 'casual' | 'formal';
  focus_priority?: 'faces' | 'text' | 'emotions' | 'facts' | 'relationships';
  security_level?: 'public' | 'private' | 'confidential' | 'restricted';
}

export const ANALYSIS_PURPOSES = [
  { value: 'personal', label: 'Personal', description: 'Personal relationship management' },
  { value: 'business', label: 'Business', description: 'Professional context' },
  { value: 'legal', label: 'Legal', description: 'Legal/compliance review' },
  { value: 'security', label: 'Security', description: 'Security assessment' },
  { value: 'social', label: 'Social', description: 'Social context analysis' },
];

export const ANALYSIS_RELATIONSHIPS = [
  { value: 'direct_contact', label: 'Direct Contact', description: 'Primary relationship' },
  { value: 'family_member', label: 'Family Member', description: 'Family connection' },
  { value: 'colleague', label: 'Colleague', description: 'Work relationship' },
  { value: 'client', label: 'Client', description: 'Client/customer' },
  { value: 'unknown', label: 'Unknown', description: 'Unknown relationship' },
];

export const ANALYSIS_DEPTHS = [
  { value: 'quick', label: 'Quick', description: 'Fast overview, lower cost', estimatedTime: '10-30s' },
  { value: 'standard', label: 'Standard', description: 'Balanced depth and speed', estimatedTime: '30-60s' },
  { value: 'deep', label: 'Deep', description: 'Maximum intelligence extraction', estimatedTime: '1-3min' },
];

export const ANALYSIS_TYPES: AnalysisTypeConfig[] = [
  // Profile Analysis
  {
    key: 'analyze-profile',
    name: 'Profile Analysis',
    description: 'Personality profiling and Big Five traits analysis',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'profile',
  },
  {
    key: 'detect-interests',
    name: 'Interest Detection',
    description: 'Detect hobbies and interests from conversations',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'profile',
  },
  {
    key: 'enrich-contact',
    name: 'Contact Enrichment',
    description: 'Enrich contact profiles with additional data',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'profile',
  },
  
  // Behavioral Analysis
  {
    key: 'analyze-behavioral',
    name: 'Behavioral Analysis',
    description: 'Analyze behavioral patterns from video/audio',
    defaultModel: 'google/gemini-2.5-pro',
    category: 'behavioral',
  },
  {
    key: 'analyze-facial',
    name: 'Facial Analysis',
    description: 'Micro-expressions and emotional timeline',
    defaultModel: 'google/gemini-2.5-pro',
    category: 'behavioral',
  },
  {
    key: 'analyze-body-language',
    name: 'Body Language Analysis',
    description: 'Posture, gestures, and comfort indicators',
    defaultModel: 'google/gemini-2.5-pro',
    category: 'behavioral',
  },
  {
    key: 'analyze-vocal',
    name: 'Vocal Analysis',
    description: 'Speech patterns, stress points, mood changes',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'behavioral',
  },
  {
    key: 'transcribe-audio',
    name: 'Audio Transcription',
    description: 'Transcribe audio/video recordings',
    defaultModel: 'elevenlabs/scribe',
    category: 'behavioral',
  },
  
  // Communication & Relationship
  {
    key: 'calculate-relationship-scores',
    name: 'Relationship Scoring',
    description: 'Calculate relationship health scores',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'communication',
  },
  {
    key: 'predict-risks',
    name: 'Risk Prediction',
    description: 'Predict relationship decay risks',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'communication',
  },
  {
    key: 'generate-weekly-summary',
    name: 'Weekly Summary',
    description: 'Generate weekly relationship summaries',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'communication',
  },
  
  // Suggestions
  {
    key: 'suggest-followups',
    name: 'Follow-up Suggestions',
    description: 'AI-powered follow-up recommendations',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'suggestion',
  },
  {
    key: 'suggest-gifts',
    name: 'Gift Suggestions',
    description: 'Personalized gift recommendations',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'suggestion',
  },
  {
    key: 'suggest-introductions',
    name: 'Introduction Suggestions',
    description: 'Suggest mutual introductions',
    defaultModel: 'google/gemini-2.5-flash-lite',
    category: 'suggestion',
  },
  {
    key: 'suggest-outreach-timing',
    name: 'Optimal Outreach Timing',
    description: 'Best times to reach out',
    defaultModel: 'google/gemini-2.5-flash-lite',
    category: 'suggestion',
  },
  {
    key: 'generate-briefing',
    name: 'Meeting Briefing',
    description: 'Pre-meeting briefing generation',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'suggestion',
  },
  {
    key: 'generate-message-templates',
    name: 'Message Templates',
    description: 'Generate personalized message templates',
    defaultModel: 'google/gemini-2.5-flash',
    category: 'suggestion',
  },
];

export const getAnalysisTypeByKey = (key: string): AnalysisTypeConfig | undefined => {
  return ANALYSIS_TYPES.find(t => t.key === key);
};

export const getAnalysisTypesByCategory = (category: AnalysisTypeConfig['category']): AnalysisTypeConfig[] => {
  return ANALYSIS_TYPES.filter(t => t.category === category);
};
