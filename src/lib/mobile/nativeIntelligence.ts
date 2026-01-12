/**
 * Native Intelligence Manager
 * Unified manager for all native mobile capabilities for life analysis
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Motion } from '@capacitor/motion';

// Types for native intelligence
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface MotionData {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
  timestamp: number;
}

export interface ActivityState {
  type: 'stationary' | 'walking' | 'running' | 'driving' | 'cycling' | 'unknown';
  confidence: number;
  timestamp: number;
}

export interface ProximityDevice {
  id: string;
  name?: string;
  rssi?: number;
  type: 'bluetooth' | 'wifi' | 'nfc';
  lastSeen: number;
}

export interface ContextSnapshot {
  location?: LocationData;
  motion?: MotionData;
  activity?: ActivityState;
  nearbyDevices?: ProximityDevice[];
  ambientLight?: number;
  batteryLevel?: number;
  networkType?: string;
  timestamp: number;
}

export interface GeofenceConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  linkedProfileId?: string;
}

class NativeIntelligenceManager {
  private isNative: boolean;
  private motionListeners: ((data: MotionData) => void)[] = [];
  private locationWatchId: string | null = null;
  private motionWatchHandle: any = null;
  private activityBuffer: MotionData[] = [];
  private lastActivityState: ActivityState | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  // Platform detection
  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }

  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  // ===================
  // LOCATION SERVICES
  // ===================

  async checkLocationPermission(): Promise<boolean> {
    try {
      const status = await Geolocation.checkPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      return this.positionToLocationData(position);
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  async startLocationTracking(
    callback: (location: LocationData) => void,
    options?: { enableHighAccuracy?: boolean; interval?: number }
  ): Promise<string | null> {
    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (position) {
            callback(this.positionToLocationData(position));
          }
        }
      );
      this.locationWatchId = watchId;
      return watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return null;
    }
  }

  async stopLocationTracking(): Promise<void> {
    if (this.locationWatchId) {
      await Geolocation.clearWatch({ id: this.locationWatchId });
      this.locationWatchId = null;
    }
  }

  private positionToLocationData(position: Position): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: position.timestamp
    };
  }

  // ===================
  // MOTION SERVICES
  // ===================

  async startMotionTracking(callback: (data: MotionData) => void): Promise<boolean> {
    try {
      this.motionListeners.push(callback);
      
      if (!this.motionWatchHandle) {
        this.motionWatchHandle = await Motion.addListener('accel', (event) => {
          const motionData: MotionData = {
            acceleration: event.acceleration,
            accelerationIncludingGravity: event.accelerationIncludingGravity,
            rotationRate: event.rotationRate,
            interval: event.interval,
            timestamp: Date.now()
          };
          
          // Buffer for activity detection
          this.activityBuffer.push(motionData);
          if (this.activityBuffer.length > 50) {
            this.activityBuffer.shift();
          }
          
          // Notify all listeners
          this.motionListeners.forEach(listener => listener(motionData));
        });
      }
      return true;
    } catch (error) {
      console.error('Error starting motion tracking:', error);
      return false;
    }
  }

  async stopMotionTracking(): Promise<void> {
    if (this.motionWatchHandle) {
      await this.motionWatchHandle.remove();
      this.motionWatchHandle = null;
    }
    this.motionListeners = [];
  }

  // Activity detection from motion data
  detectActivity(): ActivityState {
    if (this.activityBuffer.length < 10) {
      return { type: 'unknown', confidence: 0, timestamp: Date.now() };
    }

    const recentData = this.activityBuffer.slice(-20);
    
    // Calculate average acceleration magnitude
    const avgMagnitude = recentData.reduce((sum, d) => {
      const mag = Math.sqrt(
        d.acceleration.x ** 2 + 
        d.acceleration.y ** 2 + 
        d.acceleration.z ** 2
      );
      return sum + mag;
    }, 0) / recentData.length;

    // Calculate variance for step detection
    const magnitudes = recentData.map(d => 
      Math.sqrt(d.acceleration.x ** 2 + d.acceleration.y ** 2 + d.acceleration.z ** 2)
    );
    const variance = this.calculateVariance(magnitudes);

    // Simple activity classification
    let type: ActivityState['type'] = 'unknown';
    let confidence = 0.5;

    if (variance < 0.5 && avgMagnitude < 2) {
      type = 'stationary';
      confidence = 0.9;
    } else if (variance > 2 && variance < 8) {
      type = 'walking';
      confidence = 0.75;
    } else if (variance > 8 && variance < 20) {
      type = 'running';
      confidence = 0.7;
    } else if (variance > 0.5 && variance < 3 && avgMagnitude > 2) {
      type = 'driving';
      confidence = 0.6;
    }

    this.lastActivityState = { type, confidence, timestamp: Date.now() };
    return this.lastActivityState;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  }

  // ===================
  // CAMERA SERVICES
  // ===================

  async capturePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        saveToGallery: source === 'camera'
      });
      return image.webPath || null;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  async capturePhotoBase64(source: 'camera' | 'gallery' = 'camera'): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
      });
      return image.base64String || null;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  // ===================
  // HAPTIC FEEDBACK
  // ===================

  async vibrate(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      // Haptics not available
    }
  }

  async vibratePattern(pattern: number[]): Promise<void> {
    try {
      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
        await new Promise(resolve => setTimeout(resolve, pattern[i]));
      }
    } catch (error) {
      // Haptics not available
    }
  }

  // ===================
  // SHARE SERVICES
  // ===================

  async shareText(text: string, title?: string): Promise<boolean> {
    try {
      await Share.share({ text, title, dialogTitle: title });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }

  async shareUrl(url: string, title?: string): Promise<boolean> {
    try {
      await Share.share({ url, title, dialogTitle: title });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }

  // ===================
  // CONTEXT SNAPSHOT
  // ===================

  async captureContextSnapshot(): Promise<ContextSnapshot> {
    const snapshot: ContextSnapshot = {
      timestamp: Date.now()
    };

    // Get location
    const location = await this.getCurrentLocation();
    if (location) {
      snapshot.location = location;
    }

    // Get activity state
    if (this.activityBuffer.length > 0) {
      snapshot.activity = this.detectActivity();
      snapshot.motion = this.activityBuffer[this.activityBuffer.length - 1];
    }

    // Get battery level (web API)
    try {
      const battery = await (navigator as any).getBattery?.();
      if (battery) {
        snapshot.batteryLevel = battery.level * 100;
      }
    } catch {
      // Battery API not available
    }

    // Get network type
    const connection = (navigator as any).connection;
    if (connection) {
      snapshot.networkType = connection.effectiveType || connection.type || 'unknown';
    }

    return snapshot;
  }

  // ===================
  // GEOFENCING HELPERS
  // ===================

  calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  isInsideGeofence(
    location: LocationData,
    geofence: GeofenceConfig
  ): boolean {
    const distance = this.calculateDistance(
      location.latitude, location.longitude,
      geofence.latitude, geofence.longitude
    );
    return distance <= geofence.radiusMeters;
  }

  checkGeofences(
    location: LocationData,
    geofences: GeofenceConfig[]
  ): { entered: GeofenceConfig[]; exited: GeofenceConfig[]; inside: GeofenceConfig[] } {
    const inside: GeofenceConfig[] = [];
    const entered: GeofenceConfig[] = [];
    const exited: GeofenceConfig[] = [];

    geofences.forEach(geofence => {
      const isInside = this.isInsideGeofence(location, geofence);
      if (isInside) {
        inside.push(geofence);
      }
    });

    return { entered, exited, inside };
  }

  // ===================
  // AMBIENT SENSORS
  // ===================

  async getAmbientLight(): Promise<number | null> {
    return new Promise((resolve) => {
      if ('AmbientLightSensor' in window) {
        try {
          const sensor = new (window as any).AmbientLightSensor();
          sensor.addEventListener('reading', () => {
            resolve(sensor.illuminance);
            sensor.stop();
          });
          sensor.addEventListener('error', () => resolve(null));
          sensor.start();
          // Timeout after 1 second
          setTimeout(() => {
            sensor.stop();
            resolve(null);
          }, 1000);
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }
}

// Export singleton instance
export const nativeIntelligence = new NativeIntelligenceManager();

// Export class for testing
export { NativeIntelligenceManager };
