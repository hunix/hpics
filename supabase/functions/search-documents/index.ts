import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { query, profileId, sourceType, limit = 10 } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), {
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

    console.log('Searching documents for user:', user.id, 'Query:', query);

    // First, get all embeddings that match the criteria
    let dbQuery = supabaseClient
      .from('document_embeddings')
      .select('*')
      .eq('user_id', user.id);

    if (profileId) {
      dbQuery = dbQuery.eq('profile_id', profileId);
    }
    if (sourceType) {
      dbQuery = dbQuery.eq('source_type', sourceType);
    }

    const { data: embeddings, error: fetchError } = await dbQuery.limit(100);

    if (fetchError) {
      console.error('Failed to fetch embeddings:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to search documents' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!embeddings || embeddings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        answer: 'No documents found in the system.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to find relevant documents and generate an answer
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare context from all embeddings
    const documentsContext = embeddings.map((e, i) => 
      `[Document ${i + 1}] Source: ${e.source_type}, Summary: ${e.content_summary}\nContent: ${e.content?.substring(0, 1000) || 'No content'}`
    ).join('\n\n---\n\n');

    const systemPrompt = `You are a document search assistant. You have access to a user's personal documents including identity documents, passports, IDs, licenses, insurance cards, and other files.

Your job is to:
1. Find the most relevant documents matching the user's query
2. Provide a helpful, concise answer based on the documents
3. Return which document indices are most relevant (1-indexed)

Be specific and accurate. If you cannot find relevant information, say so clearly.`;

    const userPrompt = `User's question: "${query}"

Available documents:
${documentsContext}

Find the relevant documents and answer the question. If the user is looking for a specific document, tell them which one matches and provide key details like document numbers, expiry dates, etc.`;

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
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'search_results',
            description: 'Return search results with relevant document indices and an answer',
            parameters: {
              type: 'object',
              properties: {
                relevant_indices: {
                  type: 'array',
                  items: { type: 'integer' },
                  description: '1-indexed list of relevant document numbers',
                },
                answer: {
                  type: 'string',
                  description: 'A helpful answer to the user query based on the documents',
                },
                confidence: {
                  type: 'number',
                  description: '0-1 confidence score',
                },
              },
              required: ['relevant_indices', 'answer'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'search_results' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({
        success: true,
        results: [],
        answer: 'Could not process the search query.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchResult = JSON.parse(toolCall.function.arguments);
    console.log('AI search result:', searchResult);

    // Get the relevant embeddings
    const relevantResults = searchResult.relevant_indices
      .filter((i: number) => i > 0 && i <= embeddings.length)
      .slice(0, limit)
      .map((i: number) => {
        const embedding = embeddings[i - 1];
        return {
          id: embedding.id,
          source_type: embedding.source_type,
          source_id: embedding.source_id,
          profile_id: embedding.profile_id,
          summary: embedding.content_summary,
          metadata: embedding.metadata,
        };
      });

    // Fetch additional details for identity documents
    const enrichedResults = await Promise.all(
      relevantResults.map(async (result: any) => {
        if (result.source_type === 'identity_document') {
          const { data: doc } = await supabaseClient
            .from('contact_identity_documents')
            .select('*, profiles(first_name, last_name)')
            .eq('id', result.source_id)
            .single();
          
          if (doc) {
            return {
              ...result,
              document: {
                document_type: doc.document_type,
                document_number: doc.document_number,
                expiry_date: doc.expiry_date,
                issue_date: doc.issue_date,
                issuing_country: doc.issuing_country,
                file_url: doc.file_url,
                holder_name: doc.profiles ? `${doc.profiles.first_name} ${doc.profiles.last_name}` : null,
              },
            };
          }
        }
        return result;
      })
    );

    return new Response(JSON.stringify({
      success: true,
      results: enrichedResults,
      answer: searchResult.answer,
      confidence: searchResult.confidence,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-documents:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
