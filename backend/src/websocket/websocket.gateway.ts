import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();
  private socketUser: Map<string, string> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException();
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store socket mapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.socketUser.set(client.id, userId);

      // Join user's room
      client.join(`user:${userId}`);
      
      // Join rooms for user's groups
      // This will be handled when user joins/creates groups
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);
    if (userId) {
      const userSockets = this.userSockets.get(userId);
      userSockets?.delete(client.id);
      if (userSockets?.size === 0) {
        this.userSockets.delete(userId);
      }
      this.socketUser.delete(client.id);
    }
  }

  // Emit task updates to group members
  emitTaskUpdate(groupId: string, taskData: any) {
    this.server.to(`group:${groupId}`).emit('taskUpdate', taskData);
  }

  // Emit group updates to members
  emitGroupUpdate(groupId: string, groupData: any) {
    this.server.to(`group:${groupId}`).emit('groupUpdate', groupData);
  }

  // Emit notifications to specific user
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Handle user joining a group
  async handleUserJoinGroup(userId: string, groupId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        socket?.join(`group:${groupId}`);
      }
    }
  }

  // Handle user leaving a group
  async handleUserLeaveGroup(userId: string, groupId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        socket?.leave(`group:${groupId}`);
      }
    }
  }
} 