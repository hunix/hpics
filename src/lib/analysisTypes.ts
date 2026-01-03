// Analysis types with their default models and descriptions
export interface AnalysisTypeConfig {
  key: string;
  name: string;
  description: string;
  defaultModel: string;
  category: 'profile' | 'behavioral' | 'communication' | 'suggestion';
}

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
