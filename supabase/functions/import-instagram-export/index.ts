/**
 * import-instagram-export Edge Function
 *
 * Accepts a multipart/form-data POST with:
 *   - file   : ZIP file (Instagram data export)
 *   - userId : Supabase user UUID
 *
 * Parses the following files from the ZIP and upserts their data:
 *   messages/inbox/*\/message_1.json          → instagram_messages
 *   connections/followers_and_following/followers_1.json → instagram_connections (type='follower')
 *   connections/followers_and_following/following.json   → instagram_connections (type='following')
 *   personal_information/personal_information/personal_information.json → instagram_profile
 *   ads_information/ads_and_topics/ads_viewed.json       → instagram_activity (type='ad_viewed')
 *   your_instagram_activity/likes/liked_posts.json       → instagram_activity (type='liked_post')
 *
 * For each import batch an `instagram_data_imported` intelligence event is
 * emitted via stream-processor.
 *
 * Returns:
 *   { messagesImported, connectionsImported, profileUpdated }
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlobReader, ZipReader } from "https://deno.land/x/zipjs@v2.7.53/index.js";
import {
  errorResponse,
  jsonResponse,
  optionsResponse,
} from "../_shared/http-helpers.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode Instagram's base64-like encoded text (they use latin-1 / ISO-8859-1). */
function decodeInstagramString(s: string): string {
  try {
    return decodeURIComponent(escape(s));
  } catch {
    return s;
  }
}

/** Read a ZipEntry's text content. */
async function readEntryText(entry: { getData: (writer: unknown) => Promise<Uint8Array> }): Promise<string> {
  // zipjs BlobWriter / TextWriter pattern
  const { TextWriter } = await import("https://deno.land/x/zipjs@v2.7.53/index.js");
  const writer = new TextWriter("utf-8");
  const text: string = await (entry as any).getData(writer);
  return text;
}

/**
 * Emit an intelligence event via stream-processor.
 * Non-fatal: logs error and continues on failure.
 */
async function emitIntelEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.functions.invoke("stream-processor", {
      body: {
        action: "emit_event",
        profileId: null,
        userId,
        eventType: "instagram_data_imported",
        title: "Instagram data imported",
        description: `Instagram export data imported`,
        metadata,
        severity: "info",
        sourceFunction: "import-instagram-export",
      },
    });
  } catch (err) {
    console.warn("[import-instagram] Failed to emit intel event:", err);
  }
}

// ---------------------------------------------------------------------------
// File parsers
// ---------------------------------------------------------------------------

async function parseMessages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<number> {
  let imported = 0;
  const messageEntries = [...entries.entries()].filter(([path]) =>
    /^messages\/inbox\/[^/]+\/message_1\.json$/i.test(path)
  );

  for (const [path, entry] of messageEntries) {
    try {
      const text = await readEntryText(entry);
      const data = JSON.parse(text);
      const threadTitle: string = decodeInstagramString(data.title ?? "");
      const participants: string[] = (data.participants ?? []).map((p: any) =>
        decodeInstagramString(p.name ?? "")
      );
      const threadId = path.split("/")[2]; // inbox/<threadId>/message_1.json

      const msgs: Record<string, unknown>[] = (data.messages ?? []).map(
        (m: any) => ({
          id: `ig-msg-${userId}-${threadId}-${m.timestamp_ms}`,
          user_id: userId,
          thread_id: `ig-thread-${userId}-${threadId}`,
          thread_title: threadTitle,
          participants,
          sender_name: decodeInstagramString(m.sender_name ?? ""),
          timestamp_ms: m.timestamp_ms,
          content: decodeInstagramString(m.content ?? ""),
          message_type: m.type ?? "Generic",
          raw_data: m,
        }),
      );

      if (msgs.length > 0) {
        // Batch upsert in chunks of 100
        for (let i = 0; i < msgs.length; i += 100) {
          const chunk = msgs.slice(i, i + 100);
          const { error } = await supabase
            .from("instagram_messages")
            .upsert(chunk, { onConflict: "id" });
          if (error) {
            console.error(`[import-instagram] instagram_messages upsert error (${path}):`, error);
          } else {
            imported += chunk.length;
          }
        }
      }
    } catch (err) {
      console.error(`[import-instagram] Error parsing message file ${path}:`, err);
    }
  }

  return imported;
}

async function parseConnections(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
  filename: string,
  connectionType: "follower" | "following",
): Promise<number> {
  const entry = entries.get(filename);
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    const data = JSON.parse(text);

    // Instagram export format: top-level array of { string_list_data: [{value, timestamp}] }
    // or wrapped in a keyed object — handle both.
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else {
      // Some exports wrap in { relationships_followers: [...] } etc.
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        items = data[firstKey];
      }
    }

    const rows: Record<string, unknown>[] = [];
    for (const item of items) {
      const stringListData: any[] = item.string_list_data ?? [];
      for (const entry of stringListData) {
        const username = decodeInstagramString(entry.value ?? entry.href ?? "");
        if (!username) continue;
        rows.push({
          id: `ig-conn-${userId}-${connectionType}-${username}`,
          user_id: userId,
          username,
          connection_type: connectionType,
          connected_at: entry.timestamp
            ? new Date(entry.timestamp * 1000).toISOString()
            : null,
          raw_data: item,
        });
      }
    }

    if (rows.length === 0) return 0;

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("instagram_connections")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error(`[import-instagram] instagram_connections upsert error (${connectionType}):`, error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error(`[import-instagram] Error parsing connections file ${filename}:`, err);
    return 0;
  }
}

