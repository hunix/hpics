import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Zap, Brain, Sparkles, Rocket, 
  DollarSign, Clock, Target, Save, Loader2 
} from 'lucide-react';
import { MODEL_TIERS, type ModelTier } from '@/lib/aiPricing';
import { cn } from '@/lib/utils';

export function AIModelTierSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string>('balanced');
  const [preferredProvider, setPreferredProvider] = useState<'google' | 'openai'>('google');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch saved preference
  const { data: savedPreference, isLoading } = useQuery({
    queryKey: ['ai-tier-preference', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      // Cast since new columns may not be in generated types yet
      return data as { ai_model_tier?: string; preferred_ai_provider?: string } | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPreference) {
      setSelectedTier(savedPreference.ai_model_tier || 'balanced');
      setPreferredProvider((savedPreference.preferred_ai_provider as 'google' | 'openai') || 'google');
      setHasChanges(false);
    }
  }, [savedPreference]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user!.id,
          ai_model_tier: selectedTier,
          preferred_ai_provider: preferredProvider,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tier-preference'] });
      setHasChanges(false);
      toast({ title: 'AI tier preference saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'speed': return <Zap className="h-5 w-5" />;
      case 'balanced': return <Brain className="h-5 w-5" />;
      case 'quality': return <Sparkles className="h-5 w-5" />;
      case 'nextgen': return <Rocket className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    setHasChanges(true);
  };

  const handleProviderChange = (provider: 'google' | 'openai') => {
    setPreferredProvider(provider);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const selectedTierData = MODEL_TIERS.find(t => t.id === selectedTier) || MODEL_TIERS[1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AI Model Tier</h3>
          <p className="text-sm text-muted-foreground">
            Choose your preferred balance of speed, quality, and cost
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>

      {/* Tier Selection Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MODEL_TIERS.map((tier) => (
          <Card 
            key={tier.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              selectedTier === tier.id && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => handleTierSelect(tier.id)}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                  "p-3 rounded-full",
                  selectedTier === tier.id ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {getTierIcon(tier.id)}
                </div>
                <div>
                  <h4 className="font-semibold">{tier.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                </div>
                
                {/* Cost indicator */}
                <div className="flex items-center gap-1 text-xs">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <DollarSign 
                      key={i} 
                      className={cn(
                        "h-3 w-3",
                        i < tier.costMultiplier ? "text-primary" : "text-muted"
                      )} 
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Tier Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {getTierIcon(selectedTier)}
            {selectedTierData.name} Tier Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${selectedTierData.speedScore * 10}%` }} 
                  />
                </div>
                <span className="text-xs font-medium w-8">{selectedTierData.speedScore}/10</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${selectedTierData.qualityScore * 10}%` }} 
                  />
                </div>
                <span className="text-xs font-medium w-8">{selectedTierData.qualityScore}/10</span>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Preferred Provider</Label>
            <div className="flex gap-2">
              <Button
                variant={preferredProvider === 'google' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProviderChange('google')}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Google Gemini
              </Button>
              <Button
                variant={preferredProvider === 'openai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProviderChange('openai')}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                OpenAI GPT
              </Button>
            </div>
          </div>

          {/* Active Model */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Active Model</div>
            <div className="font-mono text-sm">
              {selectedTierData.models[preferredProvider]}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIModelTierSelector;
