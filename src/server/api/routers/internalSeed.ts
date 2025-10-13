import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  ijoProcedure,
  ultraProcedure,
} from "~/server/api/trpc";
import { canEditRecord } from "~/server/api/trpc";
import { internalSeedSale, members, seedTypes } from "~/server/db/schema";
import { getSeedPriceByRole, calculateTotalPrice } from "~/lib/pricing";
import { TRPCError } from "@trpc/server";

export const internalSeedRouter = createTRPCRouter({
  // Get all internal seed sales with member information
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
          ? eq(internalSeedSale.userId, ctx.user.id)
          : undefined;

      return ctx.db
        .select({
          id: internalSeedSale.id,
          seedsSold: internalSeedSale.seedsSold,
          pricePerSeed: internalSeedSale.pricePerSeed,
          totalPrice: internalSeedSale.totalPrice,
          userId: internalSeedSale.userId,
          createdAt: internalSeedSale.createdAt,
          updatedAt: internalSeedSale.updatedAt,
          member: {
            id: members.id,
            name: members.name,
          },
          seedType: {
            id: seedTypes.id,
            name: seedTypes.name,
          },
        })
        .from(internalSeedSale)
        .innerJoin(members, eq(internalSeedSale.memberId, members.id))
        .innerJoin(seedTypes, eq(internalSeedSale.seedTypeId, seedTypes.id))
        .where(whereClause)
        .orderBy(desc(internalSeedSale.createdAt))
        .limit(limit)
        .offset(offset);
    }),

  // Create a new internal seed sale - auto-calculate price based on user role
  create: ijoProcedure
    .input(
      z.object({
        memberId: z.number().min(1),
        seedTypeId: z.number(),
        seedsSold: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pricePerSeed = getSeedPriceByRole(
        ctx.user.role as "Raden" | "Ultra" | "Ijo" | "Abu",
      );
      const totalPrice = calculateTotalPrice(input.seedsSold, pricePerSeed);

      return ctx.db
        .insert(internalSeedSale)
        .values({
          ...input,
          pricePerSeed,
          totalPrice,
          userId: ctx.user.id,
        })
        .returning();
    }),

  // Get internal seed sales by member ID
  getByMemberId: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Build where clause - Ijo users only see their own records
      const whereClause =
        ctx.user.role === "Ijo"
          ? and(
              eq(internalSeedSale.memberId, input.memberId),
              eq(internalSeedSale.userId, ctx.user.id),
            )
          : eq(internalSeedSale.memberId, input.memberId);

      return ctx.db
        .select()
        .from(internalSeedSale)
        .where(whereClause)
        .orderBy(desc(internalSeedSale.createdAt));
    }),

  // Delete an internal seed sale by ID - only Ultra and Raden
  delete: ultraProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(internalSeedSale)
        .where(eq(internalSeedSale.id, input.id));
    }),

  // Update an internal seed sale by ID - Ijo can only edit own records
  update: ijoProcedure
    .input(
      z.object({
        id: z.number(),
        memberId: z.number().min(1),
        seedTypeId: z.number(),
        seedsSold: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.db
        .select({ userId: internalSeedSale.userId })
        .from(internalSeedSale)
        .where(eq(internalSeedSale.id, input.id));

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Internal seed sale not found",
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
      const pricePerSeed = getSeedPriceByRole(
        ctx.user.role as "Raden" | "Ultra" | "Ijo" | "Abu",
      );
      const totalPrice = calculateTotalPrice(input.seedsSold, pricePerSeed);

      const { id, ...data } = input;
      return await ctx.db
        .update(internalSeedSale)
        .set({ ...data, pricePerSeed, totalPrice })
        .where(eq(internalSeedSale.id, id))
        .returning();
    }),

  // Get total seeds sold - filtered for Ijo users
  getTotalSeedsSold: protectedProcedure.query(async ({ ctx }) => {
    const whereClause =
      ctx.user.role === "Ijo"
        ? eq(internalSeedSale.userId, ctx.user.id)
        : undefined;

    const result = await ctx.db
      .select({
        totalSeeds: sql<number>`SUM(${internalSeedSale.seedsSold})`.as(
          "totalSeeds",
        ),
      })
      .from(internalSeedSale)
      .where(whereClause);
    return result[0]?.totalSeeds ?? 0;
  }),
});
