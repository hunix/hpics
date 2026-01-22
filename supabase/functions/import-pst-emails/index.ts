import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEmail {
  messageId: string;
  conversationId: string | null;
  subject: string;
  senderEmail: string;
  senderName: string;
  recipients: string[];
  ccRecipients: string[];
  bodyText: string;
  bodyHtml: string;
  sentAt: string;
  receivedAt: string | null;
  hasAttachments: boolean;
  attachments: { name: string; size: number }[];
  importance: 'low' | 'normal' | 'high';
  folder: string;
}

interface ImportRequest {
  emails: ParsedEmail[];
  options: {
    skipDuplicates: boolean;
    createUnmatchedThreads: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit (HPICS standard)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'import-pst-emails', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await (supabase.auth as any).getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const { emails, options }: ImportRequest = await req.json();
    
    if (!emails || !Array.isArray(emails)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: emails array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[import-pst-emails] Processing batch of ${emails.length} emails for user ${userId}`);
    const startTime = Date.now();

    // ==========================================
    // PHASE 1: Bulk fetch all required data
    // ==========================================

    // Fetch contact email mappings in bulk
    const { data: contactMethods } = await supabase
      .from('contact_methods')
      .select('value, profile_id')
      .eq('contact_type', 'email');
    
    const emailToProfile = new Map<string, string>();
    if (contactMethods) {
      for (const method of contactMethods) {
        emailToProfile.set(method.value.toLowerCase(), method.profile_id);
      }
    }

    // Bulk fetch existing external IDs to skip duplicates
    let existingIds = new Set<string>();
    if (options.skipDuplicates && emails.length > 0) {
      const messageIds = emails.map(e => e.messageId).filter(Boolean);
      if (messageIds.length > 0) {
        const { data: existing } = await supabase
          .from('email_messages')
          .select('external_id')
          .eq('user_id', userId)
          .in('external_id', messageIds);
        
        if (existing) {
          existingIds = new Set(existing.map(e => e.external_id));
        }
      }
    }

    // ==========================================
    // PHASE 2: Pre-compute all unique threads
    // ==========================================
    
    interface ThreadInfo {
      subject: string;
      profileId: string | null;
      folder: string;
      lastMessageAt: string;
    }
    
    const uniqueThreads = new Map<string, ThreadInfo>();
    const emailToThreadKey = new Map<number, string>(); // email index -> thread key
    
    let unmatchedEmails = 0;
    const matchedProfileIds = new Set<string>();
    const emailsToProcess: { index: number; email: ParsedEmail; profileId: string | null }[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      // Skip duplicates early
      if (options.skipDuplicates && existingIds.has(email.messageId)) {
        continue;
      }

      // Find matching profile from sender or recipients
      let matchedProfileId: string | null = null;
      
      if (email.senderEmail && emailToProfile.has(email.senderEmail.toLowerCase())) {
        matchedProfileId = emailToProfile.get(email.senderEmail.toLowerCase())!;
      }
      
      if (!matchedProfileId) {
        for (const recipient of [...email.recipients, ...email.ccRecipients]) {
          if (emailToProfile.has(recipient.toLowerCase())) {
            matchedProfileId = emailToProfile.get(recipient.toLowerCase())!;
            break;
          }
        }
      }

      if (matchedProfileId) {
        matchedProfileIds.add(matchedProfileId);
      } else {
        unmatchedEmails++;
        if (!options.createUnmatchedThreads) {
          continue;
        }
      }

      // Build thread key
      const subject = email.subject || '(No Subject)';
      const threadKey = `${matchedProfileId || 'unmatched'}::${subject.slice(0, 100)}`;
      emailToThreadKey.set(i, threadKey);
      
      // Track unique thread info
      if (!uniqueThreads.has(threadKey)) {
        uniqueThreads.set(threadKey, {
          subject,
          profileId: matchedProfileId,
          folder: email.folder?.includes('Sent') ? 'sent' : 'inbox',
          lastMessageAt: email.sentAt
        });
      } else {
        // Update last message time if this email is newer
        const existing = uniqueThreads.get(threadKey)!;
        if (email.sentAt > existing.lastMessageAt) {
          existing.lastMessageAt = email.sentAt;
        }
      }

      emailsToProcess.push({ index: i, email, profileId: matchedProfileId });
    }

    console.log(`[import-pst-emails] ${emailsToProcess.length} emails to process, ${uniqueThreads.size} unique threads`);

    // ==========================================
    // PHASE 3: Bulk fetch existing threads
    // ==========================================
    
    const threadIdMap = new Map<string, string>(); // threadKey -> thread_id
    
    if (uniqueThreads.size > 0) {
      const subjects = [...new Set([...uniqueThreads.values()].map(t => t.subject))];
      
      // Fetch existing threads in bulk (may return multiple)
      const { data: existingThreads } = await supabase
        .from('email_threads')
        .select('id, subject, profile_id')
        .eq('user_id', userId)
        .in('subject', subjects);
      
      if (existingThreads) {
        for (const thread of existingThreads) {
          const threadKey = `${thread.profile_id || 'unmatched'}::${thread.subject.slice(0, 100)}`;
          threadIdMap.set(threadKey, thread.id);
        }
      }
    }

    // ==========================================
    // PHASE 4: Bulk create missing threads
    // ==========================================
    
    const threadsToCreate: any[] = [];
    const pendingThreadKeys: string[] = [];
    
    for (const [threadKey, threadInfo] of uniqueThreads) {
      if (!threadIdMap.has(threadKey)) {
        threadsToCreate.push({
          user_id: userId,
          profile_id: threadInfo.profileId,
          subject: threadInfo.subject,
          folder: threadInfo.folder,
          last_message_at: threadInfo.lastMessageAt,
          message_count: 0,
        });
        pendingThreadKeys.push(threadKey);
      }
    }

    if (threadsToCreate.length > 0) {
      console.log(`[import-pst-emails] Creating ${threadsToCreate.length} new threads`);
      
      const { data: newThreads, error: threadError } = await supabase
        .from('email_threads')
        .insert(threadsToCreate)
        .select('id, subject, profile_id');
      
      if (threadError) {
        console.error('[import-pst-emails] Bulk thread creation failed:', threadError);
        // Fall back to individual creation for threads that failed
      } else if (newThreads) {
        for (let i = 0; i < newThreads.length; i++) {
          const thread = newThreads[i];
          const threadKey = `${thread.profile_id || 'unmatched'}::${thread.subject.slice(0, 100)}`;
          threadIdMap.set(threadKey, thread.id);
        }
      }
    }

    // ==========================================
    // PHASE 5: Bulk insert all messages
    // ==========================================
    
    const messagesToInsert: any[] = [];
    const threadMessageCounts = new Map<string, number>();
    
    for (const { index, email, profileId } of emailsToProcess) {
      const threadKey = emailToThreadKey.get(index);
      if (!threadKey) continue;
      
      const threadId = threadIdMap.get(threadKey);
      if (!threadId) {
        console.warn(`[import-pst-emails] No thread found for key: ${threadKey}`);
        continue;
      }

      messagesToInsert.push({
        user_id: userId,
        thread_id: threadId,
        external_id: email.messageId,
        subject: email.subject,
        sender_email: email.senderEmail,
        sender_name: email.senderName,
        recipients: email.recipients,
        cc_recipients: email.ccRecipients,
        body_preview: email.bodyText?.slice(0, 500) || null,
        body_html: email.bodyHtml || email.bodyText || null,
        sent_at: email.sentAt,
        received_at: email.receivedAt,
        has_attachments: email.hasAttachments,
        importance: email.importance,
        is_from_contact: !!profileId && email.senderEmail?.toLowerCase() === [...emailToProfile.entries()].find(([_, v]) => v === profileId)?.[0],
      });

      // Track message counts per thread
      threadMessageCounts.set(threadId, (threadMessageCounts.get(threadId) || 0) + 1);
    }

    let imported = 0;
    let skipped = emails.length - emailsToProcess.length; // Already skipped duplicates/unmatched

    if (messagesToInsert.length > 0) {
      console.log(`[import-pst-emails] Bulk inserting ${messagesToInsert.length} messages`);
      
      // Insert in chunks of 500 to avoid payload limits
      const CHUNK_SIZE = 500;
      for (let i = 0; i < messagesToInsert.length; i += CHUNK_SIZE) {
        const chunk = messagesToInsert.slice(i, i + CHUNK_SIZE);
        
        const { error: bulkError, data: insertedData } = await supabase
          .from('email_messages')
          .insert(chunk)
          .select('id');
        
        if (bulkError) {
          console.error(`[import-pst-emails] Bulk insert failed for chunk ${i}-${i + chunk.length}:`, bulkError);
          skipped += chunk.length;
        } else {
          imported += insertedData?.length || chunk.length;
        }
      }
    }

    // ==========================================
    // PHASE 6: Bulk update thread message counts
    // ==========================================
    
    // Update threads with new message counts (batch update)
    for (const [threadId, count] of threadMessageCounts) {
      // Try to increment, fall back to direct update
      try {
        await supabase
          .from('email_threads')
          .update({ message_count: count })
          .eq('id', threadId);
      } catch (e) {
        console.warn(`[import-pst-emails] Failed to update thread count for ${threadId}:`, e);
      }
    }

    // ==========================================
    // PHASE 7: Bulk update contact last_contacted
    // ==========================================
    
    if (matchedProfileIds.size > 0) {
      const profileIdsArray = Array.from(matchedProfileIds);
      await supabase
        .from('profiles')
        .update({ last_contacted: new Date().toISOString() })
        .in('id', profileIdsArray);
    }

    const duration = Date.now() - startTime;
    console.log(`[import-pst-emails] Complete: ${imported} imported, ${skipped} skipped, ${matchedProfileIds.size} contacts matched in ${duration}ms`);

    return new Response(
      JSON.stringify({
        imported,
        skipped,
        matchedContacts: Array.from(matchedProfileIds),
        unmatchedEmails,
        duration_ms: duration,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[import-pst-emails] Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
