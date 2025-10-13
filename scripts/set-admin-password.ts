import { Pool } from "pg";
import { createHash } from "@better-auth/utils/hash";

const conn = new Pool({ connectionString: process.env.DATABASE_URL! });

async function setAdminPassword() {
  const password = "YourSecurePassword123!"; // Change this
  const hashedPassword = await createHash("SHA-256").digest(password);

  await conn.query(
    `
    INSERT INTO "DI_account" ("id", "account_id", "provider_id", "user_id", "password", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, 'admin@system.local', 'credential', 'system-admin', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
  `,
    [hashedPassword],
  );

  console.log("✅ Admin password set!");
  await conn.end();
}

setAdminPassword();
