import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Keyboard, Eye, EyeOff, CheckCircle2, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { keystrokeDynamicsAnalyzer } from '@/lib/biometrics/keystrokeDynamics';
import type { KeyEvent, KeystrokeProfile, KeystrokeComparison, KeystrokeFeatures } from '@/lib/biometrics/keystrokeDynamics';

interface KeystrokeMonitorProps {
  profileId?: string;
  onMatch?: (profileId: string, confidence: number) => void;
  onMismatch?: (details: KeystrokeComparison) => void;
  showVisualFeedback?: boolean;
}

// Create a new analyzer instance per monitor
class KeystrokeAnalyzerInstance {
  private analyzer = keystrokeDynamicsAnalyzer;
  
  processKeyEvent(event: KeyEvent) {
    this.analyzer.processKeyEvent(event);
  }
  
  analyze() {
    return this.analyzer.analyze();
  }
  
  clear() {
    this.analyzer.clear();
  }
  
  compareProfiles(p1: KeystrokeProfile, p2: KeystrokeProfile) {
    return this.analyzer.compareProfiles(p1, p2);
  }
}

export function KeystrokeMonitor({ 
  profileId,
  onMatch,
  onMismatch,
  showVisualFeedback = true
}: KeystrokeMonitorProps) {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [matchResult, setMatchResult] = useState<KeystrokeComparison | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState(0);
  
  const analyzerRef = useRef(new KeystrokeAnalyzerInstance());

  const { data: profiles } = useQuery({
    queryKey: ['keystroke-profiles', user?.id, profileId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('keystroke_profiles').select('*').eq('user_id', user.id);
      if (profileId) query = query.eq('profile_id', profileId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const handleKeyEvent = useCallback((e: KeyboardEvent, type: 'keydown' | 'keyup') => {
    if (!isMonitoring) return;
    const keyEvent: KeyEvent = { key: e.key, code: e.code, timestamp: performance.now(), type };
    analyzerRef.current.processKeyEvent(keyEvent);
    setEventCount(prev => prev + 1);
    setLastActivityTime(Date.now());
  }, [isMonitoring]);

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

  useEffect(() => {
    if (!isMonitoring || !profiles || profiles.length === 0 || eventCount < 40) return;
    const intervalId = setInterval(() => {
      const currentProfile = analyzerRef.current.analyze();
      if (!currentProfile) return;
      
      for (const storedProfile of profiles) {
        const features = storedProfile.features as unknown as KeystrokeFeatures;
        const reconstructedProfile: KeystrokeProfile = {
          features,
          keyPresses: [],
          featureVector: storedProfile.feature_vector as number[],
          sampleText: storedProfile.sample_text,
          totalCharacters: storedProfile.total_characters,
          totalDuration: storedProfile.total_duration_ms,
          qualityScore: storedProfile.quality_score
        };
        const comparison = analyzerRef.current.compareProfiles(currentProfile, reconstructedProfile);
        setMatchResult(comparison);
        if (comparison.isMatch) onMatch?.(storedProfile.profile_id, comparison.similarity);
        else onMismatch?.(comparison);
        break;
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isMonitoring, profiles, eventCount, onMatch, onMismatch]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      setMatchResult(null);
      setEventCount(0);
      analyzerRef.current = new KeystrokeAnalyzerInstance();
    } else {
      setIsMonitoring(true);
    }
  };

  if (!showVisualFeedback) return null;

  return (
    <Card className={isMonitoring ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4" />
            Keystroke Monitor
          </CardTitle>
          <Button variant={isMonitoring ? 'default' : 'outline'} size="sm" onClick={toggleMonitoring}>
            {isMonitoring ? <><EyeOff className="h-4 w-4 mr-1" />Stop</> : <><Eye className="h-4 w-4 mr-1" />Start</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            {matchResult?.isMatch ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Activity className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{matchResult ? (matchResult.isMatch ? 'Match Found' : 'No Match') : 'Waiting...'}</span>
          </div>
          {matchResult && <Badge variant={matchResult.isMatch ? 'default' : 'destructive'}>{(matchResult.similarity * 100).toFixed(0)}%</Badge>}
        </div>
        {isMonitoring && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="font-mono font-bold">{eventCount}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-xs text-muted-foreground">Last Activity</p>
              <p className="font-mono font-bold text-xs">{lastActivityTime ? `${Math.floor((Date.now() - lastActivityTime) / 1000)}s ago` : '-'}</p>
            </div>
          </div>
        )}
        {matchResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Similarity</span>
              <span className="font-mono">{(matchResult.similarity * 100).toFixed(0)}%</span>
            </div>
            <Progress value={matchResult.similarity * 100} className="h-2" />
            {matchResult.matchedPatterns.length > 0 && (
              <div className="flex flex-wrap gap-1">{matchResult.matchedPatterns.map((p, i) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
