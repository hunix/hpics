import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { maskPII, PIIMaskingContext } from "../_shared/pii-masker.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEmail {
  messageId: string;
  from: string;
  fromEmail: string;
  fromName: string;
  to: string[];
  cc: string[];
  subject: string;
  date: Date;
  body: string;
  threadId: string;
}

// Parse MBOX format
function parseMboxContent(content: string): ParsedEmail[] {
  const emails: ParsedEmail[] = [];
  const emailRegex = /^From .+$/gm;
  const parts = content.split(emailRegex);
  
  for (const part of parts) {
    if (!part.trim()) continue;
    
    try {
      const email = parseEmailMessage(part);
      if (email) {
        emails.push(email);
      }
    } catch (error) {
      console.warn('Failed to parse email:', error);
    }
  }
  
  return emails;
}

function parseEmailMessage(raw: string): ParsedEmail | null {
  const lines = raw.split('\n');
  const headers: Record<string, string> = {};
  let bodyStart = 0;
  
  // Parse headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      bodyStart = i + 1;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      const key = line.slice(0, colonIndex).toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      headers[key] = value;
    } else if ((line.startsWith(' ') || line.startsWith('\t')) && Object.keys(headers).length > 0) {
      // Continuation of previous header
      const lastKey = Object.keys(headers).pop()!;
      headers[lastKey] += ' ' + line.trim();
    }
  }
  
  if (!headers['from'] || !headers['date']) {
    return null;
  }
  
  // Parse From field
  const fromMatch = headers['from'].match(/<([^>]+)>/) || [null, headers['from']];
  const fromEmail = (fromMatch[1] || headers['from']).toLowerCase().trim();
  const fromName = headers['from'].replace(/<[^>]+>/, '').trim().replace(/\"/g, '');
  
  // Parse To field
  const toAddresses = (headers['to'] || '').split(',').map(t => {
    const match = t.match(/<([^>]+)>/);
    return (match?.[1] || t).toLowerCase().trim();
  }).filter(Boolean);
  
  // Parse CC field
  const ccAddresses = (headers['cc'] || '').split(',').map(t => {
    const match = t.match(/<([^>]+)>/);
    return (match?.[1] || t).toLowerCase().trim();
  }).filter(Boolean);
  
  // Parse body (simplified - handle MIME properly in production)
  const bodyLines = lines.slice(bodyStart);
  let body = bodyLines.join('\n');
  
  // Handle base64 encoded content
  if (headers['content-transfer-encoding']?.toLowerCase() === 'base64') {
    try {
      body = atob(body.replace(/\s/g, ''));
    } catch {
      // Keep original if decode fails
    }
  }
  
  // Handle quoted-printable
  if (headers['content-transfer-encoding']?.toLowerCase() === 'quoted-printable') {
    body = body.replace(/=\r?\n/g, '')
      .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  
  // Generate thread ID based on subject (simplified)
  const subject = headers['subject'] || '(No Subject)';
  const normalizedSubject = subject.replace(/^(Re:\s*|Fwd:\s*)+/i, '').toLowerCase();
  const threadId = btoa(normalizedSubject).slice(0, 32);
  
  return {
    messageId: headers['message-id'] || crypto.randomUUID(),
    from: headers['from'],
    fromEmail,
    fromName,
    to: toAddresses,
    cc: ccAddresses,
    subject,
    date: new Date(headers['date']),
    body: body.slice(0, 50000), // Limit body size
    threadId,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await (authClient.auth as any).getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[import-mbox-emails] Starting import for session: ${sessionId}`);

    // Get import session
    const { data: session, error: sessionError } = await supabase
      .from('mbox_import_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update session status
    await supabase
      .from('mbox_import_sessions')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Download and combine chunks
    let fullContent = '';
    for (let i = 0; i < session.total_chunks; i++) {
      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('mbox-imports')
        .download(`${userId}/${sessionId}/chunk-${i}`);

      if (downloadError) {
        console.error(`Failed to download chunk ${i}:`, downloadError);
        continue;
      }

      fullContent += await chunkData.text();
    }

    console.log(`[import-mbox-emails] Downloaded ${fullContent.length} bytes`);

    // Handle ZIP files
    if (session.file_name.endsWith('.zip')) {
      // For ZIP files, we'd need to extract - simplified here
      // In production, use a proper ZIP library
      console.log('[import-mbox-emails] ZIP extraction not implemented in this version');
    }

    // Parse MBOX content
    const emails = parseMboxContent(fullContent);
    console.log(`[import-mbox-emails] Parsed ${emails.length} emails`);

    // Get contact emails for matching (join via profiles since contact_methods has no user_id)
    const { data: contactMethods } = await supabase
      .from('contact_methods')
      .select('profile_id, value, profiles!inner(user_id)')
      .eq('profiles.user_id', userId)
      .eq('contact_type', 'email');

    const emailToProfile = new Map(
      contactMethods?.map(cm => [cm.value.toLowerCase(), cm.profile_id]) || []
    );

    // Also build a map for fuzzy matching by domain
    const domainToProfiles = new Map<string, string[]>();
    for (const [email, profileId] of emailToProfile) {
      const domain = email.split('@')[1];
      if (domain) {
        const existing = domainToProfiles.get(domain) || [];
        existing.push(profileId);
        domainToProfiles.set(domain, existing);
      }
    }

    let processedCount = 0;
    let matchedCount = 0;
    let errorCount = 0;
    const piiContext = new PIIMaskingContext();

    // Process emails in batches
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      for (const email of batch) {
        try {
          // Match to contact
          let profileId = emailToProfile.get(email.fromEmail);
          
          if (!profileId) {
            // Try matching recipients
            for (const recipient of [...email.to, ...email.cc]) {
              profileId = emailToProfile.get(recipient);
              if (profileId) break;
            }
          }

          // Encrypt sensitive content
          const maskedBody = piiContext.mask(email.body);
          const maskedSubject = piiContext.mask(email.subject);

          // Upsert thread
          const threadKey = `mbox-${userId}-${email.threadId}`;
          const { data: thread } = await supabase
            .from('email_threads')
            .upsert({
              id: threadKey,
              user_id: userId,
              profile_id: profileId,
              conversation_id: email.threadId,
              subject: maskedSubject,
              participant_emails: [email.fromEmail, ...email.to, ...email.cc],
              message_count: 1,
              last_message_at: email.date.toISOString(),
              source: 'mbox_import',
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false,
            })
            .select()
            .single();

          // Upsert message
          await supabase
            .from('email_messages')
            .upsert({
              id: `mbox-${email.messageId}`,
              thread_id: thread?.id || threadKey,
              user_id: userId,
              message_id: email.messageId,
              subject: maskedSubject,
              body_text: maskedBody,
              sender_email: email.fromEmail,
              sender_name: email.fromName,
              recipient_emails: [...email.to, ...email.cc],
              sent_at: email.date.toISOString(),
              is_from_contact: profileId ? emailToProfile.has(email.fromEmail) : false,
              source: 'mbox_import',
            }, { onConflict: 'id' });

          processedCount++;
          if (profileId) matchedCount++;

        } catch (emailError) {
          console.error(`Failed to process email:`, emailError);
          errorCount++;
        }
      }

      // Update session progress
      await supabase
        .from('mbox_import_sessions')
        .update({
          processed_emails: processedCount,
          matched_contacts: matchedCount,
          error_count: errorCount,
        })
        .eq('id', sessionId);
    }

    // Clean up uploaded chunks
    for (let i = 0; i < session.total_chunks; i++) {
      await supabase.storage
        .from('mbox-imports')
        .remove([`${userId}/${sessionId}/chunk-${i}`]);
    }

    // Finalize session
    await supabase
      .from('mbox_import_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_emails: emails.length,
        processed_emails: processedCount,
        matched_contacts: matchedCount,
        error_count: errorCount,
      })
      .eq('id', sessionId);

    // Log audit event
    await supabase.from('immutable_audit_logs').insert({
      user_id: userId,
      action_type: 'mbox_import',
      resource_type: 'email_import',
      resource_id: sessionId,
      data_classification: 'confidential',
      metadata: {
        total_emails: emails.length,
        processed: processedCount,
        matched: matchedCount,
        errors: errorCount,
        pii_masked_count: piiContext.getMappingCount(),
        pii_types: piiContext.getPIITypes(),
      },
    });

    console.log(`[import-mbox-emails] Import complete: ${processedCount} processed, ${matchedCount} matched, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      totalEmails: emails.length,
      processedEmails: processedCount,
      matchedContacts: matchedCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[import-mbox-emails] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
