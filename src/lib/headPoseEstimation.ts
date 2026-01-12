/**
 * Head Pose Estimation Utilities
 * 
 * Provides accurate head pose estimation using facial landmarks
 * for guiding video-based enrollment and real-time tracking.
 */

import * as faceapi from '@vladmandic/face-api';

export interface HeadPose {
  yaw: number;   // Left/right rotation (-90 to +90)
  pitch: number; // Up/down tilt (-45 to +45)
  roll: number;  // Side tilt (-30 to +30)
  confidence: number;
}

export interface PoseGuidance {
  angle: 'front' | 'left' | 'right' | 'up' | 'down';
  instruction: string;
  progress: number; // 0-1 how close to ideal angle
  isStable: boolean;
  deviation: number; // Degrees from ideal
}

export interface GuidanceResult {
  instruction: string;
  targetAngle: string;
  isAligned: boolean;
}

// Ideal angles for enrollment
const IDEAL_POSES: Record<string, { yaw: number; pitch: number }> = {
  front: { yaw: 0, pitch: 0 },
  left: { yaw: -35, pitch: 0 },
  right: { yaw: 35, pitch: 0 },
  up: { yaw: 0, pitch: -25 },
  down: { yaw: 0, pitch: 25 },
};

const ANGLE_TOLERANCE = 15; // Degrees

/**
 * Estimate head pose from 68 facial landmarks
 * Uses nose tip, eye corners, and mouth corners for estimation
 */
export function estimateHeadPose(
  landmarks: faceapi.FaceLandmarks68,
  imageWidth: number,
  imageHeight: number
): HeadPose {
  const positions = landmarks.positions;

  // Key facial landmarks (0-indexed)
  const noseTip = positions[30];      // Nose tip
  const noseBridge = positions[27];   // Top of nose bridge
  const leftEyeOuter = positions[36]; // Left eye outer corner
  const leftEyeInner = positions[39]; // Left eye inner corner
  const rightEyeInner = positions[42];// Right eye inner corner
  const rightEyeOuter = positions[45];// Right eye outer corner
  const leftMouth = positions[48];    // Left mouth corner
  const rightMouth = positions[54];   // Right mouth corner
  const chin = positions[8];          // Chin bottom

  // Calculate eye centers
  const leftEyeCenter = {
    x: (leftEyeOuter.x + leftEyeInner.x) / 2,
    y: (leftEyeOuter.y + leftEyeInner.y) / 2,
  };
  const rightEyeCenter = {
    x: (rightEyeOuter.x + rightEyeInner.x) / 2,
    y: (rightEyeOuter.y + rightEyeInner.y) / 2,
  };

  // Eye midpoint (between eyes)
  const eyeMidpoint = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
  };

  // Inter-ocular distance (for normalization)
  const eyeDistance = Math.sqrt(
    Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
    Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
  );

  // === Yaw Estimation (Left/Right Rotation) ===
  // Based on asymmetry of face - nose position relative to eyes
  const noseToEyeMidpointX = noseTip.x - eyeMidpoint.x;
  const normalizedYawOffset = noseToEyeMidpointX / eyeDistance;
  
  // Also consider eye width asymmetry
  const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
  const rightEyeWidth = Math.abs(rightEyeInner.x - rightEyeOuter.x);
  const eyeWidthRatio = (leftEyeWidth - rightEyeWidth) / (leftEyeWidth + rightEyeWidth);
  
  // Combine indicators for more robust yaw
  const yaw = normalizedYawOffset * 60 + eyeWidthRatio * 30;

  // === Pitch Estimation (Up/Down Tilt) ===
  // Based on vertical position of nose relative to eyes and mouth
  const mouthCenter = {
    x: (leftMouth.x + rightMouth.x) / 2,
    y: (leftMouth.y + rightMouth.y) / 2,
  };
  
  const eyeToMouthDist = mouthCenter.y - eyeMidpoint.y;
  const eyeToNoseDist = noseTip.y - eyeMidpoint.y;
  const noseRatio = eyeToNoseDist / eyeToMouthDist;
  
  // Normal ratio is around 0.5-0.6
  // Higher = looking up, Lower = looking down
  const normalNoseRatio = 0.55;
  const pitch = (normalNoseRatio - noseRatio) * 100;

  // === Roll Estimation (Head Tilt) ===
  // Based on eye line angle
  const eyeAngle = Math.atan2(
    rightEyeCenter.y - leftEyeCenter.y,
    rightEyeCenter.x - leftEyeCenter.x
  );
  const roll = (eyeAngle * 180) / Math.PI;

  // === Confidence ===
  // Based on face size and detection quality
  const faceHeight = chin.y - noseBridge.y;
  const normalizedFaceSize = faceHeight / imageHeight;
  const confidence = Math.min(1, normalizedFaceSize * 4);

  return {
    yaw: clamp(yaw, -90, 90),
    pitch: clamp(pitch, -45, 45),
    roll: clamp(roll, -30, 30),
    confidence,
  };
}

/**
 * Get guidance for achieving a target pose
 */
