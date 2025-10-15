import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, radenProcedure } from "~/server/api/trpc";
import {
  groupPrices,
  internalPrices,
  groups,
  seedTypes,
  leafTypes,
} from "~/server/db/schema";

export const priceRouter = createTRPCRouter({
  // ==========================================
  // Group Prices (External)
  // ==========================================

  // Get all group prices
  getAllGroupPrices: radenProcedure.query(async ({ ctx }) => {
    const prices = await ctx.db
      .select({
        id: groupPrices.id,
        groupId: groupPrices.groupId,
        groupName: groups.name,
        itemType: groupPrices.itemType,
        itemId: groupPrices.itemId,
        price: groupPrices.price,
        isActive: groupPrices.isActive,
        createdAt: groupPrices.createdAt,
      })
      .from(groupPrices)
      .leftJoin(groups, eq(groupPrices.groupId, groups.id))
      .orderBy(desc(groupPrices.createdAt));

    // Fetch item names
    const enrichedPrices = await Promise.all(
      prices.map(async (price) => {
        let itemName = "";
        if (price.itemType === "seed") {
          const seedType = await ctx.db
            .select({ name: seedTypes.name })
            .from(seedTypes)
            .where(eq(seedTypes.id, price.itemId))
            .limit(1);
          itemName = seedType[0]?.name ?? "Unknown";
        } else if (price.itemType === "leaf") {
          const leafType = await ctx.db
            .select({ name: leafTypes.name })
            .from(leafTypes)
            .where(eq(leafTypes.id, price.itemId))
            .limit(1);
          itemName = leafType[0]?.name ?? "Unknown";
        }

        return {
          ...price,
          itemName,
        };
      }),
    );

    return enrichedPrices;
  }),

  // Create group price
  createGroupPrice: radenProcedure
    .input(
      z.object({
        groupId: z.number(),
        itemType: z.enum(["seed", "leaf"]),
        itemId: z.number(),
        price: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [newPrice] = await ctx.db
          .insert(groupPrices)
          .values({
            groupId: input.groupId,
            itemType: input.itemType,
            itemId: input.itemId,
            price: input.price,
            isActive: true,
          })
          .returning();

        return newPrice;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create group price. It might already exist.",
        });
      }
    }),

  // Update group price
  updateGroupPrice: radenProcedure
    .input(
      z.object({
        id: z.number(),
        price: z.number().min(0),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: {
        price: number;
        isActive?: boolean;
      } = {
        price: input.price,
      };

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      const [updatedPrice] = await ctx.db
        .update(groupPrices)
        .set(updateData)
        .where(eq(groupPrices.id, input.id))
        .returning();

      if (!updatedPrice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group price not found",
        });
      }

      return updatedPrice;
    }),

  // Delete group price
  deleteGroupPrice: radenProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(groupPrices).where(eq(groupPrices.id, input.id));
      return { success: true };
    }),

  // ==========================================
  // Internal Prices (Role-based)
  // ==========================================

  // Get all internal prices
  getAllInternalPrices: radenProcedure.query(async ({ ctx }) => {
    const prices = await ctx.db
      .select()
      .from(internalPrices)
      .orderBy(desc(internalPrices.createdAt));

    // Fetch item names
    const enrichedPrices = await Promise.all(
      prices.map(async (price) => {
        let itemName = "";
        if (price.itemType === "seed") {
          const seedType = await ctx.db
            .select({ name: seedTypes.name })
            .from(seedTypes)
            .where(eq(seedTypes.id, price.itemId))
            .limit(1);
          itemName = seedType[0]?.name ?? "Unknown";
        } else if (price.itemType === "leaf") {
          const leafType = await ctx.db
            .select({ name: leafTypes.name })
            .from(leafTypes)
            .where(eq(leafTypes.id, price.itemId))
            .limit(1);
          itemName = leafType[0]?.name ?? "Unknown";
        }

        return {
          ...price,
          itemName,
        };
      }),
    );

    return enrichedPrices;
  }),

  // Create internal price
  createInternalPrice: radenProcedure
    .input(
      z.object({
        itemType: z.enum(["seed", "leaf"]),
        itemId: z.number(),
        roleType: z.enum(["all", "specific"]),
        role: z.enum(["Raden", "Ultra", "Ijo", "Abu"]).optional(),
        price: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate: if roleType is 'specific', role must be provided
      if (input.roleType === "specific" && !input.role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Role is required when roleType is 'specific'",
        });
      }

      try {
        const [newPrice] = await ctx.db
          .insert(internalPrices)
          .values({
            itemType: input.itemType,
            itemId: input.itemId,
            roleType: input.roleType,
            role: input.role ?? null,
            price: input.price,
            isActive: true,
          })
          .returning();

        return newPrice;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create internal price. It might already exist.",
        });
      }
    }),

  // Update internal price
  updateInternalPrice: radenProcedure
    .input(
      z.object({
        id: z.number(),
        price: z.number().min(0),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: {
        price: number;
        isActive?: boolean;
      } = {
        price: input.price,
      };

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      const [updatedPrice] = await ctx.db
        .update(internalPrices)
        .set(updateData)
        .where(eq(internalPrices.id, input.id))
        .returning();

      if (!updatedPrice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Internal price not found",
        });
      }

      return updatedPrice;
    }),

  // Delete internal price
  deleteInternalPrice: radenProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(internalPrices)
        .where(eq(internalPrices.id, input.id));
      return { success: true };
    }),

  // ==========================================
  // Helper Queries
  // ==========================================

  // Get all groups for dropdown
  getAllGroups: radenProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(groups).orderBy(groups.name);
  }),

  // Get all seed types for dropdown
  getAllSeedTypes: radenProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(seedTypes).orderBy(seedTypes.name);
  }),

  // Get all leaf types for dropdown
  getAllLeafTypes: radenProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(leafTypes).orderBy(leafTypes.name);
  }),
});
