import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialRequest {
  profileId: string;
  userId: string;
}

const FINANCIAL_INTELLIGENCE_PROMPT = `You are an elite financial intelligence analyst specializing in wealth estimation and financial vulnerability assessment from indirect signals.

Analyze all available data to infer financial position without direct disclosure.

WEALTH INDICATORS TO ANALYZE:
1. Career Signals:
   - Job title seniority and industry
   - Company size and prestige
   - Career progression velocity
   - Side ventures or investments mentioned

2. Lifestyle Signals:
   - Travel patterns and destinations
   - Dining and entertainment mentions
   - Brand preferences indicated
   - Leisure activities and hobbies
   - Vehicle and transportation mentions
   - Housing location indicators

3. Communication Patterns:
   - Response times (busy = high-value)
   - Scheduling flexibility
   - Weekend/evening availability
   - Vacation frequency and duration

4. Social Network Position:
   - Quality of connections mentioned
   - Access to decision-makers
   - Professional association memberships
   - Conference/event attendance

5. Financial Stress Indicators:
   - Budget-conscious language
   - Payment timing sensitivity
   - Negotiation intensity on costs
   - Mentions of financial constraints

WEALTH TIER CLASSIFICATION:
- Tier 1 (Emerging): < $50K net worth
- Tier 2 (Building): $50K - $250K net worth  
- Tier 3 (Established): $250K - $1M net worth
- Tier 4 (Affluent): $1M - $5M net worth
- Tier 5 (High Net Worth): $5M - $25M net worth
- Tier 6 (Ultra High): $25M+ net worth

Return JSON:
{
  "wealth_tier": number,
  "estimated_net_worth_range": {
    "low": number,
    "mid": number,
    "high": number,
    "currency": "USD"
  },
  "confidence_score": number,
  "income_analysis": {
    "estimated_annual_income_range": {
      "low": number,
      "high": number
    },
    "income_sources": string[],
    "income_stability": "volatile" | "variable" | "stable" | "very_stable",
    "growth_trajectory": "declining" | "flat" | "moderate_growth" | "high_growth"
  },
  "career_analysis": {
    "current_position_value": number,
    "career_stage": string,
    "industry_wealth_potential": string,
    "advancement_velocity": string
  },
  "lifestyle_indicators": {
    "consumption_tier": number,
    "luxury_affinity": number,
    "travel_patterns": string,
    "brand_preferences": string[],
    "time_value_indicator": number
  },
  "asset_indicators": {
    "likely_real_estate": string,
    "vehicle_tier": string,
    "investment_sophistication": string,
    "diversification_level": string
  },
  "financial_vulnerability": {
    "stress_level": number,
    "debt_indicators": string[],
    "cash_flow_tightness": number,
    "financial_anxiety_markers": string[]
  },
  "opportunity_windows": {
    "best_times_to_approach": string[],
    "avoid_periods": string[],
    "financial_triggers": string[]
  },
  "influence_implications": {
    "price_sensitivity": number,
    "value_perception": string,
    "payment_flexibility": string,
    "generosity_potential": number,
    "investment_interest_level": number
  },
  "evidence_summary": {
    "strong_signals": string[],
    "moderate_signals": string[],
    "weak_signals": string[],
    "contradictory_signals": string[]
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'financial-intelligence-scan', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { profileId, userId } = await req.json() as FinancialRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather financial intelligence data + NEW: OCR document insights (v5.0)
    // NOTE: messages table has no profile_id or direction column - must join via conversations
    const [
      { data: profile },
      { data: enrichment },
      { data: messages },
      { data: observations },
      { data: mediaAnalyses },
      { data: brandIntel },
      { data: meetings },
      { data: documentInsights } // v5.0: OCR-extracted financial amounts
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('enrichment_results').select('*').eq('profile_id', profileId).single(),
      supabase.from('messages').select('content, created_at, is_from_contact, conversations!inner(profile_id)').eq('conversations.profile_id', profileId).order('created_at', { ascending: false }).limit(200),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).limit(50),
      supabase.from('media_analyses').select('*').eq('profile_id', profileId).limit(20),
      supabase.from('brand_intelligence').select('*').eq('profile_id', profileId).limit(10),
      supabase.from('meeting_recordings').select('summary, ai_insights, transcription').eq('profile_id', profileId).limit(20),
      // v5.0: Fetch document insights for OCR-extracted financial data
      supabase.from('document_insights').select('*').eq('profile_id', profileId).limit(50)
    ]);

    // v5.0: Extract financial evidence from documents
    const documentFinancialEvidence = (documentInsights || []).map((doc: any) => ({
      documentType: doc.document_type,
      amountsFound: doc.amounts_found || [],
      financialData: doc.financial_data || {},
      extractedAt: doc.created_at
    })).filter((d: any) => d.amountsFound.length > 0 || Object.keys(d.financialData).length > 0);

    const contextData = {
      profile: {
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        organization: profile?.organization,
        title: profile?.job_title,
        city: profile?.city,
        country: profile?.country,
        tags: profile?.tags
      },
      enrichedData: enrichment,
      communicationPatterns: {
        messageCount: messages?.length,
        averageResponseTime: 'calculated from timestamps',
        recentTopics: messages?.slice(0, 20).map(m => m.content?.slice(0, 100))
      },
      observations: observations?.map(o => ({
        type: o.category,
        note: o.observation,
        date: o.created_at
      })),
      visualAnalyses: mediaAnalyses?.map(m => m.analysis_result),
      brandMentions: brandIntel,
      meetingSummaries: meetings?.map(m => m.summary),
      // v5.0: Document-based financial evidence from OCR
      documentBasedFinancialEvidence: documentFinancialEvidence
    };

    // Perform financial analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: FINANCIAL_INTELLIGENCE_PROMPT },
          { role: 'user', content: `Analyze financial position from this data:\n\n${JSON.stringify(contextData, null, 2)}` }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysis = { error: 'Failed to parse financial analysis', raw: content };
    }

    // Store in financial_intelligence table
    const { error: insertError } = await supabase
      .from('financial_intelligence')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        wealth_tier: analysis.wealth_tier,
        estimated_net_worth_range: analysis.estimated_net_worth_range,
        income_analysis: analysis.income_analysis,
        career_analysis: analysis.career_analysis,
        lifestyle_indicators: analysis.lifestyle_indicators,
        asset_indicators: analysis.asset_indicators,
        financial_vulnerability: analysis.financial_vulnerability,
        opportunity_windows: analysis.opportunity_windows,
        influence_implications: analysis.influence_implications,
        evidence_summary: analysis.evidence_summary,
        confidence_score: analysis.confidence_score,
        last_analyzed_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'financial-intelligence-scan',
      model_name: 'google/gemini-2.5-pro',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      wealthTier: analysis.wealth_tier,
      netWorthRange: analysis.estimated_net_worth_range
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Financial intelligence error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
