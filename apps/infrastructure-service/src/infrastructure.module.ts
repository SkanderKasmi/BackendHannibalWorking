import { Module } from '@nestjs/common';
import { InfrastructureController } from './infrastructure.controller';
import { InfrastructureService } from './infrastructure.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [InfrastructureController],
  providers: [InfrastructureService, PrismaService, RabbitMQService],
  exports: [RabbitMQService],
})
export class InfrastructureModule {}
