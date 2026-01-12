/**
 * Voice Biometrics Utilities
 * 
 * Client-side voice feature extraction for:
 * - Speaker identification
 * - Voice fingerprinting
 * - Audio quality analysis
 */

// Voice characteristics extracted from audio
export interface VoiceFeatures {
  // Fundamental frequency (pitch) statistics
  pitchMean: number;
  pitchStd: number;
  pitchMin: number;
  pitchMax: number;
  
  // Energy/loudness
  energyMean: number;
  energyStd: number;
  
  // Spectral features
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  
  // Temporal features
  zeroCrossingRate: number;
  speakingRate: number;
  
  // Quality metrics
  signalToNoiseRatio: number;
  clarity: number;
}

export interface VoiceFingerprint {
  features: VoiceFeatures;
  embedding: number[]; // Normalized feature vector for comparison
  sampleDuration: number;
  sampleRate: number;
  capturedAt: string;
}

export interface VoiceMatchResult {
  profileId: string;
  similarity: number;
  confidence: number;
}

/**
 * Extract voice features from an audio buffer
 */
export async function extractVoiceFeatures(
  audioBuffer: AudioBuffer
): Promise<VoiceFeatures> {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Frame parameters
  const frameSize = Math.round(sampleRate * 0.025); // 25ms frames
  const hopSize = Math.round(sampleRate * 0.010);   // 10ms hop
  
  const pitches: number[] = [];
  const energies: number[] = [];
  const spectralCentroids: number[] = [];
  const zeroCrossings: number[] = [];
  
  // Process frames
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    
    // Energy
    const energy = calculateEnergy(frame);
    energies.push(energy);
    
    // Only process if energy is above noise threshold
    if (energy > 0.001) {
      // Pitch estimation using autocorrelation
      const pitch = estimatePitch(frame, sampleRate);
      if (pitch > 50 && pitch < 500) { // Valid human voice range
        pitches.push(pitch);
      }
      
      // Spectral centroid
      const centroid = calculateSpectralCentroid(frame, sampleRate);
      spectralCentroids.push(centroid);
      
      // Zero crossing rate
      const zcr = calculateZeroCrossingRate(frame);
      zeroCrossings.push(zcr);
    }
  }
  
  // Calculate statistics
  const pitchMean = mean(pitches) || 150;
  const pitchStd = std(pitches) || 0;
  const energyMean = mean(energies);
  const energyStd = std(energies);
  
  // Spectral features
  const spectralCentroid = mean(spectralCentroids) || 2000;
  const spectralRolloff = calculateSpectralRolloff(channelData, sampleRate);
  const spectralFlatness = calculateSpectralFlatness(channelData);
  
  // Temporal features
  const zeroCrossingRate = mean(zeroCrossings);
  const speakingRate = estimateSpeakingRate(channelData, sampleRate);
  
  // Quality metrics
  const signalToNoiseRatio = estimateSNR(channelData);
  const clarity = calculateClarity(channelData);
  
  return {
    pitchMean,
    pitchStd,
    pitchMin: Math.min(...pitches) || pitchMean,
    pitchMax: Math.max(...pitches) || pitchMean,
    energyMean,
    energyStd,
    spectralCentroid,
    spectralRolloff,
    spectralFlatness,
    zeroCrossingRate,
    speakingRate,
    signalToNoiseRatio,
    clarity,
  };
}

/**
 * Create a voice fingerprint from features
 */
