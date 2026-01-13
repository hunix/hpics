/**
 * @fileoverview Master Integration Registry
 * Single source of truth for all external integrations
 * 
 * This registry defines all available integrations, their required secrets,
 * which edge functions use them, and their documentation URLs.
 */

import { 
  Search, Brain, Users, Linkedin, Mail, Share2, 
  Sparkles, Zap, Newspaper, Globe, Send, Calendar,
  MessageCircle, Volume2, Bell, Shield, Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationCategory = 
  | 'connectors'        // Lovable Connectors (pre-configured)
  | 'people-intel'      // People Intelligence APIs
  | 'social-media'      // Social Media Data
  | 'research-search'   // Research & Search
  | 'email-calendar'    // Email & Calendar
  | 'notifications'     // Push & Email Notifications
  | 'ai-models'         // External AI Providers
  | 'voice-media';      // Voice & Media Processing

export type IntegrationStatus = 'configured' | 'partial' | 'not-configured' | 'connector';

export interface IntegrationSecret {
  key: string;
  label: string;
  description?: string;
  isOptional?: boolean;
  placeholder?: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: IntegrationCategory;
  
  // Secret configuration
  secrets: IntegrationSecret[];
  
  // Which edge functions use this integration
  edgeFunctions?: string[];
  
  // Features unlocked by this integration
  features: string[];
  
  // Documentation
  docsUrl: string;
  
  // Is this a Lovable Connector (pre-configured)?
  isConnector?: boolean;
  
  // Priority for display (higher = more important)
  priority?: number;
}

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const CATEGORY_INFO: Record<IntegrationCategory, {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}> = {
  'connectors': {
    label: 'Connected Services',
    description: 'Pre-configured via Lovable Connectors - ready to use',
    icon: Zap,
    color: 'emerald',
  },
  'people-intel': {
    label: 'People Intelligence',
    description: 'Person & company enrichment APIs for deep profile data',
    icon: Users,
    color: 'blue',
  },
  'social-media': {
    label: 'Social Media',
    description: 'Social platform data extraction and monitoring',
    icon: Share2,
    color: 'purple',
  },
  'research-search': {
    label: 'Research & Search',
    description: 'Web search, news monitoring, and data extraction',
    icon: Search,
    color: 'amber',
  },
  'email-calendar': {
    label: 'Email & Calendar',
    description: 'Email sending and calendar synchronization',
    icon: Mail,
    color: 'rose',
  },
  'notifications': {
    label: 'Notifications',
    description: 'Push notifications and alert delivery',
    icon: Bell,
    color: 'orange',
  },
  'ai-models': {
    label: 'AI Models',
    description: 'External AI providers and model endpoints',
    icon: Brain,
    color: 'violet',
  },
  'voice-media': {
    label: 'Voice & Media',
    description: 'Voice synthesis and media processing',
    icon: Volume2,
    color: 'cyan',
  },
};

// ============================================================================
// INTEGRATION DEFINITIONS
// ============================================================================

export const INTEGRATIONS: IntegrationDefinition[] = [
  // ===== CONNECTORS (Pre-configured via Lovable) =====
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'AI-powered web scraping and search for OSINT data gathering',
    icon: Search,
    category: 'connectors',
    secrets: [{ key: 'FIRECRAWL_API_KEY', label: 'API Key' }],
    edgeFunctions: ['web-scraper', 'enrichment-orchestrator'],
    features: ['Web search', 'Page scraping', 'Structured extraction'],
    docsUrl: 'https://firecrawl.dev/docs',
    isConnector: true,
    priority: 100,
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    description: 'AI-powered real-time web search with grounded, cited responses',
    icon: Brain,
    category: 'connectors',
    secrets: [{ key: 'PERPLEXITY_API_KEY', label: 'API Key' }],
    edgeFunctions: ['perplexity-search', 'analysis-orchestrator'],
    features: ['AI search', 'Real-time data', 'Source citations'],
    docsUrl: 'https://docs.perplexity.ai',
    isConnector: true,
    priority: 100,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice generation, text-to-speech, and speech-to-text',
    icon: Volume2,
    category: 'connectors',
    secrets: [{ key: 'ELEVENLABS_API_KEY', label: 'API Key' }],
    edgeFunctions: ['voice-synthesis', 'audio-analysis'],
    features: ['Text-to-speech', 'Voice cloning', 'Speech-to-text'],
    docsUrl: 'https://elevenlabs.io/docs',
    isConnector: true,
    priority: 90,
  },

  // ===== PEOPLE INTELLIGENCE =====
  {
    id: 'peopledatalabs',
    name: 'People Data Labs',
    description: 'Professional data enrichment with 3B+ person records worldwide',
    icon: Users,
    category: 'people-intel',
    secrets: [{ key: 'PDL_API_KEY', label: 'API Key' }],
    edgeFunctions: ['enrich-profile', 'analysis-orchestrator'],
    features: ['Person enrichment', 'Job history', 'Skills & education', 'Social profiles'],
    docsUrl: 'https://docs.peopledatalabs.com',
    priority: 80,
  },
  {
    id: 'proxycurl',
    name: 'Proxycurl',
    description: 'LinkedIn profile and company data extraction at scale',
    icon: Linkedin,
    category: 'people-intel',
    secrets: [{ key: 'PROXYCURL_API_KEY', label: 'API Key' }],
    edgeFunctions: ['enrich-profile', 'linkedin-scraper'],
    features: ['LinkedIn profiles', 'Company data', 'Employee search'],
    docsUrl: 'https://nubela.co/proxycurl/docs',
    priority: 75,
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    description: 'Email verification and company domain intelligence',
    icon: Mail,
    category: 'people-intel',
    secrets: [{ key: 'HUNTER_API_KEY', label: 'API Key' }],
    edgeFunctions: ['enrich-profile', 'email-finder'],
    features: ['Email verification', 'Domain search', 'Email finder'],
    docsUrl: 'https://hunter.io/api-documentation',
    priority: 70,
  },

  // ===== SOCIAL MEDIA =====
  {
    id: 'rapidapi',
    name: 'RapidAPI Social',
    description: 'Multi-platform social media data from Instagram, Twitter, TikTok',
    icon: Share2,
    category: 'social-media',
    secrets: [{ key: 'RAPIDAPI_KEY', label: 'RapidAPI Key' }],
    edgeFunctions: ['social-scraper', 'instagram-api', 'twitter-api'],
    features: ['Instagram data', 'Twitter/X profiles', 'TikTok stats', 'Engagement metrics'],
    docsUrl: 'https://rapidapi.com/hub',
    priority: 70,
  },

  // ===== RESEARCH & SEARCH =====
  {
    id: 'diffbot',
    name: 'Diffbot',
    description: 'AI-powered web data extraction and knowledge graph',
    icon: Sparkles,
    category: 'research-search',
    secrets: [{ key: 'DIFFBOT_API_KEY', label: 'API Key' }],
    edgeFunctions: ['web-scraper', 'entity-extraction'],
    features: ['Article extraction', 'Entity recognition', 'Knowledge graph'],
    docsUrl: 'https://docs.diffbot.com',
    priority: 60,
  },
  {
    id: 'tavily',
    name: 'Tavily AI Search',
    description: 'AI-optimized web search designed for intelligent research',
    icon: Zap,
    category: 'research-search',
    secrets: [{ key: 'TAVILY_API_KEY', label: 'API Key' }],
    edgeFunctions: ['web-search', 'research-agent'],
    features: ['AI search', 'Research mode', 'Source extraction'],
    docsUrl: 'https://docs.tavily.com',
    priority: 55,
  },
  {
    id: 'newsapi',
    name: 'News API',
    description: 'Monitor news mentions and media coverage of your contacts',
    icon: Newspaper,
    category: 'research-search',
    secrets: [{ key: 'NEWS_API_KEY', label: 'API Key' }],
    edgeFunctions: ['news-monitor', 'media-coverage'],
    features: ['News search', 'Headline monitoring', 'Source filtering'],
    docsUrl: 'https://newsapi.org/docs',
    priority: 50,
  },
  {
    id: 'google_search',
    name: 'Google Custom Search',
    description: 'Deep web search for public information and mentions',
    icon: Globe,
    category: 'research-search',
    secrets: [
      { key: 'GOOGLE_SEARCH_API_KEY', label: 'API Key' },
      { key: 'GOOGLE_SEARCH_CX', label: 'Search Engine ID (CX)', isOptional: true },
    ],
    edgeFunctions: ['web-search', 'google-search'],
    features: ['Web search', 'Image search', 'Site-specific search'],
    docsUrl: 'https://developers.google.com/custom-search',
    priority: 45,
  },

  // ===== EMAIL & CALENDAR =====
  {
    id: 'resend',
    name: 'Resend',
    description: 'Modern email API for transactional and marketing emails',
    icon: Send,
    category: 'email-calendar',
    secrets: [{ key: 'RESEND_API_KEY', label: 'API Key' }],
    edgeFunctions: ['send-email', 'email-notifications'],
    features: ['Transactional emails', 'Email templates', 'Delivery tracking'],
    docsUrl: 'https://resend.com/docs',
    priority: 80,
  },
  {
    id: 'gmail',
    name: 'Gmail Integration',
    description: 'Connect Gmail for email sync and communication tracking',
    icon: Mail,
    category: 'email-calendar',
    secrets: [
      { key: 'GOOGLE_GMAIL_CLIENT_ID', label: 'OAuth Client ID' },
      { key: 'GOOGLE_GMAIL_CLIENT_SECRET', label: 'OAuth Client Secret' },
    ],
    edgeFunctions: ['gmail-oauth', 'sync-gmail-emails'],
    features: ['Email sync', 'Communication history', 'Auto-logging'],
    docsUrl: 'https://developers.google.com/gmail/api',
    priority: 75,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync calendar events and meeting schedules',
    icon: Calendar,
    category: 'email-calendar',
    secrets: [
      { key: 'GOOGLE_CALENDAR_CLIENT_ID', label: 'OAuth Client ID' },
      { key: 'GOOGLE_CALENDAR_CLIENT_SECRET', label: 'OAuth Client Secret' },
    ],
    edgeFunctions: ['calendar-sync', 'google-calendar-events'],
    features: ['Event sync', 'Meeting detection', 'Auto-scheduling'],
    docsUrl: 'https://developers.google.com/calendar',
    priority: 70,
  },

  // ===== NOTIFICATIONS =====
  {
    id: 'vapid',
    name: 'Web Push (VAPID)',
    description: 'Browser push notifications for real-time alerts',
    icon: Bell,
    category: 'notifications',
    secrets: [
      { key: 'VAPID_PUBLIC_KEY', label: 'VAPID Public Key' },
      { key: 'VAPID_PRIVATE_KEY', label: 'VAPID Private Key' },
    ],
    edgeFunctions: ['send-push-notification', 'push-notifications'],
    features: ['Push notifications', 'Real-time alerts', 'Background updates'],
    docsUrl: 'https://web.dev/push-notifications-overview/',
    priority: 60,
  },

  // ===== VOICE & MEDIA =====
  {
    id: 'whisper',
    name: 'OpenAI Whisper',
    description: 'Speech recognition and audio transcription',
    icon: Volume2,
    category: 'voice-media',
    secrets: [{ key: 'OPENAI_API_KEY', label: 'OpenAI API Key' }],
    edgeFunctions: ['transcribe-audio', 'voice-analysis'],
    features: ['Audio transcription', 'Multi-language', 'Speaker detection'],
    docsUrl: 'https://platform.openai.com/docs/guides/speech-to-text',
    priority: 50,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all unique secret keys from the registry
 */
export function getAllSecretKeys(): string[] {
  const keys = new Set<string>();
  for (const integration of INTEGRATIONS) {
    for (const secret of integration.secrets) {
      keys.add(secret.key);
    }
  }
  return Array.from(keys);
}

/**
 * Get integrations grouped by category
 */
export function getIntegrationsByCategory(): Record<IntegrationCategory, IntegrationDefinition[]> {
  const grouped: Record<IntegrationCategory, IntegrationDefinition[]> = {
    'connectors': [],
    'people-intel': [],
    'social-media': [],
    'research-search': [],
    'email-calendar': [],
    'notifications': [],
    'ai-models': [],
    'voice-media': [],
  };
  
  for (const integration of INTEGRATIONS) {
    grouped[integration.category].push(integration);
  }
  
  // Sort by priority within each category
  for (const category of Object.keys(grouped) as IntegrationCategory[]) {
    grouped[category].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  return grouped;
}

/**
 * Get integration by ID
 */
export function getIntegrationById(id: string): IntegrationDefinition | undefined {
  return INTEGRATIONS.find(i => i.id === id);
}

/**
 * Get all secret keys for a specific integration
 */
export function getSecretKeysForIntegration(id: string): string[] {
  const integration = getIntegrationById(id);
  return integration?.secrets.map(s => s.key) || [];
}

/**
 * Check if integration is a connector (pre-configured)
 */
export function isConnector(id: string): boolean {
  return getIntegrationById(id)?.isConnector ?? false;
}

/**
 * Get the order of categories for display
 */
export const CATEGORY_ORDER: IntegrationCategory[] = [
  'connectors',
  'people-intel',
  'social-media',
  'research-search',
  'email-calendar',
  'notifications',
  'voice-media',
  'ai-models',
];
