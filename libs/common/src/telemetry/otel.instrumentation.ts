// OpenTelemetry Instrumentation Setup for All Services
import { trace, context } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import * as client from 'prom-client';

const serviceName = process.env.SERVICE_NAME || 'unknown-service';

// Auto-instrumentation
registerInstrumentations({
  instrumentations: [getNodeAutoInstrumentations()],
});

// Metrics with Prometheus
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'nodejs_' });

// Get tracer
const tracer = trace.getTracer(serviceName, '1.0.0');

console.log(`OpenTelemetry initialized for service: ${serviceName}`);

// Export
export { tracer, trace, context };
