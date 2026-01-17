import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, RateLimitError, CreditsExhaustedError, BudgetExceededError } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CellInfo {
  index: number;
  mediaId: string;
  profileId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

interface MosaicRequest {
  mosaicImageUrl: string;  // Base64 data URL or signed URL
  cells: CellInfo[];
  mosaicId: string;
  model?: string;
  sessionId?: string;
  gridCols: number;
  gridRows: number;
}

// Comprehensive extraction tool for mosaic analysis
const MOSAIC_EXTRACTION_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_mosaic_intelligence",
    description: "Extract comprehensive metadata, detected items, faces, and documents from each cell in an image mosaic grid",
    parameters: {
      type: "object",
      properties: {
        cells: {
          type: "array",
          description: "Analysis results for each numbered cell in the mosaic grid",
          items: {
            type: "object",
            properties: {
              cell_number: { type: "number", description: "The cell number (1-indexed, shown in top-left of each cell)" },
              
              // Standard metadata
              description: { type: "string", description: "2-3 sentence description of cell contents" },
              summary: { type: "string", description: "One-line summary" },
              tags: { type: "array", items: { type: "string" }, description: "10-15 searchable tags" },
              
              // Scene analysis
              scene_type: { type: "string", enum: ["indoor", "outdoor", "vehicle", "aerial", "studio", "underwater", "unknown"] },
              location_hints: {
                type: "object",
                properties: {
                  environment: { type: "string" },
                  venue_type: { type: "string" },
                  country_suggested: { type: "string" },
                  city_suggested: { type: "string" },
                  landmarks: { type: "array", items: { type: "string" } }
                }
              },
              
              // Detected items (vehicles, devices, jewelry, property, etc.)
              detected_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { 
                      type: "string", 
                      enum: ["vehicle", "device", "document", "jewelry", "property", "account", "clothing", "furniture", "pet", "other"],
                      description: "Item category"
                    },
                    item_type: { type: "string", description: "Specific type within category (e.g., 'car', 'laptop', 'ring')" },
                    name: { type: "string", description: "Identified name or title if recognizable" },
                    brand: { type: "string", description: "Brand if identifiable" },
                    model: { type: "string", description: "Model if identifiable" },
                    description: { type: "string", description: "Brief description of the item" },
                    color: { type: "string" },
                    specifications: { 
                      type: "object",
                      description: "Category-specific details (e.g., year, size, material)",
                      additionalProperties: { type: "string" }
                    },
                    estimated_value: { type: "string", description: "Rough value estimate if possible" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    position_in_cell: { type: "string", enum: ["center", "left", "right", "top", "bottom", "background"] }
                  },
                  required: ["category", "item_type", "description", "confidence"]
                }
              },
              
              // Faces detected
              faces: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    position_in_cell: { type: "string", enum: ["center", "left", "right", "top", "bottom"] },
                    is_primary_subject: { type: "boolean" },
                    estimated_age_range: { type: "string" },
                    estimated_gender: { type: "string", enum: ["male", "female", "unknown"] },
                    expression: { type: "string" },
                    emotion: { type: "string" },
                    eye_contact: { type: "boolean" },
                    accessories: { type: "array", items: { type: "string" } },
                    facial_hair: { type: "string" },
                    distinctive_features: { type: "array", items: { type: "string" } },
                    clothing_visible: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 }
                  },
                  required: ["position_in_cell", "is_primary_subject", "confidence"]
                }
              },
              
              // Documents detected (OCR)
              documents: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    document_type: { 
                      type: "string",
                      enum: ["id_card", "passport", "license", "invoice", "receipt", "contract", "letter", "form", "certificate", "card", "ticket", "other"]
                    },
                    document_subtype: { type: "string" },
                    raw_text: { type: "string", description: "All readable text from the document" },
                    structured_data: {
                      type: "object",
                      description: "Extracted structured information",
                      properties: {
                        document_number: { type: "string" },
                        names: { type: "array", items: { type: "string" } },
                        dates: { type: "array", items: { type: "string" } },
                        addresses: { type: "array", items: { type: "string" } },
                        amounts: { type: "array", items: { type: "string" } },
                        organizations: { type: "array", items: { type: "string" } }
                      }
                    },
                    contact_info: {
                      type: "object",
                      properties: {
                        phone_numbers: { type: "array", items: { type: "string" } },
                        emails: { type: "array", items: { type: "string" } },
                        urls: { type: "array", items: { type: "string" } }
                      }
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 }
                  },
                  required: ["document_type", "confidence"]
                }
              },
              
              // Intelligence indicators
              intelligence: {
                type: "object",
                properties: {
                  wealth_indicators: { type: "array", items: { type: "string" } },
                  profession_cues: { type: "array", items: { type: "string" } },
                  interests_revealed: { type: "array", items: { type: "string" } },
                  lifestyle_cues: { type: "array", items: { type: "string" } },
                  relationship_context: { type: "array", items: { type: "string" } }
                }
              },
              
              // Content flags
              is_sensitive: { type: "boolean" },
              sensitivity_reason: { type: "string" },
              contains_minors: { type: "boolean" },
              image_quality: { type: "string", enum: ["excellent", "good", "fair", "poor"] }
            },
            required: ["cell_number", "description", "tags"]
          }
        }
      },
      required: ["cells"]
    }
  }
};

