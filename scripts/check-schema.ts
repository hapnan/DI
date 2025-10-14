import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";

const DATABASE_URL = process.env.DATABASE_URL!;

const conn = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: conn, casing: "snake_case", schema });

async function checkTables() {
  console.log("Checking database schema...");

  try {
    // Check if user table exists and has data
    const users = await db.select().from(schema.users).limit(5);
    console.log(`✅ Users table exists with ${users.length} users`);
    if (users.length > 0) {
      console.log("Sample users:", users);
    }

    // Check sales table for user_id column
    const sales = await db.select().from(schema.sales).limit(1);
    console.log(
      "✅ Sales table structure includes userId:",
      sales[0] ? Object.keys(sales[0]) : "no sales yet",
    );
  } catch (error: unknown) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    await conn.end();
  }
}

checkTables().catch(console.error);
