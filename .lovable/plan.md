
# Edge Function Comprehensive Audit - Phase 22 (Final Complete Scan)

## Executive Summary

After scanning **all 270+ edge functions** and related frontend components, I have identified the following remaining issues:

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| Error Handling (missing `instanceof Error`) | 25+ | Medium | Must Fix |
| Frontend Schema Mismatches | 3 | Medium | Must Fix |
| Edge Function (deep-analyze-capture bio/location) | 1 | Low | Context Valid |
| **Total Issues** | **30+** | - | - |

**Good News**: The critical schema issues in edge functions (`profile.email`, `profile.title`, `profile.name`, `profile.location` directly in DB queries) have already been fixed in Phase 20-21. The remaining issues are primarily error handling patterns and frontend display code.

---

## Phase 22A: Edge Function Error Handling Fixes (25 functions)

The following edge functions still use `error: any` or access `error.message` without proper `instanceof Error` guards:

| Function | Line | Issue |
|----------|------|-------|
| `send-email` | 113-116 | `error: any` and `error?.message` |
| `send-push-notification` | 203-208 | `error: any` and `error?.message` |
| `contact-ai-agent-v2` | 439-443 | `error: any` in tool execution |
| `extract-company-branding` | 113-117 | `error: any` and `error?.message` |
| `suggest-contact-groups` | 183-185 | `error: any` and `error?.message` |
| `detect-cross-patterns` | 301-317 | `error: any` and `error?.message` |
| `rag-query-v3` | 325-341 | `error: any` and `error?.message` |
| `generate-meeting-followup` | 131-133 | `error: any` and `error?.message` |
| `auto-embed-content` | 257-273 | `error: any` and `error?.message` |
| `rag-query` | catch block | `error: any` pattern |
| `rag-query-v2` | catch block | `error: any` pattern |
| `transcribe-audio` | catch block | `error: any` pattern |
| `transcribe-voice-note` | catch block | `error: any` pattern |
| `search-tavily` | catch block | `error: any` pattern |
| `search-news` | catch block | `error: any` pattern |
| `monitor-web-mentions` | catch block | `error: any` pattern |
| `link-social-identities` | catch block | `error: any` pattern |
| `infer-relationships` | catch block | `error: any` pattern |
| `import-gmail-contacts` | catch block | `error: any` pattern |
| `import-outlook-contacts` | catch block | `error: any` pattern |
| `financial-intelligence-scan` | catch block | `error: any` pattern |
| `dark-web-monitor` | catch block | `error: any` pattern |
| `chrome-extension-bridge` | catch block | `error: any` pattern |
| `behavioral-digital-twin` | catch block | `error: any` pattern |
| `behavioral-future-modeler` | catch block | `error: any` pattern |

**Standard Fix Pattern**:
```typescript
// BEFORE
} catch (error: any) {
  console.error('Error:', error);
  return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), ...);

// AFTER
} catch (error) {
  console.error('Error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new Response(JSON.stringify({ error: message }), ...);
```

---

## Phase 22B: Frontend Schema Fixes (3 files)

These frontend files reference columns that don't exist on the `profiles` table:

