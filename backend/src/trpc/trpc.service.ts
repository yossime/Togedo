import { INestApplication, Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { GroupsService } from '../groups/groups.service';
import { TasksService } from '../tasks/tasks.service';
import { appRouter } from './router';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrpcService {
  constructor(
    private groupsService: GroupsService,
    private tasksService: TasksService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async createContext({
    req,
    res,
  }: trpcExpress.CreateExpressContextOptions): Promise<{
    req: any;
    res: any;
    user: any;
    groupsService: GroupsService;
    tasksService: TasksService;
  }> {
    // Get the user from the authorization header
    let user: any = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('jwt.secret') || process.env.JWT_SECRET || 'default_development_secret_key_do_not_use_in_production'
        });
        
        // Fetch the user from database using the sub (user id) from the payload
        if (payload.sub) {
          user = await this.prisma.user.findUnique({
            where: { id: payload.sub }
          });
        }
      } catch (error) {
        console.error('JWT verification error:', error.message);
        // Invalid token, user remains null
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
    const createContext = this.createContext.bind(this);
    
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
      }),
    );
    
    return app;
  }
} 