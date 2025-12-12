import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

import {
  AUTH_SERVICE,
  INFRASTRUCTURE_SERVICE,
  AGENTS_SERVICE,
  MONITOR_SERVICE,
  TCP_OPTIONS,
} from '@app/common/constants';

import { AuthController } from './controllers/auth.controller';
import { InfrastructureController } from './controllers/infrastructure.controller';
import { AgentsController } from './controllers/agents.controller';
import { MonitorController } from './controllers/monitor.controller';
import { HealthController } from './controllers/health.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MetricsModule } from '@libs/common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TerminusModule,
    MetricsModule,
    ClientsModule.register([
      {
        name: AUTH_SERVICE,
        transport: Transport.TCP,
        options: TCP_OPTIONS.auth,
      },
      {
        name: INFRASTRUCTURE_SERVICE,
        transport: Transport.TCP,
        options: TCP_OPTIONS.infrastructure,
      },
      {
        name: AGENTS_SERVICE,
        transport: Transport.TCP,
        options: TCP_OPTIONS.agents,
      },
      {
        name: MONITOR_SERVICE,
        transport: Transport.TCP,
        options: TCP_OPTIONS.monitor,
      },
    ]),
  ],
  controllers: [
    AuthController,
    InfrastructureController,
    AgentsController,
    MonitorController,
    HealthController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
