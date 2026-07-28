import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import {
  GroupsService,
  MAX_GROUP_MEMBERS,
  INVITE_TOKEN_TTL_MS,
} from './groups.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const prisma = {
    group: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    inviteToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const groupWithMembers = (
    members: { userId: string; role: MemberRole }[],
    overrides: Record<string, unknown> = {},
  ) => ({
    id: 'group-1',
    name: 'Team',
    ownerId: 'owner-1',
    members,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [GroupsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(GroupsService);
  });

  describe('inviteMember', () => {
    it('rejects invites from non-manager members', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([{ userId: 'member-1', role: MemberRole.MEMBER }]),
      );

      await expect(
        service.inviteMember('group-1', 'member-1', 'new@example.com'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.inviteToken.create).not.toHaveBeenCalled();
    });

    it('rejects invites when the group is at the member limit', async () => {
      const members = Array.from({ length: MAX_GROUP_MEMBERS }, (_, i) => ({
        userId: `member-${i}`,
        role: i === 0 ? MemberRole.MANAGER : MemberRole.MEMBER,
      }));
      prisma.group.findUnique.mockResolvedValue(groupWithMembers(members));

      await expect(
        service.inviteMember('group-1', 'member-0', 'new@example.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects invites for emails without an account', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([{ userId: 'manager-1', role: MemberRole.MANAGER }]),
      );
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.inviteMember('group-1', 'manager-1', 'ghost@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects invites for users who are already members', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([
          { userId: 'manager-1', role: MemberRole.MANAGER },
          { userId: 'member-2', role: MemberRole.MEMBER },
        ]),
      );
      prisma.user.findUnique.mockResolvedValue({ id: 'member-2' });

      await expect(
        service.inviteMember('group-1', 'manager-1', 'member2@example.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a cryptographically random token that expires in 7 days', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([{ userId: 'manager-1', role: MemberRole.MANAGER }]),
      );
      prisma.user.findUnique.mockResolvedValue({ id: 'invitee-1' });
      prisma.inviteToken.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'invite-1', ...data }),
      );

      const before = Date.now();
      const invite = await service.inviteMember(
        'group-1',
        'manager-1',
        'invitee@example.com',
      );

      // 32 random bytes hex-encoded, not Math.random()
      expect(invite.token).toMatch(/^[0-9a-f]{64}$/);
      expect(invite.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + INVITE_TOKEN_TTL_MS,
      );
    });

    it('generates a unique token per invite', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([{ userId: 'manager-1', role: MemberRole.MANAGER }]),
      );
      prisma.user.findUnique.mockResolvedValue({ id: 'invitee-1' });
      prisma.inviteToken.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'invite-1', ...data }),
      );

      const first = await service.inviteMember(
        'group-1',
        'manager-1',
        'a@example.com',
      );
      const second = await service.inviteMember(
        'group-1',
        'manager-1',
        'b@example.com',
      );

      expect(first.token).not.toEqual(second.token);
    });
  });

  describe('acceptInvite', () => {
    const validInvite = () => ({
      id: 'invite-1',
      token: 'token-value',
      used: false,
      expiresAt: new Date(Date.now() + 1000 * 60),
      groupId: 'group-1',
      group: { id: 'group-1', name: 'Team' },
    });

    it('rejects unknown tokens', async () => {
      prisma.inviteToken.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvite('nope', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects already-used tokens', async () => {
      prisma.inviteToken.findUnique.mockResolvedValue({
        ...validInvite(),
        used: true,
      });

      await expect(
        service.acceptInvite('token-value', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects expired tokens', async () => {
      prisma.inviteToken.findUnique.mockResolvedValue({
        ...validInvite(),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.acceptInvite('token-value', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds the user as MEMBER and consumes the token atomically', async () => {
      const invite = validInvite();
      prisma.inviteToken.findUnique.mockResolvedValue(invite);
      prisma.$transaction.mockResolvedValue([]);

      const group = await service.acceptInvite('token-value', 'user-1');

      expect(group).toBe(invite.group);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          groupId: 'group-1',
          role: MemberRole.MEMBER,
        },
      });
      expect(prisma.inviteToken.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { used: true },
      });
    });
  });

  describe('leaveGroup', () => {
    it('prevents the owner from leaving their own group', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([{ userId: 'owner-1', role: MemberRole.MANAGER }]),
      );

      await expect(service.leaveGroup('group-1', 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.membership.deleteMany).not.toHaveBeenCalled();
    });

    it('removes the membership for a regular member', async () => {
      prisma.group.findUnique.mockResolvedValue(
        groupWithMembers([
          { userId: 'owner-1', role: MemberRole.MANAGER },
          { userId: 'member-2', role: MemberRole.MEMBER },
        ]),
      );
      prisma.membership.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.leaveGroup('group-1', 'member-2');

      expect(result).toEqual({ success: true });
      expect(prisma.membership.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'group-1', userId: 'member-2' },
      });
    });
  });
});
