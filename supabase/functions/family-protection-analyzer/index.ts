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
    return new Response(JSON.stringify({ ok: true, function: 'family-protection-analyzer', timestamp: Date.now() }), 
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

    const { action, personDetails } = body;

    switch (action) {
      case 'add_protected_person': {
        const { data, error } = await supabase
          .from('protected_persons')
          .insert({
            user_id: userId,
            name: personDetails.name,
            relationship: personDetails.relationship,
            age_group: personDetails.ageGroup,
            vulnerability_level: personDetails.vulnerabilityLevel || 'medium',
            known_threats: personDetails.knownThreats || [],
            protection_protocols: generateProtectionProtocols(personDetails),
            emergency_contacts: personDetails.emergencyContacts || [],
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, person: data }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_protected_persons': {
        const { data } = await supabase
          .from('protected_persons')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        const summary = generateProtectionSummary(data || []);

        return new Response(JSON.stringify({ success: true, persons: data, summary }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'assess_threat': {
        const threatAssessment = assessThreatToFamily(personDetails, body.threatInfo);

        return new Response(JSON.stringify({ success: true, assessment: threatAssessment }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_emergency_protocols': {
        const { data: protocols } = await supabase
          .from('emergency_protocols')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        return new Response(JSON.stringify({ success: true, protocols }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'create_emergency_protocol': {
        const { data, error } = await supabase
          .from('emergency_protocols')
          .insert({
            user_id: userId,
            protocol_name: body.protocolName,
            protocol_type: body.protocolType,
            trigger_conditions: body.triggerConditions,
            immediate_actions: body.immediateActions,
            notification_chain: body.notificationChain,
            resources_required: body.resourcesRequired,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, protocol: data }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Family protection error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Operation failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function generateProtectionProtocols(details: any): any[] {
  const protocols: any[] = [];
  
  // Base protocols for all protected persons
  protocols.push({
    type: 'communication',
    description: 'Establish secure communication channels',
    priority: 'high'
  });

  protocols.push({
    type: 'location',
    description: 'Implement location awareness protocols',
    priority: 'medium'
  });

  // Age-specific protocols
  if (details.ageGroup === 'child' || details.ageGroup === 'minor') {
    protocols.push({
      type: 'online_safety',
      description: 'Monitor and protect online presence',
      priority: 'critical'
    });
    protocols.push({
      type: 'school_security',
      description: 'Coordinate with educational institutions',
      priority: 'high'
    });
  }

  if (details.ageGroup === 'elderly') {
    protocols.push({
      type: 'financial_protection',
      description: 'Protect against financial exploitation',
      priority: 'critical'
    });
    protocols.push({
      type: 'health_monitoring',
      description: 'Establish health emergency protocols',
      priority: 'high'
    });
  }

  // Vulnerability-based protocols
  if (details.vulnerabilityLevel === 'high' || details.vulnerabilityLevel === 'critical') {
    protocols.push({
      type: 'physical_security',
      description: 'Enhanced physical security measures',
      priority: 'critical'
    });
  }

  return protocols;
}

function generateProtectionSummary(persons: any[]): any {
  const byRelationship: Record<string, number> = {};
  const byVulnerability: Record<string, number> = {};
  
  persons.forEach(p => {
    byRelationship[p.relationship] = (byRelationship[p.relationship] || 0) + 1;
    byVulnerability[p.vulnerability_level] = (byVulnerability[p.vulnerability_level] || 0) + 1;
  });

  const criticalCount = persons.filter(p => 
    p.vulnerability_level === 'critical' || p.vulnerability_level === 'high'
  ).length;

  return {
    totalProtected: persons.length,
    byRelationship,
    byVulnerability,
    criticalAlertCount: criticalCount,
    lastUpdated: new Date().toISOString()
  };
}

function assessThreatToFamily(personDetails: any, threatInfo: any): any {
  let threatScore = 0;
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (!threatInfo) {
    return { threatScore: 0, risks: [], recommendations: ['Continue standard monitoring'] };
  }

  // Assess threat proximity
  if (threatInfo.proximity === 'immediate') {
    threatScore += 40;
    risks.push('Immediate proximity threat detected');
    recommendations.push('Implement emergency protocols immediately');
  } else if (threatInfo.proximity === 'local') {
    threatScore += 25;
    risks.push('Local area threat identified');
  }

  // Assess threat type
  if (threatInfo.type === 'physical') {
    threatScore += 30;
    risks.push('Physical threat to protected persons');
    recommendations.push('Consider temporary relocation');
  } else if (threatInfo.type === 'cyber') {
    threatScore += 20;
    risks.push('Cyber threat targeting family members');
    recommendations.push('Audit digital security measures');
  }

  // Factor in vulnerability
  if (personDetails?.vulnerabilityLevel === 'critical') {
    threatScore *= 1.5;
    recommendations.push('Prioritize protection of high-vulnerability members');
  }

  return {
    threatScore: Math.min(100, threatScore),
    riskLevel: threatScore >= 70 ? 'critical' : threatScore >= 50 ? 'high' : threatScore >= 30 ? 'medium' : 'low',
    risks,
    recommendations,
    immediateActionRequired: threatScore >= 70
  };
}
