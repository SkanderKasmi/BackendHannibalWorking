import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { KafkaService } from '@libs/common/messaging/kafka.service';
import { PrismaService } from './prisma.service';
import { AdvancedMonitorService } from './advanced-monitor.service';
import { AdvancedMonitorController } from './advanced-monitor.controller';

@Module({
  controllers: [MonitorController, AdvancedMonitorController],
  providers: [
    MonitorService,
    PrismaService,
    RabbitMQService,
    KafkaService,
    AdvancedMonitorService,
  ],
  exports: [RabbitMQService, KafkaService, AdvancedMonitorService],
})
export class MonitorModule {}
