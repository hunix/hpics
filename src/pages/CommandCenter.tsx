import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Mic, Scan, Search, MessageSquare, 
  Zap, Activity, Users, MapPin, Shield,
  ChevronRight, Sparkles, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PriorityFeed } from '@/components/command/PriorityFeed';
import { ContextPanel } from '@/components/command/ContextPanel';
import { useUnifiedIntelligence } from '@/hooks/useUnifiedIntelligence';
import { useContextEngine } from '@/hooks/useContextEngine';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';
import { QuickVoiceRecorder } from '@/components/capture/QuickVoiceRecorder';
import { QuickMediaCapture } from '@/components/capture/QuickMediaCapture';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  shortcut?: string;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const { criticalCount, importantCount } = useUnifiedIntelligence();
  const { currentContext, confidence } = useContextEngine();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaCapture, setShowMediaCapture] = useState(false);

  const handleCapture = useCallback(() => {
    setShowMediaCapture(true);
  }, []);

  const handleRecord = useCallback(() => {
    setShowVoiceRecorder(true);
  }, []);

  const handleScan = useCallback(() => {
    // Navigate to face scanner or trigger scan
    navigate('/contacts');
  }, [navigate]);

  const handleSearch = useCallback(() => {
    navigate('/semantic-search');
  }, [navigate]);

  const handleAIChat = useCallback(() => {
    navigate('/ai-chat');
  }, [navigate]);

  const quickActions: QuickAction[] = [
    { 
      id: 'capture', 
      label: 'Capture', 
      icon: Camera, 
      color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
      action: handleCapture,
      shortcut: '⌘C'
    },
    { 
      id: 'record', 
      label: 'Record', 
      icon: Mic, 
      color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
      action: handleRecord,
      shortcut: '⌘R'
    },
    { 
      id: 'scan', 
      label: 'Scan', 
      icon: Scan, 
      color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30',
      action: handleScan,
      shortcut: '⌘S'
    },
    { 
      id: 'search', 
      label: 'Search', 
      icon: Search, 
      color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
      action: handleSearch,
      shortcut: '⌘K'
    },
    { 
      id: 'ai', 
      label: 'AI Chat', 
      icon: MessageSquare, 
      color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
      action: handleAIChat,
      shortcut: '⌘I'
    },
  ];

  const systemStats = [
    { label: 'Critical', value: criticalCount, color: 'text-red-400' },
    { label: 'Important', value: importantCount, color: 'text-amber-400' },
    { label: 'Context', value: currentContext || 'Unknown', color: 'text-emerald-400' },
    { label: 'Confidence', value: `${Math.round(confidence * 100)}%`, color: 'text-blue-400' },
  ];

  return (
    <AppLayout title="Command Center">
      {/* Voice Recorder Dialog */}
      <QuickVoiceRecorder 
        open={showVoiceRecorder} 
        onOpenChange={setShowVoiceRecorder}
        onComplete={() => setShowVoiceRecorder(false)}
      />
      
      {/* Media Capture Dialog */}
      <QuickMediaCapture
        open={showMediaCapture}
        onOpenChange={setShowMediaCapture}
        onComplete={() => setShowMediaCapture(false)}
      />
      
      <div className="space-y-6">
      {/* Status Bar */}
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">Command Center</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-3">
                {systemStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{stat.label}:</span>
                    <span className={cn("text-xs font-medium", stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/intelligence')}
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Explore Features
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="-mx-4 sm:-mx-6 border-b border-border/30 bg-muted/30">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {quickActions.map((action) => (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 transition-all",
                    action.color,
                    action.id === 'capture' && isCapturing && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background'
                  )}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {action.shortcut}
                    </kbd>
                  )}
                </Button>
              </motion.div>
            ))}
            
            <Separator orientation="vertical" className="h-8 mx-2" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/mobile/ecosystem')}
              className="rounded-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              Ecosystem
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Priority Feed - Left Panel */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="h-[calc(100vh-220px)] border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Priority Feed
                  {(criticalCount > 0 || importantCount > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {criticalCount + importantCount} items
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="px-6 pb-6">
                    <PriorityFeed showHeader={false} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Context Panel - Right Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-[140px]">
              <ContextPanel className="h-[calc(100vh-220px)]" />
              
              {/* Quick Stats */}
              <Card className="mt-4 border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <div className="text-lg font-semibold">0</div>
                      <div className="text-xs text-muted-foreground">Nearby</div>
                    </div>
                    <div>
                      <MapPin className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <div className="text-lg font-semibold">0</div>
                      <div className="text-xs text-muted-foreground">Geofences</div>
                    </div>
                    <div>
                      <Shield className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <div className="text-lg font-semibold">0</div>
                      <div className="text-xs text-muted-foreground">Alerts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
