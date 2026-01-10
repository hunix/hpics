import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Square, 
  Circle, 
  RectangleHorizontal, 
  Wand2, 
  Trash2, 
  Save, 
  Loader2,
  X,
  User,
  MousePointer,
  Info,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useFaceRegions, FaceRegion, CreateFaceRegionInput } from '@/hooks/useFaceRegions';
import { faceDetectionService } from '@/lib/faceDetection';
import { toast } from 'sonner';
import { ScalableContactSearch } from '@/components/contacts/ScalableContactSearch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
  profiles?: Array<{ id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }>;
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
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

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

      const isSelected = selectedRegionId === region.id;
      const isHovered = hoveredRegionId === region.id;
      const isAssigned = !!region.profile_id;
      
      // Base color based on state
      let strokeColor = isAssigned ? '#22c55e' : '#3b82f6'; // green if assigned, blue if not
      if (isSelected) strokeColor = '#f59e0b'; // amber when selected
      if (isHovered && !isSelected) strokeColor = '#8b5cf6'; // purple when hovered

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
      ctx.setLineDash(region.detection_method === 'manual' ? [] : [5, 5]);

      if (region.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }

      // Draw selection/hover highlight
      if (isSelected || isHovered) {
        ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)';
        if (region.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, h);
        }
      }

      // Draw label
      const profileName = region.profile ? [region.profile.first_name, region.profile.last_name].filter(Boolean).join(' ') : null;
      ctx.fillStyle = profileName ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)';
      const labelText = profileName || 'Click to assign';
      const labelWidth = ctx.measureText(labelText).width + (isAssigned ? 28 : 16);
      ctx.fillRect(x, y - 24, labelWidth, 22);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      
      // Draw checkmark icon for assigned regions
      if (isAssigned) {
        ctx.fillText('✓', x + 6, y - 8);
        ctx.fillText(labelText, x + 20, y - 8);
      } else {
        ctx.fillText(labelText, x + 8, y - 8);
      }

      // Draw green checkmark badge on corner for assigned regions
      if (isAssigned) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        // Draw checkmark
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x + w - 15, y + 10);
        ctx.lineTo(x + w - 11, y + 14);
        ctx.lineTo(x + w - 5, y + 6);
        ctx.stroke();
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

      // Draw index badge
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, x + 12, y + 16);
      ctx.textAlign = 'start';
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
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';

      if (drawingRegion.shape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      } else {
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
      }
    }

    ctx.setLineDash([]);
  }, [regions, pendingRegions, drawingRegion, selectedRegionId, hoveredRegionId, imageLoaded]);

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

  const findRegionAtPoint = (coords: { x: number; y: number }) => {
    return regions.find(region => {
      return (
        coords.x >= region.x &&
        coords.x <= region.x + region.width &&
        coords.y >= region.y &&
        coords.y <= region.y + region.height
      );
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Check if clicking on existing region
    const clickedRegion = findRegionAtPoint(coords);

    if (clickedRegion) {
      setSelectedRegionId(clickedRegion.id);
      return;
    }

    setSelectedRegionId(null);
    setIsDrawing(true);
    setStartPos(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Update hover state
    if (!isDrawing) {
      const hovered = findRegionAtPoint(coords);
      setHoveredRegionId(hovered?.id || null);
    }

    if (!isDrawing || !startPos) return;

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

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredRegionId(null);
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
  const handleAssignProfile = async (profileId: string | null, profileName?: string) => {
    if (!selectedRegionId) return;
    await assignProfile.mutateAsync({ regionId: selectedRegionId, profileId: profileId || null });
    
    // Show informative toast with contact name
    if (profileId && profileName) {
      toast.success(`Assigned to ${profileName}`, {
        description: 'Your work is automatically saved'
      });
    }
    
    onRegionsChanged?.();
  };

  const selectedRegion = regions.find(r => r.id === selectedRegionId);
  const unassignedCount = regions.filter(r => !r.profile_id).length;
  const assignedCount = regions.filter(r => r.profile_id).length;
  const allAssigned = regions.length > 0 && unassignedCount === 0;

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
        {/* Completion Success Banner */}
        {allAssigned && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>All {regions.length} face{regions.length !== 1 ? 's' : ''} tagged!</strong> Your work is saved. 
              You can safely close this window.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions Alert */}
        {regions.length > 0 && unassignedCount > 0 && !selectedRegionId && (
          <Alert>
            <MousePointer className="h-4 w-4" />
            <AlertDescription>
              <strong>Click on any face box</strong> to select it, then assign a contact using the search below.
              <span className="text-muted-foreground ml-1">
                ({unassignedCount} of {regions.length} remaining)
              </span>
            </AlertDescription>
          </Alert>
        )}

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
              className={cn(
                "w-full rounded-lg transition-all",
                isDrawing ? "cursor-crosshair" : hoveredRegionId ? "cursor-pointer" : "cursor-crosshair"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </div>

        {/* Selected region actions - Now prominently displayed */}
        <div className={cn(
          "p-4 rounded-lg border-2 transition-all",
          selectedRegion 
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700" 
            : "bg-muted/50 border-dashed border-muted-foreground/30"
        )}>
          {selectedRegion ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Face Region Selected</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRegion.profile 
                        ? `Assigned to ${[selectedRegion.profile.first_name, selectedRegion.profile.last_name].filter(Boolean).join(' ')}`
                        : 'Not assigned to any contact'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRegionId(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <ScalableContactSearch
                  selectedId={selectedRegion.profile_id}
                  onSelect={(id, contact) => {
                    const name = contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : undefined;
                    handleAssignProfile(id, name);
                  }}
                  placeholder="Search contacts to assign..."
                  allowNone
                  noneLabel="Remove assignment"
                  className="flex-1"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteSelected}
                  disabled={deleteRegion.isPending}
                  title="Delete this face region"
                >
                  {deleteRegion.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                {regions.length > 0 
                  ? 'Click on a face region above to select and assign a contact'
                  : 'Draw a region around a face or use Auto-detect to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {regions.length} face{regions.length !== 1 ? 's' : ''} detected
          </Badge>
          {regions.length > 0 && (
            <Badge 
              variant={allAssigned ? 'default' : 'secondary'} 
              className={cn(
                allAssigned 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                  : 'text-amber-600 dark:text-amber-400'
              )}
            >
              {allAssigned ? (
                <><Check className="h-3 w-3 mr-1" />{assignedCount}/{regions.length} assigned</>
              ) : (
                <>{assignedCount}/{regions.length} assigned</>
              )}
            </Badge>
          )}
          {pendingRegions.length > 0 && (
            <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">
              {pendingRegions.length} pending save
            </Badge>
          )}
          <Badge variant={modelsReady ? 'default' : 'secondary'}>
            {modelsReady ? '✓ Local AI ready' : 'Loading AI models...'}
          </Badge>
        </div>

        {/* Help text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <strong>Draw:</strong> Click and drag to outline a face • <strong>Auto-detect:</strong> Free local AI detection
          </p>
          <p className="flex items-center gap-1">
            <MousePointer className="h-3 w-3" />
            <strong>Assign:</strong> Click a saved region → Search for a contact → Select to link
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
