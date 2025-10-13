import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const conn = new Pool({ connectionString: DATABASE_URL });

async function checkAndFix() {
  console.log("Checking database state...\n");

  try {
    // Check if DI_user table exists
    const userTableCheck = await conn.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'DI_user'
      );
    `);

    const userTableExists = userTableCheck.rows[0].exists;
    console.log(`DI_user table exists: ${userTableExists}`);

    if (userTableExists) {
      // Check columns in user table
      const userColumns = await conn.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'DI_user'
        ORDER BY ordinal_position;
      `);
      console.log("\nDI_user columns:");
      userColumns.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });

      // Check if user_id column exists in DI_sale
      const saleColumns = await conn.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'DI_sale' AND column_name = 'user_id';
      `);
      console.log(
        `\nuser_id exists in DI_sale: ${saleColumns.rows.length > 0}`,
      );
    } else {
      console.log("\n📝 Need to create auth tables");
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  } finally {
    await conn.end();
  }
}

checkAndFix().catch(console.error);
