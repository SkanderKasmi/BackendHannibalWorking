import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { InfrastructureModule } from './infrastructure.module';
import { INFRASTRUCTURE_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';

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
    
    // Set up command handlers
    await rabbitmqService.declareQueue('infrastructure.commands');
    console.log('Infrastructure command queue created');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
  }
  
  await app.listen();
  console.log(`Infrastructure Service is running on port ${INFRASTRUCTURE_SERVICE_PORT}`);
}
bootstrap();
