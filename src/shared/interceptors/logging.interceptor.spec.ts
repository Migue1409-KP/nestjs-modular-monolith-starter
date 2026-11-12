import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => logSpy.mockRestore());

  const contextFor = (request: object, response: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    }) as unknown as ExecutionContext;
  const handler: CallHandler = { handle: () => of({ ok: true }) };

  it('logs method, url, status, size, user agent and request id once the response is emitted', async () => {
    const request = {
      method: 'GET',
      url: '/api/v1/users',
      requestId: 'req-1',
      get: () => 'jest-agent',
    };
    const response = { statusCode: 200, get: () => '42' };

    await lastValueFrom(new LoggingInterceptor().intercept(contextFor(request, response), handler));

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toMatch(
      /^\[req-1\] GET \/api\/v1\/users 200 42 - jest-agent \+\d+ms$/,
    );
  });

  it('falls back to placeholders when request id, agent and length are missing', async () => {
    const request = { method: 'POST', url: '/x', get: () => undefined };
    const response = { statusCode: 201, get: () => undefined };

    await lastValueFrom(new LoggingInterceptor().intercept(contextFor(request, response), handler));

    expect(logSpy.mock.calls[0][0]).toMatch(/^\[no-request-id\] POST \/x 201 0 - {2}\+\d+ms$/);
  });
});
