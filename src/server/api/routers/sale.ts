import { z } from "zod";
import { eq, desc, sql, count } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sales, groups, seedTypes } from "~/server/db/schema";

export const saleRouter = createTRPCRouter({
  // Create a new sale
  create: publicProcedure
    .input(
      z.object({
        groupId: z.number(),
        seedTypeId: z.number(),
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

  // Get all sales with group information (with pagination support)
  getAll: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(10),
          offset: z.number().min(0).optional().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { limit = 10, offset = 0 } = input ?? {};

      // Get total count
      const totalCountResult = await ctx.db
        .select({ count: count() })
        .from(sales);
      const totalCount = totalCountResult[0]?.count ?? 0;

      // Get paginated data
      const data = await ctx.db
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
          seedType: {
            id: seedTypes.id,
            name: seedTypes.name,
          },
        })
        .from(sales)
        .innerJoin(groups, eq(sales.groupId, groups.id))
        .innerJoin(seedTypes, eq(sales.seedTypeId, seedTypes.id))
        .orderBy(desc(sales.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
      };
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

  // Update a sale by ID
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        seedTypeId: z.number(),
        seedsSold: z.number().positive(),
        pricePerSeed: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db
        .update(sales)
        .set(data)
        .where(eq(sales.id, id))
        .returning();
    }),

  // Delete a sale by ID
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(sales).where(eq(sales.id, input.id));
    }),
});
