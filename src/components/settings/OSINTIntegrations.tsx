import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Globe, 
  Newspaper, 
  Search, 
  Shield, 
  Key, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  Linkedin,
  Mail,
  Share2,
  Brain,
  Sparkles,
  Zap,
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  secretKey: string;
  docsUrl: string;
  features: string[];
  category: 'connected' | 'people' | 'social' | 'research';
  isConnector?: boolean;
}

const INTEGRATIONS: Integration[] = [
  // Connected via Lovable Connectors
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'AI-powered web scraping and search for OSINT data gathering',
    icon: <Search className="h-5 w-5" />,
    secretKey: 'FIRECRAWL_API_KEY',
    docsUrl: 'https://firecrawl.dev/docs',
    features: ['Web search', 'Page scraping', 'Structured data extraction'],
    category: 'connected',
    isConnector: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    description: 'AI-powered real-time web search with grounded, cited responses',
    icon: <Brain className="h-5 w-5" />,
    secretKey: 'PERPLEXITY_API_KEY',
    docsUrl: 'https://docs.perplexity.ai',
    features: ['AI search', 'Real-time data', 'Source citations', 'Academic research'],
    category: 'connected',
    isConnector: true,
  },
  // People Intelligence
  {
    id: 'peopledatalabs',
    name: 'People Data Labs',
    description: 'Professional data enrichment with 3B+ person records worldwide',
    icon: <Users className="h-5 w-5" />,
    secretKey: 'PDL_API_KEY',
    docsUrl: 'https://docs.peopledatalabs.com',
    features: ['Person enrichment', 'Job history', 'Skills & education', 'Social profiles'],
    category: 'people',
  },
  {
    id: 'proxycurl',
    name: 'Proxycurl',
    description: 'LinkedIn profile and company data extraction at scale',
    icon: <Linkedin className="h-5 w-5" />,
    secretKey: 'PROXYCURL_API_KEY',
    docsUrl: 'https://nubela.co/proxycurl/docs',
    features: ['LinkedIn profiles', 'Company data', 'Employee search', 'Job listings'],
    category: 'people',
  },
  {
    id: 'hunter_io',
    name: 'Hunter.io',
    description: 'Email verification and company domain intelligence',
    icon: <Mail className="h-5 w-5" />,
    secretKey: 'HUNTER_API_KEY',
    docsUrl: 'https://hunter.io/api-documentation',
    features: ['Email verification', 'Domain search', 'Email finder', 'Company info'],
    category: 'people',
  },
  // Social Media
  {
    id: 'rapidapi_social',
    name: 'RapidAPI Social',
    description: 'Multi-platform social media data from Instagram, Twitter, TikTok',
    icon: <Share2 className="h-5 w-5" />,
    secretKey: 'RAPIDAPI_KEY',
    docsUrl: 'https://rapidapi.com/hub',
    features: ['Instagram data', 'Twitter/X profiles', 'TikTok stats', 'Engagement metrics'],
    category: 'social',
  },
  // Research & Search
  {
    id: 'diffbot',
    name: 'Diffbot',
    description: 'AI-powered web data extraction and knowledge graph',
    icon: <Sparkles className="h-5 w-5" />,
    secretKey: 'DIFFBOT_API_KEY',
    docsUrl: 'https://docs.diffbot.com',
    features: ['Article extraction', 'Entity recognition', 'Knowledge graph', 'Auto-detect'],
    category: 'research',
  },
  {
    id: 'tavily',
    name: 'Tavily AI Search',
    description: 'AI-optimized web search designed for intelligent research',
    icon: <Zap className="h-5 w-5" />,
    secretKey: 'TAVILY_API_KEY',
    docsUrl: 'https://docs.tavily.com',
    features: ['AI search', 'Research mode', 'Source extraction', 'Domain filtering'],
    category: 'research',
  },
  {
    id: 'news_api',
    name: 'News API',
    description: 'Monitor news mentions and media coverage of your contacts',
    icon: <Newspaper className="h-5 w-5" />,
    secretKey: 'NEWS_API_KEY',
    docsUrl: 'https://newsapi.org/docs',
    features: ['News search', 'Headline monitoring', 'Source filtering', 'Date range'],
    category: 'research',
  },
  {
    id: 'google_search',
    name: 'Google Custom Search',
    description: 'Deep web search for public information and mentions',
    icon: <Globe className="h-5 w-5" />,
    secretKey: 'GOOGLE_SEARCH_API_KEY',
    docsUrl: 'https://developers.google.com/custom-search',
    features: ['Web search', 'Image search', 'Site-specific search'],
    category: 'research',
  },
];

