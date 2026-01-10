import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, Save, BookmarkPlus, Eye, FileText, Sparkles, X, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  saved?: boolean;
}

interface ContactAIAgentProps {
  profileId: string;
  contactName: string;
  className?: string;
  defaultExpanded?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What are this contact's communication preferences?",
  "Summarize all my interactions with this person",
  "What behavioral patterns have you noticed?",
  "What's the relationship strength and health?",
  "Any red flags or concerns I should know about?",
  "What topics should I discuss in our next meeting?",
  "How has their engagement changed over time?",
  "What connections do they have in my network?",
];

export function ContactAIAgent({ profileId, contactName, className, defaultExpanded = false }: ContactAIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [saveConfig, setSaveConfig] = useState({
    saveAs: 'insight' as 'note' | 'observation' | 'insight' | 'analysis',
    category: '',
    importance: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-ai-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            profileId,
            question: question.trim(),
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
            }
          } catch {}
        }
        // Final update
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantId 
              ? { ...m, content: assistantContent }
              : m
          )
        );
      }

    } catch (error) {
      console.error('AI Agent error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
      // Remove the failed assistant message
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [profileId, messages, isLoading, toast]);

  const handleSave = async () => {
    if (!selectedMessage) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      // Find the question that prompted this answer
      const messageIndex = messages.findIndex(m => m.id === selectedMessage.id);
      const question = messageIndex > 0 ? messages[messageIndex - 1].content : '';

      const { data, error } = await supabase.functions.invoke('save-ai-insight', {
        body: {
          profileId,
          content: selectedMessage.content,
          question,
          saveAs: saveConfig.saveAs,
          category: saveConfig.category || undefined,
          importance: saveConfig.importance,
          tags: saveConfig.tags ? saveConfig.tags.split(',').map(t => t.trim()) : undefined,
        },
      });

      if (error) throw error;

      // Mark message as saved
      setMessages(prev => 
        prev.map(m => 
          m.id === selectedMessage.id 
            ? { ...m, saved: true }
            : m
        )
      );

      toast({
        title: 'Saved!',
        description: `Insight saved as ${saveConfig.saveAs}`,
      });

      setSaveDialogOpen(false);
      setSelectedMessage(null);
      setSaveConfig({
        saveAs: 'insight',
        category: '',
        importance: 'medium',
        tags: '',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save insight',
        variant: 'destructive',
      });
    }
  };

  const openSaveDialog = (message: Message) => {
    setSelectedMessage(message);
    setSaveDialogOpen(true);
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <>
      <Card className={cn('flex flex-col', isExpanded ? 'h-[600px]' : 'h-96', className)}>
        <CardHeader className="py-3 px-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              <span>AI Agent</span>
              <Badge variant="secondary" className="text-xs">{contactName}</Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearConversation}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                  <p className="text-sm font-medium">Ask me anything about {contactName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    I have access to all their data, analyses, and interactions
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-1.5 px-2 whitespace-normal text-left"
                        onClick={() => sendMessage(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.role === 'assistant' && message.content && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                          {message.saved ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <BookmarkPlus className="h-3 w-3" />
                              Saved
                            </Badge>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => {
                                  setSaveConfig(prev => ({ ...prev, saveAs: 'note' }));
                                  openSaveDialog(message);
                                }}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Save as Note
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSaveConfig(prev => ({ ...prev, saveAs: 'observation' }));
                                  openSaveDialog(message);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Save as Observation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSaveConfig(prev => ({ ...prev, saveAs: 'insight' }));
                                  openSaveDialog(message);
                                }}>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Save as AI Insight
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSaveConfig(prev => ({ ...prev, saveAs: 'analysis' }));
                                  openSaveDialog(message);
                                }}>
                                  <Bot className="h-4 w-4 mr-2" />
                                  Save as Analysis
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                placeholder={`Ask about ${contactName}...`}
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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save AI Insight</DialogTitle>
            <DialogDescription>
              Save this response to {contactName}'s profile
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Save As</Label>
              <Select 
                value={saveConfig.saveAs} 
                onValueChange={(v: any) => setSaveConfig(prev => ({ ...prev, saveAs: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note (visible in contact profile)</SelectItem>
                  <SelectItem value="observation">Observation (behavioral tracking)</SelectItem>
                  <SelectItem value="insight">AI Insight (analysis results)</SelectItem>
                  <SelectItem value="analysis">Analysis (detailed behavioral)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Input
                placeholder="e.g., communication_style, risk_assessment"
                value={saveConfig.category}
                onChange={(e) => setSaveConfig(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Importance</Label>
              <Select 
                value={saveConfig.importance} 
                onValueChange={(v: any) => setSaveConfig(prev => ({ ...prev, importance: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., strategy, follow-up, concern"
                value={saveConfig.tags}
                onChange={(e) => setSaveConfig(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            {selectedMessage && (
              <div className="p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-1">Content to save:</p>
                <p className="text-sm line-clamp-4">{selectedMessage.content}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ContactAIAgent;
