/**
 * @fileoverview API Keys Registry — 7-section key definitions for HPICS
 */

import {
  Bot, Cpu, Globe, Search, Mic, MessageSquare, Radio,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ApiKeyDef {
  envVar: string;
  label: string;
  howToGet: string;
  portalUrl?: string;
  isUrl?: boolean;
  isSecret?: boolean;
  testable?: boolean;
  /** If present, this key is a model selector dropdown instead of text input */
  modelOptions?: string[];
}

export interface ApiKeySection {
  id: string;
  label: string;
  icon: LucideIcon;
  emoji: string;
  keys: ApiKeyDef[];
}

export const API_KEY_SECTIONS: ApiKeySection[] = [
  {
    id: 'llm-providers',
    label: 'LLM Providers',
    icon: Cpu,
    emoji: '🤖',
    keys: [
      { envVar: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude', howToGet: 'console.anthropic.com → Settings → API Keys → Create Key (sk-ant-...)', portalUrl: 'https://console.anthropic.com/settings/keys', isSecret: true, testable: true },
      { envVar: 'ANTHROPIC_MODEL', label: 'Claude Model', howToGet: 'Select the Claude model to use', modelOptions: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-haiku-4-20250514'] },
      { envVar: 'OPENAI_API_KEY', label: 'OpenAI', howToGet: 'platform.openai.com → API Keys → Create secret key (sk-...). Also used for Whisper voice + DALL-E image gen', portalUrl: 'https://platform.openai.com/api-keys', isSecret: true, testable: true },
      { envVar: 'OPENAI_MODEL', label: 'OpenAI Model', howToGet: 'Select the OpenAI model to use', modelOptions: ['gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'] },
      { envVar: 'GEMINI_API_KEY', label: 'Google Gemini', howToGet: 'aistudio.google.com → API Keys → Create. Also used in Vertex AI multimodal', portalUrl: 'https://aistudio.google.com/apikey', isSecret: true, testable: true },
      { envVar: 'GEMINI_MODEL', label: 'Gemini Model', howToGet: 'Select the Gemini model to use', modelOptions: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'] },
      { envVar: 'GROQ_API_KEY', label: 'Groq (fast inference)', howToGet: 'console.groq.com → API Keys → Create (gsk_...)', portalUrl: 'https://console.groq.com/keys', isSecret: true, testable: true },
      { envVar: 'OPENROUTER_API_KEY', label: 'OpenRouter', howToGet: 'openrouter.ai → Keys → Create (sk-or-...)', portalUrl: 'https://openrouter.ai/keys', isSecret: true },
      { envVar: 'DEEPSEEK_API_KEY', label: 'DeepSeek', howToGet: 'platform.deepseek.com → API Keys', portalUrl: 'https://platform.deepseek.com/api_keys', isSecret: true },
      { envVar: 'XAI_API_KEY', label: 'xAI Grok', howToGet: 'console.x.ai → API Keys', portalUrl: 'https://console.x.ai', isSecret: true },
      { envVar: 'MISTRAL_API_KEY', label: 'Mistral', howToGet: 'console.mistral.ai → API Keys', portalUrl: 'https://console.mistral.ai/api-keys', isSecret: true },
      { envVar: 'COHERE_API_KEY', label: 'Cohere (embeddings)', howToGet: 'dashboard.cohere.com → API Keys', portalUrl: 'https://dashboard.cohere.com/api-keys', isSecret: true },
      { envVar: 'PERPLEXITY_API_KEY', label: 'Perplexity (deep research)', howToGet: 'perplexity.ai → Settings → API → Generate', portalUrl: 'https://www.perplexity.ai/settings/api', isSecret: true },
    ],
  },
  {
    id: 'hpics-bridge',
    label: 'HPICS Bridge (HoC ↔ HPICS)',
    icon: Globe,
    emoji: '🧬',
    keys: [
      { envVar: 'HPICS_GATEWAY_URL', label: 'HPICS Gateway URL', howToGet: 'Edge Functions → hoc-gateway → copy invocation URL', isUrl: true },
      { envVar: 'HPICS_API_KEY', label: 'HPICS Shared Secret', howToGet: 'Generate: openssl rand -hex 32. Set same value here AND in HPICS Vault as HPICS_API_KEY', isSecret: true },
    ],
  },
  {
    id: 'supabase-layer',
    label: 'Supabase (HPICS Data Layer)',
    icon: Globe,
    emoji: '🗄️',
    keys: [
      { envVar: 'HPICS_SUPABASE_URL', label: 'HPICS Project URL', howToGet: 'Settings → API → Project URL', isUrl: true },
      { envVar: 'HPICS_SUPABASE_ANON_KEY', label: 'Anon Public Key', howToGet: 'Same page → anon public key', isSecret: true },
      { envVar: 'HPICS_SUPABASE_SERVICE_KEY', label: 'Service Role Key (admin)', howToGet: 'Same page → service_role key — never expose to browser', isSecret: true },
    ],
  },
  {
    id: 'osint-enrichment',
    label: 'OSINT & Data Enrichment',
    icon: Search,
    emoji: '🔍',
    keys: [
      { envVar: 'PDL_API_KEY', label: 'People Data Labs', howToGet: 'dashboard.peopledatalabs.com → API Keys → Create', portalUrl: 'https://dashboard.peopledatalabs.com/api-keys', isSecret: true, testable: true },
      { envVar: 'HUNTER_API_KEY', label: 'Hunter.io', howToGet: 'hunter.io → API Keys → New. Free: 25/month', portalUrl: 'https://hunter.io/api-keys', isSecret: true },
      { envVar: 'PROXYCURL_API_KEY', label: 'Proxycurl (LinkedIn)', howToGet: 'nubela.co/proxycurl → Dashboard → API Key', portalUrl: 'https://nubela.co/proxycurl', isSecret: true },
      { envVar: 'DIFFBOT_API_KEY', label: 'Diffbot', howToGet: 'diffbot.com → Account → API Access Token', portalUrl: 'https://www.diffbot.com/dev/docs/', isSecret: true },
      { envVar: 'TAVILY_API_KEY', label: 'Tavily AI Search', howToGet: 'app.tavily.com → API Keys. Free: 1000/month', portalUrl: 'https://app.tavily.com/api-keys', isSecret: true },
      { envVar: 'BRAVE_API_KEY', label: 'Brave Search', howToGet: 'brave.com/search/api → Subscribe → API Keys', portalUrl: 'https://brave.com/search/api/', isSecret: true },
      { envVar: 'BING_SEARCH_V7_SUBSCRIPTION_KEY', label: 'Bing Search', howToGet: 'Azure Portal → Bing Search v7 resource → Keys', portalUrl: 'https://portal.azure.com', isSecret: true },
      { envVar: 'RAPIDAPI_KEY', label: 'RapidAPI Hub', howToGet: 'rapidapi.com → My Apps → default key', portalUrl: 'https://rapidapi.com/developer/dashboard', isSecret: true },
    ],
  },
  {
    id: 'voice-biometric',
    label: 'Voice, Biometric & Vision AI',
    icon: Mic,
    emoji: '🎙️',
    keys: [
      { envVar: 'ELEVENLABS_API_KEY', label: 'ElevenLabs (TTS + voice cloning)', howToGet: 'elevenlabs.io → Profile → API Keys → Generate', portalUrl: 'https://elevenlabs.io/app/settings/api-keys', isSecret: true, testable: true },
      { envVar: 'DEEPGRAM_API_KEY', label: 'Deepgram (voice transcription)', howToGet: 'console.deepgram.com → API Keys → Create', portalUrl: 'https://console.deepgram.com', isSecret: true, testable: true },
      { envVar: 'ASSEMBLYAI_API_KEY', label: 'AssemblyAI (audio intelligence)', howToGet: 'assemblyai.com → Account → API Key', portalUrl: 'https://www.assemblyai.com/app/account', isSecret: true },
      { envVar: 'REPLICATE_API_KEY', label: 'Replicate (biometric ML)', howToGet: 'replicate.com → Account → API Tokens → Create', portalUrl: 'https://replicate.com/account/api-tokens', isSecret: true },
      { envVar: 'STABILITY_API_KEY', label: 'Stability AI (image gen)', howToGet: 'platform.stability.ai → Account → API Keys', portalUrl: 'https://platform.stability.ai/account/keys', isSecret: true },
      { envVar: 'FAL_API_KEY', label: 'fal.ai (fast video / deepfake gen)', howToGet: 'fal.ai → Dashboard → API Keys', portalUrl: 'https://fal.ai/dashboard/keys', isSecret: true },
      { envVar: 'HUGGINGFACE_HUB_TOKEN', label: 'HuggingFace (model downloads)', howToGet: 'huggingface.co → Settings → Access Tokens → New (read role)', portalUrl: 'https://huggingface.co/settings/tokens', isSecret: true, testable: true },
    ],
  },
  {
    id: 'communications',
    label: 'Communications & Sync',
    icon: MessageSquare,
    emoji: '📡',
    keys: [
      { envVar: 'GOOGLE_CLIENT_ID', label: 'Google OAuth Client ID', howToGet: 'console.cloud.google.com → APIs → Credentials → Create OAuth 2.0 Client', portalUrl: 'https://console.cloud.google.com/apis/credentials', isSecret: false },
      { envVar: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth Client Secret', howToGet: 'Same credential → copy Client Secret', isSecret: true },
      { envVar: 'MICROSOFT_CLIENT_ID', label: 'Microsoft OAuth Client ID', howToGet: 'Azure Portal → App Registrations → New → copy Application ID', portalUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade', isSecret: false },
      { envVar: 'MICROSOFT_CLIENT_SECRET', label: 'Microsoft OAuth Client Secret', howToGet: 'Same app → Certificates & secrets → New client secret → copy Value', isSecret: true },
      { envVar: 'WHATSAPP_ACCESS_TOKEN', label: 'WhatsApp Business Token', howToGet: 'developers.facebook.com → Apps → WhatsApp → API Setup → copy access token', portalUrl: 'https://developers.facebook.com', isSecret: true },
      { envVar: 'WHATSAPP_PHONE_NUMBER_ID', label: 'WhatsApp Phone Number ID', howToGet: 'Meta for Developers → WhatsApp → API Setup → Phone Number ID', isSecret: false },
    ],
  },
  {
    id: 'hardware-intel',
    label: 'Hardware Intelligence (SIGINT/TSCM)',
    icon: Radio,
    emoji: '🔭',
    keys: [
      { envVar: 'SDR_DEVICE_HOST', label: 'SDR Device Host', howToGet: 'IP of machine running rtl-sdr or HackRF server (e.g. 192.168.1.50:5555)', isUrl: true },
      { envVar: 'GOPRO_DEVICE_IP', label: 'GoPro Camera IP', howToGet: 'IP assigned by GoPro Wi-Fi network (default: 10.5.5.9)', isUrl: true },
      { envVar: 'HARDWARE_GATEWAY_URL', label: 'Hardware Gateway URL', howToGet: 'URL of your HPICS hardware bridge service (optional local service)', isUrl: true },
    ],
  },
];

/** Flatten all envVar names across all sections */
export function getAllKeyNames(): string[] {
  return API_KEY_SECTIONS.flatMap((s) => s.keys.map((k) => k.envVar));
}

/** Get all keys that are actual secrets (not model selectors) */
export function getSecretKeyNames(): string[] {
  return API_KEY_SECTIONS.flatMap((s) =>
    s.keys.filter((k) => !k.modelOptions).map((k) => k.envVar)
  );
}
