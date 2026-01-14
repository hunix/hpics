/**
 * Local Speaker Identification
 * 
 * On-device speaker recognition using audio features:
 * - MFCC (Mel-Frequency Cepstral Coefficients) extraction
 * - Voice activity detection
 * - Speaker embedding generation
 * - Real-time speaker diarization
 */

export interface AudioFrame {
  samples: Float32Array;
  sampleRate: number;
  timestamp: number;
}

export interface VoiceFeatures {
  mfcc: number[]; // 13 coefficients
  pitch: number;
  energy: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  spectralRolloff: number;
  harmonicRatio: number;
}

export interface SpeakerEmbedding {
  vector: number[];
  voiceFeatures: VoiceFeatures;
  duration: number;
  quality: number;
}

export interface SpeakerSegment {
  speakerId: string;
  startTime: number;
  endTime: number;
  confidence: number;
  embedding?: SpeakerEmbedding;
}

export interface SpeakerProfile {
  id: string;
  name?: string;
  embeddings: SpeakerEmbedding[];
  averageEmbedding: number[];
  sampleCount: number;
  totalDuration: number;
  lastUpdated: number;
}

export interface DiarizationResult {
  segments: SpeakerSegment[];
  speakers: Map<string, { duration: number; segmentCount: number }>;
  totalDuration: number;
}

class LocalSpeakerIdentifier {
  private readonly EMBEDDING_SIZE = 64;
  private readonly MIN_SEGMENT_DURATION = 500; // ms
  private readonly SIMILARITY_THRESHOLD = 0.75;
  private readonly FFT_SIZE = 2048;
  private readonly HOP_SIZE = 512;
  private readonly MEL_BANDS = 40;
  private readonly MFCC_COUNT = 13;

  private enrolledSpeakers: Map<string, SpeakerProfile> = new Map();
  private audioContext: AudioContext | null = null;

  /**
   * Initialize audio context
   */
  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Extract voice features from audio samples
   */
  extractFeatures(samples: Float32Array, sampleRate: number): VoiceFeatures {
    // Energy
    const energy = samples.reduce((sum, s) => sum + s * s, 0) / samples.length;

    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) ||
          (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / samples.length;

    // Simple pitch estimation using autocorrelation
    const pitch = this.estimatePitch(samples, sampleRate);

    // Spectral features
    const spectrum = this.computeSpectrum(samples);
    const spectralCentroid = this.computeSpectralCentroid(spectrum, sampleRate);
    const spectralRolloff = this.computeSpectralRolloff(spectrum);
    const harmonicRatio = this.estimateHarmonicRatio(spectrum);

    // MFCC
    const mfcc = this.computeMFCC(samples, sampleRate);

    return {
      mfcc,
      pitch,
      energy,
      zeroCrossingRate,
      spectralCentroid,
      spectralRolloff,
      harmonicRatio,
    };
  }

  /**
   * Estimate pitch using autocorrelation
   */
  private estimatePitch(samples: Float32Array, sampleRate: number): number {
    const minLag = Math.floor(sampleRate / 500); // Max 500 Hz
    const maxLag = Math.floor(sampleRate / 50);  // Min 50 Hz

    let maxCorrelation = 0;
    let bestLag = 0;

    for (let lag = minLag; lag < Math.min(maxLag, samples.length / 2); lag++) {
      let correlation = 0;
      for (let i = 0; i < samples.length - lag; i++) {
        correlation += samples[i] * samples[i + lag];
      }
      correlation /= (samples.length - lag);

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }

    return bestLag > 0 ? sampleRate / bestLag : 0;
  }

