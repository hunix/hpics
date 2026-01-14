/**
 * Signature Biometric Analyzer
 * 
 * Captures and analyzes handwritten signature biometrics including:
 * - Stroke dynamics (pressure, velocity, acceleration)
 * - Temporal patterns (timing between strokes)
 * - Geometric features (loops, crossings, angles)
 * - Consistency scoring across samples
 */

export interface SignaturePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface StrokeSegment {
  points: SignaturePoint[];
  duration: number;
  length: number;
  averageVelocity: number;
  averagePressure: number;
  peakPressure: number;
  startAngle: number;
  endAngle: number;
  curvature: number[];
}

export interface SignatureDynamics {
  totalDuration: number;
  totalLength: number;
  strokeCount: number;
  averageVelocity: number;
  maxVelocity: number;
  velocityVariance: number;
  averagePressure: number;
  pressureVariance: number;
  penLiftCount: number;
  penLiftDurations: number[];
  accelerationProfile: number[];
  jerkProfile: number[]; // Rate of change of acceleration
}

export interface GeometricFeatures {
  boundingBox: { width: number; height: number; aspectRatio: number };
  centroid: { x: number; y: number };
  loops: number;
  crossings: number;
  totalAngleChange: number;
  dominantAngles: number[];
  symmetryScore: number;
  compactnessRatio: number;
  strokeDensity: number;
}

export interface SignatureBiometrics {
  dynamics: SignatureDynamics;
  geometry: GeometricFeatures;
  strokes: StrokeSegment[];
  featureVector: number[];
  quality: {
    overall: number;
    complexity: number;
    consistency: number;
    completeness: number;
  };
  uniquenessScore: number;
}

export interface SignatureComparison {
  similarity: number;
  dynamicSimilarity: number;
  geometricSimilarity: number;
  strokeSimilarity: number;
  isMatch: boolean;
  confidence: number;
  discrepancies: string[];
}

class SignatureAnalyzer {
  private readonly MIN_POINTS = 20;
  private readonly STROKE_GAP_THRESHOLD = 50; // ms between strokes
  private readonly MATCH_THRESHOLD = 0.75;

  /**
   * Analyze signature from captured points
   */
  analyzeSignature(points: SignaturePoint[]): SignatureBiometrics | null {
    if (points.length < this.MIN_POINTS) {
      console.warn('[SignatureAnalyzer] Insufficient points for analysis');
      return null;
    }

    // Normalize points
    const normalizedPoints = this.normalizePoints(points);
    
    // Segment into strokes
    const strokes = this.segmentStrokes(normalizedPoints);
    
    // Extract dynamics
    const dynamics = this.extractDynamics(normalizedPoints, strokes);
    
    // Extract geometry
    const geometry = this.extractGeometry(normalizedPoints, strokes);
    
    // Generate feature vector
    const featureVector = this.generateFeatureVector(dynamics, geometry, strokes);
    
    // Calculate quality metrics
    const quality = this.assessQuality(dynamics, geometry, strokes);
    
    // Calculate uniqueness
    const uniquenessScore = this.calculateUniqueness(dynamics, geometry);

    return {
      dynamics,
      geometry,
      strokes,
      featureVector,
      quality,
      uniquenessScore,
    };
  }

  /**
   * Normalize points to 0-1 range
   */
  private normalizePoints(points: SignaturePoint[]): SignaturePoint[] {
    if (points.length === 0) return [];

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = Math.max(width, height);

    return points.map(p => ({
      x: (p.x - minX) / scale,
      y: (p.y - minY) / scale,
      pressure: p.pressure,
      timestamp: p.timestamp,
    }));
  }

  /**
   * Segment signature into individual strokes
   */
  private segmentStrokes(points: SignaturePoint[]): StrokeSegment[] {
    const strokes: StrokeSegment[] = [];
    let currentStroke: SignaturePoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (currentStroke.length === 0) {
        currentStroke.push(point);
        continue;
      }

      const lastPoint = currentStroke[currentStroke.length - 1];
      const timeDiff = point.timestamp - lastPoint.timestamp;
      const isPenLift = point.pressure === 0 || timeDiff > this.STROKE_GAP_THRESHOLD;

      if (isPenLift && currentStroke.length > 3) {
        strokes.push(this.analyzeStroke(currentStroke));
        currentStroke = [];
      }
      
      if (point.pressure > 0) {
        currentStroke.push(point);
      }
    }

