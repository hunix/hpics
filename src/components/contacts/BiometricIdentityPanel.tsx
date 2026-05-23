import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Fingerprint, 
  Camera, 
  Mic, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Volume2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  useBiometricSamples, 
  useExtractFacialBiometrics,
  useExtractVoiceBiometrics,
  useDeleteBiometricSample 
} from '@/hooks/useBiometricMatching';
import { BiometricEnrollment } from './BiometricEnrollment';
import { format } from 'date-fns';

interface BiometricIdentityPanelProps {
  profileId: string;
  profileName: string;
  avatarUrl?: string | null;
}

export function BiometricIdentityPanel({ 
  profileId, 
  profileName,
  avatarUrl 
}: BiometricIdentityPanelProps) {
  const { user } = useAuth();
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [enrollmentType, setEnrollmentType] = useState<'face' | 'voice'>('face');

  const { data: biometrics, isLoading: loadingBiometrics } = useQuery({
    queryKey: ['contact-biometrics', profileId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('contact_biometrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profileId
  });

  const { data: samples = [], isLoading: loadingSamples } = useBiometricSamples(profileId);
  const deleteSample = useDeleteBiometricSample();

  const facialSamples = samples.filter(s => s.biometric_type === 'face');
  const voiceSamples = samples.filter(s => s.biometric_type === 'voice');

  const handleOpenEnrollment = (type: 'face' | 'voice') => {
    setEnrollmentType(type);
    setEnrollmentOpen(true);
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-muted';
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceLabel = (confidence: number | null) => {
    if (!confidence) return 'No data';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (loadingBiometrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Identity Status */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{profileName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{profileName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Identity Confidence:</span>
                <Badge 
                  variant="secondary"
                  className={getConfidenceColor(biometrics?.identity_confidence ?? null)}
                >
                  {biometrics?.identity_confidence 
                    ? `${Math.round(biometrics.identity_confidence * 100)}%`
                    : 'Not enrolled'
                  }
                </Badge>
              </div>
              {biometrics && (
                <div className="mt-2">
                  <Progress 
                    value={(biometrics.identity_confidence || 0) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="facial" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="facial" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Facial ({facialSamples.length})
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice ({voiceSamples.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="facial" className="space-y-4 mt-4">
              {/* Facial Identity Status */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Facial Recognition</span>
                  </div>
                  <Badge variant={biometrics?.facial_sample_count ? 'default' : 'secondary'}>
                    {biometrics?.facial_sample_count || 0} samples
                  </Badge>
                </div>

                {biometrics?.facial_confidence && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span>{getConfidenceLabel(biometrics.facial_confidence)}</span>
                    </div>
                    <Progress 
                      value={biometrics.facial_confidence * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Show multi-angle data if available */}
                {biometrics && Boolean(biometrics.facial_multi_angle_data) && (
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Angles captured:</span>
                      <div className="flex gap-1 flex-wrap">
                        {((biometrics.facial_multi_angle_data as { angles_captured?: string[] })?.angles_captured || []).map((angle: string) => (
                          <Badge key={angle} variant="outline" className="text-xs">
                            {angle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {(biometrics.facial_multi_angle_data as any)?.age_estimation && (
                      <p className="text-muted-foreground">
                        Estimated age: {(biometrics.facial_multi_angle_data as any).age_estimation.range}
                        {(biometrics.facial_multi_angle_data as any).age_estimation.confidence && 
                          ` (${Math.round((biometrics.facial_multi_angle_data as any).age_estimation.confidence * 100)}% confident)`
                        }
                      </p>
                    )}
                    {(biometrics.facial_multi_angle_data as any)?.multi_view_signature && (
                      <p className="text-muted-foreground italic text-xs border-l-2 border-primary/30 pl-2">
                        "{(biometrics.facial_multi_angle_data as any).multi_view_signature}"
                      </p>
                    )}
                    {(biometrics.facial_multi_angle_data as any)?.unique_identifiers?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {((biometrics.facial_multi_angle_data as any).unique_identifiers as any[]).slice(0, 4).map((id: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {id.type}: {id.location}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy facial_features display */}
                {biometrics?.facial_features && !(biometrics?.facial_multi_angle_data as any) && (
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Detected features:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(biometrics.facial_features as Record<string, string>).slice(0, 5).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Low coverage guidance */}
                {biometrics?.facial_confidence != null && 
                 biometrics.facial_confidence < 0.5 && 
                 (biometrics?.facial_sample_count || 0) > 0 && (
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>Low coverage:</strong> {biometrics.facial_sample_count} samples captured, but mostly similar angles. 
                      Add side profiles (left/right) to improve matching accuracy.
                    </AlertDescription>
                  </Alert>
                )}

                {biometrics?.facial_last_updated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(biometrics.facial_last_updated), 'PPp')}
                  </p>
                )}

                <Button 
                  onClick={() => handleOpenEnrollment('face')}
                  className="w-full"
                  variant={biometrics?.facial_sample_count ? 'outline' : 'default'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {biometrics?.facial_sample_count ? 'Add More Samples' : 'Enroll Face'}
                </Button>
              </div>

              {/* Facial Samples List */}
              {facialSamples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Enrolled Samples</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {facialSamples.map(sample => (
                      <div 
                        key={sample.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {sample.status === 'enrolled' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : sample.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                          )}
                          <div>
                            <p className="text-sm">{sample.source_type}</p>
                            <p className="text-xs text-muted-foreground">
                              Quality: {sample.quality_score ? `${Math.round(sample.quality_score * 100)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSample.mutate(sample.id)}
                          disabled={deleteSample.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-4">
              {/* Voice Identity Status */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Voice Recognition</span>
                  </div>
                  <Badge variant={biometrics?.voice_sample_count ? 'default' : 'secondary'}>
                    {biometrics?.voice_sample_count || 0} samples
                  </Badge>
                </div>

                {biometrics?.voice_confidence && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span>{getConfidenceLabel(biometrics.voice_confidence)}</span>
                    </div>
                    <Progress 
                      value={biometrics.voice_confidence * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {biometrics?.voice_characteristics && (
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Voice characteristics:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(biometrics.voice_characteristics as Record<string, string>).slice(0, 5).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {biometrics?.voice_last_updated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(biometrics.voice_last_updated), 'PPp')}
                  </p>
                )}

                <Button 
                  onClick={() => handleOpenEnrollment('voice')}
                  className="w-full"
                  variant={biometrics?.voice_sample_count ? 'outline' : 'default'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {biometrics?.voice_sample_count ? 'Add More Samples' : 'Enroll Voice'}
                </Button>
              </div>

              {/* Voice Samples List */}
              {voiceSamples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Enrolled Samples</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {voiceSamples.map(sample => (
                      <div 
                        key={sample.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {sample.status === 'enrolled' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : sample.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                          )}
                          <div>
                            <p className="text-sm">{sample.source_type}</p>
                            <p className="text-xs text-muted-foreground">
                              Quality: {sample.quality_score ? `${Math.round(sample.quality_score * 100)}%` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSample.mutate(sample.id)}
                          disabled={deleteSample.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <BiometricEnrollment
        open={enrollmentOpen}
        onOpenChange={setEnrollmentOpen}
        profileId={profileId}
        profileName={profileName}
        enrollmentType={enrollmentType}
      />
    </>
  );
}
