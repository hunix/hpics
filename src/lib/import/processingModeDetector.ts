/**
 * Detects device capabilities and recommends the optimal processing mode
 * for WhatsApp import (client-side vs server-side)
 */

export type ProcessingMode = 'client' | 'server';

export interface DeviceCapabilities {
  /** Device memory in GB (may be null on unsupported browsers) */
  memory: number | null;
  /** Number of logical CPU cores */
  cores: number;
  /** Network connection type (4g, 3g, slow-2g, etc.) */
  connectionType: string | null;
  /** Whether the device is a mobile device */
  isMobile: boolean;
  /** Estimated connection speed in Mbps (may be null) */
  connectionSpeed: number | null;
}

/**
 * Retrieves the current device's capabilities using browser APIs
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Device memory (in GB) - Chrome/Edge only
  const memory = 'deviceMemory' in navigator 
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null
    : null;

  // CPU cores
  const cores = navigator.hardwareConcurrency || 4;

  // Network info - Chrome/Edge only
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const connectionType = connection?.effectiveType || null;
  const connectionSpeed = connection?.downlink || null;

  return {
    memory,
    cores,
    connectionType,
    isMobile,
    connectionSpeed,
  };
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * File size thresholds for processing mode recommendation (in bytes)
 */
const THRESHOLDS = {
  /** Files smaller than this are always processed client-side */
  SMALL_FILE: 50 * 1024 * 1024, // 50MB
  /** Files larger than this are recommended for server-side */
  LARGE_FILE: 500 * 1024 * 1024, // 500MB
  /** Very large files strongly recommend server-side */
  VERY_LARGE_FILE: 1024 * 1024 * 1024, // 1GB
  /** Media count threshold for server recommendation */
  MANY_FILES: 500,
  /** Very many files strongly recommend server-side */
  VERY_MANY_FILES: 2000,
  /** Minimum memory (GB) for comfortable client-side processing */
  MIN_MEMORY_CLIENT: 4,
  /** Ideal memory (GB) for large file client-side processing */
  IDEAL_MEMORY_CLIENT: 8,
};

/**
 * Recommends the optimal processing mode based on file characteristics and device capabilities
 * 
 * @param fileSize - Size of the ZIP file in bytes
 * @param mediaCount - Estimated number of media files
 * @param capabilities - Device capabilities
 * @returns Recommended processing mode
 */
export function recommendProcessingMode(
  fileSize: number,
  mediaCount: number,
  capabilities: DeviceCapabilities
): ProcessingMode {
  // Score system: positive = client, negative = server
  let score = 0;

  // === File size analysis ===
  if (fileSize < THRESHOLDS.SMALL_FILE) {
    score += 3; // Small files: strongly prefer client
  } else if (fileSize < THRESHOLDS.LARGE_FILE) {
    score += 1; // Medium files: slight preference for client
  } else if (fileSize < THRESHOLDS.VERY_LARGE_FILE) {
    score -= 1; // Large files: slight preference for server
  } else {
    score -= 2; // Very large files: prefer server
  }

  // === Media count analysis ===
  if (mediaCount > THRESHOLDS.VERY_MANY_FILES) {
    score -= 2; // Many files: prefer server
  } else if (mediaCount > THRESHOLDS.MANY_FILES) {
    score -= 1; // Moderate files: slight preference for server
  }

  // === Device memory analysis ===
  if (capabilities.memory !== null) {
    if (capabilities.memory >= THRESHOLDS.IDEAL_MEMORY_CLIENT) {
      score += 2; // Good memory: prefer client
    } else if (capabilities.memory >= THRESHOLDS.MIN_MEMORY_CLIENT) {
      score += 1; // Adequate memory: slight preference for client
    } else {
      score -= 2; // Low memory: prefer server
    }
  }

  // === CPU cores analysis ===
  if (capabilities.cores >= 8) {
    score += 1; // Many cores: better for parallel processing
  } else if (capabilities.cores <= 2) {
    score -= 1; // Few cores: may struggle with processing
  }

  // === Mobile device penalty ===
  if (capabilities.isMobile) {
    score -= 1; // Mobile devices generally have less memory/power
  }

  // === Network connection analysis ===
  if (capabilities.connectionType) {
    if (capabilities.connectionType === '4g' || capabilities.connectionSpeed && capabilities.connectionSpeed >= 10) {
      // Fast connection: server upload is viable
      // No change to score
    } else if (capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
      score += 2; // Slow connection: prefer client to avoid long upload
    } else if (capabilities.connectionType === '3g') {
      score += 1; // Medium connection: slight preference for client
    }
  }

  // === Save data mode ===
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) {
    score += 2; // Data saver mode: prefer client to minimize data usage
  }

  // Return recommendation based on score
  return score >= 0 ? 'client' : 'server';
}

