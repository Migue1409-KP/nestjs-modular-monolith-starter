import { ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

const mockConfigService = {
  get: jest.fn(),
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

function buildContext(headers: Record<string, string> = {}): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(() => {
    guard = new ApiKeyGuard(mockConfigService as any, mockReflector as any);
    jest.clearAllMocks();
  });

  it('allows access without checking the api key when the route is public', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(buildContext())).toBe(true);
    expect(mockConfigService.get).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the api-key header is missing', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('secret-key');

    expect(() => guard.canActivate(buildContext())).toThrow('Invalid or missing API key');
  });

  it('throws UnauthorizedException when the api-key header does not match', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('secret-key');

    expect(() => guard.canActivate(buildContext({ 'api-key': 'wrong-key' }))).toThrow(
      'Invalid or missing API key',
    );
  });

  it('allows access when the api-key header matches the configured value', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('secret-key');

    expect(guard.canActivate(buildContext({ 'api-key': 'secret-key' }))).toBe(true);
  });

  it('rejects every request when API_KEY is not configured', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue(undefined);

    expect(() => guard.canActivate(buildContext({ 'api-key': 'anything' }))).toThrow(
      'Invalid or missing API key',
    );
    expect(() => guard.canActivate(buildContext({ 'api-key': '' }))).toThrow(
      'Invalid or missing API key',
    );
  });

  it('rejects a key that only shares a prefix with the configured value', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('secret-key');

    expect(() => guard.canActivate(buildContext({ 'api-key': 'secret-key-extra' }))).toThrow(
      'Invalid or missing API key',
    );
  });

  it('rejects a non-string header value', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    mockConfigService.get.mockReturnValue('secret-key');

    expect(() =>
      guard.canActivate(buildContext({ 'api-key': ['secret-key'] as unknown as string })),
    ).toThrow('Invalid or missing API key');
  });
});
