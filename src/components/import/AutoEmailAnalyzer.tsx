/**
 * Auto Email Analyzer (v3.9.35)
 * Automatically triggers email analysis after successful import
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Play,
  SkipForward
} from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { toast } from 'sonner';

interface AutoEmailAnalyzerProps {
  matchedProfileIds: string[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

interface AnalysisProgress {
  current: number;
  total: number;
  currentContact: string;
  results: Array<{
    profileId: string;
    success: boolean;
    insightsCount: number;
  }>;
}

export function AutoEmailAnalyzer({ 
  matchedProfileIds, 
  onComplete, 
  onSkip,
  autoStart = false 
}: AutoEmailAnalyzerProps) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const results: AnalysisProgress['results'] = [];
      
      for (let i = 0; i < matchedProfileIds.length; i++) {
        const profileId = matchedProfileIds[i];
        
        // Get contact name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', profileId)
          .single();
        
        const contactName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
          : 'Unknown';

        setProgress({
          current: i + 1,
          total: matchedProfileIds.length,
          currentContact: contactName,
          results,
        });

        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session?.access_token) {
            results.push({ profileId, success: false, insightsCount: 0 });
            continue;
          }

          const response = await invokeFunction('analyze-email-insights', { profileId, analyzeAll: true }, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

          if (response.error) {
            results.push({ profileId, success: false, insightsCount: 0 });
          } else {
            const insights = response.data?.insights || [];
            results.push({ profileId, success: true, insightsCount: insights.length });
          }
        } catch {
          results.push({ profileId, success: false, insightsCount: 0 });
        }

        // Small delay between requests
        if (i < matchedProfileIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const totalInsights = results.reduce((sum, r) => sum + r.insightsCount, 0);
      
      toast.success(`Analyzed ${successful}/${results.length} contacts`, {
        description: `Extracted ${totalInsights} email insights`,
      });
      
      onComplete?.();
    },
    onError: (error) => {
      toast.error('Auto-analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !hasStarted && matchedProfileIds.length > 0) {
      setHasStarted(true);
      analysisMutation.mutate();
    }
  }, [autoStart, hasStarted, matchedProfileIds.length]);

  const handleStart = () => {
    setHasStarted(true);
    analysisMutation.mutate();
  };

  if (matchedProfileIds.length === 0) {
    return null;
  }

  // Show prompt to start analysis
  if (!hasStarted && !autoStart) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Extract Email Intelligence</p>
                <p className="text-sm text-muted-foreground">
                  Analyze {matchedProfileIds.length} matched contacts for insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onSkip}>
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button size="sm" onClick={handleStart}>
                <Play className="h-4 w-4 mr-1" />
                Analyze Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show progress
  if (analysisMutation.isPending && progress) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Analyzing: {progress.currentContact}
            </span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} />
        </CardContent>
      </Card>
    );
  }

  // Show completion
  if (analysisMutation.isSuccess && progress) {
    const successful = progress.results.filter(r => r.success).length;
    const totalInsights = progress.results.reduce((sum, r) => sum + r.insightsCount, 0);
    
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-600">Analysis Complete</p>
              <p className="text-sm text-muted-foreground">
                {successful} contacts analyzed, {totalInsights} insights extracted
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error
  if (analysisMutation.isError) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-600">Analysis Failed</p>
                <p className="text-sm text-muted-foreground">
                  Please try again or analyze manually
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleStart}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
