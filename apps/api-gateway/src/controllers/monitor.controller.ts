import { Controller, Get, Post, Body, Param, Query, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MONITOR_SERVICE, MESSAGE_PATTERNS } from '@app/common/constants';
import { Public } from '@app/common/decorators';

@Controller('monitor')
export class MonitorController {
  constructor(
    @Inject(MONITOR_SERVICE) private readonly monitorClient: ClientProxy,
  ) {}

  @Public()
  @Get('health')
  async getHealth() {
    try {
      const result = await firstValueFrom(
        this.monitorClient.send(MESSAGE_PATTERNS.MONITOR.GET_HEALTH, {}),
      );

      return result.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Monitor service unavailable',
      };
    }
  }

  @Get('stats')
  async getAllStats() {
    try {
      const result = await firstValueFrom(
        this.monitorClient.send('monitor.get_all_stats', {}),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('vms/:vmId/metrics')
  async getVMMetrics(@Param('vmId') vmId: string, @Query('limit') limit?: string) {
    try {
      const result = await firstValueFrom(
        this.monitorClient.send(MESSAGE_PATTERNS.MONITOR.GET_VM_METRICS, {
          vmId,
          limit: limit ? parseInt(limit, 10) : 100,
        }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get VM metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('resource-groups/:id/stats')
  async getResourceGroupStats(@Param('id') resourceGroupId: string) {
    try {
      const result = await firstValueFrom(
        this.monitorClient.send(MESSAGE_PATTERNS.MONITOR.GET_RESOURCE_GROUP_STATS, { resourceGroupId }),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.NOT_FOUND);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get resource group stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('metrics')
  async recordMetric(@Body() data: { vmId: string; cpu: number; memory: number; disk: number; network: number }) {
    try {
      const result = await firstValueFrom(
        this.monitorClient.send(MESSAGE_PATTERNS.MONITOR.RECORD_METRIC, data),
      );

      if (!result.success) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return result.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to record metric', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
