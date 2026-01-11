// Extract Company Branding Intelligence
// Uses Firecrawl to extract brand identity, colors, fonts, and communication style

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandingResult {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
  };
  typography: {
    headingFonts: string[];
    bodyFonts: string[];
    sizes: Record<string, string>;
  };
  logos: {
    primary: string | null;
    variations: string[];
  };
  toneOfVoice: string;
  communicationStyle: string;
  keyMessages: string[];
  visualStyle: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profileId, websiteUrl, companyName } = await req.json();

    if (!websiteUrl) {
      throw new Error('Website URL is required');
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      throw new Error('Firecrawl API key not configured');
    }

    // Extract branding using Firecrawl with multiple strategies
    const brandingData = await extractBrandingIntelligence(websiteUrl, firecrawlKey);

    // Use AI to analyze and synthesize branding
    const aiAnalysis = await analyzeWithAI(brandingData, companyName, supabase, user.id);

    // Store brand intelligence
    const { data: brandIntel, error: insertError } = await supabase
      .from('brand_intelligence')
      .upsert({
        user_id: user.id,
        profile_id: profileId || null,
        company_name: companyName || brandingData.detectedName,
        website_url: websiteUrl,
        color_palette: aiAnalysis.colors,
        typography: aiAnalysis.typography,
        logos: aiAnalysis.logos,
        tone_of_voice: aiAnalysis.toneOfVoice,
        communication_style: aiAnalysis.communicationStyle,
        key_messages: aiAnalysis.keyMessages,
        extracted_branding: {
          rawData: brandingData,
          aiAnalysis: aiAnalysis,
          extractedAt: new Date().toISOString()
        },
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,user_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing brand intelligence:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      branding: aiAnalysis,
      rawData: brandingData,
      storedRecord: brandIntel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error extracting branding:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function extractBrandingIntelligence(url: string, apiKey: string): Promise<any> {
  // Strategy 1: Scrape main page with screenshot
  const mainPageData = await scrapeWithFirecrawl(url, apiKey, ['screenshot', 'html']);
  
  // Strategy 2: Scrape about/contact pages for messaging
  const aboutPages = await findAndScrapeAboutPages(url, apiKey);
  
  // Strategy 3: Extract CSS variables and computed styles
  const styleData = extractStylesFromHTML(mainPageData.html || '');

  return {
    mainPage: mainPageData,
    aboutContent: aboutPages,
    styles: styleData,
    detectedName: extractCompanyName(mainPageData),
    extractedAt: new Date().toISOString()
  };
}

async function scrapeWithFirecrawl(url: string, apiKey: string, formats: string[] = ['markdown']): Promise<any> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats,
        includeTags: ['header', 'footer', 'nav', 'main', 'h1', 'h2', 'p'],
        waitFor: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Firecrawl scrape error:', error);
    return { error: error?.message || 'Unknown error' };
  }
}

async function findAndScrapeAboutPages(baseUrl: string, apiKey: string): Promise<any[]> {
  const aboutPaths = ['/about', '/about-us', '/company', '/our-story', '/team', '/contact'];
  const results = [];

  for (const path of aboutPaths.slice(0, 3)) { // Limit to 3 pages
    try {
      const fullUrl = new URL(path, baseUrl).toString();
      const data = await scrapeWithFirecrawl(fullUrl, apiKey, ['markdown']);
      if (data && !data.error) {
        results.push({ path, content: data });
      }
    } catch (error) {
      // Skip failed pages
    }
  }

  return results;
}

function extractStylesFromHTML(html: string): any {
  const colors: string[] = [];
  const fonts: string[] = [];

  // Extract colors from inline styles and CSS
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)/g;
  const colorMatches = html.match(colorRegex) || [];
  colors.push(...new Set(colorMatches));

  // Extract font families
  const fontRegex = /font-family:\s*([^;}"]+)/gi;
  let fontMatch;
  while ((fontMatch = fontRegex.exec(html)) !== null) {
    fonts.push(fontMatch[1].trim());
  }

  return {
    detectedColors: colors.slice(0, 20),
    detectedFonts: [...new Set(fonts)].slice(0, 10)
  };
}

function extractCompanyName(pageData: any): string | null {
  try {
    const markdown = pageData?.data?.markdown || '';
    // Look for company name in title or first heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function analyzeWithAI(brandingData: any, companyName: string | null, supabase: any, userId: string): Promise<BrandingResult> {
  const startTime = Date.now();
  
  const prompt = `Analyze the following website data and extract comprehensive brand identity information.

Company: ${companyName || 'Unknown'}

Website Content:
${JSON.stringify(brandingData.mainPage?.data?.markdown || '', null, 2).slice(0, 3000)}

About Page Content:
${JSON.stringify(brandingData.aboutContent?.map((p: any) => p.content?.data?.markdown || '').join('\n') || '', null, 2).slice(0, 2000)}

Detected Colors: ${JSON.stringify(brandingData.styles?.detectedColors || [])}
Detected Fonts: ${JSON.stringify(brandingData.styles?.detectedFonts || [])}

Provide a comprehensive brand analysis in this JSON format:
{
  "colors": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex1"],
    "accent": ["#hex1"],
    "background": ["#hex1", "#hex2"]
  },
  "typography": {
    "headingFonts": ["Font Name"],
    "bodyFonts": ["Font Name"],
    "sizes": {"heading": "px", "body": "px"}
  },
  "logos": {
    "primary": "url or null",
    "variations": []
  },
  "toneOfVoice": "Professional/Casual/Technical/Friendly/etc",
  "communicationStyle": "Description of how they communicate",
  "keyMessages": ["Message 1", "Message 2", "Message 3"],
  "visualStyle": "Modern/Classic/Minimalist/Bold/etc"
}`;

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-gateway`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'extract-company-branding',
      model_name: 'gemini-2.5-flash',
      provider: 'google',
      estimated_cost_cents: 1,
      input_tokens: result.usage?.prompt_tokens || 0,
      output_tokens: result.usage?.completion_tokens || 0,
      response_time_ms: Date.now() - startTime,
      status: 'success'
    });

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return basic extracted data
    return {
      colors: {
        primary: brandingData.styles?.detectedColors?.slice(0, 2) || [],
        secondary: brandingData.styles?.detectedColors?.slice(2, 4) || [],
        accent: brandingData.styles?.detectedColors?.slice(4, 6) || [],
        background: ['#ffffff', '#f5f5f5']
      },
      typography: {
        headingFonts: brandingData.styles?.detectedFonts?.slice(0, 1) || ['sans-serif'],
        bodyFonts: brandingData.styles?.detectedFonts?.slice(1, 2) || ['sans-serif'],
        sizes: { heading: '32px', body: '16px' }
      },
      logos: { primary: null, variations: [] },
      toneOfVoice: 'Professional',
      communicationStyle: 'Standard business communication',
      keyMessages: [],
      visualStyle: 'Modern'
    };
  }
}
