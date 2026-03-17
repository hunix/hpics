/**
 * Device Security Scanner (v1.0.0)
 * 
 * Personal device/account security auditor that:
 *   1. Accepts device inventory (phone model, OS version, apps)
 *   2. Queries NVD/CISA for matching CVEs via CPE identifiers
 *   3. Generates AI-powered security assessment
 *   4. Returns prioritized vulnerability report with patch actions
 *   5. Updates device_inventory table with scan results
 * 
 * @module device-security-scanner
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── CPE Generation ──────────────────────────────────────────────────────
function generateCPEKeywords(device: Record<string, unknown>): string[] {
  const keywords: string[] = [];
  const osName = ((device.os_name || device.osName) as string || '').toLowerCase();
  const osVersion = ((device.os_version || device.osVersion) as string || '');
  const manufacturer = ((device.manufacturer) as string || '').toLowerCase();
  const model = ((device.model) as string || '').toLowerCase();
  const apps = (device.installed_apps || device.installedApps || []) as Array<{ name: string; version?: string }>;

  // OS-based keywords
  if (osName.includes('ios') || osName.includes('iphone')) {
    keywords.push('apple ios');
    if (osVersion) keywords.push(`apple ios ${osVersion}`);
  } else if (osName.includes('android')) {
    keywords.push('google android');
    if (osVersion) keywords.push(`google android ${osVersion}`);
  } else if (osName.includes('macos') || osName.includes('mac os')) {
    keywords.push('apple macos');
    if (osVersion) keywords.push(`apple macos ${osVersion}`);
  } else if (osName.includes('windows')) {
    keywords.push('microsoft windows');
    if (osVersion) keywords.push(`microsoft windows ${osVersion}`);
  }

  // Manufacturer-specific
  if (manufacturer.includes('apple')) keywords.push('apple');
  if (manufacturer.includes('samsung')) keywords.push('samsung');
  if (manufacturer.includes('google')) keywords.push('google pixel');

  // App-based keywords
  for (const app of apps.slice(0, 10)) {
    const appName = (app.name || '').toLowerCase();
    if (appName.includes('whatsapp')) keywords.push('whatsapp');
    if (appName.includes('chrome')) keywords.push('google chrome');
    if (appName.includes('safari')) keywords.push('apple safari');
    if (appName.includes('telegram')) keywords.push('telegram');
    if (appName.includes('signal')) keywords.push('signal');
    if (appName.includes('instagram')) keywords.push('instagram');
    if (appName.includes('facebook')) keywords.push('facebook');
    if (appName.includes('firefox')) keywords.push('mozilla firefox');
    if (appName.includes('zoom')) keywords.push('zoom');
    if (appName.includes('slack')) keywords.push('slack');
  }

  return [...new Set(keywords)];
}

// ─── NVD Query ──────────────────────────────────────────────────────────
async function queryNVDForKeyword(keyword: string): Promise<Array<{
  cveId: string;
  description: string;
  cvssScore: number | null;
  severity: string;
  attackVector: string | null;
  published: string;
}>> {
  try {
    const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
    url.searchParams.set('keywordSearch', keyword);
    url.searchParams.set('resultsPerPage', '5');

    const resp = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!resp.ok) return [];

    const data = await resp.json();
    return (data.vulnerabilities || []).map((v: any) => {
      const cve = v.cve;
      const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || '';
      return {
        cveId: cve.id,
        description: desc.slice(0, 500),
        cvssScore: cvss?.baseScore ?? null,
        severity: cvss?.baseSeverity ?? 'UNKNOWN',
        attackVector: cvss?.attackVector ?? null,
        published: cve.published,
      };
    });
  } catch {
    return [];
  }
}

// ─── CISA KEV Check ─────────────────────────────────────────────────────
async function checkCISAKEV(cveIds: string[]): Promise<Set<string>> {
  const exploitedSet = new Set<string>();
  try {
    const resp = await fetch(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!resp.ok) return exploitedSet;
    const data = await resp.json();
    const kevCves = new Set((data.vulnerabilities || []).map((v: any) => v.cveID));
    for (const id of cveIds) {
      if (kevCves.has(id)) exploitedSet.add(id);
    }
  } catch {
    // Silently fail
  }
  return exploitedSet;
}

// ─── AI Security Assessment ─────────────────────────────────────────────
async function generateSecurityAssessment(
  device: Record<string, unknown>,
  vulnerabilities: any[],
  accounts: any[]
): Promise<Record<string, unknown>> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return { summary: 'AI assessment unavailable', recommendations: [] };

  const prompt = `You are a mobile device and account security specialist. Analyze this device and its vulnerabilities, then provide a security assessment.

DEVICE: ${JSON.stringify(device)}
VULNERABILITIES FOUND: ${JSON.stringify(vulnerabilities.slice(0, 20))}
ACCOUNTS: ${JSON.stringify(accounts)}

Respond with JSON:
{
  "overallRiskScore": 0-100,
  "riskLevel": "critical|high|medium|low",
  "summary": "brief risk assessment",
  "criticalFindings": ["most urgent issues"],
  "accountSecurity": {
    "twoFactorStatus": "assessment of 2FA coverage",
    "passwordRisks": ["identified risks"],
    "recommendations": ["specific account hardening steps"]
  },
  "deviceHardening": [
    {"action": "what to do", "priority": "critical|high|medium", "impact": "what this prevents"}
  ],
  "immediateActions": ["top 5 things to do right now"],
  "ongoingMonitoring": ["what to keep watching"]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate the security assessment now.' },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return { summary: 'AI assessment failed', recommendations: [] };

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // Fall through
  }

  return { summary: 'Assessment generation failed', recommendations: [] };
}

// ─── Main Handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'device-security-scanner', timestamp: Date.now() });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let userId: string;
    let body: Record<string, unknown>;

    if (token === serviceKey) {
      body = await req.json();
      userId = (body.userId || body.user_id) as string;
      if (!userId) return json({ error: 'Service role requires userId in body' }, 400);
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return json({ error: 'Unauthorized' }, 401);
      userId = user.id;
      body = await req.json().catch(() => ({}));
    }

    // Accept device info directly or by deviceId
    const deviceId = (body.deviceId || body.device_id) as string;
    let device: Record<string, unknown>;

    if (deviceId) {
      const { data: deviceRecord } = await supabase
        .from('device_inventory')
        .select('*')
        .eq('id', deviceId)
        .eq('user_id', userId)
        .single();

      if (!deviceRecord) return json({ error: 'Device not found' }, 404);
      device = deviceRecord as Record<string, unknown>;
    } else {
      device = (body.device || body) as Record<string, unknown>;
      if (!device.device_name && !device.deviceName && !device.os_name && !device.osName) {
        return json({ error: 'Missing device info. Provide deviceId or device object with os_name, os_version, installed_apps' }, 400);
      }
    }

    const accounts = (body.accounts || device.accounts || []) as any[];
    const keywords = generateCPEKeywords(device);

    // Query NVD for each keyword (rate-limited, sequential with small delay)
    const allVulns: any[] = [];
    for (const keyword of keywords.slice(0, 8)) { // Limit to 8 keywords to avoid rate limiting
      const results = await queryNVDForKeyword(keyword);
      allVulns.push(...results.map(v => ({ ...v, matchedKeyword: keyword })));
      // NVD rate limit: ~5 req/30s without API key
      if (keywords.length > 3) await new Promise(r => setTimeout(r, 1500));
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueVulns = allVulns.filter(v => {
      if (seen.has(v.cveId)) return false;
      seen.add(v.cveId);
      return true;
    });

    // Check CISA KEV for exploitation status
    const exploitedCves = await checkCISAKEV(uniqueVulns.map(v => v.cveId));
    const enrichedVulns = uniqueVulns.map(v => ({
      ...v,
      isExploitedInWild: exploitedCves.has(v.cveId),
    }));

    // Sort: exploited first, then by CVSS score
    enrichedVulns.sort((a, b) => {
      if (a.isExploitedInWild !== b.isExploitedInWild) return a.isExploitedInWild ? -1 : 1;
      return (b.cvssScore || 0) - (a.cvssScore || 0);
    });

    // AI security assessment
    const assessment = await generateSecurityAssessment(device, enrichedVulns, accounts);

    // Determine risk level
    const criticalCount = enrichedVulns.filter(v => v.severity === 'CRITICAL' || v.isExploitedInWild).length;
    const highCount = enrichedVulns.filter(v => v.severity === 'HIGH').length;
    const riskLevel = criticalCount > 0 ? 'critical' : highCount > 3 ? 'high' : highCount > 0 ? 'medium' : 'low';

    // Update device inventory if we have a deviceId
    if (deviceId) {
      await supabase.from('device_inventory').update({
        last_scanned_at: new Date().toISOString(),
        vulnerability_count: enrichedVulns.length,
        critical_count: criticalCount,
        risk_level: riskLevel,
        scan_results: {
          vulnerabilities: enrichedVulns.slice(0, 50),
          assessment,
          scannedAt: new Date().toISOString(),
          keywordsUsed: keywords,
        },
        updated_at: new Date().toISOString(),
      }).eq('id', deviceId);
    } else if (device.device_name || device.deviceName) {
      // Auto-register device
      const { data: newDevice } = await supabase.from('device_inventory').insert({
        user_id: userId,
        device_name: (device.device_name || device.deviceName) as string,
        device_type: (device.device_type || device.deviceType || 'unknown') as string,
        os_name: (device.os_name || device.osName) as string,
        os_version: (device.os_version || device.osVersion) as string,
        manufacturer: (device.manufacturer) as string,
        model: (device.model) as string,
        installed_apps: (device.installed_apps || device.installedApps || []),
        accounts: accounts,
        cpe_identifiers: keywords,
        last_scanned_at: new Date().toISOString(),
        vulnerability_count: enrichedVulns.length,
        critical_count: criticalCount,
        risk_level: riskLevel,
        scan_results: {
          vulnerabilities: enrichedVulns.slice(0, 50),
          assessment,
          scannedAt: new Date().toISOString(),
        },
      }).select('id').single();

      if (newDevice) {
        (assessment as any).registeredDeviceId = newDevice.id;
      }
    }

    return json({
      success: true,
      data: {
        device: {
          name: device.device_name || device.deviceName,
          os: `${device.os_name || device.osName} ${device.os_version || device.osVersion}`,
          riskLevel,
        },
        vulnerabilities: enrichedVulns.slice(0, 50),
        totalFound: enrichedVulns.length,
        criticalCount,
        highCount,
        exploitedInWild: enrichedVulns.filter(v => v.isExploitedInWild).length,
        assessment,
        keywordsScanned: keywords,
      },
      meta: { scannedAt: new Date().toISOString() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
