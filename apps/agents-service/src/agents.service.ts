import { Injectable } from '@nestjs/common';
import { DeployAgentDto, CreateTaskDto, TaskStatus } from '@app/common/dto';
import { ServiceResponse } from '@app/common/interfaces';
import { PrismaService } from './prisma.service';
import { RabbitMQService, RABBITMQ_CONFIG } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService, KAFKA_CONFIG } from '@libs/common/messaging/kafka.service';
import { RABBITMQ_ROUTING_KEYS } from '@app/common/constants';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitMQService,
    private readonly kafka: KafkaService,
  ) {}

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

  async deployScriptsForVM(vmId: string, files: string[]): Promise<void> {
    const vm = await this.prisma.virtualMachine.findUnique({ where: { id: vmId } });
    if (!vm) return;
    let agent = await this.prisma.agent.findFirst({ where: { virtualMachineId: vmId } });
    if (!agent) {
      agent = await this.prisma.agent.create({
        data: { virtualMachineId: vmId, status: 'DEPLOYED', version: '1.0.0' },
      });
    } else {
      await this.prisma.agent.update({ where: { id: agent.id }, data: { status: 'DEPLOYED' } });
    }
    await this.prisma.virtualMachine.update({ where: { id: vmId }, data: { status: 'RUNNING' } });
    await this.rabbitmq.publish(
      RABBITMQ_CONFIG.exchanges.SERVICES,
      RABBITMQ_ROUTING_KEYS.INFRASTRUCTURE_VM_STATUS,
      { vmId, status: 'CONNECTED' },
    );
    await this.kafka.publishMetric(KAFKA_CONFIG.topics.VM_METRICS, vmId, {
      vm_id: vmId,
      timestamp: new Date().toISOString(),
      cpu: { usage_percent: 0 },
      memory: { total: 0, used: 0, free: 0 },
      disk: [],
      network: [],
      processes: { total: 0, top_processes: [] },
      load: { '1min': 0, '5min': 0, '15min': 0 },
      uptime_seconds: 0,
      hostname: vm.name,
      os: vm.os,
      kernel: '',
    });
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
