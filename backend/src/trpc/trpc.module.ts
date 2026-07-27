import { Module } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { TasksService } from '../tasks/tasks.service';
import { TrpcService } from './trpc.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [WebsocketModule, PrismaModule, AuthModule, ConfigModule],
  providers: [TrpcService, GroupsService, TasksService, JwtService, ConfigService],
  exports: [TrpcService],
})
export class TrpcModule {} 