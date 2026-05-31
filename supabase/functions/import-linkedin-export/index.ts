/**
 * import-linkedin-export Edge Function
 *
 * Accepts a multipart/form-data POST with:
 *   - file   : ZIP file (LinkedIn data export)
 *   - userId : Supabase user UUID
 *
 * Parses the following CSV files from the ZIP:
 *   Connections.csv   → linkedin_connections  (+ profile matching)
 *   Messages.csv      → linkedin_messages
 *   Profile.csv       → linkedin_profile
 *   Positions.csv     → linkedin_positions
 *   Education.csv     → linkedin_education
 *   Skills.csv        → linkedin_skills
 *
 * Matched contacts (by email) have their profiles.linkedin_profile_data JSONB
 * updated, and a `linkedin_connection_matched` intelligence event is emitted
 * for each match.
 *
 * Returns:
 *   { connectionsImported, messagesImported, profileUpdated,
 *     matchedExistingProfiles }
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlobReader, ZipReader } from "https://deno.land/x/zipjs@v2.7.53/index.js";
import { parse as parseCSV } from "https://deno.land/std@0.224.0/csv/parse.ts";
import {
  errorResponse,
  jsonResponse,
  optionsResponse,
} from "../_shared/http-helpers.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a ZipEntry's text content. */
async function readEntryText(entry: any): Promise<string> {
  const { TextWriter } = await import("https://deno.land/x/zipjs@v2.7.53/index.js");
  const writer = new TextWriter("utf-8");
  return await entry.getData(writer);
}

/**
 * Emit an intelligence event via stream-processor.
 * Non-fatal: logs error and continues on failure.
 */
async function emitIntelEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  eventType: string,
  profileId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.functions.invoke("stream-processor", {
      body: {
        action: "emit_event",
        userId,
        profileId,
        eventType,
        title: eventType === "linkedin_connection_matched"
          ? "LinkedIn connection matched to existing profile"
          : "LinkedIn data imported",
        description: metadata.description ?? `LinkedIn export: ${eventType}`,
        metadata,
        severity: "info",
        sourceFunction: "import-linkedin-export",
      },
    });
  } catch (err) {
    console.warn(`[import-linkedin] Failed to emit intel event (${eventType}):`, err);
  }
}

/** Slugify a string for use as a deterministic ID component. */
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// CSV file parsers
// ---------------------------------------------------------------------------

async function parseConnections(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<{ imported: number; matched: number }> {
  const entry = entries.get("connections.csv") ?? entries.get("Connections.csv");
  if (!entry) return { imported: 0, matched: 0 };

  try {
    const text = await readEntryText(entry);

    // LinkedIn CSVs start with a few note lines before the header row.
    // Find the line that starts with "First Name" and strip everything before it.
    const lines = text.split("\n");
    const headerIdx = lines.findIndex((l) =>
      l.startsWith("First Name") || l.startsWith('"First Name"'),
    );
    const csvText = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : text;

    const records = parseCSV(csvText, { skipFirstRow: true, columns: [
      "First Name", "Last Name", "Email Address", "Company", "Position", "Connected On",
    ]});

    // Build email → profile_id map from existing profiles
    const emails = records
      .map((r) => (r["Email Address"] as string)?.toLowerCase?.())
      .filter(Boolean);

    const { data: contactMethods } = emails.length > 0
      ? await supabase
          .from("contact_methods")
          .select("value, profile_id")
          .in("value", emails)
      : { data: [] };

    const emailToProfile = new Map<string, string>();
    for (const cm of contactMethods ?? []) {
      if (cm.value) emailToProfile.set(cm.value.toLowerCase(), cm.profile_id);
    }

    const rows: Record<string, unknown>[] = [];
    for (const r of records) {
      const email = (r["Email Address"] as string)?.toLowerCase?.() ?? "";
      const firstName = r["First Name"] as string ?? "";
      const lastName = r["Last Name"] as string ?? "";
      const company = r["Company"] as string ?? "";
      const position = r["Position"] as string ?? "";
      const connectedOn = r["Connected On"] as string ?? "";
      const profileId = email ? (emailToProfile.get(email) ?? null) : null;

      rows.push({
        id: `li-conn-${userId}-${slug(email || `${firstName}-${lastName}`)}`,
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        company,
        position,
        connected_on: connectedOn || null,
        matched_profile_id: profileId,
      });
    }

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("linkedin_connections")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error("[import-linkedin] linkedin_connections upsert error:", error);
      } else {
        imported += chunk.length;
      }
    }

    // Update matched profiles with LinkedIn data + emit events
    let matched = 0;
    const profileIds = [...new Set(
      rows
        .filter((r) => r.matched_profile_id)
        .map((r) => r.matched_profile_id as string),
    )];

    for (const profileId of profileIds) {
      const conn = rows.find((r) => r.matched_profile_id === profileId);
      if (!conn) continue;

      await supabase
        .from("profiles")
        .update({
          linkedin_profile_data: {
            company: conn.company,
            position: conn.position,
            email: conn.email,
            connected_on: conn.connected_on,
            imported_at: new Date().toISOString(),
          },
        })
        .eq("id", profileId);

      await emitIntelEvent(supabase, userId, "linkedin_connection_matched", profileId, {
        profileId,
        firstName: conn.first_name,
        lastName: conn.last_name,
        company: conn.company,
        position: conn.position,
        description: `LinkedIn connection ${conn.full_name} matched to existing profile`,
      });

      matched++;
    }

    return { imported, matched };
  } catch (err) {
    console.error("[import-linkedin] Error parsing Connections.csv:", err);
    return { imported: 0, matched: 0 };
  }
}