export function createVoiceFingerprint(
  features: VoiceFeatures,
  audioBuffer: AudioBuffer
): VoiceFingerprint {
  // Create normalized embedding vector
  const embedding = normalizeFeatures(features);
  
  return {
    features,
    embedding,
    sampleDuration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Compare two voice fingerprints
 */
export function compareVoiceFingerprints(
  fp1: VoiceFingerprint,
  fp2: VoiceFingerprint
): number {
  // Cosine similarity between embeddings
  return cosineSimilarity(fp1.embedding, fp2.embedding);
}

/**
 * Find best matching voice from enrolled profiles
 */
export function findBestVoiceMatch(
  fingerprint: VoiceFingerprint,
  enrolledFingerprints: { profileId: string; fingerprint: VoiceFingerprint }[],
  threshold: number = 0.75
): VoiceMatchResult | null {
  let bestMatch: VoiceMatchResult | null = null;
  let bestSimilarity = -1;
  
  for (const enrolled of enrolledFingerprints) {
    const similarity = compareVoiceFingerprints(fingerprint, enrolled.fingerprint);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = {
        profileId: enrolled.profileId,
        similarity,
        confidence: similarity, // Direct mapping for voice
      };
    }
  }
  
  return bestMatch && bestMatch.similarity >= threshold ? bestMatch : null;
}

/**
 * Average multiple fingerprints for enrollment
 */
export function averageFingerprints(fingerprints: VoiceFingerprint[]): VoiceFingerprint {
  if (fingerprints.length === 0) throw new Error('No fingerprints to average');
  if (fingerprints.length === 1) return fingerprints[0];
  
  // Average the embeddings
  const embeddingLength = fingerprints[0].embedding.length;
  const avgEmbedding = new Array(embeddingLength).fill(0);
  
  for (const fp of fingerprints) {
    for (let i = 0; i < embeddingLength; i++) {
      avgEmbedding[i] += fp.embedding[i];
    }
  }
  
  for (let i = 0; i < embeddingLength; i++) {
    avgEmbedding[i] /= fingerprints.length;
  }
  
  // Normalize
  const magnitude = Math.sqrt(avgEmbedding.reduce((sum, v) => sum + v * v, 0));
  for (let i = 0; i < embeddingLength; i++) {
    avgEmbedding[i] /= magnitude;
  }
  
  // Average the features
  const avgFeatures: VoiceFeatures = {
    pitchMean: mean(fingerprints.map(f => f.features.pitchMean)),
    pitchStd: mean(fingerprints.map(f => f.features.pitchStd)),
    pitchMin: Math.min(...fingerprints.map(f => f.features.pitchMin)),
    pitchMax: Math.max(...fingerprints.map(f => f.features.pitchMax)),
    energyMean: mean(fingerprints.map(f => f.features.energyMean)),
    energyStd: mean(fingerprints.map(f => f.features.energyStd)),
    spectralCentroid: mean(fingerprints.map(f => f.features.spectralCentroid)),
    spectralRolloff: mean(fingerprints.map(f => f.features.spectralRolloff)),
    spectralFlatness: mean(fingerprints.map(f => f.features.spectralFlatness)),
    zeroCrossingRate: mean(fingerprints.map(f => f.features.zeroCrossingRate)),
    speakingRate: mean(fingerprints.map(f => f.features.speakingRate)),
    signalToNoiseRatio: mean(fingerprints.map(f => f.features.signalToNoiseRatio)),
    clarity: mean(fingerprints.map(f => f.features.clarity)),
  };
  
  return {
    features: avgFeatures,
    embedding: avgEmbedding,
    sampleDuration: mean(fingerprints.map(f => f.sampleDuration)),
    sampleRate: fingerprints[0].sampleRate,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Serialize fingerprint for database storage
 */
export function serializeFingerprint(fingerprint: VoiceFingerprint): string {
  return JSON.stringify(fingerprint);
}

/**
 * Deserialize fingerprint from database
 */
export function deserializeFingerprint(serialized: string): VoiceFingerprint {
  return JSON.parse(serialized);
}

// Helper functions

function calculateEnergy(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    sum += frame[i] * frame[i];
  }
  return sum / frame.length;
}

function estimatePitch(frame: Float32Array, sampleRate: number): number {
  // Autocorrelation-based pitch estimation
  const minLag = Math.floor(sampleRate / 500); // Max 500Hz
  const maxLag = Math.floor(sampleRate / 50);  // Min 50Hz
  
  let maxCorr = 0;
  let bestLag = minLag;
  
  for (let lag = minLag; lag < maxLag && lag < frame.length; lag++) {
    let corr = 0;
    for (let i = 0; i < frame.length - lag; i++) {
      corr += frame[i] * frame[i + lag];
    }
    
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }
  
  return sampleRate / bestLag;
}

function calculateSpectralCentroid(frame: Float32Array, sampleRate: number): number {
  // Simple DFT-based spectral centroid
  const fftSize = frame.length;
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let k = 0; k < fftSize / 2; k++) {
    // Simple magnitude estimation
    let real = 0, imag = 0;
    for (let n = 0; n < fftSize; n++) {
      const angle = -2 * Math.PI * k * n / fftSize;
      real += frame[n] * Math.cos(angle);
      imag += frame[n] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imag * imag);
    const frequency = k * sampleRate / fftSize;
    
    weightedSum += magnitude * frequency;
    magnitudeSum += magnitude;
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function calculateZeroCrossingRate(frame: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < frame.length; i++) {
    if ((frame[i] >= 0 && frame[i - 1] < 0) || (frame[i] < 0 && frame[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / frame.length;
}

function calculateSpectralRolloff(samples: Float32Array, sampleRate: number): number {
  // 85th percentile frequency
  const energy = calculateEnergy(samples);
  let cumulativeEnergy = 0;
  const threshold = energy * 0.85 * samples.length;
  
  for (let i = 0; i < samples.length / 2; i++) {
    cumulativeEnergy += samples[i] * samples[i];
    if (cumulativeEnergy >= threshold) {
      return i * sampleRate / samples.length;
    }
  }
  
  return sampleRate / 2;
}

function calculateSpectralFlatness(samples: Float32Array): number {
  const absValues = Array.from(samples).map(Math.abs).filter(v => v > 0);
  if (absValues.length === 0) return 0;
  
  const geometricMean = Math.exp(mean(absValues.map(Math.log)));
  const arithmeticMean = mean(absValues);
  
  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

function estimateSpeakingRate(samples: Float32Array, sampleRate: number): number {
  // Estimate syllables per second based on energy envelope
  const frameSize = Math.round(sampleRate * 0.05); // 50ms frames
  const energies: number[] = [];
  
  for (let i = 0; i < samples.length - frameSize; i += frameSize) {
    const frame = samples.slice(i, i + frameSize);
    energies.push(calculateEnergy(frame));
  }
  
  // Count peaks (syllables)
  let peaks = 0;
  const threshold = mean(energies) * 0.5;
  
  for (let i = 1; i < energies.length - 1; i++) {
    if (energies[i] > threshold && 
        energies[i] > energies[i - 1] && 
        energies[i] > energies[i + 1]) {
      peaks++;
    }
  }
  
  const duration = samples.length / sampleRate;
  return peaks / duration;
}

function estimateSNR(samples: Float32Array): number {
  // Estimate signal-to-noise ratio
  const sorted = Array.from(samples).map(Math.abs).sort((a, b) => a - b);
  const noiseFloor = mean(sorted.slice(0, Math.floor(sorted.length * 0.1)));
  const signalPeak = mean(sorted.slice(Math.floor(sorted.length * 0.9)));
  
  if (noiseFloor <= 0) return 60; // Very clean signal
  return 20 * Math.log10(signalPeak / noiseFloor);
}

function calculateClarity(samples: Float32Array): number {
  // Higher values = cleaner audio
  const energy = calculateEnergy(samples);
  const zcr = calculateZeroCrossingRate(samples);
  
  // Balance between energy and zero crossing rate
  return Math.min(1, energy * 100) * (1 - Math.min(1, zcr * 2));
}

function normalizeFeatures(features: VoiceFeatures): number[] {
  // Create normalized feature vector
  const raw = [
    features.pitchMean / 300,      // Normalize to ~0-1
    features.pitchStd / 50,
    features.energyMean * 100,
    features.energyStd * 100,
    features.spectralCentroid / 4000,
    features.spectralRolloff / 8000,
    features.spectralFlatness,
    features.zeroCrossingRate * 10,
    features.speakingRate / 10,
    features.signalToNoiseRatio / 60,
    features.clarity,
  ];
  
  // L2 normalize
  const magnitude = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0));
  return raw.map(v => v / magnitude);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
