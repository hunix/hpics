import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CellInfo {
  imageId: string;
  index: number;
  row: number;
  col: number;
}

interface MosaicRequest {
  mosaicDataUrl: string;
  cellMap: CellInfo[];
  gridCols: number;
  gridRows: number;
  profileEmbeddings?: {
    profileId: string;
    profileName: string;
    embedding: number[];
  }[];
  options?: {
    autoTagThreshold?: number;
    confirmThreshold?: number;
    extractEmbeddings?: boolean;
  };
}

interface CellResult {
  imageId: string;
  cellIndex: number;
  row: number;
  col: number;
  faceDetected: boolean;
  faceCount?: number;
  features?: any;
  embedding?: number[];
  matches?: {
    profileId: string;
    profileName: string;
    confidence: number;
  }[];
  bestMatch?: {
    profileId: string;
    profileName: string;
    confidence: number;
  };
  autoTagged?: boolean;
  requiresConfirmation?: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: MosaicRequest = await req.json();
    const { 
      mosaicDataUrl, 
      cellMap, 
      gridCols, 
      gridRows,
      profileEmbeddings = [],
      options = {}
    } = body;

    const {
      autoTagThreshold = 0.85,
      confirmThreshold = 0.60,
      extractEmbeddings = true
    } = options;

    if (!mosaicDataUrl || !cellMap || cellMap.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing mosaic with ${cellMap.length} cells in ${gridCols}x${gridRows} grid`);

    // Build AI prompt for mosaic analysis
    const prompt = `Analyze this mosaic image containing ${cellMap.length} photos arranged in a ${gridCols}x${gridRows} grid.
Each cell is numbered (0 to ${cellMap.length - 1}) in the top-left corner, reading left-to-right, top-to-bottom.

For EACH numbered cell, analyze and return:
1. Whether a human face is clearly visible
2. If face found, extract detailed facial features

Return a JSON array with EXACTLY ${cellMap.length} entries, one per cell:
[
  {
    "cell": 0,
    "faceDetected": true,
    "faceCount": 1,
    "features": {
      "face_shape": "oval|round|square|heart|oblong|diamond",
      "forehead": {"size": "small|medium|large", "shape": "flat|rounded|sloped"},
      "eyes": {"shape": "almond|round|hooded|monolid|downturned|upturned", "color": "description", "spacing": "close|normal|wide", "size": "small|medium|large"},
      "eyebrows": {"shape": "arched|straight|curved|angled", "thickness": "thin|medium|thick"},
      "nose": {"shape": "straight|aquiline|button|bulbous|snub|wide|narrow", "bridge": "low|medium|high", "tip": "pointed|rounded|upturned"},
      "mouth": {"shape": "full|thin|wide|small|heart", "lip_ratio": "upper_dominant|lower_dominant|balanced"},
      "chin": {"shape": "pointed|square|round|receding|prominent"},
      "jawline": "soft|defined|angular|square",
      "cheekbones": "high|medium|low",
      "skin": {"tone": "very_fair|fair|medium|olive|tan|brown|dark", "texture": "smooth|freckled|textured"},
      "hair": {"color": "description", "style": "description", "texture": "straight|wavy|curly|coily"},
      "facial_hair": "none|stubble|beard|mustache|full",
      "estimated_age_range": "child|teen|20s|30s|40s|50s|60s|70+",
      "estimated_gender": "male|female|ambiguous",
      "distinctive_features": ["description of any unique identifying features like moles, scars, dimples, etc."],
      "expression": "neutral|smiling|serious|laughing|other",
      "face_angle": "frontal|slight_left|slight_right|profile_left|profile_right|tilted_up|tilted_down"
    }
  },
  {
    "cell": 1,
    "faceDetected": false
  },
  ...
]

IMPORTANT RULES:
- Return EXACTLY ${cellMap.length} cell entries in order
- Cell numbers must be 0 to ${cellMap.length - 1}
- If no clear face in a cell, set faceDetected: false
- Only include features object when faceDetected is true
- Be precise about distinctive_features - these are key for identification
- Return ONLY the JSON array, no other text`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { url: mosaicDataUrl }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted, please add funds' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let cellAnalysis: any[] = [];
    try {
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cellAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Calculate tokens and cost
    const inputTokens = aiData.usage?.prompt_tokens || 2500;
    const outputTokens = aiData.usage?.completion_tokens || 500;
    const totalTokens = inputTokens + outputTokens;
    const costCents = Math.round((totalTokens / 1_000_000) * 0.075 * 100 * 100) / 100;

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      function_name: 'mosaic-biometric-match',
      model_name: 'google/gemini-2.5-flash-lite',
      provider: 'lovable',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost_cents: costCents,
      actual_cost_cents: costCents,
      response_time_ms: Date.now() - startTime,
      status: 'success',
      prompt_summary: `Mosaic analysis: ${cellMap.length} cells`,
      request_metadata: { gridCols, gridRows, cellCount: cellMap.length }
    });

    // Process results and match against profiles
    const cellResults: CellResult[] = [];
    
    for (const cell of cellMap) {
      const analysis = cellAnalysis.find(a => a.cell === cell.index) || { faceDetected: false };
      
      const result: CellResult = {
        imageId: cell.imageId,
        cellIndex: cell.index,
        row: cell.row,
        col: cell.col,
        faceDetected: analysis.faceDetected || false,
        faceCount: analysis.faceCount || (analysis.faceDetected ? 1 : 0),
      };

      if (analysis.faceDetected && analysis.features) {
        result.features = analysis.features;
        
        // Generate pseudo-embedding from features for local matching
        if (extractEmbeddings) {
          result.embedding = generateEmbeddingFromFeatures(analysis.features);
        }

        // Match against known profiles if embeddings provided
        if (profileEmbeddings.length > 0 && result.embedding) {
          const matches = profileEmbeddings
            .map(profile => ({
              profileId: profile.profileId,
              profileName: profile.profileName,
              confidence: cosineSimilarity(result.embedding!, profile.embedding)
            }))
            .filter(m => m.confidence >= confirmThreshold)
            .sort((a, b) => b.confidence - a.confidence);

          if (matches.length > 0) {
            result.matches = matches.slice(0, 5);
            result.bestMatch = matches[0];
            
            if (matches[0].confidence >= autoTagThreshold) {
              result.autoTagged = true;
            } else {
              result.requiresConfirmation = true;
            }
          }
        }
      }

      cellResults.push(result);
    }

    const responseTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        cellResults,
        summary: {
          totalCells: cellMap.length,
          facesDetected: cellResults.filter(r => r.faceDetected).length,
          autoTagged: cellResults.filter(r => r.autoTagged).length,
          requiresConfirmation: cellResults.filter(r => r.requiresConfirmation).length,
        },
        cost: {
          tokens: totalTokens,
          cents: costCents,
        },
        processingTimeMs: responseTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mosaic biometric match error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate a 512-dimensional pseudo-embedding from facial features
 * This allows local vector matching without additional AI calls
 */
function generateEmbeddingFromFeatures(features: any): number[] {
  const embedding = new Array(512).fill(0);
  
  // Map categorical features to embedding dimensions
  const mappings: Record<string, Record<string, number>> = {
    face_shape: { oval: 1, round: 2, square: 3, heart: 4, oblong: 5, diamond: 6 },
    'eyes.shape': { almond: 1, round: 2, hooded: 3, monolid: 4, downturned: 5, upturned: 6 },
    'eyes.spacing': { close: 1, normal: 2, wide: 3 },
    'nose.shape': { straight: 1, aquiline: 2, button: 3, bulbous: 4, snub: 5, wide: 6, narrow: 7 },
    'nose.bridge': { low: 1, medium: 2, high: 3 },
    'mouth.shape': { full: 1, thin: 2, wide: 3, small: 4, heart: 5 },
    'chin.shape': { pointed: 1, square: 2, round: 3, receding: 4, prominent: 5 },
    jawline: { soft: 1, defined: 2, angular: 3, square: 4 },
    cheekbones: { high: 1, medium: 2, low: 3 },
    'skin.tone': { very_fair: 1, fair: 2, medium: 3, olive: 4, tan: 5, brown: 6, dark: 7 },
    estimated_gender: { male: 1, female: 2, ambiguous: 3 },
  };

  let dimIndex = 0;
  
  for (const [path, valueMap] of Object.entries(mappings)) {
    const parts = path.split('.');
    let value = features;
    for (const part of parts) {
      value = value?.[part];
    }
    
    if (value && valueMap[value]) {
      embedding[dimIndex] = valueMap[value] / 10;
    }
    dimIndex += 10;
  }

  // Hash distinctive features to spread across embedding
  if (features.distinctive_features && Array.isArray(features.distinctive_features)) {
    for (const feature of features.distinctive_features) {
      const hash = simpleHash(feature);
      const idx = hash % 400 + 100;
      embedding[idx] = 0.5;
    }
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
  return embedding.map(v => v / magnitude);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
