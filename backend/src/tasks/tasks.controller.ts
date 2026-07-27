import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { TaskStatus } from '@prisma/client';

// Zod schemas for validation
const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  assigneeId: z.string().nullable().optional(),
});

// DTOs
export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('group/:groupId')
  @ApiOperation({ summary: 'Create a new task in a group' })
  async createTask(
    @Req() req,
    @Param('groupId') groupId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(req.user.id, groupId, {
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get all tasks in a group' })
  async getGroupTasks(@Req() req, @Param('groupId') groupId: string) {
    return this.tasksService.getGroupTasks(groupId, req.user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all tasks for the current user' })
  async getUserTasks(@Req() req) {
    return this.tasksService.getUserTasks(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  async getTask(@Req() req, @Param('id') id: string) {
    return this.tasksService.getTask(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @Req() req,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(id, req.user.id, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Req() req, @Param('id') id: string) {
    return this.tasksService.deleteTask(id, req.user.id);
  }
} 