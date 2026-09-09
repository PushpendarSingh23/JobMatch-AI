import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import logger from "../utils/logger";

const rawDbUrl = process.env.DATABASE_URL;

if (!rawDbUrl) {
  logger.warn("[db] WARNING: DATABASE_URL environment variable is undefined.");
}

const dbUrl = rawDbUrl ? rawDbUrl.trim().replace(/^["']|["']$/g, "").trim() : "";
const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  logger.warn("[pg pool] idle client error (connection dropped):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
