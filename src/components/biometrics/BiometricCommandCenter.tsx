import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Fingerprint, Camera, Mic, UserSquare2, PenTool, Hand, 
  Keyboard, Footprints, Shield, AlertTriangle, CheckCircle2,
  Activity, Brain, RefreshCw, Settings, Cpu
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrossModalFusionViewer } from './CrossModalFusionViewer';
import { SignatureCaptureCanvas } from './SignatureCaptureCanvas';
import { GaitCapturePanel } from './GaitCapturePanel';
import { arcFaceEngine } from '@/lib/biometrics/arcFaceEmbedding';
import { ecapaTdnnEngine } from '@/lib/biometrics/ecapaTdnnEmbedding';
import { skeletonGaitEngine } from '@/lib/biometrics/skeletonGaitAnalyzer';
import { typeFormerEngine } from '@/lib/biometrics/typeFormerKeystroke';
import { crossModalFusionEngine } from '@/lib/biometrics/crossModalAttentionFusion';

interface BiometricCommandCenterProps {
  profileId?: string;
  profileName?: string;
}

interface BiometricModality {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  sampleCount: number;
  confidence: number | null;
  isEnrolled: boolean;
  lastUpdated?: string;
  engine?: string;
}

export function BiometricCommandCenter({ profileId, profileName }: BiometricCommandCenterProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: biometrics, refetch } = useQuery({
    queryKey: ['biometric-command-center', profileId, user?.id],
    queryFn: async () => {
      if (!user || !profileId) return null;
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

  const { data: keystrokeProfile } = useQuery({
    queryKey: ['keystroke-profile', profileId, user?.id],
    queryFn: async () => {
      if (!user || !profileId) return null;
      const { data } = await supabase
        .from('keystroke_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!profileId
  });

  const { data: gaitProfile } = useQuery({
    queryKey: ['gait-profile', profileId, user?.id],
    queryFn: async () => {
      if (!user || !profileId) return null;
      const { data } = await supabase
        .from('gait_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!profileId
  });

  // Engine metrics (static capability info)
  const engineMetrics = useMemo(() => ({
    arcFace: { name: 'ArcFace v2', accuracy: 0.9983, embeddingDim: 512 },
    ecapaTdnn: { name: 'ECAPA-TDNN', accuracy: 0.96, embeddingDim: 192 },
    skeletonGait: { name: 'SkeletonGait', accuracy: 0.94, features: 256 },
    typeFormer: { name: 'TypeFormer', accuracy: 0.92, features: 128 },
    fusionEngine: { name: 'DCA Fusion', modalities: 5, attentionHeads: 8 },
  }), []);

  const modalities: BiometricModality[] = [
    {
      id: 'face', name: 'Facial Recognition', icon: Camera, color: 'text-blue-500', bgColor: 'bg-blue-500/10',
      sampleCount: biometrics?.facial_sample_count || 0, confidence: biometrics?.facial_confidence,
      isEnrolled: (biometrics?.facial_sample_count || 0) > 0, engine: 'ArcFace v2'
    },
    {
      id: 'voice', name: 'Voice Print', icon: Mic, color: 'text-green-500', bgColor: 'bg-green-500/10',
      sampleCount: biometrics?.voice_sample_count || 0, confidence: biometrics?.voice_confidence,
      isEnrolled: (biometrics?.voice_sample_count || 0) > 0, engine: 'ECAPA-TDNN'
    },
    {
      id: 'body', name: 'Body Biometrics', icon: UserSquare2, color: 'text-purple-500', bgColor: 'bg-purple-500/10',
      sampleCount: biometrics?.body_measurements ? 1 : 0, confidence: biometrics?.body_measurements ? 0.7 : null,
      isEnrolled: !!biometrics?.body_measurements
    },
    {
      id: 'signature', name: 'Signature', icon: Hand, color: 'text-pink-500', bgColor: 'bg-pink-500/10',
      sampleCount: biometrics?.signature_samples_count || 0, confidence: biometrics?.signature_confidence,
      isEnrolled: (biometrics?.signature_samples_count || 0) > 0
    },
    {
      id: 'handwriting', name: 'Handwriting', icon: PenTool, color: 'text-orange-500', bgColor: 'bg-orange-500/10',
      sampleCount: biometrics?.handwriting_samples_count || 0, confidence: biometrics?.handwriting_confidence,
      isEnrolled: (biometrics?.handwriting_samples_count || 0) > 0
    },
    {
      id: 'fingerprint', name: 'Fingerprints', icon: Fingerprint, color: 'text-red-500', bgColor: 'bg-red-500/10',
      sampleCount: biometrics?.fingerprint_samples_count || 0, confidence: biometrics?.fingerprint_data ? 0.9 : null,
      isEnrolled: !!biometrics?.fingerprint_data
    },
    {
      id: 'keystroke', name: 'Keystroke Dynamics', icon: Keyboard, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10',
      sampleCount: keystrokeProfile ? 1 : 0, confidence: keystrokeProfile?.quality_score || null,
      isEnrolled: !!keystrokeProfile, engine: 'TypeFormer'
    },
    {
      id: 'gait', name: 'Gait Pattern', icon: Footprints, color: 'text-amber-500', bgColor: 'bg-amber-500/10',
      sampleCount: gaitProfile ? 1 : 0, confidence: gaitProfile?.quality_score || null,
      isEnrolled: !!gaitProfile, engine: 'SkeletonGait'
    }
  ];

  const enrolledCount = modalities.filter(m => m.isEnrolled).length;
  const overallConfidence = modalities
    .filter(m => m.confidence !== null)
    .reduce((sum, m) => sum + (m.confidence || 0), 0) / Math.max(1, modalities.filter(m => m.confidence !== null).length);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (confidence === null) return 'text-muted-foreground';
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Biometric Command Center
            <Badge variant="outline" className="text-xs font-normal">v10.0</Badge>
            {profileName && <Badge variant="outline" className="ml-2 font-normal">{profileName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engines">Engines</TabsTrigger>
            <TabsTrigger value="fusion">Cross-Modal</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="gait">Gait</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Enrolled Modalities</p>
                      <p className="text-2xl font-bold">{enrolledCount}/{modalities.length}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />
                  </div>
                  <Progress value={(enrolledCount / modalities.length) * 100} className="mt-2 h-1" />
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Confidence</p>
                      <p className="text-2xl font-bold">{(overallConfidence * 100).toFixed(0)}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                  <Progress value={overallConfidence * 100} className="mt-2 h-1" />
                </CardContent>
              </Card>
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Identity Score</p>
                      <p className="text-2xl font-bold">{enrolledCount >= 3 ? 'Strong' : enrolledCount >= 1 ? 'Basic' : 'None'}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {modalities.map((modality) => (
                  <Card key={modality.id} className={`cursor-pointer transition-all hover:scale-[1.02] ${modality.isEnrolled ? 'border-primary/30' : 'border-muted'}`}>
                    <CardContent className="p-4">
                      <div className={`p-2 rounded-lg w-fit ${modality.bgColor} mb-3`}>
                        <modality.icon className={`h-5 w-5 ${modality.color}`} />
                      </div>
                      <p className="font-medium text-sm">{modality.name}</p>
                      {modality.engine && (
                        <Badge variant="secondary" className="text-xs mt-1 bg-violet-500/10 text-violet-600">
                          <Cpu className="h-2.5 w-2.5 mr-1" />{modality.engine}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {modality.isEnrolled ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-muted-foreground">{modality.sampleCount} sample{modality.sampleCount !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Not enrolled</span>
                          </>
                        )}
                      </div>
                      {modality.confidence !== null && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className={getConfidenceColor(modality.confidence)}>{(modality.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={modality.confidence * 100} className="mt-1 h-1" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Engine Metrics Tab */}
          <TabsContent value="engines" className="space-y-4">
            <div className="space-y-3">
              {[
                { name: 'ArcFace Angular Margin', paper: 'IEEE TPAMI 2024', metrics: engineMetrics.arcFace, icon: Camera, color: 'text-blue-500' },
                { name: 'ECAPA-TDNN Voice', paper: 'ISCA 2024', metrics: engineMetrics.ecapaTdnn, icon: Mic, color: 'text-green-500' },
                { name: 'SkeletonGait Recognition', paper: 'AAAI 2024', metrics: engineMetrics.skeletonGait, icon: Footprints, color: 'text-amber-500' },
                { name: 'TypeFormer Keystroke', paper: 'Springer 2024', metrics: engineMetrics.typeFormer, icon: Keyboard, color: 'text-cyan-500' },
                { name: 'Cross-Modal Attention Fusion', paper: 'Odyssey 2024', metrics: engineMetrics.fusionEngine, icon: Brain, color: 'text-violet-500' },
              ].map(engine => (
                <Card key={engine.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <engine.icon className={`h-5 w-5 ${engine.color}`} />
                        <div>
                          <p className="font-medium text-sm">{engine.name}</p>
                          <p className="text-xs text-muted-foreground">{engine.paper}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {engine.metrics && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {(engine.metrics as Record<string, unknown>).accuracy ? `${((engine.metrics as Record<string, number>).accuracy * 100).toFixed(1)}% acc` : 'Active'}
                            </Badge>
                          </>
                        )}
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">Ready</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fusion">
            <CrossModalFusionViewer profileId={profileId} modalities={modalities} />
          </TabsContent>

          <TabsContent value="signature">
            {profileId && <SignatureCaptureCanvas profileId={profileId} profileName={profileName || 'Unknown'} />}
          </TabsContent>

          <TabsContent value="gait">
            {profileId && <GaitCapturePanel profileId={profileId} profileName={profileName || 'Unknown'} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}