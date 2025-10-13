import { z } from "zod";
import { eq, desc, sql, count, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  ijoProcedure,
  ultraProcedure,
  canEditRecord,
} from "~/server/api/trpc";
import { sales, groups, seedTypes } from "~/server/db/schema";
import { getSeedPriceByRole, calculateTotalPrice } from "~/lib/pricing";

export const saleRouter = createTRPCRouter({
  // Create a new sale - only Ijo and above can create
  create: ijoProcedure
    .input(
      z.object({
        groupId: z.number(),
        seedTypeId: z.number(),
        seedsSold: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get price based on user role
        const pricePerSeed = getSeedPriceByRole(ctx.user.role as any);
        const totalPrice = calculateTotalPrice(input.seedsSold, pricePerSeed);

        return await ctx.db.insert(sales).values({
          ...input,
          pricePerSeed,
          totalPrice,
          userId: ctx.user.id, // Track who created this
        });
      } catch (error) {
        // Check if the error is from our weekly limit trigger
        if (
          error instanceof Error &&
          error.message.includes("Insufficient limit")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  // Get all sales with group information (with pagination support)
  // Ijo users can only see their own sales
  getAll: protectedProcedure
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

      // Build where condition based on role
      const whereCondition =
        ctx.user.role === "Ijo" ? eq(sales.userId, ctx.user.id) : undefined;

      // Get total count
      const totalCountResult = await ctx.db
        .select({ count: count() })
        .from(sales)
        .where(whereCondition);
      const totalCount = totalCountResult[0]?.count ?? 0;

      // Get paginated data
      const data = await ctx.db
        .select({
          id: sales.id,
          seedsSold: sales.seedsSold,
          pricePerSeed: sales.pricePerSeed,
          totalPrice: sales.totalPrice,
          userId: sales.userId,
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
        .where(whereCondition)
        .orderBy(desc(sales.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
      };
    }),

  // Get sales by group ID - protected
  getByGroupId: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const whereCondition =
        ctx.user.role === "Ijo"
          ? and(eq(sales.groupId, input.groupId), eq(sales.userId, ctx.user.id))
          : eq(sales.groupId, input.groupId);

      return ctx.db
        .select()
        .from(sales)
        .where(whereCondition)
        .orderBy(desc(sales.createdAt));
    }),

  // Get total seeds sold - protected
  getTotalSold: protectedProcedure.query(async ({ ctx }) => {
    const whereCondition =
      ctx.user.role === "Ijo" ? eq(sales.userId, ctx.user.id) : undefined;

    const result = await ctx.db
      .select({
        total: sql<number>`sum(${sales.seedsSold})`,
      })
      .from(sales)
      .where(whereCondition);

    return result[0]?.total ?? 0;
  }),

  // Update a sale by ID
  // Ijo users can only update their own sales
  // Ultra and Raden can update any sale
  update: ijoProcedure
    .input(
      z.object({
        id: z.number(),
        groupId: z.number(),
        seedTypeId: z.number(),
        seedsSold: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if the sale exists and get its owner
      const existingSale = await ctx.db
        .select({ userId: sales.userId })
        .from(sales)
        .where(eq(sales.id, id))
        .limit(1);

      if (!existingSale[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sale not found",
        });
      }

      // Check if user can edit this record
      if (!canEditRecord(ctx.user.role, ctx.user.id, existingSale[0].userId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own sales",
        });
      }

      // Recalculate price based on user role
      const pricePerSeed = getSeedPriceByRole(ctx.user.role as any);
      const totalPrice = calculateTotalPrice(
        updateData.seedsSold,
        pricePerSeed,
      );

      return await ctx.db
        .update(sales)
        .set({
          ...updateData,
          pricePerSeed,
          totalPrice,
        })
        .where(eq(sales.id, id))
        .returning();
    }),

  // Delete a sale by ID - only Ultra and Raden can delete
  delete: ultraProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(sales).where(eq(sales.id, input.id));
    }),
});