### 1. `src/components/dossier-preview/sections/CoreSections.tsx` (Lines 117-119)
**Issue**: References `profile.email`, `profile.phone`, `profile.location`
**Fix**: 
- `email` and `phone` → Fetch from `contact_methods` table and pass as props, or show "Contact methods not loaded"
- `location` → Use `profile.city` and `profile.country` with: ``[profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown'``

```typescript
// BEFORE
<KeyValueRow label="Email" value={profile.email || 'Not provided'} />
<KeyValueRow label="Phone" value={profile.phone || 'Not provided'} />
<KeyValueRow label="Location" value={profile.location || 'Unknown'} />

// AFTER
<KeyValueRow label="Email" value={contactMethods?.find(cm => cm.contact_type === 'email')?.value || 'Not provided'} />
<KeyValueRow label="Phone" value={contactMethods?.find(cm => cm.contact_type === 'phone')?.value || 'Not provided'} />
<KeyValueRow label="Location" value={[profile.city, profile.country].filter(Boolean).join(', ') || 'Unknown'} />
```

### 2. `src/components/contacts/MeetingBriefing.tsx` (Lines 178-185)
**Issue**: References `briefing.profile.name` and `briefing.profile.title`
**Fix**:
- `name` → Use ``\`${briefing.profile.first_name} ${briefing.profile.last_name}\`.trim()``
- `title` → Use `briefing.profile.job_title`

```typescript
// BEFORE
{briefing.profile.name.split(' ').map(n => n[0]).join('')}
<CardTitle>{briefing.profile.name}</CardTitle>
{briefing.profile.title && <span>{briefing.profile.title}</span>}

// AFTER  
{`${briefing.profile.first_name || ''} ${briefing.profile.last_name || ''}`.trim().split(' ').map(n => n[0]).join('')}
<CardTitle>{`${briefing.profile.first_name || ''} ${briefing.profile.last_name || ''}`.trim()}</CardTitle>
{briefing.profile.job_title && <span>{briefing.profile.job_title}</span>}
```

### 3. `src/components/intelligence/DataFreshnessPanel.tsx` (Line 217)
**Issue**: References `profile.name`
**Fix**: Use computed name from `first_name` and `last_name`

```typescript
// BEFORE
<div className="font-medium truncate">{profile.name}</div>

// AFTER
<div className="font-medium truncate">{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'}</div>
```

---

## Phase 22C: deep-analyze-capture Clarification

The `deep-analyze-capture` function (lines 271-273) uses `profile.bio`, `profile.location`, `profile.displayName` but this is **NOT a database schema issue**. This function processes raw JSON data from social media scrapes stored in `device_captures`, where these field names are valid in the scraped data structure. No fix required.

---

## Implementation Plan

### Step 1: Edge Function Error Handling (25 functions)
Fix all `error: any` patterns with `instanceof Error` guards.

**Priority order**:
1. `send-email` (user-facing email functionality)
2. `send-push-notification` (user-facing notifications)
3. `contact-ai-agent-v2` (AI agent tool execution)
4. `rag-query-v3`, `rag-query-v2`, `rag-query` (RAG pipeline)
5. `detect-cross-patterns` (intelligence pipeline)
6. Remaining 18 functions

### Step 2: Frontend Schema Fixes (3 files)
1. `CoreSections.tsx` - Add `contactMethods` prop or compute location
2. `MeetingBriefing.tsx` - Use `first_name`/`last_name` and `job_title`
3. `DataFreshnessPanel.tsx` - Use computed name

### Step 3: Deployment & Verification
1. Deploy all modified edge functions
2. Run health checks on each function
3. Verify TypeScript compilation passes
4. Test affected frontend components

---

## Summary Table

| Phase | Scope | Files | Changes |
|-------|-------|-------|---------|
| 22A | Error Handling | 25 edge functions | Replace `error: any` with `instanceof Error` guards |
| 22B | Frontend Schema | 3 components | Fix `name`→`first_name`/`last_name`, `title`→`job_title`, `location`→`city`/`country` |
| 22C | N/A | 0 | No changes (deep-analyze-capture is valid) |
| **Total** | **All** | **28 files** | |

---

## What's Already Fixed (Phase 20-21)

The following critical issues were already resolved:
- ✅ `entity-resolution-engine` - `location` → `city/country`
- ✅ `shadow-network-analyzer` - `location` → `city/country`
- ✅ `match-biometrics` - `name` → `first_name/last_name`
- ✅ `enrichment-orchestrator` - Removed `profile.email` references
- ✅ `enrich-hunter` - Store email in `contact_methods` instead of `profiles.email`
- ✅ `generate-intelligence-dossier` - Removed `|| profile.title` fallback
- ✅ 40+ error handling fixes across intelligence functions
