import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  ijoProcedure,
  ultraProcedure,
} from "~/server/api/trpc";
import { canEditRecord } from "~/server/api/trpc";
import { internalLeafPurchase, members, leafTypes } from "~/server/db/schema";
import { getLeafPriceByRole, calculateTotalPrice } from "~/lib/pricing";
import { TRPCError } from "@trpc/server";

export const internalLeafRouter = createTRPCRouter({
  // Get all leaf purchases with member information
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { limit = 10, offset = 0 } = input ?? {};

      // Build where clause - Ijo users only see their own records
      const whereClause =
        ctx.user.role === "Ijo"
          ? eq(internalLeafPurchase.userId, ctx.user.id)
          : undefined;

      return ctx.db
        .select({
          id: internalLeafPurchase.id,
          leavesPurchased: internalLeafPurchase.leavesPurchased,
          totalCost: internalLeafPurchase.totalCost,
          costPerLeaf: internalLeafPurchase.costPerLeaf,
          userId: internalLeafPurchase.userId,
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
        .where(whereClause)
        .orderBy(desc(internalLeafPurchase.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  // Create a new leaf purchase - auto-calculate price based on user role
  create: ijoProcedure
    .input(
      z.object({
        memberId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const costPerLeaf = getLeafPriceByRole(
        ctx.user.role as "Raden" | "Ultra" | "Ijo" | "Abu",
      );
      const totalCost = calculateTotalPrice(input.leavesPurchased, costPerLeaf);

      return await ctx.db
        .insert(internalLeafPurchase)
        .values({
          ...input,
          costPerLeaf,
          totalCost,
          userId: ctx.user.id,
        })
        .returning();
    }),

  // Get leaf purchases by member ID
  getByMemberId: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Build where clause - Ijo users only see their own records
      const whereClause =
        ctx.user.role === "Ijo"
          ? and(
              eq(internalLeafPurchase.memberId, input.memberId),
              eq(internalLeafPurchase.userId, ctx.user.id),
            )
          : eq(internalLeafPurchase.memberId, input.memberId);

      return ctx.db
        .select({
          id: internalLeafPurchase.id,
          members: members.name,
          leavesPurchased: internalLeafPurchase.leavesPurchased,
          costPerLeaf: internalLeafPurchase.costPerLeaf,
          totalCost: internalLeafPurchase.totalCost,
          userId: internalLeafPurchase.userId,
          createdAt: internalLeafPurchase.createdAt,
        })
        .from(internalLeafPurchase)
        .innerJoin(members, eq(internalLeafPurchase.memberId, members.id))
        .where(whereClause)
        .orderBy(desc(internalLeafPurchase.createdAt));
    }),

  // Get total leaves purchased - filtered for Ijo users
  getTotalPurchased: protectedProcedure.query(async ({ ctx }) => {
    const whereClause =
      ctx.user.role === "Ijo"
        ? eq(internalLeafPurchase.userId, ctx.user.id)
        : undefined;

    const result = await ctx.db
      .select({
        totalLeavesPurchased: sql<number>`SUM(${internalLeafPurchase.leavesPurchased})`,
      })
      .from(internalLeafPurchase)
      .where(whereClause);
    return result[0]?.totalLeavesPurchased ?? 0;
  }),

  // Update a leaf purchase by ID - Ijo can only edit own records
  update: ijoProcedure
    .input(
      z.object({
        id: z.number().min(1),
        memberId: z.number().min(1),
        leafTypeId: z.number(),
        leavesPurchased: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.db
        .select({ userId: internalLeafPurchase.userId })
        .from(internalLeafPurchase)
        .where(eq(internalLeafPurchase.id, input.id));

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Internal leaf purchase not found",
        });
      }

      if (
        !canEditRecord(ctx.user.role, ctx.user.id, existing[0].userId ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own records",
        });
      }

      // Recalculate price based on current user's role
      const costPerLeaf = getLeafPriceByRole(
        ctx.user.role as "Raden" | "Ultra" | "Ijo" | "Abu",
      );
      const totalCost = calculateTotalPrice(input.leavesPurchased, costPerLeaf);

      return await ctx.db
        .update(internalLeafPurchase)
        .set({
          ...input,
          costPerLeaf,
          totalCost,
        })
        .where(eq(internalLeafPurchase.id, input.id))
        .returning();
    }),

  // Delete a leaf purchase by ID - only Ultra and Raden
  delete: ultraProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(internalLeafPurchase)
        .where(eq(internalLeafPurchase.id, input.id))
        .returning();
    }),
});
