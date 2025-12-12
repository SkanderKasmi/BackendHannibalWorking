import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { InfrastructureModule } from './infrastructure.module';
import { INFRASTRUCTURE_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { RABBITMQ_CONFIG } from '@libs/common/messaging/rabbitmq.service';
import { InfrastructureService } from './infrastructure.service';
import { RABBITMQ_ROUTING_KEYS } from '@app/common/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InfrastructureModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: INFRASTRUCTURE_SERVICE_PORT,
      },
    },
  );

  // Initialize RabbitMQ connection
  const rabbitmqService = app.get(RabbitMQService);
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    await rabbitmqService.connect(rabbitUrl);
    console.log('RabbitMQ connection established');
    
    await rabbitmqService.declareExchange(RABBITMQ_CONFIG.exchanges.SERVICES, 'topic');
    console.log('Services exchange declared');
    
    // Set up command handlers
    await rabbitmqService.declareQueue('infrastructure.commands');
    console.log('Infrastructure command queue created');
    await rabbitmqService.declareQueue('infrastructure.events');
    await rabbitmqService.bindQueue('infrastructure.events', RABBITMQ_CONFIG.exchanges.SERVICES, RABBITMQ_ROUTING_KEYS.INFRASTRUCTURE_VM_STATUS);
    const infraService = app.get(InfrastructureService);
    await rabbitmqService.subscribe('infrastructure.events', async (message) => {
      const { vmId, status } = message || {};
      if (vmId && status) {
        await infraService.updateVM(vmId, { status });
      }
    });
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
  }
  
  await app.listen();
  console.log(`Infrastructure Service is running on port ${INFRASTRUCTURE_SERVICE_PORT}`);
  
  const metricsPort = parseInt(process.env.METRICS_PORT || '9102', 10);
  const httpApp = await NestFactory.create(InfrastructureModule);
  await httpApp.listen(metricsPort, '0.0.0.0');
  console.log(`Infrastructure Service metrics available on port ${metricsPort}/metrics`);
}
bootstrap();
