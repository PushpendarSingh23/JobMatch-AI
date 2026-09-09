import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[migrate] FATAL ERROR: DATABASE_URL is missing or undefined.");
    process.exit(1);
  }

  console.log("[migrate] Starting database migration using Drizzle migrator...");
  const pool = new Pool({ connectionString: dbUrl, max: 1 });

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
