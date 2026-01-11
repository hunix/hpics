import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Bot, User, Loader2, Lightbulb, ArrowRight,
  Camera, Mic, FileText, Brain, Trash2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hapticFeedback } from '@/lib/nativeFeatures';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  icon: typeof Camera;
  label: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  { id: 'analyze', icon: Brain, label: 'Analyze contact', prompt: 'Analyze my relationship with ' },
  { id: 'capture', icon: Camera, label: 'Process photo', prompt: 'What can you tell me about this photo?' },
  { id: 'voice', icon: Mic, label: 'Voice memo', prompt: 'Transcribe and analyze this voice memo' },
  { id: 'document', icon: FileText, label: 'Scan document', prompt: 'Extract information from this document' },
];

// Context-aware suggestions based on current context
function getContextualSuggestions(contactName?: string): string[] {
  if (contactName) {
    return [
      `What do I know about ${contactName}?`,
      `Summarize my relationship with ${contactName}`,
      `Suggest topics to discuss with ${contactName}`,
      `When did I last interact with ${contactName}?`,
    ];
  }
  
  return [
    'Who should I follow up with this week?',
    'Show relationship health trends',
    'Find contacts I haven\'t spoken to recently',
    'Analyze my communication patterns',
    'Suggest duplicate contacts to merge',
  ];
}

export default function AIChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const contactId = searchParams.get('contactId');
  const contactName = searchParams.get('contactName');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const contextualSuggestions = getContextualSuggestions(contactName || undefined);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    await hapticFeedback('light');
    setShowSuggestions(false);
    
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
  
  const handleSuggestionClick = async (suggestion: string) => {
    await hapticFeedback('light');
    setInput(suggestion);
    inputRef.current?.focus();
  };
  
  const handleQuickAction = async (action: QuickAction) => {
    await hapticFeedback('medium');
    setInput(action.prompt);
    inputRef.current?.focus();
  };
  
  const clearChat = async () => {
    await hapticFeedback('medium');
    setMessages([]);
    setShowSuggestions(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex flex-col h-screen-mobile bg-background safe-area-inset">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-500 to-indigo-600 text-white safe-area-pt">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">PICS Assistant</h1>
            <p className="text-xs text-white/70">
              {contactName ? `Context: ${contactName}` : 'AI-powered intelligence'}
            </p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={clearChat}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </header>
      
      {/* Messages Area */}
      <ScrollArea 
        className="flex-1 px-4"
        ref={scrollRef}
      >
        <div className="py-4 space-y-4">
          {messages.length === 0 && showSuggestions ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-violet-500" />
              </div>
              <h2 className="font-semibold text-xl mb-2">How can I help?</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Ask me anything about your contacts, relationships, or data.
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl',
                      'bg-muted/50 hover:bg-muted active:scale-95',
                      'transition-all duration-200 touch-target'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Contextual suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-3">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions
                </p>
                {contextualSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2',
                      'px-4 py-3 rounded-xl text-sm text-left',
                      'bg-muted/50 hover:bg-muted active:scale-[0.98]',
                      'transition-all duration-200 touch-target'
                    )}
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  )}>
                    {message.content}
                    
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 rounded-lg bg-background/50 text-xs hover:bg-background transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* Scroll to suggestions button */}
      {messages.length > 0 && (
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setShowSuggestions(true)}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground hover:bg-muted/80"
          >
            <ChevronDown className="h-3 w-3" />
            Show suggestions
          </motion.button>
        </AnimatePresence>
      )}
      
      {/* Input Area */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm safe-area-pb">
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 h-12 text-base rounded-xl"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI responses are for guidance only. Always verify important information.
        </p>
      </div>
    </div>
  );
}
