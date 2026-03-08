# HPICS Coding Conventions

> **Purpose**: Canonical patterns for AI-assisted code generation. Reference this file to produce consistent, correct code.

---

## 1. Edge Function Invocation

```typescript
// ✅ CORRECT — use the typed adapter
import { invokeFunction } from '@/lib/api';
const { data } = await invokeFunction('mice-recruitment-analyzer', { body: { profileId } });

// ❌ WRONG — bypasses routing layer, causes double-hop through proxy
import { supabase } from '@/integrations/supabase/client';
await supabase.functions.invoke('mice-recruitment-analyzer', { body: { profileId } });
```

**Exception**: Direct `supabase.functions.invoke()` is OK when passing custom `headers` (e.g., service-role auth).

---

## 2. JSON Field Type Casting

All JSONB columns from Supabase queries return `Json | null`. Cast with double-assertion:

```typescript
// ✅ CORRECT
const result = data.vulnerability_map as unknown as VulnerabilityMap;
const items = data.results as unknown as AnalysisResult[];

// ❌ WRONG — TypeScript compile error
const result = data.vulnerability_map as VulnerabilityMap;
```

---

## 3. Error Handling

```typescript
// ✅ CORRECT — explicit instanceof check
try {
  await operation();
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed:', error.message);
  }
  throw error;
}

// ❌ WRONG — error may not have .message
catch (error) {
  console.error('Failed:', error.message);
}
```

---

## 4. Type Imports

```typescript
// ✅ CORRECT — use modular helpers
import type { Profile, AiAnalysis } from '@/types/database-helpers';

// ❌ WRONG — imports 35k-line file, kills IDE performance
import type { Database } from '@/integrations/supabase/types';
```

---

## 5. Event Listener Cleanup (Sensors/Motion)

```typescript
// ✅ CORRECT — store reference for exact removal
const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

const startListening = () => {
  const handler = (e: DeviceMotionEvent) => { /* ... */ };
  handlerRef.current = handler;
  window.addEventListener('devicemotion', handler);
};

useEffect(() => {
  return () => {
    if (handlerRef.current) {
      window.removeEventListener('devicemotion', handlerRef.current);
      handlerRef.current = null;
    }
  };
}, []);

// ❌ WRONG — useCallback identity changes break removeEventListener
const handler = useCallback((e) => { /* depends on state */ }, [state]);
window.addEventListener('devicemotion', handler);
// later: removeEventListener gets a DIFFERENT function reference
```

---

## 6. Barrel Exports

```typescript
// ✅ CORRECT — explicit named exports
export { ProfileCard } from './ProfileCard';
export { useProfileService } from './useProfileService';
export type { ProfileProps } from './types';

// ❌ WRONG — re-exports everything, kills IDE
export * from './ProfileCard';
```

---

## 7. Database Table Name Mapping

See `docs/SCHEMA_MAP.md` for authoritative column names. Key traps:

| Concept | Wrong Table | Correct Table |
|---------|-------------|---------------|
| Interactions | `interactions` | `contact_interaction_notes` |
| Notes | `notes` | `contact_interaction_notes` |
| Observations | `observations` | `contact_observations` |
| Relationships | `relationships` | `contact_relationships` |

---

## 8. Database Counter Updates

Never overwrite counters with literal values. Use the RPC:

```typescript
// ✅ CORRECT — atomic increment
await supabase.rpc('increment_automation_counters', {
  p_rule_id: ruleId,
  p_field: 'success_count'
});

// ❌ WRONG — overwrites, loses concurrent updates
await supabase.from('automation_rules').update({ success_count: 1 });
```

---

## 9. Hook Dependencies & Refs

When a callback is used as both an event handler AND an effect dependency, use a ref to break the cycle:

```typescript
// ✅ CORRECT
const getDataRef = useRef(getData);
getDataRef.current = getData;

useEffect(() => {
  getDataRef.current();
}, [trigger]); // stable — no function in deps

// ❌ WRONG — function recreates on every render, effect fires endlessly
useEffect(() => {
  getData();
}, [getData]);
```

---

## 10. File Naming

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `use-profile-service.ts` |
| Components | PascalCase | `ProfileCard.tsx` |
| Types | PascalCase | `ThreatLevel` |
| Variables | camelCase | `profileId` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_ATTEMPTS` |
| DB tables | snake_case plural | `contact_observations` |
| DB columns | snake_case | `job_title` |
| Edge functions | kebab-case | `behavioral-dna-sequencer` |
