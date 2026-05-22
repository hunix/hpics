import React, { useState, useCallback } from 'react';
import { 
  Network, Search, Loader2, Brain, Users, TrendingUp, 
  AlertTriangle, Sparkles, Send, Filter, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  type: 'pattern' | 'connection' | 'anomaly' | 'insight';
  title: string;
  description: string;
  contacts: { id: string; name: string }[];
  confidence: number;
  metadata?: Record<string, any>;
}

interface CrossContactAnalyzerProps {
  className?: string;
}

const PRESET_ANALYSES = [
  { 
    id: 'declining_engagement',
    label: 'Declining Engagement',
    icon: TrendingUp,
    query: 'Which contacts show declining engagement patterns over the last 30 days?',
  },
  {
    id: 'similar_behavior',
    label: 'Similar Behaviors',
    icon: Users,
    query: 'Find contacts with similar behavioral patterns or communication styles',
  },
  {
    id: 'hidden_connections',
    label: 'Hidden Connections',
    icon: Network,
    query: 'Discover potential connections between contacts based on shared entities or interactions',
  },
  {
    id: 'risk_signals',
    label: 'Risk Signals',
    icon: AlertTriangle,
    query: 'Identify contacts showing concerning behavioral changes or red flags',
  },
];

export function CrossContactAnalyzer({ className }: CrossContactAnalyzerProps) {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  const runAnalysis = useCallback(async (analysisQuery: string) => {
    if (!analysisQuery.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setResults([]);
    setAnalysisProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      setAnalysisProgress(30);

      // Call the cross-contact analyzer
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-ai-agent-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question: analysisQuery,
            mode: 'global',
            analysisType: 'cross_contact',
          }),
        }
      );

      setAnalysisProgress(60);

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limited. Please try again.');
        if (response.status === 402) throw new Error('AI credits exhausted.');
        throw new Error('Analysis failed');
      }

      // Stream and parse the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Ignore JSON parsing errors for incomplete or malformed chunks
          }
        }
      }

      setAnalysisProgress(80);

      // Parse the AI response into structured results
      const parsedResults = parseAnalysisResults(fullContent);
      setResults(parsedResults);

      setAnalysisProgress(100);
    } catch (error) {
      console.error('Cross-contact analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to complete analysis',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  }, [isAnalyzing, toast]);

  const parseAnalysisResults = (content: string): AnalysisResult[] => {
    // Simple parsing - in production this would be more sophisticated
    const results: AnalysisResult[] = [];
    
    // Create a single insight result from the AI response
    if (content.trim()) {
      results.push({
        type: 'insight',
        title: 'Analysis Results',
        description: content,
        contacts: [],
        confidence: 0.85,
      });
    }

    return results;
  };

  const getResultIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'pattern': return TrendingUp;
      case 'connection': return Network;
      case 'anomaly': return AlertTriangle;
      case 'insight': return Sparkles;
      default: return Brain;
    }
  };

  const getResultColor = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'pattern': return 'text-blue-500';
      case 'connection': return 'text-green-500';
      case 'anomaly': return 'text-orange-500';
      case 'insight': return 'text-purple-500';
      default: return 'text-primary';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          Cross-Contact Intelligence
          <Badge variant="outline" className="text-xs ml-auto">
            <Zap className="h-3 w-3 mr-1" />
            RAG Powered
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preset Analysis Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ANALYSES.map(preset => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 justify-start text-left"
              onClick={() => runAnalysis(preset.query)}
              disabled={isAnalyzing}
            >
              <preset.icon className="h-4 w-4 mr-2 shrink-0 text-primary" />
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>

        {/* Custom Query Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ask anything about patterns across all your contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            disabled={isAnalyzing}
          />
          <Button
            onClick={() => runAnalysis(query)}
            disabled={!query.trim() || isAnalyzing}
            size="sm"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze Contacts
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="space-y-1">
            <Progress value={analysisProgress} className="h-1" />
            <p className="text-xs text-muted-foreground text-center">
              {analysisProgress < 30 && 'Gathering contact data...'}
              {analysisProgress >= 30 && analysisProgress < 60 && 'Running semantic search...'}
              {analysisProgress >= 60 && analysisProgress < 80 && 'Analyzing patterns...'}
              {analysisProgress >= 80 && 'Generating insights...'}
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {results.map((result, i) => {
                const Icon = getResultIcon(result.type);
                return (
                  <div
                    key={i}
                    className="p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0',
                        getResultColor(result.type)
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{result.title}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.description}
                        </p>
                        {result.contacts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.contacts.map(c => (
                              <Badge key={c.id} variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default CrossContactAnalyzer;
