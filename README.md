# Welcome to your Lovable project

## IDE Performance Notes

The `src/integrations/supabase/types.ts` file is auto-generated and ~35,000 lines.
For better IDE performance:

1. **Import from helpers instead of types.ts:**
   ```typescript
   // ✅ Good - Import from database helpers
   import type { Profile, ContactRelationship } from '@/types/database-helpers';
   
   // ❌ Avoid - Direct import from large types file
   import type { Database } from '@/integrations/supabase/types';
   ```

2. **VS Code settings for large file exclusion:**
   ```json
   {
     "files.exclude": {
       "**/src/integrations/supabase/types.ts": true
     }
   }
   ```

3. **TypeScript memory settings (tsconfig.json is pre-configured)**

## Local development

Requirements: [Bun](https://bun.sh) >= 1.1.

```sh
bun install
cp .env.example .env   # then fill in Supabase URL/key and signup allowlist
bun run dev
```

Useful scripts:

- `bun run dev` — Vite dev server on <http://localhost:8080>
- `bun run build` — production build
- `bun run lint` — ESLint (currently warns on direct Supabase imports from
  components and pages; see `docs/MIGRATION_DDD_BACKLOG.md`)
- `bun run typecheck` — strict TypeScript check
- `bun run test:e2e` — Playwright smoke tests

## Tech stack

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- Supabase (Postgres, edge functions, auth)
- Capacitor (mobile), Electron (desktop), Chrome MV3 (extension)

## Architecture audit

See `docs/MIGRATION_DDD_BACKLOG.md` for the migration backlog and
`docs/SYSTEM_OVERVIEW.md` / `docs/AGIS_FRAMEWORK.md` for aspirational design
material (flagged as such — do not treat as ground truth).
