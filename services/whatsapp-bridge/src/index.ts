import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import pino from "pino";
import { config } from "./config.js";
import { deleteSession } from "./supabase.js";
import { WABridge } from "./whatsapp.js";

const logger = pino({
  level: "info",
  transport: { target: "pino-pretty", options: { colorize: true } },
});

// ---- Bootstrap bridge ------------------------------------------------------

const bridge = new WABridge();

// ---- Auth middleware --------------------------------------------------------

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = req.query["secret"] as string | undefined;

  if (
    (bearerToken && bearerToken === config.authSecret) ||
    (querySecret && querySecret === config.authSecret)
  ) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <AUTH_SECRET> or ?secret=<AUTH_SECRET>" });
}

// ---- Express app -----------------------------------------------------------

const app = express();
app.disable("x-powered-by");
app.use(express.json());

/**
 * GET /health
 * Public endpoint — no auth required.
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    qrStatus: bridge.status,
    sessionId: config.waSessionId,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /qr
 * Returns the current QR code as a data-URL string (or a status message if
 * already connected).
 */
app.get("/qr", requireAuth, (_req: Request, res: Response) => {
  void (async () => {
    if (bridge.status === "connected") {
      res.json({ status: "connected", message: "Already authenticated" });
      return;
    }

    if (!bridge.qrCode) {
      res.json({
        status: bridge.status,
        message: "QR code not yet available — the bridge is still initialising. Try again in a few seconds.",
        qrCode: null,
      });
      return;
    }

    res.json({ status: bridge.status, qrCode: bridge.qrCode });
  })();
});

/**
 * GET /qr/image
 * Returns the QR code as a raw PNG image — easy to scan directly in a browser.
 */
app.get("/qr/image", requireAuth, (_req: Request, res: Response) => {
  void (async () => {
    if (bridge.status === "connected") {
      res.status(200).type("text/plain").send("Already authenticated — no QR needed.");
      return;
    }

    if (!bridge.qrCode) {
      res.status(503).json({
        status: bridge.status,
        message: "QR code not yet available — try again in a few seconds.",
      });
      return;
    }

    // bridge.qrCode is already a data-URL ("data:image/png;base64,…") produced
    // by QRCode.toDataURL().  We need to strip the prefix to get the raw buffer.
    const dataUrlPrefix = "data:image/png;base64,";
    if (bridge.qrCode.startsWith(dataUrlPrefix)) {
      const base64 = bridge.qrCode.slice(dataUrlPrefix.length);
      const buf = Buffer.from(base64, "base64");
      res.status(200).type("image/png").send(buf);
      return;
    }

    // Fallback: re-generate from the raw QR string (shouldn't normally happen).
    try {
      const buf = await QRCode.toBuffer(bridge.qrCode, { scale: 8 });
      res.status(200).type("image/png").send(buf);
    } catch (err) {
      logger.error({ err }, "Failed to render QR code as PNG");
      res.status(500).json({ error: "QR code render failed" });
    }
  })();
});

/**
 * POST /disconnect
 * Stops the bridge and purges the stored session, forcing a fresh QR scan on
 * the next start.
 */
app.post("/disconnect", requireAuth, (_req: Request, res: Response) => {
  void (async () => {
    try {
      bridge.stop();
      await deleteSession(config.waSessionId);
      res.json({ status: "disconnected", message: "Session cleared — restart to get a new QR code." });
    } catch (err) {
      logger.error({ err }, "Disconnect failed");
      res.status(500).json({ error: "Disconnect failed", detail: String(err) });
    }
  })();
});

// ---- Start -----------------------------------------------------------------

async function main(): Promise<void> {
  logger.info({ sessionId: config.waSessionId }, "Starting WhatsApp bridge");

  // Start Baileys in the background — don't await so the HTTP server comes up
  // immediately and we can serve the /qr endpoint while connecting.
  bridge.start().catch((err) => {
    logger.error({ err }, "WABridge.start() threw — bridge will not be running");
  });

  await new Promise<void>((resolve) => {
    app.listen(config.port, () => {
      logger.info(
        { port: config.port },
        `HTTP server listening — visit http://localhost:${config.port}/qr/image?secret=<AUTH_SECRET> to scan QR`,
      );
      resolve();
    });
  });
}

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info({ signal }, "Received shutdown signal");
  bridge.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
