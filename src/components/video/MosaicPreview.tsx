import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, 
  Loader2, 
  Image as ImageIcon,
  Clock,
  Layers,
  Maximize2
} from 'lucide-react';
import { 
  generateTemporalMosaic, 
  getMosaicPreviewInfo, 
  MosaicResult,
  getModelSpec
} from '@/lib/temporalMosaic';

interface MosaicPreviewProps {
  videoElement: HTMLVideoElement | null;
  modelKey: string;
  onMosaicGenerated?: (mosaic: MosaicResult) => void;
}

export function MosaicPreview({ videoElement, modelKey, onMosaicGenerated }: MosaicPreviewProps) {
  const [targetFps, setTargetFps] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedMosaic, setGeneratedMosaic] = useState<MosaicResult | null>(null);
  const [previewInfo, setPreviewInfo] = useState<ReturnType<typeof getMosaicPreviewInfo> | null>(null);

  useEffect(() => {
    if (videoElement && videoElement.duration && videoElement.videoWidth) {
      const info = getMosaicPreviewInfo(
        videoElement.duration,
        videoElement.videoWidth,
        videoElement.videoHeight,
        modelKey,
        targetFps
      );
      setPreviewInfo(info);
    }
  }, [videoElement, modelKey, targetFps]);

  const handleGenerate = async () => {
    if (!videoElement) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      const mosaic = await generateTemporalMosaic(
        {
          videoElement,
          modelKey,
          targetFps,
        },
        (p) => setProgress(p)
      );
      
      setGeneratedMosaic(mosaic);
      if (onMosaicGenerated) {
        onMosaicGenerated(mosaic);
      }
    } catch (error) {
      console.error('Failed to generate mosaic:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const modelSpec = getModelSpec(modelKey);

  if (!videoElement || !videoElement.duration) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select a video to preview mosaic options</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Temporal Mosaic
        </CardTitle>
        <CardDescription>
          Generate an optimized frame mosaic for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model specs */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">AI Model: {modelKey}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Max: {modelSpec.maxWidth}×{modelSpec.maxHeight}px</span>
            <span>Min cell: {modelSpec.minCellWidth}×{modelSpec.minCellHeight}px</span>
          </div>
        </div>

        {/* FPS control */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Frames per second</Label>
            <span className="text-sm text-muted-foreground">{targetFps} fps</span>
          </div>
          <Slider
            value={[targetFps]}
            min={0.5}
            max={5}
            step={0.5}
            onValueChange={(v) => setTargetFps(v[0])}
          />
        </div>

        {/* Preview info */}
        {previewInfo && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Layers className="h-4 w-4" />
                Frames
              </div>
              <p className="font-medium">{previewInfo.frameCount}</p>
              <p className="text-xs text-muted-foreground">
                {previewInfo.gridCols}×{previewInfo.gridRows} grid
              </p>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Maximize2 className="h-4 w-4" />
                Canvas Size
              </div>
              <p className="font-medium">{previewInfo.canvasWidth}×{previewInfo.canvasHeight}</p>
              <p className="text-xs text-muted-foreground">
                ~{previewInfo.estimatedSizeKB} KB
              </p>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ImageIcon className="h-4 w-4" />
                Cell Size
              </div>
              <p className="font-medium">{previewInfo.cellWidth}×{previewInfo.cellHeight}px</p>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Coverage
              </div>
              <p className="font-medium">{Math.round(previewInfo.coverageSeconds)}s</p>
              <p className="text-xs text-muted-foreground">
                of {Math.round(videoElement.duration)}s total
              </p>
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Grid3X3 className="mr-2 h-4 w-4" />
              Generate Mosaic
            </>
          )}
        </Button>

        {isGenerating && (
          <Progress value={progress} />
        )}

        {/* Generated mosaic preview */}
        {generatedMosaic && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Mosaic</Label>
              <Badge variant="secondary">
                {generatedMosaic.frameCount} frames
              </Badge>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={generatedMosaic.imageDataUrl} 
                alt="Temporal mosaic"
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {generatedMosaic.canvasWidth}×{generatedMosaic.canvasHeight}px • 
              {generatedMosaic.gridCols}×{generatedMosaic.gridRows} grid
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
