import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  radenProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Get all users - only Raden can access
  getAll: radenProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  // Get current user info - all authenticated users can access
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
    };
  }),

  // Update user role - only Raden can access
  updateRole: radenProcedure
    .input(
      z.object({
        userId: z.string(),
        newRole: z.enum(["Abu", "Ijo", "Ultra", "Raden"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent changing own role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role",
        });
      }

      // Check if user exists
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));

      if (!existingUser[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update the user's role
      return ctx.db
        .update(users)
        .set({ role: input.newRole })
        .where(eq(users.id, input.userId))
        .returning();
    }),

  // Get user by ID - only Raden can access
  getById: radenProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, input.userId));

      if (!user[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user[0];
    }),

  // Get user statistics - only Raden can access
  getStats: radenProcedure.query(async ({ ctx }) => {
    const allUsers = await ctx.db.select({ role: users.role }).from(users);

    const stats = {
      total: allUsers.length,
      byRole: {
        Abu: allUsers.filter((u) => u.role === "Abu").length,
        Ijo: allUsers.filter((u) => u.role === "Ijo").length,
        Ultra: allUsers.filter((u) => u.role === "Ultra").length,
        Raden: allUsers.filter((u) => u.role === "Raden").length,
      },
    };

    return stats;
  }),
});
