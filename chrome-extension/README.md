# Intel CRM Chrome Extension

Capture social media profiles directly to your Intel CRM with one click.

## Supported Platforms

- **Instagram** - Profiles, posts, stats
- **LinkedIn** - Profiles, experience, about
- **Threads** - Profiles, bio
- **X (Twitter)** - Profiles, follower counts

## Installation

### Developer Mode (Recommended for testing)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder from this project
5. The extension icon should appear in your toolbar

### Create Icons

Before loading, create placeholder icons in the `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Or use any image editing tool to create simple icons.

## Configuration

1. Click the extension icon in Chrome toolbar
2. Enter your **API Endpoint**:
   ```
   https://yibszncvwmefwamayfty.supabase.co/functions/v1/chrome-extension-bridge
   ```
3. Enter your **Auth Token** (get this from your Intel CRM settings)
4. Click **Save & Connect**

## Usage

1. Navigate to any supported social media profile
2. A floating **Capture** button appears in the bottom-right corner
3. Click to capture the profile data
4. Data is automatically synced to your Intel CRM

## Settings

- **Auto-capture**: Automatically capture when visiting a profile
- **Capture comments**: Include comments in the capture
- **Capture likes**: Include likes data
- **Deep scrape**: Capture all posts (may take longer)

## How It Works

1. **Content Script** detects when you're on a supported platform
2. **Profile Extraction** parses the page for relevant data
3. **Background Worker** manages storage and server sync
4. **Edge Function** processes and stores data in your database

## Troubleshooting

### Extension not working?
- Make sure you're on a profile page (not home/explore)
- Check that the URL matches a supported platform
- Verify your API endpoint and auth token are correct

### Data not syncing?
- Check the connection status in the popup
- Verify your auth token hasn't expired
- Look for errors in the browser console (F12 → Console)

### Button not appearing?
- Refresh the page
- Check if the extension is enabled in `chrome://extensions/`
- Some pages may block content scripts

## Privacy

- All data is captured locally first
- Sync only happens to YOUR Intel CRM instance
- No data is sent to third parties
- You control what gets captured via settings
