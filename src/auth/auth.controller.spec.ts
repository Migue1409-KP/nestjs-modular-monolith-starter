import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const controller = new AuthController();

  it('returns the current session', async () => {
    const session = { user: { id: 'u1' } } as any;
    await expect(controller.getMe(session)).resolves.toEqual({ status: 'success', data: session });
  });

  it('returns null data when there is no session', async () => {
    await expect(controller.getMe(undefined as any)).resolves.toEqual({
      status: 'success',
      data: null,
    });
  });
});
