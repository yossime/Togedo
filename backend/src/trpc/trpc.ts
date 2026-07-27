import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
export const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const router = t.router;
export const procedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed) as unknown as typeof t.procedure; 