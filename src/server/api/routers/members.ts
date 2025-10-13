import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  ijoProcedure,
  ultraProcedure,
} from "~/server/api/trpc";
import { members } from "~/server/db/schema";

export const membersRouter = createTRPCRouter({
  // Get all members - all authenticated users can view
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(members).orderBy(desc(members.createdAt));
  }),

  // Create a new member - only Ijo and above
  create: ijoProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        createdAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(members).values(input).returning();
    }),

  // Delete a member by ID - only Ultra and Raden
  delete: ultraProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(members).where(eq(members.id, input.id));
    }),

  // Get member by ID - all authenticated users
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(members).where(eq(members.id, input.id));
    }),

  // Update member by ID - only Ultra and Raden
  update: ultraProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(members).set(input).where(eq(members.id, input.id));
    }),

  // Get total number of members - all authenticated users
  getTotalCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        count: sql`COUNT(*)`.as("count"),
      })
      .from(members);
    return result[0]?.count ?? 0;
  }),
});
