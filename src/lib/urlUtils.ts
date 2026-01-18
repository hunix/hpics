/**
 * URL Utility functions for handling Supabase signed URLs
 */

/**
 * Check if a Supabase signed URL is expired or about to expire
 * @param url The signed URL to check
 * @param bufferSeconds Buffer time before expiration to consider expired (default 5 minutes)
 */
export function isSignedUrlExpired(url: string, bufferSeconds = 300): boolean {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    if (!token) return false; // Not a signed URL
    
    // Decode JWT payload (base64url format)
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return false;
    
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!payload.exp) return false;
    
    const expTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    return now > (expTime - bufferSeconds * 1000);
  } catch {
    // If we can't parse, assume it might be expired to be safe
    return true;
  }
}

/**
 * Determine if a URL needs refresh (expired signed URL or no URL)
 * @param url The URL to check
 */
export function urlNeedsRefresh(url: string | null | undefined): boolean {
  if (!url) return true;
  
  // Check if it's a signed URL (contains /object/sign/ in path)
  if (url.includes('/object/sign/')) {
    return isSignedUrlExpired(url);
  }
  
  // Public URLs don't expire
  return false;
}
