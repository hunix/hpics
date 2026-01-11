import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, Send, Sparkles, Minimize2, Maximize2,
  Bot, User, Loader2, Lightbulb, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ContextualSuggestion {
  text: string;
  action: () => void;
}

// Context-aware suggestions based on current route
function getContextualSuggestions(pathname: string, navigate: (path: string) => void): ContextualSuggestion[] {
  const suggestions: Record<string, ContextualSuggestion[]> = {
    '/dashboard': [
      { text: 'Show relationship health trends', action: () => {} },
      { text: 'Analyze my communication patterns', action: () => {} },
      { text: 'Who should I follow up with?', action: () => {} },
    ],
    '/contacts': [
      { text: 'Find contacts I haven\'t spoken to recently', action: () => {} },
      { text: 'Suggest duplicate contacts', action: () => {} },
      { text: 'Enrich contact data with AI', action: () => {} },
    ],
    '/calendar': [
      { text: 'Find best time for a meeting', action: () => {} },
      { text: 'Show upcoming birthdays', action: () => {} },
      { text: 'Analyze my meeting patterns', action: () => {} },
    ],
    '/communications': [
      { text: 'Summarize recent conversations', action: () => {} },
      { text: 'Analyze sentiment trends', action: () => {} },
      { text: 'Find unanswered messages', action: () => {} },
    ],
  };
  
  return suggestions[pathname] || [
    { text: 'What can you help me with?', action: () => {} },
    { text: 'Show me insights about my contacts', action: () => {} },
    { text: 'Navigate to dashboard', action: () => navigate('/dashboard') },
  ];
}

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const contextualSuggestions = getContextualSuggestions(location.pathname, navigate);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);
  
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate AI response (in production, this would call an edge function)
    setTimeout(() => {
      const responses = [
        'I can help you with that! Let me analyze your data...',
        'Based on your contact history, I recommend focusing on these relationships.',
        'I found some interesting patterns in your communication data.',
        'Here are some suggestions based on your current context.',
      ];
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        suggestions: ['Tell me more', 'Show details', 'Take action'],
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  }, [input, isLoading]);
  
  const handleSuggestionClick = (suggestion: ContextualSuggestion) => {
    setInput(suggestion.text);
    suggestion.action();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
      {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed z-50',
              // Position above bottom nav on mobile (nav is ~64px + safe area)
              'bottom-24 right-4 md:bottom-6 md:right-6',
              // Hide on mobile since AI has its own tab now
              'hidden md:flex',
              'w-14 h-14 rounded-full',
              'bg-gradient-to-br from-violet-500 to-indigo-600',
              'shadow-lg shadow-violet-500/25',
              'items-center justify-center',
              'hover:shadow-xl hover:shadow-violet-500/30 transition-shadow'
            )}
          >
            <Sparkles className="h-6 w-6 text-white" />
            
            {/* Pulse indicator */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 500,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-[380px] bg-background rounded-2xl',
              'shadow-2xl border overflow-hidden',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between px-4 py-3',
              'bg-gradient-to-r from-violet-500 to-indigo-600',
              'text-white'
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">PICS Assistant</h3>
                  <p className="text-[10px] text-white/70">AI-powered help</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!isMinimized && (
              <>
                {/* Messages */}
                <ScrollArea 
                  className="flex-1 p-4"
                  ref={scrollRef}
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-violet-500" />
                      </div>
                      <h4 className="font-semibold mb-1">How can I help?</h4>
                      <p className="text-sm text-muted-foreground mb-6">
                        Ask me anything about your contacts, relationships, or data.
                      </p>
                      
                      {/* Contextual suggestions */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Suggestions for this page
                        </p>
                        {contextualSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={cn(
                              'w-full flex items-center justify-between gap-2',
                              'px-3 py-2 rounded-lg text-sm text-left',
                              'bg-muted/50 hover:bg-muted transition-colors'
                            )}
                          >
                            <span>{suggestion.text}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-2',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          )}
                          
                          <div className={cn(
                            'max-w-[80%] px-3 py-2 rounded-xl text-sm',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          )}>
                            {message.content}
                            
                            {message.suggestions && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.suggestions.map((suggestion, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setInput(suggestion)}
                                    className="px-2 py-1 rounded bg-background/50 text-xs hover:bg-background transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-muted rounded-tl-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
                
                {/* Input */}
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    AI responses are for guidance only. Always verify important information.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
