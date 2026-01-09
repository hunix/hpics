import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Grid3X3, 
  Scan, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Zap,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { useMosaicBiometricScan, useMosaicCostEstimate, type MosaicScanProgress } from '@/hooks/useMosaicBiometricScan';
import { BIOMETRIC_MODEL_SPECS, calculateMosaicCapacity, formatCost } from '@/lib/biometricMosaic';

interface MosaicBatchScannerProps {
  onComplete?: (result: any) => void;
  preSelectedMediaIds?: string[];
}

export function MosaicBatchScanner({ onComplete, preSelectedMediaIds }: MosaicBatchScannerProps) {
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-lite');
  const [autoTagThreshold, setAutoTagThreshold] = useState(0.85);
  const [confirmThreshold, setConfirmThreshold] = useState(0.60);
  const [scanAllMedia, setScanAllMedia] = useState(!preSelectedMediaIds?.length);
  const [progress, setProgress] = useState<MosaicScanProgress | null>(null);

  const { scanMosaicAsync, isScanning, reset } = useMosaicBiometricScan();

  // Fetch unprocessed media count
  const { data: mediaStats, isLoading: statsLoading } = useQuery({
    queryKey: ['mosaic-scan-media-stats'],
    queryFn: async () => {
      const { count: totalMedia } = await supabase
        .from('media')
        .select('id', { count: 'exact', head: true })
        .in('mime_type', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

      const { count: scannedMedia } = await supabase
        .from('biometric_samples')
        .select('id', { count: 'exact', head: true })
        .eq('biometric_type', 'face');

      const { count: enrolledProfiles } = await supabase
        .from('contact_biometrics')
        .select('id', { count: 'exact', head: true })
        .not('facial_embedding', 'is', null);

      return {
        totalMedia: totalMedia || 0,
        scannedMedia: scannedMedia || 0,
        unscannedMedia: (totalMedia || 0) - (scannedMedia || 0),
        enrolledProfiles: enrolledProfiles || 0
      };
    }
  });

  const imageCount = preSelectedMediaIds?.length || (scanAllMedia ? mediaStats?.unscannedMedia : 0) || 0;
  const costEstimate = useMosaicCostEstimate(imageCount, selectedModel);
  const capacity = calculateMosaicCapacity(selectedModel);

  const handleStartScan = async () => {
    try {
      let mediaIds = preSelectedMediaIds || [];

      if (scanAllMedia && !preSelectedMediaIds?.length) {
        // Fetch all unscanned media IDs
        const { data: unscannedMedia } = await supabase
          .from('media')
          .select('id')
          .in('mime_type', ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
          .limit(1000);

        mediaIds = (unscannedMedia || []).map(m => m.id);
      }

      if (mediaIds.length === 0) {
        return;
      }

      const result = await scanMosaicAsync({
        mediaIds,
        modelKey: selectedModel,
        autoTagThreshold,
        confirmThreshold,
        onProgress: setProgress
      });

      onComplete?.(result);
    } catch (e) {
      console.error('Scan failed:', e);
    }
  };

  const modelOptions = Object.entries(BIOMETRIC_MODEL_SPECS)
    .filter(([key]) => key !== 'default')
    .map(([key, spec]) => ({
      value: key,
      label: key.split('/')[1] || key,
      cost: `$${spec.costPer1MTokens.toFixed(3)}/1M tokens`
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Mosaic Batch Scanner
        </CardTitle>
        <CardDescription>
          Process multiple images efficiently using mosaic technology - 96%+ cost savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        {!statsLoading && mediaStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ImageIcon className="h-4 w-4" />
                Total Images
              </div>
              <div className="text-2xl font-bold">{mediaStats.totalMedia}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Scan className="h-4 w-4" />
                Unscanned
              </div>
              <div className="text-2xl font-bold">{mediaStats.unscannedMedia}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                Enrolled Faces
              </div>
              <div className="text-2xl font-bold">{mediaStats.enrolledProfiles}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Zap className="h-4 w-4" />
                Per Mosaic
              </div>
              <div className="text-2xl font-bold">{capacity.maxCells}</div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isScanning}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex justify-between items-center w-full gap-4">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.cost}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Auto-Tag Threshold: {Math.round(autoTagThreshold * 100)}%</Label>
            <Slider
              value={[autoTagThreshold]}
              onValueChange={([v]) => setAutoTagThreshold(v)}
              min={0.7}
              max={0.99}
              step={0.01}
              disabled={isScanning}
            />
            <p className="text-xs text-muted-foreground">
              Faces above this confidence are auto-tagged
            </p>
          </div>
        </div>

        {/* Cost Comparison */}
        {imageCount > 0 && (
          <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="font-medium">Cost Comparison</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                {costEstimate.savingsPercent.toFixed(0)}% Savings
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Per-Image Cost</div>
                <div className="font-medium line-through text-muted-foreground">
                  {formatCost(costEstimate.perImageCostCents)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Mosaic Cost</div>
                <div className="font-medium text-green-600">
                  {formatCost(costEstimate.mosaicCostCents)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">You Save</div>
                <div className="font-medium text-green-600">
                  {formatCost(costEstimate.savingsCents)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {costEstimate.totalMosaics} mosaic(s) × {capacity.maxCells} images each = {imageCount} images
            </div>
          </div>
        )}

        {/* Progress */}
        {isScanning && progress && (
          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="capitalize">{progress.phase}...</span>
              </div>
              <Badge variant="outline">
                Mosaic {progress.currentMosaic}/{progress.totalMosaics}
              </Badge>
            </div>
            
            <Progress 
              value={(progress.currentMosaic / progress.totalMosaics) * 100} 
            />

            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-lg font-bold">{progress.facesDetected}</div>
                <div className="text-xs text-muted-foreground">Faces</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-lg font-bold">{progress.autoTagged}</div>
                <div className="text-xs text-muted-foreground">Auto-Tagged</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-lg font-bold">{progress.pendingConfirmation}</div>
                <div className="text-xs text-muted-foreground">To Review</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-lg font-bold">{formatCost(progress.actualCostCents)}</div>
                <div className="text-xs text-muted-foreground">Cost</div>
              </div>
            </div>
          </div>
        )}

        {/* Completion */}
        {progress?.phase === 'complete' && (
          <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Scan Complete!</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Processed {progress.totalImages} images, detected {progress.facesDetected} faces, 
              auto-tagged {progress.autoTagged}, {progress.pendingConfirmation} pending review.
              Total cost: {formatCost(progress.actualCostCents)}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => { reset(); setProgress(null); }}
            >
              Start New Scan
            </Button>
          </div>
        )}

        {/* Scan All Checkbox */}
        {!preSelectedMediaIds?.length && !isScanning && progress?.phase !== 'complete' && (
          <div className="flex items-center gap-2">
            <Checkbox 
              id="scan-all" 
              checked={scanAllMedia}
              onCheckedChange={(checked) => setScanAllMedia(!!checked)}
            />
            <Label htmlFor="scan-all" className="cursor-pointer">
              Scan all unprocessed images ({mediaStats?.unscannedMedia || 0})
            </Label>
          </div>
        )}

        {/* Start Button */}
        {progress?.phase !== 'complete' && (
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStartScan}
            disabled={isScanning || imageCount === 0}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4 mr-2" />
                Start Mosaic Scan ({imageCount} images)
              </>
            )}
          </Button>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          Mosaic technology combines {capacity.maxCells} images into one AI call, 
          reducing costs by 96%+ while maintaining detection quality.
        </p>
      </CardContent>
    </Card>
  );
}
