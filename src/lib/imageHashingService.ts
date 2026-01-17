// Perceptual Hash (pHash) implementation for image deduplication
// Uses average hash algorithm for simplicity and speed

export interface ImageHash {
  hash: string;
  url: string;
  mediaId: string;
}

export interface DeduplicationResult {
  unique: ImageHash[];
  duplicates: Map<string, ImageHash[]>; // hash -> duplicate items
  totalSaved: number;
}

/**
 * Calculate perceptual hash for an image URL
 * Uses a 16x16 grayscale average hash
 */
export async function calculateImageHash(url: string, mediaId: string): Promise<ImageHash | null> {
  try {
    const img = await loadImage(url);
    const hash = await computeAverageHash(img);
    return { hash, url, mediaId };
  } catch (error) {
    console.warn(`Failed to hash image ${mediaId}:`, error);
    return null;
  }
}

/**
 * Calculate hashes for multiple images in parallel
 */
export async function calculateImageHashes(
  items: Array<{ url: string; mediaId: string }>,
  onProgress?: (progress: number) => void
): Promise<ImageHash[]> {
  const results: ImageHash[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(item => calculateImageHash(item.url, item.mediaId))
    );
    
    for (const result of batchResults) {
      if (result) results.push(result);
    }

    onProgress?.(Math.round(((i + batch.length) / items.length) * 100));
  }

  return results;
}

/**
 * Find duplicates and group by hash
 */
export function findDuplicates(hashes: ImageHash[], threshold = 5): DeduplicationResult {
  const groups = new Map<string, ImageHash[]>();
  const unique: ImageHash[] = [];
  
  for (const item of hashes) {
    let foundMatch = false;
    
    // Check against existing groups
    for (const [existingHash, group] of groups.entries()) {
      if (hammingDistance(item.hash, existingHash) <= threshold) {
        group.push(item);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      groups.set(item.hash, [item]);
      unique.push(item);
    }
  }

  // Find groups with duplicates
  const duplicates = new Map<string, ImageHash[]>();
  for (const [hash, group] of groups.entries()) {
    if (group.length > 1) {
      duplicates.set(hash, group.slice(1)); // First is unique, rest are dupes
    }
  }

  const totalSaved = hashes.length - unique.length;

  return { unique, duplicates, totalSaved };
}

/**
 * Quick deduplication for a batch of images
 */
export async function deduplicateImages(
  items: Array<{ url: string; mediaId: string }>,
  onProgress?: (progress: number) => void
): Promise<{
  uniqueItems: Array<{ url: string; mediaId: string }>;
  duplicateGroups: Map<string, Array<{ url: string; mediaId: string }>>;
  savings: { count: number; percent: number };
}> {
  onProgress?.(0);
  
  const hashes = await calculateImageHashes(items, (p) => onProgress?.(p * 0.8));
  const result = findDuplicates(hashes);
  
  onProgress?.(100);

  const uniqueItems = result.unique.map(h => ({ url: h.url, mediaId: h.mediaId }));
  const duplicateGroups = new Map<string, Array<{ url: string; mediaId: string }>>();
  
  for (const [hash, dupes] of result.duplicates.entries()) {
    duplicateGroups.set(hash, dupes.map(h => ({ url: h.url, mediaId: h.mediaId })));
  }

  return {
    uniqueItems,
    duplicateGroups,
    savings: {
      count: result.totalSaved,
      percent: items.length > 0 ? Math.round((result.totalSaved / items.length) * 100) : 0,
    },
  };
}

// ============ Internal Functions ============

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    
    // Add timeout
    const timeout = setTimeout(() => {
      img.src = '';
      reject(new Error('Image load timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    
    img.src = url;
  });
}

async function computeAverageHash(img: HTMLImageElement): Promise<string> {
  const SIZE = 16;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  
  // Draw image scaled to 16x16
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const pixels = imageData.data;
  
  // Convert to grayscale
  const grayscale: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    // Luminosity method
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    grayscale.push(gray);
  }
  
  // Calculate average
  const avg = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;
  
  // Generate hash (1 if above average, 0 if below)
  let hash = '';
  for (const val of grayscale) {
    hash += val >= avg ? '1' : '0';
  }
  
  // Convert binary to hex
  return binaryToHex(hash);
}

function binaryToHex(binary: string): string {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    const chunk = binary.slice(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const n1 = parseInt(hash1[i], 16);
    const n2 = parseInt(hash2[i], 16);
    const xor = n1 ^ n2;
    // Count bits
    distance += xor.toString(2).replace(/0/g, '').length;
  }
  return distance;
}
