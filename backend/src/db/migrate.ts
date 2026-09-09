import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigration() {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl) {
    console.error("[migrate] FATAL ERROR: DATABASE_URL is missing or undefined.");
    process.exit(1);
  }

  const dbUrl = rawDbUrl.trim().replace(/^["']|["']$/g, "").trim();

  console.log("[migrate] Starting database migration using Drizzle migrator...");

  // Safe diagnostic output (NO secrets/credentials/hosts exposed)
  const hasWhitespace = /\s/.test(rawDbUrl);
  const hasQuotes = /^["'].*["']$/.test(rawDbUrl.trim());
  let protocol: string | null = null;
  let hasHost = false;
  let hasPath = false;
  let isValid = false;

  try {
    const u = new URL(dbUrl);
    protocol = u.protocol.replace(":", "");
    hasHost = Boolean(u.hostname);
    hasPath = Boolean(u.pathname && u.pathname.length > 1);
    isValid = true;
  } catch {
    isValid = false;
    const protoMatch = dbUrl.match(/^([a-zA-Z0-9+-]+):\/\//);
    if (protoMatch && protoMatch[1]) protocol = protoMatch[1];
  }

  console.log("--- SAFE DATABASE_URL DIAGNOSTICS ---");
  console.log(`- DATABASE_URL present: true`);
  console.log(`- Protocol detected: ${protocol ?? "none"}`);
  console.log(`- Hostname present: ${hasHost}`);
  console.log(`- Database name present: ${hasPath}`);
  console.log(`- Whitespace detected: ${hasWhitespace}`);
  console.log(`- Surrounding quotes detected: ${hasQuotes}`);
  console.log(`- Standard URL parse successful: ${isValid}`);
  console.log("-------------------------------------");

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;
  const pool = new Pool({
    connectionString: dbUrl,
    max: 1,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const db = drizzle(pool);
    // Use public schema and __drizzle_migrations table so managed PostgreSQL
    // does not reject CREATE SCHEMA IF NOT EXISTS "drizzle" due to role permissions.
    await migrate(db, {
      migrationsFolder: "./drizzle",
      migrationsSchema: "public",
      migrationsTable: "__drizzle_migrations",
    });
    console.log("[migrate] ✅ All database migrations applied successfully!");
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error("=========================================");
    console.error("[migrate] ❌ MIGRATION FAILED WITH ERROR:");
    
    const cause = err?.cause || err?.originalError || err;

    console.error("Error Message:", err?.message || String(err));
    console.error("Error Name:", err?.name);
    console.error("Error Stack:", err?.stack);

    if (cause && cause !== err) {
      console.error("--- UNDERLYING POSTGRES CAUSE ---");
      console.error("Cause Message:", cause?.message);
      console.error("Cause Name:", cause?.name);
      console.error("Cause Stack:", cause?.stack);
      if (cause?.code) console.error("Postgres Error Code:", cause.code);
      if (cause?.severity) console.error("Postgres Severity:", cause.severity);
      if (cause?.detail) console.error("Postgres Detail:", cause.detail);
      if (cause?.hint) console.error("Postgres Hint:", cause.hint);
      if (cause?.where) console.error("Postgres Where:", cause.where);
    } else {
      if (err?.code) console.error("Postgres Error Code:", err.code);
      if (err?.severity) console.error("Postgres Severity:", err.severity);
      if (err?.detail) console.error("Postgres Detail:", err.detail);
      if (err?.hint) console.error("Postgres Hint:", err.hint);
      if (err?.where) console.error("Postgres Where:", err.where);
    }
    
    console.error("=========================================");
    await pool.end();
    process.exit(1);
  }
}

runMigration();
