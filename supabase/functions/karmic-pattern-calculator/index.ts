import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, profileId, analysisType = 'full' } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch life pattern data
    const [profileRes, milestonesRes, interactionsRes, predictionsRes, familyRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_life_milestones').select('*').eq('profile_id', profileId).order('event_date', { ascending: true }),
      supabase.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: true }).limit(200),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      supabase.from('contact_relationships').select('*').eq('from_profile_id', profileId),
    ]);

    const KARMIC_PATTERN_PROMPT = `You are a Karmic Pattern analyst studying cyclical life patterns and consequence chains.

KARMIC ANALYSIS FRAMEWORK:
1. ACTION-CONSEQUENCE CHAINS: How past actions create future circumstances
2. CYCLICAL PATTERNS: Recurring themes across life stages
3. KARMIC DEBTS: Outstanding consequences not yet manifested
4. KARMIC OPPORTUNITIES: Windows for pattern-breaking or leverage
5. INTERGENERATIONAL KARMA: Patterns inherited from family lineage
6. DHARMIC ALIGNMENT: Degree of alignment with natural/authentic path

TARGET PROFILE:
${JSON.stringify(profileRes.data, null, 2)}

LIFE MILESTONES (chronological):
${JSON.stringify(milestonesRes.data, null, 2)}

INTERACTION HISTORY:
${JSON.stringify(interactionsRes.data?.slice(0, 100), null, 2)}

FAMILY DATA:
${JSON.stringify(familyRes.data, null, 2)}

PREDICTIONS:
${JSON.stringify(predictionsRes.data, null, 2)}

ANALYSIS TYPE: ${analysisType}

Analyze karmic patterns. Return JSON:
{
  "karmicCycles": [
    {
      "cycleName": "descriptive name of pattern",
      "cycleType": "relationship|career|health|financial|spiritual",
      "patternDescription": "detailed description of repeating pattern",
      "cycleDurationDays": estimated duration,
      "currentPhase": "action|consequence|resolution|dormant",
      "repetitionCount": how many times observed,
      "severityScore": 0.0-1.0,
      "breakingRequirements": ["what would be needed to break cycle"],
      "nextExpectedManifestation": "ISO date"
    }
  ],
  "karmicDebts": [
    {
      "debtDescription": "what is owed",
      "creditorType": "universe|person|institution|self",
      "creditorProfileId": "if applicable",
      "debtMagnitude": 0.0-1.0,
      "accrualRate": 0.0-1.0,
      "dueDateEstimate": "ISO date when consequences likely",
      "paymentOptions": ["ways to resolve the debt"],
      "defaultConsequences": "what happens if not paid",
      "exploitationPotential": 0.0-1.0
    }
  ],
  "karmicOpportunities": [
    {
      "opportunityDescription": "window for intervention",
      "relatedCycleIndex": cycle array index,
      "windowOpens": "ISO date",
      "windowCloses": "ISO date",
      "interventionType": "break_cycle|redirect|accelerate|delay",
      "successProbability": 0.0-1.0,
      "longTermImpact": {
        "positive": ["potential benefits"],
        "negative": ["potential risks"]
      },
      "requiredAction": "what must be done"
    }
  ],
  "lineagePatterns": [
    {
      "patternName": "family pattern name",
      "generationalDepth": how many generations,
      "inheritanceStrength": 0.0-1.0,
      "manifestationTriggers": ["what activates this pattern"],
      "breakingPotential": 0.0-1.0
    }
  ],
  "dharmicAlignment": {
    "currentScore": 0.0-1.0,
    "authenticPath": "description of their natural path",
    "deviations": ["where they've strayed"],
    "realignmentSteps": ["how to return to path"]
  },
  "manipulationProtocol": {
    "debtsToExploit": ["debts that create vulnerability"],
    "cyclesToAccelerate": ["patterns to speed up for your benefit"],
    "opportunitiesToCreate": ["how to manufacture karmic windows"]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: KARMIC_PATTERN_PROMPT },
          { role: "user", content: `Calculate karmic patterns for profile ${profileId}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    // Store karmic cycles
    if (analysis.karmicCycles) {
      for (const cycle of analysis.karmicCycles) {
        await supabase.from('karmic_cycles').insert({
          user_id: userId,
          profile_id: profileId,
          cycle_name: cycle.cycleName,
          cycle_type: cycle.cycleType,
          pattern_description: cycle.patternDescription,
          cycle_duration_days: cycle.cycleDurationDays,
          current_phase: cycle.currentPhase,
          repetition_count: cycle.repetitionCount,
          severity_score: cycle.severityScore,
          breaking_requirements: cycle.breakingRequirements || [],
        });
      }
    }

    // Store karmic debts
    if (analysis.karmicDebts) {
      for (const debt of analysis.karmicDebts) {
        await supabase.from('karmic_debts').insert({
          user_id: userId,
          profile_id: profileId,
          debt_description: debt.debtDescription,
          creditor_type: debt.creditorType,
          creditor_profile_id: debt.creditorProfileId,
          debt_magnitude: debt.debtMagnitude,
          accrual_rate: debt.accrualRate,
          due_date_estimate: debt.dueDateEstimate,
          payment_options: debt.paymentOptions || [],
          exploitation_potential: debt.exploitationPotential,
        });
      }
    }

    // Store karmic opportunities
    if (analysis.karmicOpportunities) {
      for (const opp of analysis.karmicOpportunities) {
        await supabase.from('karmic_opportunities').insert({
          user_id: userId,
          profile_id: profileId,
          opportunity_description: opp.opportunityDescription,
          window_opens: opp.windowOpens,
          window_closes: opp.windowCloses,
          intervention_type: opp.interventionType,
          success_probability: opp.successProbability,
          long_term_impact: opp.longTermImpact || {},
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      karmicAnalysis: analysis,
      cyclesDetected: analysis.karmicCycles?.length || 0,
      debtsFound: analysis.karmicDebts?.length || 0,
      opportunitiesIdentified: analysis.karmicOpportunities?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Karmic pattern calculator error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
