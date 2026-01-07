import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Fingerprint, Camera, Mic, Hand, PenTool, 
  UserSquare2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FaceMultiViewEnrollment } from './enrollment/FaceMultiViewEnrollment';
import { BodyBiometricEnrollment } from './enrollment/BodyBiometricEnrollment';
import { VoiceAdvancedEnrollment } from './enrollment/VoiceAdvancedEnrollment';
import { HandwritingEnrollment } from './enrollment/HandwritingEnrollment';
import { SignatureEnrollment } from './enrollment/SignatureEnrollment';
import { FingerprintEnrollment } from './enrollment/FingerprintEnrollment';
import { BiometricSignatureStatus } from './BiometricSignatureStatus';
import { CrossIdDashboard } from './CrossIdDashboard';

interface BiometricSignatureBuilderProps {
  profileId: string;
  profileName: string;
  avatarUrl?: string | null;
}

type BiometricTab = 'overview' | 'face' | 'body' | 'voice' | 'handwriting' | 'signature' | 'fingerprint' | 'cross-id';

export function BiometricSignatureBuilder({ 
  profileId, 
  profileName,
  avatarUrl 
}: BiometricSignatureBuilderProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BiometricTab>('overview');

  const { data: biometrics, isLoading } = useQuery({
    queryKey: ['contact-biometrics-extended', profileId, user?.id],
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

  const { data: enrollmentSessions = [] } = useQuery({
    queryKey: ['biometric-enrollment-sessions', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('biometric_enrollment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const getModuleStatus = (type: string) => {
    const sampleCount = {
      'face': biometrics?.facial_sample_count || 0,
      'body': biometrics?.body_measurements ? 1 : 0,
      'voice': biometrics?.voice_sample_count || 0,
      'handwriting': biometrics?.handwriting_samples_count || 0,
      'signature': biometrics?.signature_samples_count || 0,
      'fingerprint': biometrics?.fingerprint_samples_count || 0
    }[type] || 0;

    const confidence = {
      'face': biometrics?.facial_confidence,
      'body': biometrics?.body_measurements ? 0.7 : null,
      'voice': biometrics?.voice_confidence,
      'handwriting': biometrics?.handwriting_confidence,
      'signature': biometrics?.signature_confidence,
      'fingerprint': biometrics?.fingerprint_data ? 0.9 : null
    }[type];

    return { sampleCount, confidence };
  };

  const modules = [
    { id: 'face', label: 'Face', icon: Camera, color: 'text-blue-500' },
    { id: 'body', label: 'Body', icon: UserSquare2, color: 'text-purple-500' },
    { id: 'voice', label: 'Voice', icon: Mic, color: 'text-green-500' },
    { id: 'handwriting', label: 'Handwriting', icon: PenTool, color: 'text-orange-500' },
    { id: 'signature', label: 'Signature', icon: Hand, color: 'text-pink-500' },
    { id: 'fingerprint', label: 'Fingerprints', icon: Fingerprint, color: 'text-red-500' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Signature Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BiometricTab)}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              Overview
            </TabsTrigger>
            {modules.map(module => {
              const status = getModuleStatus(module.id);
              return (
                <TabsTrigger 
                  key={module.id} 
                  value={module.id}
                  className="flex items-center gap-1"
                >
                  <module.icon className={`h-3 w-3 ${module.color}`} />
                  {module.label}
                  {status.sampleCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {status.sampleCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="cross-id" className="flex items-center gap-1">
              Cross-ID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BiometricSignatureStatus 
              profileId={profileId}
              profileName={profileName}
              biometrics={biometrics}
              onNavigate={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="face">
            <FaceMultiViewEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={biometrics?.facial_multi_angle_data}
              sampleCount={biometrics?.facial_sample_count || 0}
            />
          </TabsContent>

          <TabsContent value="body">
            <BodyBiometricEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={biometrics?.body_measurements}
            />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceAdvancedEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={{
                speakerProfile: biometrics?.voice_speaker_profile,
                emotionalBaseline: biometrics?.voice_emotional_baseline,
                deceptionBaseline: biometrics?.voice_deception_baseline
              }}
              sampleCount={biometrics?.voice_sample_count || 0}
            />
          </TabsContent>

          <TabsContent value="handwriting">
            <HandwritingEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={biometrics?.handwriting_features}
              sampleCount={biometrics?.handwriting_samples_count || 0}
            />
          </TabsContent>

          <TabsContent value="signature">
            <SignatureEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={biometrics?.signature_features}
              sampleCount={biometrics?.signature_samples_count || 0}
            />
          </TabsContent>

          <TabsContent value="fingerprint">
            <FingerprintEnrollment 
              profileId={profileId}
              profileName={profileName}
              currentData={biometrics?.fingerprint_data}
              sampleCount={biometrics?.fingerprint_samples_count || 0}
            />
          </TabsContent>

          <TabsContent value="cross-id">
            <CrossIdDashboard 
              profileId={profileId}
              profileName={profileName}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
