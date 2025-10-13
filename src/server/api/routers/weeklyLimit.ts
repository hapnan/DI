import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  ultraProcedure,
} from "~/server/api/trpc";
import { sql } from "drizzle-orm";

type WeeklyLimit = {
  id: number;
  groupId: number;
  weekStart: Date;
  totallimit: number;
  usedLimit: number;
  remaininglimit: number;
  carriedOverFromPrevious: number;
};

export const weeklyLimitRouter = createTRPCRouter({
  // Get current week's limit for a group - all authenticated users
  getCurrentLimit: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.execute(
        sql`SELECT * FROM get_or_create_weekly_limit(${input.groupId}, CURRENT_DATE)`,
      );
      const rows = result.rows as WeeklyLimit[];
      return rows[0];
    }),

  // Get all groups' current limits - all authenticated users
  getAllCurrentLimits: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(sql`
      SELECT 
        g.id as "groupId",
        g."groupName",
        wl.*
      FROM "DI_group" g
      LEFT JOIN LATERAL get_or_create_weekly_limit(g.id, CURRENT_DATE) wl ON true
      ORDER BY g.id
    `);
    return result.rows;
  }),

  // Manually trigger rollover for all groups - only Ultra and Raden
  rolloverAllLimits: ultraProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.execute(
      sql`SELECT * FROM rollover_weekly_limits()`,
    );
    return result.rows;
  }),

  // Get limit history for a group - all authenticated users
  getLimitHistory: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.execute(sql`
        SELECT * FROM "DI_weekly_limits"
        WHERE "groupId" = ${input.groupId}
        ORDER BY "weekStart" DESC
        LIMIT 10
      `);
      return result.rows;
    }),
});
