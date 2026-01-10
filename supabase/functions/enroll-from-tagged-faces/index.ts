import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, getUserPreferredModel, FUNCTION_TO_ANALYSIS_TYPE } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FaceRegion {
  id: string;
  media_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  cropped_storage_path?: string;
  media?: {
    id: string;
    storage_path: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    const { profileId, model: requestedModel, limit = 20 } = await req.json();
    if (!profileId) throw new Error('Missing profileId');

    // Fetch tagged face regions for this profile
    const { data: faceRegions, error: regionsError } = await supabase
      .from('face_regions')
      .select(`
        id, media_id, x, y, width, height, shape,
        cropped_storage_path, cropped_thumbnail_url,
        media:media(id, storage_path)
      `)
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (regionsError) throw regionsError;

    if (!faceRegions || faceRegions.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tagged faces found for this profile' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${faceRegions.length} tagged faces for profile ${profileId}`);

    // Get signed URLs for source images with region coordinates
    const imageContexts: { url: string; region: any }[] = [];
    
    for (const region of faceRegions) {
      // Prefer cropped image if available
      if (region.cropped_storage_path) {
        const { data: signedData } = await supabase.storage
          .from('face-crops')
          .createSignedUrl(region.cropped_storage_path, 3600);
        
        if (signedData?.signedUrl) {
          imageContexts.push({ url: signedData.signedUrl, region });
          continue;
        }
      }
      
      // Fall back to source media
      const mediaData = Array.isArray(region.media) ? region.media[0] : region.media;
      if (mediaData?.storage_path) {
        const { data: signedData } = await supabase.storage
          .from('media')
          .createSignedUrl(mediaData.storage_path, 3600);
        
        if (signedData?.signedUrl) {
          imageContexts.push({ url: signedData.signedUrl, region });
        }
      }
    }

    if (imageContexts.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Could not get URLs for tagged faces' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's preferred model
    const analysisType = FUNCTION_TO_ANALYSIS_TYPE['extract-facial-multiview'] || 'facial_analysis';
    const model = requestedModel || await getUserPreferredModel(user.id, analysisType, 'google/gemini-2.5-flash');

    // Build prompt for multi-view facial analysis from tagged regions
    const regionDescriptions = imageContexts.map((ctx, i) => {
      const r = ctx.region;
      const hasCrop = !!r.cropped_storage_path;
      return `Image ${i + 1}: ${hasCrop ? 'Cropped face' : `Face region at (${Math.round(r.x * 100)}%, ${Math.round(r.y * 100)}%) size ${Math.round(r.width * 100)}%x${Math.round(r.height * 100)}%`}`;
    }).join('\n');

    const prompt = `Analyze these ${imageContexts.length} facial images for biometric enrollment. These are pre-tagged face regions belonging to the SAME person.

${regionDescriptions}

For each image, determine:
1. Face angle (front, left_profile, right_profile, left_45, right_45, slight_up, slight_down)
2. Image quality score (0-1)
3. Unique facial identifiers (moles, scars, birthmarks with approximate positions)

Then provide a combined multi-view signature:
- Coverage score (0-1 based on angles captured)
- Estimated age range
- Key distinctive features visible across multiple angles
- Multi-view embedding description (unique characteristics)

Respond in JSON format:
{
  "images": [{"angle": "front", "quality": 0.9, "identifiers": [...]}],
  "combined": {
    "angles_captured": ["front", "left_45"],
    "coverage_score": 0.6,
    "age_estimation": {"range": "30-35", "confidence": 0.8},
    "unique_identifiers": [{"type": "mole", "location": "left_cheek", "visibility": 0.9}],
    "multi_view_signature": "description of distinctive features"
  }
}`;

    // Build message content with images
    const content: any[] = [
      { type: "text", text: prompt },
      ...imageContexts.map(ctx => ({ 
        type: "image_url", 
        image_url: { url: ctx.url } 
      }))
    ];

    const aiResponse = await callAI({
      model,
      messages: [{ role: 'user', content: JSON.stringify(content) }],
      userId: user.id,
      functionName: 'enroll-from-tagged-faces',
      profileId,
      maxTokens: 2000,
    });

    const analysis: any = parseAIJson(aiResponse.content, null);

    if (!analysis?.combined) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No facial features detected' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update biometrics
    const { data: existing } = await supabase
      .from('contact_biometrics')
      .select('id, facial_sample_count')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle();

    const newSampleCount = (existing?.facial_sample_count || 0) + imageContexts.length;

    const biometricData = {
      facial_multi_angle_data: analysis.combined,
      facial_unique_identifiers: analysis.combined.unique_identifiers,
      facial_age_estimation: analysis.combined.age_estimation,
      facial_sample_count: newSampleCount,
      facial_confidence: analysis.combined.coverage_score,
      facial_last_updated: new Date().toISOString(),
      signature_strength: Math.min((analysis.combined.coverage_score || 0) * 50 + (newSampleCount * 5), 100),
      // Also populate facial_features for matching compatibility
      facial_features: {
        multi_view_signature: analysis.combined.multi_view_signature,
        angles_captured: analysis.combined.angles_captured,
        unique_identifiers: analysis.combined.unique_identifiers,
        age_range: analysis.combined.age_estimation?.range,
        coverage_score: analysis.combined.coverage_score,
        source: 'tagged_faces_enrollment'
      }
    };

    if (existing) {
      await supabase.from('contact_biometrics').update(biometricData).eq('id', existing.id);
    } else {
      await supabase.from('contact_biometrics').insert({ 
        user_id: user.id, 
        profile_id: profileId, 
        ...biometricData 
      });
    }

    // Update face regions to mark them as enrolled
    const regionIds = faceRegions.map((r: any) => r.id);
    await supabase
      .from('face_regions')
      .update({ 
        status: 'enrolled',
        updated_at: new Date().toISOString()
      })
      .in('id', regionIds);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: analysis.combined,
      regionsProcessed: imageContexts.length,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
