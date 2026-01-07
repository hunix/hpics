import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, Upload, CheckCircle2, AlertCircle, Loader2,
  RotateCcw, ImageIcon, Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface FaceMultiViewEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: any;
  sampleCount: number;
}

const REQUIRED_ANGLES = [
  { id: 'front', label: 'Front View', description: 'Face directly at camera' },
  { id: 'left_profile', label: 'Left Profile', description: '90° to the left' },
  { id: 'right_profile', label: 'Right Profile', description: '90° to the right' },
  { id: 'left_45', label: 'Left 45°', description: '45° angle to the left' },
  { id: 'right_45', label: 'Right 45°', description: '45° angle to the right' },
  { id: 'slight_up', label: 'Slight Up', description: 'Looking slightly upward' }
];

function MediaSelectCard({ 
  media, 
  isSelected, 
  isProcessing, 
  onSelect 
}: { 
  media: any; 
  isSelected: boolean; 
  isProcessing: boolean;
  onSelect: () => void;
}) {
  const { signedUrl } = useSignedUrl({ bucket: 'media', path: media.storage_path });

  return (
    <Card 
      className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${isSelected ? 'ring-2 ring-primary' : ''} ${isProcessing ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-0 aspect-square relative overflow-hidden rounded-lg">
        {signedUrl ? (
          <img 
            src={signedUrl}
            alt="Face photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-5 w-5 text-primary bg-background rounded-full" />
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FaceMultiViewEnrollment({ 
  profileId, 
  profileName,
  currentData,
  sampleCount
}: FaceMultiViewEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState<'standard' | 'premium'>('standard');

  const { data: existingMedia = [], isLoading } = useQuery({
    queryKey: ['contact-images-for-face', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, mime_type, storage_path, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .in('mime_type', ['image/jpeg', 'image/png', 'image/webp'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const extractMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('extract-facial-multiview', {
        body: { 
          profileId, 
          imageUrls,
          model: model === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      queryClient.invalidateQueries({ queryKey: ['biometric-samples', profileId] });
      toast.success('Multi-view facial analysis complete');
      setSelectedMedia([]);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleEnrollSelected = async () => {
    if (selectedMedia.length === 0) {
      toast.error('Select at least one image');
      return;
    }

    setProcessing(true);
    try {
      // Get signed URLs for selected media
      const urls: string[] = [];
      for (const mediaId of selectedMedia) {
        const media = existingMedia.find(m => m.id === mediaId);
        if (media?.storage_path) {
          const { data } = await supabase.storage
            .from('media')
            .createSignedUrl(media.storage_path, 3600);
          if (data?.signedUrl) urls.push(data.signedUrl);
        }
      }

      if (urls.length === 0) {
        toast.error('Could not get image URLs');
        return;
      }

      await extractMutation.mutateAsync(urls);
    } finally {
      setProcessing(false);
    }
  };

  const handleEnrollFromUrl = async () => {
    if (!uploadUrl.trim()) return;
    setProcessing(true);
    try {
      await extractMutation.mutateAsync([uploadUrl]);
      setUploadUrl('');
    } finally {
      setProcessing(false);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const capturedAngles = currentData?.angles_captured || [];
  const coverageScore = currentData?.coverage_score || 0;

  return (
    <div className="space-y-6">
      {/* Angle Guide */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Multi-Angle Coverage
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {REQUIRED_ANGLES.map(angle => {
              const captured = capturedAngles.includes(angle.id);
              return (
                <div 
                  key={angle.id}
                  className={`p-2 rounded-lg text-center ${captured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}
                >
                  {captured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  )}
                  <p className="text-xs font-medium">{angle.label}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Coverage</span>
                <span>{Math.round(coverageScore * 100)}%</span>
              </div>
              <Progress value={coverageScore * 100} className="h-2" />
            </div>
            <Badge variant={coverageScore >= 0.8 ? 'default' : 'secondary'}>
              {capturedAngles.length} / {REQUIRED_ANGLES.length} angles
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <div className="flex gap-2">
        <Button 
          variant={model === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('standard')}
        >
          Standard (Faster)
        </Button>
        <Button 
          variant={model === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('premium')}
          className="gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Premium (Best)
        </Button>
      </div>

      {/* Existing Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Select Photos ({selectedMedia.length} selected)</h4>
          {selectedMedia.length > 0 && (
            <Button 
              onClick={handleEnrollSelected}
              disabled={processing}
              size="sm"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Analyze Selected ({selectedMedia.length})
                </>
              )}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : existingMedia.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No photos found for this contact</p>
            <p className="text-sm">Upload photos in the Media tab first</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-1">
              {existingMedia.map(media => (
                <MediaSelectCard
                  key={media.id}
                  media={media}
                  isSelected={selectedMedia.includes(media.id)}
                  isProcessing={processing && selectedMedia.includes(media.id)}
                  onSelect={() => toggleMediaSelection(media.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* URL Upload */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label>Or add from URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/photo.jpg"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
            />
            <Button 
              onClick={handleEnrollFromUrl}
              disabled={!uploadUrl.trim() || processing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
