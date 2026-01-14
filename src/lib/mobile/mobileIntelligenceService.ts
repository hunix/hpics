/**
 * Mobile Intelligence Service
 * Passive environmental intelligence gathering from mobile devices
 */

import { supabase } from "@/integrations/supabase/client";

export interface AmbientAudioIntelligence {
  timestamp: string;
  environment_type: 'office' | 'home' | 'public' | 'vehicle' | 'outdoor' | 'unknown';
  noise_level_db: number;
  speaker_count_estimate: number;
  emotional_atmosphere: 'tense' | 'neutral' | 'positive' | 'energetic' | 'subdued';
  detected_keywords: string[];
  language_detected: string;
  confidence: number;
}

export interface ProximityIntelligence {
  timestamp: string;
  nearby_devices: {
    device_hash: string;
    signal_strength: number;
    first_seen: string;
    duration_seconds: number;
    device_type_guess: 'phone' | 'laptop' | 'wearable' | 'iot' | 'unknown';
  }[];
  location_context: {
    wifi_networks: number;
    bluetooth_devices: number;
    estimated_density: 'sparse' | 'moderate' | 'crowded';
  };
}

export interface DigitalExhaustData {
  app_usage_patterns: {
    app_category: string;
    active_duration_minutes: number;
    session_count: number;
    engagement_depth: number;
  }[];
  typing_patterns: {
    average_speed_wpm: number;
    error_rate: number;
    pause_patterns: 'consistent' | 'irregular' | 'stressed';
    time_of_day_preference: string;
  };
  scroll_behavior: {
    average_scroll_depth: number;
    content_dwell_time_seconds: number;
    interaction_rate: number;
  };
  touch_dynamics: {
    average_pressure: number;
    touch_accuracy: number;
    gesture_preference: 'tap' | 'swipe' | 'mixed';
  };
}

export interface MobileIntelligenceState {
  isCollecting: boolean;
  lastUpdate: string | null;
  ambientAudio: AmbientAudioIntelligence | null;
  proximity: ProximityIntelligence | null;
  digitalExhaust: DigitalExhaustData | null;
  batteryOptimized: boolean;
}

class MobileIntelligenceCollector {
  private state: MobileIntelligenceState = {
    isCollecting: false,
    lastUpdate: null,
    ambientAudio: null,
    proximity: null,
    digitalExhaust: null,
    batteryOptimized: true,
  };

  private collectionIntervalId: number | null = null;
  private listeners: Set<(state: MobileIntelligenceState) => void> = new Set();

  /**
   * Start passive intelligence collection
   */
  async startCollection(options: {
    collectAudio?: boolean;
    collectProximity?: boolean;
    collectDigitalExhaust?: boolean;
    intervalSeconds?: number;
  } = {}): Promise<void> {
    const {
      collectAudio = false,
      collectProximity = true,
      collectDigitalExhaust = true,
      intervalSeconds = 60,
    } = options;

    if (this.state.isCollecting) {
      console.log('Collection already in progress');
      return;
    }

    this.state.isCollecting = true;
    this.notifyListeners();

    // Initial collection
    await this.collectIntelligence({
      audio: collectAudio,
      proximity: collectProximity,
      digitalExhaust: collectDigitalExhaust,
    });

    // Set up periodic collection
    this.collectionIntervalId = window.setInterval(async () => {
      await this.collectIntelligence({
        audio: collectAudio,
        proximity: collectProximity,
        digitalExhaust: collectDigitalExhaust,
      });
    }, intervalSeconds * 1000);
  }

  /**
   * Stop intelligence collection
   */
  stopCollection(): void {
    if (this.collectionIntervalId) {
      clearInterval(this.collectionIntervalId);
      this.collectionIntervalId = null;
    }
    this.state.isCollecting = false;
    this.notifyListeners();
  }

