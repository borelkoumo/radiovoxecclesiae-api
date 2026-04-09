import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().default("*"),
  // Rate limits (requests per minute per IP)
  RATE_LIMIT_GENERAL: z.coerce.number().int().min(1).default(60),
  RATE_LIMIT_PRAYER_WRITE: z.coerce.number().int().min(1).default(20),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  // Render stores private keys with literal \n — replace before use
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  // Named database ID — use "(default)" for the default Firestore database
  FIREBASE_DATABASE_ID: z.string().min(1).default("(default)"),
  // Public base URL — priority: API_BASE_URL > RENDER_EXTERNAL_URL > localhost fallback
  API_BASE_URL: z.string().url().default(
    process.env["API_BASE_URL"] ?? process.env["RENDER_EXTERNAL_URL"] ?? "http://localhost:3000"
  ),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;
