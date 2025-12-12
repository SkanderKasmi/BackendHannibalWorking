import {
  Kafka,
  Producer,
  Consumer,
  ProducerRecord,
  ConsumerConfig,
  logLevel,
} from 'kafkajs';
import { Logger } from '@nestjs/common';

/**
 * Kafka Service for VM metrics streaming
 */
export class KafkaService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private logger = new Logger('KafkaService');

  async connect(brokers: string[]): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: process.env.OTEL_SERVICE_NAME || 'microservices-client',
        brokers,
        logLevel: process.env.NODE_ENV === 'development' ? logLevel.DEBUG : logLevel.INFO,
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      });

      // Create producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        maxInFlightRequests: 5,
        idempotent: true,
      });

      await this.producer.connect();
      this.logger.log('Kafka Producer connected');

      // Setup error handling
      this.producer.on('producer.connect', () => {
        this.logger.log('Producer connected');
      });

      this.producer.on('producer.disconnect', () => {
        this.logger.warn('Producer disconnected');
      });

      this.producer.on('producer.network.request', ({ payload }) => {
        this.logger.debug(`Producer network request: ${JSON.stringify(payload)}`);
      });

      this.producer.on('producer.network.request_timeout', ({ payload }) => {
        this.logger.warn(`Producer network request timeout: ${JSON.stringify(payload)}`);
      });
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Publish metrics to Kafka
   */
  async publishMetrics(topic: string, metrics: any[]): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      const messages = metrics.map((metric) => ({
        key: metric.vm_id || 'default',
        value: JSON.stringify(metric),
        timestamp: Date.now().toString(),
      }));

      const record: ProducerRecord = {
        topic,
        messages,
        acks: -1, // Wait for all in-sync replicas
        timeout: 30000,
        compression: 1, // GZIP compression
      };

      const result = await this.producer.send(record);

      this.logger.debug(
        `Published ${metrics.length} metrics to topic: ${topic}`,
      );
      this.logger.debug(`Kafka send result: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Failed to publish metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Publish single metric
   */
  async publishMetric(topic: string, vmId: string, metric: any): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: vmId,
            value: JSON.stringify(metric),
            timestamp: Date.now().toString(),
            headers: {
              'content-type': 'application/json',
              'vm-id': vmId,
            },
          },
        ],
      });

      this.logger.debug(`Published metric for VM: ${vmId} to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish metric: ${error}`);
      throw error;
    }
  }

  /**
   * Subscribe to metrics
   */
  async subscribeToMetrics(
    topic: string,
    groupId: string,
    callback: (metric: any) => Promise<void>,
  ): Promise<void> {
    if (!this.kafka) {
      throw new Error('Kafka not initialized');
    }

    try {
      this.consumer = this.kafka.consumer({
        groupId,
        allowAutoTopicCreation: false,
        sessionTimeout: 30000,
      });

      await this.consumer.connect();
      this.logger.log(`Kafka Consumer connected to group: ${groupId}`);

      await this.consumer.subscribe({
        topic,
        fromBeginning: false,
      });

      this.logger.log(`Subscribed to topic: ${topic}`);

      await this.consumer.run({
        autoCommit: true,
        autoCommitInterval: 5000,
        autoCommitThreshold: 100,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const metric = JSON.parse(message.value?.toString() || '{}');
            await callback(metric);
          } catch (error) {
            this.logger.error(
              `Error processing message from ${topic}:${partition}: ${error}`,
            );
          }
        },
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Create topic if not exists
   */
  async createTopic(topicName: string, numPartitions: number = 3): Promise<void> {
    if (!this.kafka) {
      throw new Error('Kafka not initialized');
    }

    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const topics = await admin.listTopics();

      if (!topics.includes(topicName)) {
        await admin.createTopics({
          topics: [
            {
              topic: topicName,
              numPartitions,
              replicationFactor: 1,
              configEntries: [
                {
                  name: 'retention.ms',
                  value: '604800000', // 7 days
                },
                {
                  name: 'compression.type',
                  value: 'gzip',
                },
              ],
            },
          ],
        });

        this.logger.log(`Created topic: ${topicName}`);
      } else {
        this.logger.log(`Topic already exists: ${topicName}`);
      }

      await admin.disconnect();
    } catch (error) {
      this.logger.error(`Failed to create topic: ${error}`);
    }
  }

  /**
   * Get topic metadata
   */
  async getTopicMetadata(topics?: string[]): Promise<any> {
    if (!this.kafka) {
      throw new Error('Kafka not initialized');
    }

    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({ topics: topics || [] });

      await admin.disconnect();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get topic metadata: ${error}`);
      throw error;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
    }

    if (this.producer) {
      await this.producer.disconnect();
    }

    this.logger.log('Kafka connections closed');
  }
}

/**
 * Kafka topics configuration
 */
export const KAFKA_CONFIG = {
  topics: {
    VM_METRICS: 'vm-metrics',
    VM_METRICS_PROCESSED: 'vm-metrics-processed',
    ALERTS: 'alerts',
    LOGS: 'logs',
  },
  consumerGroups: {
    MONITOR_SERVICE: 'monitor-service-group',
    ANALYTICS: 'analytics-group',
    ALERTING: 'alerting-group',
  },
  partitions: {
    DEFAULT: 3,
    VM_METRICS: 6,
    ALERTS: 1,
  },
};

/**
 * VM Metrics Schema
 */
export interface VMMetric {
  vm_id: string;
  timestamp: string;
  cpu: {
    usage_percent: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    available?: number;
  };
  disk: Array<{
    filesystem: string;
    total: number;
    used: number;
    available: number;
    mount: string;
  }>;
  network: Array<{
    interface: string;
    rx_bytes: number;
    rx_packets: number;
    tx_bytes: number;
    tx_packets: number;
  }>;
  processes: {
    total: number;
    top_processes: Array<{
      pid: number;
      user: string;
      cpu: number;
      memory: number;
      command: string;
    }>;
  };
  load: {
    '1min': number;
    '5min': number;
    '15min': number;
  };
  uptime_seconds: number;
  temperature_celsius?: number;
  hostname: string;
  os: string;
  kernel: string;
}
