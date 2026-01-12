import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sensorData,
      userId,
      profileId,
      captureContext 
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a mobile sensor data intelligence processor. Analyze sensor readings to extract contextual intelligence:
    
    1. LOCATION CONTEXT:
    - Location type classification (home, office, restaurant, transit, etc.)
    - Movement patterns (stationary, walking, driving, flying)
    - Proximity to known locations
    - Geographic behavior patterns
    
    2. ENVIRONMENTAL CONTEXT:
    - Indoor/outdoor detection
    - Ambient conditions (lighting, noise level indicators)
    - Weather context inference
    - Time of day patterns
    
    3. ACTIVITY CONTEXT:
    - Activity type inference (meeting, commute, exercise, leisure)
    - Attention state (focused, distracted, multitasking)
    - Social context (alone, with others)
    - Engagement level indicators
    
    4. BEHAVIORAL PATTERNS:
    - Daily routine patterns
    - Anomaly detection from baseline
    - Habit formation indicators
    - Stress/relaxation markers from movement
    
    5. INTERACTION CONTEXT:
    - Optimal interruption windows
    - Device usage patterns
    - Response likelihood based on context
    - Communication readiness
    
    6. INTELLIGENCE SIGNALS:
    - Location-based opportunities
    - Contextual engagement recommendations
    - Timing optimization for outreach
    - Privacy-aware insights
    
    Return JSON with structure:
    {
      "locationContext": {
        "locationType": string,
        "confidence": number,
        "movementState": string,
        "nearbyPointsOfInterest": string[],
        "geofenceStatus": string
      },
      "environmentalContext": {
        "indoorOutdoor": string,
        "ambientConditions": string,
        "timeContext": string,
        "weatherInference": string
      },
      "activityContext": {
        "inferredActivity": string,
        "attentionState": string,
        "socialContext": string,
        "engagementLevel": number
      },
      "behavioralPatterns": {
        "routineMatch": string,
        "anomalyDetected": boolean,
        "anomalyDescription": string,
        "stressIndicators": string
      },
      "interactionContext": {
        "interruptionWindow": string,
        "responseLikelihood": number,
        "communicationReadiness": string,
        "bestChannel": string
      },
      "intelligenceSignals": {
        "opportunities": string[],
        "recommendations": string[],
        "optimalTimingWindow": string,
        "contextualActions": string[]
      },
      "confidenceScore": number,
      "processedAt": string
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
          { role: 'user', content: `Sensor Data:\n${JSON.stringify(sensorData, null, 2)}\n\nCapture Context: ${JSON.stringify(captureContext)}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    let sensorIntelligence;
    try {
      sensorIntelligence = JSON.parse(content);
    } catch {
      sensorIntelligence = { rawAnalysis: content, parseError: true };
    }

    // Store sensor intelligence for pattern building
    if (userId) {
      await supabase.from('sensor_intelligence_logs').insert({
        user_id: userId,
        profile_id: profileId,
        sensor_data: sensorData,
        processed_intelligence: sensorIntelligence,
        capture_context: captureContext,
        captured_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      intelligence: sensorIntelligence,
      profileId,
      processedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Mobile sensor intelligence error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
