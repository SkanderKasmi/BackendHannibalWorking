import { Injectable } from '@nestjs/common';
import { DeployAgentDto, CreateTaskDto, TaskStatus } from '@app/common/dto';
import { ServiceResponse } from '@app/common/interfaces';
import { PrismaService } from './prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async deployAgent(dto: DeployAgentDto): Promise<ServiceResponse<any>> {
    try {
      const vm = await this.prisma.virtualMachine.findUnique({
        where: { id: dto.vmId },
      });

      if (!vm) {
        return { success: false, error: 'VM not found' };
      }

      const existingAgent = await this.prisma.agent.findFirst({
        where: { virtualMachineId: dto.vmId },
      });

      if (existingAgent) {
        return { success: false, error: 'Agent already deployed on this VM' };
      }

      const agent = await this.prisma.agent.create({
        data: {
          virtualMachineId: dto.vmId,
          status: 'PENDING',
          version: '1.0.0',
        },
      });

      return {
        success: true,
        data: agent,
        message: 'Agent deployment initiated. Scripts will be deployed: producer.sh, info.sh, log.sh, connectivity.sh',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // async getAgents(vmId?: string): Promise<ServiceResponse<any[]>> {
  //   try {
  //     const where = vmId ? { vmId } : {};
  //     const agents = await this.prisma.agent.findMany({
  //       where,
  //       include: {
  //         virtualMachine: {
  //           select: { id: true, name: true, status: true },
  //         },
          
  //       },
  //     });

  //     return { success: true, data: agents };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  async getAgent(id: string): Promise<ServiceResponse<any>> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
        include: {
          virtualMachine: true,
        
        },
      });

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      return { success: true, data: agent };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createTask(dto: CreateTaskDto): Promise<ServiceResponse<any>> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: dto.agentId },
      });

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      if (agent.status !== 'RUNNING' && agent.status !== 'DEPLOYED') {
        return { success: false, error: 'Agent is not available to execute tasks' };
      }

      const task = await this.prisma.agentTask.create({
        data: {
          agentId: dto.agentId,
          type: dto.type,
          command: dto.command,
          script: dto.script,
          status: TaskStatus.PENDING,
        },
      });

      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTasks(agentId: string): Promise<ServiceResponse<any[]>> {
    try {
      const tasks = await this.prisma.agentTask.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAgentStatus(id: string): Promise<ServiceResponse<any>> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
        include: {
          virtualMachine: {
            select: { id: true, name: true, status: true },
          },
        },
      });

      if (!agent) {
        return { success: false, error: 'Agent not found' };
      }

      const pendingTasks = await this.prisma.agentTask.count({
        where: { agentId: id, status: TaskStatus.PENDING },
      });

      const runningTasks = await this.prisma.agentTask.count({
        where: { agentId: id, status: TaskStatus.RUNNING },
      });

      return {
        success: true,
        data: {
          agent,
          pendingTasks,
          runningTasks,
          // lastPing: agent.lastPing,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
