import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentAnalysisOptions {
  ocr: boolean;
  classification: boolean;
  structuredExtraction: boolean;
  contactLinking: boolean;
  patternDetection: boolean;
  reminderGeneration: boolean;
  sensitiveDataDetection: boolean;
  tableExtraction: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      mediaId,
      imageUrl,
      profileId, 
      jobId,
      options,
      model: requestedModel 
    } = await req.json() as {
      mediaId: string;
      imageUrl: string;
      profileId?: string;
      jobId?: string;
      options: DocumentAnalysisOptions;
      model?: string;
    };

    if (!mediaId || !imageUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);
    const model = requestedModel || aiConfig.defaultModel;

    // Get user's existing contacts for matching
    let existingContacts: any[] = [];
    if (options.contactLinking) {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, company')
        .eq('user_id', user.id);
      existingContacts = data || [];
    }

    // Build comprehensive analysis prompt
    const analysisPrompt = buildDocumentPrompt(options, existingContacts);

    // Use multimodal AI to analyze the document image
    const aiResponse = await callAI({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt(options) },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      userId: user.id,
      functionName: 'analyze-document-comprehensive',
      profileId,
      maxTokens: 4000,
      temperature: aiConfig.temperature,
    });

    const analysis: Record<string, any> = parseAIJson(aiResponse.content, {});

    // Store results in document_insights
    const insightData = {
      user_id: user.id,
      media_id: mediaId,
      profile_id: profileId || null,
      job_id: jobId || null,
      
      // OCR data
      raw_text: analysis.raw_text || null,
      text_blocks: analysis.text_blocks || null,
      language_detected: analysis.language || null,
      
      // Document classification
      document_type: analysis.document_type || null,
      document_subtype: analysis.document_subtype || null,
      confidence: analysis.classification_confidence || 0.7,
      
      // Structured extraction
      structured_data: analysis.structured_data || null,
      key_value_pairs: analysis.key_value_pairs || null,
      tables_extracted: analysis.tables || null,
      
      // Contact information
      contact_info_extracted: analysis.contact_info || null,
      suggested_contacts: analysis.suggested_contacts || null,
      
      // Pattern analysis
      patterns_detected: analysis.patterns || null,
      anomalies: analysis.anomalies || null,
      
      // Dates and reminders
      dates_found: analysis.dates || null,
      suggested_reminders: analysis.reminders || null,
      
      // Security analysis
      sensitive_data: analysis.sensitive_data || null,
      authenticity_score: analysis.authenticity_score || null,
      
      ai_model_used: model,
      processing_time_ms: aiResponse.responseTimeMs,
    };

    const { data: insight, error: insertError } = await supabase
      .from('document_insights')
      .insert(insightData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save document insight: ${insertError.message}`);
    }

    // Also create/update extracted_documents record for backwards compatibility
    if (analysis.document_type) {
      await supabase.from('extracted_documents').upsert({
        user_id: user.id,
        media_id: mediaId,
        profile_id: profileId,
        document_type: analysis.document_type,
        document_subtype: analysis.document_subtype,
        extracted_text: analysis.raw_text,
        extracted_fields: analysis.structured_data,
        confidence: analysis.classification_confidence || 0.7,
        dates_detected: analysis.dates,
        contact_info_detected: analysis.contact_info,
        currency_amounts: analysis.amounts,
        action_required: analysis.reminders?.length > 0,
        suggested_actions: analysis.reminders,
      }, {
        onConflict: 'media_id',
      });
    }

    // Create content relationships if contacts are identified
    if (analysis.suggested_contacts && analysis.suggested_contacts.length > 0 && profileId) {
      const relationships = analysis.suggested_contacts
        .filter((c: any) => c.profile_id && c.profile_id !== profileId)
        .map((c: any) => ({
          user_id: user.id,
          profile_id_1: profileId,
          profile_id_2: c.profile_id,
          source_type: 'document_reference',
          source_id: insight.id,
          relationship_type: 'referenced',
          context: `Referenced in ${analysis.document_type || 'document'}`,
          confidence: c.confidence || 0.6,
        }));

      if (relationships.length > 0) {
        await supabase.from('content_relationships').insert(relationships);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      insightId: insight.id,
      documentType: analysis.document_type,
      analysis,
      tokensUsed: aiResponse.totalTokens,
      costCents: aiResponse.costCents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getSystemPrompt(options: DocumentAnalysisOptions): string {
  return `You are an expert document analyst specializing in OCR, document classification, and structured data extraction.
Analyze the provided document image and extract all relevant information.
Always respond with valid JSON matching the requested schema.
Be thorough with OCR - extract ALL visible text.
For dates, use ISO format (YYYY-MM-DD).
For amounts, include currency symbols when visible.`;
}

function buildDocumentPrompt(
  options: DocumentAnalysisOptions,
  existingContacts: any[]
): string {
  const sections: string[] = [];
  
  sections.push('Analyze this document image and extract all information.');
  
  if (options.contactLinking && existingContacts.length > 0) {
    const contactSummary = existingContacts.slice(0, 50).map(c => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email,
      company: c.company,
    }));
    sections.push(`EXISTING CONTACTS FOR MATCHING:\n${JSON.stringify(contactSummary)}`);
  }
  
  const schema: any = {};
  
  if (options.ocr) {
    schema.raw_text = 'Complete OCR text from document';
    schema.text_blocks = '[{text, bounding_box: {x, y, width, height}, confidence}]';
    schema.language = 'Detected language code (e.g., en, es, fr)';
  }
  
  if (options.classification) {
    schema.document_type = 'invoice, receipt, contract, id_card, letter, form, certificate, other';
    schema.document_subtype = 'More specific type if applicable';
    schema.classification_confidence = '0-1 confidence score';
  }
  
  if (options.structuredExtraction) {
    schema.structured_data = '{Extracted fields based on document type - varies per type}';
    schema.key_value_pairs = '[{key, value, confidence}]';
  }
  
  if (options.tableExtraction) {
    schema.tables = '[{headers: [], rows: [[]], position}]';
  }
  
  if (options.contactLinking) {
    schema.contact_info = '{names: [], emails: [], phones: [], addresses: [], companies: []}';
    schema.suggested_contacts = '[{profile_id (from existing contacts), confidence, matched_on}]';
  }
  
  if (options.patternDetection) {
    schema.patterns = '{recurring_elements: [], formatting_patterns: []}';
    schema.anomalies = '[{description, severity, location}]';
  }
  
  if (options.reminderGeneration) {
    schema.dates = '[{date, context, type: deadline/event/expiry}]';
    schema.reminders = '[{date, reminder_text, priority: low/medium/high}]';
    schema.amounts = '[{amount, currency, context}]';
  }
  
  if (options.sensitiveDataDetection) {
    schema.sensitive_data = '{types_found: [], redaction_recommended: boolean}';
    schema.authenticity_score = '0-1 score indicating document authenticity';
  }
  
  sections.push(`RESPOND WITH JSON MATCHING THIS SCHEMA:\n${JSON.stringify(schema, null, 2)}`);
  
  return sections.join('\n\n');
}
