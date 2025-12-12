import { Injectable, OnModuleInit } from '@nestjs/common';
import { ServiceResponse, ResourceGroupStats } from '@app/common/interfaces';
import { KafkaService } from '@libs/common/messaging/kafka.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class MonitorService implements OnModuleInit {
  private readonly alertThresholds = {
    cpuUsage: parseInt(process.env.ALERT_THRESHOLD_CPU || '80', 10),
    memoryUsage: parseInt(process.env.ALERT_THRESHOLD_MEMORY || '85', 10),
    diskUsage: parseInt(process.env.ALERT_THRESHOLD_DISK || '90', 10),
  };

  private readonly metricsAggregationWindow = parseInt(
    process.env.METRICS_AGGREGATION_WINDOW || '3600000',
    10,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  async onModuleInit() {
    try {
      // Ensure Kafka topics exist
      await this.kafkaService.createTopic('vm-metrics');
      await this.kafkaService.createTopic('system-health');
      await this.kafkaService.createTopic('alerts');
    } catch (error) {
      console.error('Failed to initialize topics:', error);
    }
  }

  async getHealth(): Promise<ServiceResponse<any>> {
    try {
      const dbCheck = await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        },
        error: error.message,
      };
    }
  }

  async getVMMetrics(vmId: string, limit: number = 100): Promise<ServiceResponse<any>> {
    try {
      const metrics = await this.prisma.metric.findMany({
        where: { id: vmId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      const vm = await this.prisma.virtualMachine.findUnique({
        where: { id: vmId },
        select: { id: true, name: true, status: true },
      });

      if (!vm) {
        return { success: false, error: 'VM not found' };
      }

      const latestMetric = metrics[0] || null;

      return {
        success: true,
        data: {
          vm,
          latestMetric,
          history: metrics,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getResourceGroupStats(resourceGroupId: string): Promise<ServiceResponse<ResourceGroupStats>> {
    try {
      const resourceGroup = await this.prisma.resourceGroup.findUnique({
        where: { id: resourceGroupId },
        include: {
          virtualMachines: true,
        },
      });

      if (!resourceGroup) {
        return { success: false, error: 'Resource group not found' };
      }

      const stats: ResourceGroupStats = {
        id: resourceGroup.id,
        name: resourceGroup.name,
        totalVMs: resourceGroup.virtualMachines.length,
        runningVMs: resourceGroup.virtualMachines.filter(vm => vm.status === 'RUNNING').length,
        stoppedVMs: resourceGroup.virtualMachines.filter(vm => vm.status === 'STOPPED').length,
        errorVMs: resourceGroup.virtualMachines.filter(vm => vm.status === 'ERROR').length,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // async recordMetric(data: { vmId: string; cpu: number; memory: number; disk: number; network: number }): Promise<ServiceResponse<any>> {
  //   try {
  //     const vm = await this.prisma.virtualMachine.findUnique({
  //       where: { id: data.vmId },
  //     });

  //     if (!vm) {
  //       return { success: false, error: 'VM not found' };
  //     }

  //     const metric = await this.prisma.metric.create({
  //       data: {
  //         id: data.vmId,
  //         cpu: data.cpu,
  //         memory: data.memory,
  //         disk: data.disk,
          
  //         // network: data.network,
  //       },
  //     });

  //     return { success: true, data: metric };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  async getAllStats(): Promise<ServiceResponse<any>> {
    try {
      const resourceGroups = await this.prisma.resourceGroup.findMany({
        include: {
          virtualMachines: true,
        },
      });

      const stats = resourceGroups.map(rg => ({
        id: rg.id,
        name: rg.name,
        totalVMs: rg.virtualMachines.length,
        runningVMs: rg.virtualMachines.filter(vm => vm.status === 'RUNNING').length,
        stoppedVMs: rg.virtualMachines.filter(vm => vm.status === 'STOPPED').length,
        errorVMs: rg.virtualMachines.filter(vm => vm.status === 'ERROR').length,
      }));

      const totalVMs = await this.prisma.virtualMachine.count();
      const runningVMs = await this.prisma.virtualMachine.count({ where: { status: 'RUNNING' } });
      const totalAgents = await this.prisma.agent.count();
      const activeAgents = await this.prisma.agent.count({ where: { status: 'RUNNING' } });

      return {
        success: true,
        data: {
          overview: {
            totalResourceGroups: resourceGroups.length,
            totalVMs,
            runningVMs,
            totalAgents,
            activeAgents,
          },
          resourceGroups: stats,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
