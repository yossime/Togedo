import { INestApplication, Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { GroupsService } from '../groups/groups.service';
import { TasksService } from '../tasks/tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { appRouter } from './router';
import type { Context } from './context';

@Injectable()
export class TrpcService {
  constructor(
    private groupsService: GroupsService,
    private tasksService: TasksService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async createContext({
    req,
    res,
  }: trpcExpress.CreateExpressContextOptions): Promise<Context> {
    // Resolve the user from the Authorization header (if present)
    let user: Context['user'] = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token);

        if (payload.sub) {
          user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
          });
        }
      } catch {
        // Invalid or expired token — request proceeds unauthenticated
      }
    }

    return {
      req,
      res,
      user,
      groupsService: this.groupsService,
      tasksService: this.tasksService,
    };
  }

  applyMiddleware(app: INestApplication) {
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: this.createContext.bind(this),
      }),
    );

    return app;
  }
}
