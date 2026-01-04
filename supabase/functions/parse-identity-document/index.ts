import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Smart reminder thresholds based on document type
const REMINDER_THRESHOLDS: Record<string, number> = {
  'passport': 180, // 6 months
  'visa': 90, // 3 months
  'residency': 90, // 3 months
  'national_id': 60, // 2 months
  'drivers_license': 60, // 2 months
  'health_insurance': 30, // 1 month
  'vehicle_registration': 30,
  'professional_license': 60,
  'default': 60,
};

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

    const { profileId, documentType, storagePath, fileUrl, customReminderDays } = await req.json();

    if (!profileId || !storagePath) {
      return new Response(JSON.stringify({ error: 'Profile ID and storage path are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', profileId)
      .single();

    const personName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown';

    // Download the file to get base64 for AI analysis
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || 'application/pdf';

    console.log('Processing document for:', personName, 'Type:', documentType, 'Size:', arrayBuffer.byteLength);

    // Use AI to parse the document
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert document parser specializing in identity documents. 
Extract all relevant information from the document image provided.
The document belongs to: ${personName}
Expected document type: ${documentType || 'unknown - detect from content'}

Be precise with dates (use YYYY-MM-DD format), numbers, and names.
If you cannot read a field clearly, indicate it as null rather than guessing.`;

    const userPrompt = `Parse this identity document and extract all relevant information.
Focus on:
- Document type (passport, visa, national ID, driver's license, health insurance card, residency permit, etc.)
- Document number / ID number
- Full name as written on document
- Date of birth
- Issue date
- Expiry date
- Issuing country / authority
- Nationality (if applicable)
- Any other relevant fields specific to this document type

Also extract the full text content for searchability.`;

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
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_document_data',
            description: 'Extract structured data from an identity document',
            parameters: {
              type: 'object',
              properties: {
                document_type: {
                  type: 'string',
                  enum: ['passport', 'visa', 'national_id', 'drivers_license', 'health_insurance', 'residency', 'vehicle_registration', 'professional_license', 'other'],
                },
                document_type_label: { type: 'string', description: 'Human-readable document type' },
                document_number: { type: 'string' },
                full_name: { type: 'string' },
                date_of_birth: { type: 'string', description: 'YYYY-MM-DD format' },
                issue_date: { type: 'string', description: 'YYYY-MM-DD format' },
                expiry_date: { type: 'string', description: 'YYYY-MM-DD format' },
                issuing_country: { type: 'string' },
                issuing_authority: { type: 'string' },
                nationality: { type: 'string' },
                additional_fields: {
                  type: 'object',
                  description: 'Any other relevant fields',
                  additionalProperties: true,
                },
                full_text_content: { type: 'string', description: 'All readable text from the document' },
                confidence_score: { type: 'number', description: '0-1 confidence in extraction accuracy' },
              },
              required: ['document_type', 'full_text_content'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'extract_document_data' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response');
      return new Response(JSON.stringify({ error: 'AI could not parse the document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsedData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed document data:', JSON.stringify(parsedData, null, 2));

    // Determine reminder days
    const docType = parsedData.document_type || 'default';
    const reminderDays = customReminderDays || REMINDER_THRESHOLDS[docType] || REMINDER_THRESHOLDS['default'];

    // Save or update identity document
    const identityDocData = {
      profile_id: profileId,
      user_id: user.id,
      document_type: parsedData.document_type_label || parsedData.document_type || documentType || 'Unknown',
      document_number: parsedData.document_number || null,
      issue_date: parsedData.issue_date || null,
      expiry_date: parsedData.expiry_date || null,
      issuing_country: parsedData.issuing_country || null,
      storage_path: storagePath,
      file_url: fileUrl,
      parsed_data: parsedData,
      ai_parsed_at: new Date().toISOString(),
      reminder_days_before: reminderDays,
    };

    const { data: savedDoc, error: saveError } = await supabaseClient
      .from('contact_identity_documents')
      .insert(identityDocData)
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save document:', saveError);
      return new Response(JSON.stringify({ error: 'Failed to save document data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create expiry reminder event if expiry date exists
    let createdEvent = null;
    if (parsedData.expiry_date) {
      const expiryDate = new Date(parsedData.expiry_date);
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      const eventData = {
        user_id: user.id,
        profile_id: profileId,
        title: `${parsedData.document_type_label || parsedData.document_type || 'Document'} Renewal - ${personName}`,
        description: `Document #${parsedData.document_number || 'N/A'} expires on ${parsedData.expiry_date}. Reminder set ${reminderDays} days before expiry.`,
        event_date: reminderDate.toISOString().split('T')[0],
        event_type: 'reminder',
        reminder_days_before: 7,
        is_active: true,
      };

      const { data: event, error: eventError } = await supabaseClient
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) {
        console.error('Failed to create reminder event:', eventError);
      } else {
        createdEvent = event;
        
        // Link event to document
        await supabaseClient
          .from('contact_identity_documents')
          .update({ linked_event_id: event.id })
          .eq('id', savedDoc.id);
      }
    }

    // Create embedding for RAG search
    const embeddingContent = `
Document Type: ${parsedData.document_type_label || parsedData.document_type}
Holder: ${parsedData.full_name || personName}
Document Number: ${parsedData.document_number || 'N/A'}
Issue Date: ${parsedData.issue_date || 'N/A'}
Expiry Date: ${parsedData.expiry_date || 'N/A'}
Issuing Country: ${parsedData.issuing_country || 'N/A'}
Content: ${parsedData.full_text_content || ''}
    `.trim();

    const { error: embeddingError } = await supabaseClient
      .from('document_embeddings')
      .insert({
        user_id: user.id,
        source_type: 'identity_document',
        source_id: savedDoc.id,
        profile_id: profileId,
        content: embeddingContent,
        content_summary: `${parsedData.document_type_label || parsedData.document_type} for ${personName} - ${parsedData.document_number || 'No number'}`,
        metadata: {
          document_type: parsedData.document_type,
          expiry_date: parsedData.expiry_date,
          issuing_country: parsedData.issuing_country,
          holder_name: parsedData.full_name,
        },
      });

    if (embeddingError) {
      console.error('Failed to create embedding:', embeddingError);
    }

    return new Response(JSON.stringify({
      success: true,
      document: savedDoc,
      parsedData,
      reminderEvent: createdEvent,
      message: `Document parsed successfully. ${createdEvent ? `Reminder created for ${reminderDays} days before expiry.` : 'No expiry date found.'}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-identity-document:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