async function parseProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<boolean> {
  const path =
    "personal_information/personal_information/personal_information.json";
  const entry = entries.get(path);
  if (!entry) return false;

  try {
    const text = await readEntryText(entry);
    const data = JSON.parse(text);

    // Profile data lives under profile_user[0] in most exports.
    const profileInfo = (data.profile_user ?? [data])[0] ?? {};
    const stringFields: Record<string, string> = {};

    for (const [key, val] of Object.entries(profileInfo)) {
      if (typeof val === "string") {
        stringFields[key] = decodeInstagramString(val);
      } else if (
        Array.isArray(val) &&
        (val as any[])[0]?.string_map_data
      ) {
        // Flatten string_map_data entries
        const mapData = (val as any[])[0].string_map_data;
        for (const [mk, mv] of Object.entries(mapData as Record<string, any>)) {
          stringFields[mk.toLowerCase().replace(/\s/g, "_")] =
            decodeInstagramString(mv.value ?? "");
        }
      }
    }

    const { error } = await supabase.from("instagram_profile").upsert(
      {
        id: `ig-profile-${userId}`,
        user_id: userId,
        username: stringFields.username ?? null,
        full_name: stringFields.name ?? stringFields.full_name ?? null,
        biography: stringFields.bio ?? stringFields.biography ?? null,
        profile_data: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("[import-instagram] instagram_profile upsert error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[import-instagram] Error parsing profile file:", err);
    return false;
  }
}

async function parseActivity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
  filePath: string,
  activityType: "ad_viewed" | "liked_post",
): Promise<number> {
  const entry = entries.get(filePath);
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    const data = JSON.parse(text);

    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else {
      // Unwrap first key
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        items = data[firstKey];
      }
    }

    const rows: Record<string, unknown>[] = [];
    for (const item of items) {
      // Ads: { title, string_list_data: [{href, value, timestamp}] }
      // Likes: { title, string_list_data: [{href, value, timestamp}] }
      const listData: any[] = item.string_list_data ?? [item];
      for (const d of listData) {
        const href = d.href ?? d.link ?? "";
        const value = decodeInstagramString(d.value ?? item.title ?? "");
        const ts = d.timestamp
          ? new Date(d.timestamp * 1000).toISOString()
          : new Date().toISOString();
        rows.push({
          id: `ig-activity-${userId}-${activityType}-${href || value}-${d.timestamp ?? Date.now()}`,
          user_id: userId,
          activity_type: activityType,
          title: value,
          href,
          occurred_at: ts,
          raw_data: item,
        });
      }
    }

    if (rows.length === 0) return 0;

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("instagram_activity")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error(`[import-instagram] instagram_activity upsert error (${activityType}):`, error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error(`[import-instagram] Error parsing activity file ${filePath}:`, err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // ── Parse multipart form ───────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      return errorResponse("Failed to parse multipart form data", 400);
    }

    const userId = formData.get("userId") as string | null;
    const file = formData.get("file") as File | null;

    if (!userId) return errorResponse("userId field is required", 400);
    if (!file) return errorResponse("file field is required", 400);

    console.log(
      `[import-instagram] Starting import for user=${userId}, file=${file.name}, size=${file.size}`,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Open ZIP ──────────────────────────────────────────────────────────
    const zipBlob = new Blob([await file.arrayBuffer()]);
    const blobReader = new BlobReader(zipBlob);
    const zipReader = new ZipReader(blobReader);

    // Build a path → entry map (normalise paths to lower-case for matching)
    const rawEntries = await zipReader.getEntries();
    const entries = new Map<string, any>();
    for (const entry of rawEntries) {
      if (!entry.directory) {
        // Normalise path: strip leading "./" and convert backslashes
        const normalised = entry.filename
          .replace(/^\.?\/?/, "")
          .replace(/\\/g, "/");
        entries.set(normalised, entry);
      }
    }

    console.log(`[import-instagram] ZIP contains ${entries.size} file(s)`);

    // ── Parse all sections ────────────────────────────────────────────────
    const [
      messagesImported,
      followersImported,
      followingImported,
      profileUpdated,
      adsImported,
      likesImported,
    ] = await Promise.all([
      parseMessages(supabase, userId, entries),
      parseConnections(
        supabase,
        userId,
        entries,
        "connections/followers_and_following/followers_1.json",
        "follower",
      ),
      parseConnections(
        supabase,
        userId,
        entries,
        "connections/followers_and_following/following.json",
        "following",
      ),
      parseProfile(supabase, userId, entries),
      parseActivity(
        supabase,
        userId,
        entries,
        "ads_information/ads_and_topics/ads_viewed.json",
        "ad_viewed",
      ),
      parseActivity(
        supabase,
        userId,
        entries,
        "your_instagram_activity/likes/liked_posts.json",
        "liked_post",
      ),
    ]);

    await zipReader.close();

    const connectionsImported = followersImported + followingImported;

    // ── Emit intelligence event ───────────────────────────────────────────
    await emitIntelEvent(supabase, userId, {
      messagesImported,
      connectionsImported,
      profileUpdated,
      adsImported,
      likesImported,
      source: "instagram_export",
    });

    const summary = {
      success: true,
      messagesImported,
      connectionsImported,
      profileUpdated,
      adsImported,
      likesImported,
    };

    console.log("[import-instagram] Import complete:", summary);
    return jsonResponse(summary);
  } catch (err) {
    console.error("[import-instagram] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(message, 500);
  }
});
