/**
 * Hardware Intelligence Platform Types
 * Extended with GPU compute, AI laptop, and mobile edge device support
 */

export type DeviceType = 
  // Field devices
  | 'flipper_zero'
  | 'raspberry_pi'
  | 'arduino'
  | 'drone'
  | 'thermal_camera'
  | 'spectrum_analyzer'
  | 'gopro'
  | 'metal_detector'
  | 'sensor_node'
  | 'sdr'
  | 'dji_mic'
  // GPU Compute devices (NEW)
  | 'gpu_workstation'    // Desktop GPUs (RTX 3090Ti, RTX Titan, etc.)
  | 'gpu_datacenter'     // Data center GPUs (RTX Pro 6000, A100, H100)
  // High-performance compute (NEW)
  | 'ai_laptop'          // Gaming/workstation laptops with dedicated GPU
  // Mobile edge devices (NEW)
  | 'tablet_ios'         // iPad with Neural Engine (M-series)
  | 'tablet_android'     // Android tablets with NPU (Snapdragon, MediaTek)
  | 'phone_android';     // Android phones with NPU

export type MissionType =
  | 'surveillance'
  | 'counter_surveillance'
  | 'reconnaissance'
  | 'signal_collection'
  | 'thermal_sweep'
  | 'aerial_recon'
  | 'perimeter_monitoring'
  | 'tscm_sweep';

export type MissionStatus = 'planned' | 'active' | 'paused' | 'completed' | 'aborted';

export type ThreatLevel = 'clear' | 'low' | 'medium' | 'high' | 'critical';

export type SignalType = 'sub_ghz' | 'nfc' | 'rfid' | 'infrared' | 'bluetooth' | 'wifi' | 'cellular' | 'unknown';

