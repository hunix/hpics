

# New Version Detection & Update System

## Overview

Implement a complete version management system that:
1. Stores the latest published version in the database (`platform_config` table)
2. Periodically checks for new versions while the app is running
3. Shows a prominent but non-intrusive notification when updates are available
4. Clears all caches and reloads when the user clicks "Update"

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Version Detection Flow                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐      ┌──────────────────┐      ┌───────────────────────┐   │
│  │   Publish   │ ──── │  Update DB with  │ ──── │  app_published_version│   │
│  │   (Manual)  │      │  new version     │      │  in platform_config   │   │
│  └─────────────┘      └──────────────────┘      └───────────────────────┘   │
│                                                           │                  │
│                                                           ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Client-side (AppLayout)                          │    │
│  │  ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────┐│    │
│  │  │ useVersionCheck  │──▶│ Compare versions │──▶│ Show update banner││    │
│  │  │ (poll every 5min)│   │ APP_VERSION vs DB│   │ if mismatch found ││    │
│  │  └──────────────────┘   └──────────────────┘   └───────────────────┘│    │
│  │                                                        │             │    │
│  │                                                        ▼             │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐│    │
│  │  │ User clicks "Update" → clearAllCaches() → forceAppUpdate()      ││    │
│  │  └─────────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Store Published Version in Database

**Database Migration**: Add a platform config entry for the app version

```sql
INSERT INTO platform_config (config_key, config_value, category, display_name, description, value_type, default_value)
VALUES (
  'app_published_version',
  '"3.9.51"',
  'system',
  'Published App Version',
  'The currently published application version. Update this after each publish.',
  'string',
  '"3.9.51"'
)
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
```

### Phase 2: Create Version Check Hook

**File: `src/hooks/useServerVersionCheck.ts`** (new file)

A hook that:
- Polls the database every 5 minutes for the latest version
- Compares against the local `APP_VERSION` constant
- Returns state about whether an update is available
- Provides an `updateNow()` function that clears caches and reloads

```typescript
export function useServerVersionCheck(options?: {
  pollInterval?: number;  // default 300000ms (5 min)
  enabled?: boolean;      // default true
}) {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  // Query platform_config for app_published_version
  useEffect(() => {
    const checkVersion = async () => {
      const { data } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'app_published_version')
        .maybeSingle();
      
      if (data?.config_value) {
        const version = JSON.parse(data.config_value);
        setServerVersion(version);
        if (version !== APP_VERSION) {
          setHasNewVersion(true);
        }
      }
    };
    
    // Check immediately, then poll
    checkVersion();
    const interval = setInterval(checkVersion, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  const updateNow = useCallback(async () => {
    await forceAppUpdate();  // Uses existing function from appVersion.ts
  }, []);

  return { hasNewVersion, serverVersion, currentVersion: APP_VERSION, updateNow };
}
```

### Phase 3: Enhance NewVersionAvailable Component

**File: `src/components/reliability/NewVersionAvailable.tsx`**

Update to accept version information and use the proper cache clearing:

```typescript
interface NewVersionAvailableProps {
  onRefresh?: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'toast' | 'inline';
  className?: string;
  currentVersion?: string;
  newVersion?: string;
}

// In handleRefresh:
const handleRefresh = async () => {
  if (onRefresh) {
    onRefresh();
  } else {
    await forceAppUpdate();  // Use proper cache clearing
  }
};
```

### Phase 4: Integrate Banner into AppLayout

**File: `src/components/AppLayout.tsx`**

Add the version check hook and banner:

```typescript
import { useServerVersionCheck } from '@/hooks/useServerVersionCheck';
import { NewVersionAvailable } from '@/components/reliability/NewVersionAvailable';

export function AppLayout({ children, ... }) {
  const { hasNewVersion, serverVersion, currentVersion, updateNow } = useServerVersionCheck();
  // ...
  
  return (
    <SidebarProvider>
      {/* Show update banner above everything when new version detected */}
      {hasNewVersion && (
        <NewVersionAvailable
          variant="banner"
          currentVersion={currentVersion}
          newVersion={serverVersion || undefined}
          onRefresh={updateNow}
        />
      )}
      <div className="min-h-screen-mobile flex w-full">
        {/* ... rest of layout */}
      </div>
    </SidebarProvider>
  );
}
```

### Phase 5: Create Version Update Script/Instructions

Since this is a manual process each time you publish, provide two options:

**Option A: Manual Update After Publish**

After each publish:
1. Update `src/lib/appVersion.ts` - increment `APP_VERSION`
2. Run SQL to update database:
```sql
UPDATE platform_config 
SET config_value = '"3.9.52"' 
WHERE config_key = 'app_published_version';
```

**Option B: Edge Function to Update Version**

Create an edge function `update-app-version` that you can call after publishing:

```typescript
// POST /update-app-version
// Body: { version: "3.9.52" }
// Requires admin/service role authentication

const { version } = await req.json();
await supabase
  .from('platform_config')
  .update({ config_value: JSON.stringify(version) })
  .eq('config_key', 'app_published_version');
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Create | Add `app_published_version` to platform_config |
| `src/hooks/useServerVersionCheck.ts` | Create | Hook to poll database for latest version |
| `src/components/reliability/NewVersionAvailable.tsx` | Modify | Add version props, use forceAppUpdate |
| `src/components/AppLayout.tsx` | Modify | Integrate version check and banner |
| `supabase/functions/update-app-version/index.ts` | Create | Edge function to update published version |
| `src/lib/appVersion.ts` | Modify | Add function to sync version from server |

## User Experience Flow

1. **Developer publishes new version**:
   - Update `APP_VERSION` in code (e.g., 3.9.51 → 3.9.52)
   - Publish via Lovable
   - Update database: `app_published_version` = "3.9.52"

2. **User has app open with old version (3.9.51)**:
   - Every 5 minutes, hook queries database
   - Detects 3.9.52 > 3.9.51
   - Shows banner: "A new version (v3.9.52) is available"

3. **User clicks "Update Now"**:
   - `forceAppUpdate()` is called
   - Unregisters all service workers
   - Clears all Cache Storage
   - Clears sessionStorage and non-auth localStorage
   - Stores new version in localStorage
   - Reloads page with cache-bust query param

4. **App reloads fresh**:
   - Downloads new assets from server
   - `APP_VERSION` now matches server
   - No more banner shown

## Technical Notes

- The 5-minute poll interval balances freshness vs. database load
- Service worker `updatefound` event still works as backup detection
- Banner uses existing component with toast/banner/inline variants
- `forceAppUpdate()` already exists in `appVersion.ts` - reuse it
- Version stored in DB as JSON string (e.g., `"3.9.52"`) for type consistency

## Testing Steps

1. Deploy with version 3.9.52
2. Run SQL to set `app_published_version` = "3.9.52"
3. In an existing tab (running 3.9.51), wait 5 minutes or manually trigger check
4. Verify banner appears
5. Click "Update Now"
6. Verify caches cleared and app reloads with new version
7. Verify banner no longer appears after update

