import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { groups } from "~/server/db/schema";

export const groupRouter = createTRPCRouter({
  // Get all groups
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(groups).orderBy(groups.name);
  }),

  // Create a new group
  create: publicProcedure
    .input(z.object({ name: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .insert(groups)
        .values({
          name: input.name,
        })
        .returning({ id: groups.id });
    }),

  // Get a group by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(groups).where(eq(groups.id, input.id));
    }),
});
