import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import * as promClient from 'prom-client';

/**
 * Prometheus Metrics Controller
 * Exposes /metrics endpoint for Prometheus scraping
 */
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(MetricsService) private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }
}
