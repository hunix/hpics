# IMPORTANT: Supabase Types File Too Large

## Problem
The current `types.ts` file is **1.1MB (33,326 lines)** which is causing:
- Slow IDE performance
- Slow TypeScript compilation
- Large bundle size
- Difficult maintenance

## Recommended Solution

**Use Supabase CLI to regenerate types with proper organization:**

```bash
# Option 1: Generate fresh types (recommended)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > temp-types.ts

# Option 2: If using local dev
npx supabase gen types typescript --local > temp-types.ts
```

Then manually split the generated types into domain-specific files as outlined in the implementation plan.

## Alternative: Manual Splitting Script

If you prefer to keep the current massive file, create a script to split it:

```typescript
// scripts/split-types.ts
import * as fs from 'fs';

const content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf-8');

// Parse and split by table groups
// This would need custom logic to parse the TypeScript type definitions

// For now, the file is too large to split manually in a single session
```

## Immediate Workaround

Keep the current types.ts file but:
1. Exclude it from IDE indexing (add to `.vscode/settings.json`)
2. Only import specific types you need
3. Consider using type guards instead of full type imports

```json
// .vscode/settings.json
{
  "typescript.tsserver.maxTsServerMemory": 8192,
  "files.exclude": {
    "**/src/integrations/supabase/types.ts": true
  }
}
```

## Action Required

**Decision needed**: 
1. Regenerate types from Supabase (clean slate)
2. Create splitting script
3. Use workaround and deal with performance

For production apps, **Option 1 (regenerate) is strongly recommended**.
