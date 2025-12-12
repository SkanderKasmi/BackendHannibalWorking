import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MonitorService } from './monitor.service';
import { MESSAGE_PATTERNS } from '@app/common/constants';

@Controller()
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @MessagePattern(MESSAGE_PATTERNS.MONITOR.GET_HEALTH)
  async getHealth() {
    return this.monitorService.getHealth();
  }

  @MessagePattern(MESSAGE_PATTERNS.MONITOR.GET_VM_METRICS)
  async getVMMetrics(@Payload() data: { vmId: string; limit?: number }) {
    return this.monitorService.getVMMetrics(data.vmId, data.limit);
  }

  @MessagePattern(MESSAGE_PATTERNS.MONITOR.GET_RESOURCE_GROUP_STATS)
  async getResourceGroupStats(@Payload() data: { resourceGroupId: string }) {
    return this.monitorService.getResourceGroupStats(data.resourceGroupId);
  }

  // @MessagePattern(MESSAGE_PATTERNS.MONITOR.RECORD_METRIC)
  // async recordMetric(@Payload() data: { vmId: string; cpu: number; memory: number; disk: number; network: number }) {
  //   return this.monitorService.recordMetric(data);
  // }

  @MessagePattern('monitor.get_all_stats')
  async getAllStats() {
    return this.monitorService.getAllStats();
  }
}
