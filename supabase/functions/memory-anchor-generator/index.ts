// Memory Anchor Generator - CIA Studies in Intelligence Vol. 69 (March 2025)
// Von Restorff memory palace scenes for intelligence data retention optimization

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryAnchor {
  anchorId: string;
  dataType: string;
  visualScene: string;
  emotionalHook: string;
  sensoryDetails: string[];
  retrievalCue: string;
  strengthScore: number;
}

interface MemoryPalace {
  palaceId: string;
  theme: string;
  rooms: MemoryRoom[];
  totalAnchors: number;
  retentionEstimate: number;
}

interface MemoryRoom {
  roomId: string;
  name: string;
  description: string;
  anchors: MemoryAnchor[];
  navigationCue: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'memory-anchor-generator', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const intelligenceData = body.intelligenceData || body.intelligence_data || [];
    const palaceTheme = body.theme || 'classic_mansion';

    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }

    console.log(`[MemoryAnchor] Generating memory palace for user: ${userId}`);

    // Fetch relevant intelligence data if not provided
    let dataToAnchor = intelligenceData;
    if (dataToAnchor.length === 0 && profileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      const { data: keyInsights } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);

      dataToAnchor = extractKeyData(profile, keyInsights || []);
    }

    // Generate Von Restorff anchors for each data point
    const memoryAnchors = generateMemoryAnchors(dataToAnchor);

    // Construct Memory Palace
    const memoryPalace = constructMemoryPalace(memoryAnchors, palaceTheme);

    // Generate Retrieval Practice Schedule
    const retrievalSchedule = generateRetrievalSchedule(memoryAnchors.length);

    // Create Mnemonic Enhancement Strategies
    const mnemonicStrategies = generateMnemonicStrategies(dataToAnchor);

    // Visual Encoding Guidelines
    const visualGuidelines = generateVisualGuidelines(memoryAnchors);

    const result = {
      userId,
      profileId,
      analysisType: 'memory_anchor_generation',
      memoryPalace,
      memoryAnchors,
      retrievalSchedule,
      mnemonicStrategies,
      visualGuidelines,
      metrics: {
        totalAnchors: memoryAnchors.length,
        averageStrength: memoryAnchors.reduce((sum, a) => sum + a.strengthScore, 0) / Math.max(memoryAnchors.length, 1),
        estimatedRetention: calculateRetentionEstimate(memoryAnchors),
        optimalReviewInterval: '1 day, 3 days, 7 days, 14 days, 30 days'
      },
      confidence: 0.82,
      timestamp: new Date().toISOString()
    };

    // Persist for future reference
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'memory_anchor_generation',
        results: result,
        confidence_score: result.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    console.log(`[MemoryAnchor] Palace generated. Anchors: ${memoryAnchors.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[MemoryAnchor] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractKeyData(profile: any, insights: any[]): any[] {
  const keyData: any[] = [];

  if (profile) {
    keyData.push({
      type: 'identity',
      content: `${profile.first_name} ${profile.last_name}`,
      importance: 'high',
      category: 'basic_info'
    });

    if (profile.job_title) {
      keyData.push({
        type: 'professional',
        content: profile.job_title,
        importance: 'medium',
        category: 'professional'
      });
    }

    if (profile.organization) {
      keyData.push({
        type: 'affiliation',
        content: profile.organization,
        importance: 'medium',
        category: 'professional'
      });
    }
  }

  insights.forEach(insight => {
    if (insight.results?.key_findings) {
      insight.results.key_findings.forEach((finding: any) => {
        keyData.push({
          type: 'intelligence',
          content: typeof finding === 'string' ? finding : JSON.stringify(finding),
          importance: 'high',
          category: insight.analysis_type
        });
      });
    }
  });

  return keyData.slice(0, 20); // Limit for manageability
}

function generateMemoryAnchors(data: any[]): MemoryAnchor[] {
  const anchors: MemoryAnchor[] = [];

  // Von Restorff effect: Make information distinctive
  const visualThemes = [
    { theme: 'fire', adjectives: ['blazing', 'fiery', 'scorching'] },
    { theme: 'ice', adjectives: ['frozen', 'crystalline', 'glacial'] },
    { theme: 'gold', adjectives: ['gleaming', 'precious', 'radiant'] },
    { theme: 'storm', adjectives: ['thundering', 'electric', 'tempestuous'] },
    { theme: 'nature', adjectives: ['blooming', 'verdant', 'ancient'] }
  ];

  const emotionalHooks = [
    'surprising discovery', 'triumphant achievement', 'mysterious revelation',
    'comical absurdity', 'dramatic confrontation', 'touching moment'
  ];

  data.forEach((item, index) => {
    const visualTheme = visualThemes[index % visualThemes.length];
    const emotionalHook = emotionalHooks[index % emotionalHooks.length];

    const visualScene = createVisualScene(item, visualTheme);
    const sensoryDetails = createSensoryDetails(visualTheme);
    const retrievalCue = createRetrievalCue(item, visualTheme);

    anchors.push({
      anchorId: crypto.randomUUID(),
      dataType: item.type,
      visualScene,
      emotionalHook: `${emotionalHook}: ${item.content?.substring(0, 50)}`,
      sensoryDetails,
      retrievalCue,
      strengthScore: calculateAnchorStrength(item, visualTheme)
    });
  });

  return anchors;
}

function createVisualScene(item: any, theme: any): string {
  const content = item.content || 'Unknown data';
  const adjective = theme.adjectives[Math.floor(Math.random() * theme.adjectives.length)];
  
  const sceneTemplates = [
    `A ${adjective} ${theme.theme} reveals "${content.substring(0, 30)}..." carved into its surface`,
    `Standing before a ${adjective} ${theme.theme}, you discover "${content.substring(0, 30)}..." floating within`,
    `The ${adjective} ${theme.theme} transforms into a vision showing "${content.substring(0, 30)}..."`,
    `As ${theme.theme} swirls around you, "${content.substring(0, 30)}..." becomes crystal clear`,
    `A ${adjective} portal of ${theme.theme} opens, displaying "${content.substring(0, 30)}..."`
  ];

  return sceneTemplates[Math.floor(Math.random() * sceneTemplates.length)];
}

function createSensoryDetails(theme: any): string[] {
  const sensoryMap: Record<string, string[]> = {
    fire: ['Crackling flames', 'Warmth on skin', 'Smoky scent', 'Orange glow', 'Ash taste'],
    ice: ['Crystalline chiming', 'Biting cold', 'Fresh winter air', 'Blue-white shimmer', 'Metallic taste'],
    gold: ['Soft ringing', 'Smooth warmth', 'Metallic sweetness', 'Brilliant shine', 'Heavy weight'],
    storm: ['Rolling thunder', 'Electric tingles', 'Ozone smell', 'Flash illumination', 'Rain taste'],
    nature: ['Birdsong', 'Soft breeze', 'Forest scent', 'Dappled light', 'Fresh earth taste']
  };

  return sensoryMap[theme.theme] || ['Unique sensation', 'Distinctive sound', 'Memorable scent'];
}

function createRetrievalCue(item: any, theme: any): string {
  return `When you think of ${theme.theme}, recall: ${item.content?.substring(0, 40)}...`;
}

function calculateAnchorStrength(item: any, theme: any): number {
  const importanceBonus = item.importance === 'high' ? 0.2 : item.importance === 'medium' ? 0.1 : 0;
  const baseStrength = 0.6;
  const distinctivenessBonus = 0.15; // Von Restorff effect
  
  return Math.min(baseStrength + importanceBonus + distinctivenessBonus + Math.random() * 0.1, 1);
}

function constructMemoryPalace(anchors: MemoryAnchor[], theme: string): MemoryPalace {
  const palaceThemes: Record<string, { name: string; rooms: string[] }> = {
    classic_mansion: {
      name: 'Grand Victorian Mansion',
      rooms: ['Grand Foyer', 'Library', 'Drawing Room', 'Conservatory', 'Master Study', 'Garden Terrace']
    },
    ancient_temple: {
      name: 'Ancient Temple Complex',
      rooms: ['Temple Gates', 'Outer Courtyard', 'Inner Sanctum', 'Oracle Chamber', 'Sacred Pool', 'Tower Summit']
    },
    futuristic_station: {
      name: 'Orbital Space Station',
      rooms: ['Docking Bay', 'Command Center', 'Research Lab', 'Observation Deck', 'Crew Quarters', 'Engine Room']
    },
    medieval_castle: {
      name: 'Medieval Fortress',
      rooms: ['Castle Gates', 'Great Hall', 'Tower Room', 'Dungeon', 'Throne Room', 'Battlements']
    }
  };

  const palace = palaceThemes[theme] || palaceThemes.classic_mansion;
  const anchorsPerRoom = Math.ceil(anchors.length / palace.rooms.length);

  const rooms: MemoryRoom[] = palace.rooms.map((roomName, index) => {
    const startIdx = index * anchorsPerRoom;
    const roomAnchors = anchors.slice(startIdx, startIdx + anchorsPerRoom);

    return {
      roomId: crypto.randomUUID(),
      name: roomName,
      description: generateRoomDescription(roomName, theme),
      anchors: roomAnchors,
      navigationCue: generateNavigationCue(roomName, index, palace.rooms)
    };
  });

  return {
    palaceId: crypto.randomUUID(),
    theme: palace.name,
    rooms,
    totalAnchors: anchors.length,
    retentionEstimate: calculateRetentionEstimate(anchors)
  };
}

function generateRoomDescription(roomName: string, theme: string): string {
  const descriptions: Record<string, string> = {
    'Grand Foyer': 'Marble floors stretch beneath a crystal chandelier, light dancing across gilded frames',
    'Library': 'Towering bookshelves reach to a painted ceiling, leather-bound wisdom lining every wall',
    'Drawing Room': 'Velvet settees face a crackling fireplace, portraits watching from ornate frames',
    'Conservatory': 'Glass walls reveal exotic plants, humid air carrying the scent of orchids',
    'Master Study': 'A mahogany desk dominates the room, maps and instruments covering every surface',
    'Garden Terrace': 'Stone balustrades frame a manicured garden, fountain music drifting upward',
    'Temple Gates': 'Massive stone doors carved with ancient symbols, incense smoke curling through cracks',
    'Outer Courtyard': 'Weathered flagstones surround a sacred tree, prayer flags fluttering overhead',
    'Inner Sanctum': 'Golden light filters through high windows, sacred silence filling the chamber',
    'Oracle Chamber': 'Mysterious mists swirl around a glowing pool, whispered prophecies echoing',
    'Sacred Pool': 'Crystal clear waters reflect starlight, lotus blossoms floating on the surface',
    'Tower Summit': 'Open to the sky, the city spreads below, wind carrying distant temple bells'
  };

  return descriptions[roomName] || `A distinctive space perfect for memory anchoring`;
}

function generateNavigationCue(roomName: string, index: number, allRooms: string[]): string {
  if (index === 0) return `Begin your journey in the ${roomName}`;
  const previousRoom = allRooms[index - 1];
  return `From the ${previousRoom}, proceed to the ${roomName}`;
}

function generateRetrievalSchedule(anchorCount: number): any {
  return {
    immediate: {
      timing: 'Within 1 hour of encoding',
      method: 'Walk through palace mentally, visiting each anchor',
      duration: `${Math.max(5, anchorCount * 0.5)} minutes`
    },
    day1: {
      timing: '24 hours after encoding',
      method: 'Full palace walkthrough with active recall',
      duration: `${Math.max(10, anchorCount * 1)} minutes`
    },
    day3: {
      timing: '72 hours after encoding',
      method: 'Rapid palace review, pause on weak anchors',
      duration: `${Math.max(5, anchorCount * 0.5)} minutes`
    },
    week1: {
      timing: '7 days after encoding',
      method: 'Full review with elaboration on each anchor',
      duration: `${Math.max(15, anchorCount * 1.5)} minutes`
    },
    week2: {
      timing: '14 days after encoding',
      method: 'Random access testing of individual anchors',
      duration: `${Math.max(10, anchorCount * 0.75)} minutes`
    },
    month1: {
      timing: '30 days after encoding',
      method: 'Comprehensive review and reinforcement',
      duration: `${Math.max(20, anchorCount * 2)} minutes`
    },
    maintenance: {
      timing: 'Monthly thereafter',
      method: 'Quick walkthrough to maintain long-term retention',
      duration: `${Math.max(5, anchorCount * 0.25)} minutes`
    }
  };
}

function generateMnemonicStrategies(data: any[]): any {
  return {
    acronyms: {
      description: 'Create memorable acronyms from first letters of key points',
      example: 'For multiple items, combine first letters into pronounceable word',
      effectiveness: 0.75
    },
    chunking: {
      description: 'Group related information into meaningful clusters',
      example: 'Professional details together, personal details together',
      effectiveness: 0.8
    },
    storytelling: {
      description: 'Weave data points into a coherent narrative',
      example: 'Create a story where each plot point contains key information',
      effectiveness: 0.85
    },
    association: {
      description: 'Link new information to existing knowledge',
      example: 'Connect new name to someone you already know',
      effectiveness: 0.78
    },
    visualization: {
      description: 'Create vivid mental images for abstract concepts',
      example: 'See numbers as physical objects or actions',
      effectiveness: 0.82
    },
    emotionalBinding: {
      description: 'Attach emotional significance to information',
      example: 'Make information funny, surprising, or personally meaningful',
      effectiveness: 0.88
    }
  };
}

function generateVisualGuidelines(anchors: MemoryAnchor[]): any {
  return {
    vividity: {
      principle: 'Make mental images as vivid and detailed as possible',
      tips: [
        'Use bright, unusual colors',
        'Exaggerate size or proportion',
        'Include movement and action',
        'Add impossible or surreal elements'
      ]
    },
    distinction: {
      principle: 'Each anchor must be unique and distinguishable (Von Restorff)',
      tips: [
        'Contrast with surrounding elements',
        'Use different visual themes for different data types',
        'Make important items stand out dramatically',
        'Avoid similar images for different information'
      ]
    },
    interaction: {
      principle: 'Anchors should interact with their environment',
      tips: [
        'Have anchors physically connected to room features',
        'Create cause-and-effect relationships',
        'Include yourself in the scene',
        'Add sound and touch to visual elements'
      ]
    },
    emotion: {
      principle: 'Emotional content is remembered more strongly',
      tips: [
        'Make scenes humorous or absurd',
        'Include elements of surprise',
        'Create dramatic or tense moments',
        'Add personal meaning where possible'
      ]
    }
  };
}

function calculateRetentionEstimate(anchors: MemoryAnchor[]): number {
  if (anchors.length === 0) return 0;
  
  const avgStrength = anchors.reduce((sum, a) => sum + a.strengthScore, 0) / anchors.length;
  const vonRestorffBonus = 0.15; // Distinctiveness bonus
  const palaceMethodBonus = 0.2; // Method of loci effectiveness
  
  return Math.min((avgStrength + vonRestorffBonus + palaceMethodBonus) * 100, 95);
}
