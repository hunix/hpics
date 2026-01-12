import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  Camera, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnrollmentProgressProps {
  totalFrames: number;
  requiredFrames: number;
  angleCoverage: {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  };
  averageQuality: number;
  isRecording: boolean;
  className?: string;
}

export function EnrollmentProgress({
  totalFrames,
  requiredFrames,
  angleCoverage,
  averageQuality,
  isRecording,
  className
}: EnrollmentProgressProps) {
  const coveredAngles = Object.values(angleCoverage).filter(Boolean).length;
  const totalAngles = Object.keys(angleCoverage).length;
  const progress = (coveredAngles / totalAngles) * 100;
  
  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-500';
    if (quality >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getQualityLabel = (quality: number) => {
    if (quality >= 0.8) return 'Excellent';
    if (quality >= 0.6) return 'Good';
    if (quality >= 0.4) return 'Fair';
    return 'Poor';
  };
  
  return (
    <Card className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-medium">Enrollment Progress</span>
        </div>
        <Badge 
          variant={isRecording ? 'destructive' : progress === 100 ? 'default' : 'secondary'}
          className={cn(isRecording && 'animate-pulse')}
        >
          {isRecording ? 'Recording' : progress === 100 ? 'Complete' : 'Ready'}
        </Badge>
      </div>
      
      {/* Main progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Angle Coverage</span>
          <span className="font-medium">{coveredAngles}/{totalAngles}</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>
      
      {/* Angle checklist */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(angleCoverage).map(([angle, covered]) => (
          <div
            key={angle}
            className={cn(
              'flex flex-col items-center p-2 rounded-md border transition-colors',
              covered 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : 'bg-muted/50 border-transparent text-muted-foreground'
            )}
          >
            {covered ? (
              <CheckCircle2 className="w-5 h-5 mb-1" />
            ) : (
              <Circle className="w-5 h-5 mb-1" />
            )}
            <span className="text-xs capitalize">{angle}</span>
          </div>
        ))}
      </div>
      
      {/* Stats row */}
      <div className="flex justify-between items-center pt-2 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold">{totalFrames}</div>
          <div className="text-xs text-muted-foreground">Frames</div>
        </div>
        
        <div className="text-center">
          <div className={cn('text-2xl font-bold', getQualityColor(averageQuality))}>
            {Math.round(averageQuality * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Quality</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {coveredAngles >= 3 ? (
              <Sparkles className="w-6 h-6 inline" />
            ) : (
              <AlertTriangle className="w-6 h-6 inline text-yellow-500" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {coveredAngles >= 3 ? 'Ready' : 'Need More'}
          </div>
        </div>
      </div>
      
      {/* Quality indicator */}
      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
        <span>Average Quality:</span>
        <Badge 
          variant="outline" 
          className={cn(getQualityColor(averageQuality))}
        >
          {getQualityLabel(averageQuality)}
        </Badge>
      </div>
    </Card>
  );
}

interface EnrollmentFramePreviewProps {
  frames: Array<{
    imageData: string;
    angle: { yaw: number; pitch: number };
    quality: number;
    expression: string;
  }>;
  className?: string;
}

export function EnrollmentFramePreview({ frames, className }: EnrollmentFramePreviewProps) {
  const getAngleLabel = (yaw: number, pitch: number): string => {
    if (Math.abs(yaw) < 15 && Math.abs(pitch) < 15) return 'Front';
    if (yaw < -20) return 'Left';
    if (yaw > 20) return 'Right';
    if (pitch < -15) return 'Up';
    if (pitch > 15) return 'Down';
    return 'Front';
  };
  
  if (frames.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No frames captured yet</p>
        <p className="text-xs">Start recording to capture facial angles</p>
      </div>
    );
  }
  
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {frames.map((frame, idx) => (
        <div
          key={idx}
          className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500/50"
        >
          <img
            src={frame.imageData}
            alt={`Captured frame ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="flex justify-between items-end">
              <span className="text-xs text-white font-medium">
                {getAngleLabel(frame.angle.yaw, frame.angle.pitch)}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-[10px] py-0',
                  frame.quality >= 0.7 ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'
                )}
              >
                {Math.round(frame.quality * 100)}%
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
