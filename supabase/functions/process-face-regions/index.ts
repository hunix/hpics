import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FaceRegion {
  id: string;
  user_id: string;
  media_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, regionId, regionIds, croppedData } = await req.json();

    switch (action) {
      case "upload_crop": {
        // Upload a cropped face image
        if (!regionId || !croppedData) {
          return new Response(
            JSON.stringify({ error: "regionId and croppedData are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the region
        const { data: region, error: regionError } = await supabase
          .from("face_regions")
          .select("*")
          .eq("id", regionId)
          .eq("user_id", user.id)
          .single();

        if (regionError || !region) {
          return new Response(
            JSON.stringify({ error: "Region not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decode base64 image data
        const base64Data = croppedData.split(",")[1] || croppedData;
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Generate filename
        const filename = `face_${region.media_id.slice(0, 8)}_${region.id.slice(0, 8)}_${Date.now()}.jpg`;
        const storagePath = `${user.id}/face-crops/${filename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("face-crops")
          .upload(storagePath, binaryData, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return new Response(
            JSON.stringify({ error: "Failed to upload cropped face" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("face-crops")
          .getPublicUrl(storagePath);

        // Update region with storage path
        const { error: updateError } = await supabase
          .from("face_regions")
          .update({
            cropped_storage_path: storagePath,
            cropped_thumbnail_url: publicUrl,
            status: "cropped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", regionId)
          .eq("user_id", user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update region" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            storagePath,
            thumbnailUrl: publicUrl,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch_status_update": {
        // Update status for multiple regions
        if (!regionIds || !Array.isArray(regionIds)) {
          return new Response(
            JSON.stringify({ error: "regionIds array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { status, error_message } = await req.json();

        const { error: updateError } = await supabase
          .from("face_regions")
          .update({
            status,
            error_message: error_message || null,
            updated_at: new Date().toISOString(),
          })
          .in("id", regionIds)
          .eq("user_id", user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update regions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, updated: regionIds.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_pending": {
        // Get all pending face regions for a user
        const { limit = 100, mediaId } = await req.json();

        let query = supabase
          .from("face_regions")
          .select(`
            *,
            media:media(id, storage_path, thumbnail_url)
          `)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(limit);

        if (mediaId) {
          query = query.eq("media_id", mediaId);
        }

        const { data, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch regions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ regions: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "store_embedding": {
        // Store face embedding for a region
        if (!regionId) {
          return new Response(
            JSON.stringify({ error: "regionId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { embedding, descriptor, features } = await req.json();

        const { error: updateError } = await supabase
          .from("face_regions")
          .update({
            embedding: embedding || null,
            descriptor: descriptor || null,
            features: features || null,
            status: "analyzed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", regionId)
          .eq("user_id", user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to store embedding" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error processing face regions:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
