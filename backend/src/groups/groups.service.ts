import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, name: string) {
    return this.prisma.group.create({
      data: {
        name,
        owner: { connect: { id: userId } },
        members: {
          create: {
            userId,
            role: MemberRole.MANAGER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          where: { archived: false },
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members.find(m => m.user.id === userId);
    if (!membership) {
      throw new ForbiddenException('Not a member of this group');
    }

    return group;
  }

  async getUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        archived: false,
      },
      include: {
        _count: {
          select: {
            members: true,
            tasks: {
              where: {
                archived: false,
              },
            },
          },
        },
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async inviteMember(groupId: string, inviterId: string, email: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const inviterMembership = group.members.find(m => m.userId === inviterId);
    if (!inviterMembership || inviterMembership.role !== MemberRole.MANAGER) {
      throw new ForbiddenException('Only managers can invite members');
    }

    if (group.members.length >= 15) {
      throw new ForbiddenException('Group has reached maximum member limit');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (group.members.some(m => m.userId === user.id)) {
      throw new ForbiddenException('User is already a member');
    }

    const token = await this.prisma.inviteToken.create({
      data: {
        token: Math.random().toString(36).substring(2, 15),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        group: { connect: { id: groupId } },
      },
    });

    // In a real app, we would send an email here
    return token;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      throw new NotFoundException('Invalid or expired invite');
    }

    await this.prisma.$transaction([
      this.prisma.membership.create({
        data: {
          userId,
          groupId: invite.groupId,
          role: MemberRole.MEMBER,
        },
      }),
      this.prisma.inviteToken.update({
        where: { id: invite.id },
        data: { used: true },
      }),
    ]);

    return invite.group;
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId === userId) {
      throw new ForbiddenException('Group owner cannot leave the group');
    }

    await this.prisma.membership.deleteMany({
      where: {
        groupId,
        userId,
      },
    });

    return { success: true };
  }
} 