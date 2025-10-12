import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sales, groups } from "~/server/db/schema";

export const saleRouter = createTRPCRouter({
  // Create a new sale
  create: publicProcedure
    .input(
      z.object({
        groupId: z.number(),
        seedsSold: z.number().positive(),
        pricePerSeed: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.insert(sales).values({
          ...input,
        });
      } catch (error) {
        // Check if the error is from our weekly limit trigger
        if (
          error instanceof Error &&
          error.message.includes("Insufficient limit")
        ) {
          throw new Error(error.message);
        }
        throw error;
      }
    }),

  // Get all sales with group information
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: sales.id,
        seedsSold: sales.seedsSold,
        pricePerSeed: sales.pricePerSeed,
        totalPrice: sales.totalPrice,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(sales)
      .innerJoin(groups, eq(sales.groupId, groups.id))
      .orderBy(desc(sales.createdAt));
  }),

  // Get sales by group ID
  getByGroupId: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(sales)
        .where(eq(sales.groupId, input.groupId))
        .orderBy(desc(sales.createdAt));
    }),

  // Get total seeds sold
  getTotalSold: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        total: sql<number>`sum(${sales.seedsSold})`,
      })
      .from(sales);

    return result[0]?.total ?? 0;
  }),
});
