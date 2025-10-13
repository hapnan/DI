import { postRouter } from "~/server/api/routers/post";
import { groupRouter } from "~/server/api/routers/group";
import { saleRouter } from "~/server/api/routers/sale";
import { leafPurchaseRouter } from "~/server/api/routers/leafPurchase";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { weeklyLimitRouter } from "~/server/api/routers/weeklyLimit";
import { internalSeedRouter } from "~/server/api/routers/internalSeed";
import { membersRouter } from "~/server/api/routers/members";
import { internalLeafRouter } from "~/server/api/routers/internalLeaf";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  group: groupRouter,
  sale: saleRouter,
  leafPurchase: leafPurchaseRouter,
  weeklyLimit: weeklyLimitRouter,
  internalSeed: internalSeedRouter,
  members: membersRouter,
  internalLeaf: internalLeafRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
