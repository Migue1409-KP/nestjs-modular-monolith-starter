import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiSuccess } from '@/shared/interfaces/api-response';
import { ParametersService } from './parameters.service';
import { Language } from './entities/languages.entity';

@Controller('parameters')
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  @Get('languages')
  @ApiOperation({
    summary: 'Get all languages',
    description:
      'Retrieves a complete list of all supported languages in the system. Used for language selection and multi-language support.',
  })
  @ApiResponse({
    status: 200,
    description: 'Languages retrieved successfully.',
    schema: {
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440000',
              },
              name: { type: 'string', example: 'English' },
              code: { type: 'string', example: 'en' },
              iso639_1: { type: 'string', example: 'en' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication credentials.',
    schema: {
      properties: {
        status: { type: 'string', example: 'error' },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
    schema: {
      properties: {
        status: { type: 'string', example: 'error' },
        message: { type: 'string', example: 'Internal server error' },
      },
    },
  })
  async getAllLanguages(): Promise<ApiSuccess<Language[]>> {
    return {
      status: 'success',
      data: await this.parametersService.findAllLanguages(),
    };
  }
}
