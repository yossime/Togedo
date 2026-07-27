import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const groupsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.groupsService.createGroup(ctx.user.id, input.name);
    }),

  getUserGroups: protectedProcedure.query(async ({ ctx }) => {
    return ctx.groupsService.getUserGroups(ctx.user.id);
  }),

  getGroup: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.groupsService.getGroup(input, ctx.user.id);
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        email: z.string().email('Invalid email address'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.groupsService.inviteMember(
        input.groupId,
        ctx.user.id,
        input.email
      );
    }),

  acceptInvite: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.groupsService.acceptInvite(input, ctx.user.id);
    }),

  leaveGroup: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.groupsService.leaveGroup(input, ctx.user.id);
    }),
}); 