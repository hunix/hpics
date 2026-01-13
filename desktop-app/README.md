# Desktop App (Electron)

This directory contains the Electron wrapper for the social intelligence platform.

## Features

- **Background Sync**: Runs in system tray, continuously syncing data
- **Native Notifications**: Desktop notifications for new intelligence
- **Quick Capture Hotkey**: Global hotkey (Ctrl+Shift+I) for quick capture
- **Auto-Start**: Option to launch on system boot

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the desktop-app directory:
```bash
cd desktop-app
```

2. Install dependencies:
```bash
npm install
```

3. Start in development mode:
```bash
npm start
```

### Building

For production builds:

**Windows:**
```bash
npm run make -- --platform=win32
```

**macOS:**
```bash
npm run make -- --platform=darwin
```

**Linux:**
```bash
npm run make -- --platform=linux
```

## Configuration

Edit `forge.config.js` to customize:
- App name and version
- Platform-specific settings
- Code signing (for distribution)
- Auto-update settings

## Architecture

```
desktop-app/
├── main.js           # Electron main process
├── preload.js        # Bridge script for web app
├── package.json      # Electron dependencies
├── forge.config.js   # Electron Forge build config
└── icons/            # App icons for all platforms
```

## Features Implementation

### System Tray
The app minimizes to system tray instead of closing, allowing continuous background sync.

### Global Hotkeys
- `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (macOS): Quick capture
- `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS): Force sync

### Native Notifications
Desktop notifications are triggered for:
- New social media posts detected
- Intelligence alerts
- Sync completion
