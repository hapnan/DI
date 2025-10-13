// Schema for seed sales application

import { sql } from "drizzle-orm";
import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `DI_${name}`);

// Table for seed groups
export const groups = createTable(
  "group",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull().unique(),
    limitbuy: d.integer().default(400),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("group_name_idx").on(t.name)],
);

// Table for sales records
export const sales = createTable(
  "sale",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    groupId: d
      .integer()
      .references(() => groups.id)
      .notNull(),
    seedsSold: d.integer().notNull(),
    pricePerSeed: d.integer().default(700),
    totalPrice: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("sale_group_idx").on(t.groupId),
    index("sale_created_at_idx").on(t.createdAt),
  ],
);

// Table for leaf purchases
export const leafPurchases = createTable(
  "leaf_purchase",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    groupId: d
      .integer()
      .references(() => groups.id)
      .notNull(),
    leavesPurchased: d.integer().notNull(),
    totalCost: d.integer().default(0),
    costPerLeaf: d.integer().default(200),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("leaf_purchase_group_idx").on(t.groupId),
    index("leaf_purchase_created_at_idx").on(t.createdAt),
  ],
);

// Keep the original posts table for reference
export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const weeklyLimits = createTable(
  "weekly_limits",
  (d) => ({
    id: d.integer("id").primaryKey().generatedByDefaultAsIdentity(),
    groupId: d
      .integer("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    weekStart: d.date("weekStart").notNull(),
    weekEnd: d.date("weekEnd").notNull(),
    totalLimit: d.integer("totalLimit").notNull().default(400),
    usedLimit: d.integer("usedLimit").notNull().default(0),
    remainingLimit: d.integer("remainingLimit").notNull().default(400),
    carriedOverFromPrevious: d
      .integer("carriedOverFromPrevious")
      .notNull()
      .default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("weekly_limits_groupId_idx").on(t.groupId),
    index("weekly_limits_weekStart_idx").on(t.weekStart),
    uniqueIndex("weekly_limits_groupId_weekStart_unique").on(
      t.groupId,
      t.weekStart,
    ),
  ],
);

export const members = createTable(
  "member",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull().unique(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("member_name_idx").on(t.name)],
);

export const internalSeedSale = createTable(
  "internal_seed_sale",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer()
      .references(() => members.id)
      .notNull(),
    seedsSold: d.integer().notNull(),
    pricePerSeed: d.integer().default(700),
    totalPrice: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("internal_seed_sale_member_idx").on(t.memberId)],
);

export const internalLeafPurchase = createTable(
  "internal_leaf_purchase",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer()
      .references(() => members.id)
      .notNull(),
    leavesPurchased: d.integer().notNull(),
    totalCost: d.integer().default(0),
    costPerLeaf: d.integer().default(200),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("internal_leaf_purchase_member_idx").on(t.memberId)],
);