export function getAngleGuidance(
  pose: HeadPose,
  coverage: { front: boolean; left: boolean; right: boolean; up: boolean; down: boolean }
): GuidanceResult {
  // Determine which angles are still needed
  const needed: string[] = [];
  if (!coverage.front) needed.push('front');
  if (!coverage.left) needed.push('left');
  if (!coverage.right) needed.push('right');
  if (!coverage.up) needed.push('up');
  if (!coverage.down) needed.push('down');
  
  if (needed.length === 0) {
    return { instruction: 'All angles captured!', targetAngle: 'front', isAligned: true };
  }
  
  const target = needed[0];
  const instructions: Record<string, string> = {
    front: 'Look straight at the camera',
    left: 'Turn your head to the left',
    right: 'Turn your head to the right',
    up: 'Look slightly upward',
    down: 'Look slightly downward',
  };
  
  return {
    instruction: instructions[target] || 'Hold steady',
    targetAngle: target,
    isAligned: false,
  };
}

export function getGuidance(
  pose: HeadPose,
  targetYaw: number = 0,
  targetPitch: number = 0
): GuidanceResult {
  const yawDiff = Math.abs(pose.yaw - targetYaw);
  const pitchDiff = Math.abs(pose.pitch - targetPitch);
  const isAligned = yawDiff < 15 && pitchDiff < 15;
  
  let instruction = 'Hold steady';
  if (yawDiff > 15) {
    instruction = pose.yaw < targetYaw ? 'Turn right' : 'Turn left';
  } else if (pitchDiff > 15) {
    instruction = pose.pitch < targetPitch ? 'Look down' : 'Look up';
  }
  
  return {
    instruction,
    targetAngle: 'front',
    isAligned,
  };
}

/**
 * Get recommended next angle based on captured poses
 */
export function getNextRecommendedAngle(
  capturedAngles: Array<'front' | 'left' | 'right' | 'up' | 'down'>
): 'front' | 'left' | 'right' | 'up' | 'down' | null {
  const priority: Array<'front' | 'left' | 'right' | 'up' | 'down'> = [
    'front',
    'left',
    'right',
    'up',
    'down',
  ];
  
  for (const angle of priority) {
    if (!capturedAngles.includes(angle)) {
      return angle;
    }
  }
  
  return null;
}

/**
 * Categorize a pose into a discrete angle bucket
 */
export function categorizePose(pose: HeadPose): 'front' | 'left' | 'right' | 'up' | 'down' {
  const { yaw, pitch } = pose;

  // Check pitch first (up/down takes precedence)
  if (pitch < -20) return 'up';
  if (pitch > 20) return 'down';

  // Then check yaw
  if (yaw < -20) return 'left';
  if (yaw > 20) return 'right';

  return 'front';
}

/**
 * Check if pose matches target angle within tolerance
 */
export function isPoseMatch(
  pose: HeadPose,
  targetAngle: 'front' | 'left' | 'right' | 'up' | 'down',
  tolerance: number = ANGLE_TOLERANCE
): boolean {
  const ideal = IDEAL_POSES[targetAngle];
  const yawDiff = Math.abs(ideal.yaw - pose.yaw);
  const pitchDiff = Math.abs(ideal.pitch - pose.pitch);
  
  return yawDiff < tolerance && pitchDiff < tolerance;
}

/**
 * Smooth pose over time (reduce jitter)
 */
export class PoseSmoother {
  private history: HeadPose[] = [];
  private maxHistory = 5;

  add(pose: HeadPose): HeadPose {
    this.history.push(pose);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    return this.getSmoothed();
  }

  getSmoothed(): HeadPose {
    if (this.history.length === 0) {
      return { yaw: 0, pitch: 0, roll: 0, confidence: 0 };
    }

    const sum = this.history.reduce(
      (acc, p) => ({
        yaw: acc.yaw + p.yaw,
        pitch: acc.pitch + p.pitch,
        roll: acc.roll + p.roll,
        confidence: acc.confidence + p.confidence,
      }),
      { yaw: 0, pitch: 0, roll: 0, confidence: 0 }
    );

    return {
      yaw: sum.yaw / this.history.length,
      pitch: sum.pitch / this.history.length,
      roll: sum.roll / this.history.length,
      confidence: sum.confidence / this.history.length,
    };
  }

  reset(): void {
    this.history = [];
  }
}

/**
 * Detect if head is moving (for stability check)
 */
export class MotionDetector {
  private lastPose: HeadPose | null = null;
  private stableFrames = 0;
  private requiredStableFrames = 5;
  private motionThreshold = 3; // Degrees

  update(pose: HeadPose): { isStable: boolean; motion: number } {
    if (!this.lastPose) {
      this.lastPose = pose;
      return { isStable: false, motion: 0 };
    }

    const motion = Math.sqrt(
      Math.pow(pose.yaw - this.lastPose.yaw, 2) +
      Math.pow(pose.pitch - this.lastPose.pitch, 2) +
      Math.pow(pose.roll - this.lastPose.roll, 2)
    );

    if (motion < this.motionThreshold) {
      this.stableFrames++;
    } else {
      this.stableFrames = 0;
    }

    this.lastPose = pose;

    return {
      isStable: this.stableFrames >= this.requiredStableFrames,
      motion,
    };
  }

  reset(): void {
    this.lastPose = null;
    this.stableFrames = 0;
  }
}

// Utility
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
