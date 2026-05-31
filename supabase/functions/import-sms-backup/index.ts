/**
 * import-sms-backup — ingests SMS messages exported by the
 * "SMS Backup & Restore" Android app (XML format).
 *
 * The frontend sends pre-parsed message objects (to avoid XML handling
 * in the browser for large backups) as a JSON array in batches of 500.
 *
 * POST body:
 *   { userId: string, messages: SmsRow[], source?: string }
 *
 * SmsRow:
 *   { phoneNumber, contactName, body, sentAt: ISO string, messageType: 'sent'|'received' }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  optionsResponse,
  jsonResponse,
  errorResponse,
  healthCheckResponse,
} from '../_shared/http-helpers.ts';

interface SmsRow {
  phoneNumber: string;
  contactName?: string;
  body?: string;
  sentAt?: string;
  messageType: 'sent' | 'received';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return healthCheckResponse('import-sms-backup');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json() as { userId: string; messages: SmsRow[]; source?: string };
    const { userId, messages, source = 'sms_backup_restore' } = body;

    if (!userId) return errorResponse('userId required', 400);
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ imported: 0, skipped: 0 });
    }

    const rows = messages
      .filter((m) => m.phoneNumber)
      .map((m) => ({
        user_id: userId,
        phone_number: m.phoneNumber.trim(),
        contact_name: m.contactName?.trim() || null,
        body: m.body || null,
        sent_at: m.sentAt ? new Date(m.sentAt).toISOString() : null,
        message_type: m.messageType === 'sent' ? 'sent' : 'received',
        source,
      }));

    const BATCH = 500;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const { error, count } = await supabase
        .from('sms_messages')
        .upsert(slice, {
          onConflict: 'user_id,phone_number,sent_at,body',
          ignoreDuplicates: true,
          count: 'exact',
        });

      if (error) {
        console.error('[import-sms-backup] upsert error:', error.message);
        skipped += slice.length;
      } else {
        imported += count ?? slice.length;
      }
    }

    // Update source health log
    await supabase.from('source_health_log').upsert(
      {
        user_id: userId,
        source_name: 'sms',
        last_synced_at: new Date().toISOString(),
        record_count: imported,
        status: 'ok',
      },
      { onConflict: 'user_id,source_name' },
    );

    console.log(`[import-sms-backup] user=${userId} imported=${imported} skipped=${skipped}`);
    return jsonResponse({ imported, skipped, total: rows.length });
  } catch (err) {
    console.error('[import-sms-backup] error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});
