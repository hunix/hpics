# HPICS Hardware Integration Guide

> Setup and Configuration for Supported Hardware Devices

---

## Table of Contents

1. [Overview](#overview)
2. [Raspberry Pi Hub](#raspberry-pi-hub)
3. [Flipper Zero](#flipper-zero)
4. [FLIR Thermal Cameras](#flir-thermal-cameras)
5. [DJI Drones](#dji-drones)
6. [GoPro Cameras](#gopro-cameras)
7. [Software Defined Radio (SDR)](#software-defined-radio-sdr)
8. [LoRa Sensor Network](#lora-sensor-network)
9. [Device Orchestration](#device-orchestration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Supported Devices

| Device Type | Models | Connection | Primary Use |
|-------------|--------|------------|-------------|
| Raspberry Pi | Pi 4, Pi 5 | Ethernet/WiFi | Central Hub |
| Flipper Zero | Standard | Bluetooth/USB | RF/NFC Intelligence |
| FLIR | Lepton, One Pro | USB/Network | Thermal Imaging |
| DJI Drones | Mini, Air, Mavic | WiFi/SDK | Aerial Surveillance |
| GoPro | Hero 9-12 | WiFi/USB | Covert Capture |
| SDR | RTL-SDR, HackRF | USB | Spectrum Monitoring |
| LoRa | Various | LoRaWAN | Sensor Network |

### Architecture

```
                    ┌─────────────────────┐
                    │    HPICS Cloud      │
                    │   (Web Interface)   │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │   Raspberry Pi Hub  │
                    │  (Local Coordinator)│
                    └──────────┬──────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        │          │           │           │          │
        ▼          ▼           ▼           ▼          ▼
   ┌─────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
   │ Flipper │ │  FLIR  │ │   DJI   │ │ GoPro  │ │  SDR   │
   │  Zero   │ │ Camera │ │  Drone  │ │ Camera │ │        │
   └─────────┘ └────────┘ └─────────┘ └────────┘ └────────┘
```

---

## Raspberry Pi Hub

### Purpose

The Raspberry Pi Hub serves as the central coordinator for all hardware devices, providing:
- Local device management
- Data preprocessing
- Real-time event handling
- Offline operation capability

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Model | Raspberry Pi 4 | Raspberry Pi 5 |
| RAM | 4GB | 8GB |
| Storage | 32GB microSD | 64GB+ SSD |
| Power | 15W USB-C | Official PSU |
| Network | WiFi | Ethernet + WiFi |

### Installation Steps

**1. Download Hub Image**
```bash
# Download from HPICS portal
wget https://hpics.app/downloads/hub-image-latest.img.gz
gunzip hub-image-latest.img.gz
```

**2. Flash to Storage**
```bash
# Using Raspberry Pi Imager or:
sudo dd if=hub-image-latest.img of=/dev/sdX bs=4M status=progress
```

**3. First Boot Configuration**
1. Insert storage and power on
2. Connect to `HPICS-Hub-Setup` WiFi
3. Open browser to `http://192.168.4.1`
4. Follow setup wizard:
   - Connect to your WiFi
   - Enter HPICS credentials
   - Configure timezone
   - Name your hub

**4. Verify Connection**
1. Log into HPICS web interface
2. Navigate to Hardware Command
3. Verify hub appears online
4. Test connectivity

### Hub Configuration

**Network Settings:**
```yaml
# /etc/hpics/network.yaml
wifi:
  ssid: "YourNetwork"
  password: "encrypted"
ethernet:
  dhcp: true
vpn:
  enabled: false
```

**Device Ports:**
```yaml
# /etc/hpics/devices.yaml
usb_devices:
  - port: /dev/ttyUSB0
    type: flipper
  - port: /dev/ttyUSB1
    type: sdr
bluetooth:
  enabled: true
  scan_interval: 30
```

---

## Flipper Zero

### Purpose

The Flipper Zero provides RF/NFC intelligence capabilities:
- Sub-GHz signal capture
- NFC/RFID reading
- Infrared analysis
- GPIO interfacing

### Supported Features

| Feature | Description | HPICS Integration |
|---------|-------------|-------------------|
| Sub-GHz RX | Capture RF signals | Signal database |
| Sub-GHz TX | Replay signals | Controlled testing |
| NFC/RFID | Read cards/tags | Identity correlation |
| Infrared | Capture IR codes | Device fingerprinting |
| BadUSB | USB HID attacks | Penetration testing |
| GPIO | Sensor interface | Custom sensors |

### Connection Setup

**Via Bluetooth:**
1. Enable Bluetooth on Flipper
2. In HPICS Hardware Command, click "Add Device"
3. Select "Flipper Zero"
4. Choose "Bluetooth" connection
5. Select Flipper from discovered devices
6. Confirm pairing on Flipper
7. Test connection

**Via USB (through Hub):**
1. Connect Flipper to Pi Hub via USB
2. Hub auto-detects Flipper
3. In Hardware Command, configure device
4. Test connection

### Signal Capture Configuration

```yaml
# Flipper capture settings
sub_ghz:
  frequencies:
    - 315000000  # 315 MHz
    - 433920000  # 433.92 MHz
    - 868000000  # 868 MHz
  capture_duration: 30  # seconds
  auto_save: true

nfc:
  scan_on_detect: true
  save_uid: true
  
rfid:
  protocols:
    - em4100
    - hid
    - indala
```

### Use Cases

| Use Case | Configuration | Expected Output |
|----------|--------------|-----------------|
| Vehicle Key Fob | Sub-GHz, 315/433 MHz | Signal patterns, device ID |
| Access Cards | NFC/RFID | Card UID, access logs |
| Garage Doors | Sub-GHz, rolling codes | Signal analysis |
| TV Remotes | Infrared | Device fingerprints |

---

## FLIR Thermal Cameras

### Purpose

FLIR cameras provide thermal intelligence:
- Occupancy detection
- Heat signature tracking
- Anomaly detection
- Environmental monitoring

### Supported Models

| Model | Resolution | Connection | Features |
|-------|------------|------------|----------|
| FLIR Lepton | 160×120 | USB/I2C | Compact, low power |
| FLIR One Pro | 160×120 | USB/Lightning | Mobile integration |
| FLIR Vue Pro | 640×512 | Ethernet | Drone mount |
| FLIR A-Series | 640×480 | Ethernet | Fixed installation |

### Connection Setup

**USB Camera:**
1. Connect FLIR to Pi Hub USB
2. Hub auto-detects thermal camera
3. Configure in Hardware Command
4. Set monitoring parameters

**Network Camera:**
1. Connect FLIR to network
2. Note IP address from FLIR menu
3. In Hardware Command, add device
4. Enter IP and credentials
5. Configure stream settings

### Monitoring Configuration

```yaml
# Thermal monitoring settings
camera:
  resolution: 640x480
  frame_rate: 9
  temperature_range:
    min: 0
    max: 150
    unit: celsius

detection:
  human_threshold: 32  # celsius
  vehicle_threshold: 40
  anomaly_detection: true
  
zones:
  - name: "Entry Zone"
    polygon: [[0,0], [100,0], [100,100], [0,100]]
    alert_on_presence: true
  - name: "Parking Area"
    polygon: [[200,0], [400,0], [400,200], [200,200]]
    alert_on_presence: false
```

### Alert Rules

| Trigger | Action | Description |
|---------|--------|-------------|
| Human Detected | Capture + Alert | Person enters zone |
| Vehicle Detected | Log + Capture | Vehicle heat signature |
| Temperature Spike | Alert | Anomaly detection |
| Zone Entry | Trigger Cascade | Coordinate with other devices |

---

## DJI Drones

### Purpose

DJI drones provide aerial reconnaissance capabilities:
- Waypoint missions
- Live video feed
- Automated capture
- Tracking operations

### Supported Models

| Model | Flight Time | Camera | SDK Support |
|-------|-------------|--------|-------------|
| Mini 3 Pro | 34 min | 4K/48MP | Mobile SDK |
| Air 3 | 46 min | 4K/48MP | Mobile SDK |
| Mavic 3 Pro | 43 min | 4K/20MP | Mobile SDK |
| Matrice 300 | 55 min | Multiple | Payload SDK |

### Connection Setup

1. Ensure drone and controller are on
2. Connect controller to same network as Hub
3. Enable SDK mode on controller
4. In Hardware Command, add DJI device
5. Enter DJI account credentials
6. Select drone from list
7. Test connection and controls

### Mission Planning

**Waypoint Mission:**
```yaml
mission:
  name: "Area Survey"
  type: waypoint
  waypoints:
    - lat: 37.7749
      lon: -122.4194
      altitude: 50
      action: hover_and_capture
    - lat: 37.7751
      lon: -122.4196
      altitude: 50
      action: video_start
    - lat: 37.7753
      lon: -122.4192
      altitude: 50
      action: video_stop
  settings:
    speed: 5  # m/s
    gimbal_pitch: -45
    heading_mode: auto
```

**Orbit Mission:**
```yaml
mission:
  name: "POI Orbit"
  type: orbit
  center:
    lat: 37.7749
    lon: -122.4194
  radius: 30  # meters
  altitude: 40
  speed: 3
  rotations: 2
  capture_interval: 5  # seconds
```

### Safety Configuration

| Setting | Recommended | Description |
|---------|-------------|-------------|
| Max Altitude | 120m | Legal limit in most areas |
| Return-to-Home | 50m | RTH altitude |
| Geofencing | Enabled | Respect no-fly zones |
| Low Battery RTH | 30% | Auto return threshold |

---

## GoPro Cameras

### Purpose

GoPro cameras enable covert capture with immediate analysis:
- Wearable recording
- Live streaming
- Quick capture-to-analysis
- Multi-camera coordination

### Supported Models

| Model | Resolution | Connection | Features |
|-------|------------|------------|----------|
| Hero 11 | 5.3K/60 | WiFi/USB | GPS, HyperSmooth |
| Hero 12 | 5.3K/60 | WiFi/USB | GPS, HDR |
| Max | 5.6K/360 | WiFi/USB | 360° capture |

### Connection Setup

1. Enable WiFi on GoPro
2. Connect Pi Hub to GoPro WiFi
3. In Hardware Command, add GoPro
4. Enter WiFi password
5. Configure camera settings
6. Test capture

### Remote Control

**Camera Settings:**
```yaml
gopro:
  resolution: 4k
  frame_rate: 60
  field_of_view: wide
  stabilization: auto
  
capture:
  mode: video  # photo, video, timelapse
  duration: 0  # 0 = manual stop
  
streaming:
  enabled: true
  protocol: rtmp
  destination: "rtmp://hub.local/live"
```

### Automated Triggers

| Trigger | Action | Use Case |
|---------|--------|----------|
| Motion Detected | Start Recording | Surveillance |
| Time Schedule | Timelapse | Long-term monitoring |
| Hub Command | Capture Photo | On-demand |
| Cascade Event | Start Recording | Coordinated capture |

---

## Software Defined Radio (SDR)

### Purpose

SDR devices enable spectrum monitoring and signal intelligence:
- Frequency scanning
- Signal capture
- Protocol decoding
- TSCM sweeps

### Supported Devices

| Device | Frequency Range | Sample Rate | Use Case |
|--------|-----------------|-------------|----------|
| RTL-SDR | 24-1766 MHz | 2.4 MS/s | General monitoring |
| HackRF One | 1-6000 MHz | 20 MS/s | Wideband analysis |
| USRP B200 | 70-6000 MHz | 56 MS/s | Professional SIGINT |

### Connection Setup

1. Connect SDR to Pi Hub USB
2. Hub detects SDR device
3. Install required drivers (automatic)
4. Configure in Hardware Command
5. Set monitoring parameters

### Monitoring Configuration

```yaml
sdr:
  device: rtl-sdr
  sample_rate: 2400000
  gain: auto
  
scanning:
  mode: sweep
  ranges:
    - start: 88000000
      end: 108000000
      name: "FM Broadcast"
    - start: 433000000
      end: 434000000
      name: "ISM Band"
    - start: 462000000
      end: 467000000
      name: "FRS/GMRS"
  dwell_time: 0.5  # seconds per step
  
detection:
  threshold_db: -50
  save_captures: true
  decode_protocols:
    - am
    - fm
    - p25
    - dmr
```

### TSCM Sweep Configuration

```yaml
tscm:
  enabled: true
  schedule: "0 */4 * * *"  # Every 4 hours
  baseline_learning: 7  # days
  alert_deviation: 10  # dB above baseline
  
  ranges:
    - name: "WiFi"
      start: 2400000000
      end: 2500000000
    - name: "Cellular"
      start: 700000000
      end: 900000000
    - name: "Bluetooth"
      start: 2402000000
      end: 2480000000
```

---

## LoRa Sensor Network

### Purpose

LoRa sensors provide long-range, low-power environmental monitoring:
- Motion detection
- Environmental sensing
- Proximity alerts
- Distributed monitoring

### Supported Sensors

| Sensor Type | Range | Battery Life | Data |
|-------------|-------|--------------|------|
| Motion (PIR) | 10m | 2 years | Presence |
| Door/Window | N/A | 3 years | Open/Close |
| Temperature | N/A | 3 years | Temp/Humidity |
| GPS Tracker | N/A | 6 months | Location |

### Gateway Setup

1. Connect LoRa gateway to Pi Hub
2. Configure gateway frequency (US915, EU868, etc.)
3. Register gateway in Hardware Command
4. Add sensors to network

### Sensor Registration

```yaml
lora:
  gateway:
    model: "RAK7243"
    frequency: "US915"
    
  sensors:
    - device_eui: "A84041000181XXXX"
      name: "Front Door"
      type: door_sensor
      location: "Entry"
      
    - device_eui: "A84041000181YYYY"
      name: "Driveway Motion"
      type: pir
      location: "Exterior"
      
    - device_eui: "A84041000181ZZZZ"
      name: "Office Temp"
      type: temperature
      location: "Office"
```

### Alert Configuration

| Sensor Event | Alert Level | Action |
|--------------|-------------|--------|
| Door Open (Night) | High | Immediate notification + cascade |
| Motion Detected | Medium | Log + optional notification |
| Temperature Anomaly | Low | Log for review |
| Low Battery | Info | Maintenance notification |

---

## Device Orchestration

### Multi-Device Coordination

**Cascade Example: Perimeter Alert**
```yaml
cascade:
  name: "Perimeter Breach Response"
  trigger:
    device: motion_sensor_1
    event: motion_detected
    
  actions:
    - device: flir_camera
      action: start_recording
      delay: 0
      
    - device: gopro_1
      action: start_recording
      delay: 0
      
    - device: drone_1
      action: launch_mission
      mission: perimeter_survey
      delay: 30
      
    - notification:
      channel: push
      priority: high
      delay: 0
```

### Scheduling

```yaml
schedules:
  - name: "Night Watch"
    cron: "0 22 * * *"
    actions:
      - set_mode: surveillance
      - enable: thermal_monitoring
      - enable: motion_alerts
      
  - name: "Morning Stand-down"
    cron: "0 6 * * *"
    actions:
      - set_mode: normal
      - disable: motion_alerts
```

---

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Hub offline | Network issue | Check WiFi/Ethernet |
| Device not detected | USB/Bluetooth | Reconnect, check power |
| Delayed data | Network latency | Check bandwidth |
| Cascade not firing | Rule misconfiguration | Review trigger conditions |

### Diagnostic Commands

```bash
# Check hub status
hpics-cli status

# List connected devices
hpics-cli devices list

# Test device connection
hpics-cli devices test <device_id>

# View device logs
hpics-cli logs <device_id>

# Restart device service
hpics-cli devices restart <device_id>
```

### Log Locations

| Log | Path | Purpose |
|-----|------|---------|
| Hub | /var/log/hpics/hub.log | General hub operations |
| Devices | /var/log/hpics/devices/ | Per-device logs |
| Cascade | /var/log/hpics/cascade.log | Automation events |
| Network | /var/log/hpics/network.log | Connectivity issues |

---

*For complete feature details, see [FEATURES_CATALOG.md](./FEATURES_CATALOG.md)*  
*For usage instructions, see [USER_GUIDE.md](./USER_GUIDE.md)*
