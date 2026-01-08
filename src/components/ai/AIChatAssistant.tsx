import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  User,
  RefreshCw,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function AIChatAssistant({ className, defaultExpanded = true }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your CRM assistant. Ask me anything about your contacts, relationships, or data. Try:\n\n• \"Who should I follow up with this week?\"\n• \"Find contacts in tech industry\"\n• \"Summarize my relationship with John Smith\"\n• \"What meetings do I have coming up?\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const { data, error } = await supabase.functions.invoke('ai-chat-query', {
        body: { 
          message: userMessage,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });
      if (error) throw error;
      return data.response;
    },
    onMutate: (userMessage) => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
    },
    onSuccess: (response) => {
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    },
    onError: (error) => {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${(error as Error).message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    chatMutation.mutate(input.trim());
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      timestamp: new Date()
    }]);
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className={cn("fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg", className)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(false)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={message.role === 'assistant' ? 'bg-primary text-primary-foreground' : ''}>
                    {message.role === 'assistant' ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%] text-sm",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your contacts..."
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={chatMutation.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
