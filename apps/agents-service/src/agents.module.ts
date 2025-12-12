import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService } from '@libs/common/messaging/kafka.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, PrismaService, RabbitMQService, KafkaService],
  exports: [RabbitMQService, KafkaService],
})
export class AgentsModule {}
