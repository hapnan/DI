import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const conn = new Pool({ connectionString: DATABASE_URL });

async function addUserIdColumns() {
  console.log("Adding userId columns and creating system admin...\n");

  try {
    await conn.query("BEGIN");

    // 1. Insert system admin user if not exists
    console.log("1. Creating system admin user...");
    await conn.query(`
      INSERT INTO "DI_user" ("id", "name", "email", "email_verified", "role", "createdAt", "updatedAt")
      VALUES ('system-admin', 'System Admin', 'admin@system.local', true, 'Raden', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("   ✅ System admin created");

    // 2. Add user_id column to DI_sale if it doesn't exist
    console.log("\n2. Adding user_id to DI_sale...");
    await conn.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'DI_sale' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "DI_sale" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
          ALTER TABLE "DI_sale" ADD CONSTRAINT "DI_sale_user_id_DI_user_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "DI_user"("id") ON DELETE NO ACTION;
          CREATE INDEX "sale_user_idx" ON "DI_sale" ("user_id");
        END IF;
      END $$;
    `);
    console.log("   ✅ Added to DI_sale");

    // 3. Add user_id column to DI_leaf_purchase
    console.log("\n3. Adding user_id to DI_leaf_purchase...");
    await conn.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'DI_leaf_purchase' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "DI_leaf_purchase" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
          ALTER TABLE "DI_leaf_purchase" ADD CONSTRAINT "DI_leaf_purchase_user_id_DI_user_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "DI_user"("id") ON DELETE NO ACTION;
          CREATE INDEX "leaf_purchase_user_idx" ON "DI_leaf_purchase" ("user_id");
        END IF;
      END $$;
    `);
    console.log("   ✅ Added to DI_leaf_purchase");

    // 4. Add user_id column to DI_internal_seed_sale
    console.log("\n4. Adding user_id to DI_internal_seed_sale...");
    await conn.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'DI_internal_seed_sale' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "DI_internal_seed_sale" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
          ALTER TABLE "DI_internal_seed_sale" ADD CONSTRAINT "DI_internal_seed_sale_user_id_DI_user_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "DI_user"("id") ON DELETE NO ACTION;
          CREATE INDEX "internal_seed_sale_user_idx" ON "DI_internal_seed_sale" ("user_id");
        END IF;
      END $$;
    `);
    console.log("   ✅ Added to DI_internal_seed_sale");

    // 5. Add user_id column to DI_internal_leaf_purchase
    console.log("\n5. Adding user_id to DI_internal_leaf_purchase...");
    await conn.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'DI_internal_leaf_purchase' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "DI_internal_leaf_purchase" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
          ALTER TABLE "DI_internal_leaf_purchase" ADD CONSTRAINT "DI_internal_leaf_purchase_user_id_DI_user_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "DI_user"("id") ON DELETE NO ACTION;
          CREATE INDEX "internal_leaf_purchase_user_idx" ON "DI_internal_leaf_purchase" ("user_id");
        END IF;
      END $$;
    `);
    console.log("   ✅ Added to DI_internal_leaf_purchase");

    await conn.query("COMMIT");
    console.log("\n🎉 Migration completed successfully!");
  } catch (error: unknown) {
    await conn.query("ROLLBACK");
    console.error(
      "\n❌ Migration failed:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  } finally {
    await conn.end();
  }
}

addUserIdColumns().catch(console.error);