export interface HardwareDevice {
  id: string;
  user_id: string;
  device_type: DeviceType;
  device_id: string;
  device_name: string | null;
  device_model: string | null;
  firmware_version: string | null;
  capabilities: Record<string, unknown>;
  configuration: Record<string, unknown>;
  location: { lat: number; lng: number; accuracy?: number } | null;
  location_name: string | null;
  last_seen_at: string | null;
  is_online: boolean;
  battery_level: number | null;
  signal_strength: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GPUMetrics {
  vram_gb: number;
  vram_used_gb?: number;
  cuda_cores?: number;
  tensor_cores?: number;
  gpu_utilization?: number;
  temperature_celsius?: number;
  power_watts?: number;
  compute_capability?: string;
}

export interface HardwareTelemetry {
  id: string;
  device_id: string;
  user_id: string;
  telemetry_type: string;
  data: Record<string, unknown>;
  location: { lat: number; lng: number } | null;
  priority: 'low' | 'normal' | 'high' | 'critical';
  processed: boolean;
  recorded_at: string;
}

export interface IntelligenceMission {
  id: string;
  user_id: string;
  mission_name: string;
  mission_type: MissionType;
  target_profile_id: string | null;
  target_location: { lat: number; lng: number } | null;
  target_location_name: string | null;
  target_radius_meters: number | null;
  devices_assigned: string[];
  parameters: Record<string, unknown>;
  automation_rules: Record<string, unknown>;
  status: MissionStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduled_start: string | null;
  started_at: string | null;
  completed_at: string | null;
  findings: Record<string, unknown>;
  summary: string | null;
  threat_level: ThreatLevel | null;
  created_at: string;
  updated_at: string;
}

export interface MissionEvent {
  id: string;
  mission_id: string;
  user_id: string;
  device_id: string | null;
  event_type: 'started' | 'paused' | 'resumed' | 'detection' | 'alert' | 'capture' | 'note' | 'completed';
  event_data: Record<string, unknown>;
  location: { lat: number; lng: number } | null;
  severity: 'info' | 'warning' | 'alert' | 'critical';
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface HardwareCommand {
  id: string;
  device_id: string;
  user_id: string;
  mission_id: string | null;
  command_type: string;
  command_data: Record<string, unknown>;
  priority: number;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed' | 'timeout';
  sent_at: string | null;
  acknowledged_at: string | null;
  completed_at: string | null;
  response: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  expires_at: string | null;
  created_at: string;
}

export interface RFSignalCapture {
  id: string;
  user_id: string;
  device_id: string | null;
  mission_id: string | null;
  signal_type: SignalType;
  frequency_hz: number | null;
  bandwidth_hz: number | null;
  protocol: string | null;
  modulation: string | null;
  signal_strength_dbm: number | null;
  raw_data_url: string | null;
  decoded_data: Record<string, unknown> | null;
  device_fingerprint: Record<string, unknown> | null;
  associated_profile_id: string | null;
  threat_classification: 'benign' | 'suspicious' | 'hostile' | 'unknown' | null;
  analysis: Record<string, unknown> | null;
  location: { lat: number; lng: number } | null;
  location_name: string | null;
  captured_at: string;
}

export interface ThermalCapture {
  id: string;
  user_id: string;
  device_id: string | null;
  mission_id: string | null;
  raw_thermal_url: string | null;
  processed_image_url: string | null;
  overlay_image_url: string | null;
  detected_signatures: Array<{
    type: string;
    temp_celsius: number;
    bounding_box: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  ambient_temperature_celsius: number | null;
  min_temperature_celsius: number | null;
  max_temperature_celsius: number | null;
  occupancy_count: number | null;
  heat_anomalies: Array<Record<string, unknown>>;
  analysis: Record<string, unknown> | null;
  associated_profile_id: string | null;
  location: { lat: number; lng: number } | null;
  location_name: string | null;
  captured_at: string;
}

export interface SensorNode {
  id: string;
  user_id: string;
  hardware_device_id: string | null;
  node_address: string;
  node_name: string | null;
  node_type: 'arduino' | 'esp32' | 'raspberry_pi_pico' | null;
  sensors: Array<{
    type: string;
    pin: number;
    calibration?: Record<string, unknown>;
    unit?: string;
  }>;
  location: { lat: number; lng: number } | null;
  location_description: string | null;
  zone_name: string | null;
  battery_level: number | null;
  solar_voltage: number | null;
  signal_strength: number | null;
  last_reading_at: string | null;
  is_active: boolean;
  alert_rules: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface TSCMSweep {
  id: string;
  user_id: string;
  mission_id: string | null;
  sweep_name: string | null;
  location_name: string | null;
  location: { lat: number; lng: number } | null;
  location_bounds: Record<string, unknown> | null;
  sweep_type: 'rf' | 'thermal' | 'nljd' | 'visual' | 'acoustic' | 'comprehensive';
  devices_used: string[];
  rf_findings: Array<Record<string, unknown>>;
  thermal_findings: Array<Record<string, unknown>>;
  acoustic_findings: Array<Record<string, unknown>>;
  visual_findings: Array<Record<string, unknown>>;
  threat_level: ThreatLevel | null;
  overall_findings: Record<string, unknown>;
  recommendations: Array<string>;
  sweep_duration_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Device capability definitions
export const DEVICE_CAPABILITIES: Record<DeviceType, string[]> = {
  // Field devices
  flipper_zero: ['sub_ghz', 'nfc', 'rfid', 'infrared', 'badusb', 'gpio'],
  raspberry_pi: ['compute', 'gpio', 'camera', 'audio', 'networking', 'storage'],
  arduino: ['gpio', 'sensors', 'actuators', 'serial', 'lora'],
  drone: ['flight', 'camera', 'gps', 'gimbal', 'waypoint', 'rtk'],
  thermal_camera: ['thermal_imaging', 'temperature', 'radiometry'],
  spectrum_analyzer: ['rf_analysis', 'spectrum_scan', 'signal_decode'],
  gopro: ['video', 'photo', 'livestream', 'stabilization'],
  metal_detector: ['metal_detection', 'discrimination', 'depth_estimation'],
  sensor_node: ['environmental', 'motion', 'contact', 'vibration'],
  sdr: ['rf_receive', 'rf_transmit', 'spectrum_analysis', 'demodulation'],
  dji_mic: ['audio_capture', 'wireless', 'dual_channel', 'recording'],
  
  // GPU Compute devices
  gpu_workstation: ['cuda', 'tensor_cores', 'vram_large', 'local_inference', 'batch_processing', 'video_encode', 'nvenc'],
  gpu_datacenter: ['cuda', 'tensor_cores', 'vram_massive', 'multi_gpu', 'fp4_inference', 'fp8_inference', 'rag_hosting', 'llm_hosting'],
  
  // High-performance compute
  ai_laptop: ['cuda', 'portable', 'field_ops', 'local_inference', 'usb_power', 'display', 'networking'],
  
  // Mobile edge devices
  tablet_ios: ['neural_engine', 'coreml', 'edge_inference', 'camera', 'audio_capture', 'lidar', 'usb_c'],
  tablet_android: ['snpe', 'nnapi', 'edge_inference', 'camera', 'audio_capture', 's_pen', 'dex'],
  phone_android: ['snpe', 'nnapi', 'always_on', 'gps', 'camera', 'audio_capture', '5g', 'uwb'],
};

export const DEVICE_ICONS: Record<DeviceType, string> = {
  flipper_zero: 'Cpu',
  raspberry_pi: 'Server',
  arduino: 'CircuitBoard',
  drone: 'Plane',
  thermal_camera: 'Thermometer',
  spectrum_analyzer: 'Radio',
  gopro: 'Camera',
  metal_detector: 'Search',
  sensor_node: 'Wifi',
  sdr: 'Antenna',
  dji_mic: 'Mic',
  // GPU Compute
  gpu_workstation: 'Gpu',
  gpu_datacenter: 'Server',
  // High-performance compute
  ai_laptop: 'Laptop',
  // Mobile edge
  tablet_ios: 'Tablet',
  tablet_android: 'Tablet',
  phone_android: 'Smartphone',
};

// GPU-specific metadata templates
export const GPU_SPECS: Record<string, GPUMetrics> = {
  'RTX 3090Ti': { vram_gb: 24, cuda_cores: 10752, tensor_cores: 336, compute_capability: '8.6' },
  'RTX Titan': { vram_gb: 24, cuda_cores: 4608, tensor_cores: 576, compute_capability: '7.5' },
  'RTX Pro 6000 Blackwell': { vram_gb: 96, cuda_cores: 18432, tensor_cores: 576, compute_capability: '10.0' },
  'RTX 4090': { vram_gb: 24, cuda_cores: 16384, tensor_cores: 512, compute_capability: '8.9' },
  'A100': { vram_gb: 80, cuda_cores: 6912, tensor_cores: 432, compute_capability: '8.0' },
  'H100': { vram_gb: 80, cuda_cores: 16896, tensor_cores: 528, compute_capability: '9.0' },
};

// Device categories for UI grouping
export type DeviceCategory = 'field' | 'gpu_compute' | 'mobile_edge' | 'all';

export const DEVICE_CATEGORIES: Record<DeviceCategory, DeviceType[]> = {
  field: ['flipper_zero', 'raspberry_pi', 'arduino', 'drone', 'thermal_camera', 'spectrum_analyzer', 'gopro', 'metal_detector', 'sensor_node', 'sdr', 'dji_mic'],
  gpu_compute: ['gpu_workstation', 'gpu_datacenter', 'ai_laptop'],
  mobile_edge: ['tablet_ios', 'tablet_android', 'phone_android'],
  all: ['flipper_zero', 'raspberry_pi', 'arduino', 'drone', 'thermal_camera', 'spectrum_analyzer', 'gopro', 'metal_detector', 'sensor_node', 'sdr', 'dji_mic', 'gpu_workstation', 'gpu_datacenter', 'ai_laptop', 'tablet_ios', 'tablet_android', 'phone_android'],
};
