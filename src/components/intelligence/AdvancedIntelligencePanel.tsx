import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Heart, DollarSign, Users, Target, Shield, 
  TrendingUp, AlertTriangle, Loader2, RefreshCw, Sparkles,
  Eye, Lock, Flame, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AdvancedIntelligencePanelProps {
  profileId: string;
  profileName: string;
  className?: string;
}

type AnalysisType = 'comprehensive' | 'emotional' | 'behavioral' | 'socioeconomic' | 'intimacy' | 'fortune';

const ANALYSIS_TYPES: { id: AnalysisType; label: string; icon: typeof Brain; description: string }[] = [
  { id: 'comprehensive', label: 'Full Profile', icon: Crown, description: 'Complete intelligence analysis' },
  { id: 'emotional', label: 'Emotional', icon: Heart, description: 'Emotional architecture mapping' },
  { id: 'behavioral', label: 'Behavioral', icon: Target, description: 'Behavioral DNA analysis' },
  { id: 'socioeconomic', label: 'Socioeconomic', icon: DollarSign, description: 'Class & wealth indicators' },
  { id: 'intimacy', label: 'Intimacy', icon: Flame, description: 'Attachment & intimacy patterns' },
  { id: 'fortune', label: 'Fortune', icon: Sparkles, description: 'Predictive trajectory modeling' },
];

export function AdvancedIntelligencePanel({ profileId, profileName, className }: AdvancedIntelligencePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<AnalysisType>('comprehensive');

  // Fetch existing analyses
  const { data: existingAnalyses, isLoading } = useQuery({
    queryKey: ['advanced-intelligence', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .like('analysis_type', 'deep_intelligence_%')
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId && !!user,
  });

  // Run analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: async (analysisType: AnalysisType) => {
      const { data, error } = await supabase.functions.invoke('deep-intelligence-engine', {
        body: { profileId, profileName, userId: user!.id, analysisType },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['advanced-intelligence', profileId] });
      toast({
        title: 'Analysis Complete',
        description: `${selectedType} intelligence analysis finished. Cost: $${(data.cost / 100).toFixed(2)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to run intelligence analysis',
        variant: 'destructive',
      });
    },
  });

  const getLatestAnalysis = (type: AnalysisType) => {
    return existingAnalyses?.find(a => a.analysis_type === `deep_intelligence_${type}`);
  };

  const renderAnalysisResult = (result: any) => {
    if (!result) return null;

    if (result.rawAnalysis) {
      return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.rawAnalysis}</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(result).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="space-y-2">
                <h4 className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</h4>
                <div className="pl-4 border-l-2 border-muted">
                  {renderNestedObject(value as Record<string, any>)}
                </div>
              </div>
            );
          }
          if (typeof value === 'number') {
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <Progress value={value * 100} className="w-24 h-2" />
                  <span className="text-sm font-mono">{(value * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between">
              <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-sm font-medium">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNestedObject = (obj: Record<string, any>, depth = 0) => {
    if (depth > 3) return <span className="text-xs text-muted-foreground">...</span>;

    return Object.entries(obj).slice(0, 10).map(([key, value]) => {
      if (Array.isArray(value)) {
        return (
          <div key={key} className="mb-2">
            <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {value.slice(0, 5).map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {typeof item === 'string' ? item : JSON.stringify(item).substring(0, 20)}
                </Badge>
              ))}
              {value.length > 5 && <Badge variant="outline" className="text-xs">+{value.length - 5}</Badge>}
            </div>
          </div>
        );
      }
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className="mb-2">
            <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
            <div className="pl-2">{renderNestedObject(value, depth + 1)}</div>
          </div>
        );
      }
      if (typeof value === 'number') {
        const isPercentage = value >= 0 && value <= 1;
        return (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
            {isPercentage ? (
              <Progress value={value * 100} className="w-16 h-1.5" />
            ) : (
              <span className="text-xs font-medium">{value}</span>
            )}
          </div>
        );
      }
      return (
        <div key={key} className="flex gap-2 mb-1">
          <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
          <span className="text-xs">{String(value)}</span>
        </div>
      );
    });
  };

  const currentAnalysis = getLatestAnalysis(selectedType);
  const typeConfig = ANALYSIS_TYPES.find(t => t.id === selectedType)!;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Advanced Intelligence
            </CardTitle>
            <CardDescription>
              Deep psychological & behavioral profiling for {profileName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            SCI Level
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Analysis Type Selection */}
        <div className="grid grid-cols-3 gap-2">
          {ANALYSIS_TYPES.map((type) => {
            const Icon = type.icon;
            const hasData = !!getLatestAnalysis(type.id);
            return (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "outline"}
                size="sm"
                className="flex flex-col items-center h-auto py-3 gap-1"
                onClick={() => setSelectedType(type.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{type.label}</span>
                {hasData && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Current Analysis Display */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">{typeConfig.label} Analysis</span>
            </div>
            <Button
              size="sm"
              onClick={() => runAnalysisMutation.mutate(selectedType)}
              disabled={runAnalysisMutation.isPending}
            >
              {runAnalysisMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : currentAnalysis ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {currentAnalysis ? 'Refresh' : 'Analyze'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : currentAnalysis ? (
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Eye className="h-3 w-3" />
                Last updated {formatDistanceToNow(new Date(currentAnalysis.generated_at), { addSuffix: true })}
              </div>
              <ScrollArea className="h-[300px]">
                {renderAnalysisResult(currentAnalysis.result)}
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No {typeConfig.label.toLowerCase()} analysis available</p>
              <p className="text-xs mt-1">{typeConfig.description}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {existingAnalyses && existingAnalyses.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{existingAnalyses.length} total analyses performed</span>
            <span>
              Last: {formatDistanceToNow(new Date(existingAnalyses[0].generated_at), { addSuffix: true })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
