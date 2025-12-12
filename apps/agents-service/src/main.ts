import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AgentsModule } from './agents.module';
import { AGENTS_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService } from '@libs/common/messaging/kafka.service';

async function bootstrap() {
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
  
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    await rabbitmqService.connect(rabbitUrl);
    console.log('RabbitMQ connection established');
    
    // Set up command handlers
    await rabbitmqService.declareQueue('agents.commands');
    console.log('Agents command queue created');

    // Initialize Kafka
    const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
    await kafkaService.connect(kafkaBrokers);
    console.log('Kafka connection established');
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
  
  await app.listen();
  console.log(`Agents Service is running on port ${AGENTS_SERVICE_PORT}`);
}
bootstrap();
