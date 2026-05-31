import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill in all values.`,
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

// Validate required vars eagerly so the process fails fast with a clear message.
export const config = {
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  waSessionId: optionalEnv("WA_SESSION_ID", "default"),
  port: parseInt(optionalEnv("PORT", "3001"), 10),
  authSecret: requireEnv("AUTH_SECRET"),
} as const;
