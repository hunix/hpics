# WhatsApp Personal Bridge

Bridges your **personal** WhatsApp account to Supabase by acting as a WhatsApp
Web client via the [Baileys](https://github.com/WhiskeySockets/Baileys) library.
Scan a QR code once; all messages and contacts then flow continuously into the
`whatsapp_personal_messages` and `whatsapp_personal_contacts` tables.

> **Note:** This uses the unofficial WhatsApp Web multi-device protocol.  It is
> not affiliated with or endorsed by Meta/WhatsApp.  Use at your own risk and
> only with an account you personally own.

---

## Setup

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and AUTH_SECRET
npm install
```

Apply the database migration (once):

```bash
# From the repo root
supabase db push
# or
supabase migration up
```

---

## Running locally (development)

```bash
npm run dev
```

The service starts on `http://localhost:3001` (or the `PORT` you set).

### First-time QR pairing

1. Open **`http://localhost:3001/qr/image?secret=<YOUR_AUTH_SECRET>`** in a
   browser.
2. On your phone, open WhatsApp → **Linked Devices** → **Link a Device**.
3. Scan the QR code shown in the browser.
4. The bridge will log `WhatsApp connection established` and begin syncing.

Session credentials are stored in Supabase (`whatsapp_bridge_sessions`) so
subsequent restarts reconnect automatically — no re-scan needed unless you
explicitly log out.

---

## HTTP endpoints

| Method | Path           | Auth required | Description                                                    |
|--------|----------------|---------------|----------------------------------------------------------------|
| GET    | `/health`      | No            | Returns `{ status, qrStatus, sessionId }`                     |
| GET    | `/qr`          | Yes           | Returns `{ status, qrCode }` (data-URL) or connected message  |
| GET    | `/qr/image`    | Yes           | Returns the QR code as a PNG image (browser-friendly)         |
| POST   | `/disconnect`  | Yes           | Stops the bridge and purges the stored session                 |

**Authentication:** pass the `AUTH_SECRET` either as:
- `Authorization: Bearer <AUTH_SECRET>` header, or
- `?secret=<AUTH_SECRET>` query parameter.

---

## Production / Docker

```bash
docker build -t wa-bridge .
docker run --env-file .env -p 3001:3001 wa-bridge
```

The container runs `node dist/index.js` (compiled TypeScript).

---

## Environment variables

| Variable                  | Required | Default   | Description                                          |
|---------------------------|----------|-----------|------------------------------------------------------|
| `SUPABASE_URL`            | Yes      | —         | Your Supabase project URL                            |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes    | —         | Service role key (bypasses RLS)                      |
| `WA_SESSION_ID`           | No       | `default` | Logical name for this session (supports multi-user)  |
| `PORT`                    | No       | `3001`    | HTTP port to listen on                               |
| `AUTH_SECRET`             | Yes      | —         | Secret token protecting /qr and /disconnect          |

---

## Database tables

| Table                          | Purpose                                              |
|--------------------------------|------------------------------------------------------|
| `whatsapp_bridge_sessions`     | Baileys auth state (creds + Signal keys) — JSONB     |
| `whatsapp_personal_messages`   | All bridged messages with metadata                   |
| `whatsapp_personal_contacts`   | Contacts synced from WhatsApp                        |

All three tables have RLS enabled; only service-role connections can read/write
them (the bridge uses the service role key).
