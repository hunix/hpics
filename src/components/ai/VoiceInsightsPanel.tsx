import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Brain, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Tag,
  MessageSquare
} from 'lucide-react';

interface VoiceInsightsPanelProps {
  profileId?: string;
  sourceId?: string;
  insightId?: string;
}

export function VoiceInsightsPanel({ profileId, sourceId, insightId }: VoiceInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState('transcription');

  const { data: insights, isLoading } = useQuery({
    queryKey: ['voice-insights', profileId, sourceId, insightId],
    queryFn: async () => {
      let query = supabase
        .from('voice_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (insightId) {
        query = query.eq('id', insightId);
      } else if (sourceId) {
        query = query.eq('source_id', sourceId);
      } else if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!(profileId || sourceId || insightId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mic className="h-4 w-4 animate-pulse" />
            Loading voice insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No voice insights available</p>
            <p className="text-sm mt-1">Run voice analysis to generate insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const insight = insights[0];
  const transcription = insight.full_transcription;
  const speakers = (insight.speakers as any[]) || [];
  const topics = (insight.topics_discussed as any[]) || [];
  const entities = insight.named_entities as Record<string, any[]> || {};
  const sentimentTimeline = (insight.sentiment_timeline as any[]) || [];
  const stressPoints = (insight.stress_points as any[]) || [];
  const moodPatterns = (insight.mood_patterns as any[]) || [];
  const detectedKeywords = (insight.detected_keywords as any[]) || [];
  const mentionedContacts = (insight.mentioned_contacts as any[]) || [];
  const actionItems = (insight.action_items as any[]) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5" />
          Voice Intelligence
          {insight.confidence_score && (
            <Badge variant="outline" className="ml-auto">
              {Math.round((insight.confidence_score as number) * 100)}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="transcription" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="psychology" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Psychology
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcription" className="mt-4">
            <div className="space-y-4">
              {/* Speakers Summary */}
              {speakers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {speakers.map((speaker: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {speaker.id}: {speaker.word_count} words
                    </Badge>
                  ))}
                </div>
              )}

              {/* Full Transcription */}
              <ScrollArea className="h-64 rounded-md border p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {transcription || 'No transcription available'}
                </p>
              </ScrollArea>

              {/* Action Items */}
              {actionItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Action Items</h4>
                  <div className="space-y-1">
                    {actionItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{item.item}</span>
                        {item.assignee && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {item.assignee}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="topics" className="mt-4">
            <div className="space-y-4">
              {/* Topics */}
              {topics.length > 0 ? (
                <div className="space-y-2">
                  {topics.map((topic: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{topic.topic}</span>
                        <Badge variant={topic.importance > 7 ? 'default' : 'secondary'}>
                          Importance: {topic.importance}/10
                        </Badge>
                      </div>
                      <Progress value={topic.importance * 10} className="h-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No topics extracted</p>
              )}

              {/* Named Entities */}
              {Object.keys(entities).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Named Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(entities).map(([type, items]) => 
                      (items as any[])?.map((item: any, idx: number) => (
                        <Badge key={`${type}-${idx}`} variant="outline">
                          {type}: {typeof item === 'string' ? item : item.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="psychology" className="mt-4">
            <div className="space-y-4">
              {/* Mood Patterns */}
              {moodPatterns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Mood Patterns</h4>
                  <div className="grid gap-2">
                    {moodPatterns.map((mood: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{mood.phase}</span>
                          <Badge variant={mood.mood === 'positive' ? 'default' : 'secondary'}>
                            {mood.mood}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Energy: </span>
                            <Progress value={mood.energy * 10} className="h-1 mt-1" />
                          </div>
                          <div>
                            <span className="text-muted-foreground">Engagement: </span>
                            <Progress value={mood.engagement * 10} className="h-1 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Timeline */}
              {sentimentTimeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sentiment Timeline</h4>
                  <div className="space-y-1">
                    {sentimentTimeline.slice(0, 5).map((point: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-16">{point.timestamp}</span>
                        <Badge variant={point.score > 0 ? 'default' : point.score < 0 ? 'destructive' : 'secondary'}>
                          {point.emotion || point.sentiment}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Score: {point.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stress Points */}
              {stressPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    Stress Indicators
                  </h4>
                  <div className="space-y-1">
                    {stressPoints.map((point: any, idx: number) => (
                      <div key={idx} className="p-2 bg-destructive/10 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span>{point.context}</span>
                          <Badge variant="destructive">
                            Intensity: {point.intensity}/10
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!moodPatterns.length && !sentimentTimeline.length && !stressPoints.length && (
                <p className="text-muted-foreground text-sm">No psychological analysis available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="mt-4">
            {detectedKeywords.length > 0 ? (
              <div className="space-y-2">
                {detectedKeywords.map((kw: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={kw.urgency === 'high' ? 'destructive' : 'default'}>
                        {kw.keyword}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {kw.count}x mentions
                      </span>
                    </div>
                    {kw.context && (
                      <p className="text-sm text-muted-foreground">
                        "{kw.context}"
                      </p>
                    )}
                    {kw.timestamps?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {kw.timestamps.slice(0, 3).map((ts: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ts}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No keywords detected</p>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            {mentionedContacts.length > 0 ? (
              <div className="space-y-2">
                {mentionedContacts.map((contact: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{contact.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.possible_profile_id && (
                        <Badge variant="default">Matched</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {contact.context}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No contacts identified</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
