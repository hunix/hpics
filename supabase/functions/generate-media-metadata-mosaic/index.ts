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
  bulkItemId?: string; // ID from bulk_analysis_items for direct updates
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
  sessionId?: string; // bulk_analysis_sessions ID for direct counter updates
  bulkSessionId?: string; // alias for sessionId (bulk_analysis_sessions)
  gridCols: number;
  gridRows: number;
  analysisModes?: string[]; // The actual analysis modes being run (e.g., face_intelligence, scene_intelligence)
}

// Helper to increment bulk_analysis_sessions counters directly
async function incrementSessionProgress(
  supabase: any,
  bulkSessionId: string,
  completedCount: number,
  failedCount: number,
  costCents: number
) {
  if (!bulkSessionId) return;
  
  try {
    // Get current session counters
    const { data: currentSession } = await supabase
      .from('bulk_analysis_sessions')
      .select('completed_items, failed_items, current_cost_cents')
      .eq('id', bulkSessionId)
      .single();
    
    if (currentSession) {
      const newCompleted = ((currentSession as any).completed_items || 0) + completedCount;
      const newFailed = ((currentSession as any).failed_items || 0) + failedCount;
      const newCost = ((currentSession as any).current_cost_cents || 0) + costCents;
      
      await supabase
        .from('bulk_analysis_sessions')
        .update({
          completed_items: newCompleted,
          failed_items: newFailed,
          current_cost_cents: newCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bulkSessionId);
      
      console.log(`[Background] Updated bulk_analysis_sessions ${bulkSessionId}: completed=${newCompleted}, failed=${newFailed}, cost=${newCost}`);
    }
  } catch (error) {
    console.error(`[Background] Failed to increment session progress:`, error);
  }
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
5. Intelligence indicators (wealth, profession, interests, relationships) - ALWAYS EXTRACT THESE

IMPORTANT GUIDELINES:
- Analyze each numbered cell SEPARATELY
- Be thorough - detect ALL items, faces, and documents in each cell
- For items: identify category, type, brand, model, color, specifications when possible
- For faces: note position, age, gender, expression, distinctive features, accessories
- For documents: extract ALL readable text and structure it
- Flag sensitive content appropriately
- Provide confidence scores for detections

INTELLIGENCE EXTRACTION IS MANDATORY:
- ALWAYS populate the intelligence object for EVERY cell, even for generic images
- For wealth_indicators: look for luxury items, travel destinations, dining, vehicles, property, branded items, or infer from context ("no visible luxury items" is acceptable)
- For profession_cues: look for uniforms, tools, office settings, equipment, badges, or infer from context ("casual setting - no profession visible" is acceptable)
- For interests_revealed: analyze activities, hobbies, sports, entertainment, reading material, decorations
- For lifestyle_cues: analyze settings, social contexts, frequency patterns, habits visible
- For relationship_context: note if people are together, family settings, social gatherings, alone
- If no clear indicators exist, provide contextual inferences with lower confidence (e.g., "appears to have moderate lifestyle based on environment")

The goal is to build a comprehensive intelligence database from these images.`;

const MOSAIC_USER_PROMPT = `Analyze this mosaic grid of images. Each cell is numbered (1, 2, 3, etc.) in the top-left corner.

For EACH numbered cell, extract:
- Description and searchable tags
- ALL detected items (vehicles, devices, jewelry, property, clothing, pets, documents, etc.)
- ALL faces with detailed characteristics
- ANY documents with OCR text extraction
- Intelligence indicators (wealth, profession, interests, lifestyle) - THIS IS REQUIRED FOR EVERY CELL

CRITICAL: You MUST populate the "intelligence" object for every single cell. Even if no obvious wealth/profession cues exist, provide contextual observations:
- Environment analysis (indoor/outdoor, urban/rural, upscale/modest)
- Visible lifestyle patterns (activities, social context, habits)
- Inferred indicators with appropriate confidence levels

Be extremely thorough. Even small items matter for intelligence purposes.
Extract actual text from any visible documents, signs, or labels.
Note distinctive features of faces for potential identification.`;

// Background processing function
async function processInBackground(
  supabase: any,
  userId: string,
  mosaicId: string,
  mosaicImageUrl: string,
  cells: CellInfo[],
  model: string,
  sessionId: string | undefined,
  bulkSessionId: string | undefined, // bulk_analysis_sessions ID for counter updates
  gridCols: number,
  gridRows: number,
  analysisModes: string[] = [] // The actual analysis modes being run
) {
  const startTime = Date.now();
  let successfulItems = 0;
  let failedItemsCount = 0;
  let totalCostCents = 0;
  
  try {
    console.log(`[Background] Starting mosaic ${mosaicId} processing with ${cells.length} cells`);
    
    // Validate mosaic image before sending to AI
    if (!mosaicImageUrl || mosaicImageUrl.length < 1000) {
      const errMsg = `Invalid mosaic image: too short (${mosaicImageUrl?.length || 0} chars)`;
      console.error(`[Background] ${errMsg}`);
      throw new Error(errMsg);
    }

    if (mosaicImageUrl.startsWith('data:')) {
      const match = mosaicImageUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!match) {
        console.error(`[Background] Invalid base64 format - doesn't match expected pattern`);
        throw new Error('Invalid base64 image format');
      }
      console.log(`[Background] Valid base64 image, format: ${match[1]}, base64 length: ${match[2].length}`);
    } else {
      console.log(`[Background] Using URL-based image: ${mosaicImageUrl.substring(0, 100)}...`);
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
      console.error('[Background] AI API error:', aiError);
      
      let errorMessage = 'AI API error';
      
      if (aiError instanceof RateLimitError) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (aiError instanceof CreditsExhaustedError) {
        errorMessage = 'AI credits exhausted.';
      } else if (aiError instanceof BudgetExceededError) {
        errorMessage = 'AI budget limit exceeded.';
      } else if (aiError instanceof Error) {
        errorMessage = aiError.message;
      }

      // Mark all items in batch as failed - use bulkItemId for direct targeting
      for (const cell of cells) {
        if (cell.bulkItemId) {
          await supabase
            .from('bulk_analysis_items')
            .update({ 
              status: 'failed', 
              error_message: errorMessage,
              completed_at: new Date().toISOString()
            })
            .eq('id', cell.bulkItemId);
        } else {
          // Fallback: use media_id if bulkItemId not available
          await supabase
            .from('bulk_analysis_items')
            .update({ 
              status: 'failed', 
              error_message: errorMessage,
              completed_at: new Date().toISOString()
            })
            .eq('media_id', cell.mediaId);
        }
      }

      if (sessionId) {
        await supabase
          .from('mosaic_metadata_sessions')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', sessionId);
      }
      
      return;
    }

    // Diagnostic logging for AI response
    console.log(`[Background] AI Response diagnostics:`, {
      hasContent: !!aiResponse.content,
      contentLength: aiResponse.content?.length || 0,
      inputTokens: aiResponse.inputTokens,
      outputTokens: aiResponse.outputTokens,
      hasToolCalls: !!aiResponse.toolCalls,
      toolCallsCount: aiResponse.toolCalls?.length || 0,
      model: aiResponse.model,
    });

    // Try to extract from tool calls first, then fall back to content
    let extractionResult;
    const toolCall = aiResponse.toolCalls?.[0];

    if (toolCall?.function?.arguments) {
      // Standard tool call response
      console.log(`[Background] Parsing from tool call arguments`);
      extractionResult = JSON.parse(toolCall.function.arguments);
    } else if (aiResponse.content && aiResponse.content.length > 10) {
      // Some models return structured content directly
      console.log(`[Background] Attempting to parse from content (length: ${aiResponse.content.length})`);
      try {
        let jsonContent = aiResponse.content;
        // Remove markdown code blocks if present
        if (jsonContent.includes('```')) {
          const match = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) jsonContent = match[1].trim();
        }
        extractionResult = JSON.parse(jsonContent);
        console.log(`[Background] Successfully parsed from content`);
      } catch (parseError) {
        console.error(`[Background] Failed to parse content as JSON:`, parseError);
        throw new Error(`AI returned unparseable content: ${aiResponse.content.substring(0, 200)}`);
      }
    } else {
      // Empty response - log full details for debugging
      console.error(`[Background] Empty AI response:`, JSON.stringify({
        content: aiResponse.content,
        toolCalls: aiResponse.toolCalls,
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        mosaicImageUrlLength: mosaicImageUrl?.length || 0,
        cellCount: cells.length,
      }));
      
      // Store specific error details for debugging
      const errorDetails = {
        type: 'empty_ai_response',
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        mosaicSize: mosaicImageUrl?.length || 0,
        batchSize: cells.length,
        model: model,
        timestamp: new Date().toISOString(),
      };
      
      // Mark all items as failed with detailed error info
      for (const cell of cells) {
        const errorMessage = `AI returned empty response (${cells.length} images, ${mosaicImageUrl?.length || 0} bytes). Retry with smaller batch recommended.`;
        if (cell.bulkItemId) {
          await supabase
            .from('bulk_analysis_items')
            .update({ 
              status: 'failed', 
              error_message: errorMessage,
              result: errorDetails,
              completed_at: new Date().toISOString()
            })
            .eq('id', cell.bulkItemId);
        }
      }
      
      // Update session counters for failed items
      if (bulkSessionId) {
        await incrementSessionProgress(supabase, bulkSessionId, 0, cells.length, 0);
      }
      
      throw new Error(`AI returned empty response (${aiResponse.inputTokens} input, ${aiResponse.outputTokens} output tokens, ${cells.length} images). Image may be too large or malformed.`);
    }

    const cellResults = extractionResult.cells || [];

    console.log(`[Background] Extracted data for ${cellResults.length} cells`);

    // Process each cell result
    let itemsDetected = 0;
    let facesDetected = 0;
    let documentsDetected = 0;
    let autoLinkedCount = 0;

    for (const cellResult of cellResults) {
      const cellIndex = cellResult.cell_number - 1; // Convert to 0-indexed
      const cellInfo = cells[cellIndex];
      
      if (!cellInfo) {
        console.warn(`[Background] No cell info for cell number ${cellResult.cell_number}`);
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
        console.error(`[Background] Failed to update media ${mediaId}:`, mediaUpdateError.message, mediaUpdateError.code);
      }

      // Update bulk_analysis_items for this media - use bulkItemId for direct targeting
      const costPerCell = Math.ceil((aiResponse.costCents || 0) / cells.length);
      
      let itemUpdateError;
      if (cellInfo.bulkItemId) {
        // Use bulkItemId for direct targeting (preferred)
        const result = await supabase
          .from('bulk_analysis_items')
          .update({
            status: 'completed',
            actual_cost_cents: costPerCell,
            completed_at: new Date().toISOString(),
            result: {
              items: cellResult.detected_items?.length || 0,
              faces: cellResult.faces?.length || 0,
              documents: cellResult.documents?.length || 0
            }
          })
          .eq('id', cellInfo.bulkItemId);
        itemUpdateError = result.error;
      } else {
        // Fallback: use media_id if bulkItemId not available
        const result = await supabase
          .from('bulk_analysis_items')
          .update({
            status: 'completed',
            actual_cost_cents: costPerCell,
            completed_at: new Date().toISOString(),
            result: {
              items: cellResult.detected_items?.length || 0,
              faces: cellResult.faces?.length || 0,
              documents: cellResult.documents?.length || 0
            }
          })
          .eq('media_id', mediaId);
        itemUpdateError = result.error;
      }

      if (itemUpdateError) {
        console.error(`[Background] Failed to update bulk_analysis_items for media ${mediaId}:`, itemUpdateError.message, itemUpdateError.code);
        failedItemsCount++;
      } else {
        console.log(`[Background] Updated bulk_analysis_items for ${cellInfo.bulkItemId ? `id=${cellInfo.bulkItemId}` : `media=${mediaId}`} to completed`);
        successfulItems++;
        totalCostCents += costPerCell;
        
        // Update completed_analysis_modes on media table to track incremental progress
        // Use proper array merge to preserve existing modes
        if (mediaId) {
          try {
            // Fetch current modes
            const { data: currentMedia } = await supabase
              .from('media')
              .select('completed_analysis_modes')
              .eq('id', mediaId)
              .single();
            
            const existingModes = (currentMedia as any)?.completed_analysis_modes || [];
            // Use the actual analysis modes passed from the frontend, plus mosaic_metadata as a marker
            const newModes = [...analysisModes];
            // Always include 'mosaic_metadata' as a marker that mosaic pipeline was used
            if (!newModes.includes('mosaic_metadata')) {
              newModes.push('mosaic_metadata');
            }
            const allModes = [...new Set([...existingModes, ...newModes])];
            
            await supabase
              .from('media')
              .update({
                completed_analysis_modes: allModes,
                last_analysis_at: new Date().toISOString(),
              })
              .eq('id', mediaId);
            
            console.log(`[Background] Updated media.completed_analysis_modes for ${mediaId}: ${allModes.join(', ')}`);
          } catch (modesError) {
            console.error(`[Background] Failed to update completed_analysis_modes for ${mediaId}:`, modesError);
          }
        }
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
            console.error(`[Background] Failed to insert detected_item:`, itemError.message, itemError.code);
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
            console.error(`[Background] Failed to insert unknown_person:`, faceError.message, faceError.code);
          }
        }
      }

      // Save extracted documents - FIX: use match_confidence instead of confidence
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
            match_confidence: doc.confidence, // FIXED: was 'confidence', schema uses 'match_confidence'
            ai_model_used: model,
            source_mosaic_id: mosaicId,
            linked_status: profileId ? 'auto_linked' : 'pending',
          });
          
          if (docError) {
            console.error(`[Background] Failed to insert extracted_document for media ${mediaId}:`, docError.message, docError.code);
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

    // CRITICAL: Update bulk_analysis_sessions counters DIRECTLY
    // This ensures UI progress updates even if realtime is slow
    if (bulkSessionId && (successfulItems > 0 || failedItemsCount > 0)) {
      await incrementSessionProgress(supabase, bulkSessionId, successfulItems, failedItemsCount, totalCostCents);
    }

    const duration = Date.now() - startTime;
    console.log(`[Background] Mosaic ${mosaicId} complete in ${duration}ms: ${successfulItems} completed, ${failedItemsCount} failed, ${itemsDetected} items, ${facesDetected} faces, ${documentsDetected} documents`);

  } catch (error) {
    console.error('[Background] Mosaic processing error:', error);
    
    // Mark all items in batch as failed - use bulkItemId for direct targeting
    for (const cell of cells) {
      if (cell.bulkItemId) {
        await supabase
          .from('bulk_analysis_items')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', cell.bulkItemId);
      } else {
        // Fallback: use media_id only (no user_id column exists)
        await supabase
          .from('bulk_analysis_items')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('media_id', cell.mediaId);
      }
    }

    if (sessionId) {
      await supabase
        .from('mosaic_metadata_sessions')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error' 
        })
        .eq('id', sessionId);
    }
  }
}

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
    const { mosaicImageUrl, cells, mosaicId, model = 'google/gemini-2.5-flash', sessionId, gridCols, gridRows, analysisModes = [] } = body;

    // Validate required parameters
    if (!mosaicImageUrl) {
      return new Response(JSON.stringify({ error: 'Missing mosaicImageUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cells || cells.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty cells array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute grid dimensions if not provided
    const effectiveGridCols = gridCols || Math.ceil(Math.sqrt(cells.length));
    const effectiveGridRows = gridRows || Math.ceil(cells.length / effectiveGridCols);

    const isBase64 = mosaicImageUrl.startsWith('data:');
    const payloadSizeKB = Math.round(mosaicImageUrl.length / 1024);
    
    console.log(`[Mosaic] Received request:`, {
      mosaicId,
      cellCount: cells.length,
      gridCols: effectiveGridCols,
      gridRows: effectiveGridRows,
      model,
      sessionId: sessionId || 'none',
      imageType: isBase64 ? 'base64' : 'url',
      payloadSizeKB: isBase64 ? payloadSizeKB : 'N/A',
    });

    // Update session status if provided
    if (sessionId) {
      await supabase
        .from('mosaic_metadata_sessions')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // Mark all items as running - use bulkItemId for direct targeting
    for (const cell of cells) {
      if (cell.bulkItemId) {
        await supabase
          .from('bulk_analysis_items')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', cell.bulkItemId);
      } else {
        // Fallback: use media_id only (no user_id column exists)
        await supabase
          .from('bulk_analysis_items')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('media_id', cell.mediaId);
      }
    }

    // Start background processing using EdgeRuntime.waitUntil
    // This returns immediately to prevent HTTP timeout while processing continues
    // sessionId here is the bulk_analysis_sessions ID (passed from client as sessionId)
    const bulkSessionId = sessionId; // The client sends bulk_analysis_sessions.id as sessionId
    
    (globalThis as any).EdgeRuntime?.waitUntil?.(
      processInBackground(
        supabase,
        userId,
        mosaicId,
        mosaicImageUrl,
        cells,
        model,
        undefined, // mosaic_metadata_sessions ID (not used here)
        bulkSessionId, // bulk_analysis_sessions ID for counter updates
        effectiveGridCols,
        effectiveGridRows,
        analysisModes // Pass the analysis modes to background processing
      )
    );

    // Return immediate response - client should poll for completion
    return new Response(JSON.stringify({
      status: 'processing',
      mosaicId,
      cellCount: cells.length,
      message: 'Mosaic analysis started. Items will be updated as processing completes.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Mosaic] Request handling error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