  /**
   * Perform intelligence collection cycle
   */
  private async collectIntelligence(options: {
    audio: boolean;
    proximity: boolean;
    digitalExhaust: boolean;
  }): Promise<void> {
    const timestamp = new Date().toISOString();

    if (options.proximity) {
      this.state.proximity = await this.collectProximityIntelligence();
    }

    if (options.digitalExhaust) {
      this.state.digitalExhaust = await this.collectDigitalExhaust();
    }

    if (options.audio) {
      this.state.ambientAudio = await this.collectAmbientAudioIntelligence();
    }

    this.state.lastUpdate = timestamp;
    this.notifyListeners();

    // Store collected intelligence
    await this.storeIntelligence();
  }

  /**
   * Collect proximity intelligence from nearby devices
   */
  private async collectProximityIntelligence(): Promise<ProximityIntelligence> {
    // In a real implementation, this would use:
    // - Bluetooth LE scanning via @capacitor-community/bluetooth-le
    // - WiFi scanning where available
    // - Background geolocation

    const mockDevices = [];
    const deviceCount = Math.floor(Math.random() * 10) + 2;

    for (let i = 0; i < deviceCount; i++) {
      mockDevices.push({
        device_hash: `device_${Math.random().toString(36).substr(2, 9)}`,
        signal_strength: -1 * (40 + Math.floor(Math.random() * 60)),
        first_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        duration_seconds: Math.floor(Math.random() * 3600),
        device_type_guess: ['phone', 'laptop', 'wearable', 'iot', 'unknown'][
          Math.floor(Math.random() * 5)
        ] as any,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      nearby_devices: mockDevices,
      location_context: {
        wifi_networks: Math.floor(Math.random() * 15) + 3,
        bluetooth_devices: deviceCount,
        estimated_density: deviceCount > 8 ? 'crowded' : deviceCount > 4 ? 'moderate' : 'sparse',
      },
    };
  }

  /**
   * Collect digital exhaust from app usage patterns
   */
  private async collectDigitalExhaust(): Promise<DigitalExhaustData> {
    // In a real implementation, this would collect from:
    // - Screen time APIs
    // - App usage statistics
    // - Input monitoring

    return {
      app_usage_patterns: [
        {
          app_category: 'social',
          active_duration_minutes: Math.floor(Math.random() * 60) + 10,
          session_count: Math.floor(Math.random() * 20) + 1,
          engagement_depth: Math.random() * 0.5 + 0.3,
        },
        {
          app_category: 'productivity',
          active_duration_minutes: Math.floor(Math.random() * 120) + 30,
          session_count: Math.floor(Math.random() * 10) + 1,
          engagement_depth: Math.random() * 0.4 + 0.5,
        },
        {
          app_category: 'communication',
          active_duration_minutes: Math.floor(Math.random() * 90) + 15,
          session_count: Math.floor(Math.random() * 30) + 5,
          engagement_depth: Math.random() * 0.3 + 0.6,
        },
      ],
      typing_patterns: {
        average_speed_wpm: Math.floor(Math.random() * 40) + 30,
        error_rate: Math.random() * 0.1,
        pause_patterns: ['consistent', 'irregular', 'stressed'][
          Math.floor(Math.random() * 3)
        ] as any,
        time_of_day_preference: Math.random() > 0.5 ? 'morning' : 'evening',
      },
      scroll_behavior: {
        average_scroll_depth: Math.random() * 0.4 + 0.3,
        content_dwell_time_seconds: Math.floor(Math.random() * 30) + 5,
        interaction_rate: Math.random() * 0.3 + 0.1,
      },
      touch_dynamics: {
        average_pressure: Math.random() * 0.5 + 0.3,
        touch_accuracy: Math.random() * 0.2 + 0.8,
        gesture_preference: ['tap', 'swipe', 'mixed'][
          Math.floor(Math.random() * 3)
        ] as any,
      },
    };
  }

  /**
   * Collect ambient audio intelligence (requires permission)
   */
  private async collectAmbientAudioIntelligence(): Promise<AmbientAudioIntelligence> {
    // In a real implementation, this would:
    // - Use Web Audio API or native audio capture
    // - Process audio for speaker diarization
    // - Analyze emotional tone
    // - Detect keywords (with privacy considerations)

    return {
      timestamp: new Date().toISOString(),
      environment_type: ['office', 'home', 'public', 'vehicle', 'outdoor', 'unknown'][
        Math.floor(Math.random() * 6)
      ] as any,
      noise_level_db: Math.floor(Math.random() * 50) + 30,
      speaker_count_estimate: Math.floor(Math.random() * 5) + 1,
      emotional_atmosphere: ['tense', 'neutral', 'positive', 'energetic', 'subdued'][
        Math.floor(Math.random() * 5)
      ] as any,
      detected_keywords: [],
      language_detected: 'en',
      confidence: Math.random() * 0.3 + 0.6,
    };
  }

  /**
   * Store collected intelligence to backend
   */
  private async storeIntelligence(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('app_settings').upsert({
        user_id: user.id,
        setting_key: 'mobile_intelligence_latest',
        setting_value: JSON.stringify({
          proximity: this.state.proximity,
          digitalExhaust: this.state.digitalExhaust,
          ambientAudio: this.state.ambientAudio,
          timestamp: this.state.lastUpdate,
        }),
        metadata: {
          collection_type: 'mobile_intelligence',
          battery_optimized: this.state.batteryOptimized,
        },
      }, {
        onConflict: 'user_id,setting_key',
      });
    } catch (error) {
      console.error('Failed to store mobile intelligence:', error);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: MobileIntelligenceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState(): MobileIntelligenceState {
    return { ...this.state };
  }

  /**
   * Infer user state from collected data
   */
  inferUserState(): {
    likely_activity: string;
    stress_level: 'low' | 'moderate' | 'high';
    social_context: 'alone' | 'small_group' | 'large_group';
    attention_state: 'focused' | 'distracted' | 'idle';
    recommendations: string[];
  } {
    const proximity = this.state.proximity;
    const digitalExhaust = this.state.digitalExhaust;
    const audio = this.state.ambientAudio;

    // Infer social context from proximity
    const nearbyCount = proximity?.nearby_devices.length || 0;
    const socialContext = nearbyCount > 6 ? 'large_group' : nearbyCount > 2 ? 'small_group' : 'alone';

    // Infer stress from typing patterns
    const typingStress = digitalExhaust?.typing_patterns.pause_patterns === 'stressed';
    const stressLevel = typingStress ? 'high' : 
      (audio?.emotional_atmosphere === 'tense' ? 'moderate' : 'low');

    // Infer attention from app usage
    const productivityTime = digitalExhaust?.app_usage_patterns
      .find(p => p.app_category === 'productivity')?.active_duration_minutes || 0;
    const socialTime = digitalExhaust?.app_usage_patterns
      .find(p => p.app_category === 'social')?.active_duration_minutes || 0;
    
    const attentionState = productivityTime > socialTime * 2 ? 'focused' : 
      socialTime > productivityTime ? 'distracted' : 'idle';

    // Generate recommendations
    const recommendations: string[] = [];
    if (stressLevel === 'high') {
      recommendations.push('Consider taking a break to reduce stress');
    }
    if (attentionState === 'distracted' && socialContext === 'alone') {
      recommendations.push('Good time for focused work - minimal social distractions');
    }
    if (socialContext === 'large_group') {
      recommendations.push('In social setting - good opportunity for networking');
    }

    return {
      likely_activity: this.inferActivity(digitalExhaust, audio),
      stress_level: stressLevel,
      social_context: socialContext,
      attention_state: attentionState,
      recommendations,
    };
  }

  private inferActivity(
    digitalExhaust: DigitalExhaustData | null,
    audio: AmbientAudioIntelligence | null
  ): string {
    if (!digitalExhaust) return 'unknown';

    const topCategory = [...(digitalExhaust.app_usage_patterns || [])]
      .sort((a, b) => b.active_duration_minutes - a.active_duration_minutes)[0];

    if (!topCategory) return 'idle';

    switch (topCategory.app_category) {
      case 'productivity': return 'working';
      case 'social': return 'socializing';
      case 'communication': return 'messaging';
      case 'entertainment': return 'relaxing';
      default: return 'active';
    }
  }
}

// Singleton instance
export const mobileIntelligence = new MobileIntelligenceCollector();
