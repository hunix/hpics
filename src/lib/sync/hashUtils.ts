/**
 * Content hashing utilities for deduplication
 */

// Simple hash function for fingerprinting
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize content for consistent hashing
export function normalizeContent(content: string): string {
  return content
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

// Round timestamp to minute precision
export function roundToMinute(timestamp: Date | string): string {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.toISOString();
}

// Normalize sender identifier
export function normalizeSender(sender: string): string {
  return sender.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Create message fingerprint
export async function createMessageFingerprint(
  timestamp: Date | string,
  sender: string,
  content: string,
  mediaHash?: string
): Promise<string> {
  const timeKey = roundToMinute(timestamp);
  const senderKey = normalizeSender(sender);
  const contentKey = normalizeContent(content);
  const mediaKey = mediaHash || '';
  
  const composite = `${timeKey}|${senderKey}|${contentKey}|${mediaKey}`;
  return sha256(composite);
}

// Create content hash for quick comparison
export async function createContentHash(content: string): Promise<string> {
  const normalized = normalizeContent(content);
  return sha256(normalized);
}

// Create location fingerprint
export function createLocationFingerprint(
  latitude: number,
  longitude: number,
  timestamp: Date | string,
  precisionMeters: number = 50
): string {
  // Round coordinates to precision
  const latPrecision = precisionMeters / 111000; // ~111km per degree
  const lonPrecision = precisionMeters / (111000 * Math.cos(latitude * Math.PI / 180));
  
  const roundedLat = Math.round(latitude / latPrecision) * latPrecision;
  const roundedLon = Math.round(longitude / lonPrecision) * lonPrecision;
  const timeKey = roundToMinute(timestamp);
  
  return `${roundedLat.toFixed(6)}|${roundedLon.toFixed(6)}|${timeKey}`;
}

// Create social post fingerprint
export async function createSocialPostFingerprint(
  platform: string,
  postId: string,
  timestamp: Date | string
): Promise<string> {
  const composite = `${platform}|${postId}|${new Date(timestamp).toISOString()}`;
  return sha256(composite);
}

// Batch fingerprint generation
export async function batchCreateFingerprints(
  items: Array<{
    timestamp: Date | string;
    sender: string;
    content: string;
    mediaHash?: string;
  }>
): Promise<string[]> {
  return Promise.all(
    items.map(item => 
      createMessageFingerprint(
        item.timestamp,
        item.sender,
        item.content,
        item.mediaHash
      )
    )
  );
}
