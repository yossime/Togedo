import type { IncomingMessage, ServerResponse } from 'http';
import type { User } from '@prisma/client';
import type { GroupsService } from '../groups/groups.service';
import type { TasksService } from '../tasks/tasks.service';

/**
 * Shape of the tRPC request context.
 *
 * The context itself is created by `TrpcService.createContext`, which runs
 * inside Nest's DI container so every request reuses the same service and
 * Prisma instances instead of constructing new ones per request.
 */
export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  user: User | null;
  groupsService: GroupsService;
  tasksService: TasksService;
}
