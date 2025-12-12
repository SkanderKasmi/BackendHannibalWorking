import { Controller, Get, Post, Body, Param, Query, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AGENTS_SERVICE, MESSAGE_PATTERNS } from '@app/common/constants';
import { DeployAgentDto, CreateTaskDto } from '@app/common/dto';

@Controller('agents')
export class AgentsController {
  constructor(
    @Inject(AGENTS_SERVICE) private readonly agentsClient: ClientProxy,
  ) {}

  @Post('deploy')
  async deployAgent(@Body() dto: DeployAgentDto) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.DEPLOY_AGENT, dto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to deploy agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getAgents(@Query('vmId') vmId?: string) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.GET_AGENTS, { vmId }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get agents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getAgent(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.GET_AGENT, { id }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/status')
  async getAgentStatus(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.GET_AGENT_STATUS, { id }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get agent status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('tasks')
  async createTask(@Body() dto: CreateTaskDto) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.CREATE_TASK, dto),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create task', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/tasks')
  async getTasks(@Param('id') agentId: string) {
    try {
      const result = await firstValueFrom(
        this.agentsClient.send(MESSAGE_PATTERNS.AGENTS.GET_TASKS, { agentId }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get tasks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
