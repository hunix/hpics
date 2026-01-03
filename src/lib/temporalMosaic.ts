// Temporal Mosaic Algorithm
// Extracts frames from video and stacks them into a single optimized image for AI analysis

export interface AIModelImageSpec {
  maxWidth: number;
  maxHeight: number;
  minCellWidth: number;  // Minimum size for accurate analysis
  minCellHeight: number;
}

// AI Model image specifications - these define max input and min accurate cell sizes
export const AI_MODEL_SPECS: Record<string, AIModelImageSpec> = {
  'google/gemini-2.5-pro': {
    maxWidth: 3072,
    maxHeight: 3072,
    minCellWidth: 256,
    minCellHeight: 256,
  },
  'google/gemini-2.5-flash': {
    maxWidth: 3072,
    maxHeight: 3072,
    minCellWidth: 256,
    minCellHeight: 256,
  },
  'google/gemini-2.5-flash-lite': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 192,
    minCellHeight: 192,
  },
  'openai/gpt-5': {
    maxWidth: 4096,
    maxHeight: 4096,
    minCellWidth: 256,
    minCellHeight: 256,
  },
  'openai/gpt-5-mini': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 192,
    minCellHeight: 192,
  },
  'openai/gpt-5-nano': {
    maxWidth: 1024,
    maxHeight: 1024,
    minCellWidth: 128,
    minCellHeight: 128,
  },
  // Default fallback
  'default': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 256,
    minCellHeight: 256,
  },
};

export interface MosaicConfig {
  videoElement: HTMLVideoElement;
  modelKey: string;
  fps?: number; // Source video FPS, will be auto-detected if possible
  targetFps?: number; // Frames to extract per second (default: 1)
}

export interface MosaicResult {
  imageDataUrl: string;
  frameCount: number;
  gridCols: number;
  gridRows: number;
  cellWidth: number;
  cellHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  videoDuration: number;
  framesPerSecond: number;
}

