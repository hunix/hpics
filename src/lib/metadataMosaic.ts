// Metadata Mosaic Algorithm
// Packs multiple images into a single optimized mosaic for comprehensive AI analysis
// Larger cells than biometric mosaic for detailed metadata extraction

export interface MetadataMosaicSpec {
  maxWidth: number;
  maxHeight: number;
  minCellWidth: number;
  minCellHeight: number;
  maxImages: number;
}

// Model specifications optimized for metadata extraction (larger cells than biometric)
export const METADATA_MODEL_SPECS: Record<string, MetadataMosaicSpec> = {
  'google/gemini-2.5-pro': {
    maxWidth: 4096,
    maxHeight: 4096,
    minCellWidth: 384,
    minCellHeight: 384,
    maxImages: 100, // 10x10 grid
  },
  'google/gemini-2.5-flash': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 320,
    minCellHeight: 320,
    maxImages: 36, // 6x6 grid - reduced to keep payload under edge function limits
  },
  'google/gemini-2.5-flash-lite': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 320,
    minCellHeight: 320,
    maxImages: 36, // 6x6 grid
  },
  'google/gemini-3-pro-preview': {
    maxWidth: 4096,
    maxHeight: 4096,
    minCellWidth: 384,
    minCellHeight: 384,
    maxImages: 100,
  },
  'openai/gpt-5': {
    maxWidth: 4096,
    maxHeight: 4096,
    minCellWidth: 384,
    minCellHeight: 384,
    maxImages: 100,
  },
  'openai/gpt-5-mini': {
    maxWidth: 2048,
    maxHeight: 2048,
    minCellWidth: 320,
    minCellHeight: 320,
    maxImages: 36,
  },
  'default': {
    maxWidth: 3072,
    maxHeight: 3072,
    minCellWidth: 384,
    minCellHeight: 384,
    maxImages: 64,
  },
};

export interface MediaItem {
  id: string;
  url: string;
  width?: number;
  height?: number;
  profileId?: string;
  mimeType?: string;
  bulkItemId?: string; // ID from bulk_analysis_items for direct updates
}

export interface MosaicCellInfo {
  index: number;
  mediaId: string;
  profileId?: string;
  bulkItemId?: string; // ID from bulk_analysis_items for direct updates
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

export interface MetadataMosaicResult {
  imageDataUrl: string;
  imageBlob: Blob;
  cells: MosaicCellInfo[];
  gridCols: number;
  gridRows: number;
  cellWidth: number;
  cellHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  imageCount: number;
  mosaicId: string;
}

export interface MetadataMosaicCalculation {
  imageCount: number;
  gridCols: number;
  gridRows: number;
  cellWidth: number;
  cellHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  estimatedSizeKB: number;
}

/**
 * Get model specifications for metadata mosaic
 */
export function getMetadataModelSpec(modelKey: string): MetadataMosaicSpec {
  return METADATA_MODEL_SPECS[modelKey] || METADATA_MODEL_SPECS['default'];
}

/**
 * Calculate optimal mosaic grid for a set of images
 */
export function calculateMetadataMosaicGrid(
  imageCount: number,
  modelKey: string
): MetadataMosaicCalculation {
  const spec = getMetadataModelSpec(modelKey);
  
  // Limit images to max supported
  const actualImageCount = Math.min(imageCount, spec.maxImages);
  
  // Calculate optimal grid dimensions (prefer square-ish grids)
  const gridCols = Math.ceil(Math.sqrt(actualImageCount));
  const gridRows = Math.ceil(actualImageCount / gridCols);
  
  // Calculate cell size to fill canvas optimally
  const cellWidth = Math.floor(spec.maxWidth / gridCols);
  const cellHeight = Math.floor(spec.maxHeight / gridRows);
  
  // Ensure minimum cell size
  const finalCellWidth = Math.max(cellWidth, spec.minCellWidth);
  const finalCellHeight = Math.max(cellHeight, spec.minCellHeight);
  
  // Recalculate grid if cells are at minimum size
  const finalCols = Math.min(gridCols, Math.floor(spec.maxWidth / finalCellWidth));
  const finalRows = Math.min(gridRows, Math.floor(spec.maxHeight / finalCellHeight));
  
  const canvasWidth = finalCols * finalCellWidth;
  const canvasHeight = finalRows * finalCellHeight;
  
  // Estimate JPEG size
  const pixels = canvasWidth * canvasHeight;
  const estimatedSizeKB = Math.round(pixels * 0.12 / 1024);
  
  return {
    imageCount: Math.min(actualImageCount, finalCols * finalRows),
    gridCols: finalCols,
    gridRows: finalRows,
    cellWidth: finalCellWidth,
    cellHeight: finalCellHeight,
    canvasWidth,
    canvasHeight,
    estimatedSizeKB,
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
    img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Generate metadata mosaic from a list of media items
 */
export async function generateMetadataMosaic(
  mediaItems: MediaItem[],
  modelKey: string,
  onProgress?: (progress: number, current: string) => void
): Promise<MetadataMosaicResult> {
  const calc = calculateMetadataMosaicGrid(mediaItems.length, modelKey);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = calc.canvasWidth;
  canvas.height = calc.canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  // Fill with dark background (helps with varied image backgrounds)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const cells: MosaicCellInfo[] = [];
  const itemsToProcess = mediaItems.slice(0, calc.imageCount);
  const mosaicId = crypto.randomUUID();
  
  // Track failed loads for early abort
  let failedLoads = 0;
  const MAX_FAILED_RATIO = 0.25; // If more than 25% fail, abort early
  
  // Load and place images
  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const col = i % calc.gridCols;
    const row = Math.floor(i / calc.gridCols);
    const x = col * calc.cellWidth;
    const y = row * calc.cellHeight;
    
    try {
      onProgress?.(((i + 1) / itemsToProcess.length) * 100, `Loading image ${i + 1}/${itemsToProcess.length}`);
      
      const img = await loadImage(item.url);
      
      // Calculate aspect-fit dimensions
      const imgAspect = img.width / img.height;
      const cellAspect = calc.cellWidth / calc.cellHeight;
      
      let drawWidth = calc.cellWidth;
      let drawHeight = calc.cellHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgAspect > cellAspect) {
        // Image is wider than cell
        drawHeight = calc.cellWidth / imgAspect;
        offsetY = (calc.cellHeight - drawHeight) / 2;
      } else {
        // Image is taller than cell
        drawWidth = calc.cellHeight * imgAspect;
        offsetX = (calc.cellWidth - drawWidth) / 2;
      }
      
      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
      
      // Add cell index label (top-left corner)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, 36, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x + 18, y + 12);
      
      cells.push({
        index: i,
        mediaId: item.id,
        profileId: item.profileId,
        bulkItemId: item.bulkItemId,
        x,
        y,
        width: calc.cellWidth,
        height: calc.cellHeight,
        row,
        col,
      });
    } catch (error) {
      failedLoads++;
      console.warn(`Failed to load image ${item.id} (${failedLoads}/${itemsToProcess.length}):`, error);
      
      // If more than 25% of images failed to load, abort early
      // This likely indicates expired URLs
      if (failedLoads / itemsToProcess.length > MAX_FAILED_RATIO) {
        throw new Error(`Too many images failed to load (${failedLoads}/${itemsToProcess.length}). URLs may be expired - will regenerate.`);
      }
      
      // Draw placeholder for failed image
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, calc.cellWidth, calc.cellHeight);
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Failed', x + calc.cellWidth / 2, y + calc.cellHeight / 2);
      
      cells.push({
        index: i,
        mediaId: item.id,
        profileId: item.profileId,
        bulkItemId: item.bulkItemId,
        x,
        y,
        width: calc.cellWidth,
        height: calc.cellHeight,
        row,
        col,
      });
    }
  }
  
