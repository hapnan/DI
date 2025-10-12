import { postRouter } from "~/server/api/routers/post";
import { groupRouter } from "~/server/api/routers/group";
import { saleRouter } from "~/server/api/routers/sale";
import { leafPurchaseRouter } from "~/server/api/routers/leafPurchase";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { weeklyLimitRouter } from "~/server/api/routers/weeklyLimit";

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
