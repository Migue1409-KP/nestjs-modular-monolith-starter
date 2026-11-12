import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthConfigModule } from './providers/auth-config.module';
import { AuthConfigFactory } from './providers/auth-config.factory';
import { UserRepository } from '@/users/repositories/user-profiles.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from '@/users/entities/user-profiles.entity';

@Module({
  imports: [
    AuthConfigModule,
    TypeOrmModule.forFeature([UserProfile]),
    BetterAuthModule.forRootAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigFactory, ConfigService],
      // PolicyGuard handles auth+authz in a single pass, so the library's global AuthGuard
      // must not double up on getSession(). This is a module-level option: placed inside
      // the useFactory result the library ignores it.
      disableGlobalAuthGuard: true,
      useFactory: (factory: AuthConfigFactory, config: ConfigService) => {
        const limit = config.get<string>('BODY_LIMIT', '1mb');
        return {
          auth: factory.create(),
          // The Nest body parser is off in main.ts, so the size limit is set here.
          bodyParser: { json: { limit }, urlencoded: { limit } },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [UserRepository],
})
export class AuthModule {}
