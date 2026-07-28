import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Zod schemas for validation
const CreateGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// DTOs
export class CreateGroupDto extends createZodDto(CreateGroupSchema) {}
export class InviteMemberDto extends createZodDto(InviteMemberSchema) {}

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  async createGroup(@Req() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, createGroupDto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups for the current user' })
  async getUserGroups(@Req() req) {
    return this.groupsService.getUserGroups(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific group' })
  async getGroup(@Req() req, @Param('id') id: string) {
    return this.groupsService.getGroup(id, req.user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a member to the group' })
  async inviteMember(
    @Req() req,
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.groupsService.inviteMember(id, req.user.id, inviteMemberDto.email);
  }

  @Post('invite/:token')
  @ApiOperation({ summary: 'Accept a group invitation' })
  async acceptInvite(@Req() req, @Param('token') token: string) {
    return this.groupsService.acceptInvite(token, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(@Req() req, @Param('id') id: string) {
    return this.groupsService.leaveGroup(id, req.user.id);
  }
} 