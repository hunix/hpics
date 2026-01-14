import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Keyboard, RefreshCw, Save, CheckCircle2, Activity } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { keystrokeDynamicsAnalyzer } from '@/lib/biometrics/keystrokeDynamics';
import type { KeyEvent, KeystrokeProfile } from '@/lib/biometrics/keystrokeDynamics';
import type { Json } from '@/integrations/supabase/types';

interface KeystrokeEnrollmentProps {
  profileId: string;
  profileName: string;
  onEnrollmentComplete?: (profile: KeystrokeProfile) => void;
}

const PHRASES = ["The quick brown fox jumps over the lazy dog.", "Pack my box with five dozen liquor jugs."];

// Create a fresh analyzer for each enrollment session
class KeystrokeEnrollmentAnalyzer {
  private events: KeyEvent[] = [];
  
  processKeyEvent(event: KeyEvent) {
    this.events.push(event);
    keystrokeDynamicsAnalyzer.processKeyEvent(event);
  }
  
  analyze() {
    return keystrokeDynamicsAnalyzer.analyze();
  }
  
  clear() {
    this.events = [];
    keystrokeDynamicsAnalyzer.clear();
  }
}

export function KeystrokeEnrollment({ profileId, profileName, onEnrollmentComplete }: KeystrokeEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [profile, setProfile] = useState<KeystrokeProfile | null>(null);
  const analyzerRef = useRef(new KeystrokeEnrollmentAnalyzer());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const targetPhrase = PHRASES[0];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isCapturing) return;
    analyzerRef.current.processKeyEvent({ key: e.key, code: e.code, timestamp: performance.now(), type: 'keydown' });
  }, [isCapturing]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (!isCapturing) return;
    analyzerRef.current.processKeyEvent({ key: e.key, code: e.code, timestamp: performance.now(), type: 'keyup' });
  }, [isCapturing]);

  const startCapture = () => { 
    setIsCapturing(true); 
    setInputValue(''); 
    analyzerRef.current = new KeystrokeEnrollmentAnalyzer();
    inputRef.current?.focus(); 
  };
  
  const completeSample = () => {
    const p = analyzerRef.current.analyze();
    if (p) { 
      setProfile(p); 
      setIsCapturing(false); 
      toast.success('Profile generated!'); 
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (kp: KeystrokeProfile) => {
      if (!user) throw new Error('Not authenticated');
      await supabase.from('keystroke_profiles').insert({ 
        user_id: user.id, 
        profile_id: profileId, 
        features: kp.features as unknown as Json, 
        feature_vector: kp.featureVector, 
        sample_text: kp.sampleText, 
        total_characters: kp.totalCharacters, 
        total_duration_ms: kp.totalDuration, 
        quality_score: kp.qualityScore 
      });
      return kp;
    },
    onSuccess: (p) => { 
      toast.success('Saved!'); 
      queryClient.invalidateQueries({ queryKey: ['keystroke-profile'] }); 
      onEnrollmentComplete?.(p); 
      setProfile(null); 
    },
    onError: () => toast.error('Failed to save')
  });

  if (profile) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" />Profile Ready</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center"><p className="text-sm text-muted-foreground">Speed</p><p className="text-2xl font-bold">{profile.features.typingSpeed.toFixed(0)} CPM</p></div>
            <div className="p-3 bg-muted rounded-lg text-center"><p className="text-sm text-muted-foreground">Quality</p><p className="text-2xl font-bold">{(profile.qualityScore * 100).toFixed(0)}%</p></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate(profile)} disabled={saveMutation.isPending} className="flex-1"><Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
            <Button variant="outline" onClick={() => setProfile(null)}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Keyboard className="h-5 w-5" />Keystroke Enrollment</CardTitle><CardDescription>Capture typing patterns for {profileName}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Alert><Activity className="h-4 w-4" /><AlertDescription>Type the phrase exactly as shown to capture your typing rhythm.</AlertDescription></Alert>
        <Card className="bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Type this:</p><p className="font-mono">{targetPhrase}</p></CardContent></Card>
        <Textarea ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} placeholder={isCapturing ? "Start typing..." : "Click Start to begin"} disabled={!isCapturing} className="font-mono min-h-[100px]" />
        <Progress value={(inputValue.length / targetPhrase.length) * 100} className="h-2" />
        <div className="flex gap-2">
          {!isCapturing ? <Button onClick={startCapture} className="flex-1"><Keyboard className="h-4 w-4 mr-2" />Start</Button> : <><Button onClick={completeSample} disabled={inputValue.length < 30} className="flex-1"><CheckCircle2 className="h-4 w-4 mr-2" />Complete</Button><Button variant="outline" onClick={() => setInputValue('')}><RefreshCw className="h-4 w-4" /></Button></>}
        </div>
      </CardContent>
    </Card>
  );
}
