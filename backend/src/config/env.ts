import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  ASGARDEO_JWKS_URL: z.string().url().default("https://api.asgardeo.io/t/orgsacma/oauth2/jwks"),
  ASGARDEO_ISSUER: z.string().min(1).default("https://api.asgardeo.io/t/orgsacma/oauth2/token"),

  ENCRYPTION_KEY: z.string().min(1).default("jobmatch_ai_encryption_key_32bytes!!"),
  FRONTEND_URL: z.string().min(1).default("https://frontend-nine-omega-72.vercel.app"),

  R2_ENDPOINT: z.string().default("https://dummy.r2.cloudflarestorage.com"),
  R2_ACCESS_KEY_ID: z.string().default("dummy_access_key"),
  R2_SECRET_ACCESS_KEY: z.string().default("dummy_secret_key"),
  R2_BUCKET_NAME: z.string().default("jobmatch-resumes"),
  R2_PUBLIC_URL: z.string().default("https://pub-dummy.r2.dev"),

  RESEND_API_KEY: z.string().default("re_dummy_key"),
  RESEND_FROM_EMAIL: z.string().default("onboarding@resend.dev"),

  GEMINI_API_KEY: z.string().default("dummy_gemini_key"),

  PORT: z.coerce.number().int().positive().default(8080),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(
      `\nMissing or invalid environment variables:\n${issues}\n\nCheck backend/.env against backend/.env.example.\n`,
    );
    process.exit(1);
  }

  return result.data;
}
