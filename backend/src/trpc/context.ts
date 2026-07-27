import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from '../groups/groups.service';
import { TasksService } from '../tasks/tasks.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { ConfigService } from '@nestjs/config';

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<{
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: any | null;
  prisma: PrismaService;
  groupsService: GroupsService;
  tasksService: TasksService;
}> {
  const jwtSecret = process.env.JWT_SECRET || 'default_development_secret_key_do_not_use_in_production';
  const jwtService = new JwtService({ secret: jwtSecret });
  const prisma = new PrismaService();
  const websocketGateway = new WebsocketGateway(jwtService);
  const groupsService = new GroupsService(prisma);
  const tasksService = new TasksService(prisma, websocketGateway);

  let user: any = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const payload = jwtService.verify(token);
      user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
    } catch (error) {
      // Invalid token
    }
  }

  return {
    req,
    res,
    user,
    prisma,
    groupsService,
    tasksService,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>; 