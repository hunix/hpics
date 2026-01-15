/**
 * Counter-Intelligence Detection Panel
 * Detect when contacts may be running operations against the user
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Search,
  MessageSquare,
  Users,
  Clock,
  Target,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CounterIntelEvent {
  id: string;
  profileId: string;
  profileName?: string;
  detectionType: string;
  indicators: string[];
  threatLevel: 'low' | 'medium' | 'high';
  recommendedResponse: string;
  timestamp: Date;
  isResolved: boolean;
}

interface CounterIntelDetectionPanelProps {
  profileId?: string;
}

export function CounterIntelDetectionPanel({ profileId }: CounterIntelDetectionPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversationInput, setConversationInput] = useState('');
  const [activeTab, setActiveTab] = useState('events');

  // Fetch counter-intel events
  const { data: events, isLoading } = useQuery({
    queryKey: ['counter-intel-events', profileId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('counter_intel_events')
        .select('*, profiles:profile_id(first_name, last_name)')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []).map((e: any) => ({
        id: e.id,
        profileId: e.profile_id,
        profileName: e.profiles ? `${e.profiles.first_name || ''} ${e.profiles.last_name || ''}`.trim() : 'Unknown',
        detectionType: e.detection_type,
        indicators: e.indicators || [],
        threatLevel: e.threat_level,
        recommendedResponse: e.recommended_response,
        timestamp: new Date(e.detected_at),
        isResolved: e.is_resolved || false,
      })) as CounterIntelEvent[];
    },
    enabled: !!user?.id,
  });

  // Analyze conversation for elicitation attempts
  const analyzeConversation = useMutation({
    mutationFn: async (conversation: string) => {
      // Pattern matching for common elicitation techniques
      const patterns = {
        flattery: /you['']?re (so|really|very) (smart|intelligent|brilliant|amazing)/gi,
        assumedKnowledge: /I (heard|know|understand) (that )?(you|your)/gi,
        provocativeStatement: /(everyone knows|obviously|clearly|of course)/gi,
        mutualInterest: /(we both|you and I|between us)/gi,
        quidProQuo: /(I['']ll tell you .* if you|in exchange for)/gi,
        deliberateMisinformation: /(actually|wrong|incorrect|that['']s not true)/gi,
        feigning: /(I don['']t (really )?understand|could you explain)/gi,
        naiveté: /(just curious|innocent question|probably silly)/gi,
      };

      const detectedPatterns: { type: string; matches: string[] }[] = [];
      
      Object.entries(patterns).forEach(([type, pattern]) => {
        const matches = conversation.match(pattern);
        if (matches && matches.length > 0) {
          detectedPatterns.push({ type, matches });
        }
      });

      // Calculate threat level
      const threatScore = detectedPatterns.length;
      const threatLevel = threatScore >= 3 ? 'high' : threatScore >= 1 ? 'medium' : 'low';

      if (detectedPatterns.length > 0 && profileId && user?.id) {
        const { error } = await supabase
          .from('counter_intel_events')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            detection_type: detectedPatterns.map(p => p.type).join(', '),
            indicators: detectedPatterns.flatMap(p => p.matches),
            threat_level: threatLevel,
            recommended_response: generateResponse(detectedPatterns),
            detected_at: new Date().toISOString(),
          });
        
        if (error) throw error;
      }

      return { detectedPatterns, threatLevel };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['counter-intel-events'] });
      if (result.detectedPatterns.length > 0) {
        toast.warning(`Detected ${result.detectedPatterns.length} potential elicitation attempts`);
      } else {
        toast.success('No elicitation attempts detected');
      }
      setConversationInput('');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Mark event as resolved
  const resolveEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('counter_intel_events')
        .update({ is_resolved: true })
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter-intel-events'] });
      toast.success('Event marked as resolved');
    },
  });

  const generateResponse = (patterns: { type: string; matches: string[] }[]): string => {
    const responses: Record<string, string> = {
      flattery: 'Deflect compliments and redirect conversation. Consider if they are building rapport for extraction.',
      assumedKnowledge: 'Do not confirm or deny. Ask clarifying questions to understand their actual knowledge.',
      provocativeStatement: 'Remain calm. Do not react emotionally or correct with sensitive information.',
      mutualInterest: 'Be wary of manufactured common ground. Verify claims independently.',
      quidProQuo: 'Decline trades of information. Report attempt to security.',
      deliberateMisinformation: 'Note the misinformation without correcting it publicly.',
      feigning: 'Provide only surface-level explanations. Redirect complex topics.',
      naiveté: 'Treat all questions as potentially sophisticated regardless of presentation.',
    };

    return patterns.map(p => responses[p.type] || 'Maintain operational security.').join(' ');
  };

  const threatColors = {
    low: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    medium: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    high: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const honeypotSuggestions = [
    { id: 1, name: 'Fake Project Name', description: 'Plant a fictional project name and monitor for references' },
    { id: 2, name: 'Incorrect Detail', description: 'Provide slightly wrong dates/numbers and track corrections' },
    { id: 3, name: 'Non-existent Contact', description: 'Mention a fictional colleague and watch for follow-up' },
    { id: 4, name: 'Canary Document', description: 'Share a document with unique identifier to track leaks' },
  ];

  const stats = {
    total: events?.length || 0,
    high: events?.filter(e => e.threatLevel === 'high').length || 0,
    unresolved: events?.filter(e => !e.isResolved).length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Counter-Intelligence Detection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.total} events</Badge>
            {stats.high > 0 && (
              <Badge variant="destructive">{stats.high} high threat</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="analyze" className="gap-1">
              <Search className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="honeypots" className="gap-1">
              <Target className="h-4 w-4" />
              Honeypots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {events?.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        event.isResolved ? 'bg-muted/30 opacity-60' : threatColors[event.threatLevel]
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span className="font-medium">{event.profileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.threatLevel === 'high' ? 'destructive' : 'outline'}>
                            {event.threatLevel}
                          </Badge>
                          {event.isResolved && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mb-1">{event.detectionType}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.indicators.slice(0, 3).map((indicator, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            "{indicator}"
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="p-2 rounded bg-muted/50 text-sm mb-2">
                        <Lightbulb className="h-3 w-3 inline mr-1" />
                        {event.recommendedResponse}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </span>
                        {!event.isResolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveEvent.mutate(event.id)}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!events || events.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No counter-intelligence events detected</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Paste conversation to analyze for elicitation attempts:
              </label>
              <Textarea
                value={conversationInput}
                onChange={(e) => setConversationInput(e.target.value)}
                placeholder="Paste the conversation text here..."
                className="h-48"
              />
            </div>
            
            <Button
              onClick={() => analyzeConversation.mutate(conversationInput)}
              disabled={!conversationInput.trim() || analyzeConversation.isPending}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze for Elicitation Attempts
            </Button>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Detected Patterns Include:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Flattery</strong> - Excessive compliments to build false rapport</li>
                <li>• <strong>Assumed Knowledge</strong> - Pretending to know information</li>
                <li>• <strong>Provocative Statements</strong> - Statements designed to elicit reactions</li>
                <li>• <strong>Quid Pro Quo</strong> - Offering information in exchange</li>
                <li>• <strong>Feigned Naiveté</strong> - Pretending ignorance to extract details</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="honeypots" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Honeypot Information Planting
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Plant traceable false information to detect leaks and unauthorized information sharing.
              </p>
            </div>

            <div className="space-y-3">
              {honeypotSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{suggestion.name}</span>
                    <Button variant="outline" size="sm">
                      Deploy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Disinformation Inoculation
              </h4>
              <p className="text-sm text-muted-foreground">
                Pre-emptively expose contacts to weakened versions of manipulation tactics to build resistance.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
