import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Fingerprint, Upload, CheckCircle2, Loader2, 
  AlertTriangle, Info
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FingerprintEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: any;
  sampleCount: number;
}

const FINGER_TYPES = [
  { id: 'right_thumb', label: 'Right Thumb' },
  { id: 'right_index', label: 'Right Index' },
  { id: 'right_middle', label: 'Right Middle' },
  { id: 'right_ring', label: 'Right Ring' },
  { id: 'right_little', label: 'Right Little' },
  { id: 'left_thumb', label: 'Left Thumb' },
  { id: 'left_index', label: 'Left Index' },
  { id: 'left_middle', label: 'Left Middle' },
  { id: 'left_ring', label: 'Left Ring' },
  { id: 'left_little', label: 'Left Little' }
];

export function FingerprintEnrollment({ 
  profileId, 
  profileName,
  currentData,
  sampleCount
}: FingerprintEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadUrl, setUploadUrl] = useState('');
  const [selectedFinger, setSelectedFinger] = useState<string>('right_index');
  const [processing, setProcessing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (fingerprintData: any) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('contact_biometrics')
        .select('id, fingerprint_data, fingerprint_samples_count')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      const currentFingerprints = (existing?.fingerprint_data as any) || {};
      const updatedFingerprints = {
        ...currentFingerprints,
        [selectedFinger]: {
          url: fingerprintData.url,
          enrolled_at: new Date().toISOString(),
          notes: fingerprintData.notes
        }
      };

      const newCount = Object.keys(updatedFingerprints).length;

      if (existing) {
        const { error } = await supabase
          .from('contact_biometrics')
          .update({
            fingerprint_data: updatedFingerprints,
            fingerprint_samples_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_biometrics')
          .insert({
            user_id: user.id,
            profile_id: profileId,
            fingerprint_data: updatedFingerprints,
            fingerprint_samples_count: newCount
          });

        if (error) throw error;
      }

      return updatedFingerprints;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      toast.success('Fingerprint saved');
      setUploadUrl('');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleSave = () => {
    if (!uploadUrl.trim()) {
      toast.error('Enter a fingerprint image URL');
      return;
    }

    setProcessing(true);
    saveMutation.mutate({ url: uploadUrl }, {
      onSettled: () => setProcessing(false)
    });
  };

  const enrolledFingers = currentData ? Object.keys(currentData) : [];

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Fingerprint enrollment stores reference images for visual comparison. 
          Actual biometric matching requires specialized hardware. These images are stored securely 
          and can be used for reference and identification purposes.
        </AlertDescription>
      </Alert>

      {/* Current Fingerprints */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Enrolled Fingerprints
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {FINGER_TYPES.map(finger => {
              const isEnrolled = enrolledFingers.includes(finger.id);
              return (
                <div 
                  key={finger.id}
                  className={`p-2 rounded-lg text-center cursor-pointer transition-colors ${
                    isEnrolled 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : selectedFinger === finger.id
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedFinger(finger.id)}
                >
                  {isEnrolled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  ) : (
                    <Fingerprint className={`h-5 w-5 mx-auto mb-1 ${selectedFinger === finger.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                  <p className="text-xs">{finger.label.replace('Right ', 'R ').replace('Left ', 'L ')}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {enrolledFingers.length} of 10 fingerprints enrolled
          </p>
        </CardContent>
      </Card>

      {/* Selected Finger */}
      <Card className="border-primary">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              Enroll: {FINGER_TYPES.find(f => f.id === selectedFinger)?.label}
            </h4>
            {enrolledFingers.includes(selectedFinger) && (
              <Badge variant="default" className="bg-green-500">Already Enrolled</Badge>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label>Fingerprint Image URL</Label>
              <Input
                placeholder="https://example.com/fingerprint.png"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear scan or photo of the fingerprint
              </p>
            </div>

            <Button 
              onClick={handleSave}
              disabled={!uploadUrl.trim() || processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {enrolledFingers.includes(selectedFinger) ? 'Update' : 'Enroll'} Fingerprint
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          <strong>Privacy Notice:</strong> Fingerprint data is highly sensitive biometric information. 
          Ensure you have proper consent and legal authority before collecting and storing fingerprints.
        </AlertDescription>
      </Alert>
    </div>
  );
}
