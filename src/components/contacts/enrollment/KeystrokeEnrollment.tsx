import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Keyboard, RefreshCw, Save, CheckCircle2, 
  AlertTriangle, Activity, BarChart3
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  createKeystrokeAnalyzer, 
  type KeyEvent, 
  type KeystrokeProfile 
} from '@/lib/biometrics/keystrokeDynamics';
import type { Json } from '@/integrations/supabase/types';

interface KeystrokeEnrollmentProps {
  profileId: string;
  profileName: string;
  onEnrollmentComplete?: (profile: KeystrokeProfile) => void;
}

const ENROLLMENT_PHRASES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "The five boxing wizards jump quickly.",
  "Sphinx of black quartz, judge my vow."
];

export function KeystrokeEnrollment({ 
  profileId, 
  profileName,
  onEnrollmentComplete 
}: KeystrokeEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState<KeyEvent[][]>([]);
  const [currentSample, setCurrentSample] = useState<KeyEvent[]>([]);
  const [profile, setProfile] = useState<KeystrokeProfile | null>(null);
  
  const analyzerRef = useRef(createKeystrokeAnalyzer());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const targetPhrase = ENROLLMENT_PHRASES[currentPhrase];
  const progress = inputValue.length / targetPhrase.length;
  const isComplete = inputValue === targetPhrase;
  const samplesNeeded = 3;
  const samplesCollected = capturedSamples.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const keyEvent: KeyEvent = {
      key: e.key,
      code: e.code,
      timestamp: Date.now(),
      type: 'keydown'
    };

    setCurrentSample(prev => [...prev, keyEvent]);
    analyzerRef.current.recordKeyEvent(keyEvent);
  }, [isCapturing]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturing) return;

    const keyEvent: KeyEvent = {
      key: e.key,
      code: e.code,
      timestamp: Date.now(),
      type: 'keyup'
    };

    setCurrentSample(prev => [...prev, keyEvent]);
    analyzerRef.current.recordKeyEvent(keyEvent);
  }, [isCapturing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const startCapture = useCallback(() => {
    setIsCapturing(true);
    setCurrentSample([]);
    setInputValue('');
    analyzerRef.current = createKeystrokeAnalyzer();
    inputRef.current?.focus();
  }, []);

  const completeSample = useCallback(() => {
    if (currentSample.length > 0 && isComplete) {
      setCapturedSamples(prev => [...prev, currentSample]);
      setCurrentSample([]);
      setInputValue('');
      setIsCapturing(false);
      
      // Move to next phrase or wrap around
      setCurrentPhrase(prev => (prev + 1) % ENROLLMENT_PHRASES.length);
      
      toast.success(`Sample ${samplesCollected + 1} captured!`);
    }
  }, [currentSample, isComplete, samplesCollected]);

  const resetEnrollment = useCallback(() => {
    setCapturedSamples([]);
    setCurrentSample([]);
    setInputValue('');
    setCurrentPhrase(0);
    setIsCapturing(false);
    setProfile(null);
    analyzerRef.current = createKeystrokeAnalyzer();
  }, []);

  // Generate profile when we have enough samples
  useEffect(() => {
    if (samplesCollected >= samplesNeeded && !profile) {
      // Combine all samples for analysis
      const allEvents = capturedSamples.flat();
      const generatedProfile = analyzerRef.current.buildProfile(allEvents);
      setProfile(generatedProfile);
    }
  }, [samplesCollected, profile, capturedSamples]);

  const saveProfileMutation = useMutation({
    mutationFn: async (keystrokeProfile: KeystrokeProfile) => {
      if (!user) throw new Error('Not authenticated');

      // Save keystroke profile
      await supabase
        .from('keystroke_profiles')
        .insert([{
          user_id: user.id,
          profile_id: profileId,
          typing_patterns: JSON.parse(JSON.stringify(keystrokeProfile.typingPatterns)) as Json,
          digraph_timings: JSON.parse(JSON.stringify(keystrokeProfile.digraphTimings)) as Json,
          key_hold_times: JSON.parse(JSON.stringify(keystrokeProfile.keyHoldTimes)) as Json,
          flight_times: JSON.parse(JSON.stringify(keystrokeProfile.flightTimes)) as Json,
          typing_speed_wpm: keystrokeProfile.typingSpeedWPM,
          error_rate: keystrokeProfile.errorRate,
          rhythm_consistency: keystrokeProfile.rhythmConsistency,
          quality_score: keystrokeProfile.qualityScore
        }]);

      // Update contact biometrics
      const { data: existing } = await supabase
        .from('contact_biometrics')
        .select('id, keystroke_samples_count')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('contact_biometrics')
          .update({
            keystroke_samples_count: (existing.keystroke_samples_count || 0) + samplesCollected,
            keystroke_confidence: Math.min(0.95, 0.4 + samplesCollected * 0.15),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('contact_biometrics')
          .insert([{
            user_id: user.id,
            profile_id: profileId,
            keystroke_samples_count: samplesCollected,
            keystroke_confidence: 0.4 + samplesCollected * 0.15
          }]);
      }

      return keystrokeProfile;
    },
    onSuccess: (savedProfile) => {
      toast.success('Keystroke profile saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['keystroke-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      onEnrollmentComplete?.(savedProfile);
      resetEnrollment();
    },
    onError: (error) => {
      toast.error('Failed to save keystroke profile');
      console.error(error);
    }
  });

  const handleSave = useCallback(() => {
    if (profile) {
      saveProfileMutation.mutate(profile);
    }
  }, [profile, saveProfileMutation]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keystroke Dynamics Enrollment
            </CardTitle>
            <CardDescription>
              Capture typing patterns for {profileName}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {samplesCollected}/{samplesNeeded} samples
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Type the phrase below exactly as shown. We analyze typing rhythm, key hold times, 
            and flight times between keys for biometric identification.
          </AlertDescription>
        </Alert>

        {/* Progress Overview */}
        <div className="flex items-center gap-4">
          <Progress value={(samplesCollected / samplesNeeded) * 100} className="flex-1" />
          <span className="text-sm font-medium">
            {samplesCollected >= samplesNeeded ? 'Ready to save!' : `${samplesNeeded - samplesCollected} more needed`}
          </span>
        </div>

        {profile ? (
          /* Profile Ready View */
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Keystroke Profile Generated</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">Typing Speed</p>
                  <p className="font-bold text-lg">{profile.typingSpeedWPM.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">WPM</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className="font-bold text-lg">{(profile.errorRate * 100).toFixed(1)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">Rhythm</p>
                  <p className="font-bold text-lg">{(profile.rhythmConsistency * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">Quality</p>
                  <p className="font-bold text-lg">{(profile.qualityScore * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={saveProfileMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button variant="outline" onClick={resetEnrollment}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Capture View */
          <>
            {/* Target Phrase */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Type this phrase:</p>
                <p className="text-lg font-mono">{targetPhrase}</p>
              </CardContent>
            </Card>

            {/* Input Area */}
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                placeholder={isCapturing ? "Start typing..." : "Click 'Start Typing' to begin"}
                disabled={!isCapturing}
                className="font-mono min-h-[100px] resize-none"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <Badge variant={isComplete ? 'default' : 'secondary'}>
                  {inputValue.length}/{targetPhrase.length}
                </Badge>
              </div>
            </div>

            {/* Character-by-character progress */}
            {isCapturing && (
              <div className="flex flex-wrap gap-0.5 font-mono text-sm">
                {targetPhrase.split('').map((char, idx) => {
                  const typed = inputValue[idx];
                  const isCorrect = typed === char;
                  const isTyped = idx < inputValue.length;
                  
                  return (
                    <span 
                      key={idx}
                      className={`px-0.5 rounded ${
                        isTyped 
                          ? isCorrect 
                            ? 'bg-green-500/20 text-green-600' 
                            : 'bg-red-500/20 text-red-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isCapturing ? (
                <Button onClick={startCapture} className="flex-1">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Start Typing (Sample {samplesCollected + 1})
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={completeSample}
                    disabled={!isComplete}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Sample
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setInputValue('');
                      setCurrentSample([]);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Live Metrics */}
            {isCapturing && currentSample.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Live Metrics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Keystrokes</p>
                      <p className="font-mono font-bold">{currentSample.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-mono font-bold">
                        {currentSample.length > 1 
                          ? ((currentSample[currentSample.length - 1].timestamp - currentSample[0].timestamp) / 1000).toFixed(1)
                          : 0}s
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-mono font-bold">
                        {inputValue.length > 0 
                          ? ((inputValue.split('').filter((c, i) => c === targetPhrase[i]).length / inputValue.length) * 100).toFixed(0)
                          : 100}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collected Samples */}
            {samplesCollected > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Collected Samples</p>
                <div className="flex gap-2">
                  {capturedSamples.map((sample, idx) => (
                    <Badge key={idx} variant="secondary">
                      Sample {idx + 1}: {sample.length} events
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
