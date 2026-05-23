import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Users, 
  Fingerprint, 
  Eye, 
  Volume2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { usePendingMatches } from '@/hooks/useBiometricMatching';
import { Link } from 'react-router-dom';

interface BiometricStats {
  totalProfiles: number;
  profilesWithFace: number;
  profilesWithVoice: number;
  totalFaceSamples: number;
  totalVoiceSamples: number;
  enrolledSamples: number;
  processingSamples: number;
  failedSamples: number;
  totalMatches: number;
  confirmedMatches: number;
  pendingMatches: number;
  autoTaggedCount: number;
  avgFaceConfidence: number;
  avgVoiceConfidence: number;
  matchesByDay: { date: string; count: number }[];
}

export function BiometricAnalyticsDashboard() {
  const { user } = useAuth();
  const { data: pendingMatches = [] } = usePendingMatches();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['biometric-analytics', user?.id],
    queryFn: async (): Promise<BiometricStats> => {
      if (!user) throw new Error('Not authenticated');

      const [
        biometricsResult,
        samplesResult,
        matchesResult,
        matchesByDayResult
      ] = await Promise.all([
        // Contact biometrics stats
        supabase
          .from('contact_biometrics')
          .select('facial_sample_count, voice_sample_count, facial_confidence, voice_confidence')
          .eq('user_id', user.id),
        
        // Biometric samples stats
        supabase
          .from('biometric_samples')
          .select('status, biometric_type')
          .eq('user_id', user.id),
        
        // Match stats
        supabase
          .from('biometric_matches')
          .select('user_confirmed, auto_tagged')
          .eq('user_id', user.id),
        
        // Matches by day (last 7 days)
        supabase
          .from('biometric_matches')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', subDays(new Date(), 7).toISOString())
      ]);

      const biometrics = biometricsResult.data || [];
      const samples = samplesResult.data || [];
      const matches = matchesResult.data || [];
      const recentMatches = matchesByDayResult.data || [];

      // Calculate stats
      const profilesWithFace = biometrics.filter(b => (b.facial_sample_count || 0) > 0).length;
      const profilesWithVoice = biometrics.filter(b => (b.voice_sample_count || 0) > 0).length;
      
      const faceSamples = samples.filter(s => s.biometric_type === 'face');
      const voiceSamples = samples.filter(s => s.biometric_type === 'voice');
      
      const enrolledSamples = samples.filter(s => s.status === 'enrolled').length;
      const processingSamples = samples.filter(s => s.status === 'processing').length;
      const failedSamples = samples.filter(s => s.status === 'failed').length;

      const confirmedMatches = matches.filter(m => m.user_confirmed === true).length;
      const pendingMatchCount = matches.filter(m => m.user_confirmed === null).length;
      const autoTaggedCount = matches.filter(m => m.auto_tagged).length;

      // Calculate average confidences
      const faceConfidences = biometrics
        .map(b => b.facial_confidence)
        .filter((c): c is number => c !== null);
      const voiceConfidences = biometrics
        .map(b => b.voice_confidence)
        .filter((c): c is number => c !== null);

      const avgFaceConfidence = faceConfidences.length > 0
        ? faceConfidences.reduce((a, b) => a + b, 0) / faceConfidences.length
        : 0;
      const avgVoiceConfidence = voiceConfidences.length > 0
        ? voiceConfidences.reduce((a, b) => a + b, 0) / voiceConfidences.length
        : 0;

      // Group matches by day
      const matchesByDayMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        matchesByDayMap.set(date, 0);
      }
      recentMatches.forEach(m => {
        const date = format(new Date(m.created_at ?? Date.now()), 'yyyy-MM-dd');
        matchesByDayMap.set(date, (matchesByDayMap.get(date) || 0) + 1);
      });

      return {
        totalProfiles: biometrics.length,
        profilesWithFace,
        profilesWithVoice,
        totalFaceSamples: faceSamples.length,
        totalVoiceSamples: voiceSamples.length,
        enrolledSamples,
        processingSamples,
        failedSamples,
        totalMatches: matches.length,
        confirmedMatches,
        pendingMatches: pendingMatchCount,
        autoTaggedCount,
        avgFaceConfidence,
        avgVoiceConfidence,
        matchesByDay: Array.from(matchesByDayMap.entries()).map(([date, count]) => ({ date, count }))
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Biometric Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Enrolled Profiles</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalProfiles}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Samples</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {stats.totalFaceSamples + stats.totalVoiceSamples}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Matches</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalMatches}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.pendingMatches}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enrollment Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Facial Recognition</span>
                </div>
                <span>{stats.profilesWithFace} profiles</span>
              </div>
              <Progress 
                value={stats.totalProfiles > 0 ? (stats.profilesWithFace / stats.totalProfiles) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats.totalFaceSamples} samples, {Math.round(stats.avgFaceConfidence * 100)}% avg confidence
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Voice Recognition</span>
                </div>
                <span>{stats.profilesWithVoice} profiles</span>
              </div>
              <Progress 
                value={stats.totalProfiles > 0 ? (stats.profilesWithVoice / stats.totalProfiles) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {stats.totalVoiceSamples} samples, {Math.round(stats.avgVoiceConfidence * 100)}% avg confidence
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {stats.enrolledSamples} enrolled
              </Badge>
              {stats.processingSamples > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  {stats.processingSamples} processing
                </Badge>
              )}
              {stats.failedSamples > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  {stats.failedSamples} failed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Match Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.confirmedMatches}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingMatches}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.autoTaggedCount}</p>
                <p className="text-xs text-muted-foreground">Auto-Tagged</p>
              </div>
            </div>

            {/* Mini chart for matches by day */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Matches (Last 7 Days)</p>
              <div className="flex items-end gap-1 h-16">
                {stats.matchesByDay.map((day, i) => {
                  const maxCount = Math.max(...stats.matchesByDay.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(day.date), 'EEE').charAt(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Matches Preview */}
      {pendingMatches.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Pending Matches</CardTitle>
              <CardDescription>
                Review and confirm biometric matches
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/insights">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {pendingMatches.slice(0, 5).map(match => (
                  <div 
                    key={match.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {match.match_type === 'face' ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {match.profiles?.first_name} {match.profiles?.last_name || 'Unknown'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {Math.round((match.confidence_score || 0) * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}