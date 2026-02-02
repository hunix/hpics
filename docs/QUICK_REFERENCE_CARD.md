# HPICS Quick Reference Card
> **Version 3.8.0** | Print-Friendly 2-Page Guide

---

## System Overview

| Metric | Count |
|--------|-------|
| Database Tables | 508+ |
| Edge Functions | 407+ |
| AGIS Phases | 22 |
| Biometric Modalities | 7 |
| Analysis Types | 94+ |

---

## Key Navigation

| Path | Purpose |
|------|---------|
| `/dashboard` | Main command center |
| `/contacts` | Contact management |
| `/intelligence-hub` | AI analysis tools |
| `/network` | Relationship graph |
| `/agis/overview` | AGIS phase status |
| `/dossier` | Generate reports |

---

## AGIS Framework Summary

| Phase | Name | Focus |
|-------|------|-------|
| 1-3 | Core→Cognitive | Baseline, Tactics, MICE |
| 4-5 | Dominion→Command | Psychology, Autonomous |
| 6-10 | Reality→Mastery | Engineering, Transcendence |
| 11-18 | Omniversal→Omega | Advanced Synthesis |
| 19 | Orchestration | Cross-Phase Coordination |
| 20-22 | Transcendent→Genesis | Ultimate Operations |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Global search |
| `Cmd+N` | New contact |
| `Cmd+/` | AI chat |
| `Cmd+D` | Dashboard |
| `Cmd+Shift+A` | Quick analysis |

---

## Top Edge Functions

### Analysis
```
analyze-profile          # Full profile intel
analyze-behavioral       # Personality/patterns
ai-chat-query            # Natural language AI
rag-query-v3             # Semantic search
```

### Prediction
```
predict-churn-enhanced   # Relationship health
betrayal-likelihood-scorer   # Loyalty risk
breaking-point-calculator    # Stress threshold
life-sequence-predictor      # Life events
```

### Biometrics
```
extract-facial-biometrics    # Face embeddings
extract-voice-biometrics     # Voice signatures
match-biometrics             # Identity matching
cross-modal-fusion-realtime  # Multi-modal
```

### Operations
```
intelligence-session-runner  # 94-task sessions
autonomous-intelligence-orchestrator  # Auto ops
agis-cascade-orchestrator    # Cross-phase
generate-intelligence-dossier    # Reports
```

---

## Core Hooks

### Profile Domain
```typescript
import { 
  useProfile,
  useProfiles,
  useCreateProfile,
  useToggleFavorite
} from '@/domains/profile';
```

### Intelligence
```typescript
import { 
  useTacticalNegotiation,
  useMICEAnalysis,
  useBetrayalPrediction,
  useSacredValues
} from '@/hooks/intelligence/core';
```

### Warfare
```typescript
import { 
  useTraumaExploitation,
  useAutonomousOperations,
  useNetworkWarfare
} from '@/hooks/intelligence/warfare';
```

### Orchestration
```typescript
import { 
  useAGISGlobalState,
  useAGISCascade,
  useAGISAnalytics
} from '@/hooks/intelligence/orchestration';
```

---

## MICE Assessment Quick Guide

| Factor | Score High = | Look For |
|--------|--------------|----------|
| **M**oney | Financial pressure | Debt, lifestyle gaps |
| **I**deology | Strong beliefs | Political views, causes |
| **C**ompromise | Vulnerabilities | Secrets, mistakes |
| **E**go | Needs recognition | Status-seeking, pride |

---

## Biometric Modalities

| Modality | Dimensions | Best For |
|----------|------------|----------|
| Facial | 512-D | ID verification |
| Voice | 256-D | Phone/audio |
| Gait | 128-D | Surveillance |
| Keystroke | Variable | Ongoing auth |
| Signature | 64-D | Document auth |
| Body | 256-D | Physical ID |
| **Fusion** | Combined | 98%+ accuracy |

---

## Database Quick Reference

### Core Tables
```sql
profiles              -- Contact profiles
communications        -- Message history
contact_relationships -- Relationship links
groups / group_members -- Grouping
```

### Intelligence Tables
```sql
ai_analyses           -- All AI results
behavioral_predictions    -- Forecasts
action_recommendations    -- Suggested actions
mice_assessments          -- MICE scores
```

### AGIS Tables
```sql
agis_global_state     -- System state
agis_cascade_rules    -- Trigger config
agis_cascade_events   -- Execution history
```

---

## Common Query Patterns

### Get profile with analyses
```typescript
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    ai_analyses(*)
  `)
  .eq('id', profileId)
  .single();
```

### Recent communications
```typescript
const { data } = await supabase
  .from('communications')
  .select('*')
  .eq('profile_id', profileId)
  .order('occurred_at', { ascending: false })
  .limit(50);
```

### Run analysis
```typescript
await supabase.functions.invoke('analyze-profile', {
  body: { userId, profileId, analysisTypes: ['personality'] }
});
```

---

## Security Levels

| Level | Access | Color |
|-------|--------|-------|
| Unclassified | All users | 🟢 |
| Confidential | Verified | 🟡 |
| Secret | Elevated | 🟠 |
| Top Secret | Admin only | 🔴 |

---

## Rate Limits

| Type | Limit |
|------|-------|
| Standard queries | 100/min |
| AI analysis | 20/min |
| Biometric ops | 10/min |
| Bulk operations | 5/min |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Unauthorized |
| 403 | Insufficient clearance |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

## Dual-Auth Pattern

```typescript
// Standard edge function auth
const token = req.headers.get('Authorization')?.replace('Bearer ', '');
const isServiceRole = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!isServiceRole) {
  const { data: { user } } = await supabase.auth.getUser(token);
  userId = user?.id;
} else {
  userId = body.userId; // Trust body for service calls
}
```

---

## Hardware Devices

| Device | Function | Integration |
|--------|----------|-------------|
| Raspberry Pi | Hub | `hardware-gateway` |
| Flipper Zero | RF/NFC | `rf-signal-intelligence` |
| FLIR | Thermal | `mobile-sensor-intelligence` |
| DJI Drones | Aerial | `aerial-intelligence` |
| GoPro | Video | `gopro-intelligence` |
| RTL-SDR | SIGINT | `sdr-intelligence` |

---

## Quick Workflow Templates

### New Contact Analysis
1. Create profile → 2. Run `analyze-profile` → 3. Check dashboard

### Negotiation Prep
1. Load contact → 2. `useTacticalNegotiation` → 3. Review strategies

### Identity Verification
1. Capture biometric → 2. `match-biometrics` → 3. Review matches

### Threat Assessment
1. Create profile → 2. `assess-threat` → 3. Generate playbook

---

*HPICS v3.8.0 | For internal use only*
