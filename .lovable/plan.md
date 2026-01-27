
# Fix 30 Failed Edge Functions: Missing Dual Authentication Pattern

## Problem Summary

The intelligence session runner completed with **65 tasks succeeded** and **30 tasks failed**. All 30 failures share the same root cause:

**Authentication Mismatch**: The `intelligence-session-runner` calls child edge functions using the `SUPABASE_SERVICE_ROLE_KEY` in the Authorization header (line 806). However, the failing functions only validate tokens using `supabase.auth.getUser(token)`, which expects a **user JWT token** - not a service role key.

## Failure Pattern Analysis

| Error Message | Count | Cause |
|---------------|-------|-------|
| `HTTP 401: {"error":"Unauthorized"}` | 12 | `auth.getUser()` fails for service key |
| `HTTP 401: {"error":"Invalid authentication"}` | 6 | Same pattern |
| `HTTP 500: {"error":"Invalid user token"}` | 6 | Same pattern (thrown error) |
| `HTTP 500: {"success":false,"error":"Invalid token"}` | 6 | Same pattern (500 wrapper) |

## Working vs Failing Pattern Comparison

### Working Pattern (e.g., `mice-recruitment-analyzer`):
```typescript
const token = authHeader.replace('Bearer ', '');
const isServiceRoleCall = token === supabaseServiceKey;

if (isServiceRoleCall) {
  // Backend-to-backend call - trust userId from body
  userId = body.userId || body.user_id;
} else {
  // User call - validate JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return 401 error;
  userId = user.id;
}
```

### Failing Pattern (e.g., `relationship-half-life-calculator`):
```typescript
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
// FAILS: service role key is not a user token
if (authError || !user) {
  return 401 error; // Always fails for runner calls
}
```

## List of 30 Failing Edge Functions

All these functions need the dual authentication pattern added:

### v6.0 Advanced Intelligence (Priority 9) - 5 functions
1. `relationship-half-life-calculator`
2. `automated-red-team-engine`
3. `multi-party-deception-detector`
4. `zero-day-anomaly-detector`
5. `hypergame-theory-engine`

### v7.0 Extreme Intelligence (Priority 10) - 12 functions
6. `subvocalization-detector`
7. `audio-burst-analyzer`
8. `iio-attribution-engine`
9. `reflexive-control-detector`
10. `cognitive-effect-orchestrator`
11. `kallisti-theory-of-mind`
12. `collective-behavior-predictor`
13. `dark2clear-deanonymization`
14. `gated-biological-fusion`
15. `tas-com-community-detector` (skipped - 404)
16. `migration5-biometric-tracker`

### v8.0 Counter-Intelligence (Priority 11) - 8 functions
17. `draco-deception-orchestrator`
18. `sentient-intent-analyzer`
19. `insider-threat-matrix-engine`
20. `bayesian-intention-predictor`
21. `red-team-adversary-simulator`
22. `semafor-forgery-detector`
23. `epistemic-vulnerability-scanner`
24. `cognitive-iw-detector`

### v8.0 Biometric & Network (Priority 13) - 8 functions
25. `pupillometry-analyzer`
26. `thermal-stress-detector`
27. `attention-multimodal-fuser`
28. `keystroke-dynamics-analyzer`
29. `sheaf-neural-influence-mapper`
30. `ctdg-link-predictor`
31. `cascade-virality-predictor`
32. `network-resilience-analyzer`

### Voice Intelligence Aggregate (Priority 15) - 1 function
33. `aggregate-voice-intelligence`

## Solution

For each failing function, replace the authentication block with the dual-auth pattern:

```typescript
// Before (failing):
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'No authorization header' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
const userId = user.id;

// After (fixed):
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'No authorization header' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const body = await req.json();
const token = authHeader.replace('Bearer ', '');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const isServiceRoleCall = token === supabaseServiceKey;

let userId: string;
if (isServiceRoleCall) {
  // Backend-to-backend call from intelligence-session-runner
  userId = body.userId || body.user_id;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required for service calls' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} else {
  // Direct user call - validate JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  userId = user.id;
}
```

## Implementation Order

Due to the large number of files (30+), I recommend fixing them in priority batches:

### Batch 1: Critical Voice & Aggregation (5 functions)
- `aggregate-voice-intelligence` (blocks voice data in dossier)
- `audio-burst-analyzer`
- `subvocalization-detector`
- `linguistic-stress-detector`
- `voice-stress-correlator`

### Batch 2: v6.0 Advanced (5 functions)
- `relationship-half-life-calculator`
- `automated-red-team-engine`
- `multi-party-deception-detector`
- `zero-day-anomaly-detector`
- `hypergame-theory-engine`

### Batch 3: v7.0 Intelligence (7 functions)
- `iio-attribution-engine`
- `reflexive-control-detector`
- `cognitive-effect-orchestrator`
- `kallisti-theory-of-mind`
- `collective-behavior-predictor`
- `dark2clear-deanonymization`
- `gated-biological-fusion`

### Batch 4: v8.0 Counter-Intelligence (8 functions)
- `draco-deception-orchestrator`
- `sentient-intent-analyzer`
- `insider-threat-matrix-engine`
- `bayesian-intention-predictor`
- `red-team-adversary-simulator`
- `semafor-forgery-detector`
- `epistemic-vulnerability-scanner`
- `cognitive-iw-detector`

### Batch 5: v8.0 Biometric & Network (8 functions)
- `pupillometry-analyzer`
- `thermal-stress-detector`
- `attention-multimodal-fuser`
- `keystroke-dynamics-analyzer`
- `sheaf-neural-influence-mapper`
- `ctdg-link-predictor`
- `cascade-virality-predictor`
- `network-resilience-analyzer`

### Batch 6: Remaining (remaining functions)
- `migration5-biometric-tracker`
- Any other v8.0 Doctrine functions with same issue

## Additional Fix: Missing `tas-com-community-detector`

One function returned 404 (not deployed), which means the edge function folder doesn't exist. This needs to be created.

## Version Bump

After all fixes:
- Update `APP_VERSION` to `3.9.55`
- Add `3.9.54` to `FORCE_CLEAR_VERSIONS`
- Deploy all updated edge functions

## Expected Outcome

After implementing these fixes:
- All 94 tasks will execute successfully
- Voice intelligence aggregate will populate in dossier
- v6.0/v7.0/v8.0 analyses will be stored in `ai_analyses` table
- Mona's 791 voice insights will be aggregated
- Full 124-section dossier will be complete
