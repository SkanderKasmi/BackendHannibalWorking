import * as amqp from 'amqplib';
import { Logger } from '@nestjs/common';

/**
 * RabbitMQ Message Service for inter-service communication
 */
export class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private logger = new Logger('RabbitMQService');

  async connect(url: string): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log('Connected to RabbitMQ');

      // Setup event listeners
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Declare an exchange
   */
  async declareExchange(
    exchange: string,
    type: 'direct' | 'fanout' | 'topic' = 'topic',
    options?: amqp.Options.AssertExchange,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.assertExchange(exchange, type, {
      durable: true,
      ...options,
    });

    this.logger.debug(`Exchange declared: ${exchange}`);
  }

  /**
   * Declare a queue
   */
  async declareQueue(
    queue: string,
    options?: amqp.Options.AssertQueue,
  ): Promise<amqp.Replies.AssertQueue> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const result = await this.channel.assertQueue(queue, {
      durable: true,
      ...options,
    });

    this.logger.debug(`Queue declared: ${queue}`);
    return result;
  }

  /**
   * Bind queue to exchange
   */
  async bindQueue(
    queue: string,
    exchange: string,
    pattern: string = '',
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.bindQueue(queue, exchange, pattern);
    this.logger.debug(`Queue bound: ${queue} to ${exchange} with pattern: ${pattern}`);
  }

  /**
   * Publish a message
   */
  async publish(
    exchange: string,
    routingKey: string,
    message: any,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    const published = this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      ...options,
    });

    if (!published) {
      this.logger.warn(
        `Message buffer full for ${exchange}/${routingKey}. Waiting...`,
      );
      await new Promise((resolve) =>
        this.channel?.once('drain', resolve),
      );
    }

    this.logger.debug(`Message published to ${exchange}/${routingKey}`);
  }

  /**
   * Subscribe to messages on a queue
   */
  async subscribe(
    queue: string,
    callback: (message: any, ackFn: () => void, nackFn: () => void) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    // Prefetch one message at a time
    await this.channel.prefetch(1);

    const consumerTag = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());

        const ackFn = () => this.channel?.ack(msg);
        const nackFn = () => this.channel?.nack(msg, false, true);

        await callback(content, ackFn, nackFn);
      } catch (error) {
        this.logger.error(`Error processing message: ${error}`);
        this.channel?.nack(msg, false, true);
      }
    });

    this.logger.log(`Subscribed to queue: ${queue} (consumer tag: ${consumerTag.consumerTag})`);
  }

  /**
   * Send RPC request
   */
  async rpc(
    exchange: string,
    routingKey: string,
    message: any,
    timeout: number = 5000,
  ): Promise<any> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const replyQueue = await this.channel.assertQueue('', { exclusive: true });
    const correlationId = Math.random().toString();

    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(exchange, routingKey, messageBuffer, {
      replyTo: replyQueue.queue,
      correlationId,
      contentType: 'application/json',
      persistent: true,
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.channel?.cancel(replyQueue.queue).catch(() => {});
        reject(new Error('RPC request timeout'));
      }, timeout);

      this.channel?.consume(replyQueue.queue, (msg) => {
        if (msg?.properties.correlationId === correlationId) {
          clearTimeout(timer);
          const response = JSON.parse(msg.content.toString());
          this.channel?.ack(msg);
          this.channel?.deleteQueue(replyQueue.queue).catch(() => {});
          resolve(response);
        }
      });
    });
  }

  /**
   * Get channel for advanced operations
   */
  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }

    this.logger.log('RabbitMQ connection closed');
  }
}

/**
 * Common exchange and queue definitions
 */
export const RABBITMQ_CONFIG = {
  exchanges: {
    SERVICES: 'services',
    MONITORING: 'monitoring',
    EVENTS: 'events',
    NOTIFICATIONS: 'notifications',
  },
  queues: {
    // Auth Service
    AUTH_EVENTS: 'auth.events',
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',

    // Infrastructure Service
    INFRASTRUCTURE_EVENTS: 'infrastructure.events',
    RESOURCE_GROUP_CREATED: 'resource-group.created',
    VM_CREATED: 'vm.created',
    VM_STATUS_CHANGED: 'vm.status.changed',

    // Agents Service
    AGENTS_EVENTS: 'agents.events',
    AGENT_DEPLOYED: 'agent.deployed',
    AGENT_STATUS: 'agent.status',
    TASK_COMPLETED: 'task.completed',

    // Monitor Service
    MONITOR_EVENTS: 'monitor.events',
    METRICS_COLLECTED: 'metrics.collected',
    ALERT_TRIGGERED: 'alert.triggered',
  },
  routingKeys: {
    AUTH: 'auth.*',
    INFRASTRUCTURE: 'infrastructure.*',
    AGENTS: 'agents.*',
    MONITORING: 'monitoring.*',
    ALL: '#',
  },
};
