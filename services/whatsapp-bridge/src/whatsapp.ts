import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidGroup,
  jidNormalizedUser,
  type WAMessage,
  type ConnectionState,
  type BaileysEventMap,
  type AuthenticationCreds,
  type SignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import {
  loadSession,
  saveSession,
  deleteSession,
  buildKeyStore,
  upsertMessage,
  upsertContact,
  type AuthState,
  type NormalisedMessage,
  type NormalisedContact,
} from "./supabase.js";
import { config } from "./config.js";

const logger = pino({ level: "warn" });

export type BridgeStatus =
  | "waiting_qr"
  | "connecting"
  | "connected"
  | "disconnected";

// ---- helpers ---------------------------------------------------------------

/** Extract phone number from a JID like 447911123456@s.whatsapp.net */
function jidToPhone(jid: string | null | undefined): string | null {
  if (!jid) return null;
  return jid.split("@")[0] ?? null;
}

/** Determine the human-readable message type from a WAMessage. */
function getMessageType(
  msg: WAMessage,
): NormalisedMessage["message_type"] {
  const m = msg.message;
  if (!m) return "other";
  if (m.conversation || m.extendedTextMessage) return "text";
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.audioMessage) return "audio";
  if (m.documentMessage) return "doc";
  if (m.stickerMessage) return "sticker";
  if (m.reactionMessage) return "reaction";
  return "other";
}

/** Extract text body from a WAMessage. */
function getMessageBody(msg: WAMessage): string | null {
  const m = msg.message;
  if (!m) return null;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    m.documentMessage?.caption ??
    m.stickerMessage?.url ??      // no text for stickers, just url if present
    null
  );
}

/** Extract a media URL hint (no download — just metadata capture). */
function getMediaUrl(msg: WAMessage): string | null {
  const m = msg.message;
  if (!m) return null;
  return (
    m.imageMessage?.url ??
    m.videoMessage?.url ??
    m.audioMessage?.url ??
    m.documentMessage?.url ??
    m.stickerMessage?.url ??
    null
  );
}

// ---- WABridge class --------------------------------------------------------

export class WABridge {
  public qrCode: string | null = null;
  public status: BridgeStatus = "disconnected";

  private socket: ReturnType<typeof makeWASocket> | null = null;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- public API ----------------------------------------------------------

  async start(): Promise<void> {
    this.shouldReconnect = true;
    await this.connect();
  }

