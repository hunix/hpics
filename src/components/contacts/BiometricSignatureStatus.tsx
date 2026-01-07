import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Mic, UserSquare2, PenTool, Hand, Fingerprint,
  ChevronRight, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type BiometricTab = 'overview' | 'face' | 'body' | 'voice' | 'handwriting' | 'signature' | 'fingerprint' | 'cross-id';

interface BiometricSignatureStatusProps {
  profileId: string;
  profileName: string;
  biometrics: any;
  onNavigate: (tab: BiometricTab) => void;
}

interface ModuleConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  getStatus: (bio: any) => { count: number; confidence: number | null; enrolled: boolean };
  minSamples: number;
}

const modules: ModuleConfig[] = [
  { 
    id: 'face', 
    label: 'Face (Multi-View)', 
    icon: Camera,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    minSamples: 5,
    getStatus: (bio) => ({
      count: bio?.facial_sample_count || 0,
      confidence: bio?.facial_confidence,
      enrolled: (bio?.facial_sample_count || 0) > 0
    })
  },
  { 
    id: 'voice', 
    label: 'Voice', 
    icon: Mic,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    minSamples: 3,
    getStatus: (bio) => ({
      count: bio?.voice_sample_count || 0,
      confidence: bio?.voice_confidence,
      enrolled: (bio?.voice_sample_count || 0) > 0
    })
  },
  { 
    id: 'body', 
    label: 'Body', 
    icon: UserSquare2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    minSamples: 2,
    getStatus: (bio) => ({
      count: bio?.body_measurements ? 1 : 0,
      confidence: bio?.body_measurements ? 0.7 : null,
      enrolled: !!bio?.body_measurements
    })
  },
  { 
    id: 'handwriting', 
    label: 'Handwriting', 
    icon: PenTool,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    minSamples: 3,
    getStatus: (bio) => ({
      count: bio?.handwriting_samples_count || 0,
      confidence: bio?.handwriting_confidence,
      enrolled: (bio?.handwriting_samples_count || 0) > 0
    })
  },
  { 
    id: 'signature', 
    label: 'Signature', 
    icon: Hand,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500',
    minSamples: 3,
    getStatus: (bio) => ({
      count: bio?.signature_samples_count || 0,
      confidence: bio?.signature_confidence,
      enrolled: (bio?.signature_samples_count || 0) > 0
    })
  },
  { 
    id: 'fingerprint', 
    label: 'Fingerprints', 
    icon: Fingerprint,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    minSamples: 1,
    getStatus: (bio) => ({
      count: bio?.fingerprint_samples_count || 0,
      confidence: bio?.fingerprint_data ? 0.95 : null,
      enrolled: !!bio?.fingerprint_data
    })
  }
];

export function BiometricSignatureStatus({ 
  profileId, 
  profileName,
  biometrics,
  onNavigate
}: BiometricSignatureStatusProps) {
  const { user } = useAuth();

  const { data: crossIdStats } = useQuery({
    queryKey: ['cross-id-stats', profileId, user?.id],
    queryFn: async () => {
      if (!user) return { detectedIn: 0, conversations: 0 };
      
      const { count: detectedIn } = await supabase
        .from('cross_contact_detections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('detected_profile_id', profileId);

      return {
        detectedIn: detectedIn || 0,
        conversations: 0 // TODO: implement conversation detection
      };
    },
    enabled: !!user && !!profileId
  });

  // Calculate overall signature strength
  const calculateSignatureStrength = () => {
    let totalWeight = 0;
    let earnedWeight = 0;

    const weights = {
      face: 30,
      voice: 25,
      body: 15,
      handwriting: 10,
      signature: 10,
      fingerprint: 10
    };

    modules.forEach(module => {
      const status = module.getStatus(biometrics);
      const weight = weights[module.id as keyof typeof weights] || 10;
      totalWeight += weight;
      
      if (status.enrolled && status.confidence) {
        earnedWeight += weight * Math.min(status.confidence, 1);
      }
    });

    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  };

  const signatureStrength = calculateSignatureStrength();

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-500';
    if (strength >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 50) return 'Moderate';
    if (strength > 0) return 'Weak';
    return 'Not Enrolled';
  };

  return (
    <div className="space-y-6">
      {/* Overall Signature Strength */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${signatureStrength >= 50 ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
              <ShieldCheck className={`h-8 w-8 ${getStrengthColor(signatureStrength)}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">Identity Signature Strength</h3>
                <span className={`text-2xl font-bold ${getStrengthColor(signatureStrength)}`}>
                  {signatureStrength}%
                </span>
              </div>
              <Progress value={signatureStrength} className="h-3" />
              <p className="text-sm text-muted-foreground mt-1">
                {getStrengthLabel(signatureStrength)} - {signatureStrength >= 50 
                  ? 'Can be used for cross-contact identification'
                  : 'Add more biometric samples to enable identification'}
              </p>
            </div>
          </div>

          {/* Cross-ID Stats */}
          {crossIdStats && (crossIdStats.detectedIn > 0 || biometrics?.cross_id_enabled) && (
            <div className="flex gap-4 pt-4 border-t">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold">{crossIdStats.detectedIn}</p>
                <p className="text-xs text-muted-foreground">Detected in other contacts' media</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold">{crossIdStats.conversations}</p>
                <p className="text-xs text-muted-foreground">Appears in conversations</p>
              </div>
              <div className="flex-1 text-center">
                <Badge variant={biometrics?.cross_id_enabled ? 'default' : 'secondary'}>
                  {biometrics?.cross_id_enabled ? 'Cross-ID Enabled' : 'Cross-ID Disabled'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(module => {
          const status = module.getStatus(biometrics);
          const progress = status.count > 0 
            ? Math.min((status.count / module.minSamples) * 100, 100)
            : 0;
          
          return (
            <Card 
              key={module.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onNavigate(module.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${status.enrolled ? module.bgColor + '/20' : 'bg-muted'}`}>
                      <module.icon className={`h-4 w-4 ${status.enrolled ? module.color : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{module.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {status.count} / {module.minSamples} samples
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.enrolled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                {status.confidence && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {Math.round(status.confidence * 100)}%
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
