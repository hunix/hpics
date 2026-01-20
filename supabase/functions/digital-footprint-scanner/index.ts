import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'digital-footprint-scanner', timestamp: Date.now() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    let userId: string;
    if (authHeader?.includes(supabaseKey)) {
      userId = body.userId || body.user_id;
    } else {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const profileId = body.profileId || body.profile_id;
    const { action } = body;

    // Default analysis mode for intelligence session calls
    if (!action && profileId) {
      // Get existing footprint and assess exposure
      const { data } = await supabase
        .from('digital_footprint_items')
        .select('*')
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .order('discovered_at', { ascending: false });

      const summary = generateFootprintSummary(data || []);
      const exposure = assessDigitalExposure(data || []);

      return new Response(JSON.stringify({ 
        success: true, 
        items: data || [],
        summary,
        exposure,
        profileId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    switch (action) {
      case 'scan': {
        const scanResults = performDigitalFootprintScan(body.targetInfo);

        // Store discovered items
        for (const item of scanResults.items) {
          await supabase.from('digital_footprint_items').insert({
            user_id: userId,
            profile_id: profileId,
            item_type: item.type,
            item_value: item.value,
            source: item.source,
            exposure_level: item.exposureLevel,
            risk_score: item.riskScore,
            metadata: item.metadata,
            discovered_at: new Date().toISOString()
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          scan: scanResults,
          itemsDiscovered: scanResults.items.length
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_footprint': {
        const { data } = await supabase
          .from('digital_footprint_items')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .order('discovered_at', { ascending: false });

        const summary = generateFootprintSummary(data || []);

        return new Response(JSON.stringify({ success: true, items: data, summary }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'assess_exposure': {
        const { data } = await supabase
          .from('digital_footprint_items')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId);

        const exposure = assessDigitalExposure(data || []);

        return new Response(JSON.stringify({ success: true, exposure }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'remediation_plan': {
        const { data } = await supabase
          .from('digital_footprint_items')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .gte('risk_score', 50);

        const plan = generateRemediationPlan(data || []);

        return new Response(JSON.stringify({ success: true, plan }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Digital footprint scanner error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function performDigitalFootprintScan(targetInfo: any): any {
  // Simulated scan results - in production, this would integrate with OSINT APIs
  const items: any[] = [];
  
  if (targetInfo?.email) {
    items.push({
      type: 'email',
      value: targetInfo.email,
      source: 'direct_input',
      exposureLevel: 'known',
      riskScore: 30,
      metadata: { verified: true }
    });

    // Simulated breach check
    items.push({
      type: 'breach_exposure',
      value: `${targetInfo.email} found in 3 data breaches`,
      source: 'breach_database',
      exposureLevel: 'public',
      riskScore: 75,
      metadata: { breachCount: 3, latestBreach: '2024-01-15' }
    });
  }

  if (targetInfo?.name) {
    items.push({
      type: 'social_account',
      value: `LinkedIn profile found: ${targetInfo.name}`,
      source: 'linkedin',
      exposureLevel: 'public',
      riskScore: 25,
      metadata: { platform: 'linkedin', public: true }
    });
  }

  if (targetInfo?.phone) {
    items.push({
      type: 'phone',
      value: targetInfo.phone,
      source: 'direct_input',
      exposureLevel: 'semi_private',
      riskScore: 40,
      metadata: {}
    });
  }

  return {
    items,
    scanDate: new Date().toISOString(),
    coverage: calculateCoverage(items),
    overallRisk: calculateOverallRisk(items)
  };
}

function calculateCoverage(items: any[]): any {
  const types = new Set(items.map(i => i.type));
  return {
    typesScanned: Array.from(types),
    totalItems: items.length,
    completeness: Math.min(100, items.length * 10)
  };
}

function calculateOverallRisk(items: any[]): string {
  if (items.length === 0) return 'unknown';
  
  const avgRisk = items.reduce((sum, i) => sum + (i.riskScore || 0), 0) / items.length;
  const maxRisk = Math.max(...items.map(i => i.riskScore || 0));
  
  if (maxRisk >= 80 || avgRisk >= 60) return 'high';
  if (maxRisk >= 50 || avgRisk >= 40) return 'medium';
  return 'low';
}

function generateFootprintSummary(items: any[]): any {
  const byType: Record<string, number> = {};
  const byExposure: Record<string, number> = {};
  let highRiskCount = 0;

  items.forEach(item => {
    byType[item.item_type] = (byType[item.item_type] || 0) + 1;
    byExposure[item.exposure_level] = (byExposure[item.exposure_level] || 0) + 1;
    if (item.risk_score >= 70) highRiskCount++;
  });

  return {
    totalItems: items.length,
    byType,
    byExposure,
    highRiskItems: highRiskCount,
    lastScan: items[0]?.discovered_at || null
  };
}

function assessDigitalExposure(items: any[]): any {
  if (items.length === 0) {
    return {
      exposureScore: 0,
      category: 'minimal',
      vulnerabilities: [],
      recommendations: ['Conduct initial digital footprint scan']
    };
  }

  const publicItems = items.filter(i => i.exposure_level === 'public');
  const breaches = items.filter(i => i.item_type === 'breach_exposure');
  const highRisk = items.filter(i => i.risk_score >= 70);

  let exposureScore = 0;
  exposureScore += publicItems.length * 5;
  exposureScore += breaches.length * 15;
  exposureScore += highRisk.length * 10;
  exposureScore = Math.min(100, exposureScore);

  const vulnerabilities: string[] = [];
  if (publicItems.length > 5) vulnerabilities.push('Excessive public information exposure');
  if (breaches.length > 0) vulnerabilities.push(`Found in ${breaches.length} data breaches`);
  if (highRisk.length > 0) vulnerabilities.push(`${highRisk.length} high-risk exposure items`);

  const category = exposureScore >= 70 ? 'severe' : 
    exposureScore >= 50 ? 'elevated' : 
    exposureScore >= 25 ? 'moderate' : 'minimal';

  return {
    exposureScore,
    category,
    vulnerabilities,
    publicItemCount: publicItems.length,
    breachCount: breaches.length,
    recommendations: generateExposureRecommendations(vulnerabilities)
  };
}

function generateExposureRecommendations(vulnerabilities: string[]): string[] {
  const recommendations: string[] = [];
  
  if (vulnerabilities.some(v => v.includes('breach'))) {
    recommendations.push('Change passwords for all breached accounts');
    recommendations.push('Enable two-factor authentication');
    recommendations.push('Consider credit monitoring service');
  }

  if (vulnerabilities.some(v => v.includes('public'))) {
    recommendations.push('Review and restrict social media privacy settings');
    recommendations.push('Remove unnecessary public information');
    recommendations.push('Opt out of data broker listings');
  }

  if (vulnerabilities.some(v => v.includes('high-risk'))) {
    recommendations.push('Prioritize remediation of high-risk items');
    recommendations.push('Consider professional digital privacy service');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current security posture');
    recommendations.push('Conduct periodic exposure assessments');
  }

  return recommendations;
}

function generateRemediationPlan(highRiskItems: any[]): any {
  const plan = {
    priority: 'high',
    estimatedEffort: 'medium',
    steps: [] as any[],
    timeline: '2-4 weeks'
  };

  const byType: Record<string, any[]> = {};
  highRiskItems.forEach(item => {
    if (!byType[item.item_type]) byType[item.item_type] = [];
    byType[item.item_type].push(item);
  });

  let stepOrder = 1;

  if (byType['breach_exposure']) {
    plan.steps.push({
      order: stepOrder++,
      action: 'Address data breach exposures',
      items: byType['breach_exposure'].length,
      effort: 'high',
      actions: [
        'Change all affected passwords',
        'Enable MFA on all accounts',
        'Monitor for identity theft'
      ]
    });
  }

  if (byType['email']) {
    plan.steps.push({
      order: stepOrder++,
      action: 'Protect email addresses',
      items: byType['email'].length,
      effort: 'medium',
      actions: [
        'Create email aliases for public use',
        'Remove email from public profiles'
      ]
    });
  }

  if (byType['social_account']) {
    plan.steps.push({
      order: stepOrder++,
      action: 'Secure social media presence',
      items: byType['social_account'].length,
      effort: 'medium',
      actions: [
        'Audit privacy settings',
        'Remove sensitive information',
        'Consider account consolidation'
      ]
    });
  }

  return plan;
}
