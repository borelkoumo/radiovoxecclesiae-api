import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().default("*"),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  // Render stores private keys with literal \n — replace before use
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  // Named database ID — use "(default)" for the default Firestore database
  FIREBASE_DATABASE_ID: z.string().min(1).default("(default)"),
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
