import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface HeadPoseGuideProps {
  coverage: {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  };
  currentYaw: number;
  currentPitch: number;
  size?: number;
}

export function HeadPoseGuide({ 
  coverage, 
  currentYaw, 
  currentPitch, 
  size = 120 
}: HeadPoseGuideProps) {
  const center = size / 2;
  const radius = size / 2 - 10;
  
  // Calculate current indicator position
  const indicatorX = center + (currentYaw / 45) * (radius * 0.7);
  const indicatorY = center + (currentPitch / 30) * (radius * 0.7);
  
  // Position markers for each angle
  const markers = [
    { key: 'front', x: center, y: center, label: 'F' },
    { key: 'left', x: center - radius * 0.7, y: center, label: 'L' },
    { key: 'right', x: center + radius * 0.7, y: center, label: 'R' },
    { key: 'up', x: center, y: center - radius * 0.7, label: 'U' },
    { key: 'down', x: center, y: center + radius * 0.7, label: 'D' },
  ] as const;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-lg"
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="rgba(0,0,0,0.3)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      
      {/* Cross lines */}
      <line
        x1={center - radius}
        y1={center}
        x2={center + radius}
        y2={center}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <line
        x1={center}
        y1={center - radius}
        x2={center}
        y2={center + radius}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      
      {/* Angle markers */}
      {markers.map(({ key, x, y, label }) => {
        const isCovered = coverage[key];
        return (
          <g key={key}>
            <circle
              cx={x}
              cy={y}
              r={12}
              fill={isCovered ? 'rgba(34, 197, 94, 0.8)' : 'rgba(255,255,255,0.2)'}
              stroke={isCovered ? '#22c55e' : 'rgba(255,255,255,0.5)'}
              strokeWidth="2"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isCovered ? 'white' : 'rgba(255,255,255,0.7)'}
              fontSize="10"
              fontWeight="bold"
            >
              {label}
            </text>
            {isCovered && (
              <circle
                cx={x + 8}
                cy={y - 8}
                r={5}
                fill="#22c55e"
              />
            )}
          </g>
        );
      })}
      
      {/* Current position indicator */}
      <circle
        cx={indicatorX}
        cy={indicatorY}
        r={8}
        fill="rgba(59, 130, 246, 0.9)"
        stroke="white"
        strokeWidth="2"
        className="transition-all duration-100"
      />
      
      {/* Pulse animation for current position */}
      <circle
        cx={indicatorX}
        cy={indicatorY}
        r={8}
        fill="none"
        stroke="rgba(59, 130, 246, 0.5)"
        strokeWidth="2"
        className="animate-ping"
      />
    </svg>
  );
}

interface AngleCoverageListProps {
  coverage: {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  };
  className?: string;
}

export function AngleCoverageList({ coverage, className }: AngleCoverageListProps) {
  const angles = [
    { key: 'front', label: 'Front View' },
    { key: 'left', label: 'Left Profile' },
    { key: 'right', label: 'Right Profile' },
    { key: 'up', label: 'Looking Up' },
    { key: 'down', label: 'Looking Down' },
  ] as const;
  
  return (
    <div className={cn('space-y-1', className)}>
      {angles.map(({ key, label }) => (
        <div 
          key={key}
          className={cn(
            'flex items-center gap-2 text-sm px-2 py-1 rounded',
            coverage[key] 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-muted-foreground'
          )}
        >
          {coverage[key] ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
