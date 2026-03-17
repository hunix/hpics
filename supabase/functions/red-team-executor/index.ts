/**
 * Red Team Executor (v1.0.0)
 * 
 * AI-powered red team scenario builder and defense plan generator.
 * Takes a CVE or vulnerability description + target platform, then:
 *   1. Researches the exploit chain and attack surface
 *   2. Generates structured attack scenario
 *   3. Generates defense plan with patches and configuration changes
 *   4. Creates executable checklist for verification
 *   5. Tracks scenario execution in red_team_scenarios table
 * 
 * @module red-team-executor
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

// ─── Fetch CVE details from NVD ───────────────────────────────────────────
async function fetchCVEDetails(cveId: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId)}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const vuln = data.vulnerabilities?.[0]?.cve;
    if (!vuln) return null;

    const desc = vuln.descriptions?.find((d: { lang: string }) => d.lang === 'en')?.value || '';
    const cvss = vuln.metrics?.cvssMetricV31?.[0]?.cvssData;
    const refs = (vuln.references || []).map((r: { url: string; tags?: string[] }) => ({
      url: r.url,
      tags: r.tags || [],
    }));

    return {
      id: vuln.id,
      description: desc,
      cvssScore: cvss?.baseScore,
      severity: cvss?.baseSeverity,
      attackVector: cvss?.attackVector,
      attackComplexity: cvss?.attackComplexity,
      privilegesRequired: cvss?.privilegesRequired,
      userInteraction: cvss?.userInteraction,
      references: refs,
      published: vuln.published,
      lastModified: vuln.lastModified,
    };
  } catch {
    return null;
  }
}

// ─── AI-powered scenario generation ──────────────────────────────────────
async function generateRedTeamScenario(
  cveDetails: Record<string, unknown> | null,
  targetPlatform: string,
  deviceInfo: Record<string, unknown>,
  customDescription: string
): Promise<{ attackScenario: Record<string, unknown>; defensePlan: Record<string, unknown>; exploitChain: unknown[]; patchChecklist: unknown[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('AI not configured');

  const vulnContext = cveDetails
    ? `CVE: ${cveDetails.id}\nDescription: ${cveDetails.description}\nCVSS: ${cveDetails.cvssScore} (${cveDetails.severity})\nAttack Vector: ${cveDetails.attackVector}\nComplexity: ${cveDetails.attackComplexity}\nReferences: ${JSON.stringify(cveDetails.references)}`
    : `Custom vulnerability: ${customDescription}`;

  const systemPrompt = `You are an elite cybersecurity red team specialist and defensive security architect. Your task is to analyze a vulnerability and produce a comprehensive attack simulation and defense plan.

VULNERABILITY CONTEXT:
${vulnContext}

TARGET PLATFORM: ${targetPlatform}
DEVICE INFO: ${JSON.stringify(deviceInfo)}

You MUST respond with valid JSON containing these exact keys:
{
  "attackScenario": {
    "title": "scenario title",
    "entryVector": "how the attacker gains initial access",
    "prerequisites": ["list of conditions needed"],
    "attackSteps": [
      {"step": 1, "action": "description", "technique": "MITRE ATT&CK technique", "detail": "specific technical detail"}
    ],
    "persistence": "how attacker maintains access",
    "exfiltration": "how data is extracted",
    "indicators": ["indicators of compromise"],
    "difficulty": "low|medium|high|critical",
    "impactAssessment": "what damage can be done"
  },
  "defensePlan": {
    "immediateMitigations": ["urgent actions to take now"],
    "patches": [{"name": "patch name", "source": "where to get it", "version": "minimum safe version"}],
    "configurationChanges": [{"setting": "what to change", "from": "current value", "to": "secure value", "platform": "where"}],
    "monitoringRules": [{"rule": "what to monitor", "threshold": "when to alert", "tool": "suggested tool"}],
    "longTermRecommendations": ["strategic security improvements"]
  },
  "exploitChain": [
    {"phase": "reconnaissance|weaponization|delivery|exploitation|installation|c2|actions", "description": "what happens", "detectable": true/false}
  ],
  "patchChecklist": [
    {"item": "action to take", "priority": "critical|high|medium|low", "verified": false, "notes": "additional context"}
  ]
}

Be specific and actionable. Reference real tools, real patches, real configurations. Do not hallucinate CVE numbers or patch versions — if unsure, say "verify latest version from vendor."`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a complete red team scenario and defense plan for: ${targetPlatform} — ${cveDetails?.id || customDescription}` },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded');
    throw new Error(`AI error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content || '{}';

  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        attackScenario: parsed.attackScenario || {},
        defensePlan: parsed.defensePlan || {},
        exploitChain: parsed.exploitChain || [],
        patchChecklist: parsed.patchChecklist || [],
      };
    }
  } catch {
    // Fall through
  }

  return {
    attackScenario: { raw: content },
    defensePlan: { raw: 'Failed to parse structured defense plan' },
    exploitChain: [],
    patchChecklist: [],
  };
}

// ─── Main Handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'red-team-executor', timestamp: Date.now() });
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

    const cveId = (body.cveId || body.cve_id) as string;
    const targetPlatform = (body.targetPlatform || body.target_platform || body.platform) as string;
    const deviceInfo = (body.deviceInfo || body.device_info || {}) as Record<string, unknown>;
    const customDescription = (body.description || body.vulnerability || '') as string;
    const agentAssigned = (body.agentAssigned || body.agent_assigned) as string;

    if (!targetPlatform) return json({ error: 'Missing targetPlatform' }, 400);
    if (!cveId && !customDescription) return json({ error: 'Missing cveId or description' }, 400);

    // Fetch real CVE details if ID provided
    let cveDetails: Record<string, unknown> | null = null;
    if (cveId) {
      cveDetails = await fetchCVEDetails(cveId);
    }

    // Generate scenario via AI
    const scenario = await generateRedTeamScenario(
      cveDetails,
      targetPlatform,
      deviceInfo,
      customDescription
    );

    // Determine priority based on CVSS score
    const cvssScore = cveDetails?.cvssScore as number;
    const priority = cvssScore >= 9 ? 'critical' : cvssScore >= 7 ? 'high' : cvssScore >= 4 ? 'medium' : 'low';

    // Store scenario
    const { data: record, error: insertError } = await supabase
      .from('red_team_scenarios')
      .insert({
        user_id: userId,
        cve_id: cveId || null,
        target_platform: targetPlatform,
        target_device_id: (body.deviceId || body.device_id) as string || null,
        attack_scenario: scenario.attackScenario,
        defense_plan: scenario.defensePlan,
        exploit_chain: scenario.exploitChain,
        prerequisites: (scenario.attackScenario as any).prerequisites || [],
        patch_checklist: scenario.patchChecklist,
        agent_assigned: agentAssigned || null,
        status: 'generated',
        priority,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[red-team-executor] Insert error:', insertError);
    }

    return json({
      success: true,
      data: {
        scenarioId: record?.id,
        cveId,
        cveDetails: cveDetails ? {
          id: cveDetails.id,
          cvssScore: cveDetails.cvssScore,
          severity: cveDetails.severity,
          attackVector: cveDetails.attackVector,
        } : null,
        targetPlatform,
        priority,
        attackScenario: scenario.attackScenario,
        defensePlan: scenario.defensePlan,
        exploitChain: scenario.exploitChain,
        patchChecklist: scenario.patchChecklist,
      },
      meta: { generatedAt: new Date().toISOString() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
