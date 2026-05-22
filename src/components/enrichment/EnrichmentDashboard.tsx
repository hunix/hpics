import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Zap, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Database,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { SourceStatusCard } from './SourceStatusCard';
import { EnrichmentCostEstimator } from './EnrichmentCostEstimator';

interface EnrichmentSource {
  id: string;
  name: string;
  type: string;
  costCents: number;
  trustLevel: number;
  isAvailable: boolean;
  requiresData: string[];
}

const ENRICHMENT_SOURCES: EnrichmentSource[] = [
  { id: 'peopledatalabs', name: 'People Data Labs', type: 'people', costCents: 30, trustLevel: 0.95, isAvailable: false, requiresData: ['email', 'linkedin'] },
  { id: 'proxycurl', name: 'Proxycurl', type: 'people', costCents: 10, trustLevel: 0.92, isAvailable: false, requiresData: ['linkedin'] },
  { id: 'perplexity', name: 'Perplexity AI', type: 'research', costCents: 5, trustLevel: 0.90, isAvailable: true, requiresData: ['name'] },
  { id: 'hunter', name: 'Hunter.io', type: 'people', costCents: 5, trustLevel: 0.85, isAvailable: false, requiresData: ['email', 'domain'] },
  { id: 'diffbot', name: 'Diffbot', type: 'research', costCents: 10, trustLevel: 0.88, isAvailable: false, requiresData: ['company'] },
  { id: 'tavily', name: 'Tavily', type: 'research', costCents: 1, trustLevel: 0.80, isAvailable: false, requiresData: ['name'] },
  { id: 'rapidapi_social', name: 'RapidAPI Social', type: 'social', costCents: 3, trustLevel: 0.75, isAvailable: false, requiresData: ['social_handles'] },
  { id: 'news_api', name: 'News API', type: 'research', costCents: 0, trustLevel: 0.70, isAvailable: false, requiresData: ['name'] },
  { id: 'firecrawl', name: 'Firecrawl', type: 'research', costCents: 5, trustLevel: 0.80, isAvailable: true, requiresData: ['company'] },
];

interface EnrichmentDashboardProps {
  profileId?: string;
  onEnrichmentComplete?: () => void;
}

