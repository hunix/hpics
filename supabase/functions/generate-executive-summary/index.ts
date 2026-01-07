import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth header for getClaims
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userId = claimsData.claims.sub as string;
    const user = { id: userId };
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { timePeriod = 'week', profileIds } = await req.json();

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timePeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Gather statistics
    const { data: contacts } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_score, last_contact_date')
      .eq('user_id', user.id);

    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('user_id', user.id)
      .gte('occurred_at', startDate.toISOString());

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', startDate.toISOString())
      .lte('event_date', now.toISOString());

    const { data: newContacts } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Calculate decay risks
    const decayRiskContacts = (contacts || [])
      .filter(c => {
        if (!c.last_contact_date) return true;
        const daysSinceContact = (now.getTime() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceContact > 30;
      })
      .slice(0, 10);

    // Build summary
    const summary = {
      period: timePeriod,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      stats: {
        totalContacts: contacts?.length || 0,
        newContacts: newContacts?.length || 0,
        totalCommunications: communications?.length || 0,
        eventsAttended: events?.length || 0,
        averageRelationshipScore: contacts?.length 
          ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 50), 0) / contacts.length)
          : 50,
      },
      communicationBreakdown: {
        email: communications?.filter(c => c.channel === 'email').length || 0,
        phone: communications?.filter(c => c.channel === 'phone').length || 0,
        meeting: communications?.filter(c => c.channel === 'in_person').length || 0,
        message: communications?.filter(c => c.channel === 'sms' || c.channel === 'whatsapp').length || 0,
      },
      decayRiskContacts: decayRiskContacts.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name || ''}`.trim(),
        lastContact: c.last_contact_date,
      })),
      upcomingBirthdays: [], // Could fetch from contact_personal_info
      keyHighlights: [
        newContacts?.length ? `Added ${newContacts.length} new contacts` : null,
        communications?.length ? `${communications.length} total interactions logged` : null,
        events?.length ? `Attended ${events.length} events` : null,
      ].filter(Boolean),
    };

    // Store in generated_reports
    const { data: report } = await supabase
      .from('generated_reports')
      .insert({
        user_id: user.id,
        report_type: 'executive_summary',
        title: `Executive Summary - ${timePeriod}`,
        metadata: summary,
      })
      .select()
      .single();

    return new Response(JSON.stringify({
      success: true,
      reportId: report?.id,
      summary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error('Generate executive summary error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