async function parseMessages(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<number> {
  const entry = entries.get("messages.csv") ?? entries.get("Messages.csv");
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    const lines = text.split("\n");
    const headerIdx = lines.findIndex((l) =>
      l.startsWith("Conversation ID") || l.startsWith('"Conversation ID"'),
    );
    const csvText = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : text;

    const records = parseCSV(csvText, { skipFirstRow: true, columns: [
      "Conversation ID", "Conversation Title", "From", "Sender Profile URL",
      "Date", "Subject", "Content", "Folder",
    ]});

    const rows: Record<string, unknown>[] = records.map((r) => ({
      id: `li-msg-${userId}-${slug(r["Conversation ID"] as string ?? "")}-${slug(r["Date"] as string ?? Date.now().toString())}`,
      user_id: userId,
      conversation_id: r["Conversation ID"] ?? "",
      conversation_title: r["Conversation Title"] ?? "",
      from_name: r["From"] ?? "",
      sender_profile_url: r["Sender Profile URL"] ?? "",
      sent_at: r["Date"] ?? null,
      subject: r["Subject"] ?? "",
      content: r["Content"] ?? "",
      folder: r["Folder"] ?? "",
    }));

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("linkedin_messages")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error("[import-linkedin] linkedin_messages upsert error:", error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error("[import-linkedin] Error parsing Messages.csv:", err);
    return 0;
  }
}

async function parseProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<boolean> {
  const entry = entries.get("profile.csv") ?? entries.get("Profile.csv");
  if (!entry) return false;

  try {
    const text = await readEntryText(entry);
    // Profile.csv is typically a 2-row CSV (header + one data row).
    const records = parseCSV(text, { skipFirstRow: true });
    if (records.length === 0) return false;

    const r = records[0] as Record<string, string>;

    const { error } = await supabase.from("linkedin_profile").upsert(
      {
        id: `li-profile-${userId}`,
        user_id: userId,
        first_name: r["First Name"] ?? r["firstName"] ?? null,
        last_name: r["Last Name"] ?? r["lastName"] ?? null,
        headline: r["Headline"] ?? r["headline"] ?? null,
        summary: r["Summary"] ?? r["summary"] ?? null,
        industry: r["Industry"] ?? r["industry"] ?? null,
        location: r["Geo Location"] ?? r["geoLocation"] ?? r["location"] ?? null,
        profile_data: r,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("[import-linkedin] linkedin_profile upsert error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[import-linkedin] Error parsing Profile.csv:", err);
    return false;
  }
}

async function parsePositions(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<number> {
  const entry = entries.get("positions.csv") ?? entries.get("Positions.csv");
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    const lines = text.split("\n");
    const headerIdx = lines.findIndex((l) =>
      l.startsWith("Company Name") || l.startsWith('"Company Name"'),
    );
    const csvText = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : text;

    const records = parseCSV(csvText, { skipFirstRow: true, columns: [
      "Company Name", "Title", "Description", "Location", "Started On", "Finished On",
    ]});

    const rows: Record<string, unknown>[] = records.map((r, idx) => ({
      id: `li-pos-${userId}-${slug(r["Company Name"] as string ?? "")}-${slug(r["Started On"] as string ?? String(idx))}`,
      user_id: userId,
      company_name: r["Company Name"] ?? "",
      title: r["Title"] ?? "",
      description: r["Description"] ?? null,
      location: r["Location"] ?? null,
      started_on: r["Started On"] ?? null,
      finished_on: r["Finished On"] ?? null,
    }));

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("linkedin_positions")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error("[import-linkedin] linkedin_positions upsert error:", error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error("[import-linkedin] Error parsing Positions.csv:", err);
    return 0;
  }
}

async function parseEducation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<number> {
  const entry = entries.get("education.csv") ?? entries.get("Education.csv");
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    const lines = text.split("\n");
    const headerIdx = lines.findIndex((l) =>
      l.startsWith("School Name") || l.startsWith('"School Name"'),
    );
    const csvText = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : text;

    const records = parseCSV(csvText, { skipFirstRow: true, columns: [
      "School Name", "Start Date", "End Date", "Notes", "Degree Name", "Activities",
    ]});

    const rows: Record<string, unknown>[] = records.map((r, idx) => ({
      id: `li-edu-${userId}-${slug(r["School Name"] as string ?? "")}-${slug(r["Start Date"] as string ?? String(idx))}`,
      user_id: userId,
      school_name: r["School Name"] ?? "",
      start_date: r["Start Date"] ?? null,
      end_date: r["End Date"] ?? null,
      notes: r["Notes"] ?? null,
      degree_name: r["Degree Name"] ?? null,
      activities: r["Activities"] ?? null,
    }));

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("linkedin_education")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error("[import-linkedin] linkedin_education upsert error:", error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error("[import-linkedin] Error parsing Education.csv:", err);
    return 0;
  }
}

async function parseSkills(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: Map<string, any>,
): Promise<number> {
  const entry = entries.get("skills.csv") ?? entries.get("Skills.csv");
  if (!entry) return 0;

  try {
    const text = await readEntryText(entry);
    // Skills.csv is a single-column CSV: one skill name per row.
    const lines = text
      .split("\n")
      .map((l) => l.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);

    // Skip the header line ("Name" or "Skill")
    const skills = lines.filter(
      (l) => l.toLowerCase() !== "name" && l.toLowerCase() !== "skill",
    );

    if (skills.length === 0) return 0;

    const rows: Record<string, unknown>[] = skills.map((skill) => ({
      id: `li-skill-${userId}-${slug(skill)}`,
      user_id: userId,
      skill_name: skill,
    }));

    let imported = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("linkedin_skills")
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error("[import-linkedin] linkedin_skills upsert error:", error);
      } else {
        imported += chunk.length;
      }
    }
    return imported;
  } catch (err) {
    console.error("[import-linkedin] Error parsing Skills.csv:", err);
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
    } catch {
      return errorResponse("Failed to parse multipart form data", 400);
    }

    const userId = formData.get("userId") as string | null;
    const file = formData.get("file") as File | null;

    if (!userId) return errorResponse("userId field is required", 400);
    if (!file) return errorResponse("file field is required", 400);

    console.log(
      `[import-linkedin] Starting import for user=${userId}, file=${file.name}, size=${file.size}`,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Open ZIP ───────────────────────────────────────────────────────────
    const zipBlob = new Blob([await file.arrayBuffer()]);
    const blobReader = new BlobReader(zipBlob);
    const zipReader = new ZipReader(blobReader);

    const rawEntries = await zipReader.getEntries();
    const entries = new Map<string, any>();
    for (const entry of rawEntries) {
      if (!entry.directory) {
        // Normalise: strip path prefix, lowercase key for case-insensitive lookup
        const basename = entry.filename
          .replace(/\\/g, "/")
          .split("/")
          .pop()!;
        entries.set(basename.toLowerCase(), entry);
        // Also store with original casing
        entries.set(basename, entry);
      }
    }

    console.log(`[import-linkedin] ZIP contains ${rawEntries.length} file(s)`);

    // ── Parse all sections in parallel ────────────────────────────────────
    const [
      connectionsResult,
      messagesImported,
      profileUpdated,
      positionsImported,
      educationImported,
      skillsImported,
    ] = await Promise.all([
      parseConnections(supabase, userId, entries),
      parseMessages(supabase, userId, entries),
      parseProfile(supabase, userId, entries),
      parsePositions(supabase, userId, entries),
      parseEducation(supabase, userId, entries),
      parseSkills(supabase, userId, entries),
    ]);

    await zipReader.close();

    const { imported: connectionsImported, matched: matchedExistingProfiles } =
      connectionsResult;

    // ── Emit bulk import intel event ──────────────────────────────────────
    await emitIntelEvent(supabase, userId, "linkedin_data_imported", null, {
      connectionsImported,
      messagesImported,
      profileUpdated,
      positionsImported,
      educationImported,
      skillsImported,
      matchedExistingProfiles,
      source: "linkedin_export",
    });

    const summary = {
      success: true,
      connectionsImported,
      messagesImported,
      profileUpdated,
      positionsImported,
      educationImported,
      skillsImported,
      matchedExistingProfiles,
    };

    console.log("[import-linkedin] Import complete:", summary);
    return jsonResponse(summary);
  } catch (err) {
    console.error("[import-linkedin] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(message, 500);
  }
});