    // Add final stroke
    if (currentStroke.length > 3) {
      strokes.push(this.analyzeStroke(currentStroke));
    }

    return strokes;
  }

  /**
   * Analyze a single stroke segment
   */
  private analyzeStroke(points: SignaturePoint[]): StrokeSegment {
    const duration = points[points.length - 1].timestamp - points[0].timestamp;
    let length = 0;
    const curvature: number[] = [];
    let totalPressure = 0;
    let peakPressure = 0;

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
      totalPressure += points[i].pressure;
      peakPressure = Math.max(peakPressure, points[i].pressure);

      // Calculate curvature at each point
      if (i > 1 && i < points.length - 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        const k = this.calculateCurvature(prev, curr, next);
        curvature.push(k);
      }
    }

    const startAngle = Math.atan2(
      points[1].y - points[0].y,
      points[1].x - points[0].x
    ) * 180 / Math.PI;

    const endAngle = Math.atan2(
      points[points.length - 1].y - points[points.length - 2].y,
      points[points.length - 1].x - points[points.length - 2].x
    ) * 180 / Math.PI;

    return {
      points,
      duration: duration || 1,
      length,
      averageVelocity: length / (duration || 1) * 1000,
      averagePressure: totalPressure / (points.length - 1),
      peakPressure,
      startAngle,
      endAngle,
      curvature,
    };
  }

  /**
   * Calculate curvature at a point
   */
  private calculateCurvature(
    p1: SignaturePoint,
    p2: SignaturePoint,
    p3: SignaturePoint
  ): number {
    const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const d2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const cross = d1.x * d2.y - d1.y * d2.x;
    const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
    const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
    
    if (len1 === 0 || len2 === 0) return 0;
    
    return Math.asin(Math.max(-1, Math.min(1, cross / (len1 * len2))));
  }

  /**
   * Extract dynamic features
   */
  private extractDynamics(
    points: SignaturePoint[],
    strokes: StrokeSegment[]
  ): SignatureDynamics {
    const totalDuration = points[points.length - 1].timestamp - points[0].timestamp;
    const totalLength = strokes.reduce((sum, s) => sum + s.length, 0);
    
    const velocities: number[] = [];
    const pressures: number[] = [];
    const accelerations: number[] = [];
    const penLiftDurations: number[] = [];

    // Calculate velocity and pressure profiles
    for (let i = 1; i < points.length; i++) {
      const dt = (points[i].timestamp - points[i - 1].timestamp) || 1;
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      velocities.push(dist / dt * 1000);
      pressures.push(points[i].pressure);
    }

    // Calculate accelerations
    for (let i = 1; i < velocities.length; i++) {
      const dv = velocities[i] - velocities[i - 1];
      const dt = (points[i + 1].timestamp - points[i].timestamp) || 1;
      accelerations.push(dv / dt * 1000);
    }

    // Calculate jerk (rate of change of acceleration)
    const jerkProfile: number[] = [];
    for (let i = 1; i < accelerations.length; i++) {
      const da = accelerations[i] - accelerations[i - 1];
      const dt = (points[i + 2].timestamp - points[i + 1].timestamp) || 1;
      jerkProfile.push(da / dt * 1000);
    }

    // Detect pen lifts
    let penLiftCount = 0;
    for (let i = 1; i < strokes.length; i++) {
      const prevEnd = strokes[i - 1].points[strokes[i - 1].points.length - 1].timestamp;
      const currStart = strokes[i].points[0].timestamp;
      const liftDuration = currStart - prevEnd;
      if (liftDuration > 10) {
        penLiftCount++;
        penLiftDurations.push(liftDuration);
      }
    }

    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length || 0;
    const maxVelocity = Math.max(...velocities) || 0;
    const velocityVariance = this.calculateVariance(velocities);
    const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length || 0;
    const pressureVariance = this.calculateVariance(pressures);

    return {
      totalDuration,
      totalLength,
      strokeCount: strokes.length,
      averageVelocity: avgVelocity,
      maxVelocity,
      velocityVariance,
      averagePressure: avgPressure,
      pressureVariance,
      penLiftCount,
      penLiftDurations,
      accelerationProfile: accelerations,
      jerkProfile,
    };
  }

  /**
   * Extract geometric features
   */
  private extractGeometry(
    points: SignaturePoint[],
    strokes: StrokeSegment[]
  ): GeometricFeatures {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    
    const centroid = {
      x: xs.reduce((a, b) => a + b, 0) / points.length,
      y: ys.reduce((a, b) => a + b, 0) / points.length,
    };

    // Count loops and crossings
    const { loops, crossings } = this.countLoopsAndCrossings(points);

    // Calculate total angle change
    let totalAngleChange = 0;
    const angles: number[] = [];
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.curvature.length; i++) {
        const angleDiff = Math.abs(stroke.curvature[i] - stroke.curvature[i - 1]);
        totalAngleChange += angleDiff;
        angles.push(angleDiff);
      }
    }

    // Find dominant angles
    const dominantAngles = this.findDominantAngles(strokes);

    // Calculate symmetry score
    const symmetryScore = this.calculateSymmetry(points, centroid);

    // Compactness ratio (perimeter^2 / area)
    const area = width * height;
    const perimeter = 2 * (width + height);
    const compactnessRatio = (perimeter * perimeter) / (4 * Math.PI * area);

    // Stroke density
    const totalLength = strokes.reduce((sum, s) => sum + s.length, 0);
    const strokeDensity = totalLength / area;

    return {
      boundingBox: { width, height, aspectRatio: width / height },
      centroid,
      loops,
      crossings,
      totalAngleChange,
      dominantAngles,
      symmetryScore,
      compactnessRatio,
      strokeDensity,
    };
  }

  /**
   * Count loops and line crossings
   */
  private countLoopsAndCrossings(points: SignaturePoint[]): { loops: number; crossings: number } {
    let loops = 0;
    let crossings = 0;

    // Simplified loop detection - look for closed paths
    for (let i = 0; i < points.length - 10; i++) {
      for (let j = i + 10; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i].x - points[j].x, 2) +
          Math.pow(points[i].y - points[j].y, 2)
        );
        if (dist < 0.05) {
          loops++;
          break;
        }
      }
    }

    // Line crossing detection
    for (let i = 0; i < points.length - 3; i++) {
      for (let j = i + 3; j < points.length - 1; j++) {
        if (this.linesIntersect(points[i], points[i + 1], points[j], points[j + 1])) {
          crossings++;
        }
      }
    }

    return { loops, crossings: Math.min(crossings, 50) }; // Cap crossings
  }

  /**
   * Check if two line segments intersect
   */
  private linesIntersect(
    p1: SignaturePoint,
    p2: SignaturePoint,
    p3: SignaturePoint,
    p4: SignaturePoint
  ): boolean {
    const d1 = this.direction(p3, p4, p1);
    const d2 = this.direction(p3, p4, p2);
    const d3 = this.direction(p1, p2, p3);
    const d4 = this.direction(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }
    return false;
  }

  private direction(p1: SignaturePoint, p2: SignaturePoint, p3: SignaturePoint): number {
    return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
  }

  /**
   * Find dominant stroke angles
   */
  private findDominantAngles(strokes: StrokeSegment[]): number[] {
    const angleBins = new Array(18).fill(0); // 20-degree bins

    for (const stroke of strokes) {
      const angle = ((stroke.startAngle + 180) % 360);
      const bin = Math.floor(angle / 20);
      if (bin >= 0 && bin < 18) {
        angleBins[bin]++;
      }
    }

    // Find top 3 angles
    return angleBins
      .map((count, idx) => ({ angle: idx * 20, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(a => a.angle);
  }

  /**
   * Calculate bilateral symmetry
   */
  private calculateSymmetry(points: SignaturePoint[], centroid: { x: number; y: number }): number {
    let symmetrySum = 0;
    let count = 0;

    for (const point of points) {
      // Find mirror point
      const mirrorX = 2 * centroid.x - point.x;
      
      // Find closest point to mirror position
      let minDist = Infinity;
      for (const p2 of points) {
        const dist = Math.sqrt(Math.pow(p2.x - mirrorX, 2) + Math.pow(p2.y - point.y, 2));
        minDist = Math.min(minDist, dist);
      }
      
      symmetrySum += 1 / (1 + minDist * 10);
      count++;
    }

    return count > 0 ? symmetrySum / count : 0;
  }

  /**
   * Generate fixed-length feature vector
   */
  private generateFeatureVector(
    dynamics: SignatureDynamics,
    geometry: GeometricFeatures,
    strokes: StrokeSegment[]
  ): number[] {
    return [
      // Dynamic features (10)
      dynamics.totalDuration / 5000, // Normalize to ~1s
      dynamics.totalLength,
      dynamics.strokeCount / 10,
      dynamics.averageVelocity / 1000,
      dynamics.maxVelocity / 2000,
      dynamics.velocityVariance / 1000,
      dynamics.averagePressure,
      dynamics.pressureVariance,
      dynamics.penLiftCount / 5,
      dynamics.penLiftDurations.length > 0 
        ? dynamics.penLiftDurations.reduce((a, b) => a + b, 0) / dynamics.penLiftDurations.length / 100 
        : 0,
      
      // Geometric features (10)
      geometry.boundingBox.aspectRatio,
      geometry.centroid.x,
      geometry.centroid.y,
      geometry.loops / 5,
      geometry.crossings / 20,
      geometry.totalAngleChange / 100,
      geometry.symmetryScore,
      geometry.compactnessRatio / 10,
      geometry.strokeDensity / 10,
      geometry.dominantAngles[0] / 360 || 0,
      
      // Stroke features (averaged)
      strokes.length > 0 ? strokes.reduce((s, st) => s + st.averageVelocity, 0) / strokes.length / 1000 : 0,
      strokes.length > 0 ? strokes.reduce((s, st) => s + st.peakPressure, 0) / strokes.length : 0,
    ];
  }

  /**
   * Assess signature quality
   */
  private assessQuality(
    dynamics: SignatureDynamics,
    geometry: GeometricFeatures,
    strokes: StrokeSegment[]
  ): { overall: number; complexity: number; consistency: number; completeness: number } {
    // Complexity based on stroke count, loops, crossings
    const complexity = Math.min(1, (dynamics.strokeCount + geometry.loops + geometry.crossings / 5) / 15);

    // Consistency based on pressure and velocity variance
    const pressureConsistency = 1 / (1 + dynamics.pressureVariance * 5);
    const velocityConsistency = 1 / (1 + dynamics.velocityVariance / 500);
    const consistency = (pressureConsistency + velocityConsistency) / 2;

    // Completeness based on duration and length
    const durationScore = Math.min(1, dynamics.totalDuration / 2000);
    const lengthScore = Math.min(1, dynamics.totalLength * 2);
    const completeness = (durationScore + lengthScore) / 2;

    const overall = (complexity * 0.3 + consistency * 0.4 + completeness * 0.3);

    return { overall, complexity, consistency, completeness };
  }

  /**
   * Calculate uniqueness score
   */
  private calculateUniqueness(dynamics: SignatureDynamics, geometry: GeometricFeatures): number {
    // Higher uniqueness from more complex signatures
    const complexityScore = Math.min(1, (
      dynamics.strokeCount * 0.2 +
      geometry.loops * 0.3 +
      geometry.crossings * 0.05 +
      geometry.totalAngleChange * 0.01
    ));

    // Variation adds uniqueness
    const variationScore = Math.min(1, (
      dynamics.velocityVariance / 500 +
      dynamics.pressureVariance * 2
    ));

    return (complexityScore * 0.6 + variationScore * 0.4);
  }

  /**
   * Compare two signatures
   */
  compareSignatures(sig1: SignatureBiometrics, sig2: SignatureBiometrics): SignatureComparison {
    const discrepancies: string[] = [];

    // Dynamic similarity
    const dynamicSim = this.compareDynamics(sig1.dynamics, sig2.dynamics, discrepancies);
    
    // Geometric similarity
    const geometricSim = this.compareGeometry(sig1.geometry, sig2.geometry, discrepancies);
    
    // Stroke pattern similarity
    const strokeSim = this.compareStrokes(sig1.strokes, sig2.strokes);

    // Feature vector cosine similarity
    const featureSim = this.cosineSimilarity(sig1.featureVector, sig2.featureVector);

    const similarity = (
      dynamicSim * 0.25 +
      geometricSim * 0.25 +
      strokeSim * 0.25 +
      featureSim * 0.25
    );

    const isMatch = similarity >= this.MATCH_THRESHOLD;
    const confidence = similarity * (isMatch ? 1 : 0.8);

    return {
      similarity,
      dynamicSimilarity: dynamicSim,
      geometricSimilarity: geometricSim,
      strokeSimilarity: strokeSim,
      isMatch,
      confidence,
      discrepancies,
    };
  }

  private compareDynamics(d1: SignatureDynamics, d2: SignatureDynamics, discrepancies: string[]): number {
    let score = 0;
    let factors = 0;

    // Duration similarity
    const durationRatio = Math.min(d1.totalDuration, d2.totalDuration) / Math.max(d1.totalDuration, d2.totalDuration) || 0;
    score += durationRatio;
    factors++;
    if (durationRatio < 0.5) discrepancies.push('Significant duration difference');

    // Velocity similarity
    const velocityRatio = Math.min(d1.averageVelocity, d2.averageVelocity) / Math.max(d1.averageVelocity, d2.averageVelocity) || 0;
    score += velocityRatio;
    factors++;
    if (velocityRatio < 0.5) discrepancies.push('Different writing speed');

    // Pressure similarity
    const pressureRatio = Math.min(d1.averagePressure, d2.averagePressure) / Math.max(d1.averagePressure, d2.averagePressure) || 0;
    score += pressureRatio;
    factors++;
    if (pressureRatio < 0.5) discrepancies.push('Different pressure pattern');

    // Stroke count similarity
    const strokeRatio = Math.min(d1.strokeCount, d2.strokeCount) / Math.max(d1.strokeCount, d2.strokeCount) || 0;
    score += strokeRatio;
    factors++;
    if (strokeRatio < 0.6) discrepancies.push('Different stroke count');

    return score / factors;
  }

  private compareGeometry(g1: GeometricFeatures, g2: GeometricFeatures, discrepancies: string[]): number {
    let score = 0;
    let factors = 0;

    // Aspect ratio similarity
    const aspectRatio = Math.min(g1.boundingBox.aspectRatio, g2.boundingBox.aspectRatio) / 
                        Math.max(g1.boundingBox.aspectRatio, g2.boundingBox.aspectRatio) || 0;
    score += aspectRatio;
    factors++;
    if (aspectRatio < 0.7) discrepancies.push('Different proportions');

    // Loops similarity
    const loopDiff = Math.abs(g1.loops - g2.loops);
    score += loopDiff === 0 ? 1 : loopDiff === 1 ? 0.7 : 0.4;
    factors++;
    if (loopDiff > 2) discrepancies.push('Different loop pattern');

    // Crossings similarity
    const crossingRatio = 1 - Math.min(Math.abs(g1.crossings - g2.crossings) / 10, 1);
    score += crossingRatio;
    factors++;

    // Symmetry similarity
    const symmetryDiff = Math.abs(g1.symmetryScore - g2.symmetryScore);
    score += 1 - symmetryDiff;
    factors++;

    return score / factors;
  }

  private compareStrokes(s1: StrokeSegment[], s2: StrokeSegment[]): number {
    if (s1.length === 0 || s2.length === 0) return 0;

    // Compare average stroke characteristics
    const avgVel1 = s1.reduce((sum, s) => sum + s.averageVelocity, 0) / s1.length;
    const avgVel2 = s2.reduce((sum, s) => sum + s.averageVelocity, 0) / s2.length;
    const velSim = Math.min(avgVel1, avgVel2) / Math.max(avgVel1, avgVel2) || 0;

    const avgPressure1 = s1.reduce((sum, s) => sum + s.averagePressure, 0) / s1.length;
    const avgPressure2 = s2.reduce((sum, s) => sum + s.averagePressure, 0) / s2.length;
    const pressureSim = Math.min(avgPressure1, avgPressure2) / Math.max(avgPressure1, avgPressure2) || 0;

    return (velSim + pressureSim) / 2;
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}

export const signatureAnalyzer = new SignatureAnalyzer();
