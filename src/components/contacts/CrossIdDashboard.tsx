import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, Loader2, CheckCircle2, AlertCircle, 
  Users, Image, Mic, Video, Eye, RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CrossIdDashboardProps {
  profileId: string;
  profileName: string;
}

export function CrossIdDashboard({ profileId, profileName }: CrossIdDashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: biometrics } = useQuery({
    queryKey: ['contact-biometrics-crossid', profileId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('contact_biometrics')
        .select('cross_id_enabled, cross_id_matches, detected_in_contacts, signature_strength')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profileId
  });

  const { data: detections = [], isLoading: loadingDetections } = useQuery({
    queryKey: ['cross-contact-detections', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cross_contact_detections')
        .select(`
          *,
          owner_profile:owner_profile_id (id, first_name, last_name, avatar_url),
          media:media_id (id, file_url, storage_path, mime_type)
        `)
        .eq('user_id', user.id)
        .eq('detected_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const toggleCrossIdMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('contact_biometrics')
        .update({ cross_id_enabled: enabled })
        .eq('user_id', user.id)
        .eq('profile_id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-crossid', profileId] });
      toast.success('Cross-ID settings updated');
    }
  });

  const runScanMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('cross-identify-biometrics', {
        body: { 
          sourceProfileId: profileId,
          searchScope: 'all',
          mediaTypes: ['images', 'audio', 'video']
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Scan failed');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cross-contact-detections', profileId] });
      toast.success(`Found ${data.matches_found} matches across ${data.total_scanned} media items`);
    },
    onError: (error: Error) => {
      toast.error(`Scan failed: ${error.message}`);
    }
  });

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setScanProgress(0);

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Simulate progress
    progressIntervalRef.current = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      await runScanMutation.mutateAsync();
      setScanProgress(100);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setTimeout(() => {
        setScanning(false);
        setScanProgress(0);
      }, 1000);
    }
  };

  const getDetectionIcon = (type: string) => {
    switch (type) {
      case 'face': return <Eye className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const signatureStrength = biometrics?.signature_strength || 0;
  const canScan = signatureStrength >= 30;

  return (
    <div className="space-y-6">
      {/* Cross-ID Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <h4 className="font-medium">Cross-Contact Identification</h4>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cross-id-toggle" className="text-sm">Enable</Label>
              <Switch
                id="cross-id-toggle"
                checked={biometrics?.cross_id_enabled ?? true}
                onCheckedChange={(checked) => toggleCrossIdMutation.mutate(checked)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Scan all contacts' media to find where {profileName} appears in photos, recordings, and videos.
          </p>

          {!canScan ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Signature Too Weak</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Add more biometric samples (face photos, voice recordings) to enable cross-identification.
                Current strength: {Math.round(signatureStrength)}%
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleRunScan}
              disabled={scanning || !biometrics?.cross_id_enabled}
              className="w-full"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning... {scanProgress}%
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scan All Contacts' Media
                </>
              )}
            </Button>
          )}

          {scanning && (
            <Progress value={scanProgress} className="mt-3 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Detection Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Detected Appearances ({detections.length})
            </span>
            {detections.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRunScan}
                disabled={scanning || !canScan}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDetections ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : detections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No cross-contact detections yet</p>
              <p className="text-sm">Run a scan to find where {profileName} appears</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {detections.map((detection: any) => (
                  <Card key={detection.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={detection.owner_profile?.avatar_url} />
                        <AvatarFallback>
                          {detection.owner_profile?.first_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {detection.owner_profile?.first_name} {detection.owner_profile?.last_name}'s media
                          </p>
                          {detection.verified && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getDetectionIcon(detection.detection_type)}
                          <span className="capitalize">{detection.detection_type}</span>
                          <span>•</span>
                          <span>{Math.round((detection.confidence_score || 0) * 100)}% confidence</span>
                        </div>
                      </div>

                      <Badge variant={detection.verified ? 'default' : 'secondary'}>
                        {detection.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    
                    {detection.timestamp_in_media && (
                      <p className="text-xs text-muted-foreground mt-2">
                        At timestamp: {detection.timestamp_in_media}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Detected {format(new Date(detection.created_at), 'PPp')}
                    </p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
