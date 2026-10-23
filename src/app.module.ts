import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { CoreModule } from '@/core/core.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { winstonConfig } from '@/core/config/winston.config';
import { validateEnv } from '@/core/config/env.validation';
import { getThrottlerConfig } from '@/core/config/throttler.config';
import { AuthorizationModule } from '@/shared/authorization/authorization.module';
import { PolicyGuard, AUTH_CLIENT_SERVICE } from '@/shared/guards/policy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    WinstonModule.forRootAsync({
      useFactory: winstonConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getThrottlerConfig,
    }),
    CoreModule,
    AuthModule,
    AuthorizationModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: AUTH_CLIENT_SERVICE,
      useExisting: AuthService,
    },
    // Registered before PolicyGuard so floods are rejected before any session lookup.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PolicyGuard,
    },
  ],
})
export class AppModule {}
