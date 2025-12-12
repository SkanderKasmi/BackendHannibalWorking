import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RabbitMQService } from '@libs/common/messaging/rabbitmq.service';
import { PrismaService } from './prisma.service';
import { MetricsModule } from '@libs/common/metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, RabbitMQService],
  exports: [RabbitMQService],
})
export class AuthModule {}
