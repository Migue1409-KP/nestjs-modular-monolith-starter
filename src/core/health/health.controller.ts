import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AllowAnonymous } from '@/shared/decorators/allow-anonymous.decorator';
import { Public } from '@/shared/decorators/public.decorator';
import { ApiSuccessResponse } from '@/shared/decorators/api-success-response.decorator';
import { ApiSuccess } from '@/shared/interfaces/api-response';

interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
  database: 'up';
}

// @AllowAnonymous bypasses PolicyGuard (no session and no YAML policy entry needed);
// @Public bypasses ApiKeyGuard so load balancers and uptime probes can call it.
@AllowAnonymous()
@Public()
@Controller('health')
@ApiSecurity('apiKeyAuth')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns 200 with app uptime and DB connectivity when healthy, or 503 when the database is unreachable. Intended as the deployment healthcheck.',
  })
  @ApiSuccessResponse({
    description: 'Service is healthy.',
    example: {
      status: 'ok',
      uptime: 12345.67,
      timestamp: '2026-09-10T15:00:00.000Z',
      database: 'up',
    },
  })
  async check(): Promise<ApiSuccess<HealthStatus>> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Database is unreachable');
    }

    return {
      status: 'success',
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'up',
      },
    };
  }
}
