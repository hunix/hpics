// Process device captures with AI extraction and validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  captureId: string;
  captureType?: string;
}

// Validation helpers
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/<[^>]*>/g, '').slice(0, 10000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    let requestData: ProcessRequest;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { captureId, captureType } = requestData;

    // Validate captureId
    if (!captureId || !isValidUUID(captureId)) {
      return new Response(
        JSON.stringify({ error: "Invalid capture ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch capture
    const { data: capture, error: fetchError } = await supabase
      .from('device_captures')
      .select('*')
      .eq('id', captureId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !capture) {
      return new Response(
        JSON.stringify({ error: "Capture not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (capture.status === 'processed' || capture.status === 'applied') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Already processed",
          data: capture.extracted_data 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const type = captureType || capture.capture_type;
    let processedData: Record<string, unknown> = {};
    let confidenceScore = 0;
    let matchedProfileId: string | null = null;

    console.log(`Processing ${type} capture ${captureId} for user ${user.id}`);
    
    // Get AI config from platform settings
    const aiConfig = await getAIConfig(supabase, user.id);

    // Process based on capture type
    switch (type) {
      case 'social_profile': {
        // Use AI to extract structured data from social profile
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: aiConfig.speedModel,
            messages: [
              {
                role: "system",
                content: `Extract structured contact information from social profile data.
Return a JSON object with these fields (use null for unknown):
{
  "first_name": string,
  "last_name": string,
  "email": string | null,
  "phone": string | null,
  "company": string | null,
  "title": string | null,
  "location": string | null,
  "linkedin_url": string | null,
  "twitter_url": string | null,
  "bio": string | null,
  "skills": string[],
  "education": string[],
  "experience_summary": string | null,
  "confidence": number (0-1)
}`
              },
              {
                role: "user",
                content: `Extract contact info from:\n${capture.raw_content || JSON.stringify(capture.extracted_data || capture.metadata)}\n\nSource: ${capture.source_app || 'unknown'}`
              }
            ],
            temperature: aiConfig.temperature,
            max_tokens: 2000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          try {
            const jsonMatch = content?.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              processedData = JSON.parse(jsonMatch[0]);
              confidenceScore = Number(processedData.confidence) || 0.5;
            }
          } catch (e) {
            console.error("Failed to parse AI response:", e);
            processedData = { raw_extraction_failed: true, content };
            confidenceScore = 0.2;
          }

          // Try to match to existing profile
          if (processedData.first_name || processedData.email) {
            const { data: matches } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('user_id', user.id)
              .or(`email.eq.${processedData.email},first_name.ilike.${processedData.first_name}`)
              .limit(5);

            if (matches && matches.length > 0) {
              // Simple matching - take first match
              matchedProfileId = matches[0].id;
              processedData.matched_profile = matches[0];
            }
          }
        } else if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break;
      }

      case 'health_data': {
        // Parse health data without AI
        const rawData = (capture.metadata || {}) as Record<string, unknown>;
        processedData = {
          data_type: 'health',
          metrics: rawData.metrics || {},
          timestamp: rawData.timestamp || capture.created_at,
          device_info: rawData.device || {},
        };
        confidenceScore = 0.9; // Health data is usually reliable
        break;
      }

      case 'voice_sample': {
        // Queue for voice processing (transcription, speaker ID)
        const { error: queueError } = await supabase
          .from('intelligence_queue')
          .insert({
            user_id: user.id,
            job_type: 'process_voice',
            payload: { captureId, rawContent: capture.raw_content },
            priority: 7,
          });

        if (queueError) {
          console.error("Failed to queue voice processing:", queueError);
        }

        processedData = { queued_for_voice_processing: true };
        confidenceScore = 0.1; // Pending processing
        break;
      }

      case 'photo': {
        // Photos would need vision AI - mark for manual review
        processedData = {
          needs_manual_review: true,
          preview_generated: false,
        };
        confidenceScore = 0.1;
        break;
      }

      case 'document': {
        // Queue for document processing
        const { error: queueError } = await supabase
          .from('intelligence_queue')
          .insert({
            user_id: user.id,
            job_type: 'embed_content',
            payload: { 
              sourceType: 'device_capture',
              sourceId: captureId,
              content: capture.raw_content || JSON.stringify(capture.extracted_data),
            },
            priority: 5,
          });

        if (queueError) {
          console.error("Failed to queue document processing:", queueError);
        }

        processedData = { queued_for_embedding: true };
        confidenceScore = 0.1;
        break;
      }

      default:
        processedData = { 
          raw_data_preserved: true,
          processing_skipped: true,
          reason: `Unknown capture type: ${type}`,
        };
        confidenceScore = 0;
    }

    // Update capture with processed data
    const { error: updateError } = await supabase
      .from('device_captures')
      .update({
        status: 'processed',
        ai_analysis: processedData,
        confidence_score: confidenceScore,
        profile_id: matchedProfileId || capture.profile_id,
        processing_completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', captureId);

    if (updateError) {
      console.error("Failed to update capture:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save processed data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`Processed capture ${captureId} in ${duration}ms, confidence: ${confidenceScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        captureId,
        processedData,
        confidenceScore,
        matchedProfileId,
        durationMs: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Process capture error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
