import React, { useState } from 'react';
import { 
  Sparkles, Brain, Users, TrendingUp, Hash, 
  MessageCircle, Heart, Eye, Clock, MapPin,
  Globe, AlertTriangle, CheckCircle2, Loader2,
  ChevronDown, BarChart3, PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';

interface CaptureInsight {
  entities?: {
    people: Array<{ name: string; context: string; frequency: number; linkedProfileId?: string }>;
    organizations: Array<{ name: string; type?: string; context: string }>;
    locations: Array<{ name: string; type?: string }>;
  };
  content?: {
    themes: Array<{ theme: string; confidence: number }>;
    sentiment: {
      overall: string;
      score: number;
    };
    communicationStyle: {
      tone: string[];
      formality: string;
      personality: string[];
    };
    keyQuotes: Array<{ quote: string; significance: string }>;
  };
  relationships?: {
    frequentMentions: Array<{ username: string; count: number; relationshipType?: string }>;
    collaborators: Array<{ username: string; collaborationType: string }>;
    networkStrength: {
      score: number;
      networkType: string;
    };
  };
  behavioral?: {
    postingPatterns: {
      frequency: string;
      bestTimes: string[];
      bestDays: string[];
      consistency: number;
    };
    interests: Array<{ topic: string; score: number }>;
    personality: {
      traits: string[];
      mbtiEstimate?: string;
      confidence: number;
    };
  };
  summary?: {
    executiveSummary: string;
    keyInsights: string[];
    suggestedActions: string[];
    compatibilityScore: number;
  };
}

interface CaptureInsightsPanelProps {
  captureId: string;
  initialInsights?: CaptureInsight;
  className?: string;
}

export function CaptureInsightsPanel({ 
  captureId, 
  initialInsights,
  className 
}: CaptureInsightsPanelProps) {
  const [insights, setInsights] = useState<CaptureInsight | null>(initialInsights || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    entities: false,
    content: false,
    relationships: false,
    behavioral: false,
  });
  const { toast } = useToast();

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeFunction('deep-analyze-capture', { captureId, analysisMode: 'full' },);

      if (error) throw error;

      setInsights(data.analysis);
      toast({
        title: 'Deep Analysis Complete',
        description: 'AI insights have been generated for this capture.',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'mixed': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (!insights) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Insights Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run deep AI analysis to extract intelligence from this capture
          </p>
          <Button onClick={runDeepAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Deep Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          AI Intelligence Insights
        </CardTitle>
        <CardDescription className="text-xs">
          Deep analysis of captured social profile data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Section */}
        {insights.summary && (
          <Collapsible 
            open={expandedSections.summary} 
            onOpenChange={() => toggleSection('summary')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Executive Summary
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.summary && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <p className="text-sm">{insights.summary.executiveSummary}</p>
              
              {insights.summary.compatibilityScore !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compatibility Score</span>
                    <span className="font-medium">{insights.summary.compatibilityScore}%</span>
                  </div>
                  <Progress value={insights.summary.compatibilityScore} className="h-2" />
                </div>
              )}

              {insights.summary.keyInsights?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Key Insights</p>
                  <ul className="text-xs space-y-1">
                    {insights.summary.keyInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.summary.suggestedActions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Suggested Actions</p>
                  <ul className="text-xs space-y-1">
                    {insights.summary.suggestedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Entities Section */}
        {insights.entities && (
          <Collapsible 
            open={expandedSections.entities} 
            onOpenChange={() => toggleSection('entities')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-blue-500" />
                  Entities ({
                    (insights.entities.people?.length || 0) +
                    (insights.entities.organizations?.length || 0)
                  })
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.entities && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {insights.entities.people?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">People Mentioned</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.entities.people.slice(0, 10).map((person, i) => (
                      <Badge 
                        key={i} 
                        variant={person.linkedProfileId ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {person.name}
                        {person.frequency > 1 && ` (${person.frequency})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {insights.entities.organizations?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Organizations</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.entities.organizations.slice(0, 8).map((org, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {org.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {insights.entities.locations?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Locations</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.entities.locations.slice(0, 6).map((loc, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        <MapPin className="h-2 w-2 mr-1" />
                        {loc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Content Intelligence Section */}
        {insights.content && (
          <Collapsible 
            open={expandedSections.content} 
            onOpenChange={() => toggleSection('content')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                  Content Intelligence
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.content && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {insights.content.sentiment && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sentiment</span>
                  <span className={cn("font-medium capitalize", getSentimentColor(insights.content.sentiment.overall))}>
                    {insights.content.sentiment.overall}
                  </span>
                </div>
              )}

              {insights.content.communicationStyle && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Formality</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {insights.content.communicationStyle.formality}
                    </Badge>
                  </div>
                  
                  {insights.content.communicationStyle.tone?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insights.content.communicationStyle.tone.map((tone, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] capitalize">
                          {tone}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {insights.content.themes?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Themes</p>
                  <div className="space-y-1">
                    {insights.content.themes.slice(0, 5).map((theme, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs flex-1">{theme.theme}</span>
                        <Progress value={theme.confidence * 100} className="h-1 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.content.keyQuotes?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Key Quotes</p>
                  <ScrollArea className="h-24">
                    <div className="space-y-2">
                      {insights.content.keyQuotes.map((quote, i) => (
                        <div key={i} className="text-xs bg-muted/50 p-2 rounded italic">
                          "{quote.quote}"
                          <p className="text-[10px] text-muted-foreground mt-1 not-italic">
                            {quote.significance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Relationships Section */}
        {insights.relationships && (
          <Collapsible 
            open={expandedSections.relationships} 
            onOpenChange={() => toggleSection('relationships')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-cyan-500" />
                  Network & Relationships
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.relationships && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {insights.relationships.networkStrength && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Network Strength</span>
                    <span className="font-medium">{insights.relationships.networkStrength.score}/100</span>
                  </div>
                  <Progress value={insights.relationships.networkStrength.score} className="h-2" />
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {insights.relationships.networkStrength.networkType}
                  </Badge>
                </div>
              )}

              {insights.relationships.frequentMentions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Frequent Mentions</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.relationships.frequentMentions.slice(0, 8).map((mention, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        @{mention.username} ({mention.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {insights.relationships.collaborators?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Collaborators</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.relationships.collaborators.map((collab, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        @{collab.username} • {collab.collaborationType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Behavioral Section */}
        {insights.behavioral && (
          <Collapsible 
            open={expandedSections.behavioral} 
            onOpenChange={() => toggleSection('behavioral')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  Behavioral Insights
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSections.behavioral && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {insights.behavioral.postingPatterns && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Posting Frequency</span>
                    <span className="font-medium capitalize">{insights.behavioral.postingPatterns.frequency}</span>
                  </div>
                  
                  {insights.behavioral.postingPatterns.bestDays?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Best Days: </span>
                      {insights.behavioral.postingPatterns.bestDays.join(', ')}
                    </div>
                  )}

                  {insights.behavioral.postingPatterns.bestTimes?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Best Times: </span>
                      {insights.behavioral.postingPatterns.bestTimes.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {insights.behavioral.personality && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Personality Traits
                    {insights.behavioral.personality.confidence > 0.7 && (
                      <Badge variant="outline" className="text-[8px] ml-1">High Confidence</Badge>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insights.behavioral.personality.traits.map((trait, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] capitalize">
                        {trait}
                      </Badge>
                    ))}
                    {insights.behavioral.personality.mbtiEstimate && (
                      <Badge variant="default" className="text-[10px]">
                        {insights.behavioral.personality.mbtiEstimate}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {insights.behavioral.interests?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Interests</p>
                  <div className="space-y-1">
                    {insights.behavioral.interests.slice(0, 5).map((interest, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs flex-1">{interest.topic}</span>
                        <div className="flex items-center gap-1">
                          <Progress value={interest.score * 10} className="h-1 w-12" />
                          <span className="text-[10px] text-muted-foreground w-4">{interest.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Re-analyze Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={runDeepAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Re-analyze
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default CaptureInsightsPanel;
