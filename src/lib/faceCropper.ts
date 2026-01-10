/**
 * Face Cropping Utility
 * Crops face regions from images and prepares them for storage
 */

export interface CropRegion {
  x: number;      // Normalized 0-1
  y: number;      // Normalized 0-1
  width: number;  // Normalized 0-1
  height: number; // Normalized 0-1
  shape: 'rectangle' | 'circle' | 'square';
}

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Crop a face region from an image
 * @param imageUrl URL of the source image
 * @param region Normalized coordinates (0-1) of the region to crop
 * @param outputSize Target size for the cropped face (default 256x256)
 * @param padding Additional padding around the face as percentage (default 0.2 = 20%)
 */
export async function cropFaceRegion(
  imageUrl: string,
  region: CropRegion,
  outputSize: number = 256,
  padding: number = 0.2
): Promise<CropResult> {
  const img = await loadImage(imageUrl);
  
  // Calculate actual pixel coordinates
  const srcX = region.x * img.naturalWidth;
  const srcY = region.y * img.naturalHeight;
  const srcW = region.width * img.naturalWidth;
  const srcH = region.height * img.naturalHeight;
  
  // Add padding
  const padX = srcW * padding;
  const padY = srcH * padding;
  
  const cropX = Math.max(0, srcX - padX);
  const cropY = Math.max(0, srcY - padY);
  const cropW = Math.min(img.naturalWidth - cropX, srcW + padX * 2);
  const cropH = Math.min(img.naturalHeight - cropY, srcH + padY * 2);
  
  // Create canvas for cropped face
  const canvas = document.createElement('canvas');
  
  if (region.shape === 'square' || region.shape === 'circle') {
    canvas.width = outputSize;
    canvas.height = outputSize;
  } else {
    // Maintain aspect ratio for rectangles
    const aspectRatio = cropW / cropH;
    if (aspectRatio > 1) {
      canvas.width = outputSize;
      canvas.height = Math.round(outputSize / aspectRatio);
    } else {
      canvas.height = outputSize;
      canvas.width = Math.round(outputSize * aspectRatio);
    }
  }
  
  const ctx = canvas.getContext('2d')!;
  
  // Apply circular mask if shape is circle
  if (region.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }
  
  // Draw cropped region
  ctx.drawImage(
    img,
    cropX, cropY, cropW, cropH,
    0, 0, canvas.width, canvas.height
  );
  
  // Convert to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
  });
  
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  
  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Crop multiple face regions from an image
 */
export async function cropMultipleFaces(
  imageUrl: string,
  regions: CropRegion[],
  outputSize: number = 256
): Promise<CropResult[]> {
  const results: CropResult[] = [];
  
  for (const region of regions) {
    const result = await cropFaceRegion(imageUrl, region, outputSize);
    results.push(result);
  }
  
  return results;
}

/**
 * Generate a unique filename for a cropped face
 */
export function generateCroppedFaceFilename(
  mediaId: string,
  regionIndex: number,
  profileId?: string
): string {
  const timestamp = Date.now();
  const profilePart = profileId ? `_${profileId.slice(0, 8)}` : '';
  return `face_${mediaId.slice(0, 8)}_${regionIndex}${profilePart}_${timestamp}.jpg`;
}

/**
 * Get storage path for a cropped face
 */
export function getCroppedFaceStoragePath(
  userId: string,
  filename: string
): string {
  return `${userId}/face-crops/${filename}`;
}
