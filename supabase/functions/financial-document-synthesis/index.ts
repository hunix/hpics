/**
 * Financial Document Synthesis Engine (v1.0.0)
 * Aggregates OCR-extracted financial data from documents into the wealth
 * assessment pipeline to update financial intelligence.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FINANCIAL_SYNTHESIS_PROMPT = `You are an elite financial intelligence analyst specializing in document-based wealth assessment and financial pattern recognition.

Your task is to synthesize financial information extracted from documents (bank statements, invoices, contracts, tax forms, etc.) to build a comprehensive wealth profile.

DOCUMENT ANALYSIS FRAMEWORK:

1. AMOUNT EXTRACTION ANALYSIS
   - Categorize extracted amounts (income, expense, asset, liability)
   - Identify recurring amounts and their frequency
   - Detect large or unusual transactions
   - Currency normalization and conversion

2. INCOME INDICATORS
   - Salary/wage evidence
   - Investment income signals
   - Business revenue indicators
   - Passive income sources
   - Income stability assessment

3. EXPENSE PATTERNS
   - Essential vs discretionary spending
   - Luxury spending indicators
   - Recurring obligations (mortgages, loans)
   - Lifestyle tier estimation

4. ASSET EVIDENCE
   - Property ownership indicators
   - Vehicle references
   - Investment account mentions
   - Business ownership signals
   - Collectibles or high-value items

5. WEALTH TIER ADJUSTMENT
   - Compare document evidence to existing tier
   - Calculate confidence-weighted adjustment
   - Identify contradictory signals

WEALTH TIERS:
- Tier 1 (Emerging): < $50K net worth
- Tier 2 (Building): $50K - $250K
- Tier 3 (Established): $250K - $1M
- Tier 4 (Affluent): $1M - $5M
- Tier 5 (High Net Worth): $5M - $25M
- Tier 6 (Ultra High): $25M+

Return JSON:
{
  "documentBasedEvidence": {
    "totalAmountsExtracted": [
      {
        "amount": number,
        "currency": "USD",
        "category": "income|expense|asset|liability|unknown",
        "source": "document type or context",
        "confidence": 0.0-1.0,
        "recurring": boolean
      }
    ],
    "incomeIndicators": [
      {
        "type": "salary|investment|business|passive|other",
        "estimatedAnnual": number,
        "confidence": 0.0-1.0,
        "evidence": "what document showed this"
      }
    ],
    "expensePatterns": [
      {
        "category": "housing|transport|luxury|essential|debt",
        "monthlyEstimate": number,
        "lifestyleIndicator": "modest|comfortable|affluent|lavish"
      }
    ],
    "assetMentions": [
      {
        "assetType": "real_estate|vehicle|investment|business|other",
        "estimatedValue": number,
        "confidence": 0.0-1.0,
        "evidence": "what indicated this"
      }
    ],
    "liabilityIndicators": [
      {
        "type": "mortgage|loan|credit|other",
        "estimatedAmount": number,
        "monthlyPayment": number
      }
    ]
  },
  "wealthTierAdjustment": {
    "currentTier": number,
    "suggestedTier": number,
    "tierChangeDirection": "up|down|unchanged",
    "confidence": 0.0-1.0,
    "evidenceBasis": string[],
    "contradictorySignals": string[]
  },
  "financialProfile": {
    "estimatedNetWorth": {
      "low": number,
      "mid": number,
      "high": number
    },
    "incomeStability": "volatile|variable|stable|very_stable",
    "debtToIncomeIndicator": "low|moderate|high|concerning",
    "liquidityIndicator": "tight|adequate|comfortable|abundant",
    "financialSophistication": "basic|moderate|sophisticated|elite"
  },
  "vulnerabilityIndicators": {
    "financialStress": 0.0-1.0,
    "cashFlowPressure": 0.0-1.0,
    "debtAnxiety": 0.0-1.0,
    "exploitableNeeds": string[]
  },
  "dataQuality": {
    "documentCount": number,
    "amountExtractCount": number,
    "recencyScore": 0.0-1.0,
    "completeness": "low|medium|high"
  },
  "recommendations": {
    "additionalDocumentsNeeded": string[],
    "verificationSuggestions": string[],
    "confidenceImprovements": string[]
  },
  "confidenceScore": 0.0-1.0
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "1") {
    return new Response(
      JSON.stringify({ ok: true, function: "financial-document-synthesis", timestamp: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    const body = await req.json();
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;

    const profileId = body.profileId || body.profile_id;
    let userId = body.userId || body.user_id;

    if (!isServiceRoleCall && authHeader && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId && !isServiceRoleCall) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather financial document data
    const [
      documentInsightsResult,
      extractedDocumentsResult,
      mediaAnalysesResult,
      existingFinancialResult,
    ] = await Promise.all([
      supabase.from("document_insights").select("*").eq("profile_id", profileId)
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("extracted_documents").select("*").eq("profile_id", profileId)
        .order("extracted_at", { ascending: false }).limit(50),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("financial_intelligence").select("*").eq("profile_id", profileId)
        .order("last_analyzed_at", { ascending: false }).limit(1),
    ]);

    // Extract financial-relevant data from media analyses
    const financialMediaAnalyses = (mediaAnalysesResult.data || []).filter((m: Record<string, unknown>) => {
      const result = m.analysis_result as Record<string, unknown> | null;
      return result && (
        result.amounts_found || 
        result.currency_detected || 
        result.financial_indicators
      );
    });

    const contextData = {
      documentInsights: {
        documents: documentInsightsResult.data || [],
        count: (documentInsightsResult.data || []).length,
        amountsFound: (documentInsightsResult.data || [])
          .flatMap((d: Record<string, unknown>) => (d.amounts_found as unknown[]) || []),
      },
      extractedDocuments: {
        documents: extractedDocumentsResult.data || [],
        count: (extractedDocumentsResult.data || []).length,
        currencyAmounts: (extractedDocumentsResult.data || [])
          .flatMap((d: Record<string, unknown>) => (d.currency_amounts as unknown[]) || []),
      },
      financialMediaAnalyses: {
        analyses: financialMediaAnalyses,
        count: financialMediaAnalyses.length,
      },
      existingFinancialProfile: existingFinancialResult.data?.[0] || null,
    };

    console.log(`[financial-document-synthesis] Processing for profile ${profileId}:`, {
      documentInsights: contextData.documentInsights.count,
      extractedDocs: contextData.extractedDocuments.count,
      financialMedia: contextData.financialMediaAnalyses.count,
      hasExistingProfile: !!contextData.existingFinancialProfile,
    });

    const aiResponse = await callAI({
      model: selectModel("quality"),
      messages: [
        { role: "system", content: FINANCIAL_SYNTHESIS_PROMPT },
        { 
          role: "user", 
          content: `Synthesize financial intelligence from extracted documents:\n\n${JSON.stringify(contextData, null, 2)}`
        }
      ],
      userId: userId,
      functionName: "financial-document-synthesis",
      profileId: profileId,
      temperature: 0.3,
    });

    const analysis = parseAIJson(aiResponse.content, {
      documentBasedEvidence: {
        totalAmountsExtracted: [],
        incomeIndicators: [],
        expensePatterns: [],
        assetMentions: [],
        liabilityIndicators: [],
      },
      wealthTierAdjustment: {
        currentTier: 0,
        suggestedTier: 0,
        tierChangeDirection: "unchanged",
        confidence: 0,
        evidenceBasis: [],
        contradictorySignals: [],
      },
      financialProfile: {},
      vulnerabilityIndicators: {},
      dataQuality: { documentCount: 0, completeness: "low" },
      recommendations: {},
      confidenceScore: 0,
    });

    // Store in ai_analyses
    await supabase.from("ai_analyses").upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: "financial_document_synthesis",
      result: analysis,
      generated_at: new Date().toISOString(),
    }, { onConflict: "profile_id,analysis_type" });

    // If we have high-confidence tier adjustment, update financial_intelligence
    const tierAdjustment = analysis.wealthTierAdjustment as Record<string, unknown> | undefined;
    const financialProfile = analysis.financialProfile as Record<string, unknown> | undefined;
    if (tierAdjustment?.confidence && (tierAdjustment.confidence as number) > 0.7 && tierAdjustment?.suggestedTier) {
      await supabase.from("financial_intelligence").upsert({
        profile_id: profileId,
        user_id: userId,
        wealth_tier: tierAdjustment.suggestedTier as number,
        estimated_net_worth_range: financialProfile?.estimatedNetWorth,
        evidence_summary: { document_synthesis: tierAdjustment.evidenceBasis },
        last_analyzed_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        profileId,
        costCents: aiResponse.costCents,
        metadata: {
          documentsAnalyzed: contextData.documentInsights.count + contextData.extractedDocuments.count,
          amountsExtracted: analysis.documentBasedEvidence?.totalAmountsExtracted?.length || 0,
          tierAdjustment: analysis.wealthTierAdjustment?.tierChangeDirection,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Financial document synthesis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
