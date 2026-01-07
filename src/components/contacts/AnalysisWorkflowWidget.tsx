import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Brain, FileText, Image, Check, Clock, 
  ChevronRight, Loader2, AlertCircle, Zap, ArrowRight 
} from 'lucide-react';
import { AIModelSelector } from '@/components/ai/AIModelSelector';

interface AnalysisWorkflowWidgetProps {
  profileId: string;
  contactName: string;
  conversationId?: string;
}

export function AnalysisWorkflowWidget({ 
  profileId, 
  contactName,
  conversationId 
}: AnalysisWorkflowWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [includeMediaIntelligence, setIncludeMediaIntelligence] = useState(true);
  const [selectedStep, setSelectedStep] = useState<'media' | 'conversation' | null>(null);

  // Fetch media analysis status
  const { data: mediaStatus, isLoading: mediaLoading } = useQuery({
    queryKey: ['media-analysis-status', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contact_media_counts', {
        p_user_id: user!.id,
        p_profile_id: profileId,
        p_skip_analyzed: false
      });
      
      if (error) throw error;
      return data?.[0] || { total_count: 0, analyzed_count: 0 };
    },
    enabled: !!user && !!profileId,
  });

  // Fetch conversation analysis status
  const { data: conversationStatus, isLoading: convoLoading } = useQuery({
    queryKey: ['conversation-analysis-status', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      
      const { data: analysis, error: analysisError } = await supabase
        .from('conversation_analyses')
        .select('id, created_at, analysis_type, model_used, total_messages_analyzed')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (analysisError) throw analysisError;
      
      const { count: messageCount, error: countError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);
      
      if (countError) throw countError;
      
      return {
        hasAnalysis: !!analysis,
        lastAnalysis: analysis,
        messageCount: messageCount || 0,
        isDeepAnalysis: analysis?.analysis_type === 'deep_with_media',
      };
    },
    enabled: !!user && !!conversationId,
  });

  // Deep analysis mutation
  const deepAnalysisMutation = useMutation({
    mutationFn: async (model: string) => {
      if (!conversationId) throw new Error('No conversation selected');
      
      const { data, error } = await supabase.functions.invoke('analyze-conversation-deep', {
        body: { 
          conversationId,
          profileId,
          includeMediaIntelligence,
          anonymize: true,
          userId: user!.id,
          model
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis-status', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis', conversationId] });
      toast({ title: 'Deep analysis complete', description: 'Enhanced intelligence report is ready.' });
    },
    onError: (error) => {
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeepAnalysis = (model: string) => {
    setShowModelSelector(false);
    deepAnalysisMutation.mutate(model);
  };

  const mediaPercentage = mediaStatus 
    ? Math.round((Number(mediaStatus.analyzed_count) / Math.max(Number(mediaStatus.total_count), 1)) * 100)
    : 0;

  const canRunDeepAnalysis = mediaPercentage >= 10 || Number(mediaStatus?.total_count) === 0;

  if (mediaLoading || convoLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Intelligence Workflow
        </CardTitle>
        <CardDescription>
          Analyze {contactName}'s media and conversations for deep insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Media Analysis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${mediaPercentage === 100 ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Image className={`h-4 w-4 ${mediaPercentage === 100 ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Step 1: Analyze Media Files</p>
                <p className="text-sm text-muted-foreground">
                  Extract intelligence from photos, videos, and audio
                </p>
              </div>
            </div>
            {mediaPercentage === 100 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                {mediaPercentage}%
              </Badge>
            )}
          </div>
          
          <div className="ml-11 space-y-2">
            <Progress value={mediaPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {Number(mediaStatus?.analyzed_count).toLocaleString()} / {Number(mediaStatus?.total_count).toLocaleString()} files analyzed
              </span>
              {Number(mediaStatus?.total_count) - Number(mediaStatus?.analyzed_count) > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Navigate to media section with bulk generator open
                    toast({ 
                      title: 'Open Media Section', 
                      description: 'Go to Media tab and click "AI Analyze" to start bulk analysis.' 
                    });
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Analyze {Number(mediaStatus?.total_count) - Number(mediaStatus?.analyzed_count)} files
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Step 2: Deep Conversation Analysis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${conversationStatus?.isDeepAnalysis ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Brain className={`h-4 w-4 ${conversationStatus?.isDeepAnalysis ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Step 2: Deep Conversation Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Combine message + media intelligence
                </p>
              </div>
            </div>
            {conversationStatus?.isDeepAnalysis ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : conversationStatus?.hasAnalysis ? (
              <Badge variant="secondary">Basic only</Badge>
            ) : (
              <Badge variant="outline">Not started</Badge>
            )}
          </div>
          
          <div className="ml-11 space-y-3">
            {conversationId ? (
              <>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {conversationStatus?.messageCount?.toLocaleString()} messages
                  </span>
                  {conversationStatus?.lastAnalysis && (
                    <span className="text-muted-foreground">
                      Last: {new Date(conversationStatus.lastAnalysis.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="include-media"
                      checked={includeMediaIntelligence}
                      onCheckedChange={setIncludeMediaIntelligence}
                      disabled={deepAnalysisMutation.isPending}
                    />
                    <Label htmlFor="include-media" className="text-sm">
                      Include media intelligence
                    </Label>
                  </div>
                </div>
                
                {!canRunDeepAnalysis && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Analyze more media first for best results</span>
                  </div>
                )}
                
                <Button 
                  onClick={() => setShowModelSelector(true)}
                  disabled={deepAnalysisMutation.isPending}
                  className="w-full"
                >
                  {deepAnalysisMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running deep analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      {conversationStatus?.isDeepAnalysis ? 'Re-run' : 'Run'} Deep Analysis
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Select a conversation to analyze</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {conversationStatus?.isDeepAnalysis && (
          <>
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                <Check className="h-4 w-4" />
                <span className="font-medium">Deep Analysis Ready</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500">
                Your enhanced intelligence report includes media context and is available in the Analysis tab.
              </p>
            </div>
          </>
        )}
      </CardContent>

      {/* Model Selector Dialog */}
      <AIModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        onSelect={handleDeepAnalysis}
        analysisType="conversation"
        title="Select Model for Deep Analysis"
        description="Choose an AI model for comprehensive relationship analysis"
      />
    </Card>
  );
}
