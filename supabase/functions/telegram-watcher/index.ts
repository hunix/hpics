/**
 * telegram-watcher — pulls recent messages from configured public Telegram
 * channels and persists any that mention tracked entities (names, aliases,
 * emails) as `intelligence_alerts`.
 *
 * Uses the Telegram Bot API in passive read mode. The bot must be added to
 * each channel as a member. Channels are configured per-user in
 * `telegram_watch_channels` (id, channel_username, channel_chat_id, enabled).
 *
 * POST /            { runId?: string }  — invoked by the monitor loop; runs
 *                                         one polling pass for the user
 * POST /backfill    { channel: string, limit?: number } — admin: re-pull
 *                                         history for one channel
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const TG_BASE = 'https://api.telegram.org';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    text?: string;
    chat?: { id: number; username?: string; title?: string };
    from?: { id: number; username?: string };
  };
  channel_post?: {
    message_id: number;
    date: number;
    text?: string;
    chat?: { id: number; username?: string; title?: string };
  };
}

async function fetchUpdates(botToken: string, offset?: number): Promise<TelegramUpdate[]> {
  const url = `${TG_BASE}/bot${botToken}/getUpdates?timeout=0&allowed_updates=%5B%22channel_post%22%5D` +
    (offset !== undefined ? `&offset=${offset}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`telegram getUpdates ${res.status}`);
  const body = await res.json() as { ok: boolean; result: TelegramUpdate[] };
  if (!body.ok) throw new Error('telegram getUpdates returned ok=false');
  return body.result ?? [];
}

interface WatchTerm { term: string; profile_id: string | null }

function findMatches(text: string, terms: WatchTerm[]): WatchTerm[] {
  if (!text) return [];
  const lc = text.toLowerCase();
  return terms.filter(t => t.term && lc.includes(t.term.toLowerCase()));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('telegram-watcher');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const auth = await validateAuth(req, body);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return errorResponse('TELEGRAM_BOT_TOKEN not configured', 503);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  // Pull configured channels (limited to caller).
  const { data: channels } = await supabase
    .from('telegram_watch_channels')
    .select('id, channel_chat_id, channel_username, last_update_id, enabled')
    .eq('user_id', auth.userId)
    .eq('enabled', true);

  if (!channels || channels.length === 0) {
    return jsonResponse({ success: true, message: 'no enabled channels', polled: 0 });
  }

  // Pull watch terms once per run.
  const { data: terms } = await supabase
    .from('intel_watch_terms')
    .select('term, profile_id')
    .eq('user_id', auth.userId);
  const watchTerms = (terms ?? []) as WatchTerm[];

  let totalNew = 0;
  let totalMatches = 0;
  const channelById = new Map<number, typeof channels[number]>();
  for (const ch of channels) channelById.set(ch.channel_chat_id as number, ch);

  // getUpdates returns a global feed of updates the bot has access to. We
  // filter to channel_posts whose chat.id is one of our configured channels.
  const minOffset = Math.min(...channels.map(c => Number(c.last_update_id ?? 0))) + 1;
  const updates = await fetchUpdates(botToken, isFinite(minOffset) ? minOffset : undefined);

  for (const u of updates) {
    const post = u.channel_post ?? u.message;
    if (!post?.chat?.id || !post.text) continue;
    const channel = channelById.get(post.chat.id);
    if (!channel) continue;
    totalNew++;

    const matches = findMatches(post.text, watchTerms);

    // Always store the raw post so we can re-scan if watch terms change.
    await supabase.from('telegram_channel_posts').upsert({
      user_id: auth.userId,
      channel_id: channel.id,
      message_id: post.message_id,
      posted_at: new Date(post.date * 1000).toISOString(),
      text: post.text,
      matched_terms: matches.map(m => m.term),
      raw: u,
    }, { onConflict: 'user_id,channel_id,message_id' });

    if (matches.length > 0) {
      totalMatches++;
      const profileIds = [...new Set(matches.map(m => m.profile_id).filter(Boolean))] as string[];
      await supabase.from('intelligence_alerts').insert(profileIds.length > 0
        ? profileIds.map(pid => ({
            user_id:    auth.userId,
            profile_id: pid,
            alert_type: 'socmint_telegram',
            severity:   'medium',
            title:      `Mention on Telegram @${channel.channel_username ?? channel.channel_chat_id}`,
            details:    { text: post.text, channel: channel.channel_username, message_id: post.message_id, matched: matches.map(m => m.term) },
          }))
        : [{
            user_id:    auth.userId,
            profile_id: null,
            alert_type: 'socmint_telegram',
            severity:   'low',
            title:      `Match on Telegram @${channel.channel_username ?? channel.channel_chat_id}`,
            details:    { text: post.text, channel: channel.channel_username, message_id: post.message_id, matched: matches.map(m => m.term) },
          }],
      );
    }

    // Advance per-channel offset.
    if (u.update_id > Number(channel.last_update_id ?? 0)) {
      await supabase.from('telegram_watch_channels')
        .update({ last_update_id: u.update_id, last_polled_at: new Date().toISOString() })
        .eq('id', channel.id);
      channel.last_update_id = u.update_id;
    }
  }

  return jsonResponse({
    success: true,
    polled: updates.length,
    newPosts: totalNew,
    matches: totalMatches,
  });
});
