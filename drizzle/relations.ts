import { relations } from "drizzle-orm/relations";
import { diGroup, diSale, diLeafPurchase } from "./schema";

export const diSaleRelations = relations(diSale, ({one}) => ({
	diGroup: one(diGroup, {
		fields: [diSale.groupId],
		references: [diGroup.id]
	}),
}));

export const diGroupRelations = relations(diGroup, ({many}) => ({
	diSales: many(diSale),
	diLeafPurchases: many(diLeafPurchase),
}));

export const diLeafPurchaseRelations = relations(diLeafPurchase, ({one}) => ({
	diGroup: one(diGroup, {
		fields: [diLeafPurchase.groupId],
		references: [diGroup.id]
	}),
}));