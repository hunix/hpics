import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, Send, Loader2, Save, BookmarkPlus, Sparkles, RefreshCw, 
  Maximize2, Minimize2, Search, Zap, Database, Brain, Globe,
  FileText, Eye, MessageSquare, Network, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: RAGSource[];
  toolsUsed?: string[];
  saved?: boolean;
}

interface RAGSource {
  type: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

interface RAGPoweredAgentProps {
  profileId?: string;
  contactName?: string;
  className?: string;
  mode?: 'contact' | 'global';
}

const CONTACT_QUESTIONS = [
  "What are this contact's key behavioral patterns?",
  "Summarize all interactions and communications",
  "What anomalies or red flags should I know about?",
  "How has their engagement changed over time?",
  "What do their voice recordings reveal?",
  "What are the key insights from their social media?",
];

const GLOBAL_QUESTIONS = [
  "Which contacts mentioned competitor X recently?",
  "Find contacts with declining engagement scores",
  "Who has similar behavioral patterns to John?",
  "Show me all contacts connected to tech industry",
  "Which relationships need immediate attention?",
  "Find potential introductions between contacts",
];

export function RAGPoweredAgent({ 
  profileId, 
  contactName = 'Contact', 
  className,
  mode = profileId ? 'contact' : 'global'
}: RAGPoweredAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [agentMode, setAgentMode] = useState<'contact' | 'global'>(mode);
  const [stats, setStats] = useState({
    embeddingsCount: 0,
    sourcesSearched: 0,
    toolCalls: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use the new RAG-powered agent v2
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-ai-agent-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            profileId: agentMode === 'contact' ? profileId : undefined,
            question: question.trim(),
            mode: agentMode,
            conversationHistory: messages.slice(-6).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited. Please try again in a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add more credits.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;
      let sources: RAGSource[] = [];
      let toolsUsed: string[] = [];

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: [],
        toolsUsed: [],
      }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Handle different event types
            if (parsed.type === 'sources') {
              sources = parsed.sources || [];
              setStats(prev => ({ ...prev, sourcesSearched: sources.length }));
            } else if (parsed.type === 'tool_call') {
              toolsUsed.push(parsed.tool);
              setStats(prev => ({ ...prev, toolCalls: prev.toolCalls + 1 }));
            } else {
              // Standard content delta
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: assistantContent, sources, toolsUsed }
                      : m
                  )
                );
              }
            }
          } catch {
            // Incomplete JSON, put back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final update with sources
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: assistantContent, sources, toolsUsed }
            : m
        )
      );

    } catch (error) {
      console.error('RAG Agent error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [profileId, agentMode, messages, isLoading, toast]);

  const questions = agentMode === 'contact' ? CONTACT_QUESTIONS : GLOBAL_QUESTIONS;

  return (
    <Card className={cn('flex flex-col', isExpanded ? 'h-[700px]' : 'h-[500px]', className)}>
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            <span>RAG Intelligence Agent</span>
            {agentMode === 'contact' && profileId && (
              <Badge variant="secondary" className="text-xs">{contactName}</Badge>
            )}
            {agentMode === 'global' && (
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="h-3 w-3" />
                All Contacts
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Label htmlFor="mode-switch" className="text-xs">Global</Label>
              <Switch
                id="mode-switch"
                checked={agentMode === 'global'}
                onCheckedChange={(checked) => setAgentMode(checked ? 'global' : 'contact')}
                disabled={!profileId && agentMode === 'contact'}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessages([])}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>Sources: {stats.sourcesSearched}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Tools: {stats.toolCalls}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Switch
              id="show-sources"
              checked={showSources}
              onCheckedChange={setShowSources}
              className="h-4 w-7"
            />
            <Label htmlFor="show-sources" className="text-xs">Show Sources</Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <Brain className="h-16 w-16 text-primary/20" />
                  <Search className="h-6 w-6 absolute bottom-0 right-0 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  {agentMode === 'contact' 
                    ? `Deep intelligence on ${contactName}` 
                    : 'Cross-contact intelligence search'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Powered by RAG with semantic search across all your data
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
                <div className="grid gap-2">
                  {questions.slice(0, 4).map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 justify-start text-left"
                      onClick={() => sendMessage(q)}
                    >
                      <MessageSquare className="h-3 w-3 mr-2 shrink-0" />
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.role === 'assistant' && message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.toolsUsed.map((tool, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                              <Zap className="h-2.5 w-2.5 mr-1" />
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sources Panel */}
                  {message.role === 'assistant' && showSources && message.sources && message.sources.length > 0 && (
                    <div className="ml-11 p-2 bg-muted/50 rounded-lg border">
                      <p className="text-xs font-medium mb-2 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Sources ({message.sources.length})
                      </p>
                      <div className="space-y-1.5">
                        {message.sources.slice(0, 3).map((source, i) => (
                          <div key={i} className="text-xs bg-background p-2 rounded flex items-start gap-2">
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {source.type}
                            </Badge>
                            <span className="text-muted-foreground line-clamp-2">
                              {source.content.substring(0, 100)}...
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                              {(source.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-muted-foreground">Searching knowledge base...</span>
                    </div>
                    <Progress value={33} className="h-1 w-32" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              placeholder={agentMode === 'contact' 
                ? `Ask about ${contactName}...` 
                : 'Search across all contacts...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={() => sendMessage(input)} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RAGPoweredAgent;
