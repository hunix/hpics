# HPICS User Guide

> Step-by-Step Instructions for Getting Started and Daily Use

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [First Steps](#first-steps)
3. [Contact Management](#contact-management)
4. [Running Intelligence Analysis](#running-intelligence-analysis)
5. [Using AGIS Phases](#using-agis-phases)
6. [Hardware Setup](#hardware-setup)
7. [Mobile Installation](#mobile-installation)
8. [Automation & Campaigns](#automation--campaigns)
9. [Security Best Practices](#security-best-practices)
10. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Account Creation

1. Navigate to the HPICS login page
2. Click "Sign Up" to create a new account
3. Enter your email and create a strong password
4. Verify your email address
5. Complete the onboarding questionnaire

### First Login

1. After verification, log in with your credentials
2. You'll be taken to the Dashboard
3. Review the quick tour highlighting key features
4. Set your initial preferences in Settings

### Understanding the Interface

**Navigation Structure:**
```
├── Dashboard (Home)
├── Command Center
│   ├── Command Hub
│   ├── Ultimate Command
│   └── AGIS Command
├── Intelligence
│   ├── Intelligence Hub
│   ├── Network Intelligence
│   ├── Psychology Intelligence
│   └── [20+ Intelligence Modules]
├── Contacts
│   ├── Contact List
│   ├── Groups
│   └── Relationships
├── Analysis
│   ├── Media Analysis
│   ├── Video Analysis
│   └── Bulk Analysis
├── Hardware
│   └── Hardware Command
├── Security
│   └── Security Center
└── Settings
```

---

## First Steps

### Step 1: Configure Your Profile

1. Go to **Settings > Profile**
2. Add your profile information
3. Set your notification preferences
4. Configure your timezone and locale

### Step 2: Set AI Preferences

1. Go to **Settings > AI Models**
2. Review available AI models
3. Select preferred models for each analysis type
4. Set your AI budget limits (optional)

### Step 3: Configure Security

1. Go to **Settings > Security**
2. Enable two-factor authentication
3. Review access permissions
4. Set your clearance level preferences

---

## Contact Management

### Adding Your First Contact

1. Navigate to **Contacts** in the sidebar
2. Click the **"+ Add Contact"** button
3. Enter basic information:
   - Name (required)
   - Email or phone (recommended)
   - Profile photo (optional)
4. Click **"Create Contact"**

### Enriching Contact Profiles

**Basic Information Tab:**
- Add personal details (DOB, gender, nationality)
- Add contact methods (phones, emails, addresses)
- Add professional information (company, title)

**Relationships Tab:**
- Click **"Add Relationship"**
- Search for existing contacts
- Select relationship type (family, friend, colleague, etc.)
- Add relationship details

**Communications Tab:**
- View all communications with this contact
- Add new communications manually
- Import from email or messaging platforms

**Timeline Tab:**
- Add life events (education, career, moves)
- Track important milestones
- View chronological history

**Biometrics Tab:**
- Enroll face samples (minimum 3 angles)
- Record voice samples (10+ seconds)
- Capture other biometric data

### Using Groups and Tags

**Creating a Group:**
1. Go to **Contacts > Groups**
2. Click **"Create Group"**
3. Name your group
4. Add contacts manually or via filters
5. Save the group

**Applying Tags:**
1. Open any contact profile
2. Find the Tags section
3. Type to search or create tags
4. Tags are automatically saved

**Smart Filtering:**
1. In the contact list, click **"Filters"**
2. Combine multiple criteria:
   - Groups
   - Tags
   - Date ranges
   - Field values
3. Save filters for reuse

---

## Running Intelligence Analysis

### Quick Analysis (Single Contact)

1. Open a contact profile
2. Click **"Analyze"** button in header
3. Select analysis type:
   - Personality Assessment
   - Communication Patterns
   - Network Position
   - Risk Assessment
4. Wait for AI processing (10-30 seconds)
5. View results in the Analysis tab

### Media Analysis

1. Navigate to **Analysis > Media Analysis**
2. Click **"Upload"** or drag files
3. Supported formats: JPG, PNG, PDF, DOCX
4. Select analysis types:
   - Face detection/recognition
   - Text extraction (OCR)
   - Object detection
   - Metadata extraction
5. Associate with contacts (optional)
6. Click **"Analyze"**
7. Review results and save findings

### Video Analysis

1. Navigate to **Analysis > Video Analysis**
2. Upload video file (MP4, MOV, AVI)
3. Select analysis depth:
   - Quick scan (key frames only)
   - Standard (1 fps)
   - Deep (all frames)
4. Enable tracking options:
   - Face tracking
   - Person tracking
   - Event detection
5. Start analysis and monitor progress
6. Review timeline of detected elements

### Bulk Analysis

1. Navigate to **Analysis > Bulk Analysis**
2. Upload multiple files (up to 100)
3. Select analysis types to apply
4. Review cost estimate
5. Start batch processing
6. Monitor progress in queue
7. Export results when complete

---

## Using AGIS Phases

### Understanding the Framework

AGIS (Absolute General Intelligence System) consists of 18 phases plus a master orchestration layer. Each phase builds on previous capabilities.

**Progression:**
```
Phase 1  → Core Intelligence (foundation)
Phase 2  → Tactical Superiority (negotiation)
Phase 3  → Cognitive Warfare (motivation)
Phase 4  → Ultimate Dominion (influence)
Phase 5  → Omniscient Command (automation)
...
Phase 18 → Omega Absolute (total synthesis)
Phase 19 → Master Orchestration (cross-phase)
```

### Accessing Phase Features

1. Navigate to **Intelligence > AGIS Phases**
2. Select the desired phase
3. View available capabilities
4. Run phase-specific analyses
5. Review insights and recommendations

### Phase 1: Core Intelligence

**Available Features:**
- Baseline behavioral analysis
- Communication pattern detection
- Initial deception indicators
- Hypnotic language generation

**How to Use:**
1. Select a contact
2. Go to Phase 1 analysis
3. Run "Core Profile" assessment
4. Review behavioral baseline
5. Use insights for approach planning

### Phase 5: Omniscient Command

**Available Features:**
- Autonomous campaign creation
- Cascade trigger configuration
- Network warfare operations
- Self-executing actions

**How to Use:**
1. Navigate to Phase 5 dashboard
2. Create a new autonomous operation
3. Define trigger conditions
4. Set action sequences
5. Configure success criteria
6. Activate and monitor

### Phase 19: Master Orchestration

**Available Features:**
- Cross-phase health monitoring
- Cascade event management
- Global state optimization
- Synergy detection

**How to Use:**
1. Navigate to AGIS Command
2. View phase health matrix
3. Configure cascade rules
4. Monitor cross-phase events
5. Optimize based on recommendations

---

## Hardware Setup

### Raspberry Pi Hub Setup

1. **Hardware Requirements:**
   - Raspberry Pi 4 (4GB+ RAM)
   - MicroSD card (32GB+)
   - Power supply
   - Network connection

2. **Software Installation:**
   - Flash HPICS Hub image to SD card
   - Boot Raspberry Pi
   - Connect to network
   - Access setup wizard at `http://hpics-hub.local`

3. **Registration:**
   - Log in with HPICS credentials
   - Register hub in Hardware Command
   - Configure device connections
   - Test connectivity

### Adding Hardware Devices

**Flipper Zero:**
1. Enable Bluetooth on Flipper
2. In Hardware Command, click "Add Device"
3. Select "Flipper Zero"
4. Follow pairing instructions
5. Configure capture settings

**FLIR Thermal Camera:**
1. Connect FLIR to local network
2. In Hardware Command, click "Add Device"
3. Select "FLIR Thermal"
4. Enter device IP address
5. Configure monitoring zones

**DJI Drone:**
1. Ensure drone is on same network
2. In Hardware Command, click "Add Device"
3. Select drone model
4. Enter DJI credentials
5. Test connection and controls

### Creating Automation Rules

1. Go to **Hardware Command > Automation**
2. Click **"Create Rule"**
3. Define trigger:
   - Device event (detection, alert)
   - Schedule (time-based)
   - Condition (threshold)
4. Define actions:
   - Capture media
   - Send alert
   - Trigger other device
   - Update contact
5. Save and activate rule

---

## Mobile Installation

### PWA Installation (iOS)

1. Open Safari on your iOS device
2. Navigate to HPICS web app
3. Tap the Share button
4. Select "Add to Home Screen"
5. Name the app and tap "Add"
6. Open from home screen
7. Log in with credentials

### PWA Installation (Android)

1. Open Chrome on your Android device
2. Navigate to HPICS web app
3. Tap the menu (three dots)
4. Select "Install App" or "Add to Home Screen"
5. Confirm installation
6. Open from app drawer
7. Log in with credentials

### Enabling Background Intelligence

1. Open HPICS mobile app
2. Go to **Settings > Mobile Intelligence**
3. Enable desired services:
   - Location tracking
   - Proximity detection
   - Motion sensing
4. Grant required permissions
5. Configure collection parameters
6. Review privacy implications

---

## Automation & Campaigns

### Creating an Autonomous Campaign

1. Navigate to **Intelligence > Autonomous Campaigns**
2. Click **"New Campaign"**
3. Configure basics:
   - Campaign name
   - Target contact or group
   - Objective description
4. Set phases:
   - Phase 1: Initial approach
   - Phase 2: Build rapport
   - Phase 3: Influence action
5. Define triggers:
   - Time-based
   - Response-based
   - Event-based
6. Set success criteria
7. Review and activate

### Monitoring Campaign Progress

1. Open campaign from list
2. View current phase status
3. Review action history
4. Check outcome metrics
5. Adjust parameters if needed
6. Pause or stop if necessary

### Setting Up Automation Rules

1. Go to **Settings > Automation**
2. Click **"Create Rule"**
3. Select trigger type:
   - Contact event
   - Time schedule
   - System condition
4. Define conditions
5. Select actions
6. Test and activate

---

## Security Best Practices

### Account Security

| Practice | Implementation |
|----------|---------------|
| Strong Password | 12+ characters, mixed case, symbols |
| 2FA Enabled | Enable in Settings > Security |
| Session Review | Check active sessions regularly |
| Secure Logout | Always logout from shared devices |

### Data Protection

| Practice | Implementation |
|----------|---------------|
| Sensitive Data | Enable encryption for sensitive fields |
| Access Control | Use clearance levels appropriately |
| Audit Review | Check audit logs for anomalies |
| Backup | Export important data regularly |

### Operational Security

| Practice | Implementation |
|----------|---------------|
| Need-to-Know | Only access what you need |
| Compartmentalization | Separate sensitive operations |
| Counter-Intel | Monitor for reconnaissance |
| Clean Desk | Lock screen when away |

---

## Tips & Tricks

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New contact |
| `Ctrl/Cmd + /` | Keyboard shortcuts help |
| `Esc` | Close modal/dialog |

### Power User Features

1. **Bulk Actions:**
   - Select multiple contacts with checkboxes
   - Use bulk action menu for mass updates

2. **Saved Searches:**
   - Complex filters can be saved
   - Quick access from search dropdown

3. **Quick Notes:**
   - Use `@` to mention contacts
   - Use `#` to add tags inline

4. **Export Options:**
   - Export to PDF for reports
   - Export to CSV for data analysis
   - Export to JSON for backup

### Common Workflows

**Daily Intelligence Review:**
1. Check Dashboard for priority items
2. Review new alerts and notifications
3. Check campaign progress
4. Review pending approvals
5. Update contact interactions

**New Contact Onboarding:**
1. Create contact with basic info
2. Enroll biometrics if available
3. Map known relationships
4. Run initial analysis
5. Assign to relevant groups
6. Set up monitoring rules

**Pre-Meeting Preparation:**
1. Open contact profile
2. Review recent communications
3. Check psychological profile
4. Review network position
5. Generate talking points
6. Set post-meeting reminders

---

*For complete feature details, see [FEATURES_CATALOG.md](./FEATURES_CATALOG.md)*  
*For strategic benefits, see [BENEFITS_GUIDE.md](./BENEFITS_GUIDE.md)*
