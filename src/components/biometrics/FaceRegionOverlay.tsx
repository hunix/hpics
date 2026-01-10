import React from 'react';
import { cn } from '@/lib/utils';
import { FaceRegion } from '@/hooks/useFaceRegions';
import { Badge } from '@/components/ui/badge';
import { User, Check, HelpCircle } from 'lucide-react';

interface FaceRegionOverlayProps {
  regions: FaceRegion[];
  containerWidth: number;
  containerHeight: number;
  showLabels?: boolean;
  showConfidence?: boolean;
  onRegionClick?: (region: FaceRegion) => void;
  selectedRegionId?: string | null;
  className?: string;
}

export function FaceRegionOverlay({
  regions,
  containerWidth,
  containerHeight,
  showLabels = true,
  showConfidence = false,
  onRegionClick,
  selectedRegionId,
  className,
}: FaceRegionOverlayProps) {
  if (regions.length === 0) return null;

  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {regions.map(region => {
        const x = region.x * containerWidth;
        const y = region.y * containerHeight;
        const w = region.width * containerWidth;
        const h = region.height * containerHeight;

        const isSelected = selectedRegionId === region.id;
        const isVerified = region.verified;
        const hasProfile = !!region.profile_id;

        // Color based on state
        let borderColor = 'border-blue-500';
        if (isSelected) borderColor = 'border-amber-500';
        else if (isVerified && hasProfile) borderColor = 'border-green-500';
        else if (hasProfile) borderColor = 'border-purple-500';

        return (
          <div
            key={region.id}
            className={cn(
              "absolute border-2 transition-all pointer-events-auto cursor-pointer",
              borderColor,
              region.shape === 'circle' && 'rounded-full',
              region.detection_method !== 'manual' && 'border-dashed',
              isSelected && 'ring-2 ring-amber-500 ring-offset-2'
            )}
            style={{
              left: x,
              top: y,
              width: w,
              height: h,
            }}
            onClick={() => onRegionClick?.(region)}
          >
            {/* Label */}
            {showLabels && (
              <div 
                className={cn(
                  "absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap",
                  hasProfile ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {hasProfile ? (
                  <>
                    <User className="h-3 w-3" />
                    {region.profile ? [region.profile.first_name, region.profile.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Unknown'}
                    {isVerified && <Check className="h-3 w-3 text-green-400" />}
                  </>
                ) : (
                  <>
                    <HelpCircle className="h-3 w-3" />
                    Unassigned
                  </>
                )}
              </div>
            )}

            {/* Confidence badge */}
            {showConfidence && region.confidence && (
              <Badge 
                variant="secondary" 
                className="absolute -bottom-5 left-0 text-xs"
              >
                {Math.round(region.confidence * 100)}%
              </Badge>
            )}

            {/* Detection method indicator */}
            {region.detection_method !== 'manual' && (
              <div 
                className="absolute -bottom-5 right-0 text-xs text-muted-foreground"
                title={`Detected by ${region.detection_method}`}
              >
                {region.detection_method === 'local_ai' ? '🤖 Local' : 
                 region.detection_method === 'cloud_ai' ? '☁️ Cloud' :
                 region.detection_method === 'mosaic' ? '🖼️ Mosaic' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simplified overlay for just showing boxes without interaction
interface SimpleFaceOverlayProps {
  regions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    verified?: boolean;
  }>;
  className?: string;
}

export function SimpleFaceOverlay({ regions, className }: SimpleFaceOverlayProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {regions.map((region, index) => (
        <div
          key={index}
          className={cn(
            "absolute border-2",
            region.verified ? 'border-green-500' : 'border-blue-500'
          )}
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.width * 100}%`,
            height: `${region.height * 100}%`,
          }}
        >
          {region.label && (
            <div className="absolute -top-5 left-0 px-1 py-0.5 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap">
              {region.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
