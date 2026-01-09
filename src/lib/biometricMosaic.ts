/**
 * Biometric Mosaic Builder
 * 
 * Efficiently processes multiple images in a single AI call by arranging them
 * in a mosaic grid. This reduces API costs by 96%+ compared to per-image calls.
 * 
 * Key features:
 * - Calculates optimal grid based on model specs
 * - Tracks cell positions for result mapping
 * - Optionally embeds prompts in unused canvas space
 */

// Model specs optimized for face detection in mosaics
export interface BiometricModelSpec {
  maxWidth: number;
  maxHeight: number;
  minCellWidth: number;      // Minimum cell size for face detection
  minCellHeight: number;
  faceMinSize: number;       // Minimum face pixels for reliable detection
  costPer1MTokens: number;   // For cost estimation
}

export const BIOMETRIC_MODEL_SPECS: Record<string, BiometricModelSpec> = {
  'google/gemini-2.5-flash-lite': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 192,
    minCellHeight: 192,
    faceMinSize: 64,
    costPer1MTokens: 0.075
  },
  'google/gemini-2.5-flash': {
    maxWidth: 3072,
    maxHeight: 3072,
    minCellWidth: 256,
    minCellHeight: 256,
    faceMinSize: 80,
    costPer1MTokens: 0.15
  },
  'google/gemini-3-flash-preview': {
    maxWidth: 4096,
    maxHeight: 4096,
    minCellWidth: 256,
    minCellHeight: 256,
    faceMinSize: 80,
    costPer1MTokens: 0.10
  },
  'google/gemini-2.5-pro': {
    maxWidth: 3072,
    maxHeight: 3072,
    minCellWidth: 256,
    minCellHeight: 256,
    faceMinSize: 80,
    costPer1MTokens: 1.25
  },
  'default': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 192,
    minCellHeight: 192,
    faceMinSize: 64,
    costPer1MTokens: 0.075
  }
};

export interface CellInfo {
  imageId: string;
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MosaicCanvas {
  dataUrl: string;
  cellMap: CellInfo[];
  dimensions: { width: number; height: number };
  gridCols: number;
  gridRows: number;
  cellSize: { width: number; height: number };
  imagesIncluded: number;
  batchIndex: number;
  promptSpace?: { x: number; y: number; width: number; height: number };
}

export interface MosaicCapacity {
  maxCells: number;
  gridCols: number;
  gridRows: number;
  cellSize: { width: number; height: number };
  canvasSize: { width: number; height: number };
}

export interface MosaicBatchPlan {
  totalMosaics: number;
  imagesPerMosaic: number;
  lastMosaicImages: number;
  estimatedCostCents: number;
  estimatedTokens: number;
  modelKey: string;
}

export interface ImageInput {
  id: string;
  url: string;
  blob?: Blob;
}

/**
 * Get model specifications for biometric analysis
 */
export function getBiometricModelSpec(modelKey: string): BiometricModelSpec {
  return BIOMETRIC_MODEL_SPECS[modelKey] || BIOMETRIC_MODEL_SPECS['default'];
}

/**
 * Calculate how many images can fit in one mosaic for a given model
 */
export function calculateMosaicCapacity(modelKey: string): MosaicCapacity {
  const spec = getBiometricModelSpec(modelKey);
  
  // Calculate grid dimensions
  const gridCols = Math.floor(spec.maxWidth / spec.minCellWidth);
  const gridRows = Math.floor(spec.maxHeight / spec.minCellHeight);
  const maxCells = gridCols * gridRows;
  
  // Calculate actual cell size (may be slightly larger than minimum)
  const cellWidth = Math.floor(spec.maxWidth / gridCols);
  const cellHeight = Math.floor(spec.maxHeight / gridRows);
  
  return {
    maxCells,
    gridCols,
    gridRows,
    cellSize: { width: cellWidth, height: cellHeight },
    canvasSize: { 
      width: gridCols * cellWidth, 
      height: gridRows * cellHeight 
    }
  };
}

/**
 * Plan how many mosaics are needed and estimate costs
 */
export function planMosaicBatches(
  totalImages: number,
  modelKey: string = 'google/gemini-2.5-flash-lite'
): MosaicBatchPlan {
  const capacity = calculateMosaicCapacity(modelKey);
  const spec = getBiometricModelSpec(modelKey);
  
  const totalMosaics = Math.ceil(totalImages / capacity.maxCells);
  const imagesPerMosaic = capacity.maxCells;
  const lastMosaicImages = totalImages % capacity.maxCells || capacity.maxCells;
  
  // Estimate tokens per mosaic (image + response)
  const tokensPerMosaic = 3000; // ~2500 for image, ~500 for response
  const estimatedTokens = totalMosaics * tokensPerMosaic;
  
  // Calculate cost in cents
  const estimatedCostCents = (estimatedTokens / 1_000_000) * spec.costPer1MTokens * 100;
  
  return {
    totalMosaics,
    imagesPerMosaic,
    lastMosaicImages,
    estimatedCostCents,
    estimatedTokens,
    modelKey
  };
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Build a single mosaic canvas from an array of images
 */
export async function buildMosaicCanvas(
  images: ImageInput[],
  modelKey: string = 'google/gemini-2.5-flash-lite',
  batchIndex: number = 0,
  includePromptInCanvas: boolean = false,
  promptText?: string,
  onCellProgress?: (completed: number, total: number) => void
): Promise<MosaicCanvas> {
  const capacity = calculateMosaicCapacity(modelKey);
  
  // Limit images to capacity
  const imagesToProcess = images.slice(0, capacity.maxCells);
  
  // Calculate actual grid needed (may be less than max if fewer images)
  const actualCells = imagesToProcess.length;
  const gridCols = capacity.gridCols;
  const gridRows = Math.ceil(actualCells / gridCols);
  
  const cellWidth = capacity.cellSize.width;
  const cellHeight = capacity.cellSize.height;
  const canvasWidth = gridCols * cellWidth;
  const canvasHeight = gridRows * cellHeight;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  // Fill with dark background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw grid lines for visual separation
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let col = 1; col < gridCols; col++) {
    ctx.beginPath();
    ctx.moveTo(col * cellWidth, 0);
    ctx.lineTo(col * cellWidth, canvasHeight);
    ctx.stroke();
  }
  for (let row = 1; row < gridRows; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellHeight);
    ctx.lineTo(canvasWidth, row * cellHeight);
    ctx.stroke();
  }
  
