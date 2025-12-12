import { Module } from '@nestjs/common';
import { InfrastructureController } from './infrastructure.controller';
import { InfrastructureService } from './infrastructure.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { PrismaService } from './prisma.service';
import { MetricsModule } from '@libs/common/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [InfrastructureController],
  providers: [InfrastructureService, PrismaService, RabbitMQService],
  exports: [RabbitMQService],
})
export class InfrastructureModule {}
