import { router } from './trpc';
import { groupsRouter } from './routers/groups.router';
import { tasksRouter } from './routers/tasks.router';

export const appRouter = router({
  groups: groupsRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter; 