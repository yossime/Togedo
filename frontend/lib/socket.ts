import { io, Socket } from 'socket.io-client';
import { getSession } from 'next-auth/react';

let socket: Socket | null = null;

export async function getSocket() {
  if (!socket) {
    const session = await getSession();
    if (session?.user?.token) {
      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        auth: {
          token: `Bearer ${session.user.token}`,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

// Types for WebSocket events
export interface TaskUpdate {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';
  task?: any;
  taskId?: string;
}

export interface NotificationEvent {
  type: string;
  message: string;
  data?: any;
} 