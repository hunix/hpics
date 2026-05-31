import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthenticationCreds,
  SignalKeyStoreWithTransaction,
  SignalDataTypeMap,
  SignalDataSet,
} from "@whiskeysockets/baileys";
import { config } from "./config.js";

// ---- Supabase client -------------------------------------------------------

export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: { persistSession: false },
  },
);

// ---- Auth state types -------------------------------------------------------

export interface AuthState {
  creds: AuthenticationCreds;
  // keys is serialised as a plain object; Baileys will reconstruct it.
  keys: Record<string, unknown>;
}

// ---- Session persistence ---------------------------------------------------

/**
 * Load a serialised Baileys auth state from the `whatsapp_bridge_sessions`
 * table.  Returns null if no session exists yet.
 */
export async function loadSession(sessionId: string): Promise<AuthState | null> {
  const { data, error } = await supabase
    .from("whatsapp_bridge_sessions")
    .select("creds, keys")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`loadSession failed: ${error.message}`);
  }

  if (!data) return null;

  return {
    creds: data.creds as AuthenticationCreds,
    keys: (data.keys ?? {}) as Record<string, unknown>,
  };
}

/**
 * Upsert the auth state for a session.
 */
export async function saveSession(
  sessionId: string,
  state: AuthState,
): Promise<void> {
  const { error } = await supabase.from("whatsapp_bridge_sessions").upsert(
    {
      session_id: sessionId,
      creds: state.creds,
      keys: state.keys,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  if (error) {
    throw new Error(`saveSession failed: ${error.message}`);
  }
}

/**
 * Delete a stored session (used on logout).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_bridge_sessions")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`deleteSession failed: ${error.message}`);
  }
}

// ---- Message persistence ---------------------------------------------------

type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "sticker"
  | "reaction"
  | "other";

export interface NormalisedMessage {
  id: string;
  session_id: string;
  chat_jid: string;
  chat_name: string | null;
  sender_jid: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  message_type: MessageType;
  body: string | null;
  media_url: string | null;
  timestamp_ms: number;
  is_from_me: boolean;
  is_group: boolean;
  raw_payload: unknown;
  synced_at: string;
}

export async function upsertMessage(
  msg: NormalisedMessage,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_personal_messages")
    .upsert(msg, { onConflict: "id,session_id" });

  if (error) {
    throw new Error(`upsertMessage failed for ${msg.id}: ${error.message}`);
  }
}

// ---- Contact persistence ---------------------------------------------------

export interface NormalisedContact {
  jid: string;
  session_id: string;
  name: string | null;
  phone_number: string | null;
  is_business: boolean;
  profile_photo_url: string | null;
  last_seen_at: string | null;
  status_text: string | null;
}

export async function upsertContact(contact: NormalisedContact): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_personal_contacts")
    .upsert(contact, { onConflict: "jid,session_id" });

  if (error) {
    throw new Error(`upsertContact failed for ${contact.jid}: ${error.message}`);
  }
}

// ---- Supabase-backed key store for Baileys ---------------------------------

/**
 * Build a Baileys-compatible `SignalKeyStore` that persists keys inside the
 * `keys` JSONB column of `whatsapp_bridge_sessions` instead of writing to
 * the filesystem.
 *
 * Baileys serialises keys as:
 *   keys[type][id] = value
 *
 * We hold an in-memory cache of the full key map and flush it to Supabase
 * whenever keys change (debounced).
 */
export function buildKeyStore(
  // sessionId is retained in the signature so callers can pass it for clarity,
  // even though the flush callback captures the session context externally.
  _sessionId: string,
  initialKeys: Record<string, Record<string, unknown>>,
  onKeysChanged: (keys: Record<string, Record<string, unknown>>) => void,
): SignalKeyStoreWithTransaction {
  // Deep-clone so we own the reference.
  const keyMap: Record<string, Record<string, unknown>> = JSON.parse(
    JSON.stringify(initialKeys),
  );

  let inTxn = false;
  let dirtyInTxn = false;

  const store: SignalKeyStoreWithTransaction = {
    get<T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ): { [id: string]: SignalDataTypeMap[T] } {
      const bucket = (keyMap[type] ?? {}) as Record<string, SignalDataTypeMap[T]>;
      const result: { [id: string]: SignalDataTypeMap[T] } = {};
      for (const id of ids) {
        if (id in bucket) result[id] = bucket[id];
      }
      return result;
    },

    set(data: SignalDataSet): void {
      for (const [type, entries] of Object.entries(data)) {
        if (!entries) continue;
        if (!keyMap[type]) keyMap[type] = {};
        for (const [id, value] of Object.entries(entries)) {
          if (value == null) {
            delete keyMap[type][id];
          } else {
            keyMap[type][id] = value;
          }
        }
      }
      if (inTxn) {
        dirtyInTxn = true;
      } else {
        onKeysChanged(keyMap);
      }
    },

    isInTransaction(): boolean {
      return inTxn;
    },

    async transaction<T>(exec: () => Promise<T>): Promise<T> {
      inTxn = true;
      dirtyInTxn = false;
      try {
        const result = await exec();
        return result;
      } finally {
        inTxn = false;
        if (dirtyInTxn) {
          onKeysChanged(keyMap);
        }
        dirtyInTxn = false;
      }
    },
  };

  return store;
}