export function EnrichmentDashboard({ profileId, onEnrichmentComplete }: EnrichmentDashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSources, setSelectedSources] = useState<string[]>(['perplexity', 'social_scrape']);
  const [maxBudget, setMaxBudget] = useState(50);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Fetch profile data if profileId is provided
  const { data: profile } = useQuery({
    queryKey: ['profile-for-enrichment', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!user,
  });

  // Fetch integration configs to see which sources are available
  const { data: integrationConfigs } = useQuery({
    queryKey: ['integration-configs-enrichment', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_enabled', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch recent enrichment jobs
  const { data: recentJobs } = useQuery({
    queryKey: ['enrichment-jobs', profileId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Enrichment mutation
  const enrichMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error('No profile selected');
      
      const { data, error } = await supabase.functions.invoke('enrichment-orchestrator', {
        body: {
          profileId,
          sources: selectedSources,
          maxCostCents: maxBudget,
          depth,
          forceRefresh,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Enrichment complete`, {
        description: `Processed ${data.sourcesProcessed} sources for $${(data.totalCostCents / 100).toFixed(2)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs'] });
      onEnrichmentComplete?.();
    },
    onError: (error) => {
      toast.error('Enrichment failed', { description: error.message });
    },
  });

  // Calculate available sources based on profile data
  const getAvailableSources = () => {
    if (!profile) return ENRICHMENT_SOURCES;

    return ENRICHMENT_SOURCES.map(source => {
      const isAvailable = source.isAvailable; // Connectors are always available

      // Check if required data is present - use type assertion for extended profile fields
      const profileAny = profile as any;
      const hasRequiredData = source.requiresData.some(req => {
        switch (req) {
          case 'email': return !!profileAny.email;
          case 'linkedin': return !!profile.linkedin_url;
          case 'name': return !!(profile.first_name || profile.last_name);
          case 'company': return !!profile.organization;
          case 'domain': return !!profile.organization;
          case 'social_handles': return !!(profileAny.twitter_url || profileAny.instagram_url);
          default: return false;
        }
      });

      // Check if integration is configured
      const isConfigured = integrationConfigs?.some(c => c.integration_type === source.id);

      return {
        ...source,
        isAvailable: (isAvailable || isConfigured) && hasRequiredData,
        hasRequiredData,
        isConfigured: isAvailable || isConfigured,
      };
    });
  };

  const availableSources = getAvailableSources();
  const estimatedCost = selectedSources.reduce((sum, id) => {
    const source = availableSources.find(s => s.id === id);
    return sum + (source?.costCents || 0);
  }, 0);

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const selectPreset = (preset: 'quick' | 'standard' | 'deep') => {
    setDepth(preset);
    switch (preset) {
      case 'quick':
        setSelectedSources(['perplexity']);
        setMaxBudget(10);
        break;
      case 'standard':
        setSelectedSources(['perplexity', 'social_scrape', 'hunter']);
        setMaxBudget(50);
        break;
      case 'deep':
        setSelectedSources(availableSources.filter(s => s.isAvailable).map(s => s.id));
        setMaxBudget(100);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enrichment Dashboard
          </CardTitle>
          <CardDescription>
            Gather comprehensive intelligence from multiple data sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Presets */}
          <div className="flex gap-2">
            <Button
              variant={depth === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => selectPreset('quick')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Quick (~$0.05)
            </Button>
            <Button
              variant={depth === 'standard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => selectPreset('standard')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Standard (~$0.50)
            </Button>
            <Button
              variant={depth === 'deep' ? 'default' : 'outline'}
              size="sm"
              onClick={() => selectPreset('deep')}
            >
              <Database className="h-4 w-4 mr-1" />
              Deep (~$1.00)
            </Button>
          </div>

          {/* Budget Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Maximum Budget</Label>
              <span className="text-sm font-medium">${(maxBudget / 100).toFixed(2)}</span>
            </div>
            <Slider
              value={[maxBudget]}
              onValueChange={([value]) => setMaxBudget(value)}
              min={5}
              max={200}
              step={5}
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Force Refresh</Label>
              <p className="text-xs text-muted-foreground">
                Re-fetch even if data was updated recently
              </p>
            </div>
            <Switch
              checked={forceRefresh}
              onCheckedChange={setForceRefresh}
            />
          </div>

          {/* Source Selection */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
            </TabsList>

            {['all', 'people', 'social', 'research'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-4">
                {availableSources
                  .filter(s => tab === 'all' || s.type === tab)
                  .map(source => (
                    <SourceStatusCard
                      key={source.id}
                      source={source}
                      isSelected={selectedSources.includes(source.id)}
                      onToggle={() => toggleSource(source.id)}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* Cost Estimator */}
          <EnrichmentCostEstimator
            selectedSources={selectedSources}
            availableSources={availableSources}
            maxBudget={maxBudget}
          />

          {/* Action Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => enrichMutation.mutate()}
            disabled={enrichMutation.isPending || !profileId || selectedSources.length === 0}
          >
            {enrichMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Enrichment (~${(estimatedCost / 100).toFixed(2)})
              </>
            )}
          </Button>

          {!profileId && (
            <p className="text-sm text-center text-muted-foreground">
              Select a contact to start enrichment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      {recentJobs && recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Enrichment Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentJobs.slice(0, 5).map(job => (
              <div
                key={job.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {job.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : job.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : job.status === 'completed_with_errors' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {job.cost_cents !== null && (
                    <Badge variant="outline" className="text-xs">
                      ${(job.cost_cents / 100).toFixed(2)}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {job.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
