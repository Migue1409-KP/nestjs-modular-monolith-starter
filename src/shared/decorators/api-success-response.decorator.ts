import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

interface ApiSuccessResponseOptions {
  /** HTTP status code. Defaults to 200. */
  status?: number;
  /** Human-readable description shown in the API reference. */
  description: string;
  /** Example value for the envelope's `data` field. */
  example: unknown;
  /** Optional example value for the envelope's `meta` field (e.g. pagination). */
  meta?: unknown;
}

/**
 * Documents a successful `ApiSuccess<T>` response ({ status: 'success', data, meta? })
 * with a concrete example, so the API reference shows the actual response shape instead
 * of a bare status + description pair.
 */
export function ApiSuccessResponse(options: ApiSuccessResponseOptions) {
  const { status = 200, description, example, meta } = options;
  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          status: { type: 'string', example: 'success' },
          data: { example },
          ...(meta !== undefined ? { meta: { example: meta } } : {}),
        },
      },
    }),
  );
}
