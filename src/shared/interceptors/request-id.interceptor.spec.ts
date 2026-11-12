import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  const contextFor = (request: Record<string, unknown>) =>
    ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
  const handler: CallHandler = { handle: () => of('done') };

  it('attaches a UUID to the request and lets the response through', async () => {
    const request: Record<string, unknown> = {};

    const result = await lastValueFrom(
      new RequestIdInterceptor().intercept(contextFor(request), handler),
    );

    expect(result).toBe('done');
    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates a different id for every request', () => {
    const first: Record<string, unknown> = {};
    const second: Record<string, unknown> = {};
    const interceptor = new RequestIdInterceptor();

    interceptor.intercept(contextFor(first), handler);
    interceptor.intercept(contextFor(second), handler);

    expect(first.requestId).not.toBe(second.requestId);
  });
});
