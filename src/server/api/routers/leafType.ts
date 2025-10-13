import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { leafTypes, seedTypes } from "~/server/db/schema";

export const leafTypeRouter = createTRPCRouter({
  // Get all leaf types
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: leafTypes.id,
        name: leafTypes.name,
        description: leafTypes.description,
        defaultPricePerLeaf: leafTypes.defaultPricePerLeaf,
        seedTypeId: leafTypes.seedTypeId,
        seedType: {
          id: seedTypes.id,
          name: seedTypes.name,
        },
        createdAt: leafTypes.createdAt,
        updatedAt: leafTypes.updatedAt,
      })
      .from(leafTypes)
      .innerJoin(seedTypes, eq(leafTypes.seedTypeId, seedTypes.id))
      .orderBy(desc(leafTypes.createdAt));
  }),

  // Get a leaf type by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: leafTypes.id,
          name: leafTypes.name,
          description: leafTypes.description,
          defaultPricePerLeaf: leafTypes.defaultPricePerLeaf,
          seedTypeId: leafTypes.seedTypeId,
          seedType: {
            id: seedTypes.id,
            name: seedTypes.name,
          },
          createdAt: leafTypes.createdAt,
          updatedAt: leafTypes.updatedAt,
        })
        .from(leafTypes)
        .innerJoin(seedTypes, eq(leafTypes.seedTypeId, seedTypes.id))
        .where(eq(leafTypes.id, input.id));

      return result[0];
    }),

  // Create a new leaf type
  create: publicProcedure
    .input(
      z.object({
        name: z.string().max(100),
        description: z.string().max(500).optional(),
        seedTypeId: z.number(),
        defaultPricePerLeaf: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(leafTypes).values(input).returning();
    }),

  // Update a leaf type
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().max(100).optional(),
        description: z.string().max(500).optional(),
        seedTypeId: z.number().optional(),
        defaultPricePerLeaf: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db
        .update(leafTypes)
        .set(data)
        .where(eq(leafTypes.id, id))
        .returning();
    }),

  // Delete a leaf type
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(leafTypes).where(eq(leafTypes.id, input.id));
    }),
});
