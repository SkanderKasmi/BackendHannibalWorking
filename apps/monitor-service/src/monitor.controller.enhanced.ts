import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { KafkaService, VMMetric } from '@app/common/messaging/kafka.service';

/**
 * Enhanced Monitoring Service Controller
 * Handles VM metrics collection, aggregation, and dashboard data
 */
@Controller('monitor')
export class MonitorController {
  private readonly logger = new Logger(MonitorController.name);
  private metricsBuffer: Map<string, VMMetric[]> = new Map();

  constructor(private kafkaService: KafkaService) {
    this.initializeMetricsCollection();
  }

  /**
   * Initialize metrics collection from Kafka
   */
  private initializeMetricsCollection(): void {
    this.kafkaService
      .subscribeToMetrics('vm-metrics', 'monitor-service-group', (metric: VMMetric) =>
        this.processMetric(metric),
      )
      .catch((error) => {
        this.logger.error('Failed to initialize metrics collection:', error);
      });
  }

  /**
   * Process incoming metric
   */
  private async processMetric(metric: VMMetric): Promise<void> {
    const { vm_id } = metric;

    // Store in buffer for aggregation
    if (!this.metricsBuffer.has(vm_id)) {
      this.metricsBuffer.set(vm_id, []);
    }

    const buffer = this.metricsBuffer.get(vm_id)!;
    buffer.push(metric);

    // Keep only last 1000 metrics per VM
    if (buffer.length > 1000) {
      buffer.shift();
    }

    this.logger.debug(`Processed metric for VM: ${vm_id}`);
  }

