import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { leafPurchases, groups } from "~/server/db/schema";

export const leafPurchaseRouter = createTRPCRouter({
  // Get all leaf purchases with group information
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: leafPurchases.id,
        leavesPurchased: leafPurchases.leavesPurchased,
        totalCost: leafPurchases.totalCost,
        costPerLeaf: leafPurchases.costPerLeaf,
        createdAt: leafPurchases.createdAt,
        updatedAt: leafPurchases.updatedAt,
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(leafPurchases)
      .innerJoin(groups, eq(leafPurchases.groupId, groups.id))
      .orderBy(desc(leafPurchases.createdAt));
  }),

  // Create a new leaf purchase
  create: publicProcedure
    .input(
      z.object({
        groupId: z.number().min(1),
        leavesPurchased: z.number().min(0),
        totalCost: z.number().min(0),
        costPerLeaf: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(leafPurchases)
        .values({ ...input })
        .returning();
    }),

  // Get leaf purchases by group ID
  getByGroupId: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(leafPurchases)
        .where(eq(leafPurchases.groupId, input.groupId))
        .orderBy(desc(leafPurchases.createdAt));
    }),

  // Get total leaves purchased
  getTotalPurchased: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        total: sql<number>`sum(${leafPurchases.leavesPurchased})`,
      })
      .from(leafPurchases);

    return result[0]?.total ?? 0;
  }),
});
