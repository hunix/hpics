import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Grid3X3, 
  Loader2, 
  Image as ImageIcon,
  Clock,
  Layers,
  Maximize2,
  Save,
  Check
} from 'lucide-react';
import { 
  generateTemporalMosaic, 
  getMosaicPreviewInfo, 
  MosaicResult,
  getModelSpec
} from '@/lib/temporalMosaic';

interface SavedMosaic {
  id: string;
  mosaic_url: string;
  frame_count: number;
  grid_cols: number;
  grid_rows: number;
  model_key: string;
  frames_per_second: number;
}

interface MosaicPreviewProps {
  videoElement: HTMLVideoElement | null;
  modelKey: string;
  mediaId: string;
  profileId: string;
  onMosaicGenerated?: (mosaic: MosaicResult) => void;
  onMosaicSelected?: (mosaicUrl: string | null) => void;
}

export function MosaicPreview({ 
  videoElement, 
  modelKey, 
  mediaId, 
  profileId,
  onMosaicGenerated,
  onMosaicSelected 
}: MosaicPreviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetFps, setTargetFps] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedMosaic, setGeneratedMosaic] = useState<MosaicResult | null>(null);
  const [previewInfo, setPreviewInfo] = useState<ReturnType<typeof getMosaicPreviewInfo> | null>(null);
  const [savedMosaics, setSavedMosaics] = useState<SavedMosaic[]>([]);
  const [selectedSavedMosaic, setSelectedSavedMosaic] = useState<string | null>(null);

  // Fetch existing mosaics for this media
  useEffect(() => {
    if (mediaId && user) {
      fetchSavedMosaics();
    }
  }, [mediaId, user]);

  const fetchSavedMosaics = async () => {
    const { data, error } = await supabase
      .from('video_mosaics')
      .select('id, mosaic_url, frame_count, grid_cols, grid_rows, model_key, frames_per_second')
      .eq('media_id', mediaId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedMosaics(data);
    }
  };

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
      setSelectedSavedMosaic(null);
      if (onMosaicGenerated) {
        onMosaicGenerated(mosaic);
      }
      if (onMosaicSelected) {
        onMosaicSelected(mosaic.imageDataUrl);
      }
    } catch (error) {
      console.error('Failed to generate mosaic:', error);
      toast({ title: 'Failed to generate mosaic', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMosaic = async () => {
    if (!generatedMosaic || !user || !mediaId || !profileId) return;

    setIsSaving(true);
    try {
      // Convert base64 to blob
      const response = await fetch(generatedMosaic.imageDataUrl);
      const blob = await response.blob();
      
      // Upload to storage
      const fileName = `${user.id}/${mediaId}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('mosaics')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('mosaics')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('video_mosaics')
        .insert({
          user_id: user.id,
          media_id: mediaId,
          profile_id: profileId,
          mosaic_url: urlData.publicUrl,
          frame_count: generatedMosaic.frameCount,
          grid_cols: generatedMosaic.gridCols,
          grid_rows: generatedMosaic.gridRows,
          cell_width: generatedMosaic.cellWidth,
          cell_height: generatedMosaic.cellHeight,
          canvas_width: generatedMosaic.canvasWidth,
          canvas_height: generatedMosaic.canvasHeight,
          video_duration: generatedMosaic.videoDuration,
          frames_per_second: generatedMosaic.framesPerSecond,
          model_key: modelKey,
          file_size: blob.size,
        });

      if (dbError) throw dbError;

      toast({ title: 'Mosaic saved successfully' });
      fetchSavedMosaics();
    } catch (error) {
      console.error('Failed to save mosaic:', error);
      toast({ title: 'Failed to save mosaic', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSavedMosaic = (mosaic: SavedMosaic) => {
    setSelectedSavedMosaic(mosaic.id);
    setGeneratedMosaic(null);
    if (onMosaicSelected) {
      onMosaicSelected(mosaic.mosaic_url);
    }
  };

  const handleClearSelection = () => {
    setSelectedSavedMosaic(null);
    setGeneratedMosaic(null);
    if (onMosaicSelected) {
      onMosaicSelected(null);
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
        {/* Saved mosaics */}
        {savedMosaics.length > 0 && (
          <div className="space-y-2">
            <Label>Previously Saved Mosaics</Label>
            <div className="grid grid-cols-2 gap-2">
              {savedMosaics.map((mosaic) => (
                <button
                  key={mosaic.id}
                  onClick={() => handleSelectSavedMosaic(mosaic)}
                  className={`p-2 border rounded-lg text-left transition-all ${
                    selectedSavedMosaic === mosaic.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedSavedMosaic === mosaic.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p className="text-xs font-medium">{mosaic.frame_count} frames</p>
                      <p className="text-xs text-muted-foreground">
                        {mosaic.grid_cols}×{mosaic.grid_rows} • {mosaic.frames_per_second} fps
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {(selectedSavedMosaic || generatedMosaic) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSelection}
                className="w-full"
              >
                Clear Selection (Use Video URL)
              </Button>
            )}
          </div>
        )}

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
              Generate New Mosaic
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
            <Button 
              onClick={handleSaveMosaic} 
              disabled={isSaving}
              variant="outline"
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Mosaic for Reuse
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
