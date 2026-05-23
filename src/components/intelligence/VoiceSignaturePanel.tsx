import React, { useState, useEffect } from 'react';
import { 
  Mic, Volume2, UserCheck, AlertCircle, Upload, Play, Pause,
  RefreshCw, CheckCircle2, XCircle, Users, AudioWaveform, Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface VoiceSignature {
  id: string;
  profile_id: string | null;
  quality_score: number | null;
  sample_duration_seconds: number | null;
  created_at: string | null;
  profile_name?: string;
  avatar_url?: string | null;
}

interface VoiceSignaturePanelProps {
  profileId?: string;
  className?: string;
}

export function VoiceSignaturePanel({ profileId, className }: VoiceSignaturePanelProps) {
  const [signatures, setSignatures] = useState<VoiceSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [stats, setStats] = useState({
    totalSignatures: 0,
    avgQuality: 0,
    recentMatches: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSignatures();
  }, [profileId]);

  const loadSignatures = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('voice_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile names separately
      const profileIds = [...new Set((data || []).map(s => s.profile_id).filter((v): v is string => v !== null))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const enrichedSignatures: VoiceSignature[] = (data || []).map(s => {
        const profile = s.profile_id ? profileMap.get(s.profile_id) : undefined;
        const profileName = profile 
          ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') 
          : undefined;
        return {
          id: s.id,
          profile_id: s.profile_id,
          quality_score: s.quality_score,
          sample_duration_seconds: s.sample_duration_seconds,
          created_at: s.created_at,
          profile_name: profileName,
          avatar_url: profile?.avatar_url,
        };
      });

      setSignatures(enrichedSignatures);

      // Calculate stats
      const avgQuality = enrichedSignatures.length > 0
        ? enrichedSignatures.reduce((sum, s) => sum + (s.quality_score || 0), 0) / enrichedSignatures.length
        : 0;

      setStats({
        totalSignatures: enrichedSignatures.length,
        avgQuality: avgQuality * 100,
        recentMatches: 0, // Would come from biometric_matches table
      });
    } catch (error) {
      console.error('Failed to load voice signatures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    if (!profileId) {
      toast({
        title: 'Select a Contact',
        description: 'Please select a contact to enroll voice signature',
        variant: 'destructive',
      });
      return;
    }

    setIsEnrolling(true);
    setEnrollmentProgress(0);

    try {
      // Simulate enrollment process - in production this would:
      // 1. Record audio samples
      // 2. Extract voice features
      // 3. Store voice embedding
      
      for (let i = 0; i <= 100; i += 10) {
        setEnrollmentProgress(i);
        await new Promise(r => setTimeout(r, 300));
      }

      toast({
        title: 'Enrollment Complete',
        description: 'Voice signature captured successfully',
      });

      await loadSignatures();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: 'Enrollment Failed',
        description: 'Failed to capture voice signature',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
      setEnrollmentProgress(0);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" />
          Voice Signatures
          {profileId && (
            <Badge variant="secondary" className="text-xs ml-auto">
              Contact Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <Volume2 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{stats.totalSignatures}</div>
            <div className="text-[10px] text-muted-foreground">Signatures</div>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <AudioWaveform className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold">{stats.avgQuality.toFixed(0)}%</div>
            <div className="text-[10px] text-muted-foreground">Avg Quality</div>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <UserCheck className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{stats.recentMatches}</div>
            <div className="text-[10px] text-muted-foreground">Matches</div>
          </div>
        </div>

        {/* Enrollment Button */}
        {profileId && (
          <Button
            onClick={startEnrollment}
            disabled={isEnrolling}
            className="w-full"
            variant="outline"
          >
            {isEnrolling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enrolling... {enrollmentProgress}%
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Enroll Voice Signature
              </>
            )}
          </Button>
        )}

        {isEnrolling && (
          <Progress value={enrollmentProgress} className="h-1" />
        )}

        {/* Signatures List */}
        {isLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading signatures...</p>
          </div>
        ) : signatures.length === 0 ? (
          <div className="py-8 text-center">
            <Volume2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No voice signatures</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enroll voice samples to enable speaker identification
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {signatures.map(sig => (
                <div
                  key={sig.id}
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {sig.profile_name || 'Unknown Contact'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sig.sample_duration_seconds}s sample</span>
                      <span>•</span>
                      <span className={getQualityColor(sig.quality_score || 0)}>
                        {getQualityLabel(sig.quality_score || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px]', getQualityColor(sig.quality_score || 0))}
                    >
                      {Math.round((sig.quality_score || 0) * 100)}%
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(sig.created_at ?? Date.now()), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* How It Works */}
        <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
          <p className="font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            How Voice Signatures Work
          </p>
          <ul className="text-muted-foreground space-y-0.5 ml-4 list-disc">
            <li>Capture 60+ seconds of clear speech</li>
            <li>AI extracts unique vocal characteristics</li>
            <li>Auto-identify speakers in recordings</li>
            <li>Match unknown voices to contacts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default VoiceSignaturePanel;
