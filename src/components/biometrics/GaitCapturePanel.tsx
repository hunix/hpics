import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Footprints, Play, Square, Activity, AlertTriangle,
  CheckCircle2, Smartphone, Zap
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { gaitAnalyzer } from '@/lib/biometrics/gaitAnalyzer';
import type { MotionSample, GaitProfile } from '@/lib/biometrics/gaitAnalyzer';
import type { Json } from '@/types/database-helpers';

interface GaitCapturePanelProps {
  profileId: string;
  profileName: string;
  onCapture?: (profile: GaitProfile) => void;
}

export function GaitCapturePanel({ profileId, profileName, onCapture }: GaitCapturePanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCapturing, setIsCapturing] = useState(false);
  const [samples, setSamples] = useState<MotionSample[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const [capturedProfiles, setCapturedProfiles] = useState<GaitProfile[]>([]);
  const [liveData, setLiveData] = useState({ x: 0, y: 0, z: 0 });
  
  const samplesRef = useRef<MotionSample[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number>();
  const isCapturingRef = useRef(false);
  const motionListenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Check for sensor availability
  useEffect(() => {
    const checkSensors = async () => {
      if ('DeviceMotionEvent' in window) {
        // iOS 13+ requires permission
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          try {
            const permission = await (DeviceMotionEvent as any).requestPermission();
            setSensorAvailable(permission === 'granted');
          } catch {
            setSensorAvailable(false);
          }
        } else {
          setSensorAvailable(true);
        }
      } else {
        setSensorAvailable(false);
      }
    };
    
    checkSensors();
  }, []);

  // Stable motion handler — uses refs to avoid identity changes
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isCapturingRef.current) return;
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    
    const sample: MotionSample = {
      timestamp: Date.now(),
      accelerometer: {
        x: acceleration.x || 0,
        y: acceleration.y || 0,
        z: acceleration.z || 0
      }
    };
    
    if (event.rotationRate) {
      sample.gyroscope = {
        alpha: event.rotationRate.alpha || 0,
        beta: event.rotationRate.beta || 0,
        gamma: event.rotationRate.gamma || 0
      };
    }
    
    samplesRef.current.push(sample);
    setLiveData({
      x: acceleration.x || 0,
      y: acceleration.y || 0,
      z: acceleration.z || 0
    });
    
    // Simple step detection
    const magnitude = Math.sqrt(
      Math.pow(acceleration.x || 0, 2) +
      Math.pow(acceleration.y || 0, 2) +
      Math.pow(acceleration.z || 0, 2)
    );
    
    if (magnitude > 12) {
      setStepCount(prev => prev + 1);
    }
  }, []); // No deps — uses refs for mutable state

  const startCapture = useCallback(async () => {
    // Request permission on iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          toast.error('Motion sensor permission denied');
          return;
        }
      } catch (error) {
        toast.error('Failed to request motion sensor permission');
        return;
      }
    }
    
    samplesRef.current = [];
    startTimeRef.current = Date.now();
    setStepCount(0);
    setDuration(0);
    setIsCapturing(true);
    isCapturingRef.current = true;
    motionListenerRef.current = handleMotion;
    
    window.addEventListener('devicemotion', handleMotion);
    
    intervalRef.current = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      setSamples([...samplesRef.current]);
    }, 500);
    
    toast.info('Start walking naturally. Keep your phone in your pocket or hand.');
  }, [handleMotion]);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
    isCapturingRef.current = false;
    
    // Remove using the exact same reference that was added
    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current);
      motionListenerRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setSamples([...samplesRef.current]);
  }, []);

  const saveGaitMutation = useMutation({
    mutationFn: async (profile: GaitProfile) => {
      if (!user) throw new Error('Not authenticated');

      // Save gait profile
      await supabase
        .from('gait_profiles')
        .insert([{
          user_id: user.id,
          profile_id: profileId,
          features: JSON.parse(JSON.stringify(profile.features)) as Json,
          feature_vector: profile.featureVector,
          total_steps: profile.totalSteps,
          walking_duration_ms: profile.walkingDuration,
          quality_score: profile.qualityScore,
          anomalies: JSON.parse(JSON.stringify(profile.anomalies)) as Json
        }]);

      // Update contact biometrics
      const { data: existing } = await supabase
        .from('contact_biometrics')
        .select('id, gait_samples_count, gait_confidence')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      // Use the gait analyzer's measured quality_score as the
      // canonical per-sample confidence. When multiple samples have
      // already been captured, blend the rolling confidence so it
      // stays representative rather than swinging with the last sample.
      if (existing) {
        const priorCount = existing.gait_samples_count || 0;
        const blendedConfidence = priorCount > 0
          ? ((existing.gait_confidence ?? profile.qualityScore) * priorCount + profile.qualityScore) / (priorCount + 1)
          : profile.qualityScore;

        await supabase
          .from('contact_biometrics')
          .update({
            gait_samples_count: priorCount + 1,
            gait_confidence: blendedConfidence,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('contact_biometrics')
          .insert([{
            user_id: user.id,
            profile_id: profileId,
            gait_samples_count: 1,
            gait_confidence: profile.qualityScore,
          }]);
      }

      return profile;
    },
    onSuccess: (profile) => {
      setCapturedProfiles(prev => [...prev, profile]);
      toast.success(`Gait profile captured: ${profile.totalSteps} steps analyzed`);
      queryClient.invalidateQueries({ queryKey: ['gait-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      setSamples([]);
      setStepCount(0);
      setDuration(0);
    },
    onError: (error) => {
      toast.error('Failed to save gait profile');
      console.error(error);
    }
  });

  const analyzeAndSave = useCallback(() => {
    if (samplesRef.current.length < 100) {
      toast.error('Not enough data. Please walk for at least 5 seconds.');
      return;
    }
    
    const profile = gaitAnalyzer.analyzeGait(samplesRef.current);
    
    if (!profile) {
      toast.error('Could not analyze gait pattern. Try walking more steadily.');
      return;
    }
    
    saveGaitMutation.mutate(profile);
    onCapture?.(profile);
  }, [onCapture, saveGaitMutation]);

  // Cleanup on unmount — uses motionListenerRef for exact reference match
  useEffect(() => {
    return () => {
      isCapturingRef.current = false;
      if (motionListenerRef.current) {
        window.removeEventListener('devicemotion', motionListenerRef.current);
        motionListenerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Footprints className="h-4 w-4" />
            Gait Pattern Capture
          </CardTitle>
          <Badge variant="outline">
            {capturedProfiles.length} captured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sensorAvailable === false ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Motion sensors not available. Gait capture requires a mobile device with accelerometer.
            </AlertDescription>
          </Alert>
        ) : sensorAvailable === null ? (
          <div className="flex items-center justify-center p-8">
            <Activity className="h-6 w-6 animate-pulse" />
            <span className="ml-2">Checking sensor availability...</span>
          </div>
        ) : (
          <>
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Keep your device in your pocket or hand while walking. Walk naturally for 10-30 seconds for best results.
              </AlertDescription>
            </Alert>

            {/* Live Accelerometer Display */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">X-Axis</p>
                <p className={`font-mono text-lg ${isCapturing ? 'text-primary' : ''}`}>
                  {liveData.x.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Y-Axis</p>
                <p className={`font-mono text-lg ${isCapturing ? 'text-primary' : ''}`}>
                  {liveData.y.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Z-Axis</p>
                <p className={`font-mono text-lg ${isCapturing ? 'text-primary' : ''}`}>
                  {liveData.z.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Capture Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className={isCapturing ? 'border-primary' : ''}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{duration}s</p>
                </CardContent>
              </Card>
              <Card className={isCapturing ? 'border-primary' : ''}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <p className="text-2xl font-bold">{stepCount}</p>
                </CardContent>
              </Card>
              <Card className={isCapturing ? 'border-primary' : ''}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Samples</p>
                  <p className="text-2xl font-bold">{samples.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress indicator */}
            {isCapturing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Capture Progress</span>
                  <span>{Math.min(100, Math.floor(samples.length / 5))}%</span>
                </div>
                <Progress value={Math.min(100, samples.length / 5)} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {samples.length < 100 
                    ? 'Keep walking...' 
                    : samples.length < 300 
                      ? 'Good! A bit more for better accuracy...'
                      : 'Excellent! You can stop now.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isCapturing ? (
                <Button onClick={startCapture} className="w-40">
                  <Play className="h-4 w-4 mr-2" />
                  Start Walking
                </Button>
              ) : (
                <>
                  <Button variant="destructive" onClick={stopCapture} className="w-32">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                  <Button 
                    onClick={analyzeAndSave}
                    disabled={samples.length < 100 || saveGaitMutation.isPending}
                    className="w-32"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {saveGaitMutation.isPending ? 'Saving...' : 'Analyze'}
                  </Button>
                </>
              )}
            </div>

            {/* Captured Profiles Summary */}
            {capturedProfiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Captured Gait Profiles</p>
                {capturedProfiles.map((profile, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Profile {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{profile.totalSteps} steps</span>
                      <span>{(profile.walkingDuration / 1000).toFixed(1)}s</span>
                      <Badge variant="outline">
                        {(profile.qualityScore * 100).toFixed(0)}% quality
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
