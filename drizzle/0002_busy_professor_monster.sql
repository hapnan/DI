ALTER TABLE "DI_leaf_purchase" ADD COLUMN "totalCost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_leaf_purchase" ADD COLUMN "costPerLeaf" integer DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_sale" ADD COLUMN "pricePerSeed" integer DEFAULT 700 NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_sale" ADD COLUMN "totalPrice" integer NOT NULL;