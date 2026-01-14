import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Hand, Trash2, Save, RotateCcw,
  CheckCircle2, AlertTriangle, Activity
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface SignatureCaptureCanvasProps {
  profileId: string;
  profileName: string;
  onCapture?: (data: SignatureData) => void;
}

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

interface StrokeData {
  points: StrokePoint[];
  startTime: number;
  endTime: number;
}

interface SignatureData {
  strokes: StrokeData[];
  totalDuration: number;
  boundingBox: { minX: number; maxX: number; minY: number; maxY: number };
  features: SignatureFeatures;
}

interface SignatureFeatures {
  strokeCount: number;
  totalPoints: number;
  averagePressure: number;
  pressureVariance: number;
  averageVelocity: number;
  velocityVariance: number;
  aspectRatio: number;
  totalLength: number;
  penLifts: number;
  writingTime: number;
}

export function SignatureCaptureCanvas({ profileId, profileName, onCapture }: SignatureCaptureCanvasProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([]);
  const [quality, setQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');
  const [capturedSignatures, setCapturedSignatures] = useState<SignatureData[]>([]);

  const saveSignatureMutation = useMutation({
    mutationFn: async (signatureData: SignatureData) => {
      if (!user) throw new Error('Not authenticated');

      // First, get or create biometrics record
      const { data: existing } = await supabase
        .from('contact_biometrics')
        .select('id, signature_samples_count')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('contact_biometrics')
          .update({
            signature_features: JSON.parse(JSON.stringify(signatureData.features)) as Json,
            signature_samples_count: (existing.signature_samples_count || 0) + 1,
            signature_confidence: calculateConfidence(capturedSignatures.length + 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('contact_biometrics')
          .insert([{
            user_id: user.id,
            profile_id: profileId,
            signature_features: JSON.parse(JSON.stringify(signatureData.features)) as Json,
            signature_samples_count: 1,
            signature_confidence: 0.3
          }]);
      }

      // Store the sample
      await supabase
        .from('biometric_samples')
        .insert([{
          user_id: user.id,
          profile_id: profileId,
          biometric_type: 'signature',
          features: JSON.parse(JSON.stringify(signatureData)) as Json,
          quality_score: quality === 'excellent' ? 0.95 : quality === 'good' ? 0.8 : quality === 'fair' ? 0.6 : 0.4,
          source_type: 'canvas_capture',
          status: 'processed'
        }]);

      return signatureData;
    },
    onSuccess: () => {
      toast.success('Signature captured successfully');
      queryClient.invalidateQueries({ queryKey: ['contact-biometrics-extended', profileId] });
      clearCanvas();
    },
    onError: (error) => {
      toast.error('Failed to save signature');
      console.error(error);
    }
  });

  const calculateConfidence = (sampleCount: number) => {
    return Math.min(0.95, 0.3 + sampleCount * 0.15);
  };

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const getPointerPosition = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPointerPosition(e);
    setCurrentStroke([{
      ...pos,
      timestamp: Date.now()
    }]);
  }, [getPointerPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPointerPosition(e);
    const newPoint: StrokePoint = {
      ...pos,
      timestamp: Date.now()
    };
    
    setCurrentStroke(prev => {
      const updated = [...prev, newPoint];
      
      // Draw on canvas
      const ctx = getCanvasContext();
      if (ctx && prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(newPoint.x, newPoint.y);
        ctx.lineWidth = 2 + newPoint.pressure * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'hsl(var(--foreground))';
        ctx.stroke();
      }
      
      return updated;
    });
  }, [isDrawing, getPointerPosition, getCanvasContext]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentStroke.length === 0) return;
    setIsDrawing(false);
    
    const strokeData: StrokeData = {
      points: currentStroke,
      startTime: currentStroke[0].timestamp,
      endTime: currentStroke[currentStroke.length - 1].timestamp
    };
    
    setStrokes(prev => [...prev, strokeData]);
    setCurrentStroke([]);
    
    // Update quality based on stroke count
    const totalStrokes = strokes.length + 1;
    if (totalStrokes >= 3 && currentStroke.length >= 50) {
      setQuality('excellent');
    } else if (totalStrokes >= 2 && currentStroke.length >= 30) {
      setQuality('good');
    } else if (currentStroke.length >= 20) {
      setQuality('fair');
    }
  }, [isDrawing, currentStroke, strokes.length]);

  const clearCanvas = useCallback(() => {
    const ctx = getCanvasContext();
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setStrokes([]);
    setCurrentStroke([]);
    setQuality('poor');
  }, [getCanvasContext]);

  const extractFeatures = useCallback((): SignatureData | null => {
    if (strokes.length === 0) return null;
    
    const allPoints = strokes.flatMap(s => s.points);
    if (allPoints.length === 0) return null;
    
    // Calculate bounding box
    const xs = allPoints.map(p => p.x);
    const ys = allPoints.map(p => p.y);
    const boundingBox = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
    
    // Calculate velocities
    const velocities: number[] = [];
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = stroke.points[i].x - stroke.points[i-1].x;
        const dy = stroke.points[i].y - stroke.points[i-1].y;
        const dt = stroke.points[i].timestamp - stroke.points[i-1].timestamp;
        if (dt > 0) {
          velocities.push(Math.sqrt(dx*dx + dy*dy) / dt);
        }
      }
    }
    
    // Calculate total path length
    let totalLength = 0;
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        const dx = stroke.points[i].x - stroke.points[i-1].x;
        const dy = stroke.points[i].y - stroke.points[i-1].y;
        totalLength += Math.sqrt(dx*dx + dy*dy);
      }
    }
    
    const pressures = allPoints.map(p => p.pressure);
    const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
    const pressureVariance = pressures.reduce((sum, p) => sum + Math.pow(p - avgPressure, 2), 0) / pressures.length;
    
    const avgVelocity = velocities.length > 0 
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
      : 0;
    const velocityVariance = velocities.length > 0
      ? velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length
      : 0;
    
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    
    const features: SignatureFeatures = {
      strokeCount: strokes.length,
      totalPoints: allPoints.length,
      averagePressure: avgPressure,
      pressureVariance,
      averageVelocity: avgVelocity,
      velocityVariance,
      aspectRatio: height > 0 ? width / height : 1,
      totalLength,
      penLifts: strokes.length - 1,
      writingTime: strokes[strokes.length - 1].endTime - strokes[0].startTime
    };
    
    return {
      strokes,
      totalDuration: features.writingTime,
      boundingBox,
      features
    };
  }, [strokes]);

  const handleSave = useCallback(() => {
    const data = extractFeatures();
    if (data) {
      setCapturedSignatures(prev => [...prev, data]);
      saveSignatureMutation.mutate(data);
      onCapture?.(data);
    }
  }, [extractFeatures, onCapture, saveSignatureMutation]);

  useEffect(() => {
    const ctx = getCanvasContext();
    if (ctx && canvasRef.current) {
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [getCanvasContext]);

  const qualityColor = {
    poor: 'text-red-500',
    fair: 'text-orange-500',
    good: 'text-yellow-500',
    excellent: 'text-green-500'
  }[quality];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Hand className="h-4 w-4" />
            Signature Capture
          </CardTitle>
          <Badge variant="outline">
            {capturedSignatures.length} captured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Sign naturally on the canvas below. We capture stroke dynamics, pressure, and timing for biometric analysis.
          </AlertDescription>
        </Alert>

        {/* Quality Indicator */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {quality === 'excellent' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${qualityColor}`} />
            )}
            <span className="text-sm">Signal Quality:</span>
            <span className={`text-sm font-medium ${qualityColor}`}>
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{strokes.length} strokes</span>
            <span>•</span>
            <span>{strokes.reduce((sum, s) => sum + s.points.length, 0)} points</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-48 cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
          {strokes.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">Sign here</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCanvas}
            disabled={strokes.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearCanvas}
              disabled={strokes.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Redo
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={strokes.length === 0 || saveSignatureMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {saveSignatureMutation.isPending ? 'Saving...' : 'Capture'}
            </Button>
          </div>
        </div>

        {/* Feature Preview */}
        {strokes.length > 0 && (
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Strokes</p>
              <p className="font-mono font-medium">{strokes.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="font-mono font-medium">
                {strokes.reduce((sum, s) => sum + s.points.length, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-mono font-medium">
                {strokes.length > 0 
                  ? ((strokes[strokes.length - 1].endTime - strokes[0].startTime) / 1000).toFixed(1) + 's'
                  : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pen Lifts</p>
              <p className="font-mono font-medium">{Math.max(0, strokes.length - 1)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
