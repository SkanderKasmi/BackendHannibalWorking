import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { KafkaService } from '@app/common/messaging/kafka.service';
import { RabbitMQService } from '@app/common/messaging/rabbitmq.service';

// MongoDB Schemas
const MetricsSchema = new mongoose.Schema({
  vmId: String,
  timestamp: { type: Date, default: Date.now },
  cpu: {
    usage: Number,      // 0-100%
    cores: Number,
    model: String,
  },
  memory: {
    total: Number,      // MB
    used: Number,       // MB
    free: Number,
    usagePercent: Number, // 0-100%
  },
  disk: {
    total: Number,      // GB
    used: Number,       // GB
    free: Number,
    usagePercent: Number, // 0-100%
  },
  network: {
    bytesIn: Number,
    bytesOut: Number,
    packetsIn: Number,
    packetsOut: Number,
    errors: Number,
  },
  processes: {
    total: Number,
    running: Number,
  },
  systemLoad: {
    load1: Number,
    load5: Number,
    load15: Number,
  },
  uptime: Number,       // seconds
  status: String,       // online, offline, warning, error
  alerts: [String],
});

interface VMMetrics {
  vmId: string;
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
  };
  processes: {
    total: number;
    running: number;
  };
  systemLoad: {
    load1: number;
    load5: number;
    load15: number;
  };
  uptime: number;
  status: string;
  alerts: string[];
}

