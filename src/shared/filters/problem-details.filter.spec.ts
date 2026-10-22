import { ProblemDetailsFilter } from './problem-details.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

function buildMockHost(url = '/api/v1/test', method = 'GET'): ArgumentsHost {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url, method, headers: { 'x-request-id': 'filter-test-id' } };

  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

describe('ProblemDetailsFilter', () => {
  let filter: ProblemDetailsFilter;

  beforeEach(() => {
    filter = new ProblemDetailsFilter();
  });

  it('should handle HttpException and return a Problem Details response', () => {
    const host = buildMockHost();
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    filter.catch(exception, host);

    const responseMock = host.switchToHttp().getResponse() as any;
    const statusFn: jest.Mock = responseMock.status;

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const jsonArg = statusFn.mock.results[0].value.json.mock.calls[0][0];
    expect(jsonArg.status).toEqual('error');
    expect(jsonArg.error.status).toEqual(HttpStatus.NOT_FOUND);
    expect(jsonArg.error.title).toEqual('NOT_FOUND');
    expect(jsonArg.requestId).toEqual('filter-test-id');
  });

  it('should handle unknown exceptions as 500 Internal Server Error', () => {
    const host = buildMockHost('/api/v1/crash', 'POST');
    const exception = new Error('Something broke');
    filter.catch(exception, host);

    const responseMock = host.switchToHttp().getResponse() as any;
    const statusFn: jest.Mock = responseMock.status;

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const jsonArg = statusFn.mock.results[0].value.json.mock.calls[0][0];
    expect(jsonArg.error.status).toEqual(500);
    expect(jsonArg.error.detail).toEqual('Something broke');
  });

  it('should not leak internal error messages in production', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const host = buildMockHost('/api/v1/crash', 'POST');
      filter.catch(new Error('syntax error at or near "SELEC"'), host);

      const responseMock = host.switchToHttp().getResponse() as any;
      const jsonArg = responseMock.status.mock.results[0].value.json.mock.calls[0][0];
      expect(jsonArg.error.status).toEqual(500);
      expect(jsonArg.error.detail).toEqual('Unexpected error');
    } finally {
      process.env.NODE_ENV = previousEnv;
    }
  });
});
