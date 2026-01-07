import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Fingerprint, 
  Camera, 
  Mic, 
  AlertCircle,
  Users,
  ArrowRight
} from 'lucide-react';
import { useBiometricStats, usePendingMatches } from '@/hooks/useBiometricMatching';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function BiometricStatusWidget() {
  const { user } = useAuth();
  const { data: stats, isLoading: loadingStats } = useBiometricStats();
  const { data: pendingMatches = [], isLoading: loadingPending } = usePendingMatches();

  // Get total contact count
  const { data: totalContacts = 0 } = useQuery({
    queryKey: ['total-contacts-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user
  });

  if (loadingStats || loadingPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const enrollmentPercentage = totalContacts > 0 
    ? Math.round((stats?.profilesWithBiometrics || 0) / totalContacts * 100) 
    : 0;

  const pendingFaces = pendingMatches.filter(m => m.match_type === 'face').length;
  const pendingVoices = pendingMatches.filter(m => m.match_type === 'voice').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fingerprint className="h-5 w-5" />
          Biometric Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enrollment Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contacts Enrolled</span>
            <span className="font-medium">
              {stats?.profilesWithBiometrics || 0} / {totalContacts}
            </span>
          </div>
          <Progress value={enrollmentPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Camera className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{stats?.totalSamples || 0}</p>
            <p className="text-xs text-muted-foreground">Face Samples</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Mic className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{stats?.totalMatches || 0}</p>
            <p className="text-xs text-muted-foreground">Matches Made</p>
          </div>
        </div>

        {/* Pending Reviews Alert */}
        {pendingMatches.length > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-sm">Pending Reviews</span>
            </div>
            <div className="flex gap-2">
              {pendingFaces > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/20">
                  <Camera className="h-3 w-3 mr-1" />
                  {pendingFaces} faces
                </Badge>
              )}
              {pendingVoices > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/20">
                  <Mic className="h-3 w-3 mr-1" />
                  {pendingVoices} voices
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalContacts - (stats?.profilesWithBiometrics || 0)} contacts need enrollment
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
