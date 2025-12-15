import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AgentsModule } from './agents.module';
import { AGENTS_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService, RABBITMQ_CONFIG } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService } from '@libs/common/messaging/kafka.service';
import { AgentsService } from './agents.service';
import { RABBITMQ_ROUTING_KEYS } from '@app/common/constants';
import { initOtelFromEnv } from '@libs/common/telemetry/otel.sdk';

async function bootstrap() {
  await initOtelFromEnv();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AgentsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: AGENTS_SERVICE_PORT,
      },
    },
  );

  // Initialize RabbitMQ connection
  const rabbitmqService = app.get(RabbitMQService);
  const kafkaService = app.get(KafkaService);
  const agentsService = app.get(AgentsService);
  
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    await rabbitmqService.connect(rabbitUrl);
    console.log('RabbitMQ connection established');
    
    await rabbitmqService.declareExchange(RABBITMQ_CONFIG.exchanges.SERVICES, 'topic');
    console.log('Services exchange declared');

    await rabbitmqService.declareQueue('agents.commands');
    console.log('Agents command queue created');
    await rabbitmqService.bindQueue('agents.commands', RABBITMQ_CONFIG.exchanges.SERVICES, RABBITMQ_ROUTING_KEYS.AGENTS_DEPLOY_SCRIPTS);
    console.log('Agents command queue bound to services exchange');
    await rabbitmqService.subscribe('agents.commands', async (message) => {
      const { vmId, files } = message || {};
      if (vmId && Array.isArray(files)) {
        await agentsService.deployScriptsForVM(vmId, files);
      }
    });

    // Initialize Kafka
    const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
    await kafkaService.connect(kafkaBrokers);
    console.log('Kafka connection established');
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
  
  await app.listen();
  console.log(`Agents Service is running on port ${AGENTS_SERVICE_PORT}`);
  
  const metricsPort = parseInt(process.env.METRICS_PORT || '9103', 10);
  const httpApp = await NestFactory.create(AgentsModule);
  await httpApp.listen(metricsPort, '0.0.0.0');
  console.log(`Agents Service metrics available on port ${metricsPort}/metrics`);
}
bootstrap();
