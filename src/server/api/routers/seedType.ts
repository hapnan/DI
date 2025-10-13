import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { seedTypes } from "~/server/db/schema";

export const seedTypeRouter = createTRPCRouter({
  // Get all seed types
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(seedTypes).orderBy(seedTypes.name);
  }),

  // Get a seed type by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(seedTypes).where(eq(seedTypes.id, input.id));
    }),

  // Create a new seed type
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        defaultPricePerSeed: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(seedTypes).values(input).returning();
    }),

  // Update a seed type by ID
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        defaultPricePerSeed: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db
        .update(seedTypes)
        .set(data)
        .where(eq(seedTypes.id, id))
        .returning();
    }),

  // Delete a seed type by ID
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(seedTypes).where(eq(seedTypes.id, input.id));
    }),
});
