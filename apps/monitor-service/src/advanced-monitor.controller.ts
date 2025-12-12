import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { AdvancedMonitorService } from './advanced-monitor.service';

@Controller('monitoring')
export class AdvancedMonitorController {
  private readonly logger = new Logger(AdvancedMonitorController.name);

  constructor(private readonly monitorService: AdvancedMonitorService) {}

  @Get('health')
  async getHealth() {
    return { status: 'healthy', timestamp: new Date() };
  }

  @Get('metrics/:vmId')
  async getMetrics(
    @Query('vmId') vmId: string,
    @Query('limit') limit: number = 100,
  ): Promise<any[]> {
    return this.monitorService.getVMMetrics(vmId, limit);
  }

  @Get('aggregation/:vmId')
  async getAggregation(
    @Query('vmId') vmId: string,
    @Query('timeRange') timeRange: number = 3600000,
  ): Promise<any> {
    return this.monitorService.getMetricsAggregation(vmId, timeRange);
  }

  @Get('vms')
  async getActiveVMs(): Promise<string[]> {
    return this.monitorService.getActiveVMs();
  }

  @Get('report')
  async getHealthReport(): Promise<any> {
    return this.monitorService.generateHealthReport();
  }

  @Post('thresholds')
  async updateThresholds(@Body() thresholds: any) {
    this.logger.log('Alert thresholds updated:', thresholds);
    return { success: true };
  }
}
