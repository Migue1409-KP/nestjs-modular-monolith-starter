import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { CoreModule } from '@/core/core.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { winstonConfig } from '@/core/config/winston.config';
import { AuthorizationModule } from '@/shared/authorization/authorization.module';
import { PolicyGuard, AUTH_CLIENT_SERVICE } from '@/shared/guards/policy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRootAsync({
      useFactory: winstonConfig,
      inject: [ConfigService],
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
    {
      provide: APP_GUARD,
      useClass: PolicyGuard,
    },
  ],
})
export class AppModule {}
