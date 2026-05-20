import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { ressourceRouter } from "@/server/api/routers/ressource";
import { progressionRouter } from "@/server/api/routers/progression";
import { adminRouter } from "./routers/admin";
import { commentaireRouter } from "./routers/commentaire";
import { profilRouter } from "./routers/profil";
import { sessionRouter } from "./routers/session";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  ressource: ressourceRouter,
  progression: progressionRouter,
  admin: adminRouter,
  commentaire: commentaireRouter,
  profil: profilRouter,
  session: sessionRouter,
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
