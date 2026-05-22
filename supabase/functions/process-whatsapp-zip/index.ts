import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - JSZip works in Deno
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitializeRequest {
  action: "initialize";
  profileId: string;
  fileName: string;
  fileSize: number;
  contactName: string;
}

interface UploadCompleteRequest {
  action: "upload_complete";
  sessionId: string;
}

interface ProcessRequest {
  action: "process";
  sessionId: string;
}

interface StatusRequest {
  action: "status";
  sessionId: string;
}

type RequestBody = InitializeRequest | UploadCompleteRequest | ProcessRequest | StatusRequest;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = SupabaseClient<any, any, any>;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();

    // Route to appropriate handler
    switch (body.action) {
      case "initialize":
        return await handleInitialize(supabase, user.id, body);
      
      case "upload_complete":
        return await handleUploadComplete(supabase, user.id, body);
      
      case "process":
        return await handleProcess(supabase, user.id, body);
      
      case "status":
        return await handleStatus(supabase, user.id, body);
      
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error: unknown) {
    console.error("Error in process-whatsapp-zip:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Initialize a new server-side processing session
 */
async function handleInitialize(
  supabase: SupabaseClientType,
  userId: string,
  body: InitializeRequest
) {
  const { profileId, fileName, fileSize, contactName } = body;

  // Create session record
  const { data: session, error } = await supabase
    .from("whatsapp_import_sessions")
    .insert({
      user_id: userId,
      profile_id: profileId,
      file_name: fileName,
      file_size: fileSize,
      status: "uploading_zip",
      processing_mode: "server",
      metadata: { contactName },
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create session", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate presigned upload URL for the temp bucket
  const storagePath = `${userId}/${session.id}/${fileName}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("whatsapp-imports-temp")
    .createSignedUploadUrl(storagePath);

  if (uploadError) {
    // Clean up session
    await supabase.from("whatsapp_import_sessions").delete().eq("id", session.id);
    
    return new Response(
      JSON.stringify({ error: "Failed to create upload URL", details: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      uploadUrl: uploadData.signedUrl,
      storagePath,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Called after the ZIP has been uploaded to temp storage
 */
async function handleUploadComplete(
  supabase: SupabaseClientType,
  userId: string,
  body: UploadCompleteRequest
) {
  const { sessionId } = body;

  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("whatsapp_import_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update status to extracting
  await supabase
    .from("whatsapp_import_sessions")
    .update({ status: "extracting" })
    .eq("id", sessionId);

  // Start processing immediately (synchronous for now)
  // In production, you might want to use a background job queue
  const result = await processZipFile(supabase, userId, session);

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Process the uploaded ZIP file
 */
async function handleProcess(
  supabase: SupabaseClientType,
  userId: string,
  body: ProcessRequest
) {
  const { sessionId } = body;

  // Verify session
  const { data: session, error } = await supabase
    .from("whatsapp_import_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !session) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = await processZipFile(supabase, userId, session);
  
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Get the current status of a processing session
 */
async function handleStatus(
  supabase: SupabaseClientType,
  userId: string,
  body: StatusRequest
) {
  const { sessionId } = body;

  const { data: session, error } = await supabase
    .from("whatsapp_import_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !session) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      status: session.status,
      totalMessages: session.total_messages || 0,
      messagesImported: session.messages_imported || 0,
      totalMediaFiles: session.total_media_files || 0,
      mediaUploaded: session.media_uploaded || 0,
      errorMessage: session.error_message,
      progress: calculateProgress(session),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

interface SessionRecord {
  id: string;
  user_id: string;
  profile_id: string;
  file_name: string;
  file_size: number;
  status: string;
  total_messages?: number;
  messages_imported?: number;
  total_media_files?: number;
  media_uploaded?: number;
  error_message?: string;
  processing_mode?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main ZIP processing logic - extracts and uploads files one at a time
 */
async function processZipFile(
  supabase: SupabaseClientType,
  userId: string,
  session: SessionRecord
) {
  const sessionId = session.id;
  const profileId = session.profile_id;
  const fileName = session.file_name;
  const metadata = session.metadata || {};
  const contactName = (metadata.contactName as string) || "Contact";

  try {
    // Download ZIP from temp storage
    const storagePath = `${userId}/${sessionId}/${fileName}`;
    const { data: zipData, error: downloadError } = await supabase.storage
      .from("whatsapp-imports-temp")
      .download(storagePath);

    if (downloadError || !zipData) {
      throw new Error(`Failed to download ZIP: ${downloadError?.message}`);
    }

    // Parse ZIP
    const arrayBuffer = await zipData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find chat text file
    let chatText = "";
    const mediaFiles: Array<{ name: string; blob: Blob; type: string }> = [];

    for (const [path, file] of Object.entries(zip.files)) {
      const zipEntry = file as JSZip.JSZipObject;
      if (zipEntry.dir) continue;

      const entryFileName = path.split("/").pop() || path;
      
      if (entryFileName.endsWith(".txt") && entryFileName.toLowerCase().includes("chat")) {
        chatText = await zipEntry.async("string");
      } else if (isMediaFile(entryFileName)) {
        // Process media files one at a time to minimize memory
        const blob = await zipEntry.async("blob");
        mediaFiles.push({
          name: entryFileName,
          blob,
          type: getMediaType(entryFileName),
        });
      }
    }

    // Update session with totals
    await supabase
      .from("whatsapp_import_sessions")
      .update({
        total_media_files: mediaFiles.length,
        status: "uploading_media",
      })
      .eq("id", sessionId);

    // Parse messages
    const messages = parseWhatsAppMessages(chatText, contactName);
    
    await supabase
      .from("whatsapp_import_sessions")
      .update({ total_messages: messages.length })
      .eq("id", sessionId);

    // Create or find conversation
    let conversationId: string;
    
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_id", profileId)
      .eq("platform", "whatsapp")
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          profile_id: profileId,
          platform: "whatsapp",
          title: `WhatsApp with ${contactName}`,
          started_at: messages[0]?.date || new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;
      conversationId = newConv.id;
    }

    // Upload media files one at a time
    const mediaIdMap = new Map<string, string>();
    let mediaUploaded = 0;

    for (const media of mediaFiles) {
      try {
        const mediaPath = `${userId}/${profileId}/${Date.now()}_${media.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(mediaPath, media.blob, {
            contentType: getMimeType(media.name),
            upsert: false,
          });

        if (uploadError) {
          console.error(`Failed to upload ${media.name}:`, uploadError);
          continue;
        }

        // Create media record
        const { data: publicUrl } = supabase.storage
          .from("media")
          .getPublicUrl(mediaPath);

        const { data: mediaRecord, error: mediaError } = await supabase
          .from("media")
          .insert({
            user_id: userId,
            profile_id: profileId,
            conversation_id: conversationId,
            storage_path: mediaPath,
            url: publicUrl.publicUrl,
            type: media.type,
            filename: media.name,
            file_size: media.blob.size,
            mime_type: getMimeType(media.name),
            source: "whatsapp",
          })
          .select()
          .single();

        if (!mediaError && mediaRecord) {
          mediaIdMap.set(media.name.toLowerCase(), mediaRecord.id);
        }

        mediaUploaded++;
        
        // Update progress
        await supabase
          .from("whatsapp_import_sessions")
          .update({ media_uploaded: mediaUploaded })
          .eq("id", sessionId);

      } catch (err) {
        console.error(`Error processing ${media.name}:`, err);
      }
    }

    // Update status
    await supabase
      .from("whatsapp_import_sessions")
      .update({ status: "importing_messages" })
      .eq("id", sessionId);

    // Insert messages in batches
    const batchSize = 100;
    let messagesImported = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize).map((msg) => ({
        user_id: userId,
        conversation_id: conversationId,
        content: msg.content,
        is_from_contact: msg.isFromContact,
        sent_at: msg.date,
        media_id: msg.mediaFilename ? mediaIdMap.get(msg.mediaFilename.toLowerCase()) || null : null,
        media_type: msg.mediaType || null,
        media_filename: msg.mediaFilename || null,
      }));

      const { error: insertError } = await supabase.from("messages").insert(batch);
      
      if (insertError) {
        console.error("Failed to insert message batch:", insertError);
      } else {
        messagesImported += batch.length;
      }

      await supabase
        .from("whatsapp_import_sessions")
        .update({ messages_imported: messagesImported })
        .eq("id", sessionId);
    }

    // Update conversation counts
    await supabase
      .from("conversations")
      .update({
        message_count: messagesImported,
        last_message_at: messages[messages.length - 1]?.date,
      })
      .eq("id", conversationId);

    // Mark session as completed
    await supabase
      .from("whatsapp_import_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    // Clean up temp file
    await supabase.storage
      .from("whatsapp-imports-temp")
      .remove([storagePath]);

    return {
      success: true,
      sessionId,
      messagesImported,
      mediaUploaded,
      conversationId,
    };

  } catch (error: unknown) {
    console.error("Processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Processing failed";
    
    await supabase
      .from("whatsapp_import_sessions")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", sessionId);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Parse WhatsApp chat text into messages
 */
function parseWhatsAppMessages(
  text: string, 
  contactName: string
): Array<{
  date: string;
  content: string;
  isFromContact: boolean;
  mediaFilename?: string;
  mediaType?: string;
}> {
  const messages: Array<{
    date: string;
    content: string;
    isFromContact: boolean;
    mediaFilename?: string;
    mediaType?: string;
  }> = [];

  const patterns = [
    /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)/gi,
    /(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [, dateStr, timeStr, sender, content] = match;

      // Skip system messages
      if (content.includes("Messages and calls are end-to-end encrypted") ||
          content.includes("created group") ||
          content.includes("added you") ||
          content.includes("changed the subject")) {
        continue;
      }

      try {
        const dateParts = dateStr.split("/").map(Number);
        let year = dateParts[2];
        if (year < 100) year += 2000;

        let date = new Date(year, dateParts[1] - 1, dateParts[0]);
        if (isNaN(date.getTime())) {
          date = new Date(year, dateParts[0] - 1, dateParts[1]);
        }

        const timeParts = timeStr.match(/(\d+):(\d+)(?::(\d+))?(?:\s*([AP]M))?/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const seconds = parseInt(timeParts[3] || "0");
          const ampm = timeParts[4]?.toUpperCase();

          if (ampm === "PM" && hours !== 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;

          date.setHours(hours, minutes, seconds);
        }

        const isFromContact = sender.toLowerCase().trim() === contactName.toLowerCase().trim();
        
        // Extract media reference
        const mediaMatch = content.match(/<attached:\s*([^>]+)>/i) ||
                          content.match(/([^\s]+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mp3|wav|ogg|m4a|opus|pdf|doc|docx))/i);
        
        let mediaFilename: string | undefined;
        let mediaType: string | undefined;
        let cleanContent = content.trim();

        if (mediaMatch) {
          mediaFilename = mediaMatch[1];
          mediaType = getMediaType(mediaFilename);
          cleanContent = content.replace(/<attached:\s*[^>]+>/gi, "").trim();
        }

        messages.push({
          date: date.toISOString(),
          content: cleanContent || "(media)",
          isFromContact,
          mediaFilename,
          mediaType,
        });
      } catch {
        // Skip malformed messages
      }
    }
    if (messages.length > 0) break;
  }

  return messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function isMediaFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mediaExtensions = [
    "jpg", "jpeg", "png", "gif", "webp", "heic", "heif",
    "mp4", "mov", "avi", "mkv", "webm", "3gp",
    "mp3", "wav", "ogg", "m4a", "opus", "aac",
    "pdf", "doc", "docx",
  ];
  return mediaExtensions.includes(ext);
}

function getMediaType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(ext)) {
    return "image";
  }
  if (["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(ext)) {
    return "video";
  }
  if (["mp3", "wav", "ogg", "m4a", "opus", "aac"].includes(ext)) {
    return "audio";
  }
  if (["pdf", "doc", "docx"].includes(ext)) {
    return "document";
  }
  return "document";
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    opus: "audio/opus",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function calculateProgress(session: SessionRecord): number {
  const status = session.status;
  const totalMessages = session.total_messages || 0;
  const messagesImported = session.messages_imported || 0;
  const totalMedia = session.total_media_files || 0;
  const mediaUploaded = session.media_uploaded || 0;

  if (status === "completed") return 100;
  if (status === "failed") return 0;
  if (status === "uploading_zip") return 5;
  if (status === "extracting") return 10;

  if (status === "uploading_media" && totalMedia > 0) {
    return 10 + (mediaUploaded / totalMedia) * 50;
  }

  if (status === "importing_messages" && totalMessages > 0) {
    return 60 + (messagesImported / totalMessages) * 40;
  }

  return 0;
}
