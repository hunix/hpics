// Mobile Passive Intelligence Service
// Handles background intelligence gathering on mobile devices using Capacitor plugins

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';

export interface LocationRecord {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface ProximityRecord {
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  rssi: number;
  timestamp: string;
}

export interface MobileIntelligenceConfig {
  enableLocationTracking: boolean;
  enableBluetoothProximity: boolean;
  enableAmbientDetection: boolean;
  locationIntervalMs: number;
  bluetoothScanIntervalMs: number;
}

const DEFAULT_CONFIG: MobileIntelligenceConfig = {
  enableLocationTracking: false,
  enableBluetoothProximity: false,
  enableAmbientDetection: false,
  locationIntervalMs: 300000, // 5 minutes
  bluetoothScanIntervalMs: 60000, // 1 minute
};

class MobileIntelligenceService {
  private config: MobileIntelligenceConfig = DEFAULT_CONFIG;
  private locationWatchId: string | null = null;
  private bluetoothInterval: number | null = null;
  private isRunning = false;

  /**
   * Check if running on a native mobile platform
   */
  isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get the current platform
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  /**
   * Initialize the service with user preferences
   */
  async initialize(config?: Partial<MobileIntelligenceConfig>): Promise<boolean> {
    if (!this.isNativeApp()) {
      console.log('Mobile intelligence service only runs on native platforms');
      return false;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Request permissions
    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      console.warn('Not all permissions granted for mobile intelligence');
    }

    return true;
  }

  /**
   * Request necessary permissions for intelligence gathering
   */
  async requestPermissions(): Promise<boolean> {
    const results: boolean[] = [];

    // Location permission
    if (this.config.enableLocationTracking) {
      try {
        const status = await Geolocation.requestPermissions();
        results.push(status.location === 'granted');
      } catch (e) {
        console.error('Location permission error:', e);
        results.push(false);
      }
    }

    // Notification permission (for alerts)
    try {
      const notifStatus = await LocalNotifications.requestPermissions();
      results.push(notifStatus.display === 'granted');
    } catch (e) {
      console.error('Notification permission error:', e);
    }

    return results.every(r => r === true);
  }

  /**
   * Start passive intelligence gathering
   */
  async start(): Promise<void> {
    if (!this.isNativeApp() || this.isRunning) return;

    this.isRunning = true;
    console.log('Starting mobile intelligence service');

    // Start location tracking
    if (this.config.enableLocationTracking) {
      await this.startLocationTracking();
    }

    // Start Bluetooth scanning
    if (this.config.enableBluetoothProximity) {
      await this.startBluetoothScanning();
    }

    // Haptic feedback on start
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics may not be available
    }
  }

  /**
   * Stop passive intelligence gathering
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping mobile intelligence service');

    // Stop location tracking
    if (this.locationWatchId) {
      await Geolocation.clearWatch({ id: this.locationWatchId });
      this.locationWatchId = null;
    }

    // Stop Bluetooth scanning
    if (this.bluetoothInterval) {
      clearInterval(this.bluetoothInterval);
      this.bluetoothInterval = null;
    }
  }

  /**
   * Start continuous location tracking
   */
  private async startLocationTracking(): Promise<void> {
    try {
      this.locationWatchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            console.error('Location watch error:', err);
            return;
          }
          if (position) {
            this.recordLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined,
            });
          }
        }
      );
    } catch (e) {
      console.error('Failed to start location tracking:', e);
    }
  }

  /**
   * Start periodic Bluetooth scanning for nearby devices
   */
  private async startBluetoothScanning(): Promise<void> {
    // Note: Full Bluetooth scanning requires @capacitor-community/bluetooth-le
    // This is a placeholder for the scanning logic
    console.log('Bluetooth scanning would start here with proper plugin setup');
    
    // Would typically look like:
    // this.bluetoothInterval = window.setInterval(async () => {
    //   const devices = await BleClient.requestLEScan();
    //   for (const device of devices) {
    //     this.recordProximity({
    //       deviceId: device.deviceId,
    //       deviceName: device.localName || null,
    //       deviceType: device.manufacturerData ? 'known' : 'unknown',
    //       rssi: device.rssi || 0,
    //       timestamp: new Date().toISOString(),
    //     });
    //   }
    // }, this.config.bluetoothScanIntervalMs) as unknown as number;
  }

  /**
   * Record a location data point
   */
  private async recordLocation(location: LocationRecord): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('location_history').insert({
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        recorded_at: location.timestamp,
        source: this.getPlatform(),
      });
    } catch (e) {
      console.error('Failed to record location:', e);
    }
  }

  /**
   * Record a Bluetooth proximity detection
   */
  private async recordProximity(proximity: ProximityRecord): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update or insert the Bluetooth device record
      await supabase.from('bluetooth_devices').upsert({
        user_id: user.id,
        device_id: proximity.deviceId,
        device_name: proximity.deviceName,
        device_type: proximity.deviceType,
        last_seen_at: proximity.timestamp,
      }, { onConflict: 'user_id,device_id' });
    } catch (e) {
      console.error('Failed to record proximity:', e);
    }
  }

  /**
   * Get the current location once
   */
  async getCurrentLocation(): Promise<LocationRecord | null> {
    if (!this.isNativeApp()) {
      // Fallback to web Geolocation API
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true }
        );
      });
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
      };
    } catch (e) {
      console.error('Failed to get current location:', e);
      return null;
    }
  }

  /**
   * Send a local notification for intelligence alerts
   */
  async sendNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    if (!this.isNativeApp()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            schedule: { at: new Date() },
            extra: data,
          },
        ],
      });
    } catch (e) {
      console.error('Failed to send notification:', e);
    }
  }

  /**
   * Trigger haptic feedback for important events
   */
  async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.isNativeApp()) return;

    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }[style];

      await Haptics.impact({ style: impactStyle });
    } catch (e) {
      // Haptics not available
    }
  }

  /**
   * Quick capture - save current context (location, time, etc.)
   */
  async quickCapture(notes?: string): Promise<{ success: boolean; captureId?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const location = await this.getCurrentLocation();
      
      const { data, error } = await supabase.from('device_captures').insert([{
        user_id: user.id,
        capture_type: 'quick_note',
        content: notes,
        metadata: location ? {
          lat: location.latitude,
          lng: location.longitude,
          platform: this.getPlatform(),
          capturedAt: new Date().toISOString(),
        } : null,
      }]).select().single();

      if (error) throw error;

      // Haptic feedback on capture
      await this.triggerHaptic('medium');

      return { success: true, captureId: data?.id };
    } catch (e) {
      console.error('Quick capture failed:', e);
      return { success: false };
    }
  }

  /**
   * Get recent location history for a user
   */
  async getLocationHistory(limit = 100): Promise<LocationRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('location_history')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(row => ({
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        timestamp: row.recorded_at,
        speed: row.speed,
        heading: row.heading,
      }));
    } catch (e) {
      console.error('Failed to get location history:', e);
      return [];
    }
  }
}

// Export singleton instance
export const mobileIntelligence = new MobileIntelligenceService();
