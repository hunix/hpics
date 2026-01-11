/**
 * Mobile Intel Sheet
 * Swipe-up sheet showing contact intelligence on mobile
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronUp, 
  Brain, 
  Camera, 
  Mic, 
  FileText, 
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface MobileIntelSheetProps {
  profileId: string;
  profileName: string;
  onAction?: (action: 'call' | 'email' | 'message' | 'capture') => void;
}

export function MobileIntelSheet({ profileId, profileName, onAction }: MobileIntelSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent captures for this contact
  const { data: recentCaptures } = useQuery({
    queryKey: ['contact-captures', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('device_captures')
        .select('id, capture_type, status, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: isOpen && !!profileId
  });

  // Fetch AI analyses
  const { data: analyses } = useQuery({
    queryKey: ['contact-analyses', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analyses')
        .select('id, analysis_type, generated_at')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(3);
      return data ?? [];
    },
    enabled: isOpen && !!profileId
  });

  // Fetch profile stats
  const { data: captureStats } = useQuery({
    queryKey: ['contact-capture-stats', profileId],
    queryFn: async () => {
      const { count } = await supabase
        .from('device_captures')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId);
      return { totalCaptures: count ?? 0 };
    },
    enabled: isOpen && !!profileId
  });

  const getCaptureIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return Camera;
      case 'voice_memo': return Mic;
      case 'document': return FileText;
      case 'location': return MapPin;
      default: return FileText;
    }
  };

  const quickActions = [
    { id: 'call', icon: Phone, label: 'Call', color: 'bg-green-500' },
    { id: 'email', icon: Mail, label: 'Email', color: 'bg-blue-500' },
    { id: 'message', icon: MessageSquare, label: 'Message', color: 'bg-purple-500' },
    { id: 'capture', icon: Camera, label: 'Capture', color: 'bg-orange-500' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 rounded-full shadow-lg bg-background/95 backdrop-blur-sm md:hidden z-40"
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Intel
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl safe-area-pb">
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {profileName} Intel
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="space-y-6 pb-8">
            {/* Capture Stats */}
            {captureStats && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Captures</span>
                  <Badge variant="default">
                    {captureStats.totalCaptures}
                  </Badge>
                </div>
                <Progress value={Math.min(100, captureStats.totalCaptures * 10)} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {captureStats.totalCaptures === 0 
                    ? 'Start capturing data for this contact'
                    : `${captureStats.totalCaptures} intelligence items collected`
                  }
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      onAction?.(action.id as 'call' | 'email' | 'message' | 'capture');
                      if (action.id === 'capture') setIsOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                      "bg-muted/50 hover:bg-muted active:scale-95"
                    )}
                  >
                    <div className={cn("p-2 rounded-full", action.color)}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Captures */}
            {recentCaptures && recentCaptures.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Captures</h3>
                <div className="space-y-2">
                  {recentCaptures.map(capture => {
                    const Icon = getCaptureIcon(capture.capture_type);
                    return (
                      <div
                        key={capture.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="p-2 rounded-lg bg-background">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium capitalize">
                            {capture.capture_type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(capture.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <Badge 
                          variant={capture.status === 'processed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {capture.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Analyses */}
            {analyses && analyses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">AI Analyses</h3>
                <div className="space-y-2">
                  {analyses.map(analysis => (
                    <div
                      key={analysis.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize">
                          {analysis.analysis_type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(analysis.generated_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!recentCaptures || recentCaptures.length === 0) && (!analyses || analyses.length === 0) && (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-sm font-medium mb-1">No intelligence yet</h3>
                <p className="text-xs text-muted-foreground">
                  Start capturing data to build this contact's profile
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
