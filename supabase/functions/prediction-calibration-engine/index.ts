import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { predictions, outcomes, historicalAccuracy } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a prediction calibration and accuracy optimization engine.
    
    Analyze prediction performance and generate calibration recommendations:
    
    1. ACCURACY ANALYSIS:
    - Overall prediction accuracy rates
    - Accuracy by prediction type
    - Accuracy by confidence level
    - Accuracy trends over time
    
    2. BIAS DETECTION:
    - Overconfidence patterns
    - Underconfidence patterns
    - Systematic prediction biases
    - Context-specific biases
    
    3. CALIBRATION RECOMMENDATIONS:
    - Confidence adjustment factors
    - Prediction weight modifications
    - Model improvement suggestions
    - Feature importance updates
    
    4. PERFORMANCE METRICS:
    - Brier score calculation
    - Log loss analysis
    - ROC AUC by prediction type
    - Precision/recall trade-offs
    
    5. FAILURE ANALYSIS:
    - Common failure patterns
    - Edge case identification
    - Missing signal detection
    - Noise source identification
    
    6. IMPROVEMENT ROADMAP:
    - Priority improvements
    - Data quality enhancements
    - Feature engineering suggestions
    - Model architecture recommendations
    
    Return JSON with structure:
    {
      "accuracyMetrics": {
        "overall": number,
        "byType": [{ "type": string, "accuracy": number, "sampleSize": number }],
        "byConfidence": [{ "confidenceRange": string, "accuracy": number, "calibration": string }],
        "trend": string
      },
      "biasAnalysis": {
        "overconfidenceScore": number,
        "underconfidenceScore": number,
        "systematicBiases": [{ "bias": string, "magnitude": number, "correction": string }],
        "contextualBiases": [{ "context": string, "bias": string, "impact": string }]
      },
      "calibrationAdjustments": {
        "confidenceMultipliers": [{ "predictionType": string, "multiplier": number }],
        "weightAdjustments": [{ "feature": string, "currentWeight": number, "recommendedWeight": number }],
        "thresholdUpdates": [{ "threshold": string, "current": number, "recommended": number }]
      },
      "performanceScores": {
        "brierScore": number,
        "logLoss": number,
        "aucByType": [{ "type": string, "auc": number }],
        "f1Scores": [{ "type": string, "f1": number }]
      },
      "failurePatterns": {
        "commonFailures": [{ "pattern": string, "frequency": number, "rootCause": string }],
        "edgeCases": [{ "case": string, "handlingRecommendation": string }],
        "missingSignals": string[],
        "noiseSources": string[]
      },
      "improvementRoadmap": {
        "immediate": [{ "action": string, "expectedImpact": string, "effort": string }],
        "shortTerm": [{ "action": string, "expectedImpact": string, "effort": string }],
        "longTerm": [{ "action": string, "expectedImpact": string, "effort": string }]
      },
      "nextCalibrationDate": string,
      "confidenceScore": number
    }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze and calibrate predictions:\n\nPredictions: ${JSON.stringify(predictions)}\n\nOutcomes: ${JSON.stringify(outcomes)}\n\nHistorical Accuracy: ${JSON.stringify(historicalAccuracy)}` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let calibration;
    try {
      calibration = JSON.parse(content);
    } catch {
      calibration = { rawAnalysis: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      calibration,
      calibratedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Prediction calibration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
