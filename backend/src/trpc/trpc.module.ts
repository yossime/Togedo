import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  // AuthModule exports the configured JwtModule, so TrpcService verifies
  // tokens with the same secret used to sign them.
  imports: [WebsocketModule, PrismaModule, AuthModule, GroupsModule, TasksModule],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
