import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { internalSeedSale, members, seedTypes } from "~/server/db/schema";

export const internalSeedRouter = createTRPCRouter({
  // Get all internal seed sales with member information
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: internalSeedSale.id,
        seedsSold: internalSeedSale.seedsSold,
        pricePerSeed: internalSeedSale.pricePerSeed,
        totalPrice: internalSeedSale.totalPrice,
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
      .orderBy(desc(internalSeedSale.createdAt));
  }),

  // Create a new internal seed sale
  create: publicProcedure
    .input(
      z.object({
        memberId: z.number().min(1),
        seedTypeId: z.number(),
        seedsSold: z.number().min(0),
        pricePerSeed: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(internalSeedSale)
        .values({ ...input })
        .returning();
    }),

  // Get internal seed sales by member ID
  getByMemberId: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(internalSeedSale)
        .where(eq(internalSeedSale.memberId, input.memberId))
        .orderBy(desc(internalSeedSale.createdAt));
    }),

  // Delete an internal seed sale by ID
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .delete(internalSeedSale)
        .where(eq(internalSeedSale.id, input.id));
    }),

  // Update an internal seed sale by ID
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        memberId: z.number().min(1),
        seedTypeId: z.number(),
        seedsSold: z.number().min(0),
        pricePerSeed: z.number().min(0).optional(),
        totalPrice: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db
        .update(internalSeedSale)
        .set(data)
        .where(eq(internalSeedSale.id, id))
        .returning();
    }),

  //get total seeds sold
  getTotalSeedsSold: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        totalSeeds: sql<number>`SUM(${internalSeedSale.seedsSold})`.as(
          "totalSeeds",
        ),
      })
      .from(internalSeedSale);
    return result[0]?.totalSeeds ?? 0;
  }),
});
