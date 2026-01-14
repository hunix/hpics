import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Keyboard, Eye, EyeOff, CheckCircle2, 
  AlertTriangle, Activity, User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  createKeystrokeAnalyzer,
  keystrokeDynamicsAnalyzer,
  type KeyEvent,
  type KeystrokeProfile,
  type KeystrokeComparison
} from '@/lib/biometrics/keystrokeDynamics';

interface KeystrokeMonitorProps {
  profileId?: string;
  onMatch?: (profileId: string, confidence: number) => void;
  onMismatch?: (details: KeystrokeComparison) => void;
  showVisualFeedback?: boolean;
}

export function KeystrokeMonitor({ 
  profileId,
  onMatch,
  onMismatch,
  showVisualFeedback = true
}: KeystrokeMonitorProps) {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentEvents, setCurrentEvents] = useState<KeyEvent[]>([]);
  const [matchResult, setMatchResult] = useState<KeystrokeComparison | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);
  
  const analyzerRef = useRef(createKeystrokeAnalyzer());

  // Fetch stored keystroke profiles
  const { data: profiles } = useQuery({
    queryKey: ['keystroke-profiles', user?.id, profileId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('keystroke_profiles')
        .select('*')
        .eq('user_id', user.id);
      
      if (profileId) {
        query = query.eq('profile_id', profileId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const handleKeyEvent = useCallback((e: KeyboardEvent, type: 'keydown' | 'keyup') => {
    if (!isMonitoring) return;

    const keyEvent: KeyEvent = {
      key: e.key,
      code: e.code,
      timestamp: Date.now(),
      type
    };

    setCurrentEvents(prev => {
      const updated = [...prev, keyEvent];
      
      // Keep only last 100 events to prevent memory issues
      if (updated.length > 100) {
        return updated.slice(-100);
      }
      return updated;
    });

    analyzerRef.current.recordKeyEvent(keyEvent);
    setLastActivityTime(Date.now());
  }, [isMonitoring]);

  // Set up global keyboard listeners
  useEffect(() => {
    if (!isMonitoring) return;

    const handleKeyDown = (e: KeyboardEvent) => handleKeyEvent(e, 'keydown');
    const handleKeyUp = (e: KeyboardEvent) => handleKeyEvent(e, 'keyup');

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMonitoring, handleKeyEvent]);

  // Periodically analyze and compare
  useEffect(() => {
    if (!isMonitoring || !profiles || profiles.length === 0 || currentEvents.length < 20) {
      return;
    }

    const intervalId = setInterval(() => {
      const currentProfile = analyzerRef.current.buildProfile(currentEvents);
      
      // Compare against stored profiles
      let bestMatch: { profileId: string; comparison: KeystrokeComparison } | null = null;
      
      for (const storedProfile of profiles) {
        const reconstructedProfile: KeystrokeProfile = {
          typingPatterns: storedProfile.typing_patterns as Record<string, number>,
          digraphTimings: storedProfile.digraph_timings as Record<string, { mean: number; std: number }>,
          keyHoldTimes: storedProfile.key_hold_times as Record<string, { mean: number; std: number }>,
          flightTimes: storedProfile.flight_times as Record<string, { mean: number; std: number }>,
          typingSpeedWPM: storedProfile.typing_speed_wpm || 0,
          errorRate: storedProfile.error_rate || 0,
          rhythmConsistency: storedProfile.rhythm_consistency || 0,
          qualityScore: storedProfile.quality_score || 0,
          sampleCount: 1,
          createdAt: new Date(storedProfile.created_at || Date.now())
        };

        const comparison = keystrokeDynamicsAnalyzer.compare(currentProfile, reconstructedProfile);
        
        if (!bestMatch || comparison.similarity > bestMatch.comparison.similarity) {
          bestMatch = { profileId: storedProfile.profile_id, comparison };
        }
      }

      if (bestMatch) {
        setMatchResult(bestMatch.comparison);
        
        if (bestMatch.comparison.isMatch) {
          onMatch?.(bestMatch.profileId, bestMatch.comparison.similarity);
        } else {
          onMismatch?.(bestMatch.comparison);
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isMonitoring, profiles, currentEvents, onMatch, onMismatch]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      setCurrentEvents([]);
      setMatchResult(null);
      analyzerRef.current = createKeystrokeAnalyzer();
    } else {
      setIsMonitoring(true);
    }
  };

  const getMatchStatus = () => {
    if (!matchResult) return { icon: Activity, color: 'text-muted-foreground', text: 'Waiting for data...' };
    
    if (matchResult.isMatch && matchResult.similarity >= 0.8) {
      return { icon: CheckCircle2, color: 'text-green-500', text: 'Strong Match' };
    } else if (matchResult.isMatch) {
      return { icon: CheckCircle2, color: 'text-yellow-500', text: 'Partial Match' };
    } else {
      return { icon: AlertTriangle, color: 'text-red-500', text: 'No Match' };
    }
  };

  const status = getMatchStatus();
  const StatusIcon = status.icon;

  if (!showVisualFeedback) {
    // Invisible monitoring mode - just track events
    return null;
  }

  return (
    <Card className={isMonitoring ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4" />
            Keystroke Monitor
          </CardTitle>
          <Button 
            variant={isMonitoring ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <span className="font-medium">{status.text}</span>
          </div>
          {matchResult && (
            <Badge variant={matchResult.isMatch ? 'default' : 'destructive'}>
              {(matchResult.similarity * 100).toFixed(0)}% match
            </Badge>
          )}
        </div>

        {/* Live Metrics */}
        {isMonitoring && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="font-mono font-bold">{currentEvents.length}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground">Profiles</p>
              <p className="font-mono font-bold">{profiles?.length || 0}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground">Last Activity</p>
              <p className="font-mono font-bold text-xs">
                {lastActivityTime 
                  ? `${Math.floor((Date.now() - lastActivityTime) / 1000)}s ago`
                  : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Match Details */}
        {matchResult && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Match Analysis</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rhythm Match</span>
                <span className="font-mono">{(matchResult.rhythmMatch * 100).toFixed(0)}%</span>
              </div>
              <Progress value={matchResult.rhythmMatch * 100} className="h-1" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Speed Match</span>
                <span className="font-mono">{(matchResult.speedMatch * 100).toFixed(0)}%</span>
              </div>
              <Progress value={matchResult.speedMatch * 100} className="h-1" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pattern Match</span>
                <span className="font-mono">{(matchResult.patternMatch * 100).toFixed(0)}%</span>
              </div>
              <Progress value={matchResult.patternMatch * 100} className="h-1" />
            </div>

            {matchResult.anomalies.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Anomalies Detected:</p>
                <div className="flex flex-wrap gap-1">
                  {matchResult.anomalies.map((anomaly, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">
                      {anomaly}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Indicator */}
        {isMonitoring && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Monitoring keystrokes...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
