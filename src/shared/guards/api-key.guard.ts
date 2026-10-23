import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['api-key'];
    const validApiKey = this.configService.get<string>('API_KEY');

    // Fail closed: an unset API_KEY must never let a request through.
    if (
      !validApiKey ||
      typeof apiKeyHeader !== 'string' ||
      !this.safeEqual(apiKeyHeader, validApiKey)
    ) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  // Constant-time comparison. Hashing first gives timingSafeEqual equal-length buffers
  // without leaking the length of the configured key.
  private safeEqual(received: string, expected: string): boolean {
    const digest = (value: string) => createHash('sha256').update(value).digest();
    return timingSafeEqual(digest(received), digest(expected));
  }
}
