

## Architecture Audit & Gap Analysis + Autonomous Vulnerability Defense System

### Part 1: Architecture Gaps Found

After thorough codebase scan, here are the real issues:

#### Critical Stubs & Non-Functional Code

1. **`opsec-vulnerability-analyzer/index.ts`** — Returns hardcoded `{ overallRisk: "low", vulnerabilities: [], recommendations: [] }`. Does zero actual analysis. This is a stub that the `counter-intel-scan` workflow depends on.

2. **`differential-sync-engine/index.ts`** — Contains placeholder comment: "This is a placeholder for the actual sync implementation."

3. **`intelligence-memory-router/index.ts`** — Network coverage hardcoded to `0` with comment "Phase 1: placeholder."

4. **`chrome-extension-bridge/index.ts`** — AI analysis fields marked as "placeholders" in types.

5. **Security router pattern** — All 14 routes in `security-router/index.ts` use the same generic pattern: send profile data to LLM, parse JSON response, store. The "red team engine" doesn't actually red-team anything — it asks an LLM to *describe* what a red team would find. Same for threat assessment, OPSEC, adversary profiling, etc.

6. **`zero-day-anomaly-detector`** — Despite its name, it only detects behavioral anomalies in communication/observation patterns. It has zero connection to actual CVE databases, exploit feeds, or vulnerability intelligence. It's a behavioral analytics tool mislabeled as a "zero-day detector."

#### Architectural Inconsistencies

7. **Mixed function styles** — Some functions use the Hono router pattern (`createRouter`/`withHandler`), others use raw `Deno.serve`/`serve`. The `opsec-vulnerability-analyzer`, `zero-day-anomaly-detector`, `agentic-rag`, `graph-reasoning`, `intelligence-verification`, and `agent-workflow` all bypass the router infrastructure.

8. **Duplicate auth patterns** — At least 3 different auth implementations: (a) `_shared/auth-handler.ts` via router middleware, (b) manual `supabase.auth.getUser(token)` + service role check, (c) `hoc-gateway` SHA-256 hash lookup. The standalone functions don't use the shared auth handler.

9. **`agent-workflow` auth gap** — It checks `token !== serviceKey && token !== HOC_API_KEY` but hpics_api_clients tokens won't match either. When called via `hoc-gateway`, gateway forwards with `serviceKey` so it works, but direct calls with hpics client tokens will fail.

10. **Missing error propagation in workflows** — The DAG executor in `agent-workflow` does `supabase.from('agent_workflow_runs').update(...).then(() => {})` — fire-and-forget with no error handling on progress updates.

### Part 2: Implementation Plan — Fix Architecture + Build Vulnerability Defense

#### Phase A: Fix Critical Stubs (4 items)

**A1. Replace `opsec-vulnerability-analyzer` stub with real analysis**
- Read actual profile data, contact methods, social accounts, communication patterns
- Analyze OPSEC exposure: public data leakage, social media correlation, email domain security, metadata exposure
- Use AI to synthesize findings into structured vulnerability report
- Wire through `security-router/opsec` route (it already routes there but currently reaches the stub)

**A2. Standardize standalone functions to use shared auth**
- Update `agentic-rag`, `graph-reasoning`, `intelligence-verification` to use `_shared/auth-handler.ts` dual-auth pattern instead of manual auth code
- Ensures consistent hpics client token validation across all entry points

**A3. Fix `agent-workflow` auth to accept hpics client tokens**
- Add SHA-256 hash lookup against `hpics_api_clients` table (same pattern as gateway)
- Or document that it must always be called through the gateway

