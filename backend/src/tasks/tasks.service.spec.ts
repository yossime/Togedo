import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

describe('TasksService', () => {
  let service: TasksService;

  const prisma = {
    membership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const websocketGateway = {
    emitTaskUpdate: jest.fn(),
  };

  const taskInGroup = (overrides: Record<string, unknown> = {}) => ({
    id: 'task-1',
    title: 'Fix the bug',
    status: TaskStatus.OPEN,
    groupId: 'group-1',
    createdById: 'creator-1',
    assigneeId: null,
    group: { id: 'group-1', members: [] as { role: MemberRole }[] },
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: WebsocketGateway, useValue: websocketGateway },
      ],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  describe('createTask', () => {
    it('rejects users that are not members of the group', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        service.createTask('outsider-1', 'group-1', { title: 'Sneaky task' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('creates the task, notifies members, and emits a realtime event', async () => {
      const created = taskInGroup();
      prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
      prisma.task.create.mockResolvedValue(created);
      prisma.membership.findMany.mockResolvedValue([
        { userId: 'creator-1' },
        { userId: 'member-2' },
      ]);
      prisma.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createTask('creator-1', 'group-1', {
        title: 'Fix the bug',
      });

      expect(result).toBe(created);
      expect(websocketGateway.emitTaskUpdate).toHaveBeenCalledWith('group-1', {
        type: 'TASK_CREATED',
        task: created,
      });
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'creator-1', type: 'NEW_TASK', taskId: 'task-1' },
          { userId: 'member-2', type: 'NEW_TASK', taskId: 'task-1' },
        ],
      });
    });
  });

  describe('getTask', () => {
    it('throws NotFound for a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.getTask('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects users outside the task group', async () => {
      prisma.task.findUnique.mockResolvedValue(taskInGroup());

      await expect(service.getTask('task-1', 'outsider-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateTask', () => {
    it('rejects a plain member who is not the task creator', async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MEMBER }] },
        }),
      );

      await expect(
        service.updateTask('task-1', 'member-2', { title: 'Hijacked' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('allows the task creator to update their task', async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MEMBER }] },
        }),
      );
      const updated = taskInGroup({ title: 'Renamed' });
      prisma.task.update.mockResolvedValue(updated);

      const result = await service.updateTask('task-1', 'creator-1', {
        title: 'Renamed',
      });

      expect(result).toBe(updated);
      expect(websocketGateway.emitTaskUpdate).toHaveBeenCalledWith('group-1', {
        type: 'TASK_UPDATED',
        task: updated,
      });
    });

    it("allows a group manager to update another member's task", async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MANAGER }] },
        }),
      );
      prisma.task.update.mockResolvedValue(taskInGroup());

      await expect(
        service.updateTask('task-1', 'manager-1', {
          status: TaskStatus.DONE,
        }),
      ).resolves.toBeDefined();
    });

    it('notifies the new assignee when the task is claimed', async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MANAGER }] },
        }),
      );
      prisma.task.update.mockResolvedValue(taskInGroup());
      prisma.notification.create.mockResolvedValue({ id: 'notification-1' });

      await service.updateTask('task-1', 'manager-1', {
        assigneeId: 'member-2',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'member-2',
          type: 'TASK_CLAIMED',
          taskId: 'task-1',
        },
      });
    });
  });

  describe('deleteTask', () => {
    it('rejects a plain member who is not the task creator', async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MEMBER }] },
        }),
      );

      await expect(service.deleteTask('task-1', 'member-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('archives the task instead of hard-deleting it', async () => {
      prisma.task.findUnique.mockResolvedValue(
        taskInGroup({
          group: { id: 'group-1', members: [{ role: MemberRole.MEMBER }] },
        }),
      );
      prisma.task.update.mockResolvedValue(taskInGroup({ archived: true }));

      const result = await service.deleteTask('task-1', 'creator-1');

      expect(result).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { archived: true },
      });
      expect(websocketGateway.emitTaskUpdate).toHaveBeenCalledWith('group-1', {
        type: 'TASK_DELETED',
        taskId: 'task-1',
      });
    });
  });

  describe('getGroupTasks', () => {
    it('rejects users that are not members of the group', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        service.getGroupTasks('group-1', 'outsider-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns only non-archived tasks of the group', async () => {
      prisma.membership.findUnique.mockResolvedValue({ id: 'membership-1' });
      prisma.task.findMany.mockResolvedValue([taskInGroup()]);

      await service.getGroupTasks('group-1', 'creator-1');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: 'group-1', archived: false },
        }),
      );
    });
  });
});
