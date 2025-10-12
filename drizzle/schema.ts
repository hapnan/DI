import { pgTable, index, check, integer, varchar, timestamp, unique, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const diPost = pgTable("DI_post", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: ""DI_post_id_seq"", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647 }),
	name: varchar({ length: 256 }),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	check("DI_post_id_not_null", sql`NOT NULL id`),
	check("DI_post_createdAt_not_null", sql`NOT NULL "createdAt"`),
]);

export const diGroup = pgTable("DI_group", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: ""DI_group_id_seq"", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647 }),
	name: varchar({ length: 256 }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("group_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("DI_group_name_unique").on(table.name),
	check("DI_group_id_not_null", sql`NOT NULL id`),
	check("DI_group_name_not_null", sql`NOT NULL name`),
	check("DI_group_createdAt_not_null", sql`NOT NULL "createdAt"`),
]);

export const diSale = pgTable("DI_sale", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: ""DI_sale_id_seq"", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647 }),
	groupId: integer().notNull(),
	seedsSold: integer().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("sale_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("sale_group_idx").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [diGroup.id],
			name: "DI_sale_groupId_DI_group_id_fk"
		}),
	check("DI_sale_id_not_null", sql`NOT NULL id`),
	check("DI_sale_groupId_not_null", sql`NOT NULL "groupId"`),
	check("DI_sale_seedsSold_not_null", sql`NOT NULL "seedsSold"`),
	check("DI_sale_createdAt_not_null", sql`NOT NULL "createdAt"`),
]);

export const diLeafPurchase = pgTable("DI_leaf_purchase", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: ""DI_leaf_purchase_id_seq"", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647 }),
	groupId: integer().notNull(),
	leavesPurchased: integer().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("leaf_purchase_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("leaf_purchase_group_idx").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [diGroup.id],
			name: "DI_leaf_purchase_groupId_DI_group_id_fk"
		}),
	check("DI_leaf_purchase_id_not_null", sql`NOT NULL id`),
	check("DI_leaf_purchase_groupId_not_null", sql`NOT NULL "groupId"`),
	check("DI_leaf_purchase_leavesPurchased_not_null", sql`NOT NULL "leavesPurchased"`),
	check("DI_leaf_purchase_createdAt_not_null", sql`NOT NULL "createdAt"`),
]);