export interface MosaicCalculation {
  frameCount: number;
  gridCols: number;
  gridRows: number;
  cellWidth: number;
  cellHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Get AI model image specifications
 */
export function getModelSpec(modelKey: string): AIModelImageSpec {
  return AI_MODEL_SPECS[modelKey] || AI_MODEL_SPECS['default'];
}

/**
 * Calculate optimal mosaic grid configuration
 */
export function calculateMosaicGrid(
  videoDuration: number,
  videoWidth: number,
  videoHeight: number,
  modelKey: string,
  targetFps: number = 1
): MosaicCalculation {
  const spec = getModelSpec(modelKey);
  
  // Calculate total frames to extract
  const totalFrames = Math.ceil(videoDuration * targetFps);
  
  // Calculate aspect ratio of video
  const aspectRatio = videoWidth / videoHeight;
  
  // Calculate how many cells can fit in the max canvas
  const maxCellsWide = Math.floor(spec.maxWidth / spec.minCellWidth);
  const maxCellsTall = Math.floor(spec.maxHeight / spec.minCellHeight);
  const maxCells = maxCellsWide * maxCellsTall;
  
  // Limit frames to what can fit
  const frameCount = Math.min(totalFrames, maxCells);
  
  // Calculate optimal grid dimensions
  // Try to keep cells as large as possible while fitting all frames
  let bestCols = 1;
  let bestRows = frameCount;
  let bestCellWidth = spec.minCellWidth;
  let bestCellHeight = spec.minCellHeight;
  
  for (let cols = 1; cols <= Math.min(frameCount, maxCellsWide); cols++) {
    const rows = Math.ceil(frameCount / cols);
    if (rows > maxCellsTall) continue;
    
    // Calculate cell size that would fill canvas
    const cellWidth = Math.floor(spec.maxWidth / cols);
    const cellHeight = Math.floor(spec.maxHeight / rows);
    
    // Maintain aspect ratio of video
    let finalCellWidth = cellWidth;
    let finalCellHeight = Math.floor(cellWidth / aspectRatio);
    
    if (finalCellHeight > cellHeight) {
      finalCellHeight = cellHeight;
      finalCellWidth = Math.floor(cellHeight * aspectRatio);
    }
    
    // Ensure minimum size
    if (finalCellWidth >= spec.minCellWidth && finalCellHeight >= spec.minCellHeight) {
      // Check if this is a better configuration (larger cells)
      if (finalCellWidth * finalCellHeight > bestCellWidth * bestCellHeight) {
        bestCols = cols;
        bestRows = rows;
        bestCellWidth = finalCellWidth;
        bestCellHeight = finalCellHeight;
      }
    }
  }
  
  return {
    frameCount,
    gridCols: bestCols,
    gridRows: bestRows,
    cellWidth: bestCellWidth,
    cellHeight: bestCellHeight,
    canvasWidth: bestCols * bestCellWidth,
    canvasHeight: bestRows * bestCellHeight,
  };
}

/**
 * Extract a frame from video at specified time
 */
function extractFrame(
  video: HTMLVideoElement,
  time: number,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      ctx.drawImage(video, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/**
 * Generate temporal mosaic from video
 */
export async function generateTemporalMosaic(
  config: MosaicConfig,
  onProgress?: (progress: number) => void
): Promise<MosaicResult> {
  const { videoElement, modelKey, targetFps = 1 } = config;
  
  const duration = videoElement.duration;
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;
  
  if (!duration || !videoWidth || !videoHeight) {
    throw new Error('Video metadata not loaded');
  }
  
  // Calculate mosaic configuration
  const mosaicCalc = calculateMosaicGrid(duration, videoWidth, videoHeight, modelKey, targetFps);
  
  // Create canvas for final mosaic
  const canvas = document.createElement('canvas');
  canvas.width = mosaicCalc.canvasWidth;
  canvas.height = mosaicCalc.canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  // Fill with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate time intervals
  const interval = duration / mosaicCalc.frameCount;
  
  // Extract and place frames
  for (let i = 0; i < mosaicCalc.frameCount; i++) {
    const time = i * interval;
    const col = i % mosaicCalc.gridCols;
    const row = Math.floor(i / mosaicCalc.gridCols);
    const x = col * mosaicCalc.cellWidth;
    const y = row * mosaicCalc.cellHeight;
    
    try {
      const frameData = await extractFrame(
        videoElement,
        time,
        mosaicCalc.cellWidth,
        mosaicCalc.cellHeight
      );
      ctx.putImageData(frameData, x, y);
    } catch (error) {
      console.warn(`Failed to extract frame at ${time}s:`, error);
    }
    
    if (onProgress) {
      onProgress(((i + 1) / mosaicCalc.frameCount) * 100);
    }
  }
  
  // Convert to data URL
  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  
  return {
    imageDataUrl,
    frameCount: mosaicCalc.frameCount,
    gridCols: mosaicCalc.gridCols,
    gridRows: mosaicCalc.gridRows,
    cellWidth: mosaicCalc.cellWidth,
    cellHeight: mosaicCalc.cellHeight,
    canvasWidth: mosaicCalc.canvasWidth,
    canvasHeight: mosaicCalc.canvasHeight,
    videoDuration: duration,
    framesPerSecond: targetFps,
  };
}

/**
 * Get mosaic preview info without generating
 */
export function getMosaicPreviewInfo(
  videoDuration: number,
  videoWidth: number,
  videoHeight: number,
  modelKey: string,
  targetFps: number = 1
): MosaicCalculation & { 
  estimatedSizeKB: number;
  coverageSeconds: number;
} {
  const calc = calculateMosaicGrid(videoDuration, videoWidth, videoHeight, modelKey, targetFps);
  
  // Estimate JPEG size (rough calculation)
  const pixels = calc.canvasWidth * calc.canvasHeight;
  const estimatedSizeKB = Math.round(pixels * 0.15 / 1024); // ~0.15 bytes per pixel for JPEG
  
  // Calculate coverage
  const coverageSeconds = calc.frameCount / targetFps;
  
  return {
    ...calc,
    estimatedSizeKB,
    coverageSeconds,
  };
}
