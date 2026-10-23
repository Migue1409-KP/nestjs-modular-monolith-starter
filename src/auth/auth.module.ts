import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthConfigModule } from './providers/auth-config.module';
import { AuthConfigFactory } from './providers/auth-config.factory';
import { AuthService } from './auth.service';
import { UserRepository } from '@/users/repositories/user-profiles.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from '@/users/entities/user-profiles.entity';
import { HttpModule } from '@/core/http/http.module';

@Module({
  imports: [
    AuthConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([UserProfile]),
    BetterAuthModule.forRootAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigFactory, ConfigService],
      // disableGlobalAuthGuard: PolicyGuard handles auth+authz in a single pass,
      // so we don't need the library's AuthGuard doubling up on getSession().
      useFactory: (factory: AuthConfigFactory, config: ConfigService) => {
        const limit = config.get<string>('BODY_LIMIT', '1mb');
        return {
          auth: factory.create(),
          disableGlobalAuthGuard: true,
          // The Nest body parser is off in main.ts, so the size limit is set here.
          bodyParser: { json: { limit }, urlencoded: { limit } },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
  exports: [AuthService],
})
export class AuthModule {}
