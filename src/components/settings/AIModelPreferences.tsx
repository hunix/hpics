import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Brain, Sparkles, MessageSquare, Lightbulb, RotateCcw, Save } from 'lucide-react';
import { ANALYSIS_TYPES, getAnalysisTypesByCategory, type AnalysisTypeConfig } from '@/lib/analysisTypes';
import { AI_MODEL_PRICING, formatCentsToUSD, getProviderColor, type ModelPricing } from '@/lib/aiPricing';
import { AIModelTierSelector } from './AIModelTierSelector';

// Get available models for selection
const availableModels = Object.entries(AI_MODEL_PRICING).filter(
  ([key]) => !key.startsWith('local/')
);

interface ModelPreference {
  analysis_type: string;
  model_key: string;
}

export function AIModelPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch saved preferences
  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ['ai-model-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_model_preferences')
        .select('analysis_type, model_key')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as ModelPreference[];
    },
    enabled: !!user,
  });

  // Initialize preferences with defaults + saved
  useEffect(() => {
    const defaultPrefs: Record<string, string> = {};
    ANALYSIS_TYPES.forEach(type => {
      defaultPrefs[type.key] = type.defaultModel;
    });
    
    if (savedPreferences) {
      savedPreferences.forEach(pref => {
        defaultPrefs[pref.analysis_type] = pref.model_key;
      });
    }
    
    setPreferences(defaultPrefs);
    setHasChanges(false);
  }, [savedPreferences]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete existing preferences
      await supabase
        .from('ai_model_preferences')
        .delete()
        .eq('user_id', user!.id);
      
      // Insert new preferences
      const toInsert = Object.entries(preferences).map(([analysis_type, model_key]) => ({
        user_id: user!.id,
        analysis_type,
        model_key,
      }));
      
      const { error } = await supabase
        .from('ai_model_preferences')
        .insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-model-preferences'] });
      setHasChanges(false);
      toast({ title: 'AI model preferences saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleModelChange = (analysisType: string, modelKey: string) => {
    setPreferences(prev => ({ ...prev, [analysisType]: modelKey }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    const defaultPrefs: Record<string, string> = {};
    ANALYSIS_TYPES.forEach(type => {
      defaultPrefs[type.key] = type.defaultModel;
    });
    setPreferences(defaultPrefs);
    setHasChanges(true);
  };

  const getCategoryIcon = (category: AnalysisTypeConfig['category']) => {
    switch (category) {
      case 'profile': return <Brain className="h-5 w-5" />;
      case 'behavioral': return <Sparkles className="h-5 w-5" />;
      case 'communication': return <MessageSquare className="h-5 w-5" />;
      case 'suggestion': return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: AnalysisTypeConfig['category']) => {
    switch (category) {
      case 'profile': return 'Profile Analysis';
      case 'behavioral': return 'Behavioral Analysis';
      case 'communication': return 'Communication & Relationship';
      case 'suggestion': return 'Suggestions & Recommendations';
    }
  };

  const renderModelOption = (key: string, pricing: ModelPricing) => {
    const inputCost = formatCentsToUSD(Math.ceil(pricing.inputPer1M * 100));
    const outputCost = formatCentsToUSD(Math.ceil(pricing.outputPer1M * 100));
    
    return (
      <SelectItem key={key} value={key}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getProviderColor(pricing.provider)}`} />
          <span>{pricing.displayName}</span>
          <span className="text-xs text-muted-foreground">
            ({inputCost}/{outputCost} per 1M)
          </span>
        </div>
      </SelectItem>
    );
  };

  const renderAnalysisType = (type: AnalysisTypeConfig) => {
    const currentModel = preferences[type.key] || type.defaultModel;
    const pricing = AI_MODEL_PRICING[currentModel];
    const isDefault = currentModel === type.defaultModel;

    return (
      <div key={type.key} className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="font-medium">{type.name}</Label>
            {isDefault && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{type.description}</p>
          {pricing && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                Input: {formatCentsToUSD(Math.ceil(pricing.inputPer1M * 100))}/1M
              </Badge>
              <Badge variant="outline" className="text-xs">
                Output: {formatCentsToUSD(Math.ceil(pricing.outputPer1M * 100))}/1M
              </Badge>
            </div>
          )}
        </div>
        <Select
          value={currentModel}
          onValueChange={(value) => handleModelChange(type.key, value)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(([key, pricing]) => renderModelOption(key, pricing))}
          </SelectContent>
        </Select>
      </div>
    );
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

  const categories: AnalysisTypeConfig['category'][] = ['profile', 'behavioral', 'communication', 'suggestion'];

  return (
    <div className="space-y-6">
      {/* Global Tier Selector */}
      <AIModelTierSelector />
      
      <Separator />
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Per-Analysis Model Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Fine-tune which AI model to use for specific analysis types
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
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
            Save Changes
          </Button>
        </div>
      </div>

      {categories.map(category => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </CardTitle>
            <CardDescription>
              Configure models for {getCategoryLabel(category).toLowerCase()} features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {getAnalysisTypesByCategory(category).map(renderAnalysisType)}
          </CardContent>
        </Card>
      ))}

      {/* Pricing Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Model Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Google (Gemini)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">OpenAI (GPT)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm">ElevenLabs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm">Local Models (Free)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
