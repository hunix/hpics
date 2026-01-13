import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

function testVAPID(publicKey: string): TestResult {
  const isValidBase64Url = (str: string) => /^[A-Za-z0-9_-]+$/.test(str);
  if (!isValidBase64Url(publicKey) || publicKey.length < 60) {
    return { success: false, message: "Invalid key format (should be base64url, 65+ chars)", responseTime: 0 };
  }
  return { success: true, message: "VAPID key format is valid", responseTime: 0 };
}

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

    const { integrationId, apiKey } = await req.json() as TestRequest;
    if (!integrationId || !apiKey) {
      return new Response(JSON.stringify({ error: "integrationId and apiKey required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: TestResult;
    const id = integrationId.toLowerCase();

    if (id.includes('pdl') || id.includes('peopledata')) result = await testPeopleDataLabs(apiKey);
    else if (id.includes('proxycurl')) result = await testProxycurl(apiKey);
    else if (id.includes('hunter')) result = await testHunter(apiKey);
    else if (id.includes('tavily')) result = await testTavily(apiKey);
    else if (id.includes('news')) result = await testNewsAPI(apiKey);
    else if (id.includes('resend')) result = await testResend(apiKey);
    else if (id.includes('eleven')) result = await testElevenLabs(apiKey);
    else if (id.includes('openai')) result = await testOpenAI(apiKey);
    else if (id.includes('vapid')) result = testVAPID(apiKey);
    else result = { success: apiKey.length >= 10, message: apiKey.length >= 10 ? "Key format valid" : "Key too short", responseTime: 0 };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: getErrorMessage(error), responseTime: 0 }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
