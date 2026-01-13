/**
 * Conversation Copilot Component
 * Real-time conversation assistance with AI-powered suggestions and contact selector
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Sparkles, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  Target,
  Shield,
  Heart,
  Zap,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  type: 'opener' | 'response' | 'deflection' | 'escalation' | 'close';
  content: string;
  principle: string;
  confidence: number;
  reasoning: string;
}

interface Contact {
  id: string;
  name: string;
}

export function ConversationCopilot() {
  const { user } = useAuth();
  const [context, setContext] = useState('');
  const [objective, setObjective] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');

  // Fetch contacts for selector
  const { data: contacts = [] } = useQuery({
    queryKey: ['copilot-contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .order('first_name')
        .limit(100);
      
      return (data || []).map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'
      }));
    },
    enabled: !!user?.id
  });

  // Mutation to save feedback
  const saveFeedback = useMutation({
    mutationFn: async ({ suggestionId, isPositive }: { suggestionId: string; isPositive: boolean }) => {
      // Store feedback in app_settings as a simple key-value store
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user?.id,
          setting_key: `copilot_feedback_${suggestionId}`,
          setting_value: isPositive ? 'positive' : 'negative',
          metadata: { 
            context, 
            objective,
            timestamp: new Date().toISOString()
          }
        });
      if (error) throw error;
    },
    onSuccess: (_, { isPositive }) => {
      toast.success(isPositive ? 'Thanks for the feedback!' : 'Feedback noted');
    }
  });

  const generateSuggestions = async () => {
    if (!context.trim() || !user?.id) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('action-recommendation-engine', {
        body: {
          type: 'conversation_suggestions',
          context,
          objective,
          profileId: selectedContact || undefined
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        // Generate sample suggestions
        setSuggestions([
          {
            id: '1',
            type: 'opener',
            content: `Based on our last conversation about your project, I wanted to share something that might help...`,
            principle: 'reciprocity',
            confidence: 85,
            reasoning: 'Opens with value-giving, referencing shared history'
          },
          {
            id: '2',
            type: 'response',
            content: `That's a great point. I've seen similar challenges, and here's what worked well...`,
            principle: 'authority',
            confidence: 78,
            reasoning: 'Validates their point while establishing expertise'
          },
          {
            id: '3',
            type: 'escalation',
            content: `Given your timeline, it might make sense to move forward quickly. Others in your position have benefited from...`,
            principle: 'scarcity',
            confidence: 72,
            reasoning: 'Creates urgency with social proof'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleFeedback = (suggestionId: string, isPositive: boolean) => {
    saveFeedback.mutate({ suggestionId, isPositive });
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'opener': return <MessageSquare className="h-4 w-4" />;
      case 'response': return <Zap className="h-4 w-4" />;
      case 'deflection': return <Shield className="h-4 w-4" />;
      case 'escalation': return <Target className="h-4 w-4" />;
      case 'close': return <Heart className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'opener': return 'bg-blue-500/10 text-blue-600';
      case 'response': return 'bg-emerald-500/10 text-emerald-600';
      case 'deflection': return 'bg-amber-500/10 text-amber-600';
      case 'escalation': return 'bg-rose-500/10 text-rose-600';
      case 'close': return 'bg-violet-500/10 text-violet-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPrincipleEmoji = (principle: string) => {
    switch (principle) {
      case 'reciprocity': return '🎁';
      case 'commitment': return '🤝';
      case 'social_proof': return '👥';
      case 'authority': return '🏆';
      case 'liking': return '💖';
      case 'scarcity': return '⏳';
      case 'unity': return '🤗';
      default: return '✨';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Conversation Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact (optional)
            </label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact for personalized suggestions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific contact</SelectItem>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Objective</label>
            <Input
              placeholder="e.g., Get agreement on partnership terms"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Conversation Context</label>
            <Textarea
              placeholder="Paste the conversation or describe the situation..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={generateSuggestions}
            disabled={!context.trim() || isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Suggestions
              </>
            )}
          </Button>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setObjective('Build rapport')}>
              🤝 Build Rapport
            </Button>
            <Button variant="outline" size="sm" onClick={() => setObjective('Close deal')}>
              💰 Close Deal
            </Button>
            <Button variant="outline" size="sm" onClick={() => setObjective('Get introduction')}>
              👥 Get Intro
            </Button>
            <Button variant="outline" size="sm" onClick={() => setObjective('Handle objection')}>
              🛡️ Handle Objection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No suggestions yet</p>
                  <p className="text-sm">Enter conversation context and click generate</p>
                </div>
              ) : (
                suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(getTypeColor(suggestion.type))}>
                          {getTypeIcon(suggestion.type)}
                          <span className="ml-1 capitalize">{suggestion.type}</span>
                        </Badge>
                        <span className="text-lg">{getPrincipleEmoji(suggestion.principle)}</span>
                      </div>
                      <Badge variant="secondary">
                        {suggestion.confidence}% confidence
                      </Badge>
                    </div>

                    <p className="text-sm leading-relaxed">{suggestion.content}</p>

                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleFeedback(suggestion.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleFeedback(suggestion.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => copyToClipboard(suggestion.content)}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
