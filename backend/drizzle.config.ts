import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const rawDbUrl = process.env.DATABASE_URL;

if (!rawDbUrl) {
  throw new Error(
    "[drizzle-kit] DATABASE_URL environment variable is missing or undefined. Ensure DATABASE_URL is set in Render environment variables or backend/.env file.",
  );
}

const dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "").trim();

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
