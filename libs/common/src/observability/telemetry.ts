import { trace, context } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

/**
 * Initialize OpenTelemetry for distributed tracing and metrics collection
 */
export function initializeOpenTelemetry(serviceName: string) {
  // Register auto-instrumentations
  registerInstrumentations({
    instrumentations: [getNodeAutoInstrumentations()],
  });

  const tracer = trace.getTracer(serviceName, process.env.APP_VERSION || '1.0.0');
  
  console.log(`OpenTelemetry initialized for service: ${serviceName}`);

  return { tracer, trace, context };
}

export { trace, context } from '@opentelemetry/api';