  /**
   * GET /monitor/health
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metricsBuffered: this.metricsBuffer.size,
    };
  }

  /**
   * GET /monitor/vms
   * Get list of all VMs with latest metrics
   */
  @Get('vms')
  async getAllVMs() {
    const vms = Array.from(this.metricsBuffer.entries()).map(([vmId, metrics]) => {
      const latest = metrics[metrics.length - 1];
      return {
        vm_id: vmId,
        latest_metric: latest,
        total_readings: metrics.length,
      };
    });

    return {
      total_vms: vms.length,
      vms,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /monitor/vms/:vm-id
   * Get detailed metrics for specific VM
   */
  @Get('vms/:vm_id')
  async getVMMetrics(
    @Param('vm_id') vmId: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    const metrics = this.metricsBuffer.get(vmId) || [];

    const paginated = metrics.slice(offset, offset + limit);

    if (paginated.length === 0) {
      return {
        vm_id: vmId,
        metrics: [],
        total: 0,
        limit,
        offset,
      };
    }

    // Calculate aggregates
    const aggregates = this.calculateAggregates(paginated);

    return {
      vm_id: vmId,
      metrics: paginated,
      aggregates,
      total: metrics.length,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /monitor/vms/:vm-id/dashboard
   * Get comprehensive dashboard data for VM
   */
  @Get('vms/:vm_id/dashboard')
  async getVMDashboard(@Param('vm_id') vmId: string) {
    const metrics = this.metricsBuffer.get(vmId) || [];

    if (metrics.length === 0) {
      return {
        vm_id: vmId,
        status: 'no_data',
        message: 'No metrics available for this VM',
      };
    }

    const latest = metrics[metrics.length - 1];
    const hourAgoMetrics = metrics.filter((m) => {
      const metricTime = new Date(m.timestamp).getTime();
      const oneHourAgo = Date.now() - 3600000;
      return metricTime > oneHourAgo;
    });

    return {
      vm_id: vmId,
      hostname: latest.hostname,
      os: latest.os,
      kernel: latest.kernel,
      uptime: this.formatUptime(latest.uptime_seconds),
      status: this.determineStatus(latest),
      
      // CPU Section
      cpu: {
        current: `${latest.cpu.usage_percent.toFixed(2)}%`,
        average: `${this.calculateAverage(metrics.map((m) => m.cpu.usage_percent)).toFixed(2)}%`,
        peak: `${Math.max(...metrics.map((m) => m.cpu.usage_percent)).toFixed(2)}%`,
        trend: this.calculateTrend(
          metrics.slice(-10).map((m) => m.cpu.usage_percent),
        ),
      },

      // Memory Section
      memory: {
        used_mb: (latest.memory.used / 1024 / 1024).toFixed(2),
        total_mb: (latest.memory.total / 1024 / 1024).toFixed(2),
        usage_percent: (
          (latest.memory.used / latest.memory.total) *
          100
        ).toFixed(2),
        available_mb: ((latest.memory.available || 0) / 1024 / 1024).toFixed(2),
      },

      // Disk Section
      disk: latest.disk.map((disk) => ({
        filesystem: disk.filesystem,
        mount: disk.mount,
        usage_percent: ((disk.used / disk.total) * 100).toFixed(2),
        used_gb: (disk.used / 1024 / 1024 / 1024).toFixed(2),
        total_gb: (disk.total / 1024 / 1024 / 1024).toFixed(2),
      })),

      // Network Section
      network: this.aggregateNetworkStats(latest.network),

      // Load Section
      load: {
        '1min': latest.load['1min'].toFixed(2),
        '5min': latest.load['5min'].toFixed(2),
        '15min': latest.load['15min'].toFixed(2),
        average: (
          (latest.load['1min'] + latest.load['5min'] + latest.load['15min']) /
          3
        ).toFixed(2),
      },

      // Process Section
      processes: {
        total: latest.processes.total,
        top_5: latest.processes.top_processes.slice(0, 5),
      },

      // Temperature
      temperature: latest.temperature_celsius
        ? `${latest.temperature_celsius.toFixed(2)}°C`
        : 'N/A',

      // Historical Data
      hourly_trend: {
        cpu_average: `${this.calculateAverage(
          hourAgoMetrics.map((m) => m.cpu.usage_percent),
        ).toFixed(2)}%`,
        memory_average: `${this.calculateAverage(
          hourAgoMetrics.map((m) => (m.memory.used / m.memory.total) * 100),
        ).toFixed(2)}%`,
        readings_count: hourAgoMetrics.length,
      },

      // Alerts
      alerts: this.generateAlerts(latest),

      // Metadata
      metadata: {
        last_update: latest.timestamp,
        total_readings: metrics.length,
        reading_period: `${((Date.now() - new Date(metrics[0].timestamp).getTime()) / 1000 / 60).toFixed(2)} minutes`,
      },
    };
  }

  /**
   * GET /monitor/alerts
   * Get current alerts
   */
  @Get('alerts')
  async getAlerts(
    @Query('vm_id') vmId?: string,
    @Query('severity') severity?: 'critical' | 'warning' | 'info',
  ) {
    const allAlerts: any[] = [];

    if (vmId) {
      const metrics = this.metricsBuffer.get(vmId) || [];
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        allAlerts.push(...this.generateAlerts(latest));
      }
    } else {
      // Get all alerts from all VMs
      this.metricsBuffer.forEach((metrics) => {
        if (metrics.length > 0) {
          allAlerts.push(...this.generateAlerts(metrics[metrics.length - 1]));
        }
      });
    }

    const filtered = severity
      ? allAlerts.filter((alert) => alert.severity === severity)
      : allAlerts;

    return {
      total_alerts: filtered.length,
      alerts: filtered,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /monitor/metrics
   * Manually publish metrics (for testing)
   */
  @Post('metrics')
  @HttpCode(HttpStatus.CREATED)
  async publishMetric(@Body() metric: VMMetric) {
    try {
      await this.kafkaService.publishMetric('vm-metrics', metric.vm_id, metric);
      this.processMetric(metric);

      return {
        message: 'Metric published successfully',
        vm_id: metric.vm_id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to publish metric:', error);
      throw error;
    }
  }

  /**
   * Calculate aggregates from metrics
   */
  private calculateAggregates(metrics: VMMetric[]) {
    if (metrics.length === 0) return null;

    const cpuValues = metrics.map((m) => m.cpu.usage_percent);
    const memoryUsagePercent = metrics.map(
      (m) => (m.memory.used / m.memory.total) * 100,
    );

    return {
      cpu: {
        min: Math.min(...cpuValues).toFixed(2),
        max: Math.max(...cpuValues).toFixed(2),
        average: this.calculateAverage(cpuValues).toFixed(2),
        std_dev: this.calculateStdDev(cpuValues).toFixed(2),
      },
      memory: {
        min: Math.min(...memoryUsagePercent).toFixed(2),
        max: Math.max(...memoryUsagePercent).toFixed(2),
        average: this.calculateAverage(memoryUsagePercent).toFixed(2),
      },
    };
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculate trend (ascending, descending, stable)
   */
  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';

    const firstHalf = this.calculateAverage(values.slice(0, Math.floor(values.length / 2)));
    const secondHalf = this.calculateAverage(values.slice(Math.floor(values.length / 2)));

    const change = ((secondHalf - firstHalf) / firstHalf) * 100;

    if (change > 5) return 'ascending';
    if (change < -5) return 'descending';
    return 'stable';
  }

  /**
   * Aggregate network statistics
   */
  private aggregateNetworkStats(
    networks: VMMetric['network'],
  ): Record<string, any> {
    const agg = {
      total_rx_bytes: 0,
      total_tx_bytes: 0,
      total_rx_packets: 0,
      total_tx_packets: 0,
      interfaces: networks,
    };

    networks.forEach((net) => {
      agg.total_rx_bytes += net.rx_bytes;
      agg.total_tx_bytes += net.tx_bytes;
      agg.total_rx_packets += net.rx_packets;
      agg.total_tx_packets += net.tx_packets;
    });

    return {
      ...agg,
      total_rx_mb: (agg.total_rx_bytes / 1024 / 1024).toFixed(2),
      total_tx_mb: (agg.total_tx_bytes / 1024 / 1024).toFixed(2),
    };
  }

  /**
   * Determine VM status based on metrics
   */
  private determineStatus(metric: VMMetric): string {
    const criticalAlerts = this.generateAlerts(metric).filter(
      (a) => a.severity === 'critical',
    );
    if (criticalAlerts.length > 0) return 'critical';

    const warningAlerts = this.generateAlerts(metric).filter(
      (a) => a.severity === 'warning',
    );
    if (warningAlerts.length > 0) return 'warning';

    return 'healthy';
  }

  /**
   * Generate alerts based on metrics
   */
  private generateAlerts(metric: VMMetric): Array<any> {
    const alerts: any[] = [];

    // CPU Alert
    if (metric.cpu.usage_percent > 90) {
      alerts.push({
        severity: 'critical',
        type: 'cpu',
        message: `High CPU usage: ${metric.cpu.usage_percent.toFixed(2)}%`,
        value: metric.cpu.usage_percent,
        threshold: 90,
      });
    } else if (metric.cpu.usage_percent > 70) {
      alerts.push({
        severity: 'warning',
        type: 'cpu',
        message: `Moderate CPU usage: ${metric.cpu.usage_percent.toFixed(2)}%`,
        value: metric.cpu.usage_percent,
        threshold: 70,
      });
    }

    // Memory Alert
    const memUsagePercent = (metric.memory.used / metric.memory.total) * 100;
    if (memUsagePercent > 90) {
      alerts.push({
        severity: 'critical',
        type: 'memory',
        message: `High memory usage: ${memUsagePercent.toFixed(2)}%`,
        value: memUsagePercent,
        threshold: 90,
      });
    } else if (memUsagePercent > 75) {
      alerts.push({
        severity: 'warning',
        type: 'memory',
        message: `Moderate memory usage: ${memUsagePercent.toFixed(2)}%`,
        value: memUsagePercent,
        threshold: 75,
      });
    }

    // Disk Alert
    metric.disk.forEach((disk) => {
      const diskUsagePercent = (disk.used / disk.total) * 100;
      if (diskUsagePercent > 95) {
        alerts.push({
          severity: 'critical',
          type: 'disk',
          message: `Critical disk usage on ${disk.mount}: ${diskUsagePercent.toFixed(2)}%`,
          filesystem: disk.filesystem,
          mount: disk.mount,
          value: diskUsagePercent,
          threshold: 95,
        });
      } else if (diskUsagePercent > 85) {
        alerts.push({
          severity: 'warning',
          type: 'disk',
          message: `High disk usage on ${disk.mount}: ${diskUsagePercent.toFixed(2)}%`,
          filesystem: disk.filesystem,
          mount: disk.mount,
          value: diskUsagePercent,
          threshold: 85,
        });
      }
    });

    // Load Alert
    const load1min = metric.load['1min'];
    if (load1min > 4) {
      alerts.push({
        severity: 'warning',
        type: 'load',
        message: `High system load: ${load1min.toFixed(2)}`,
        value: load1min,
        threshold: 4,
      });
    }

    return alerts;
  }

  /**
   * Format uptime
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * GET /monitor/metrics
   * Metrics endpoint for Prometheus
   */
  @Get('metrics')
  async getPrometheusMetrics() {
    const metrics: string[] = [];

    // Generate Prometheus metrics from buffered data
    this.metricsBuffer.forEach((vmMetrics, vmId) => {
      if (vmMetrics.length > 0) {
        const latest = vmMetrics[vmMetrics.length - 1];

        // CPU metric
        metrics.push(
          `vm_cpu_usage_percent{vm_id="${vmId}"} ${latest.cpu.usage_percent}`,
        );

        // Memory metric
        const memPercent = (latest.memory.used / latest.memory.total) * 100;
        metrics.push(`vm_memory_usage_percent{vm_id="${vmId}"} ${memPercent}`);
        metrics.push(
          `vm_memory_bytes_used{vm_id="${vmId}"} ${latest.memory.used}`,
        );
        metrics.push(
          `vm_memory_bytes_total{vm_id="${vmId}"} ${latest.memory.total}`,
        );

        // Uptime metric
        metrics.push(`vm_uptime_seconds{vm_id="${vmId}"} ${latest.uptime_seconds}`);

        // Load metric
        metrics.push(`vm_load_average_1m{vm_id="${vmId}"} ${latest.load['1min']}`);
        metrics.push(`vm_load_average_5m{vm_id="${vmId}"} ${latest.load['5min']}`);
        metrics.push(
          `vm_load_average_15m{vm_id="${vmId}"} ${latest.load['15min']}`,
        );
      }
    });

    return metrics.join('\n');
  }
}
