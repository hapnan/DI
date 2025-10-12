ALTER TABLE "DI_leaf_purchase" ALTER COLUMN "totalCost" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_leaf_purchase" ALTER COLUMN "costPerLeaf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_sale" ALTER COLUMN "pricePerSeed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "DI_sale" ALTER COLUMN "totalPrice" DROP NOT NULL;