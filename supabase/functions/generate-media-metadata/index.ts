import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataRequest {
  mode: 'single' | 'batch';
  mediaIds?: string[];
  documentIds?: string[];
  regenerate?: boolean;
  model?: string;
}

// Pricing per 1M tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: MetadataRequest = await req.json();
    const { mode, mediaIds = [], documentIds = [], regenerate = false, model = 'google/gemini-2.5-flash' } = body;

    const results: Array<{ id: string; type: 'media' | 'document'; success: boolean; error?: string }> = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Process media items
    for (const mediaId of mediaIds) {
      try {
        // Fetch media record
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .eq('id', mediaId)
          .single();

        if (mediaError || !media) {
          results.push({ id: mediaId, type: 'media', success: false, error: 'Media not found' });
          continue;
        }

        // Skip if already processed and not regenerating
        if (media.ai_metadata && !regenerate) {
          results.push({ id: mediaId, type: 'media', success: true, error: 'Already processed' });
          continue;
        }

        // Update status to processing
        await supabase
          .from('media')
          .update({ ai_generation_status: 'processing', ai_generation_error: null })
          .eq('id', mediaId);

        // Get signed URL for the file
        const storagePath = media.storage_path || media.file_url;
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('media')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !signedUrlData?.signedUrl) {
          await supabase
            .from('media')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'Could not get file URL' })
            .eq('id', mediaId);
          results.push({ id: mediaId, type: 'media', success: false, error: 'Could not get file URL' });
          continue;
        }

        // Determine prompt based on media type
        const isImage = media.mime_type?.startsWith('image/');
        const isAudio = media.mime_type?.startsWith('audio/');
        const isVideo = media.mime_type?.startsWith('video/');

        let systemPrompt = '';
        let userPrompt = '';

        if (isImage) {
          systemPrompt = `You are an AI that analyzes images and extracts structured metadata for a personal intelligence system.`;
          userPrompt = `Analyze this image and extract structured metadata. Use the extract_image_metadata function to return your analysis.`;
        } else if (isAudio) {
          systemPrompt = `You are an AI that analyzes audio content and extracts structured metadata for a personal intelligence system.`;
          userPrompt = `Analyze this audio and extract structured metadata including transcription if possible. Use the extract_audio_metadata function to return your analysis.`;
        } else if (isVideo) {
          systemPrompt = `You are an AI that analyzes video content and extracts structured metadata for a personal intelligence system.`;
          userPrompt = `Analyze this video and extract structured metadata. Use the extract_video_metadata function to return your analysis.`;
        } else {
          results.push({ id: mediaId, type: 'media', success: false, error: 'Unsupported media type' });
          continue;
        }

        // Define tools for structured output
        const tools = isImage ? [
          {
            type: "function",
            function: {
              name: "extract_image_metadata",
              description: "Extract structured metadata from an image",
              parameters: {
                type: "object",
                properties: {
                  ai_description: { type: "string", description: "2-3 sentence description of what's in the image" },
                  detected_objects: { type: "array", items: { type: "string" }, description: "Objects/items visible in the image" },
                  detected_faces_count: { type: "number", description: "Count of human faces detected" },
                  detected_text: { type: "string", description: "Any text visible in the image (OCR)" },
                  scene_type: { type: "string", enum: ["indoor", "outdoor", "portrait", "document", "screenshot", "artwork", "other"] },
                  mood: { type: "string", enum: ["happy", "formal", "casual", "serious", "celebratory", "professional", "neutral"] },
                  quality_score: { type: "number", description: "Image quality rating 0-100" },
                  is_screenshot: { type: "boolean" },
                  contains_document: { type: "boolean" },
                  tags: { type: "array", items: { type: "string" }, description: "5-10 searchable keywords" },
                  colors_dominant: { type: "array", items: { type: "string" }, description: "Dominant colors in the image" },
                  people_description: { type: "string", description: "Brief description of people if present" }
                },
                required: ["ai_description", "scene_type", "tags"],
                additionalProperties: false
              }
            }
          }
        ] : isAudio ? [
          {
            type: "function",
            function: {
              name: "extract_audio_metadata",
              description: "Extract structured metadata from audio",
              parameters: {
                type: "object",
                properties: {
                  transcription: { type: "string", description: "Full or partial transcription of the audio" },
                  language: { type: "string", description: "Detected language code (e.g., en, es, fr)" },
                  speaker_count: { type: "number", description: "Estimated number of speakers" },
                  topics: { type: "array", items: { type: "string" }, description: "Main discussion topics" },
                  sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
                  summary: { type: "string", description: "1-2 sentence summary" },
                  audio_type: { type: "string", enum: ["conversation", "speech", "music", "voicemail", "other"] },
                  tags: { type: "array", items: { type: "string" }, description: "Searchable keywords" },
                  key_phrases: { type: "array", items: { type: "string" }, description: "Important phrases mentioned" }
                },
                required: ["summary", "audio_type", "tags"],
                additionalProperties: false
              }
            }
          }
        ] : [
          {
            type: "function",
            function: {
              name: "extract_video_metadata",
              description: "Extract structured metadata from video",
              parameters: {
                type: "object",
                properties: {
                  ai_description: { type: "string", description: "Description of the video content" },
                  scene_types: { type: "array", items: { type: "string" }, description: "Types of scenes in the video" },
                  detected_faces_count: { type: "number", description: "Approximate count of unique faces" },
                  topics: { type: "array", items: { type: "string" }, description: "Main topics or activities" },
                  mood: { type: "string", enum: ["happy", "formal", "casual", "serious", "celebratory", "professional", "neutral"] },
                  audio_present: { type: "boolean" },
                  speech_present: { type: "boolean" },
                  summary: { type: "string", description: "Brief summary of video content" },
                  tags: { type: "array", items: { type: "string" }, description: "Searchable keywords" }
                },
                required: ["ai_description", "summary", "tags"],
                additionalProperties: false
              }
            }
          }
        ];

        // Build the messages with image/audio URL
        const messages: Array<{ role: string; content: any }> = [
          { role: "system", content: systemPrompt }
        ];

        if (isImage) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: signedUrlData.signedUrl } }
            ]
          });
        } else {
          // For audio/video, include URL in text
          messages.push({
            role: "user",
            content: `${userPrompt}\n\nMedia URL: ${signedUrlData.signedUrl}`
          });
        }

        // Call Lovable AI Gateway
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: { type: "function", function: { name: tools[0].function.name } },
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          
          await supabase
            .from('media')
            .update({ 
              ai_generation_status: 'failed', 
              ai_generation_error: `AI API error: ${aiResponse.status}` 
            })
            .eq('id', mediaId);
          
          results.push({ id: mediaId, type: 'media', success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall?.function?.arguments) {
          await supabase
            .from('media')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'No metadata extracted' })
            .eq('id', mediaId);
          results.push({ id: mediaId, type: 'media', success: false, error: 'No metadata extracted' });
          continue;
        }

        const metadata = JSON.parse(toolCall.function.arguments);
        const inputTokens = aiData.usage?.prompt_tokens || 0;
        const outputTokens = aiData.usage?.completion_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        // Calculate cost
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
        const costCents = Math.ceil(
          ((inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output) * 100
        );

        // Save metadata
        await supabase
          .from('media')
          .update({
            ai_metadata: metadata,
            ai_metadata_generated_at: new Date().toISOString(),
            ai_model_used: model,
            ai_generation_status: 'completed',
            ai_generation_error: null,
          })
          .eq('id', mediaId);

        // Log usage
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          profile_id: media.profile_id,
          function_name: 'generate-media-metadata',
          provider: model.split('/')[0],
          model_name: model,
          estimated_cost_cents: costCents,
          actual_cost_cents: costCents,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          status: 'completed',
          request_metadata: { mediaId, mimeType: media.mime_type },
        });

        results.push({ id: mediaId, type: 'media', success: true });
        console.log(`Processed media ${mediaId}: ${inputTokens + outputTokens} tokens, $${(costCents / 100).toFixed(4)}`);

      } catch (itemError) {
        console.error(`Error processing media ${mediaId}:`, itemError);
        await supabase
          .from('media')
          .update({ 
            ai_generation_status: 'failed', 
            ai_generation_error: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', mediaId);
        results.push({ 
          id: mediaId, 
          type: 'media', 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    // Process documents (similar logic)
    for (const documentId of documentIds) {
      try {
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError || !doc) {
          results.push({ id: documentId, type: 'document', success: false, error: 'Document not found' });
          continue;
        }

        if (doc.ai_metadata && !regenerate) {
          results.push({ id: documentId, type: 'document', success: true, error: 'Already processed' });
          continue;
        }

        await supabase
          .from('documents')
          .update({ ai_generation_status: 'processing', ai_generation_error: null })
          .eq('id', documentId);

        const storagePath = doc.storage_path || doc.file_url;
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600);

        if (urlError || !signedUrlData?.signedUrl) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'Could not get file URL' })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: 'Could not get file URL' });
          continue;
        }

        const tools = [
          {
            type: "function",
            function: {
              name: "extract_document_metadata",
              description: "Extract structured metadata from a document",
              parameters: {
                type: "object",
                properties: {
                  ai_summary: { type: "string", description: "2-3 sentence summary of the document" },
                  document_category: { type: "string", enum: ["resume", "contract", "report", "article", "presentation", "notes", "form", "letter", "other"] },
                  topics: { type: "array", items: { type: "string" }, description: "Main topics covered" },
                  key_entities: { type: "array", items: { type: "string" }, description: "Important names, companies, dates mentioned" },
                  sentiment: { type: "string", enum: ["positive", "negative", "neutral", "formal"] },
                  language: { type: "string", description: "Primary language of the document" },
                  tags: { type: "array", items: { type: "string" }, description: "Searchable keywords" },
                  action_items: { type: "array", items: { type: "string" }, description: "Any action items or todos mentioned" }
                },
                required: ["ai_summary", "document_category", "tags"],
                additionalProperties: false
              }
            }
          }
        ];

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are an AI that analyzes documents and extracts structured metadata for a personal intelligence system." },
              { role: "user", content: `Analyze this document and extract structured metadata. Document URL: ${signedUrlData.signedUrl}\nDocument title: ${doc.title}\nDocument type: ${doc.document_type}` }
            ],
            tools,
            tool_choice: { type: "function", function: { name: "extract_document_metadata" } },
          }),
        });

        if (!aiResponse.ok) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: `AI API error: ${aiResponse.status}` })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        if (!toolCall?.function?.arguments) {
          await supabase
            .from('documents')
            .update({ ai_generation_status: 'failed', ai_generation_error: 'No metadata extracted' })
            .eq('id', documentId);
          results.push({ id: documentId, type: 'document', success: false, error: 'No metadata extracted' });
          continue;
        }

        const metadata = JSON.parse(toolCall.function.arguments);
        const inputTokens = aiData.usage?.prompt_tokens || 0;
        const outputTokens = aiData.usage?.completion_tokens || 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
        const costCents = Math.ceil(
          ((inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output) * 100
        );

        await supabase
          .from('documents')
          .update({
            ai_metadata: metadata,
            ai_metadata_generated_at: new Date().toISOString(),
            ai_model_used: model,
            ai_generation_status: 'completed',
            ai_generation_error: null,
          })
          .eq('id', documentId);

        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          profile_id: doc.profile_id,
          function_name: 'generate-media-metadata',
          provider: model.split('/')[0],
          model_name: model,
          estimated_cost_cents: costCents,
          actual_cost_cents: costCents,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          status: 'completed',
          request_metadata: { documentId, documentType: doc.document_type },
        });

        results.push({ id: documentId, type: 'document', success: true });
        console.log(`Processed document ${documentId}: ${inputTokens + outputTokens} tokens`);

      } catch (itemError) {
        console.error(`Error processing document ${documentId}:`, itemError);
        await supabase
          .from('documents')
          .update({ 
            ai_generation_status: 'failed', 
            ai_generation_error: itemError instanceof Error ? itemError.message : 'Unknown error'
          })
          .eq('id', documentId);
        results.push({ 
          id: documentId, 
          type: 'document', 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    // Calculate total cost
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['google/gemini-2.5-flash'];
    const totalCostCents = Math.ceil(
      ((totalInputTokens / 1_000_000) * pricing.input + (totalOutputTokens / 1_000_000) * pricing.output) * 100
    );

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalInputTokens,
        totalOutputTokens,
        totalCostCents,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-media-metadata error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
