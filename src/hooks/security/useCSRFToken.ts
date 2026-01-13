// CSRF Protection Hook
import { useState, useCallback, useEffect } from 'react';

const CSRF_STORAGE_KEY = 'csrf_token';
const CSRF_TIMESTAMP_KEY = 'csrf_token_timestamp';
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Generate secure random token
function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Check if token is expired
function isTokenExpired(): boolean {
  const timestamp = sessionStorage.getItem(CSRF_TIMESTAMP_KEY);
  if (!timestamp) return true;
  
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  return tokenAge > TOKEN_TTL_MS;
}

export function useCSRFToken() {
  const [token, setToken] = useState<string>(() => {
    // Try to get existing valid token
    const existingToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (existingToken && !isTokenExpired()) {
      return existingToken;
    }
    return '';
  });

  // Generate new token
  const generateNewToken = useCallback((): string => {
    const newToken = generateToken();
    sessionStorage.setItem(CSRF_STORAGE_KEY, newToken);
    sessionStorage.setItem(CSRF_TIMESTAMP_KEY, Date.now().toString());
    setToken(newToken);
    return newToken;
  }, []);

  // Validate token
  const validateToken = useCallback((inputToken: string): boolean => {
    if (!inputToken) return false;
    
    const storedToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (!storedToken) return false;
    
    if (isTokenExpired()) {
      // Token expired, clear it
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
      sessionStorage.removeItem(CSRF_TIMESTAMP_KEY);
      setToken('');
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    if (inputToken.length !== storedToken.length) return false;
    
    let result = 0;
    for (let i = 0; i < inputToken.length; i++) {
      result |= inputToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    return result === 0;
  }, []);

  // Refresh token
  const refreshToken = useCallback((): string => {
    return generateNewToken();
  }, [generateNewToken]);

  // Clear token
  const clearToken = useCallback(() => {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
    sessionStorage.removeItem(CSRF_TIMESTAMP_KEY);
    setToken('');
  }, []);

  // Get time until expiry
  const getTimeUntilExpiry = useCallback((): number => {
    const timestamp = sessionStorage.getItem(CSRF_TIMESTAMP_KEY);
    if (!timestamp) return 0;
    
    const expiryTime = parseInt(timestamp, 10) + TOKEN_TTL_MS;
    return Math.max(0, expiryTime - Date.now());
  }, []);

  // Auto-generate token if needed
  useEffect(() => {
    if (!token || isTokenExpired()) {
      generateNewToken();
    }
  }, [token, generateNewToken]);

  // Auto-refresh token before expiry
  useEffect(() => {
    const timeUntilExpiry = getTimeUntilExpiry();
    
    if (timeUntilExpiry > 0) {
      // Refresh 1 minute before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 60000);
      
      const timer = setTimeout(() => {
        generateNewToken();
      }, refreshTime);
      
      return () => clearTimeout(timer);
    }
  }, [token, generateNewToken, getTimeUntilExpiry]);

  return {
    token,
    generateToken: generateNewToken,
    validateToken,
    refreshToken,
    clearToken,
    getTimeUntilExpiry,
    isExpired: isTokenExpired,
  };
}

// CSRF token header helper
export function getCSRFHeader(): Record<string, string> {
  const token = sessionStorage.getItem(CSRF_STORAGE_KEY);
  return token ? { 'X-CSRF-Token': token } : {};
}

// Validate CSRF in request
export function withCSRFProtection<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  getToken: () => string
): T {
  return (async (...args: Parameters<T>) => {
    const token = getToken();
    if (!token) {
      throw new Error('CSRF token not available');
    }
    return fn(...args);
  }) as T;
}
