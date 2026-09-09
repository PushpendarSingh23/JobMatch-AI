import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import logger from "../utils/logger";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  logger.warn("[db] WARNING: DATABASE_URL environment variable is undefined.");
}

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  logger.warn("[pg pool] idle client error (connection dropped):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
