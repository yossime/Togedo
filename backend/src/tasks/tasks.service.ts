import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, MemberRole } from '@prisma/client';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async createTask(
    userId: string,
    groupId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: Date;
      tags?: string[];
    },
  ) {
    // Check if user is a member of the group
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    const task = await this.prisma.task.create({
      data: {
        ...data,
        group: { connect: { id: groupId } },
        creator: { connect: { id: userId } },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        group: true,
      },
    });

    // Notify group members about new task
    this.websocketGateway.emitTaskUpdate(groupId, {
      type: 'TASK_CREATED',
      task,
    });

    // Create notifications for group members
    const groupMembers = await this.prisma.membership.findMany({
      where: { groupId },
      select: { userId: true },
    });

    await this.prisma.notification.createMany({
      data: groupMembers.map(member => ({
        userId: member.userId,
        type: 'NEW_TASK',
        taskId: task.id,
      })),
    });

    return task;
  }

  async getTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.group.members.length) {
      throw new ForbiddenException('Not a member of this group');
    }

    return task;
  }

  async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      dueDate?: Date;
      tags?: string[];
      assigneeId?: string | null;
    },
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        group: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.group.members.length) {
      throw new ForbiddenException('Not a member of this group');
    }

    // Only managers or task creator can update task details
    if (
      task.createdById !== userId &&
      task.group.members[0].role !== MemberRole.MANAGER
    ) {
      throw new ForbiddenException('Not authorized to update this task');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notify group members about task update
    this.websocketGateway.emitTaskUpdate(task.groupId, {
      type: 'TASK_UPDATED',
      task: updatedTask,
    });

    // Create notification if task is assigned
    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      await this.prisma.notification.create({
        data: {
          userId: data.assigneeId,
          type: 'TASK_CLAIMED',
          taskId: task.id,
        },
      });
    }

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        group: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.group.members.length) {
      throw new ForbiddenException('Not a member of this group');
    }

    // Only managers or task creator can delete tasks
    if (
      task.createdById !== userId &&
      task.group.members[0].role !== MemberRole.MANAGER
    ) {
      throw new ForbiddenException('Not authorized to delete this task');
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { archived: true },
    });

    // Notify group members about task deletion
    this.websocketGateway.emitTaskUpdate(task.groupId, {
      type: 'TASK_DELETED',
      taskId,
    });

    return { success: true };
  }

  async getGroupTasks(groupId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    return this.prisma.task.findMany({
      where: {
        groupId,
        archived: false,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        OR: [
          { createdById: userId },
          { assigneeId: userId },
        ],
        archived: false,
      },
      include: {
        group: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
} 