  stop(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }
    this.status = "disconnected";
    this.qrCode = null;
  }

  // ---- internal ------------------------------------------------------------

  private async connect(): Promise<void> {
    try {
      const { version } = await fetchLatestBaileysVersion();
      logger.info({ version }, "Baileys version resolved");

      // Load persisted session from Supabase (or start fresh).
      const storedSession = await loadSession(config.waSessionId);

      // We keep a mutable reference to creds so creds.update can patch it.
      let creds: AuthenticationCreds | undefined = storedSession?.creds;
      const initialKeys = (storedSession?.keys ?? {}) as Record<
        string,
        Record<string, unknown>
      >;

      // Callback used by the key store whenever keys change — schedule a
      // debounced save so we don't hammer Supabase on every decrypt.
      let saveTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleSave = (keys: Record<string, Record<string, unknown>>) => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          if (!creds) return;
          saveSession(config.waSessionId, {
            creds,
            keys,
          } as AuthState).catch((err) =>
            logger.error({ err }, "Failed to save session after key change"),
          );
        }, 500);
      };

      const keyStore = buildKeyStore(
        config.waSessionId,
        initialKeys,
        scheduleSave,
      );

      // Build auth object for Baileys.
      // If no creds yet, initAuthCreds() is called on first connect inside
      // Baileys — we'll receive a creds.update event with the new creds.
      const authState = {
        creds: creds as AuthenticationCreds,
        keys: makeCacheableSignalKeyStore(keyStore as SignalKeyStore, logger),
      };

      this.status = creds ? "connecting" : "waiting_qr";
      this.qrCode = null;

      const sock = makeWASocket({
        version,
        auth: authState,
        printQRInTerminal: false,
        logger,
        browser: ["HPICS", "Chrome", "120.0.0"],
        syncFullHistory: true,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
        getMessage: async () => undefined, // suppress retry fetch
      });

      this.socket = sock;

      // ---- connection.update -----------------------------------------------
      sock.ev.on(
        "connection.update",
        async (update: Partial<ConnectionState>) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            this.status = "waiting_qr";
            try {
              // Convert the raw QR string to a data-URL PNG for the HTTP endpoint.
              this.qrCode = await QRCode.toDataURL(qr, { scale: 8 });
              logger.info("QR code generated — visit /qr/image to scan");
            } catch (err) {
              logger.error({ err }, "QR code generation failed");
            }
          }

          if (connection === "open") {
            this.status = "connected";
            this.qrCode = null;
            logger.info("WhatsApp connection established");

            // Persist creds immediately on successful open.
            if (creds) {
              await saveSession(config.waSessionId, {
                creds,
                keys: initialKeys,
              } as AuthState).catch((err) =>
                logger.error({ err }, "Failed to save session on connect"),
              );
            }
          }

          if (connection === "close") {
            this.status = "disconnected";
            this.qrCode = null;
            const statusCode = (lastDisconnect?.error as Boom)?.output
              ?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;

            logger.warn(
              { statusCode, loggedOut },
              "WhatsApp connection closed",
            );

            if (loggedOut) {
              // Session is no longer valid — purge it and wait for a new QR.
              logger.warn("Logged out — clearing session");
              await deleteSession(config.waSessionId).catch((err) =>
                logger.error({ err }, "Failed to delete session on logout"),
              );
              creds = undefined;
              this.status = "waiting_qr";
            }

            if (this.shouldReconnect) {
              const delay = loggedOut ? 1000 : 5000;
              logger.info({ delay }, "Scheduling reconnect");
              this.reconnectTimer = setTimeout(
                () => this.connect(),
                delay,
              );
            }
          }
        },
      );

      // ---- creds.update ----------------------------------------------------
      sock.ev.on("creds.update", async (update) => {
        // Merge the partial update into our local creds reference.
        creds = { ...(creds ?? ({} as AuthenticationCreds)), ...update };
        await saveSession(config.waSessionId, {
          creds,
          keys: initialKeys,
        } as AuthState).catch((err) =>
          logger.error({ err }, "Failed to save creds update"),
        );
      });

      // ---- messages.upsert -------------------------------------------------
      sock.ev.on(
        "messages.upsert",
        async (event: BaileysEventMap["messages.upsert"]) => {
          const messages = event.messages.slice(0, 100); // cap per-batch
          const tasks = messages.map((msg) =>
            this.processMessage(msg).catch((err) =>
              logger.error(
                { err, msgId: msg.key.id },
                "Failed to process message",
              ),
            ),
          );
          await Promise.all(tasks);
        },
      );

      // ---- contacts.upsert -------------------------------------------------
      sock.ev.on(
        "contacts.upsert",
        async (contacts: BaileysEventMap["contacts.upsert"]) => {
          const tasks = contacts.map((c) =>
            this.processContact(c).catch((err) =>
              logger.error(
                { err, jid: c.id },
                "Failed to upsert contact",
              ),
            ),
          );
          await Promise.all(tasks);
        },
      );

      // ---- contacts.update -------------------------------------------------
      sock.ev.on(
        "contacts.update",
        async (updates: BaileysEventMap["contacts.update"]) => {
          const tasks = updates.map((c) =>
            this.processContact(c as Parameters<typeof this.processContact>[0]).catch(
              (err) =>
                logger.error(
                  { err, jid: c.id },
                  "Failed to update contact",
                ),
            ),
          );
          await Promise.all(tasks);
        },
      );
    } catch (err) {
      logger.error({ err }, "connect() threw unexpectedly");
      this.status = "disconnected";
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 10_000);
      }
    }
  }

  // ---- message normalisation -----------------------------------------------

  private async processMessage(msg: WAMessage): Promise<void> {
    const key = msg.key;
    if (!key?.id || !key.remoteJid) return;

    const chatJid = key.remoteJid;
    const isGroup = isJidGroup(chatJid);
    const senderJid = isGroup
      ? (key.participant ?? msg.participant ?? null)
      : key.fromMe
        ? (this.socket?.user?.id ?? null)
        : chatJid;

    const normalisedSenderJid = senderJid ? jidNormalizedUser(senderJid) : null;
    const senderPhone = jidToPhone(normalisedSenderJid);

    const pushName: string | null =
      (msg as unknown as { pushName?: string }).pushName ?? null;

    const timestampMs =
      typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp * 1000
        : typeof msg.messageTimestamp === "bigint"
          ? Number(msg.messageTimestamp) * 1000
          : Date.now();

    const row: NormalisedMessage = {
      id: key.id,
      session_id: config.waSessionId,
      chat_jid: chatJid,
      chat_name: null, // populated by contacts.upsert separately
      sender_jid: normalisedSenderJid,
      sender_name: pushName,
      sender_phone: senderPhone,
      message_type: getMessageType(msg),
      body: getMessageBody(msg),
      media_url: getMediaUrl(msg),
      timestamp_ms: timestampMs,
      is_from_me: key.fromMe === true,
      is_group: isGroup === true,
      raw_payload: msg,
      synced_at: new Date().toISOString(),
    };

    await upsertMessage(row);
  }

  // ---- contact normalisation -----------------------------------------------

  private async processContact(contact: {
    id?: string;
    name?: string | null;
    notify?: string | null;
    verifiedName?: string | null;
    imgUrl?: string | null;
    status?: string | null;
  }): Promise<void> {
    if (!contact.id) return;

    const jid = jidNormalizedUser(contact.id);
    const phone = jidToPhone(jid);
    const name =
      contact.name ??
      contact.verifiedName ??
      contact.notify ??
      null;

    const row: NormalisedContact = {
      jid,
      session_id: config.waSessionId,
      name,
      phone_number: phone,
      is_business: !!contact.verifiedName,
      profile_photo_url: contact.imgUrl ?? null,
      last_seen_at: null,
      status_text: contact.status ?? null,
    };

    await upsertContact(row);
  }
}
