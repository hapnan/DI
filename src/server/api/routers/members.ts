import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { members } from "~/server/db/schema";

export const membersRouter = createTRPCRouter({
  // Get all members
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(members).orderBy(desc(members.createdAt));
  }),

  // Create a new member
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        createdAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(members).values(input).returning();
    }),

  // Delete a member by ID
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(members).where(eq(members.id, input.id));
    }),

  // Get member by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(members).where(eq(members.id, input.id));
    }),

  // Update member by ID
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(members).set(input).where(eq(members.id, input.id));
    }),

  // Get total number of members
  getTotalCount: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        count: sql`COUNT(*)`.as("count"),
      })
      .from(members);
    return result[0]?.count ?? 0;
  }),
});
