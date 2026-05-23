import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserSquare2, Upload, CheckCircle2, Loader2, ImageIcon,
  Ruler, Activity, Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { invokeFunction } from '@/lib/api';

interface BodyBiometricEnrollmentProps {
  profileId: string;
  profileName: string;
  currentData: any;
}

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
      <CardContent className="p-0 aspect-[3/4] relative overflow-hidden rounded-lg">
        {signedUrl ? (
          <img 
            src={signedUrl}
            alt="Body photo"
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

export function BodyBiometricEnrollment({ 
  profileId, 
  profileName,
  currentData
}: BodyBiometricEnrollmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [model, setModel] = useState<'standard' | 'premium'>('standard');

  const { data: existingMedia = [], isLoading } = useQuery({
    queryKey: ['contact-images-for-body', profileId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('media')
        .select('id, file_url, mime_type, storage_path, created_at')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .in('mime_type', ['image/jpeg', 'image/png', 'image/webp'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profileId
  });

  const extractMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('extract-body-biometrics', { 
          profileId, 
          imageUrls,
          model: model === 'premium' ? 'google/gemini-3-pro-preview' : 'google/gemini-2.5-flash'
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Extraction failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      toast.success('Body biometrics extracted');
      setSelectedMedia([]);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleEnrollSelected = async () => {
    if (selectedMedia.length === 0) {
      toast.error('Select at least one full-body image');
      return;
    }

    setProcessing(true);
    try {
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

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Data Display */}
      {currentData && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Current Body Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentData.estimated_height && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{currentData.estimated_height.cm}cm</p>
                  <p className="text-xs text-muted-foreground">Estimated Height</p>
                  <Badge variant="secondary" className="mt-1">
                    {Math.round((currentData.estimated_height.confidence || 0.7) * 100)}% conf
                  </Badge>
                </div>
              )}
              {currentData.body_type && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Activity className="h-6 w-6 mx-auto mb-1" />
                  <p className="font-medium">{currentData.body_type}</p>
                  <p className="text-xs text-muted-foreground">Body Type</p>
                </div>
              )}
              {currentData.posture_profile?.typical_stance && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <UserSquare2 className="h-6 w-6 mx-auto mb-1" />
                  <p className="font-medium text-sm">{currentData.posture_profile.typical_stance}</p>
                  <p className="text-xs text-muted-foreground">Posture</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">Tips for Best Results</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Select full-body photos showing head to feet</li>
            <li>• Include photos with known reference objects for height estimation</li>
            <li>• Standing poses work best for measurements</li>
            <li>• Multiple photos improve accuracy</li>
          </ul>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <div className="flex gap-2">
        <Button 
          variant={model === 'standard' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('standard')}
        >
          Standard
        </Button>
        <Button 
          variant={model === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModel('premium')}
          className="gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Premium
        </Button>
      </div>

      {/* Existing Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Select Full-Body Photos ({selectedMedia.length} selected)</h4>
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
                  <UserSquare2 className="h-4 w-4 mr-2" />
                  Analyze
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
            <p>No photos found</p>
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
    </div>
  );
}
