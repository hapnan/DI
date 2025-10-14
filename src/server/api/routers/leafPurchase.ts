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
import { leafPurchases, groups, leafTypes } from "~/server/db/schema";
import { getLeafPriceByRole, calculateTotalPrice } from "~/lib/pricing";

export const leafPurchaseRouter = createTRPCRouter({
  // Get all leaf purchases with group information
  // Ijo users can only see their own purchases
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
        ctx.user.role === "Ijo"
          ? eq(leafPurchases.userId, ctx.user.id)
          : undefined;

      // Get total count
      const totalCountResult = await ctx.db
        .select({ count: count() })
        .from(leafPurchases)
        .where(whereCondition);
      const totalCount = totalCountResult[0]?.count ?? 0;

      // Get paginated data
      const data = await ctx.db
        .select({
          id: leafPurchases.id,
          leavesPurchased: leafPurchases.leavesPurchased,
          totalCost: leafPurchases.totalCost,
          costPerLeaf: leafPurchases.costPerLeaf,
          userId: leafPurchases.userId,
          createdAt: leafPurchases.createdAt,
          updatedAt: leafPurchases.updatedAt,
          group: {
            id: groups.id,
            name: groups.name,
          },
          leafType: {
            id: leafTypes.id,
            name: leafTypes.name,
          },
        })
        .from(leafPurchases)
        .innerJoin(groups, eq(leafPurchases.groupId, groups.id))
        .innerJoin(leafTypes, eq(leafPurchases.leafTypeId, leafTypes.id))
        .where(whereCondition)
        .orderBy(desc(leafPurchases.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data,
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
      };
    }),

  // Create a new leaf purchase - only Ijo and above can create
  create: ijoProcedure
    .input(
      z.object({
        groupId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get price based on user role
      const costPerLeaf = getLeafPriceByRole(ctx.user.role);
      const totalCost = calculateTotalPrice(input.leavesPurchased, costPerLeaf);

      return ctx.db
        .insert(leafPurchases)
        .values({
          ...input,
          costPerLeaf,
          totalCost,
          userId: ctx.user.id, // Track who created this
        })
        .returning();
    }),

  // Get leaf purchases by group ID - protected
  getByGroupId: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const whereCondition =
        ctx.user.role === "Ijo"
          ? and(
              eq(leafPurchases.groupId, input.groupId),
              eq(leafPurchases.userId, ctx.user.id),
            )
          : eq(leafPurchases.groupId, input.groupId);

      return ctx.db
        .select()
        .from(leafPurchases)
        .where(whereCondition)
        .orderBy(desc(leafPurchases.createdAt));
    }),

  // Get total leaves purchased - protected
  getTotalPurchased: protectedProcedure.query(async ({ ctx }) => {
    const whereCondition =
      ctx.user.role === "Ijo"
        ? eq(leafPurchases.userId, ctx.user.id)
        : undefined;

    const result = await ctx.db
      .select({
        total: sql<number>`sum(${leafPurchases.leavesPurchased})`,
      })
      .from(leafPurchases)
      .where(whereCondition);

    return result[0]?.total ?? 0;
  }),

  // Update a leaf purchase by ID
  // Ijo users can only update their own purchases
  // Ultra and Raden can update any purchase
  update: ijoProcedure
    .input(
      z.object({
        id: z.number(),
        groupId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if the purchase exists and get its owner
      const existingPurchase = await ctx.db
        .select({ userId: leafPurchases.userId })
        .from(leafPurchases)
        .where(eq(leafPurchases.id, id))
        .limit(1);

      if (!existingPurchase[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Leaf purchase not found",
        });
      }

      // Check if user can edit this record
      if (
        !canEditRecord(ctx.user.role, ctx.user.id, existingPurchase[0].userId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own purchases",
        });
      }

      // Recalculate price based on user role
      const costPerLeaf = getLeafPriceByRole(ctx.user.role);
      const totalCost = calculateTotalPrice(
        updateData.leavesPurchased,
        costPerLeaf,
      );

      return await ctx.db
        .update(leafPurchases)
        .set({
          ...updateData,
          costPerLeaf,
          totalCost,
        })
        .where(eq(leafPurchases.id, id))
        .returning();
    }),

  // Delete a leaf purchase by ID - only Ultra and Raden can delete
  delete: ultraProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(leafPurchases)
        .where(eq(leafPurchases.id, input.id));
    }),
});
