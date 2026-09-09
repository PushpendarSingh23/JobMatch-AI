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
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[migrate] ✅ All database migrations applied successfully!");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("=========================================");
    console.error("[migrate] ❌ MIGRATION FAILED WITH ERROR:");
    if (err instanceof Error) {
      console.error("Error Name:", err.name);
      console.error("Error Message:", err.message);
      console.error("Error Stack:", err.stack);
      if ("code" in err) console.error("Postgres Error Code:", (err as any).code);
      if ("detail" in err) console.error("Postgres Detail:", (err as any).detail);
      if ("hint" in err) console.error("Postgres Hint:", (err as any).hint);
    } else {
      console.error(String(err));
    }
    console.error("=========================================");
    await pool.end();
    process.exit(1);
  }
}

runMigration();
