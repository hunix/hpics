import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileExtractionResult {
  name?: {
    first?: string;
    last?: string;
    full?: string;
  };
  headline?: string;
  bio?: string;
  organization?: string;
  job_title?: string;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  profile_url?: string;
  connections_count?: number;
  followers_count?: number;
  mutual_connections?: string[];
  work_history?: Array<{
    company: string;
    title: string;
    duration?: string;
    current?: boolean;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    year?: string;
  }>;
  skills?: string[];
  interests?: string[];
  certifications?: string[];
  profile_photo_detected?: boolean;
  platform_detected?: string;
  confidence_score?: number;
  raw_text_extracted?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      imageUrls, 
      sourceType = 'auto', 
      profileId,
      captureId,
      deviceSource 
    } = await req.json();

    if (!imageUrls || imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[parse-screenshot-profile] Processing ${imageUrls.length} images for user ${user.id}`);

    // Update capture status if provided
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({ status: 'processing', processing_started_at: new Date().toISOString() })
        .eq('id', captureId);
    }

    // Build multimodal content for AI
    const imageContent = imageUrls.map((url: string) => ({
      type: 'image_url',
      image_url: { url, detail: 'high' }
    }));

    const systemPrompt = `You are an expert at extracting structured profile data from screenshots of social media profiles and business cards.

Your task is to analyze the provided screenshot(s) and extract all visible profile information into a structured format.

SUPPORTED PLATFORMS:
- LinkedIn (profiles, company pages)
- Instagram (personal profiles, business profiles)
- Twitter/X (profiles)
- Facebook (profiles, pages)
- WhatsApp (contact info screens)
- Business cards (photographed)
- Email signatures

EXTRACTION RULES:
1. Extract ALL visible text and data points
2. Identify the platform from visual cues (UI elements, colors, layout)
3. For names, try to separate first and last name
4. For work history, identify current vs past positions
5. Extract profile photo presence (not the image itself)
6. Note any mutual connections or followers count
7. Extract skills, interests, certifications if visible
8. Provide a confidence score (0-1) based on data quality

OUTPUT FORMAT:
Return a JSON object with the extracted profile data. Include only fields that have actual data.`;

    const userPrompt = sourceType === 'auto' 
      ? 'Analyze this screenshot and extract all profile information. Detect the platform automatically.'
      : `This is a screenshot from ${sourceType}. Extract all profile information visible.`;

    // Use vision-capable model for screenshot analysis
    const model = selectModel('quality', 'google'); // gemini-2.5-pro for vision

    const aiResponse = await callAI({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userPrompt },
            ...imageContent
          ]
        }
      ],
      userId: user.id,
      functionName: 'parse-screenshot-profile',
      profileId,
      temperature: 0.3,
      maxTokens: 4000,
      metadata: {
        imageCount: imageUrls.length,
        sourceType,
        deviceSource,
      }
    });

    const extractedData = parseAIJson<ProfileExtractionResult>(aiResponse.content, {});

    console.log(`[parse-screenshot-profile] Extracted data:`, {
      name: extractedData.name,
      platform: extractedData.platform_detected,
      confidence: extractedData.confidence_score,
    });

    // Update capture or screenshot import with results
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({ 
          status: 'review',
          extracted_data: extractedData,
          confidence_score: extractedData.confidence_score || 0.5,
          processing_completed_at: new Date().toISOString(),
          ai_analysis: {
            model: aiResponse.model,
            tokens: aiResponse.totalTokens,
            costCents: aiResponse.costCents,
          }
        })
        .eq('id', captureId);
    }

    // Log device sync
    if (deviceSource) {
      await supabase.from('device_sync_log').insert({
        user_id: user.id,
        device_id: `${deviceSource}-${Date.now()}`,
        device_type: deviceSource,
        sync_type: 'screenshot',
        data_count: imageUrls.length,
        metadata: {
          sourceType,
          platform_detected: extractedData.platform_detected,
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      extractedData,
      confidence: extractedData.confidence_score || 0.5,
      platform: extractedData.platform_detected || sourceType,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[parse-screenshot-profile] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to parse screenshot' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