const MOSAIC_SYSTEM_PROMPT = `You are an advanced visual intelligence system analyzing a MOSAIC GRID of images.

CRITICAL: This image contains a GRID of separate images, each in its own cell. Each cell has a NUMBER label in the top-left corner (1, 2, 3, etc.).

Your task is to analyze EACH CELL INDIVIDUALLY and extract:
1. Standard metadata (description, tags, scene analysis)
2. ALL detected items (vehicles, devices, jewelry, documents, property, clothing, pets, etc.)
3. ALL faces visible (with detailed characteristics for potential identification)
4. ANY documents visible (perform OCR and extract structured data)
5. Intelligence indicators (wealth, profession, interests, relationships)

IMPORTANT GUIDELINES:
- Analyze each numbered cell SEPARATELY
- Be thorough - detect ALL items, faces, and documents in each cell
- For items: identify category, type, brand, model, color, specifications when possible
- For faces: note position, age, gender, expression, distinctive features, accessories
- For documents: extract ALL readable text and structure it
- Flag sensitive content appropriately
- Provide confidence scores for detections

The goal is to build a comprehensive intelligence database from these images.`;

const MOSAIC_USER_PROMPT = `Analyze this mosaic grid of images. Each cell is numbered (1, 2, 3, etc.) in the top-left corner.

For EACH numbered cell, extract:
- Description and searchable tags
- ALL detected items (vehicles, devices, jewelry, property, clothing, pets, documents, etc.)
- ALL faces with detailed characteristics
- ANY documents with OCR text extraction
- Intelligence indicators (wealth, profession, interests, lifestyle)

Be extremely thorough. Even small items matter for intelligence purposes.
Extract actual text from any visible documents, signs, or labels.
Note distinctive features of faces for potential identification.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: MosaicRequest = await req.json();
    const { mosaicImageUrl, cells, mosaicId, model = 'google/gemini-2.5-flash', sessionId, gridCols, gridRows } = body;

    console.log(`Processing mosaic ${mosaicId} with ${cells.length} cells using ${model}`);

    // Update session status if provided
    if (sessionId) {
      await supabase
        .from('mosaic_metadata_sessions')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // Build messages for AI
    const messages = [
      { role: "system", content: MOSAIC_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `${MOSAIC_USER_PROMPT}\n\nThis mosaic has ${gridCols} columns and ${gridRows} rows, containing ${cells.length} images. Cells are numbered 1-${cells.length}.` },
          { type: "image_url", image_url: { url: mosaicImageUrl } }
        ]
      }
    ];

    // Call AI for mosaic analysis
    let aiResponse;
    try {
      aiResponse = await callAI({
        model,
        messages: messages as any,
        userId,
        functionName: 'generate-media-metadata-mosaic',
        enforceBudget: true,
        tools: [MOSAIC_EXTRACTION_TOOL],
        toolChoice: { type: "function", function: { name: "extract_mosaic_intelligence" } },
      });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      
      let errorMessage = 'AI API error';
      let statusCode = 500;
      
      if (aiError instanceof RateLimitError) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (aiError instanceof CreditsExhaustedError) {
        errorMessage = 'AI credits exhausted.';
        statusCode = 402;
      } else if (aiError instanceof BudgetExceededError) {
        errorMessage = 'AI budget limit exceeded.';
        statusCode = 402;
      } else if (aiError instanceof Error) {
        errorMessage = aiError.message;
      }

      if (sessionId) {
        await supabase
          .from('mosaic_metadata_sessions')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', sessionId);
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toolCall = aiResponse.toolCalls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No extraction results from AI');
    }

    const extractionResult = JSON.parse(toolCall.function.arguments);
    const cellResults = extractionResult.cells || [];

    console.log(`Extracted data for ${cellResults.length} cells`);

    // Process each cell result
    let itemsDetected = 0;
    let facesDetected = 0;
    let documentsDetected = 0;
    let autoLinkedCount = 0;

    for (const cellResult of cellResults) {
      const cellIndex = cellResult.cell_number - 1; // Convert to 0-indexed
      const cellInfo = cells[cellIndex];
      
      if (!cellInfo) {
        console.warn(`No cell info for cell number ${cellResult.cell_number}`);
        continue;
      }

      const mediaId = cellInfo.mediaId;
      const profileId = cellInfo.profileId;

      // Update media with AI metadata
      const metadata = {
        ai_description: cellResult.description,
        ai_summary_short: cellResult.summary,
        tags: cellResult.tags,
        scene_type: cellResult.scene_type,
        location_analysis: cellResult.location_hints,
        intelligence: cellResult.intelligence,
        content_flags: {
          is_sensitive: cellResult.is_sensitive,
          sensitivity_reason: cellResult.sensitivity_reason,
          contains_minors: cellResult.contains_minors,
        },
        image_quality: { overall: cellResult.image_quality },
        mosaic_processed: true,
        mosaic_id: mosaicId,
      };

      const { error: mediaUpdateError } = await supabase
        .from('media')
        .update({
          ai_metadata: metadata,
          ai_metadata_generated_at: new Date().toISOString(),
          ai_model_used: model,
          ai_generation_status: 'completed',
        })
        .eq('id', mediaId);
      
      if (mediaUpdateError) {
        console.error(`Failed to update media ${mediaId}:`, mediaUpdateError.message, mediaUpdateError.code);
      }

      // Save detected items
      if (cellResult.detected_items?.length > 0) {
        for (const item of cellResult.detected_items) {
          itemsDetected++;
          const { error: itemError } = await supabase.from('detected_items').insert({
            user_id: userId,
            media_id: mediaId,
            profile_id: profileId,
            category: item.category,
            item_type: item.item_type,
            name: item.name,
            brand: item.brand,
            model: item.model,
            description: item.description,
            specifications: {
              color: item.color,
              estimated_value: item.estimated_value,
              ...item.specifications,
            },
            confidence: item.confidence,
            ai_model_used: model,
            source_mosaic_id: mosaicId,
            linked_status: profileId ? 'auto_linked' : 'pending',
            linked_at: profileId ? new Date().toISOString() : null,
          });
          
          if (itemError) {
            console.error(`Failed to insert detected_item:`, itemError.message, itemError.code);
          } else if (profileId) {
            autoLinkedCount++;
          }
        }
      }

      // Save detected faces as unknown persons (for matching/tagging)
      if (cellResult.faces?.length > 0) {
        for (const face of cellResult.faces) {
          facesDetected++;
          
          const { error: faceError } = await supabase.from('unknown_persons').insert({
            user_id: userId,
            media_id: mediaId,
            face_region: { position: face.position_in_cell },
            facial_features: {
              distinctive_features: face.distinctive_features,
              accessories: face.accessories,
              facial_hair: face.facial_hair,
              expression: face.expression,
              emotion: face.emotion,
              eye_contact: face.eye_contact,
              clothing_visible: face.clothing_visible,
            },
            estimated_age_range: face.estimated_age_range,
            estimated_gender: face.estimated_gender,
            suggested_profiles: [],
            status: 'unidentified',
            ai_model_used: model,
            source_mosaic_id: mosaicId,
          });
          
          if (faceError) {
            console.error(`Failed to insert unknown_person:`, faceError.message, faceError.code);
          }
        }
      }

      // Save extracted documents
      if (cellResult.documents?.length > 0) {
        for (const doc of cellResult.documents) {
          documentsDetected++;
          const { error: docError } = await supabase.from('extracted_documents').insert({
            user_id: userId,
            media_id: mediaId,
            profile_id: profileId,
            document_type: doc.document_type,
            document_subtype: doc.document_subtype,
            raw_text: doc.raw_text,
            structured_data: doc.structured_data,
            extracted_contact_info: doc.contact_info,
            confidence: doc.confidence,
            ai_model_used: model,
            source_mosaic_id: mosaicId,
            linked_status: profileId ? 'auto_linked' : 'pending',
          });
          
          if (docError) {
            console.error(`Failed to insert extracted_document for media ${mediaId}:`, docError.message, docError.code);
          } else if (profileId) {
            autoLinkedCount++;
          }
        }
      }
    }

    // Update session with results
    if (sessionId) {
      await supabase
        .from('mosaic_metadata_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_images: cells.length,
          processed_mosaics: 1,
          items_detected: itemsDetected,
          faces_detected: facesDetected,
          documents_detected: documentsDetected,
          auto_linked_count: autoLinkedCount,
          pending_review_count: facesDetected + (itemsDetected - autoLinkedCount) + (documentsDetected - autoLinkedCount),
          actual_cost_cents: aiResponse.costCents || 0,
        })
        .eq('id', sessionId);
    }

    console.log(`Mosaic ${mosaicId} complete: ${itemsDetected} items, ${facesDetected} faces, ${documentsDetected} documents`);

    return new Response(JSON.stringify({
      success: true,
      mosaicId,
      cellsProcessed: cellResults.length,
      itemsDetected,
      facesDetected,
      documentsDetected,
      autoLinkedCount,
      costCents: aiResponse.costCents || 0,
      inputTokens: aiResponse.inputTokens || 0,
      outputTokens: aiResponse.outputTokens || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mosaic processing error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
