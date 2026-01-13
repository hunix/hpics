import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { AdaptiveVoiceRecorder } from '@/components/capture/AdaptiveVoiceRecorder';
import { AdaptiveMediaCapture } from '@/components/capture/AdaptiveMediaCapture';
import { LiveFaceScanner } from '@/components/mobile/LiveFaceScanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared';

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
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  const handleCapture = useCallback(() => {
    setShowMediaCapture(true);
  }, []);

  const handleRecord = useCallback(() => {
    setShowVoiceRecorder(true);
  }, []);

  const handleScan = useCallback(() => {
    setShowFaceScanner(true);
  }, []);

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
      color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30',
      action: handleCapture,
      shortcut: '⌘C'
    },
    { 
      id: 'record', 
      label: 'Record', 
      icon: Mic, 
      color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30',
      action: handleRecord,
      shortcut: '⌘R'
    },
    { 
      id: 'scan', 
      label: 'Scan', 
      icon: Scan, 
      color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border-violet-500/30',
      action: handleScan,
      shortcut: '⌘S'
    },
    { 
      id: 'search', 
      label: 'Search', 
      icon: Search, 
      color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30',
      action: handleSearch,
      shortcut: '⌘K'
    },
    { 
      id: 'ai', 
      label: 'AI Chat', 
      icon: MessageSquare, 
      color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30',
      action: handleAIChat,
      shortcut: '⌘I'
    },
  ];

  const systemStats = [
    { label: 'Critical', value: criticalCount, color: 'text-red-400', dotColor: 'bg-red-400' },
    { label: 'Important', value: importantCount, color: 'text-amber-400', dotColor: 'bg-amber-400' },
    { label: 'Context', value: currentContext || 'Unknown', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    { label: 'Confidence', value: `${Math.round(confidence * 100)}%`, color: 'text-blue-400', dotColor: 'bg-blue-400' },
  ];

  return (
    <AppLayout title="Command Center">
      {/* Voice Recorder - Adaptive (mobile fullscreen / desktop dialog) */}
      <AdaptiveVoiceRecorder 
        open={showVoiceRecorder} 
        onOpenChange={setShowVoiceRecorder}
        onComplete={() => setShowVoiceRecorder(false)}
      />
      
      {/* Media Capture - Adaptive (mobile fullscreen / desktop dialog) */}
      <AdaptiveMediaCapture
        open={showMediaCapture}
        onOpenChange={setShowMediaCapture}
        onComplete={() => setShowMediaCapture(false)}
      />
      
      {/* Face Scanner Dialog */}
      <Dialog open={showFaceScanner} onOpenChange={setShowFaceScanner}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <LiveFaceScanner 
            className="border-0"
            onProfileMatch={(profileId) => {
              setShowFaceScanner(false);
              navigate(`/contacts/${profileId}`);
            }}
          />
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        {/* Status Bar - Enhanced with glass morphism */}
        <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <span className="absolute inset-0 h-4 w-4 rounded-full bg-emerald-400/30 animate-ping" />
                  </div>
                  <span className="text-sm font-semibold">Command Center</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-4">
                  {systemStats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", stat.dotColor)} />
                      <span className="text-xs text-muted-foreground">{stat.label}:</span>
                      <span className={cn("text-xs font-semibold", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Live
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/intelligence')}
                  className="text-xs hover:bg-primary/10"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Explore Features
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Ribbon - Enhanced */}
        <div className="-mx-4 sm:-mx-6 border-b border-border/20 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {quickActions.map((action) => (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 transition-all border",
                      action.color,
                      action.id === 'capture' && isCapturing && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background'
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="font-medium">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-md border border-current/20 bg-background/50 px-1.5 font-mono text-[10px] font-medium opacity-70">
                        {action.shortcut}
                      </kbd>
                    )}
                  </Button>
                </motion.div>
              ))}
              
              <Separator orientation="vertical" className="h-8 mx-2" />
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/mobile/ecosystem')}
                  className="rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/30 hover:border-primary/50"
                >
                  <Zap className="h-4 w-4 mr-2 text-primary" />
                  Ecosystem
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Priority Feed - Left Panel */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="h-[calc(100vh-280px)] border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  Priority Feed
                  {(criticalCount > 0 || importantCount > 0) && (
                    <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {criticalCount + importantCount} items
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-360px)]">
                  <div className="px-6 pb-6 pt-4">
                    <PriorityFeed showHeader={false} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Context Panel - Right Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-[180px] space-y-4">
              <ContextPanel className="h-[calc(100vh-340px)]" />
              
              {/* Quick Stats - Enhanced with design system */}
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="text-xl font-bold">0</div>
                      <div className="text-xs text-muted-foreground">Nearby</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
                        <MapPin className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="text-xl font-bold">0</div>
                      <div className="text-xs text-muted-foreground">Geofences</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="text-xl font-bold">0</div>
                      <div className="text-xs text-muted-foreground">Alerts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
