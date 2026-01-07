import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ScanSearch, 
  Image, 
  Mic, 
  Loader2, 
  Play, 
  Pause, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentItem?: string;
}

export function BiometricBatchScan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanType, setScanType] = useState<{ images: boolean; audio: boolean }>({ 
    images: true, 
    audio: true 
  });
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  // Get counts of media
  const { data: unprocessedCounts, isLoading: loadingCounts } = useQuery({
    queryKey: ['unprocessed-biometric-media', user?.id],
    queryFn: async () => {
      if (!user) return { images: 0, audio: 0 };

      const imagesResult = await supabase
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .like('mime_type', 'image/%');
        
      const audioResult = await supabase
        .from('media')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .like('mime_type', 'audio/%');

      return {
        images: imagesResult.count || 0,
        audio: audioResult.count || 0
      };
    },
    enabled: !!user
  });

  interface MediaItem {
    id: string;
    file_url: string | null;
    storage_path: string | null;
    profile_id: string | null;
    caption: string | null;
  }

  // Get media items for scanning
  const fetchMediaForScan = async (type: 'images' | 'audio', limit: number = 50): Promise<MediaItem[]> => {
    if (!user) return [];

    if (type === 'images') {
      const { data } = await supabase
        .from('media')
        .select('id, file_url, storage_path, profile_id, caption')
        .eq('user_id', user.id)
        .like('mime_type', 'image/%')
        .order('created_at', { ascending: false })
        .limit(limit);
      return (data || []) as MediaItem[];
    } else {
      const { data } = await supabase
        .from('media')
        .select('id, file_url, storage_path, profile_id, caption')
        .eq('user_id', user.id)
        .like('mime_type', 'audio/%')
        .order('created_at', { ascending: false })
        .limit(limit);
      return (data || []) as MediaItem[];
    }
  };

  const startScan = async () => {
    if (!user) return;
    
    setIsScanning(true);
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0 });

    try {
      const allItems: Array<MediaItem & { type: 'face' | 'voice' }> = [];

      if (scanType.images) {
        const images = await fetchMediaForScan('images');
        images.forEach(i => allItems.push({ ...i, type: 'face' as const }));
      }

      if (scanType.audio) {
        const audio = await fetchMediaForScan('audio');
        audio.forEach(a => allItems.push({ ...a, type: 'voice' as const }));
      }

      setProgress(p => ({ ...p!, total: allItems.length }));

      let successful = 0;
      let failed = 0;

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        setProgress(p => ({ 
          ...p!, 
          processed: i, 
          currentItem: item.caption || item.id 
        }));

        try {
          if (item.type === 'face') {
            // Get signed URL if needed
            let imageUrl = item.file_url;
            if (item.storage_path && !imageUrl) {
              const { data: urlData } = await supabase.storage
                .from('media')
                .createSignedUrl(item.storage_path, 3600);
              imageUrl = urlData?.signedUrl;
            }

            if (imageUrl && item.profile_id) {
              await supabase.functions.invoke('extract-facial-biometrics', {
                body: { 
                  imageUrl, 
                  profileId: item.profile_id, 
                  sourceType: 'media', 
                  sourceId: item.id 
                }
              });
              successful++;
            } else {
              failed++;
            }
          } else {
            // Voice processing - use file_url for audio
            let audioUrl = item.file_url;
            if (item.storage_path && !audioUrl) {
              const { data: urlData } = await supabase.storage
                .from('media')
                .createSignedUrl(item.storage_path, 3600);
              audioUrl = urlData?.signedUrl;
            }

            if (audioUrl && item.profile_id) {
              await supabase.functions.invoke('extract-voice-biometrics', {
                body: { 
                  audioUrl, 
                  profileId: item.profile_id, 
                  sourceType: 'media', 
                  sourceId: item.id
                }
              });
              successful++;
            } else {
              failed++;
            }
          }
        } catch (error) {
          console.error('Error processing item:', error);
          failed++;
        }

        setProgress(p => ({ ...p!, successful, failed }));

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      setProgress(p => ({ ...p!, processed: allItems.length, currentItem: undefined }));
      
      queryClient.invalidateQueries({ queryKey: ['biometric-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['biometric-samples'] });
      queryClient.invalidateQueries({ queryKey: ['unprocessed-biometric-media'] });
      
      toast.success(`Scan complete: ${successful} processed, ${failed} failed`);
    } catch (error) {
      console.error('Batch scan error:', error);
      toast.error('Batch scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const progressPercent = progress && progress.total > 0 
    ? (progress.processed / progress.total) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5" />
          Batch Biometric Scan
        </CardTitle>
        <CardDescription>
          Process existing media and voice notes for biometric enrollment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Type Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Select content to scan:</Label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="scan-images"
                  checked={scanType.images}
                  onCheckedChange={(checked) => 
                    setScanType(s => ({ ...s, images: !!checked }))
                  }
                  disabled={isScanning}
                />
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="scan-images" className="cursor-pointer">
                    Images & Photos
                  </Label>
                </div>
              </div>
              <Badge variant="secondary">
                {loadingCounts ? '...' : `${unprocessedCounts?.images || 0} unprocessed`}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="scan-audio"
                  checked={scanType.audio}
                  onCheckedChange={(checked) => 
                    setScanType(s => ({ ...s, audio: !!checked }))
                  }
                  disabled={isScanning}
                />
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="scan-audio" className="cursor-pointer">
                    Voice Notes
                  </Label>
                </div>
              </div>
              <Badge variant="secondary">
                {loadingCounts ? '...' : `${unprocessedCounts?.audio || 0} unprocessed`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isScanning ? 'Scanning...' : 'Scan Complete'}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.processed} / {progress.total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            
            {progress.currentItem && (
              <p className="text-xs text-muted-foreground truncate">
                Processing: {progress.currentItem}
              </p>
            )}

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{progress.successful} successful</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>{progress.failed} failed</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={startScan}
          disabled={isScanning || (!scanType.images && !scanType.audio)}
          className="w-full"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Batch Scan
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Note: Only media with assigned contacts will be processed for biometric enrollment.
          This may use AI credits.
        </p>
      </CardContent>
    </Card>
  );
}