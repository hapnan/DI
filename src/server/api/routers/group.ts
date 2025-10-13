import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  ijoProcedure,
  ultraProcedure,
} from "~/server/api/trpc";
import { groups } from "~/server/db/schema";

export const groupRouter = createTRPCRouter({
  // Get all groups - all authenticated users can view
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(groups).orderBy(groups.name);
  }),

  // Create a new group - only Ijo and above
  create: ijoProcedure
    .input(z.object({ name: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(groups)
        .values({
          name: input.name,
        })
        .returning({ id: groups.id });
    }),

  // Get a group by ID - all authenticated users
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(groups).where(eq(groups.id, input.id));
    }),

  // Update a group by ID - only Ultra and Raden
  update: ultraProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db
        .update(groups)
        .set(data)
        .where(eq(groups.id, id))
        .returning();
    }),

  // Delete a group by ID - only Ultra and Raden
  delete: ultraProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(groups).where(eq(groups.id, input.id));
    }),
});
