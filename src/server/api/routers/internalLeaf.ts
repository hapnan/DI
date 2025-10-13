import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { internalLeafPurchase, members, leafTypes } from "~/server/db/schema";

export const internalLeafRouter = createTRPCRouter({
  // Get all leaf purchases with group information
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: internalLeafPurchase.id,
        leavesPurchased: internalLeafPurchase.leavesPurchased,
        totalCost: internalLeafPurchase.totalCost,
        costPerLeaf: internalLeafPurchase.costPerLeaf,
        createdAt: internalLeafPurchase.createdAt,
        updatedAt: internalLeafPurchase.updatedAt,
        member: {
          id: members.id,
          name: members.name,
        },
        leafType: {
          id: leafTypes.id,
          name: leafTypes.name,
        },
      })
      .from(internalLeafPurchase)
      .innerJoin(members, eq(internalLeafPurchase.memberId, members.id))
      .innerJoin(leafTypes, eq(internalLeafPurchase.leafTypeId, leafTypes.id))
      .orderBy(desc(internalLeafPurchase.createdAt));
  }),

  // Create a new leaf purchase

  create: publicProcedure
    .input(
      z.object({
        memberId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
        costPerLeaf: z.number().min(0).optional(),
        totalCost: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .insert(internalLeafPurchase)
        .values({
          ...input,
        })
        .returning();
    }),

  // Get leaf purchases by member ID
  getByMemberId: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: internalLeafPurchase.id,
          members: members.name,
          leavesPurchased: internalLeafPurchase.leavesPurchased,
          costPerLeaf: internalLeafPurchase.costPerLeaf,
          totalCost: internalLeafPurchase.totalCost,
          createdAt: internalLeafPurchase.createdAt,
        })
        .from(internalLeafPurchase)
        .innerJoin(members, eq(internalLeafPurchase.memberId, members.id))
        .where(eq(internalLeafPurchase.memberId, input.memberId))
        .orderBy(desc(internalLeafPurchase.createdAt));
    }),

  // Get total leaves purchased
  getTotalPurchased: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        totalLeavesPurchased: sql<number>`SUM(${internalLeafPurchase.leavesPurchased})`,
      })
      .from(internalLeafPurchase);
    return result[0]?.totalLeavesPurchased ?? 0;
  }),

  // update a leaf purchase by ID
  update: publicProcedure
    .input(
      z.object({
        id: z.number().min(1),
        memberId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
        costPerLeaf: z.number().min(0).optional(),
        totalCost: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(internalLeafPurchase)
        .set({
          ...input,
        })
        .where(eq(internalLeafPurchase.id, input.id))
        .returning();
    }),

  // delete a leaf purchase by ID
  delete: publicProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(internalLeafPurchase)
        .where(eq(internalLeafPurchase.id, input.id))
        .returning();
    }),
});