  // Convert to data URL and blob with reduced quality to keep payload under edge function limits
  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.75);
  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      'image/jpeg',
      0.75
    );
  });
  
  return {
    imageDataUrl,
    imageBlob,
    cells,
    gridCols: calc.gridCols,
    gridRows: calc.gridRows,
    cellWidth: calc.cellWidth,
    cellHeight: calc.cellHeight,
    canvasWidth: calc.canvasWidth,
    canvasHeight: calc.canvasHeight,
    imageCount: cells.length,
    mosaicId,
  };
}

/**
 * Calculate cost savings from mosaic processing
 */
export function calculateMosaicSavings(
  imageCount: number,
  modelKey: string
): {
  individualCalls: number;
  mosaicCalls: number;
  savingsPercent: number;
  estimatedCostIndividual: number;
  estimatedCostMosaic: number;
} {
  const spec = getMetadataModelSpec(modelKey);
  const imagesPerMosaic = spec.maxImages;
  const mosaicCalls = Math.ceil(imageCount / imagesPerMosaic);
  
  // Cost estimates (per call, approximate)
  const costPerCall = modelKey.includes('flash-lite') ? 0.0003 :
                      modelKey.includes('flash') ? 0.001 :
                      modelKey.includes('pro') ? 0.003 : 0.001;
  
  const individualCost = imageCount * costPerCall;
  const mosaicCost = mosaicCalls * costPerCall * 1.5; // Mosaic calls are slightly more expensive
  
  return {
    individualCalls: imageCount,
    mosaicCalls,
    savingsPercent: Math.round((1 - mosaicCost / individualCost) * 100),
    estimatedCostIndividual: individualCost,
    estimatedCostMosaic: mosaicCost,
  };
}

/**
 * Get preview info for mosaic processing
 */
export function getMosaicPreviewInfo(
  imageCount: number,
  modelKey: string
): MetadataMosaicCalculation & {
  mosaicsRequired: number;
  totalApiCalls: number;
  savingsPercent: number;
} {
  const calc = calculateMetadataMosaicGrid(imageCount, modelKey);
  const spec = getMetadataModelSpec(modelKey);
  const imagesPerMosaic = Math.min(spec.maxImages, calc.gridCols * calc.gridRows);
  const mosaicsRequired = Math.ceil(imageCount / imagesPerMosaic);
  const savings = calculateMosaicSavings(imageCount, modelKey);
  
  return {
    ...calc,
    mosaicsRequired,
    totalApiCalls: mosaicsRequired,
    savingsPercent: savings.savingsPercent,
  };
}
