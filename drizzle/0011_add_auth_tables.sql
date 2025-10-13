-- Create auth tables
CREATE TABLE "DI_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'Abu' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "DI_user_email_unique" UNIQUE("email")
);

CREATE TABLE "DI_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "DI_session_token_unique" UNIQUE("token")
);

CREATE TABLE "DI_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);

-- Create indexes for auth tables
CREATE INDEX "user_email_idx" ON "DI_user" USING btree ("email");
CREATE INDEX "user_role_idx" ON "DI_user" USING btree ("role");
CREATE INDEX "session_token_idx" ON "DI_session" USING btree ("token");
CREATE INDEX "session_user_idx" ON "DI_session" USING btree ("user_id");
CREATE INDEX "account_user_idx" ON "DI_account" USING btree ("user_id");

-- Add foreign keys for auth tables
ALTER TABLE "DI_account" ADD CONSTRAINT "DI_account_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "DI_session" ADD CONSTRAINT "DI_session_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE cascade ON UPDATE no action;

-- Insert default admin user (Raden role) - you'll need to set password via app
INSERT INTO "DI_user" ("id", "name", "email", "email_verified", "role", "createdAt", "updatedAt")
VALUES ('system-admin', 'System Admin', 'admin@system.local', true, 'Raden', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add user_id columns to existing tables with default to system admin
ALTER TABLE "DI_sale" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
ALTER TABLE "DI_leaf_purchase" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
ALTER TABLE "DI_internal_seed_sale" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;
ALTER TABLE "DI_internal_leaf_purchase" ADD COLUMN "user_id" text DEFAULT 'system-admin' NOT NULL;

-- Add foreign keys for user tracking
ALTER TABLE "DI_sale" ADD CONSTRAINT "DI_sale_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "DI_leaf_purchase" ADD CONSTRAINT "DI_leaf_purchase_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "DI_internal_seed_sale" ADD CONSTRAINT "DI_internal_seed_sale_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "DI_internal_leaf_purchase" ADD CONSTRAINT "DI_internal_leaf_purchase_user_id_DI_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."DI_user"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for user tracking
CREATE INDEX "sale_user_idx" ON "DI_sale" USING btree ("user_id");
CREATE INDEX "leaf_purchase_user_idx" ON "DI_leaf_purchase" USING btree ("user_id");
CREATE INDEX "internal_seed_sale_user_idx" ON "DI_internal_seed_sale" USING btree ("user_id");
CREATE INDEX "internal_leaf_purchase_user_idx" ON "DI_internal_leaf_purchase" USING btree ("user_id");
