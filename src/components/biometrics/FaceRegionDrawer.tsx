import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Square, 
  Circle, 
  RectangleHorizontal, 
  Wand2, 
  Trash2, 
  Save, 
  Loader2,
  Check,
  X,
  User
} from 'lucide-react';
import { useFaceRegions, FaceRegion, CreateFaceRegionInput } from '@/hooks/useFaceRegions';
import { faceDetectionService, DetectedFace } from '@/lib/faceDetection';
import { toast } from 'sonner';

type Shape = 'rectangle' | 'circle' | 'square';

interface DrawingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: Shape;
}

interface FaceRegionDrawerProps {
  mediaId: string;
  imageUrl: string;
  profiles?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
  onClose?: () => void;
  onRegionsChanged?: () => void;
}

export function FaceRegionDrawer({
  mediaId,
  imageUrl,
  profiles = [],
  onClose,
  onRegionsChanged,
}: FaceRegionDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape>('rectangle');
  const [drawingRegion, setDrawingRegion] = useState<DrawingRegion | null>(null);
  const [pendingRegions, setPendingRegions] = useState<DrawingRegion[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [modelsReady, setModelsReady] = useState(false);

  const { regions, createRegion, createRegions, deleteRegion, assignProfile } = useFaceRegions(mediaId);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.onerror = () => {
      toast.error('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Check if face detection models are ready
  useEffect(() => {
    faceDetectionService.loadModels().then(ready => {
      setModelsReady(ready);
    });
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const displayHeight = containerWidth * aspectRatio;

    canvas.width = containerWidth;
    canvas.height = displayHeight;

    // Draw image
    ctx.drawImage(img, 0, 0, containerWidth, displayHeight);

    // Draw existing regions
    regions.forEach(region => {
      const x = region.x * containerWidth;
      const y = region.y * displayHeight;
      const w = region.width * containerWidth;
      const h = region.height * displayHeight;

      ctx.strokeStyle = region.verified ? '#22c55e' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash(region.detection_method === 'manual' ? [] : [5, 5]);

      if (region.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }

      // Highlight selected
      if (selectedRegionId === region.id) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        if (region.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2 + 2, h / 2 + 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        }
      }

      // Draw label
      if (region.profile?.full_name) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y - 20, ctx.measureText(region.profile.full_name).width + 8, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(region.profile.full_name, x + 4, y - 6);
      }
    });

    // Draw pending regions
    pendingRegions.forEach((region, index) => {
      const x = region.x * containerWidth;
      const y = region.y * displayHeight;
      const w = region.width * containerWidth;
      const h = region.height * displayHeight;

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      if (region.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }

      // Draw index
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`#${index + 1}`, x + 4, y + 16);
    });

    // Draw current drawing region
    if (drawingRegion) {
      const x = drawingRegion.x * containerWidth;
      const y = drawingRegion.y * displayHeight;
      const w = drawingRegion.width * containerWidth;
      const h = drawingRegion.height * displayHeight;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      if (drawingRegion.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }
    }

    ctx.setLineDash([]);
  }, [regions, pendingRegions, drawingRegion, selectedRegionId, imageLoaded]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Mouse handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Check if clicking on existing region
    const canvas = canvasRef.current;
    if (canvas) {
      const clickedRegion = regions.find(region => {
        return (
          coords.x >= region.x &&
          coords.x <= region.x + region.width &&
          coords.y >= region.y &&
          coords.y <= region.y + region.height
        );
      });

      if (clickedRegion) {
        setSelectedRegionId(clickedRegion.id);
        return;
      }
    }

    setSelectedRegionId(null);
    setIsDrawing(true);
    setStartPos(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    let width = coords.x - startPos.x;
    let height = coords.y - startPos.y;

    // For square shape, make width and height equal
    if (currentShape === 'square') {
      const size = Math.max(Math.abs(width), Math.abs(height));
      width = width >= 0 ? size : -size;
      height = height >= 0 ? size : -size;
    }

    setDrawingRegion({
      x: width >= 0 ? startPos.x : startPos.x + width,
      y: height >= 0 ? startPos.y : startPos.y + height,
      width: Math.abs(width),
      height: Math.abs(height),
      shape: currentShape,
    });
  };

  const handleMouseUp = () => {
    if (drawingRegion && drawingRegion.width > 0.01 && drawingRegion.height > 0.01) {
      setPendingRegions(prev => [...prev, drawingRegion]);
    }
    setIsDrawing(false);
    setStartPos(null);
    setDrawingRegion(null);
  };

  // Auto-detect faces using local AI
  const handleAutoDetect = async () => {
    if (!imageRef.current) return;

    setIsAutoDetecting(true);
    try {
      const faces = await faceDetectionService.detectFaces(imageRef.current);
      
      if (faces.length === 0) {
        toast.info('No faces detected in this image');
        return;
      }

      const newRegions: DrawingRegion[] = faces.map(face => ({
        x: face.normalizedBox.x,
        y: face.normalizedBox.y,
        width: face.normalizedBox.width,
        height: face.normalizedBox.height,
        shape: 'rectangle' as Shape,
      }));

      setPendingRegions(prev => [...prev, ...newRegions]);
      toast.success(`Detected ${faces.length} face(s)`);
    } catch (error) {
      console.error('Face detection error:', error);
      toast.error('Face detection failed. Models may not be loaded.');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Save pending regions
  const handleSavePending = async () => {
    if (pendingRegions.length === 0) return;

    const inputs: CreateFaceRegionInput[] = pendingRegions.map(region => ({
      media_id: mediaId,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      shape: region.shape,
      detection_method: 'manual',
    }));

    await createRegions.mutateAsync(inputs);
    setPendingRegions([]);
    onRegionsChanged?.();
  };

  // Clear pending regions
  const handleClearPending = () => {
    setPendingRegions([]);
  };

  // Delete selected region
  const handleDeleteSelected = async () => {
    if (!selectedRegionId) return;
    await deleteRegion.mutateAsync(selectedRegionId);
    setSelectedRegionId(null);
    onRegionsChanged?.();
  };

  // Assign profile to selected region
  const handleAssignProfile = async (profileId: string) => {
    if (!selectedRegionId) return;
    await assignProfile.mutateAsync({ regionId: selectedRegionId, profileId: profileId || null });
    onRegionsChanged?.();
  };

  const selectedRegion = regions.find(r => r.id === selectedRegionId);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tag Faces</CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={currentShape === 'rectangle' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setCurrentShape('rectangle')}
              title="Rectangle"
            >
              <RectangleHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant={currentShape === 'square' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setCurrentShape('square')}
              title="Square"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={currentShape === 'circle' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setCurrentShape('circle')}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            disabled={isAutoDetecting || !modelsReady}
            title={modelsReady ? 'Auto-detect faces (FREE - runs locally)' : 'Loading face detection models...'}
          >
            {isAutoDetecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Auto-detect
            <Badge variant="secondary" className="ml-2 text-xs">FREE</Badge>
          </Button>

          {pendingRegions.length > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleSavePending}
                disabled={createRegions.isPending}
              >
                {createRegions.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save ({pendingRegions.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPending}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative w-full">
          {!imageLoaded ? (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair rounded-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}
        </div>

        {/* Selected region actions */}
        {selectedRegion && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedRegion.profile_id || ''}
              onValueChange={handleAssignProfile}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Assign to profile..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDeleteSelected}
              disabled={deleteRegion.isPending}
            >
              {deleteRegion.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {regions.length} saved region{regions.length !== 1 ? 's' : ''}
          </Badge>
          {pendingRegions.length > 0 && (
            <Badge variant="secondary">
              {pendingRegions.length} pending
            </Badge>
          )}
          <Badge variant={modelsReady ? 'default' : 'secondary'}>
            {modelsReady ? 'Local AI ready' : 'Loading AI models...'}
          </Badge>
        </div>

        {/* Instructions */}
        <p className="text-xs text-muted-foreground">
          Click and drag to draw a region around a face. Use Auto-detect for free local face detection.
          Click a saved region to select it, then assign a profile or delete it.
        </p>
      </CardContent>
    </Card>
  );
}
