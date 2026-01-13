import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegistrationStep {
  step: number;
  title: string;
  description: string;
}

export interface CommonError {
  error: string;
  cause: string;
  solution: string;
}

export interface IntegrationGuide {
  id: string;
  integration_id: string;
  display_name: string;
  category: string;
  registration_url: string | null;
  registration_steps: RegistrationStep[];
  api_key_location: string | null;
  api_key_steps: RegistrationStep[];
  api_key_format: string | null;
  pricing_model: string | null;
  free_tier_limits: string | null;
  pricing_url: string | null;
  usage_description: string | null;
  features_enabled: string[];
  test_endpoint: string | null;
  test_method: string | null;
  expected_response: string | null;
  common_errors: CommonError[];
  support_url: string | null;
  documentation_url: string | null;
  requires_oauth: boolean;
  has_connector: boolean;
  difficulty_level: string;
  estimated_setup_time: string;
  created_at: string;
  updated_at: string;
}

export function useIntegrationGuide(integrationId: string | null) {
  return useQuery({
    queryKey: ['integration-guide', integrationId],
    queryFn: async (): Promise<IntegrationGuide | null> => {
      if (!integrationId) return null;
      
      // Map secret names to integration IDs
      const idMap: Record<string, string> = {
        'PDL_API_KEY': 'peopledatalabs',
        'PROXYCURL_API_KEY': 'proxycurl',
        'HUNTER_API_KEY': 'hunter',
        'RAPIDAPI_KEY': 'rapidapi',
        'TAVILY_API_KEY': 'tavily',
        'NEWS_API_KEY': 'newsapi',
        'GOOGLE_SEARCH_API_KEY': 'google-search',
        'GOOGLE_SEARCH_CX': 'google-search',
        'RESEND_API_KEY': 'resend',
        'DIFFBOT_API_KEY': 'diffbot',
        'PERPLEXITY_API_KEY': 'perplexity',
        'FIRECRAWL_API_KEY': 'firecrawl',
        'ELEVENLABS_API_KEY': 'elevenlabs',
        'OPENAI_API_KEY': 'openai',
        'VAPID_PUBLIC_KEY': 'vapid',
        'VAPID_PRIVATE_KEY': 'vapid',
        'GOOGLE_GMAIL_CLIENT_ID': 'gmail-oauth',
        'GOOGLE_GMAIL_CLIENT_SECRET': 'gmail-oauth',
        'GOOGLE_CALENDAR_CLIENT_ID': 'google-calendar-oauth',
        'GOOGLE_CALENDAR_CLIENT_SECRET': 'google-calendar-oauth',
      };
      
      const lookupId = idMap[integrationId] || integrationId.toLowerCase().replace(/_/g, '-');
      
      const { data, error } = await supabase
        .from('integration_guides')
        .select('*')
        .eq('integration_id', lookupId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching integration guide:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Parse JSONB fields
      return {
        ...data,
        registration_steps: (data.registration_steps as unknown as RegistrationStep[]) || [],
        api_key_steps: (data.api_key_steps as unknown as RegistrationStep[]) || [],
        features_enabled: (data.features_enabled as unknown as string[]) || [],
        common_errors: (data.common_errors as unknown as CommonError[]) || [],
      } as IntegrationGuide;
    },
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useAllIntegrationGuides() {
  return useQuery({
    queryKey: ['integration-guides'],
    queryFn: async (): Promise<IntegrationGuide[]> => {
      const { data, error } = await supabase
        .from('integration_guides')
        .select('*')
        .order('display_name');
      
      if (error) {
        console.error('Error fetching integration guides:', error);
        return [];
      }
      
      return (data || []).map(item => ({
        ...item,
        registration_steps: (item.registration_steps as unknown as RegistrationStep[]) || [],
        api_key_steps: (item.api_key_steps as unknown as RegistrationStep[]) || [],
        features_enabled: (item.features_enabled as unknown as string[]) || [],
        common_errors: (item.common_errors as unknown as CommonError[]) || [],
      })) as IntegrationGuide[];
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
