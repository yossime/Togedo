import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TaskStatus } from '@prisma/client';

export const tasksRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { groupId, ...data } = input;
      return ctx.tasksService.createTask(ctx.user.id, groupId, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
    }),

  getGroupTasks: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.tasksService.getGroupTasks(input, ctx.user.id);
    }),

  getUserTasks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.tasksService.getUserTasks(ctx.user.id);
  }),

  getTask: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.tasksService.getTask(input, ctx.user.id);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, 'Title is required').optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        dueDate: z.string().datetime().optional(),
        tags: z.array(z.string()).optional(),
        assigneeId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.tasksService.updateTask(id, ctx.user.id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.tasksService.deleteTask(input, ctx.user.id);
    }),
}); 