**A4. Fix `zero-day-anomaly-detector` naming honesty**
- Keep behavioral anomaly detection as-is (it's genuinely useful)
- Add a new, real vulnerability intelligence component (Phase B below)

#### Phase B: Autonomous Vulnerability Defense System (new capability)

This is the major new feature — a real vulnerability intelligence and red team execution framework.

**B1. Create `vulnerability-intelligence/index.ts` edge function**

Integrates with real, free-tier vulnerability intelligence APIs:

| Source | API | What It Provides |
|--------|-----|-----------------|
| NVD (NIST) | `GET https://services.nvd.nist.gov/rest/json/cves/2.0` | CVE details, CVSS scores, CPE matching |
| CISA KEV | `GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | Actively exploited vulnerabilities (no API key needed) |
| InTheWild | `GET https://inthewild.io/api/exploited` | Community-sourced exploitation evidence |
| Strobes VI | `GET https://intel.strobes.co/api/v1/cves` | 390K+ CVEs with EPSS predictions (free tier) |
| VulnCheck | API key required | Exploit intelligence, PoC references |
| Exploit-DB | `GET https://exploit-db.com/search` | Public exploits and PoC code |
| GitHub Advisory | `GET https://api.github.com/advisories` | Security advisories |

Capabilities:
- Query by platform keyword (whatsapp, facebook, instagram, chrome, ios, android)
- Filter by CVSS severity, exploited-in-wild status, recency
- Auto-aggregate from multiple feeds
- Return structured vulnerability reports with remediation steps

**B2. Create `red-team-executor/index.ts` edge function**

An AI-powered red team scenario builder that:
1. Takes a vulnerability (CVE ID or description) + target platform (e.g., "WhatsApp on iPhone 15")
2. Uses AI to research the exploit chain, attack surface, and prerequisites
3. Generates a structured attack scenario: entry vector, exploitation steps, persistence, exfiltration
4. Generates the corresponding defense plan: patches, configuration changes, monitoring rules
5. Creates an executable checklist for agents to verify the patch/mitigation
6. Tracks execution status in a new `red_team_scenarios` table

**B3. Create `device-security-scanner/index.ts` edge function**

Personal device/account security auditor:
1. Accepts a device inventory (phone model, OS version, installed apps with versions)
2. Queries NVD/CISA KEV for matching CVEs against the device's CPE identifiers
3. Checks account security: 2FA status, password reuse indicators, app permissions
4. Returns prioritized vulnerability report with exact patch actions
5. Can be scheduled to run periodically (daily/weekly)

**B4. New `vulnerability-defense` workflow in `agent-workflow`**

A new DAG workflow:
```
vulnerability-scan → cve-matching → risk-assessment → red-team-scenario → patch-plan → agent-assignment
```

Agents can call:
```json
{ "action": "run-workflow", "command": "vulnerability-defense", 
  "params": { "platforms": ["whatsapp", "instagram", "chrome"], "deviceInfo": {...} } }
```

**B5. Database: `vulnerability_intel` + `red_team_scenarios` + `device_inventory` tables**

```sql
-- Cached vulnerability intelligence
CREATE TABLE public.vulnerability_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cve_id text NOT NULL,
  platform text,
  cvss_score numeric,
  epss_score numeric,
  is_exploited_in_wild boolean DEFAULT false,
  source text,
  description text,
  remediation text,
  exploit_references jsonb DEFAULT '[]',
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cve_id)
);

-- Red team scenarios generated and tracked
CREATE TABLE public.red_team_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cve_id text,
  target_platform text NOT NULL,
  attack_scenario jsonb NOT NULL,
  defense_plan jsonb NOT NULL,
  agent_assigned text,
  status text DEFAULT 'pending',
  execution_notes jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- User device inventory for continuous scanning
CREATE TABLE public.device_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL,
  os_name text,
  os_version text,
  installed_apps jsonb DEFAULT '[]',
  last_scanned_at timestamptz,
  vulnerability_count int DEFAULT 0,
  risk_level text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);
```

**B6. Update gateway ROUTE_MAP**

Add new tools to `hoc-gateway`:
- `vulnerability-scan` → vulnerability-intelligence
- `red-team-scenario` → red-team-executor
- `device-security-scan` → device-security-scanner
- `workflow-vulnerability-defense` → agent-workflow

Add `vulnerability` category to CATEGORIES.

**B7. Update `.lovable/plan.md`**

Mark Tier 3 items and add Tier 4: Autonomous Vulnerability Defense.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/vulnerability-intelligence/index.ts` | Real CVE/exploit feed aggregator (NVD, CISA KEV, InTheWild, Strobes) |
| `supabase/functions/red-team-executor/index.ts` | AI-powered attack scenario builder + defense plan generator |
| `supabase/functions/device-security-scanner/index.ts` | Device/account vulnerability scanner against CVE databases |
| Migration SQL | `vulnerability_intel`, `red_team_scenarios`, `device_inventory` tables with RLS |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/opsec-vulnerability-analyzer/index.ts` | Replace stub with real OPSEC analysis using profile data |
| `supabase/functions/agent-workflow/index.ts` | Add `vulnerability-defense` workflow DAG |
| `supabase/functions/hoc-gateway/index.ts` | Add vulnerability tools to ROUTE_MAP |
| `.lovable/plan.md` | Update with Tier 3/4 status |

### Research Summary: Trustworthy Vulnerability Sources (2026)

For autonomous zero-day detection, these are the verified, authoritative sources:

1. **CISA KEV** (free, no key) — U.S. government's authoritative list of actively exploited vulnerabilities. JSON feed auto-updates. The single most important feed for "what's being exploited right now."

2. **NVD API v2.0** (free, API key optional for higher rate limits) — Complete CVE database with CVSS scores, CPE matching, and change history. Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=whatsapp`

3. **InTheWild.io** (free, community-sourced) — Tracks exploitation evidence from multiple contributors. Open-source exploited vulnerability feed.

4. **Strobes VI** (free tier, 390K+ CVEs) — Enriched CVE data with EPSS scores (Exploit Prediction Scoring System), which predicts the probability of exploitation in the next 30 days. More useful than CVSS alone.

5. **VulnCheck** (API key required, free tier available) — 2026 Exploit Intelligence Report publisher. Provides PoC availability data, exploit maturity, and threat actor mapping.

6. **GitHub Security Advisories** (free) — `GET https://api.github.com/advisories` — Covers open-source library vulnerabilities.

7. **Exploit-DB/SearchSploit** (free) — Public exploit and PoC repository. Useful for understanding attack mechanics.

For WhatsApp/Facebook/Instagram specifically: Recent CVEs include **CVE-2025-55177** (WhatsApp zero-click RCE on iOS/macOS), **CVE-2026-3909** (Chrome/Skia in KEV). The system will auto-track these by querying NVD with platform keywords.

