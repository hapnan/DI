CREATE TABLE IF NOT EXISTS "DI_weekly_limits"  (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"weekStart" date NOT NULL,
	"weekEnd" date NOT NULL,
	"totalLimit" integer DEFAULT 400 NOT NULL,
	"usedLimit" integer DEFAULT 0 NOT NULL,
	"remainingLimit" integer DEFAULT 400 NOT NULL,
	"carriedOverFromPrevious" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DI_weekly_limits" ADD CONSTRAINT "DI_weekly_limits_groupId_DI_group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."DI_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_limits_groupId_idx" ON "DI_weekly_limits" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weekly_limits_weekStart_idx" ON "DI_weekly_limits" USING btree ("weekStart");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_limits_groupId_weekStart_unique" ON "DI_weekly_limits" USING btree ("groupId","weekStart");