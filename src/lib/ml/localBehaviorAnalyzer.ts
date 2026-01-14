/**
 * Local Behavior Pattern Analyzer
 * 
 * On-device behavior pattern recognition:
 * - Activity detection (walking, running, stationary, driving)
 * - Routine pattern learning
 * - Anomaly detection
 * - Context inference
 */

export interface SensorReading {
  timestamp: number;
  accelerometer?: { x: number; y: number; z: number };
  gyroscope?: { alpha: number; beta: number; gamma: number };
  location?: { lat: number; lng: number; accuracy: number };
  light?: number;
  proximity?: number;
}

export interface ActivityClassification {
  activity: 'stationary' | 'walking' | 'running' | 'cycling' | 'driving' | 'unknown';
  confidence: number;
  subActivity?: string;
  energy: 'low' | 'medium' | 'high';
}

export interface LocationContext {
  type: 'home' | 'work' | 'transit' | 'shopping' | 'dining' | 'outdoor' | 'unknown';
  confidence: number;
  isKnownPlace: boolean;
  placeId?: string;
}

export interface BehaviorPattern {
  id: string;
  type: 'routine' | 'transition' | 'location' | 'interaction';
  description: string;
  frequency: number;
  confidence: number;
  timeRange?: { start: number; end: number }; // Hour of day
  dayOfWeek?: number[];
  metadata: Record<string, unknown>;
}

export interface BehaviorProfile {
  patterns: BehaviorPattern[];
  averageActivityLevel: number;
  typicalWakeTime: number;
  typicalSleepTime: number;
  homeLocation?: { lat: number; lng: number };
  workLocation?: { lat: number; lng: number };
  lastUpdated: number;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  type?: 'unusual_time' | 'unusual_location' | 'unusual_activity' | 'pattern_break';
  severity: number;
  description: string;
  expectedBehavior?: string;
}

class LocalBehaviorAnalyzer {
  private readonly ACTIVITY_WINDOW_SIZE = 50; // samples
  private readonly LOCATION_CLUSTER_RADIUS = 0.001; // ~100m in degrees
  
  private sensorBuffer: SensorReading[] = [];
  private locationHistory: { lat: number; lng: number; timestamp: number }[] = [];
  private behaviorProfile: BehaviorProfile | null = null;
  private knownPlaces: Map<string, { lat: number; lng: number; type: string; visits: number }> = new Map();

  /**
   * Process incoming sensor reading
   */
  processSensorReading(reading: SensorReading): void {
    this.sensorBuffer.push(reading);
    
    // Keep buffer manageable
    if (this.sensorBuffer.length > 1000) {
      this.sensorBuffer = this.sensorBuffer.slice(-500);
    }

    // Track location history
    if (reading.location) {
      this.locationHistory.push({
        lat: reading.location.lat,
        lng: reading.location.lng,
        timestamp: reading.timestamp,
      });
      
      if (this.locationHistory.length > 10000) {
        this.locationHistory = this.locationHistory.slice(-5000);
      }
    }
  }