  // Build cell map and load images
  const cellMap: CellInfo[] = [];
  
  for (let i = 0; i < imagesToProcess.length; i++) {
    const image = imagesToProcess[i];
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const x = col * cellWidth;
    const y = row * cellHeight;
    
    cellMap.push({
      imageId: image.id,
      index: i,
      row,
      col,
      x,
      y,
      width: cellWidth,
      height: cellHeight
    });
    
    try {
      const img = await loadImage(image.url);
      
      // Calculate scaling to fit cell while maintaining aspect ratio
      const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = x + (cellWidth - scaledWidth) / 2;
      const offsetY = y + (cellHeight - scaledHeight) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Draw cell number for reference
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(String(i), x + 4, y + 16);
    } catch (error) {
      console.warn(`Failed to load image ${image.id}:`, error);
      // Draw placeholder for failed image
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('FAILED', x + 10, y + cellHeight / 2);
    }
    
    onCellProgress?.(i + 1, imagesToProcess.length);
  }
  
  // Calculate prompt space if there are empty cells
  let promptSpace: { x: number; y: number; width: number; height: number } | undefined;
  const emptyCells = (gridRows * gridCols) - actualCells;
  
  if (includePromptInCanvas && promptText && emptyCells > 0) {
    const lastCellIndex = actualCells;
    const promptCol = lastCellIndex % gridCols;
    const promptRow = Math.floor(lastCellIndex / gridCols);
    const promptX = promptCol * cellWidth;
    const promptY = promptRow * cellHeight;
    const promptWidth = (gridCols - promptCol) * cellWidth;
    const promptHeight = (gridRows - promptRow) * cellHeight;
    
    promptSpace = { x: promptX, y: promptY, width: promptWidth, height: promptHeight };
    
    // Draw prompt text in empty space
    ctx.fillStyle = '#222222';
    ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    
    // Word wrap the prompt text
    const maxWidth = promptWidth - 20;
    const lineHeight = 16;
    const words = promptText.split(' ');
    let line = '';
    let currentY = promptY + 20;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, promptX + 10, currentY);
        line = word + ' ';
        currentY += lineHeight;
        if (currentY > promptY + promptHeight - 10) break;
      } else {
        line = testLine;
      }
    }
    if (line && currentY <= promptY + promptHeight - 10) {
      ctx.fillText(line, promptX + 10, currentY);
    }
  }
  
  // Convert to data URL (JPEG for smaller size)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  
  return {
    dataUrl,
    cellMap,
    dimensions: { width: canvasWidth, height: canvasHeight },
    gridCols,
    gridRows,
    cellSize: { width: cellWidth, height: cellHeight },
    imagesIncluded: imagesToProcess.length,
    batchIndex,
    promptSpace
  };
}

/**
 * Build all mosaics for a batch of images
 */
export async function buildAllMosaics(
  images: ImageInput[],
  modelKey: string = 'google/gemini-2.5-flash-lite',
  onProgress?: (current: number, total: number, phase: 'building' | 'complete') => void
): Promise<MosaicCanvas[]> {
  const capacity = calculateMosaicCapacity(modelKey);
  const totalMosaics = Math.ceil(images.length / capacity.maxCells);
  const mosaics: MosaicCanvas[] = [];
  
  for (let i = 0; i < totalMosaics; i++) {
    const startIdx = i * capacity.maxCells;
    const batchImages = images.slice(startIdx, startIdx + capacity.maxCells);
    
    onProgress?.(i + 1, totalMosaics, 'building');
    
    const mosaic = await buildMosaicCanvas(batchImages, modelKey, i);
    mosaics.push(mosaic);
  }
  
  onProgress?.(totalMosaics, totalMosaics, 'complete');
  
  return mosaics;
}

/**
 * Get cost comparison between per-image and mosaic approaches
 */
export function getCostComparison(
  totalImages: number,
  modelKey: string = 'google/gemini-2.5-flash-lite'
): {
  perImageCostCents: number;
  mosaicCostCents: number;
  savingsPercent: number;
  savingsCents: number;
} {
  const spec = getBiometricModelSpec(modelKey);
  
  // Per-image approach: ~800 tokens per image
  const tokensPerImage = 800;
  const perImageCostCents = (totalImages * tokensPerImage / 1_000_000) * spec.costPer1MTokens * 100;
  
  // Mosaic approach: ~3000 tokens per mosaic
  const plan = planMosaicBatches(totalImages, modelKey);
  const mosaicCostCents = plan.estimatedCostCents;
  
  const savingsCents = perImageCostCents - mosaicCostCents;
  const savingsPercent = perImageCostCents > 0 ? (savingsCents / perImageCostCents) * 100 : 0;
  
  return {
    perImageCostCents,
    mosaicCostCents,
    savingsPercent,
    savingsCents
  };
}

/**
 * Format cost in dollars for display
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(4)}`;
}
