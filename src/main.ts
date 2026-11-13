import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { LoggingInterceptor } from '@/shared/interceptors/logging.interceptor';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { ProblemDetailsFilter } from './shared/filters/problem-details.filter';
import { RequestIdInterceptor } from './shared/interceptors/request-id.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiKeyGuard } from './shared/guards/api-key.guard';
import type { Request, Response } from 'express';
import { apiReference } from '@scalar/nestjs-api-reference';
import { parseFrontendUrls } from './shared/utils/frontend-url.util';
import { mergeAuthOpenApi } from './shared/utils/merge-auth-openapi.util';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { createSecurityHeadersMiddleware } from './shared/utils/security-headers.util';
import { parseTrustProxy } from './shared/utils/trust-proxy.util';
import { getAppVersion } from './shared/utils/app-version.util';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Release DB connections etc. on SIGTERM/SIGINT (container stops, rolling deploys).
  app.enableShutdownHooks();

  // Behind a reverse proxy (Railway, Fly, nginx...) the client IP comes from X-Forwarded-For.
  const trustProxy = parseTrustProxy(configService.get<string>('TRUST_PROXY'));
  if (trustProxy !== undefined) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  app.use(createSecurityHeadersMiddleware(`/${apiPrefix}/docs`));

  // Global interceptors
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const reflector = app.get(Reflector);

  app.useGlobalGuards(new ApiKeyGuard(configService, reflector));

  // Global pipes
  app.useGlobalPipes(new ZodValidationPipe());

  // Global filters
  app.useGlobalFilters(new ProblemDetailsFilter());

  // CORS
  const trustedOrigins = parseFrontendUrls(configService.get<string>('FRONTEND_URL'));

  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
  });

  // Winston logger
  app.useLogger(logger);

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('NestJS Modular Monolith API')
    .setDescription('API documentation — generated automatically from OpenAPI decorators')
    .setVersion(getAppVersion())
    .addCookieAuth(
      'better-auth.session_token', // nombre de la cookie
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'BetterAuth session cookie',
      },
      'cookieAuth', // nombre del esquema de seguridad
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'api-key',
        description: 'API Key for authentication',
      },
      'apiKeyAuth', // nombre del esquema de seguridad
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Fold the Better Auth endpoints (sign-in, sessions, magic link...) into the same reference.
  try {
    const authSchema = await (app.get(AuthService) as any).api.generateOpenAPISchema();
    mergeAuthOpenApi(document, authSchema, `${apiPrefix}/auth`);
  } catch (error) {
    logger.warn(`Better Auth OpenAPI schema not merged: ${(error as Error).message}`);
  }

  // Serve the OpenAPI spec (JSON/YAML) only outside production.
  const nonProductionEnvs = ['development', 'staging'];
  const isNonProduction = nonProductionEnvs.includes(
    configService.get<string>('NODE_ENV', 'development'),
  );

  if (isNonProduction) {
    fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
    fs.writeFileSync('./openapi.yaml', yaml.dump(document));

    app.use(`/${apiPrefix}/download/openapi.json`, (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="openapi.json"');
      res.sendFile('openapi.json', { root: process.cwd() });
    });

    app.use(`/${apiPrefix}/download/openapi.yaml`, (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/yaml');
      res.setHeader('Content-Disposition', 'attachment; filename="openapi.yaml"');
      res.sendFile('openapi.yaml', { root: process.cwd() });
    });
  }

  app.use(
    `/${apiPrefix}/docs`,
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 Application is running on: ${configService.get<string>('HOST', 'http://localhost')}:${port}/${apiPrefix}`,
  );
}

bootstrap();