  /**
   * Classify current activity
   */
  classifyActivity(readings?: SensorReading[]): ActivityClassification {
    const samples = readings || this.sensorBuffer.slice(-this.ACTIVITY_WINDOW_SIZE);
    
    if (samples.length < 10) {
      return { activity: 'unknown', confidence: 0, energy: 'low' };
    }

    // Extract accelerometer features
    const accReadings = samples
      .filter(s => s.accelerometer)
      .map(s => s.accelerometer!);

    if (accReadings.length < 10) {
      return { activity: 'unknown', confidence: 0, energy: 'low' };
    }

    // Calculate magnitude and statistics
    const magnitudes = accReadings.map(a => 
      Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
    );

    const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const variance = magnitudes.reduce((sum, m) => 
      sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length;
    const stdDev = Math.sqrt(variance);

    // Calculate step frequency (rough estimate)
    let zeroCrossings = 0;
    for (let i = 1; i < magnitudes.length; i++) {
      if ((magnitudes[i] - avgMagnitude) * (magnitudes[i-1] - avgMagnitude) < 0) {
        zeroCrossings++;
      }
    }

    // Sample rate estimation
    const duration = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000;
    const frequency = zeroCrossings / (2 * duration); // Steps per second

    // Classify based on features
    let activity: ActivityClassification['activity'] = 'unknown';
    let confidence = 0.5;
    let energy: 'low' | 'medium' | 'high' = 'low';
    let subActivity: string | undefined;

    if (stdDev < 0.1) {
      activity = 'stationary';
      confidence = 0.9;
      energy = 'low';
      subActivity = avgMagnitude < 9.5 ? 'lying' : 'sitting/standing';
    } else if (stdDev < 0.5 && frequency > 0.5 && frequency < 1.5) {
      activity = 'walking';
      confidence = 0.8;
      energy = 'medium';
      subActivity = frequency < 1 ? 'slow walking' : 'normal walking';
    } else if (stdDev > 0.5 && frequency > 1.5 && frequency < 3) {
      activity = 'running';
      confidence = 0.7;
      energy = 'high';
      subActivity = frequency > 2.5 ? 'fast running' : 'jogging';
    } else if (stdDev > 0.3 && frequency > 0.8 && frequency < 2) {
      activity = 'cycling';
      confidence = 0.6;
      energy = 'medium';
    } else if (stdDev < 0.3 && this.detectVehicleMotion(samples)) {
      activity = 'driving';
      confidence = 0.7;
      energy = 'low';
    }

    return { activity, confidence, subActivity, energy };
  }

  /**
   * Detect vehicle motion patterns
   */
  private detectVehicleMotion(samples: SensorReading[]): boolean {
    const locations = samples.filter(s => s.location);
    if (locations.length < 2) return false;

    // Calculate speed from GPS
    const firstLoc = locations[0].location!;
    const lastLoc = locations[locations.length - 1].location!;
    const distance = this.haversineDistance(
      firstLoc.lat, firstLoc.lng,
      lastLoc.lat, lastLoc.lng
    );
    const duration = (locations[locations.length - 1].timestamp - locations[0].timestamp) / 1000 / 3600;
    const speed = distance / duration; // km/h

    // Vehicle if moving fast but low acceleration variance
    return speed > 20 && speed < 200;
  }

  /**
   * Get location context
   */
  getLocationContext(lat: number, lng: number): LocationContext {
    // Check against known places
    for (const [placeId, place] of this.knownPlaces) {
      const distance = this.haversineDistance(lat, lng, place.lat, place.lng);
      if (distance < 0.1) { // 100m
        return {
          type: place.type as LocationContext['type'],
          confidence: Math.min(0.9, 0.5 + place.visits * 0.1),
          isKnownPlace: true,
          placeId,
        };
      }
    }

    // Check if near home or work
    if (this.behaviorProfile?.homeLocation) {
      const distHome = this.haversineDistance(
        lat, lng,
        this.behaviorProfile.homeLocation.lat,
        this.behaviorProfile.homeLocation.lng
      );
      if (distHome < 0.1) {
        return { type: 'home', confidence: 0.9, isKnownPlace: true };
      }
    }

    if (this.behaviorProfile?.workLocation) {
      const distWork = this.haversineDistance(
        lat, lng,
        this.behaviorProfile.workLocation.lat,
        this.behaviorProfile.workLocation.lng
      );
      if (distWork < 0.1) {
        return { type: 'work', confidence: 0.9, isKnownPlace: true };
      }
    }

    // Infer context from movement patterns
    const activity = this.classifyActivity();
    if (activity.activity === 'driving') {
      return { type: 'transit', confidence: 0.7, isKnownPlace: false };
    }

    return { type: 'unknown', confidence: 0.3, isKnownPlace: false };
  }

  /**
   * Detect anomalies in current behavior
   */
  detectAnomaly(): AnomalyDetection {
    if (!this.behaviorProfile) {
      return { isAnomaly: false, severity: 0, description: 'No baseline profile' };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Check for unusual time activity
    const isAwakeTime = currentHour >= this.behaviorProfile.typicalWakeTime &&
                        currentHour <= this.behaviorProfile.typicalSleepTime;
    
    const activity = this.classifyActivity();

    if (!isAwakeTime && activity.activity !== 'stationary') {
      return {
        isAnomaly: true,
        type: 'unusual_time',
        severity: 0.6,
        description: `Active during typical sleep hours`,
        expectedBehavior: 'Stationary/sleeping',
      };
    }

    // Check for unusual location
    if (this.locationHistory.length > 0) {
      const currentLoc = this.locationHistory[this.locationHistory.length - 1];
      const context = this.getLocationContext(currentLoc.lat, currentLoc.lng);
      
      // Get expected location for this time
      const expectedPattern = this.behaviorProfile.patterns.find(p => 
        p.type === 'location' &&
        p.timeRange &&
        currentHour >= p.timeRange.start &&
        currentHour <= p.timeRange.end &&
        (!p.dayOfWeek || p.dayOfWeek.includes(currentDay))
      );

      if (expectedPattern && !context.isKnownPlace) {
        return {
          isAnomaly: true,
          type: 'unusual_location',
          severity: 0.5,
          description: 'At unexpected location',
          expectedBehavior: expectedPattern.description,
        };
      }
    }

    // Check for unusual activity level
    if (activity.activity === 'running' && currentHour < 5) {
      return {
        isAnomaly: true,
        type: 'unusual_activity',
        severity: 0.4,
        description: 'High activity during unusual hours',
        expectedBehavior: 'Rest',
      };
    }

    return { isAnomaly: false, severity: 0, description: 'Behavior within normal patterns' };
  }

  /**
   * Learn routine patterns from history
   */
  learnPatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    
    // Analyze location clusters for frequent places
    const locationClusters = this.clusterLocations();
    for (const [clusterId, cluster] of locationClusters) {
      if (cluster.count >= 5) {
        const timeAnalysis = this.analyzeTimeDistribution(cluster.timestamps);
        
        patterns.push({
          id: `loc_${clusterId}`,
          type: 'location',
          description: `Frequent location visited ${cluster.count} times`,
          frequency: cluster.count,
          confidence: Math.min(0.9, cluster.count / 20),
          timeRange: timeAnalysis.peakHours,
          dayOfWeek: timeAnalysis.peakDays,
          metadata: { lat: cluster.lat, lng: cluster.lng },
        });
      }
    }

    // Analyze daily routines
    const hourlyActivity = new Array(24).fill(0).map(() => ({
      stationary: 0, walking: 0, running: 0, driving: 0, total: 0
    }));

    // Simulate routine analysis from sensor buffer
    for (const reading of this.sensorBuffer) {
      const hour = new Date(reading.timestamp).getHours();
      hourlyActivity[hour].total++;
      
      if (reading.accelerometer) {
        const mag = Math.sqrt(
          reading.accelerometer.x ** 2 +
          reading.accelerometer.y ** 2 +
          reading.accelerometer.z ** 2
        );
        
        if (Math.abs(mag - 9.8) < 0.5) {
          hourlyActivity[hour].stationary++;
        } else if (Math.abs(mag - 9.8) < 2) {
          hourlyActivity[hour].walking++;
        } else {
          hourlyActivity[hour].running++;
        }
      }
    }

    // Find wake and sleep patterns
    let wakeHour = 7, sleepHour = 23;
    let maxActivityChange = 0;
    
    for (let h = 4; h < 12; h++) {
      const change = hourlyActivity[h].walking + hourlyActivity[h].running - 
                     hourlyActivity[h - 1].walking - hourlyActivity[h - 1].running;
      if (change > maxActivityChange) {
        maxActivityChange = change;
        wakeHour = h;
      }
    }

    for (let h = 20; h < 24; h++) {
      const change = hourlyActivity[h - 1].stationary - hourlyActivity[h].stationary;
      if (change > maxActivityChange / 2) {
        sleepHour = h;
      }
    }

    patterns.push({
      id: 'routine_wake',
      type: 'routine',
      description: `Typical wake time around ${wakeHour}:00`,
      frequency: 1,
      confidence: 0.7,
      timeRange: { start: wakeHour - 1, end: wakeHour + 1 },
      metadata: { activityType: 'wake' },
    });

    patterns.push({
      id: 'routine_sleep',
      type: 'routine',
      description: `Typical sleep time around ${sleepHour}:00`,
      frequency: 1,
      confidence: 0.7,
      timeRange: { start: sleepHour - 1, end: sleepHour + 1 },
      metadata: { activityType: 'sleep' },
    });

    return patterns;
  }

  /**
   * Cluster location history
   */
  private clusterLocations(): Map<string, {
    lat: number;
    lng: number;
    count: number;
    timestamps: number[];
  }> {
    const clusters = new Map<string, {
      lat: number;
      lng: number;
      count: number;
      timestamps: number[];
    }>();

    for (const loc of this.locationHistory) {
      let foundCluster = false;
      
      for (const [id, cluster] of clusters) {
        const dist = this.haversineDistance(loc.lat, loc.lng, cluster.lat, cluster.lng);
        if (dist < 0.1) { // 100m
          // Update cluster center
          cluster.lat = (cluster.lat * cluster.count + loc.lat) / (cluster.count + 1);
          cluster.lng = (cluster.lng * cluster.count + loc.lng) / (cluster.count + 1);
          cluster.count++;
          cluster.timestamps.push(loc.timestamp);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        const id = `cluster_${clusters.size}`;
        clusters.set(id, {
          lat: loc.lat,
          lng: loc.lng,
          count: 1,
          timestamps: [loc.timestamp],
        });
      }
    }

    return clusters;
  }

  /**
   * Analyze time distribution
   */
  private analyzeTimeDistribution(timestamps: number[]): {
    peakHours: { start: number; end: number };
    peakDays: number[];
  } {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    for (const ts of timestamps) {
      const date = new Date(ts);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    }

    // Find peak hours
    let maxHour = 0;
    let maxCount = 0;
    for (let h = 0; h < 24; h++) {
      if (hourCounts[h] > maxCount) {
        maxCount = hourCounts[h];
        maxHour = h;
      }
    }

    // Find peak days
    const avgDayCount = dayCounts.reduce((a, b) => a + b, 0) / 7;
    const peakDays = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(d => d.count > avgDayCount * 0.5)
      .map(d => d.day);

    return {
      peakHours: { start: Math.max(0, maxHour - 2), end: Math.min(23, maxHour + 2) },
      peakDays: peakDays.length > 0 ? peakDays : [0, 1, 2, 3, 4, 5, 6],
    };
  }

  /**
   * Haversine distance in km
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Register a known place
   */
  registerPlace(id: string, lat: number, lng: number, type: string): void {
    this.knownPlaces.set(id, { lat, lng, type, visits: 1 });
  }

  /**
   * Update behavior profile
   */
  updateProfile(): BehaviorProfile {
    const patterns = this.learnPatterns();
    
    // Calculate average activity level
    const recentActivity = this.sensorBuffer.slice(-500);
    const activityLevels = recentActivity
      .filter(r => r.accelerometer)
      .map(r => {
        const a = r.accelerometer!;
        return Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2) - 9.8;
      });
    
    const averageActivityLevel = activityLevels.length > 0
      ? activityLevels.reduce((a, b) => a + Math.abs(b), 0) / activityLevels.length
      : 0;

    // Extract wake/sleep times from patterns
    const wakePattern = patterns.find(p => p.metadata?.activityType === 'wake');
    const sleepPattern = patterns.find(p => p.metadata?.activityType === 'sleep');

    // Find home and work locations
    const locationPatterns = patterns
      .filter(p => p.type === 'location')
      .sort((a, b) => b.frequency - a.frequency);

    let homeLocation: { lat: number; lng: number } | undefined;
    let workLocation: { lat: number; lng: number } | undefined;

    if (locationPatterns.length > 0 && locationPatterns[0].metadata?.lat) {
      // Most visited at night = home
      const nightPattern = locationPatterns.find(p => 
        p.timeRange && p.timeRange.start >= 20 || p.timeRange && p.timeRange.end <= 8
      );
      if (nightPattern?.metadata?.lat) {
        homeLocation = {
          lat: nightPattern.metadata.lat as number,
          lng: nightPattern.metadata.lng as number,
        };
      }

      // Most visited during work hours = work
      const workPattern = locationPatterns.find(p => 
        p.timeRange && p.timeRange.start >= 8 && p.timeRange.end <= 18 &&
        p !== nightPattern
      );
      if (workPattern?.metadata?.lat) {
        workLocation = {
          lat: workPattern.metadata.lat as number,
          lng: workPattern.metadata.lng as number,
        };
      }
    }

    this.behaviorProfile = {
      patterns,
      averageActivityLevel,
      typicalWakeTime: wakePattern?.timeRange?.start || 7,
      typicalSleepTime: sleepPattern?.timeRange?.start || 23,
      homeLocation,
      workLocation,
      lastUpdated: Date.now(),
    };

    return this.behaviorProfile;
  }

  /**
   * Get current profile
   */
  getProfile(): BehaviorProfile | null {
    return this.behaviorProfile;
  }

  /**
   * Export profile for storage
   */
  exportProfile(): string | null {
    if (!this.behaviorProfile) return null;
    return JSON.stringify(this.behaviorProfile);
  }

  /**
   * Import profile
   */
  importProfile(data: string): boolean {
    try {
      this.behaviorProfile = JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.sensorBuffer = [];
    this.locationHistory = [];
    this.behaviorProfile = null;
    this.knownPlaces.clear();
  }
}

export const localBehaviorAnalyzer = new LocalBehaviorAnalyzer();
