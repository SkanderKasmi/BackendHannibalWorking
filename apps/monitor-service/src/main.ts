import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { MonitorModule } from './monitor.module';
import { MONITOR_SERVICE_PORT } from '@app/common/constants';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService } from '@libs/common/messaging/kafka.service';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MonitorModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: MONITOR_SERVICE_PORT,
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
    
    // Set up queue for alert subscriptions
    await rabbitmqService.declareQueue('alerts.queue');
    console.log('Monitor alert queue created');

    // Initialize Kafka for metrics collection
    const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
    await kafkaService.connect(kafkaBrokers);
    console.log('Kafka connection established');

    // Ensure required topics exist (no direct subscribe here)
    await kafkaService.createTopic('vm-metrics');
    await kafkaService.createTopic('system-health');
    await kafkaService.createTopic('alerts');
    console.log('Ensured Kafka topics exist');
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
  }
  
  await app.listen();
  console.log(`Monitor Service is running on port ${MONITOR_SERVICE_PORT}`);
  
  const metricsPort = parseInt(process.env.METRICS_PORT || '9104', 10);
  const httpApp = await NestFactory.create(MonitorModule);
  await httpApp.listen(metricsPort, '0.0.0.0');
  console.log(`Monitor Service metrics available on port ${metricsPort}/metrics`);
}
bootstrap();
