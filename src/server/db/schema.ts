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

// ======================================
// Auth Tables (better-auth)
// ======================================

// User table with role field for RBAC
export const users = createTable(
  "user",
  (d) => ({
    id: d.text().primaryKey(),
    name: d.text().notNull(),
    email: d.text().notNull().unique(),
    emailVerified: d.boolean("email_verified").default(false).notNull(),
    image: d.text(),
    role: d.text().notNull().default("Abu"), // Raden, Ultra, Ijo, Abu
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("user_email_idx").on(t.email),
    index("user_role_idx").on(t.role),
  ],
);

// Session table for better-auth
export const sessions = createTable(
  "session",
  (d) => ({
    id: d.text().primaryKey(),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
    token: d.text().notNull().unique(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: d.text("ip_address"),
    userAgent: d.text("user_agent"),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("session_token_idx").on(t.token),
    index("session_user_idx").on(t.userId),
  ],
);

// Account table for auth providers (email/password)
export const accounts = createTable(
  "account",
  (d) => ({
    id: d.text().primaryKey(),
    accountId: d.text("account_id").notNull(),
    providerId: d.text("provider_id").notNull(),
    userId: d
      .text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: d.text("access_token"),
    refreshToken: d.text("refresh_token"),
    idToken: d.text("id_token"),
    accessTokenExpiresAt: d.timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: d.timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: d.text(),
    password: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("account_user_idx").on(t.userId)],
);

// ======================================
// Application Tables
// ======================================

// Table for seed types
export const seedTypes = createTable(
  "seed_type",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 100 }).notNull().unique(),
    description: d.varchar({ length: 500 }),
    defaultPricePerSeed: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("seed_type_name_idx").on(t.name)],
);

// Table for leaf types (marijuana from cannabis, cocaine from coca)
export const leafTypes = createTable(
  "leaf_type",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 100 }).notNull().unique(),
    description: d.varchar({ length: 500 }),
    seedTypeId: d
      .integer()
      .references(() => seedTypes.id)
      .notNull(),
    defaultPricePerLeaf: d.integer().default(200),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("leaf_type_name_idx").on(t.name),
    index("leaf_type_seed_type_idx").on(t.seedTypeId),
  ],
);

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
    seedTypeId: d
      .integer()
      .references(() => seedTypes.id)
      .notNull(),
    seedsSold: d.integer().notNull(),
    pricePerSeed: d.integer().default(700),
    totalPrice: d.integer(),
    userId: d
      .text("user_id")
      .references(() => users.id)
      .notNull(), // Track who created this sale
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("sale_group_idx").on(t.groupId),
    index("sale_seed_type_idx").on(t.seedTypeId),
    index("sale_user_idx").on(t.userId),
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
    leafTypeId: d
      .integer()
      .references(() => leafTypes.id)
      .notNull(),
    leavesPurchased: d.integer().notNull(),
    totalCost: d.integer().default(0),
    costPerLeaf: d.integer().default(200),
    userId: d
      .text("user_id")
      .references(() => users.id)
      .notNull(), // Track who created this purchase
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("leaf_purchase_group_idx").on(t.groupId),
    index("leaf_purchase_leaf_type_idx").on(t.leafTypeId),
    index("leaf_purchase_user_idx").on(t.userId),
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
    seedTypeId: d
      .integer()
      .references(() => seedTypes.id)
      .notNull(),
    seedsSold: d.integer().notNull(),
    pricePerSeed: d.integer().default(700),
    totalPrice: d.integer(),
    userId: d
      .text("user_id")
      .references(() => users.id)
      .notNull(), // Track who created this sale
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("internal_seed_sale_member_idx").on(t.memberId),
    index("internal_seed_sale_seed_type_idx").on(t.seedTypeId),
    index("internal_seed_sale_user_idx").on(t.userId),
  ],
);

export const internalLeafPurchase = createTable(
  "internal_leaf_purchase",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    memberId: d
      .integer()
      .references(() => members.id)
      .notNull(),
    leafTypeId: d
      .integer()
      .references(() => leafTypes.id)
      .notNull(),
    leavesPurchased: d.integer().notNull(),
    totalCost: d.integer().default(0),
    costPerLeaf: d.integer().default(200),
    userId: d
      .text("user_id")
      .references(() => users.id)
      .notNull(), // Track who created this purchase
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("internal_leaf_purchase_member_idx").on(t.memberId),
    index("internal_leaf_purchase_leaf_type_idx").on(t.leafTypeId),
    index("internal_leaf_purchase_user_idx").on(t.userId),
  ],
);

// ======================================
// Price Management Tables
// ======================================

// Table for group-specific pricing (external sales/purchases)
export const groupPrices = createTable(
  "group_price",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    groupId: d
      .integer()
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    itemType: d.varchar({ length: 20 }).notNull(), // 'seed' or 'leaf'
    itemId: d.integer().notNull(), // seedTypeId or leafTypeId
    price: d.integer().notNull(),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("group_price_group_idx").on(t.groupId),
    index("group_price_item_idx").on(t.itemType, t.itemId),
    uniqueIndex("group_price_unique").on(t.groupId, t.itemType, t.itemId),
  ],
);

// Table for internal pricing (role-based or specific roles)
export const internalPrices = createTable(
  "internal_price",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    itemType: d.varchar({ length: 20 }).notNull(), // 'seed' or 'leaf'
    itemId: d.integer().notNull(), // seedTypeId or leafTypeId
    roleType: d.varchar({ length: 20 }).notNull(), // 'all' or 'specific'
    role: d.varchar({ length: 20 }), // null if roleType='all', otherwise 'Raden', 'Ultra', 'Ijo', 'Abu'
    price: d.integer().notNull(),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("internal_price_item_idx").on(t.itemType, t.itemId),
    index("internal_price_role_idx").on(t.roleType, t.role),
    // Unique constraint: one price per item-role combination
    uniqueIndex("internal_price_unique").on(
      t.itemType,
      t.itemId,
      t.roleType,
      t.role,
    ),
  ],
);
