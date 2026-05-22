import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestRequest {
  integrationId: string;
  apiKey: string;
  additionalParams?: Record<string, string>;
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime: number;
  details?: Record<string, unknown>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

// ============================================================================
// PEOPLE INTELLIGENCE TESTS
// ============================================================================

async function testPeopleDataLabs(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`https://api.peopledatalabs.com/v5/person/enrich?email=test@example.com`, {
      headers: { "X-Api-Key": apiKey },
    });
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    if (response.status === 402) return { success: true, message: "Valid key (credits exhausted)", responseTime };
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testProxycurl(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://nubela.co/proxycurl/api/credit-balance", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const responseTime = Date.now() - start;
    if (response.status === 401 || response.status === 403) return { success: false, message: "Invalid API key", responseTime };
    const data = await response.json();
    return { success: true, message: `Valid! Credits: ${data.credit_balance || 'unknown'}`, responseTime, details: { credits: data.credit_balance } };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testHunter(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`https://api.hunter.io/v2/account?api_key=${apiKey}`);
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    const data = await response.json();
    return { success: true, message: `Valid! Searches: ${data.data?.requests?.searches?.available || 'unknown'}`, responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

// ============================================================================
// RESEARCH & SEARCH TESTS
// ============================================================================

async function testTavily(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query: "test", max_results: 1 }),
    });
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testNewsAPI(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`);
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    if (response.status === 426) return { success: true, message: "Valid (upgrade required for production)", responseTime };
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testDiffbot(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    // Use analyze endpoint with minimal test URL
    const response = await fetch(`https://api.diffbot.com/v3/analyze?token=${apiKey}&url=https://example.com`);
    const responseTime = Date.now() - start;
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: "Invalid API token", responseTime };
    }
    if (response.status === 429) {
      return { success: true, message: "Valid (rate limited)", responseTime };
    }
    return { success: true, message: "API token is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testGoogleSearch(apiKey: string, cx?: string): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test with minimal query - cx is optional for this validation
    const url = cx 
      ? `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test&num=1`
      : `https://www.googleapis.com/customsearch/v1?key=${apiKey}&q=test&num=1`;
    
    const response = await fetch(url);
    const responseTime = Date.now() - start;
    
    if (response.status === 400) {
      const data = await response.json();
      // If error is about missing cx, the API key itself is valid
      if (data.error?.message?.includes('cx')) {
        return { success: true, message: "API key valid (add Search Engine ID for full setup)", responseTime };
      }
      return { success: false, message: data.error?.message || "Invalid request", responseTime };
    }
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: "Invalid API key", responseTime };
    }
    if (response.status === 429) {
      return { success: true, message: "Valid (quota exceeded)", responseTime };
    }
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testFirecrawl(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }),
    });
    const responseTime = Date.now() - start;
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: "Invalid API key", responseTime };
    }
    if (response.status === 429) {
      return { success: true, message: "Valid (rate limited)", responseTime };
    }
    if (response.status === 402) {
      return { success: true, message: "Valid (credits exhausted)", responseTime };
    }
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

// ============================================================================
// AI & COMMUNICATION TESTS
// ============================================================================

async function testPerplexity(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
      }),
    });
    const responseTime = Date.now() - start;
    
    if (response.status === 401) {
      return { success: false, message: "Invalid API key", responseTime };
    }
    if (response.status === 429) {
      return { success: true, message: "Valid (rate limited)", responseTime };
    }
    if (response.status === 402) {
      return { success: true, message: "Valid (credits exhausted)", responseTime };
    }
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testRapidAPI(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test using a known free/freemium RapidAPI endpoint
    const response = await fetch("https://judge0-ce.p.rapidapi.com/about", {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
    });
    const responseTime = Date.now() - start;
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, message: "Invalid RapidAPI key", responseTime };
    }
    if (response.status === 429) {
      return { success: true, message: "Valid (rate limited)", responseTime };
    }
    return { success: true, message: "RapidAPI key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testResend(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    const data = await response.json();
    return { success: true, message: `Valid! ${data.data?.length || 0} domains`, responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testElevenLabs(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
    });
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    const data = await response.json();
    return { success: true, message: `Valid! Chars: ${data.subscription?.character_count || 'unknown'}`, responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

async function testOpenAI(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const responseTime = Date.now() - start;
    if (response.status === 401) return { success: false, message: "Invalid API key", responseTime };
    return { success: true, message: "API key is valid", responseTime };
  } catch (error) {
    return { success: false, message: `Connection error: ${getErrorMessage(error)}`, responseTime: Date.now() - start };
  }
}

// ============================================================================
// VAPID VALIDATION (No network call needed)
// ============================================================================

function testVAPID(publicKey: string): TestResult {
  const isValidBase64Url = (str: string) => /^[A-Za-z0-9_-]+$/.test(str);
  if (!isValidBase64Url(publicKey) || publicKey.length < 60) {
    return { success: false, message: "Invalid key format (should be base64url, 65+ chars)", responseTime: 0 };
  }
  return { success: true, message: "VAPID key format is valid", responseTime: 0 };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { integrationId, apiKey, additionalParams } = await req.json() as TestRequest;
    if (!integrationId || !apiKey) {
      return new Response(JSON.stringify({ error: "integrationId and apiKey required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: TestResult;
    const id = integrationId.toLowerCase();

    // Match by integration ID or secret key pattern
    if (id.includes('pdl') || id.includes('peopledata')) {
      result = await testPeopleDataLabs(apiKey);
    } else if (id.includes('proxycurl')) {
      result = await testProxycurl(apiKey);
    } else if (id.includes('hunter')) {
      result = await testHunter(apiKey);
    } else if (id.includes('tavily')) {
      result = await testTavily(apiKey);
    } else if (id.includes('news')) {
      result = await testNewsAPI(apiKey);
    } else if (id.includes('diffbot')) {
      result = await testDiffbot(apiKey);
    } else if (id.includes('google_search') || id.includes('googlesearch')) {
      result = await testGoogleSearch(apiKey, additionalParams?.cx);
    } else if (id.includes('firecrawl')) {
      result = await testFirecrawl(apiKey);
    } else if (id.includes('perplexity')) {
      result = await testPerplexity(apiKey);
    } else if (id.includes('rapidapi') || id.includes('rapid')) {
      result = await testRapidAPI(apiKey);
    } else if (id.includes('resend')) {
      result = await testResend(apiKey);
    } else if (id.includes('eleven')) {
      result = await testElevenLabs(apiKey);
    } else if (id.includes('openai') || id.includes('whisper')) {
      result = await testOpenAI(apiKey);
    } else if (id.includes('vapid')) {
      result = testVAPID(apiKey);
    } else {
      // Generic validation - check key format
      result = { 
        success: apiKey.length >= 10, 
        message: apiKey.length >= 10 ? "Key format valid (no specific test available)" : "Key too short", 
        responseTime: 0 
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: getErrorMessage(error), responseTime: 0 }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
