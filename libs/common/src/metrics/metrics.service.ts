import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

/**
 * Prometheus Metrics Service
 * Provides utility methods for recording metrics
 */
@Injectable()
export class MetricsService {
  private readonly serviceName = process.env.SERVICE_NAME || 'unknown-service';
  private readonly registry = promClient.register;

  // Custom metrics - cache them to avoid duplicate registration
  private httpRequestDuration: promClient.Histogram<'method' | 'route' | 'status_code' | 'service'>;
  private httpRequestTotal: promClient.Counter<'method' | 'route' | 'status_code' | 'service'>;
  private databaseQueryDuration: promClient.Histogram<'query' | 'service'>;
  private messageBrokerQueue: promClient.Gauge<'queue' | 'service'>;
  private metricsInitialized = false;

  constructor() {
    this.initializeMetrics();
    // Collect default Node.js metrics
    promClient.collectDefaultMetrics({ prefix: 'nodejs_' });
  }

  private initializeMetrics() {
    if (this.metricsInitialized) return;

    try {
      this.httpRequestDuration = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code', 'service'],
        buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
      });

      this.httpRequestTotal = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'service'],
      });

      this.databaseQueryDuration = new promClient.Histogram({
        name: 'db_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['query', 'service'],
        buckets: [0.001, 0.01, 0.1, 0.5, 1],
      });

      this.messageBrokerQueue = new promClient.Gauge({
        name: 'message_broker_queue_depth',
        help: 'Current depth of message broker queues',
        labelNames: ['queue', 'service'],
      });

      this.metricsInitialized = true;
    } catch (error) {
      // Metrics might already be registered, which is fine
      console.warn('Metrics initialization warning:', (error as Error).message);
    }
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
    if (!this.httpRequestDuration) return;
    
    const durationSeconds = durationMs / 1000;
    
    try {
      this.httpRequestDuration.observe(
        { 
          method, 
          route, 
          status_code: statusCode.toString(), 
          service: this.serviceName 
        },
        durationSeconds,
      );

      this.httpRequestTotal.inc({
        method,
        route,
        status_code: statusCode.toString(),
        service: this.serviceName,
      });
    } catch (error) {
      console.error('Error recording HTTP metrics:', error);
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(query: string, durationMs: number) {
    if (!this.databaseQueryDuration) return;
    
    const durationSeconds = durationMs / 1000;
    
    try {
      this.databaseQueryDuration.observe(
        { query: query.substring(0, 50), service: this.serviceName },
        durationSeconds,
      );
    } catch (error) {
      console.error('Error recording database metrics:', error);
    }
  }

  /**
   * Update message broker queue depth
   */
  setQueueDepth(queue: string, depth: number) {
    if (!this.messageBrokerQueue) return;

    try {
      this.messageBrokerQueue.set(
        { queue, service: this.serviceName },
        depth,
      );
    } catch (error) {
      console.error('Error setting queue depth:', error);
    }
  }
}