  /**
   * Compute power spectrum using FFT approximation
   */
  private computeSpectrum(samples: Float32Array): Float32Array {
    const fftSize = Math.min(this.FFT_SIZE, samples.length);
    const spectrum = new Float32Array(fftSize / 2);

    // Simple DFT for small windows (approximation)
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < fftSize; n++) {
        const sample = n < samples.length ? samples[n] : 0;
        const angle = -2 * Math.PI * k * n / fftSize;
        real += sample * Math.cos(angle);
        imag += sample * Math.sin(angle);
      }
      
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
  }

  /**
   * Compute spectral centroid
   */
  private computeSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
    let weightedSum = 0;
    let totalMagnitude = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (spectrum.length * 2);
      weightedSum += frequency * spectrum[i];
      totalMagnitude += spectrum[i];
    }

    return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  }

  /**
   * Compute spectral rolloff (frequency below which 85% of energy is contained)
   */
  private computeSpectralRolloff(spectrum: Float32Array): number {
    const totalEnergy = spectrum.reduce((sum, s) => sum + s * s, 0);
    const threshold = totalEnergy * 0.85;

    let cumulativeEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i] * spectrum[i];
      if (cumulativeEnergy >= threshold) {
        return i / spectrum.length;
      }
    }

    return 1;
  }

  /**
   * Estimate harmonic-to-noise ratio
   */
  private estimateHarmonicRatio(spectrum: Float32Array): number {
    // Simple estimation based on peak-to-average ratio
    const avgMagnitude = spectrum.reduce((sum, s) => sum + s, 0) / spectrum.length;
    const maxMagnitude = Math.max(...spectrum);

    return avgMagnitude > 0 ? Math.min(1, maxMagnitude / (avgMagnitude * 5)) : 0;
  }

  /**
   * Compute MFCC (simplified implementation)
   */
  private computeMFCC(samples: Float32Array, sampleRate: number): number[] {
    const spectrum = this.computeSpectrum(samples);
    const melSpectrum = this.applyMelFilterbank(spectrum, sampleRate);
    
    // Apply log
    const logMelSpectrum = melSpectrum.map(v => Math.log(Math.max(v, 1e-10)));
    
    // DCT to get MFCC
    const mfcc: number[] = [];
    for (let i = 0; i < this.MFCC_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < logMelSpectrum.length; j++) {
        sum += logMelSpectrum[j] * Math.cos((Math.PI * i * (j + 0.5)) / logMelSpectrum.length);
      }
      mfcc.push(sum);
    }

    return mfcc;
  }

  /**
   * Apply mel filterbank
   */
  private applyMelFilterbank(spectrum: Float32Array, sampleRate: number): number[] {
    const melSpectrum: number[] = [];
    const fMax = sampleRate / 2;
    
    // Convert to mel scale
    const melMin = this.hzToMel(0);
    const melMax = this.hzToMel(fMax);
    
    for (let i = 0; i < this.MEL_BANDS; i++) {
      const melCenter = melMin + (melMax - melMin) * (i + 1) / (this.MEL_BANDS + 1);
      const melLow = melMin + (melMax - melMin) * i / (this.MEL_BANDS + 1);
      const melHigh = melMin + (melMax - melMin) * (i + 2) / (this.MEL_BANDS + 1);
      
      const fCenter = this.melToHz(melCenter);
      const fLow = this.melToHz(melLow);
      const fHigh = this.melToHz(melHigh);
      
      let sum = 0;
      for (let j = 0; j < spectrum.length; j++) {
        const freq = (j * fMax) / spectrum.length;
        let weight = 0;
        
        if (freq >= fLow && freq <= fCenter) {
          weight = (freq - fLow) / (fCenter - fLow);
        } else if (freq >= fCenter && freq <= fHigh) {
          weight = (fHigh - freq) / (fHigh - fCenter);
        }
        
        sum += spectrum[j] * weight;
      }
      
      melSpectrum.push(sum);
    }

    return melSpectrum;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * Generate speaker embedding from features
   */
  generateEmbedding(features: VoiceFeatures, samples: Float32Array, sampleRate: number): SpeakerEmbedding {
    // Combine features into embedding vector
    const vector: number[] = [
      ...features.mfcc.map(m => m / 100), // Normalize MFCC
      features.pitch / 500, // Normalize pitch
      Math.sqrt(features.energy) * 10,
      features.zeroCrossingRate * 10,
      features.spectralCentroid / 5000,
      features.spectralRolloff,
      features.harmonicRatio,
    ];

    // Pad or truncate to fixed size
    while (vector.length < this.EMBEDDING_SIZE) {
      vector.push(0);
    }

    const duration = samples.length / sampleRate * 1000;
    const quality = this.assessQuality(features, samples);

    return {
      vector: vector.slice(0, this.EMBEDDING_SIZE),
      voiceFeatures: features,
      duration,
      quality,
    };
  }

  /**
   * Assess quality of voice sample
   */
  private assessQuality(features: VoiceFeatures, samples: Float32Array): number {
    // Energy check (not too quiet, not clipping)
    const energyScore = features.energy > 0.001 && features.energy < 0.5 ? 1 : 0.5;
    
    // Pitch validity
    const pitchScore = features.pitch > 50 && features.pitch < 400 ? 1 : 0.3;
    
    // Duration check
    const durationScore = samples.length > 4000 ? 1 : samples.length / 4000;
    
    // Harmonic content
    const harmonicScore = features.harmonicRatio;

    return (energyScore + pitchScore + durationScore + harmonicScore) / 4;
  }

  /**
   * Enroll a new speaker
   */
  enrollSpeaker(id: string, embeddings: SpeakerEmbedding[], name?: string): SpeakerProfile {
    const avgEmbedding = this.averageEmbeddings(embeddings.map(e => e.vector));
    const totalDuration = embeddings.reduce((sum, e) => sum + e.duration, 0);

    const profile: SpeakerProfile = {
      id,
      name,
      embeddings,
      averageEmbedding: avgEmbedding,
      sampleCount: embeddings.length,
      totalDuration,
      lastUpdated: Date.now(),
    };

    this.enrolledSpeakers.set(id, profile);
    return profile;
  }

  /**
   * Update speaker profile with new samples
   */
  updateSpeaker(id: string, newEmbeddings: SpeakerEmbedding[]): SpeakerProfile | null {
    const existing = this.enrolledSpeakers.get(id);
    if (!existing) return null;

    const allEmbeddings = [...existing.embeddings, ...newEmbeddings];
    const avgEmbedding = this.averageEmbeddings(allEmbeddings.map(e => e.vector));
    const totalDuration = allEmbeddings.reduce((sum, e) => sum + e.duration, 0);

    const updated: SpeakerProfile = {
      ...existing,
      embeddings: allEmbeddings.slice(-20), // Keep last 20
      averageEmbedding: avgEmbedding,
      sampleCount: existing.sampleCount + newEmbeddings.length,
      totalDuration,
      lastUpdated: Date.now(),
    };

    this.enrolledSpeakers.set(id, updated);
    return updated;
  }

  /**
   * Identify speaker from embedding
   */
  identifySpeaker(embedding: SpeakerEmbedding): {
    speakerId: string | null;
    confidence: number;
    alternatives: { id: string; similarity: number }[];
  } {
    const similarities: { id: string; similarity: number }[] = [];

    for (const [id, profile] of this.enrolledSpeakers) {
      const similarity = this.cosineSimilarity(embedding.vector, profile.averageEmbedding);
      similarities.push({ id, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);

    const best = similarities[0];
    const isMatch = best && best.similarity >= this.SIMILARITY_THRESHOLD;

    return {
      speakerId: isMatch ? best.id : null,
      confidence: best ? best.similarity * embedding.quality : 0,
      alternatives: similarities.slice(0, 3),
    };
  }

  /**
   * Perform speaker diarization on audio
   */
  async diarize(
    audioBuffer: AudioBuffer,
    options?: { minSpeakers?: number; maxSpeakers?: number }
  ): Promise<DiarizationResult> {
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const segments: SpeakerSegment[] = [];
    const speakerEmbeddings: Map<string, number[][]> = new Map();
    
    const windowSize = Math.floor(sampleRate * 2); // 2 second windows
    const hopSize = Math.floor(sampleRate * 0.5);  // 0.5 second hop
    
    let nextSpeakerId = 0;

    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
      const windowSamples = samples.slice(i, i + windowSize);
      const features = this.extractFeatures(new Float32Array(windowSamples), sampleRate);
      
      // Skip silence
      if (features.energy < 0.001) continue;
      
      const embedding = this.generateEmbedding(features, new Float32Array(windowSamples), sampleRate);
      
      // Find matching speaker or create new
      let matchedSpeaker: string | null = null;
      let maxSimilarity = 0;
      
      for (const [speakerId, embeddings] of speakerEmbeddings) {
        const avgEmb = this.averageEmbeddings(embeddings);
        const similarity = this.cosineSimilarity(embedding.vector, avgEmb);
        
        if (similarity > maxSimilarity && similarity >= this.SIMILARITY_THRESHOLD) {
          maxSimilarity = similarity;
          matchedSpeaker = speakerId;
        }
      }
      
      if (!matchedSpeaker) {
        matchedSpeaker = `speaker_${nextSpeakerId++}`;
        speakerEmbeddings.set(matchedSpeaker, []);
      }
      
      speakerEmbeddings.get(matchedSpeaker)!.push(embedding.vector);
      
      const startTime = (i / sampleRate) * 1000;
      const endTime = ((i + windowSize) / sampleRate) * 1000;
      
      // Merge with previous segment if same speaker
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.speakerId === matchedSpeaker && 
          startTime - lastSegment.endTime < 1000) {
        lastSegment.endTime = endTime;
        lastSegment.confidence = (lastSegment.confidence + maxSimilarity) / 2;
      } else {
        segments.push({
          speakerId: matchedSpeaker,
          startTime,
          endTime,
          confidence: maxSimilarity || 0.5,
          embedding,
        });
      }
    }

    // Calculate speaker statistics
    const speakers = new Map<string, { duration: number; segmentCount: number }>();
    for (const segment of segments) {
      const existing = speakers.get(segment.speakerId) || { duration: 0, segmentCount: 0 };
      existing.duration += segment.endTime - segment.startTime;
      existing.segmentCount++;
      speakers.set(segment.speakerId, existing);
    }

    return {
      segments,
      speakers,
      totalDuration: audioBuffer.duration * 1000,
    };
  }

  /**
   * Average multiple embeddings
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return new Array(this.EMBEDDING_SIZE).fill(0);

    const avg = new Array(this.EMBEDDING_SIZE).fill(0);
    for (const emb of embeddings) {
      for (let i = 0; i < Math.min(emb.length, this.EMBEDDING_SIZE); i++) {
        avg[i] += emb[i];
      }
    }
    
    return avg.map(v => v / embeddings.length);
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dot = 0, norm1 = 0, norm2 = 0;
    const len = Math.min(v1.length, v2.length);
    
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get all enrolled speakers
   */
  getEnrolledSpeakers(): SpeakerProfile[] {
    return Array.from(this.enrolledSpeakers.values());
  }

  /**
   * Remove a speaker
   */
  removeSpeaker(id: string): boolean {
    return this.enrolledSpeakers.delete(id);
  }

  /**
   * Clear all speakers
   */
  clearSpeakers(): void {
    this.enrolledSpeakers.clear();
  }

  /**
   * Export speaker profiles for storage
   */
  exportProfiles(): string {
    const profiles = Array.from(this.enrolledSpeakers.entries());
    return JSON.stringify(profiles);
  }

  /**
   * Import speaker profiles
   */
  importProfiles(data: string): number {
    try {
      const profiles: [string, SpeakerProfile][] = JSON.parse(data);
      for (const [id, profile] of profiles) {
        this.enrolledSpeakers.set(id, profile);
      }
      return profiles.length;
    } catch {
      return 0;
    }
  }
}

export const localSpeakerIdentifier = new LocalSpeakerIdentifier();