const CATEGORY_INFO = {
  connected: { label: 'Connected', description: 'Available via Lovable connectors', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  people: { label: 'People Intelligence', description: 'Person & company enrichment APIs', icon: <Users className="h-4 w-4" /> },
  social: { label: 'Social Media', description: 'Social platform data extraction', icon: <Share2 className="h-4 w-4" /> },
  research: { label: 'Research & Search', description: 'Web search and news monitoring', icon: <Search className="h-4 w-4" /> },
};

export function OSINTIntegrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['integration-configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: secretStatus } = useQuery({
    queryKey: ['secret-status', user?.id],
    queryFn: async () => {
      const { data, error } = await invokeFunction('check-secrets', { secrets: INTEGRATIONS.map(i => i.secretKey) });
      if (error) {
        console.warn('Could not check secret status:', error);
        return {};
      }
      return data?.status || {};
    },
    enabled: !!user,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ integrationId, enabled }: { integrationId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('integration_configs')
        .upsert({
          user_id: user!.id,
          integration_type: integrationId,
          is_enabled: enabled,
        }, { onConflict: 'user_id,integration_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-configs'] });
      toast.success('Integration updated');
    },
    onError: (error) => {
      toast.error('Failed to update integration', { description: error.message });
    },
  });

  const saveApiKey = async (integration: Integration) => {
    if (!keyValue.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSavingKey(integration.id);
    try {
      const { error } = await invokeFunction('save-integration-secret', { 
          secretName: integration.secretKey,
          secretValue: keyValue.trim(),
        });

      if (error) throw error;

      await supabase
        .from('integration_configs')
        .upsert({
          user_id: user!.id,
          integration_type: integration.id,
          is_enabled: true,
        }, { onConflict: 'user_id,integration_type' });

      toast.success(`${integration.name} API key saved securely`);
      setEditingKey(null);
      setKeyValue('');
      queryClient.invalidateQueries({ queryKey: ['integration-configs'] });
      queryClient.invalidateQueries({ queryKey: ['secret-status'] });
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error('Failed to save API key. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const getIntegrationStatus = (integrationId: string) => {
    const integration = INTEGRATIONS.find(i => i.id === integrationId);
    if (!integration) return { configured: false, enabled: false };
    
    const config = configs?.find(c => c.integration_type === integrationId);
    const hasSecret = secretStatus?.[integration.secretKey] === true;
    
    // Connectors are always considered configured if they're in the connected category
    const isConnectorConfigured = integration.isConnector && integration.category === 'connected';
    
    return {
      configured: hasSecret || isConnectorConfigured,
      enabled: config?.is_enabled ?? isConnectorConfigured,
      lastUsed: config?.last_used_at,
      usageCount: config?.usage_count || 0,
    };
  };

  const renderIntegrationCard = (integration: Integration) => {
    const status = getIntegrationStatus(integration.id);
    const isEditing = editingKey === integration.id;
    const isSaving = savingKey === integration.id;

    return (
      <div
        key={integration.id}
        className="border rounded-lg p-4 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {integration.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{integration.name}</h4>
                {integration.isConnector && (
                  <Badge variant="secondary" className="text-xs">
                    Connector
                  </Badge>
                )}
                {status.configured ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not configured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {integration.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {integration.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status.configured && (
              <Switch
                checked={status.enabled}
                onCheckedChange={(enabled) => 
                  toggleMutation.mutate({ integrationId: integration.id, enabled })
                }
              />
            )}
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* API Key Input - only show for non-connector integrations */}
        {!integration.isConnector && (
          isEditing ? (
            <div className="space-y-3 pt-2 border-t">
              <Label htmlFor={`key-${integration.id}`}>
                <Key className="h-4 w-4 inline mr-1" />
                API Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`key-${integration.id}`}
                    type={showKey ? 'text' : 'password'}
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder={`Enter your ${integration.name} API key`}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={() => saveApiKey(integration)}
                  disabled={isSaving || !keyValue.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingKey(null);
                    setKeyValue('');
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key will be encrypted and stored securely. It will never be exposed in the application.
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingKey(integration.id);
                  setKeyValue('');
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                {status.configured ? 'Update API Key' : 'Add API Key'}
              </Button>
              {status.usageCount > 0 && (
                <span className="text-xs text-muted-foreground ml-3">
                  Used {status.usageCount} times
                </span>
              )}
            </div>
          )
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const categories = ['connected', 'people', 'social', 'research'] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          OSINT Integrations
        </CardTitle>
        <CardDescription>
          Configure external APIs for Open Source Intelligence gathering. API keys are stored securely and never exposed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="connected" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5">
                {CATEGORY_INFO[cat].icon}
                <span className="hidden sm:inline">{CATEGORY_INFO[cat].label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                {CATEGORY_INFO[category].description}
              </p>
              {INTEGRATIONS.filter(i => i.category === category).map(renderIntegrationCard)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Note
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            All API keys are stored as encrypted secrets and are only accessible to edge functions running on the server.
            They are never sent to the browser or exposed in network requests.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
