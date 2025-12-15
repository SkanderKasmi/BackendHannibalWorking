import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AuthModule } from './auth.module';
import { AUTH_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { initOtelFromEnv } from '@libs/common/telemetry/otel.sdk';

async function bootstrap() {
  await initOtelFromEnv();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: AUTH_SERVICE_PORT,
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
    await rabbitmqService.declareQueue('auth.commands');
    console.log('Auth command queue created');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
  }
  
  await app.listen();
  console.log(`Auth Service is running on port ${AUTH_SERVICE_PORT}`);
  
  const metricsPort = parseInt(process.env.METRICS_PORT || '9101', 10);
  const httpApp = await NestFactory.create(AuthModule);
  await httpApp.listen(metricsPort, '0.0.0.0');
  console.log(`Auth Service metrics available on port ${metricsPort}/metrics`);
}
bootstrap();
