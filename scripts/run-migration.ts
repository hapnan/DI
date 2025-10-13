import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL!;

const conn = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: conn, casing: "snake_case" });

async function runMigration() {
  console.log("Running auth migration...");

  const sql = readFileSync(
    join(process.cwd(), "drizzle", "0011_add_auth_tables.sql"),
    "utf-8",
  );

  try {
    await conn.query(sql);
    console.log("✅ Migration applied successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

runMigration().catch(console.error);