@Injectable()
export class AdvancedMonitorService implements OnModuleInit {
  private readonly logger = new Logger(AdvancedMonitorService.name);
  private MetricsModel: mongoose.Model<any>;
  private readonly alertThresholds = {
    cpuUsage: parseInt(process.env.ALERT_THRESHOLD_CPU || '80', 10),
    memoryUsage: parseInt(process.env.ALERT_THRESHOLD_MEMORY || '85', 10),
    diskUsage: parseInt(process.env.ALERT_THRESHOLD_DISK || '90', 10),
  };

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly rabbitmqService: RabbitMQService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeMongoose();
      await this.subscribeToMetrics();
      this.logger.log('Advanced Monitor Service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Advanced Monitor Service:', error);
    }
  }

  private async initializeMongoose() {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitor_db';
    
    try {
      await mongoose.connect(mongoUrl);
      this.logger.log('Connected to MongoDB for monitoring');
      this.MetricsModel = mongoose.model('metrics', MetricsSchema);
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  // Subscribe to Kafka metrics topic
  async subscribeToMetrics() {
    try {
      // Initialize Kafka connection with brokers
      const kafkaBrokers = (process.env.KAFKA_BROKER || 'kafka:9092').split(',');
      await this.kafkaService.connect(kafkaBrokers);

      // Subscribe to metrics topics using the KafkaService
      const topics = ['vm-metrics', 'system-health'];
      
      await this.kafkaService.subscribeToMetrics('vm-metrics', 'monitor-service-vm-metrics', async (metric) => {
        await this.processVMMetrics(metric);
      });

      await this.kafkaService.subscribeToMetrics('system-health', 'monitor-service-health', async (health) => {
        await this.processSystemHealth(health);
      });

      this.logger.log('Subscribed to VM metrics via Kafka');
    } catch (error) {
      this.logger.error('Error subscribing to metrics:', error);
    }
  }

  // Process VM metrics
  private async processVMMetrics(data: any): Promise<void> {
    try {
      const metrics = this.parseMetrics(data);
      
      // Store in MongoDB
      await this.storeMetrics(metrics);
      
      // Check for alerts
      const alerts = this.detectAlerts(metrics);
      if (alerts.length > 0) {
        metrics.alerts = alerts;
        await this.handleAlerts(alerts, metrics);
      }

      this.logger.debug(`Processed metrics for VM: ${metrics.vmId}`);
    } catch (error) {
      this.logger.error('Error processing VM metrics:', error);
    }
  }

  // Process system health
  private async processSystemHealth(data: any): Promise<void> {
    this.logger.debug('System health update:', data);
  }

  // Parse metrics from various formats
  private parseMetrics(data: any): VMMetrics {
    return {
      vmId: data.vmId || 'unknown',
      timestamp: new Date(data.timestamp || Date.now()),
      cpu: {
        usage: data.cpu?.usage || 0,
        cores: data.cpu?.cores || 1,
        model: data.cpu?.model || 'unknown',
      },
      memory: {
        total: data.memory?.total || 0,
        used: data.memory?.used || 0,
        free: data.memory?.free || 0,
        usagePercent: (data.memory?.used / data.memory?.total) * 100 || 0,
      },
      disk: {
        total: data.disk?.total || 0,
        used: data.disk?.used || 0,
        free: data.disk?.free || 0,
        usagePercent: (data.disk?.used / data.disk?.total) * 100 || 0,
      },
      network: {
        bytesIn: data.network?.bytesIn || 0,
        bytesOut: data.network?.bytesOut || 0,
        packetsIn: data.network?.packetsIn || 0,
        packetsOut: data.network?.packetsOut || 0,
        errors: data.network?.errors || 0,
      },
      processes: {
        total: data.processes?.total || 0,
        running: data.processes?.running || 0,
      },
      systemLoad: {
        load1: data.systemLoad?.load1 || 0,
        load5: data.systemLoad?.load5 || 0,
        load15: data.systemLoad?.load15 || 0,
      },
      uptime: data.uptime || 0,
      status: data.status || 'unknown',
      alerts: [],
    };
  }

  // Store metrics in MongoDB
  private async storeMetrics(metrics: VMMetrics): Promise<void> {
    if (!this.MetricsModel) return;
    
    try {
      const metricsDoc = new this.MetricsModel(metrics);
      await metricsDoc.save();
    } catch (error) {
      this.logger.error('Error storing metrics:', error);
    }
  }

  // Detect alerts based on thresholds
  private detectAlerts(metrics: VMMetrics): string[] {
    const alerts: string[] = [];

    if (metrics.cpu.usage > this.alertThresholds.cpuUsage) {
      alerts.push(`HIGH_CPU: ${metrics.cpu.usage.toFixed(2)}% (threshold: ${this.alertThresholds.cpuUsage}%)`);
    }

    if (metrics.memory.usagePercent > this.alertThresholds.memoryUsage) {
      alerts.push(`HIGH_MEMORY: ${metrics.memory.usagePercent.toFixed(2)}% (threshold: ${this.alertThresholds.memoryUsage}%)`);
    }

    if (metrics.disk.usagePercent > this.alertThresholds.diskUsage) {
      alerts.push(`HIGH_DISK: ${metrics.disk.usagePercent.toFixed(2)}% (threshold: ${this.alertThresholds.diskUsage}%)`);
    }

    if (metrics.status === 'offline') {
      alerts.push('VM_OFFLINE: Machine is not responding');
    }

    if (metrics.systemLoad.load1 > metrics.cpu.cores * 2) {
      alerts.push(`SYSTEM_OVERLOAD: Load average ${metrics.systemLoad.load1.toFixed(2)}`);
    }

    return alerts;
  }

  // Handle alerts
  private async handleAlerts(alerts: string[], metrics: any): Promise<void> {
    try {
      const alertData = {
        vmId: metrics.vmId,
        timestamp: metrics.timestamp,
        alerts,
        severity: this.calculateSeverity(alerts),
      };

      // Publish to RabbitMQ for notifications
      await this.rabbitmqService.publish('alerts', 'alert.critical', alertData);
      
      this.logger.warn(`Alerts generated for VM ${metrics.vmId}:`, alerts);
    } catch (error) {
      this.logger.error('Error handling alerts:', error);
    }
  }

  // Export metrics to Prometheus format
  private async exportToPrometheus(metrics: VMMetrics): Promise<void> {
    // This would integrate with Prometheus client library
    this.logger.debug(`Prometheus export: CPU=${metrics.cpu.usage}%, Memory=${metrics.memory.usagePercent}%`);
  }

  // Calculate alert severity
  private calculateSeverity(alerts: string[]): 'critical' | 'warning' | 'info' {
    if (alerts.some(a => a.includes('OFFLINE'))) return 'critical';
    if (alerts.some(a => a.includes('OVERLOAD'))) return 'warning';
    return 'info';
  }

  // Get metrics for specific VM
  async getVMMetrics(vmId: string, limit: number = 100): Promise<VMMetrics[]> {
    if (!this.MetricsModel) return [];
    
    try {
      return (await this.MetricsModel
        .find({ vmId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()) as unknown as VMMetrics[];
    } catch (error) {
      this.logger.error('Error fetching VM metrics:', error);
      return [];
    }
  }

  // Get metrics aggregation (average, min, max)
  async getMetricsAggregation(vmId: string, timeRange: number = 3600000) {
    if (!this.MetricsModel) return null;
    
    try {
      const startTime = new Date(Date.now() - timeRange);
      
      const metrics = (await this.MetricsModel
        .find({
          vmId,
          timestamp: { $gte: startTime },
        })
        .lean()) as unknown as VMMetrics[];

      if (metrics.length === 0) return null;

      const cpuValues = metrics.map(m => m.cpu.usage);
      const memoryValues = metrics.map(m => m.memory.usagePercent);
      const diskValues = metrics.map(m => m.disk.usagePercent);

      return {
        vmId,
        timeRange,
        dataPoints: metrics.length,
        cpu: {
          average: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
          min: Math.min(...cpuValues),
          max: Math.max(...cpuValues),
        },
        memory: {
          average: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
          min: Math.min(...memoryValues),
          max: Math.max(...memoryValues),
        },
        disk: {
          average: diskValues.reduce((a, b) => a + b, 0) / diskValues.length,
          min: Math.min(...diskValues),
          max: Math.max(...diskValues),
        },
      };
    } catch (error) {
      this.logger.error('Error aggregating metrics:', error);
      return null;
    }
  }

  // Get all active VMs
  async getActiveVMs(): Promise<string[]> {
    if (!this.MetricsModel) return [];
    
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const vms = await this.MetricsModel
        .distinct('vmId', { timestamp: { $gte: oneHourAgo } });
      return vms;
    } catch (error) {
      this.logger.error('Error fetching active VMs:', error);
      return [];
    }
  }

  // Generate health report
  async generateHealthReport() {
    try {
      const activeVMs = await this.getActiveVMs();
      const report = {
        timestamp: new Date(),
        totalVMs: activeVMs.length,
        vms: await Promise.all(
          activeVMs.map(async (vmId) => ({
            vmId,
            aggregation: await this.getMetricsAggregation(vmId),
          }))
        ),
      };
      return report;
    } catch (error) {
      this.logger.error('Error generating health report:', error);
      return null;
    }
  }
}