/**
 * Returns a human-readable explanation for why a particular mode is recommended
 */
export function getRecommendationReason(
  mode: ProcessingMode,
  fileSize: number,
  mediaCount: number,
  capabilities: DeviceCapabilities
): string {
  const reasons: string[] = [];

  if (mode === 'client') {
    if (capabilities.memory && capabilities.memory >= THRESHOLDS.IDEAL_MEMORY_CLIENT) {
      reasons.push(`Your device has ${capabilities.memory}GB RAM`);
    }
    if (fileSize < THRESHOLDS.LARGE_FILE) {
      reasons.push('File size is manageable');
    }
    if (capabilities.cores >= 4) {
      reasons.push(`${capabilities.cores} CPU cores available`);
    }
    if (capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
      reasons.push('Faster than uploading on slow connection');
    }
  } else {
    if (fileSize >= THRESHOLDS.LARGE_FILE) {
      reasons.push('Large file size');
    }
    if (mediaCount > THRESHOLDS.MANY_FILES) {
      reasons.push(`${mediaCount} media files to process`);
    }
    if (capabilities.memory && capabilities.memory < THRESHOLDS.MIN_MEMORY_CLIENT) {
      reasons.push(`Only ${capabilities.memory}GB RAM available`);
    }
    if (capabilities.isMobile) {
      reasons.push('Mobile device detected');
    }
  }

  return reasons.join(', ') || (mode === 'client' ? 'Good device capabilities' : 'Resource-intensive task');
}

/**
 * Estimates processing time based on file characteristics and mode
 * Returns time in seconds
 */
export function estimateProcessingTime(
  fileSize: number,
  mediaCount: number,
  mode: ProcessingMode,
  capabilities: DeviceCapabilities
): { min: number; max: number } {
  // Base times in seconds per MB for extraction
  const extractionTimePerMB = mode === 'client' ? 0.1 : 0.05; // Server is faster
  
  // Time per file for upload (approximate)
  const uploadTimePerFile = mode === 'server' ? 0.2 : 0.5; // Client uploads individually
  
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // Extraction time
  let extractionTime = fileSizeMB * extractionTimePerMB;
  
  // Adjust for device capabilities (client-side only)
  if (mode === 'client') {
    if (capabilities.memory && capabilities.memory < THRESHOLDS.MIN_MEMORY_CLIENT) {
      extractionTime *= 1.5; // Slower on low memory
    }
    if (capabilities.cores <= 2) {
      extractionTime *= 1.3; // Slower on few cores
    }
  }
  
  // Upload time estimate
  let uploadTime = mediaCount * uploadTimePerFile;
  
  // Adjust for connection speed
  if (capabilities.connectionSpeed) {
    const speedMultiplier = 10 / Math.max(1, capabilities.connectionSpeed);
    uploadTime *= Math.min(3, speedMultiplier);
  }
  
  // Server-side includes initial ZIP upload
  if (mode === 'server' && capabilities.connectionSpeed) {
    const zipUploadTime = fileSizeMB / (capabilities.connectionSpeed * 0.125); // Convert Mbps to MBps
    uploadTime += zipUploadTime;
  }
  
  const totalTime = extractionTime + uploadTime;
  
  // Return range (±30%)
  return {
    min: Math.round(totalTime * 0.7),
    max: Math.round(totalTime * 1.3),
  };
}

/**
 * Formats time estimate into human-readable string
 */
export function formatTimeEstimate(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `~${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `~${hours}h ${minutes}m`;
  }
}
