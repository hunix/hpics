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

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { emails, options }: ImportRequest = await req.json();
    
    if (!emails || !Array.isArray(emails)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: emails array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing batch of ${emails.length} emails for user ${user.id}`);

    // Fetch contact email mappings
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

    // Track existing external IDs to skip duplicates
    let existingIds = new Set<string>();
    if (options.skipDuplicates) {
      const { data: existing } = await supabase
        .from('email_messages')
        .select('external_id')
        .eq('user_id', user.id);
      
      if (existing) {
        existingIds = new Set(existing.map(e => e.external_id));
      }
    }

    let imported = 0;
    let skipped = 0;
    let unmatchedEmails = 0;
    const matchedProfileIds = new Set<string>();
    const threadCache = new Map<string, string>(); // subject -> thread_id

    for (const email of emails) {
      try {
        // Skip if duplicate
        if (options.skipDuplicates && existingIds.has(email.messageId)) {
          skipped++;
          continue;
        }

        // Find matching profile from sender or recipients
        let matchedProfileId: string | null = null;
        
        // Check sender first (if it's not from us, it's from a contact)
        if (email.senderEmail && emailToProfile.has(email.senderEmail.toLowerCase())) {
          matchedProfileId = emailToProfile.get(email.senderEmail.toLowerCase())!;
        }
        
        // If not found, check recipients
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
          // Skip if we don't want unmatched threads
          if (!options.createUnmatchedThreads) {
            skipped++;
            continue;
          }
        }

        // Find or create email thread
        const threadKey = `${matchedProfileId || 'unmatched'}-${email.subject?.slice(0, 100) || 'no-subject'}`;
        let threadId = threadCache.get(threadKey);
        
        if (!threadId) {
          // Check for existing thread
          const { data: existingThread } = await supabase
            .from('email_threads')
            .select('id')
            .eq('user_id', user.id)
            .eq('subject', email.subject || '(No Subject)')
            .eq('profile_id', matchedProfileId)
            .single();
          
          if (existingThread) {
            threadId = existingThread.id;
          } else {
            // Create new thread
            const { data: newThread, error: threadError } = await supabase
              .from('email_threads')
              .insert({
                user_id: user.id,
                profile_id: matchedProfileId,
                subject: email.subject || '(No Subject)',
                folder: email.folder.includes('Sent') ? 'sent' : 'inbox',
                last_message_at: email.sentAt,
                message_count: 1,
              })
              .select('id')
              .single();
            
            if (threadError) {
              console.error('Error creating thread:', threadError);
              skipped++;
              continue;
            }
            
            threadId = newThread.id;
          }
          
          if (threadId) {
            threadCache.set(threadKey, threadId);
          }
        }

        // Insert email message
        const { error: messageError } = await supabase
          .from('email_messages')
          .insert({
            user_id: user.id,
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
            is_from_contact: !!matchedProfileId && email.senderEmail === emailToProfile.get(email.senderEmail.toLowerCase()),
          });
        
        if (messageError) {
          console.error('Error inserting message:', messageError);
          skipped++;
          continue;
        }

        // Update thread message count and last_message_at
        await supabase
          .from('email_threads')
          .update({
            message_count: threadCache.get(threadKey) ? undefined : 1,
            last_message_at: email.sentAt,
          })
          .eq('id', threadId);

        imported++;
        existingIds.add(email.messageId);
        
      } catch (error) {
        console.error('Error processing email:', error);
        skipped++;
      }
    }

    // Update last contact timestamps for matched profiles
    for (const profileId of matchedProfileIds) {
      await supabase
        .from('profiles')
        .update({ last_contacted: new Date().toISOString() })
        .eq('id', profileId);
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped, ${matchedProfileIds.size} contacts matched`);

    return new Response(
      JSON.stringify({
        imported,
        skipped,
        matchedContacts: Array.from(matchedProfileIds),
        unmatchedEmails,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
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
