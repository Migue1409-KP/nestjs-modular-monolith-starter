import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserProfileBodySchema } from '../dto/create-user.dto';

describe('UsersController.createProfile', () => {
  const service = { createProfile: jest.fn().mockResolvedValue({ id: 'p1' }) };
  let controller: UsersController;

  beforeEach(async () => {
    service.createProfile.mockClear();
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('uses the session user id (not a client-supplied one)', async () => {
    const session: any = { user: { id: 'abc123NotAUuid', email: 'a@b.com' } };
    const body = { name: 'Test', authUserId: 'attacker-id' } as any;

    await controller.createProfile(session, body);

    expect(service.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ authUserId: 'abc123NotAUuid', email: 'a@b.com' }),
      true,
    );
  });
});

describe('CreateUserProfileBodySchema', () => {
  it('accepts a body without authUserId', () => {
    expect(CreateUserProfileBodySchema.safeParse({ name: 'Test' }).success).toBe(true);
  });

  it('strips authUserId if the client sends it', () => {
    const parsed = CreateUserProfileBodySchema.parse({ name: 'Test', authUserId: 'x' });
    expect(parsed).not.toHaveProperty('authUserId');
  });
});
